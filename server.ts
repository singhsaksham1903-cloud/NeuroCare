import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import {
  generatePersonalizedDailyPlan,
  DailyBrainPlanRecord,
} from './src/server/companionEngine';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const JWT_SECRET = process.env.JWT_SECRET_KEY || 'cognicare-secret-key-2026';

let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const dailyPlansStore: Map<string, DailyBrainPlanRecord> = new Map();

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================================
// In-Memory Data Store
// ============================================================

interface UserRecord {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role: 'elderly' | 'caregiver';
  is_active: boolean;
  created_at: string;
}

interface MemoryRecord {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category: string;
  memory_date?: string | null;
  image_data?: string | null;
  client_mutation_id?: string | null;
  created_at: string;
}

interface ReminderRecord {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category: string;
  due_datetime?: string | null;
  completed: boolean;
  client_mutation_id?: string | null;
  created_at: string;
}

interface GameSessionRecord {
  id: number;
  user_id: number;
  game: string;
  difficulty: string;
  accuracy: number;
  mistakes: number;
  time: number;
  completed: boolean;
  matches?: number | null;
  sequence_length?: number | null;
  target_count?: number | null;
  correct?: number | null;
  wrong?: number | null;
  client_session_id?: string | null;
  created_at: string;
}

interface CaregiverLinkRecord {
  id: number;
  caregiver_id: number;
  elderly_id: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

function hashPassword(password: string): string {
  return crypto.createHmac('sha256', JWT_SECRET).update(password).digest('hex');
}

// Seed Initial Data
const users: UserRecord[] = [
  {
    id: 1,
    full_name: 'Sunita Sharma',
    email: 'elderly@cognicare.com',
    password_hash: hashPassword('password123'),
    role: 'elderly',
    is_active: true,
    created_at: new Date('2025-01-15T09:00:00Z').toISOString(),
  },
  {
    id: 2,
    full_name: 'Dr. Rajesh Sharma',
    email: 'caregiver@cognicare.com',
    password_hash: hashPassword('password123'),
    role: 'caregiver',
    is_active: true,
    created_at: new Date('2025-01-15T09:00:00Z').toISOString(),
  },
];

const memories: MemoryRecord[] = [
  {
    id: 1,
    user_id: 1,
    title: "Granddaughter's Graduation Day",
    description: 'Priya graduated with first class honors in engineering. The whole family wore traditional attire and celebrated with home-made pitha and sweets.',
    category: 'Family',
    memory_date: '2024-05-15',
    image_data: null,
    client_mutation_id: 'seed-memory-1',
    created_at: new Date('2025-02-01T10:00:00Z').toISOString(),
  },
  {
    id: 2,
    user_id: 1,
    title: 'Morning Walk at Kaziranga Tea Estate',
    description: 'Enjoyed the fresh morning breeze and beautiful mist across the lush green tea bushes with my dear friends.',
    category: 'Travel',
    memory_date: '2024-11-20',
    image_data: null,
    client_mutation_id: 'seed-memory-2',
    created_at: new Date('2025-02-10T14:30:00Z').toISOString(),
  },
];

const reminders: ReminderRecord[] = [
  {
    id: 1,
    user_id: 1,
    title: 'Blood Pressure Tablet',
    description: 'Take 1 tablet with warm water after breakfast',
    category: 'Health',
    due_datetime: new Date(Date.now() + 2 * 3600000).toISOString(),
    completed: false,
    client_mutation_id: 'seed-rem-1',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    user_id: 1,
    title: 'Evening Walk & Hydration',
    description: '20-minute gentle stroll in the courtyard, drink 1 glass of water',
    category: 'Daily',
    due_datetime: new Date(Date.now() + 6 * 3600000).toISOString(),
    completed: false,
    client_mutation_id: 'seed-rem-2',
    created_at: new Date().toISOString(),
  },
];

const gameSessions: GameSessionRecord[] = [
  {
    id: 1,
    user_id: 1,
    game: 'Memory Match',
    difficulty: 'Standard',
    accuracy: 88,
    mistakes: 2,
    time: 44,
    completed: true,
    matches: 6,
    client_session_id: 'seed-game-1',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 2,
    user_id: 1,
    game: 'Sequence Memory',
    difficulty: 'Easy',
    accuracy: 92,
    mistakes: 1,
    time: 32,
    completed: true,
    sequence_length: 5,
    client_session_id: 'seed-game-2',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 3,
    user_id: 1,
    game: 'Object Recall',
    difficulty: 'Easy',
    accuracy: 85,
    mistakes: 1,
    time: 40,
    completed: true,
    target_count: 5,
    correct: 5,
    wrong: 1,
    client_session_id: 'seed-game-3',
    created_at: new Date().toISOString(),
  },
];

const caregiverLinks: CaregiverLinkRecord[] = [
  {
    id: 1,
    caregiver_id: 2,
    elderly_id: 1,
    status: 'approved',
    created_at: new Date('2025-01-20T10:00:00Z').toISOString(),
  },
];

let nextUserId = 3;
let nextMemoryId = 3;
let nextReminderId = 3;
let nextSessionId = 4;
let nextLinkId = 2;

// ============================================================
// Auth & JWT Helpers
// ============================================================

function createToken(userId: number, role: string): string {
  const payload = {
    sub: String(userId),
    role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
  };
  const b64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(b64Payload).digest('base64url');
  return `${b64Payload}.${signature}`;
}

function verifyToken(token: string): { sub: string; role: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [b64Payload, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(b64Payload).digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(b64Payload, 'base64url').toString('utf-8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

interface AuthenticatedRequest extends Request {
  user?: UserRecord;
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Invalid or expired authentication token.' });
  }

  const token = authHeader.slice(7).trim();
  const decoded = verifyToken(token);
  if (!decoded || !decoded.sub) {
    return res.status(401).json({ detail: 'Invalid or expired authentication token.' });
  }

  const user = users.find((u) => u.id === parseInt(decoded.sub, 10));
  if (!user || !user.is_active) {
    return res.status(401).json({ detail: 'User not found or inactive.' });
  }

  req.user = user;
  next();
}

// ============================================================
// Health & DB Routes
// ============================================================

app.get('/', (req, res, next) => {
  // If request accepts text/html, pass to Vite/SPA handler
  if (req.accepts('html')) {
    return next();
  }
  res.json({ message: 'Cognicare NER API is running', status: 'success' });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy' });
});

app.get('/db-health', (_req, res) => {
  res.json({ status: 'connected', database: 'cognicare' });
});

// ============================================================
// Auth Routes
// ============================================================

app.post('/auth/register', (req, res) => {
  const { full_name, email, password, role } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ detail: 'Full name, email, and password are required.' });
  }

  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ detail: 'An account with this email already exists.' });
  }

  const newUser: UserRecord = {
    id: nextUserId++,
    full_name: full_name.trim(),
    email: email.trim().toLowerCase(),
    password_hash: hashPassword(password),
    role: role === 'caregiver' ? 'caregiver' : 'elderly',
    is_active: true,
    created_at: new Date().toISOString(),
  };

  users.push(newUser);

  res.status(201).json({
    id: newUser.id,
    full_name: newUser.full_name,
    email: newUser.email,
    role: newUser.role,
    is_active: newUser.is_active,
    created_at: newUser.created_at,
  });
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ detail: 'Email and password are required.' });
  }

  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password_hash !== hashPassword(password)) {
    return res.status(401).json({ detail: 'Invalid email or password.' });
  }

  if (!user.is_active) {
    return res.status(403).json({ detail: 'User account is inactive.' });
  }

  const token = createToken(user.id, user.role);
  res.json({ access_token: token, token_type: 'bearer' });
});

app.get('/auth/me', authMiddleware, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  res.json({
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    is_active: user.is_active,
    created_at: user.created_at,
  });
});

// ============================================================
// Memories Routes
// ============================================================

function serializeMemory(m: MemoryRecord) {
  return {
    id: m.id,
    title: m.title,
    description: m.description,
    category: m.category,
    memoryDate: m.memory_date,
    imageData: m.image_data,
    clientMutationId: m.client_mutation_id,
    created_at: m.created_at,
  };
}

app.get('/memories', authMiddleware, (req: AuthenticatedRequest, res) => {
  const userMemories = memories
    .filter((m) => m.user_id === req.user!.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json({
    count: userMemories.length,
    memories: userMemories.map(serializeMemory),
  });
});

app.post('/memories', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { title, description, category, memoryDate, imageData, clientMutationId } = req.body;

  if (!title || !description) {
    return res.status(400).json({ detail: 'Title and description are required.' });
  }

  if (clientMutationId) {
    const existing = memories.find((m) => m.user_id === req.user!.id && m.client_mutation_id === clientMutationId);
    if (existing) {
      return res.status(200).json({
        message: 'Memory already saved',
        memory: serializeMemory(existing),
        idempotent: true,
      });
    }
  }

  const newMem: MemoryRecord = {
    id: nextMemoryId++,
    user_id: req.user!.id,
    title: title.trim(),
    description: description.trim(),
    category: category || 'General',
    memory_date: memoryDate || null,
    image_data: imageData || null,
    client_mutation_id: clientMutationId || null,
    created_at: new Date().toISOString(),
  };

  memories.push(newMem);

  res.status(201).json({
    message: 'Memory saved successfully',
    memory: serializeMemory(newMem),
  });
});

app.put('/memories/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const id = parseInt(req.params.id, 10);
  const mem = memories.find((m) => m.id === id && m.user_id === req.user!.id);

  if (!mem) {
    return res.status(404).json({ detail: 'Memory not found' });
  }

  const { title, description, category, memoryDate, imageData, clientMutationId } = req.body;

  if (clientMutationId && mem.client_mutation_id === clientMutationId) {
    return res.json({
      message: 'Memory update already applied',
      memory: serializeMemory(mem),
      idempotent: true,
    });
  }

  if (title !== undefined) mem.title = title.trim();
  if (description !== undefined) mem.description = description.trim();
  if (category !== undefined) mem.category = category;
  if (memoryDate !== undefined) mem.memory_date = memoryDate;
  if (imageData !== undefined) mem.image_data = imageData;
  if (clientMutationId !== undefined) mem.client_mutation_id = clientMutationId;

  res.json({
    message: 'Memory updated successfully',
    memory: serializeMemory(mem),
  });
});

app.delete('/memories/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const id = parseInt(req.params.id, 10);
  const index = memories.findIndex((m) => m.id === id && m.user_id === req.user!.id);

  if (index === -1) {
    return res.status(404).json({ detail: 'Memory not found' });
  }

  memories.splice(index, 1);
  res.json({ message: 'Memory deleted successfully' });
});

// ============================================================
// Reminders Routes
// ============================================================

function serializeReminder(r: ReminderRecord) {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    dueDatetime: r.due_datetime,
    completed: r.completed,
    clientMutationId: r.client_mutation_id,
    created_at: r.created_at,
  };
}

app.get('/reminders', authMiddleware, (req: AuthenticatedRequest, res) => {
  const userReminders = reminders
    .filter((r) => r.user_id === req.user!.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json({
    count: userReminders.length,
    reminders: userReminders.map(serializeReminder),
  });
});

app.post('/reminders', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { title, description, category, dueDatetime, completed, clientMutationId } = req.body;

  if (!title || !description) {
    return res.status(400).json({ detail: 'Title and description are required.' });
  }

  if (clientMutationId) {
    const existing = reminders.find((r) => r.user_id === req.user!.id && r.client_mutation_id === clientMutationId);
    if (existing) {
      return res.status(200).json({
        message: 'Reminder already saved',
        reminder: serializeReminder(existing),
        idempotent: true,
      });
    }
  }

  const newRem: ReminderRecord = {
    id: nextReminderId++,
    user_id: req.user!.id,
    title: title.trim(),
    description: description.trim(),
    category: category || 'General',
    due_datetime: dueDatetime || null,
    completed: Boolean(completed),
    client_mutation_id: clientMutationId || null,
    created_at: new Date().toISOString(),
  };

  reminders.push(newRem);

  res.status(201).json({
    message: 'Reminder saved successfully',
    reminder: serializeReminder(newRem),
  });
});

app.put('/reminders/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const id = parseInt(req.params.id, 10);
  const rem = reminders.find((r) => r.id === id && r.user_id === req.user!.id);

  if (!rem) {
    return res.status(404).json({ detail: 'Reminder not found' });
  }

  const { title, description, category, dueDatetime, completed, clientMutationId } = req.body;

  if (clientMutationId && rem.client_mutation_id === clientMutationId) {
    return res.json({
      message: 'Reminder update already applied',
      reminder: serializeReminder(rem),
      idempotent: true,
    });
  }

  if (title !== undefined) rem.title = title.trim();
  if (description !== undefined) rem.description = description.trim();
  if (category !== undefined) rem.category = category;
  if (dueDatetime !== undefined) rem.due_datetime = dueDatetime;
  if (completed !== undefined) rem.completed = Boolean(completed);
  if (clientMutationId !== undefined) rem.client_mutation_id = clientMutationId;

  res.json({
    message: 'Reminder updated successfully',
    reminder: serializeReminder(rem),
  });
});

app.delete('/reminders/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const id = parseInt(req.params.id, 10);
  const index = reminders.findIndex((r) => r.id === id && r.user_id === req.user!.id);

  if (index === -1) {
    return res.status(404).json({ detail: 'Reminder not found' });
  }

  reminders.splice(index, 1);
  res.json({ message: 'Reminder deleted successfully' });
});

// ============================================================
// Game Sessions Routes
// ============================================================

function serializeGameSession(item: GameSessionRecord) {
  return {
    id: item.id,
    game: item.game,
    difficulty: item.difficulty,
    accuracy: item.accuracy,
    mistakes: item.mistakes,
    time: item.time,
    completed: item.completed,
    matches: item.matches ?? null,
    sequenceLength: item.sequence_length ?? null,
    targetCount: item.target_count ?? null,
    correct: item.correct ?? null,
    wrong: item.wrong ?? null,
    clientSessionId: item.client_session_id ?? null,
    created_at: item.created_at,
  };
}

app.post('/game-sessions', authMiddleware, (req: AuthenticatedRequest, res) => {
  const {
    game,
    difficulty,
    accuracy,
    mistakes,
    time,
    completed = true,
    matches,
    sequenceLength,
    targetCount,
    correct,
    wrong,
    clientSessionId,
  } = req.body;

  if (clientSessionId) {
    const existing = gameSessions.find(
      (s) => s.user_id === req.user!.id && s.client_session_id === clientSessionId
    );
    if (existing) {
      return res.status(200).json({
        message: 'Game session already saved',
        session: serializeGameSession(existing),
        idempotent: true,
      });
    }
  }

  const newSess: GameSessionRecord = {
    id: nextSessionId++,
    user_id: req.user!.id,
    game,
    difficulty,
    accuracy: Number(accuracy) || 0,
    mistakes: Number(mistakes) || 0,
    time: Number(time) || 0,
    completed: Boolean(completed),
    matches: matches !== undefined ? Number(matches) : null,
    sequence_length: sequenceLength !== undefined ? Number(sequenceLength) : null,
    target_count: targetCount !== undefined ? Number(targetCount) : null,
    correct: correct !== undefined ? Number(correct) : null,
    wrong: wrong !== undefined ? Number(wrong) : null,
    client_session_id: clientSessionId || null,
    created_at: new Date().toISOString(),
  };

  gameSessions.push(newSess);

  // Auto-update today's daily companion plan if matching activity was played
  const todayStr = getTodayDateString();
  const planKey = `${req.user!.id}_${todayStr}`;
  const plan = dailyPlansStore.get(planKey);
  if (plan) {
    const act = plan.activities.find(
      (a) =>
        a.gameName.toLowerCase() === newSess.game.toLowerCase() ||
        (a.gameId === 'ner-cultural-recall' && newSess.game.toLowerCase().includes('cultural'))
    );
    if (act) {
      act.completed = true;
      act.completedAt = newSess.created_at;
      act.accuracy = newSess.accuracy;
      plan.completedCount = plan.activities.filter((a) => a.completed).length;
      plan.updatedAt = new Date().toISOString();
    }
  }

  res.status(201).json({
    message: 'Game session saved successfully',
    session: serializeGameSession(newSess),
  });
});

app.get('/game-sessions', authMiddleware, (req: AuthenticatedRequest, res) => {
  const sessions = gameSessions
    .filter((s) => s.user_id === req.user!.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json({
    count: sessions.length,
    sessions: sessions.map(serializeGameSession),
  });
});

// ============================================================
// Caregiver Links Routes
// ============================================================

function buildLinkResponse(link: CaregiverLinkRecord) {
  const caregiver = users.find((u) => u.id === link.caregiver_id);
  const elderly = users.find((u) => u.id === link.elderly_id);

  return {
    id: link.id,
    caregiver_id: caregiver?.id || link.caregiver_id,
    caregiver_name: caregiver?.full_name || 'Caregiver',
    caregiver_email: caregiver?.email || '',
    elderly_id: elderly?.id || link.elderly_id,
    elderly_name: elderly?.full_name || 'Elderly User',
    elderly_email: elderly?.email || '',
    status: link.status,
    created_at: link.created_at,
  };
}

app.post('/caregiver-links', authMiddleware, (req: AuthenticatedRequest, res) => {
  const current_user = req.user!;
  if (current_user.role !== 'caregiver') {
    return res.status(403).json({ detail: 'Only caregiver accounts can send link requests.' });
  }

  const { elderly_email } = req.body;
  if (!elderly_email) {
    return res.status(400).json({ detail: 'Elderly email is required.' });
  }

  const elderly = users.find((u) => u.email.toLowerCase() === elderly_email.trim().toLowerCase());
  if (!elderly) {
    return res.status(404).json({ detail: 'No elderly user was found with that email address.' });
  }

  if (elderly.role !== 'elderly') {
    return res.status(400).json({ detail: 'The selected account is not an elderly user account.' });
  }

  if (elderly.id === current_user.id) {
    return res.status(400).json({ detail: 'A user cannot link to their own account.' });
  }

  const existingLink = caregiverLinks.find(
    (l) => l.caregiver_id === current_user.id && l.elderly_id === elderly.id
  );

  if (existingLink) {
    if (existingLink.status === 'pending') {
      return res.status(409).json({ detail: 'A link request is already pending.' });
    }
    if (existingLink.status === 'approved') {
      return res.status(409).json({ detail: 'This caregiver is already linked to this elderly user.' });
    }
    existingLink.status = 'pending';
    return res.json(buildLinkResponse(existingLink));
  }

  const newLink: CaregiverLinkRecord = {
    id: nextLinkId++,
    caregiver_id: current_user.id,
    elderly_id: elderly.id,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  caregiverLinks.push(newLink);
  res.status(201).json(buildLinkResponse(newLink));
});

app.get('/caregiver-links', authMiddleware, (req: AuthenticatedRequest, res) => {
  const current_user = req.user!;
  let links: CaregiverLinkRecord[] = [];

  if (current_user.role === 'caregiver') {
    links = caregiverLinks.filter((l) => l.caregiver_id === current_user.id);
  } else if (current_user.role === 'elderly') {
    links = caregiverLinks.filter((l) => l.elderly_id === current_user.id);
  } else {
    return res.status(403).json({ detail: 'Unsupported user role.' });
  }

  links.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  res.json(links.map(buildLinkResponse));
});

app.put('/caregiver-links/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const current_user = req.user!;
  if (current_user.role !== 'elderly') {
    return res.status(403).json({ detail: 'Only elderly users can approve or reject link requests.' });
  }

  const id = parseInt(req.params.id, 10);
  const link = caregiverLinks.find((l) => l.id === id && l.elderly_id === current_user.id);

  if (!link) {
    return res.status(404).json({ detail: 'Caregiver link request not found.' });
  }

  if (link.status !== 'pending') {
    return res.status(400).json({ detail: 'This link request has already been decided.' });
  }

  const { status } = req.body;
  if (status !== 'approved' && status !== 'rejected') {
    return res.status(400).json({ detail: 'Status must be approved or rejected.' });
  }

  link.status = status;
  res.json(buildLinkResponse(link));
});

app.get('/caregiver-links/:id/data', authMiddleware, (req: AuthenticatedRequest, res) => {
  const current_user = req.user!;
  if (current_user.role !== 'caregiver') {
    return res.status(403).json({ detail: 'Only caregiver accounts can access linked elderly data.' });
  }

  const id = parseInt(req.params.id, 10);
  const link = caregiverLinks.find(
    (l) => l.id === id && l.caregiver_id === current_user.id && l.status === 'approved'
  );

  if (!link) {
    return res.status(404).json({ detail: 'Approved caregiver link not found.' });
  }

  const elderly = users.find((u) => u.id === link.elderly_id && u.role === 'elderly' && u.is_active);
  if (!elderly) {
    return res.status(404).json({ detail: 'Linked elderly user was not found.' });
  }

  const sessions = gameSessions
    .filter((s) => s.user_id === elderly.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 30);

  const elderlyMemories = memories.filter((m) => m.user_id === elderly.id);
  const elderlyReminders = reminders
    .filter((r) => r.user_id === elderly.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json({
    link: { id: link.id, status: link.status },
    elderly_user: { id: elderly.id, full_name: elderly.full_name },
    sessions: sessions.map((s) => ({
      id: s.id,
      game: s.game,
      difficulty: s.difficulty,
      accuracy: s.accuracy,
      mistakes: s.mistakes,
      time: s.time,
      created_at: s.created_at,
    })),
    memory_count: elderlyMemories.length,
    reminders: elderlyReminders.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      dueDatetime: r.due_datetime,
      completed: r.completed,
    })),
  });
});

app.delete('/caregiver-links/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const current_user = req.user!;
  const id = parseInt(req.params.id, 10);
  const index = caregiverLinks.findIndex((l) => l.id === id);

  if (index === -1) {
    return res.status(404).json({ detail: 'Caregiver link not found.' });
  }

  const link = caregiverLinks[index];
  if (link.caregiver_id !== current_user.id && link.elderly_id !== current_user.id) {
    return res.status(403).json({ detail: 'You are not allowed to remove this link.' });
  }

  caregiverLinks.splice(index, 1);
  res.json({ message: 'Caregiver link removed successfully.' });
});

// ============================================================
// Recommendation Engine (ported from Python implementation)
// ============================================================

const GAME_NAMES = ['Memory Match', 'Sequence Memory', 'Object Recall'];
const GAME_DIFFICULTIES: Record<string, string[]> = {
  'Memory Match': ['Standard'],
  'Sequence Memory': ['Easy', 'Medium', 'Hard'],
  'Object Recall': ['Easy', 'Medium', 'Hard'],
};
const DIFFICULTY_ORDER: Record<string, number> = {
  Easy: 0,
  Medium: 1,
  Hard: 2,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

function average(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

interface GameSummary {
  sessions: number;
  recent_accuracy: number;
  overall_accuracy: number;
  average_mistakes: number;
  trend: number;
  recent_time: number | null;
  time_change_percent: number;
  consistency_std: number;
  last_difficulty: string | null;
  performance_status?: string;
  priority_score?: number;
  confidence?: string;
}

function determinePerformanceStatus(summary: GameSummary): string {
  const { sessions, trend, recent_accuracy } = summary;
  if (sessions === 0) return 'New';
  if (sessions < 3) return 'Not enough data';
  if (trend >= 7 && recent_accuracy >= 70) return 'Improving';
  if (trend <= -7) return 'Declining';
  return 'Stable';
}

function calculateGameSummary(sessions: GameSessionRecord[]): GameSummary | null {
  if (!sessions.length) return null;

  const recentSessions = sessions.slice(0, 3);
  const olderSessions = sessions.slice(3, 6);

  const recentAccuracyValues = recentSessions.map((s) => Number(s.accuracy));
  const overallAccuracyValues = sessions.map((s) => Number(s.accuracy));

  const recentAccuracy = average(recentAccuracyValues) || 0;
  const overallAccuracy = average(overallAccuracyValues) || 0;
  const averageMistakes = average(recentSessions.map((s) => Number(s.mistakes))) || 0;

  let trend = 0.0;
  if (olderSessions.length) {
    const olderAccuracy = average(olderSessions.map((s) => Number(s.accuracy))) || recentAccuracy;
    trend = recentAccuracy - olderAccuracy;
  }

  const recentTimes = recentSessions.map((s) => Number(s.time)).filter((t) => t > 0);
  const olderTimes = olderSessions.map((s) => Number(s.time)).filter((t) => t > 0);
  const recentTime = recentTimes.length ? average(recentTimes) : null;
  const olderTime = olderTimes.length ? average(olderTimes) : null;

  let timeChangePercent = 0.0;
  if (recentTime !== null && olderTime !== null && olderTime > 0) {
    timeChangePercent = ((recentTime - olderTime) / olderTime) * 100;
  }

  let consistencyStd = 0.0;
  if (recentAccuracyValues.length >= 2) {
    const mean = recentAccuracy;
    const variance =
      recentAccuracyValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
      recentAccuracyValues.length;
    consistencyStd = Math.sqrt(variance);
  }

  const lastDifficulty = sessions[0].difficulty;

  return {
    sessions: sessions.length,
    recent_accuracy: Math.round(recentAccuracy * 10) / 10,
    overall_accuracy: Math.round(overallAccuracy * 10) / 10,
    average_mistakes: Math.round(averageMistakes * 10) / 10,
    trend: Math.round(trend * 10) / 10,
    recent_time: recentTime !== null ? Math.round(recentTime * 10) / 10 : null,
    time_change_percent: Math.round(timeChangePercent * 10) / 10,
    consistency_std: Math.round(consistencyStd * 10) / 10,
    last_difficulty: lastDifficulty,
  };
}

function calculatePriorityScore(summary: GameSummary): number {
  const { sessions } = summary;
  const accuracyNeed = clamp((100 - summary.recent_accuracy) / 100, 0, 1);
  const trendNeed = clamp(-summary.trend / 20, 0, 1);
  const mistakeNeed = clamp(summary.average_mistakes / 4, 0, 1);
  const timeNeed = clamp(summary.time_change_percent / 50, 0, 1);
  const experienceGap = clamp((5 - sessions) / 5, 0, 1);

  const score =
    accuracyNeed * 0.45 +
    trendNeed * 0.25 +
    mistakeNeed * 0.15 +
    timeNeed * 0.05 +
    experienceGap * 0.1;

  return Math.round(score * 10000) / 100;
}

function chooseDifficulty(game: string, summary: GameSummary): string {
  const levels = GAME_DIFFICULTIES[game] || ['Easy'];
  if (levels.length === 1) return levels[0];
  if (summary.sessions === 0) return 'Easy';

  const currentLevel = levels.includes(summary.last_difficulty || '')
    ? summary.last_difficulty!
    : 'Easy';
  const currentIndex = DIFFICULTY_ORDER[currentLevel] ?? 0;

  const strongPerformance =
    summary.recent_accuracy >= 85 && summary.trend >= -5 && summary.average_mistakes <= 1;

  const needsSupport =
    summary.recent_accuracy < 60 ||
    summary.trend <= -10 ||
    (summary.time_change_percent >= 25 && summary.recent_accuracy < 80);

  if (needsSupport) {
    return levels[Math.max(0, currentIndex - 1)];
  }
  if (strongPerformance) {
    return levels[Math.min(levels.length - 1, currentIndex + 1)];
  }
  return currentLevel;
}

function buildReason(game: string, difficulty: string, summary: GameSummary): string {
  const status = summary.performance_status;
  const accuracy = summary.recent_accuracy;
  const trend = summary.trend;
  const mistakes = summary.average_mistakes;

  if (status === 'New') {
    return `${game} has not been played yet. Starting with this activity will help Cognicare build a performance history.`;
  }
  if (status === 'Not enough data') {
    return `Your recent ${game} accuracy is ${accuracy}%. More sessions will help Cognicare personalize future activities.`;
  }
  if (status === 'Improving') {
    return `Your recent ${game} accuracy is ${accuracy}% and your performance trend is improving. The recommended level is ${difficulty}.`;
  }
  if (status === 'Declining') {
    const formattedTrend = trend > 0 ? `+${trend}` : `${trend}`;
    return `Your recent ${game} accuracy is ${accuracy}% with a recent trend of ${formattedTrend} percentage points. The recommended level is ${difficulty} to provide a more comfortable challenge.`;
  }
  return `Your recent ${game} accuracy is ${accuracy}% with about ${mistakes} mistakes per session. The recommended level is ${difficulty}.`;
}

function calculateConfidence(summary: GameSummary): string {
  if (summary.sessions < 3) return 'low';
  if (summary.sessions < 6) return 'moderate';
  return 'high';
}

app.get('/recommendation', authMiddleware, (req: AuthenticatedRequest, res) => {
  const current_user = req.user!;
  const sessions = gameSessions
    .filter((s) => s.user_id === current_user.id && s.completed && GAME_NAMES.includes(s.game))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 60);

  const grouped: Record<string, GameSessionRecord[]> = {
    'Memory Match': [],
    'Sequence Memory': [],
    'Object Recall': [],
  };

  for (const sess of sessions) {
    if (grouped[sess.game]) {
      grouped[sess.game].push(sess);
    }
  }

  const summaries: Record<string, GameSummary> = {};

  for (const game of GAME_NAMES) {
    let summary = calculateGameSummary(grouped[game]);
    if (!summary) {
      summary = {
        sessions: 0,
        recent_accuracy: 0,
        overall_accuracy: 0,
        average_mistakes: 0,
        trend: 0,
        recent_time: null,
        time_change_percent: 0,
        consistency_std: 0,
        last_difficulty: null,
      };
    }
    summary.performance_status = determinePerformanceStatus(summary);
    summary.priority_score = calculatePriorityScore(summary);
    summary.confidence = calculateConfidence(summary);
    summaries[game] = summary;
  }

  if (!sessions.length) {
    return res.json({
      recommendation: {
        game: 'Memory Match',
        difficulty: 'Standard',
        reason:
          'Start with Memory Match to begin building your personalized performance history.',
        performance_status: 'New',
      },
      based_on_sessions: 0,
      engine: 'rule-based-v3',
      personalization: 'performance-based',
      confidence: 'low',
      game_summaries: summaries,
    });
  }

  let recommendedGame = GAME_NAMES[0];
  let maxScore = -1;
  for (const game of GAME_NAMES) {
    const score = summaries[game].priority_score ?? 0;
    if (score > maxScore) {
      maxScore = score;
      recommendedGame = game;
    }
  }

  const selected = summaries[recommendedGame];
  const recommendedDifficulty = chooseDifficulty(recommendedGame, selected);
  const reason = buildReason(recommendedGame, recommendedDifficulty, selected);

  res.json({
    recommendation: {
      game: recommendedGame,
      difficulty: recommendedDifficulty,
      reason,
      performance_status: selected.performance_status,
    },
    based_on_sessions: sessions.length,
    engine: 'rule-based-v3',
    personalization: 'performance-based',
    confidence: selected.confidence,
    game_summaries: summaries,
  });
});

// ============================================================
// Cognitive Companion Routes
// ============================================================

app.get('/companion/daily-plan', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const today = getTodayDateString();
    const planKey = `${user.id}_${today}`;
    let plan = dailyPlansStore.get(planKey);

    const userMemories = memories.filter((m) => m.user_id === user.id);
    const userSess = gameSessions.filter((s) => s.user_id === user.id);

    if (!plan) {
      plan = await generatePersonalizedDailyPlan(
        user.id,
        user.full_name,
        userSess,
        userMemories,
        today,
        aiClient,
        false
      );
      dailyPlansStore.set(planKey, plan);
    } else {
      // Sync any newly completed games from gameSessions today
      const completedToday = userSess.filter((s) => {
        const sDate = new Date(s.created_at).toISOString().split('T')[0];
        return sDate === today && s.completed;
      });

      for (const act of plan.activities) {
        const match = completedToday.find(
          (s) =>
            s.game.toLowerCase() === act.gameName.toLowerCase() ||
            (act.gameId === 'ner-cultural-recall' && s.game.toLowerCase().includes('cultural'))
        );
        if (match) {
          act.completed = true;
          act.completedAt = match.created_at;
          act.accuracy = match.accuracy;
        }
      }
      plan.completedCount = plan.activities.filter((a) => a.completed).length;
    }

    res.json(plan);
  } catch (error) {
    console.error('[Companion] Error getting daily plan:', error);
    res.status(500).json({ detail: 'Could not load daily plan.' });
  }
});

app.post('/companion/daily-plan/refresh', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const today = getTodayDateString();
    const planKey = `${user.id}_${today}`;
    const existingPlan = dailyPlansStore.get(planKey);

    const userMemories = memories.filter((m) => m.user_id === user.id);
    const userSess = gameSessions.filter((s) => s.user_id === user.id);

    const freshPlan = await generatePersonalizedDailyPlan(
      user.id,
      user.full_name,
      userSess,
      userMemories,
      today,
      aiClient,
      true
    );

    // Retain completed status for any activities already finished today
    if (existingPlan) {
      for (const freshAct of freshPlan.activities) {
        const prevMatch = existingPlan.activities.find(
          (a) => a.gameId === freshAct.gameId && a.completed
        );
        if (prevMatch) {
          freshAct.completed = true;
          freshAct.completedAt = prevMatch.completedAt;
          freshAct.accuracy = prevMatch.accuracy;
        }
      }
      freshPlan.completedCount = freshPlan.activities.filter((a) => a.completed).length;
    }

    dailyPlansStore.set(planKey, freshPlan);
    res.json(freshPlan);
  } catch (error) {
    console.error('[Companion] Error refreshing daily plan:', error);
    res.status(500).json({ detail: 'Could not refresh daily plan.' });
  }
});

app.post('/companion/daily-plan/complete', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { gameId } = req.body;
  if (!gameId) {
    return res.status(400).json({ detail: 'gameId is required.' });
  }

  const today = getTodayDateString();
  const planKey = `${req.user!.id}_${today}`;
  const plan = dailyPlansStore.get(planKey);

  if (!plan) {
    return res.status(404).json({ detail: 'No daily plan found for today.' });
  }

  const act = plan.activities.find((a) => a.gameId === gameId || a.id === gameId);
  if (act) {
    act.completed = true;
    act.completedAt = new Date().toISOString();
    plan.completedCount = plan.activities.filter((a) => a.completed).length;
    plan.updatedAt = new Date().toISOString();
  }

  res.json({ success: true, plan });
});

app.get('/companion/caregiver-summary/:elderlyId', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const current_user = req.user!;
  if (current_user.role !== 'caregiver') {
    return res.status(403).json({ detail: 'Only caregiver accounts can access linked elderly companion summaries.' });
  }

  const targetElderlyId = parseInt(req.params.elderlyId, 10);
  const approvedLink = caregiverLinks.find(
    (l) => l.caregiver_id === current_user.id && l.elderly_id === targetElderlyId && l.status === 'approved'
  );

  if (!approvedLink) {
    return res.status(403).json({ detail: 'You do not have an approved connection to this elderly user.' });
  }

  const elderlyUser = users.find((u) => u.id === targetElderlyId && u.is_active && u.role === 'elderly');
  if (!elderlyUser) {
    return res.status(404).json({ detail: 'Linked elderly user not found.' });
  }

  const today = getTodayDateString();
  const planKey = `${targetElderlyId}_${today}`;
  let plan = dailyPlansStore.get(planKey);

  const elderlyMemories = memories.filter((m) => m.user_id === targetElderlyId);
  const elderlySess = gameSessions.filter((s) => s.user_id === targetElderlyId);

  if (!plan) {
    plan = await generatePersonalizedDailyPlan(
      elderlyUser.id,
      elderlyUser.full_name,
      elderlySess,
      elderlyMemories,
      today,
      aiClient,
      false
    );
    dailyPlansStore.set(planKey, plan);
  }

  const recentSess = elderlySess.slice(0, 5);
  const avgAcc = recentSess.length
    ? Math.round(recentSess.reduce((sum, s) => sum + s.accuracy, 0) / recentSess.length)
    : null;

  res.json({
    elderly_user: {
      id: elderlyUser.id,
      full_name: elderlyUser.full_name,
      email: elderlyUser.email,
    },
    today_plan: plan,
    completion_summary: {
      completed: plan.completedCount,
      total: plan.totalCount,
      percent: Math.round((plan.completedCount / plan.totalCount) * 100),
    },
    recent_trends: {
      totalSessions: elderlySess.length,
      recentAccuracy: avgAcc,
      lastPlayedAt: elderlySess[0]?.created_at || null,
    },
    caregiver_guidance: {
      observation: `${elderlyUser.full_name} has completed ${plan.completedCount} of ${plan.totalCount} brain wellness exercises today.`,
      suggestion: 'Encourage gentle practice at a relaxed pace. Offer reassuring words and celebrate every completed milestone.',
    },
  });
});

// ============================================================
// Static Serving / Vite Dev Middleware
// ============================================================

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cognicare server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
