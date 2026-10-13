import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'cognicare-ner-secret-key-2026';
const PORT = Number(process.env.PORT) || 3000;

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// ============================================================
// In-Memory Data Models & Seed Data
// ============================================================

interface UserRecord {
  id: number;
  full_name: string;
  email: string;
  hashed_password: string;
  role: string;
  is_active: boolean;
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

interface MemoryRecord {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category: string;
  memory_date: string | null;
  image_data: string | null;
  client_mutation_id?: string | null;
  created_at: string;
}

interface ReminderRecord {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category: string;
  due_datetime: string | null;
  completed: boolean;
  client_mutation_id?: string | null;
  created_at: string;
}

interface CaregiverLinkRecord {
  id: number;
  caregiver_id: number;
  elderly_id: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

// Global In-Memory Stores
let nextUserId = 3;
let nextSessionId = 30;
let nextMemoryId = 5;
let nextReminderId = 5;
let nextLinkId = 2;

const users: UserRecord[] = [
  {
    id: 1,
    full_name: 'Grandma Meera',
    email: 'elderly@cognicare.com',
    hashed_password: bcrypt.hashSync('password123', 10),
    role: 'elderly',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 2,
    full_name: 'Dr. Ananya Sharma',
    email: 'caregiver@cognicare.com',
    hashed_password: bcrypt.hashSync('password123', 10),
    role: 'caregiver',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
];

const caregiverLinks: CaregiverLinkRecord[] = [
  {
    id: 1,
    caregiver_id: 2,
    elderly_id: 1,
    status: 'approved',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
];

const gameSessions: GameSessionRecord[] = [
  {
    id: 1,
    user_id: 1,
    game: 'NER Cultural Recall',
    difficulty: 'Easy',
    accuracy: 95,
    mistakes: 0,
    time: 38,
    completed: true,
    correct: 5,
    wrong: 0,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 2,
    user_id: 1,
    game: 'Object Recall',
    difficulty: 'Easy',
    accuracy: 85,
    mistakes: 1,
    time: 51,
    completed: true,
    target_count: 5,
    correct: 4,
    wrong: 1,
    created_at: new Date(Date.now() - 1 * 86400000 - 3600000).toISOString(),
  },
  {
    id: 3,
    user_id: 1,
    game: 'Memory Match',
    difficulty: 'Standard',
    accuracy: 92,
    mistakes: 1,
    time: 44,
    completed: true,
    matches: 6,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 4,
    user_id: 1,
    game: 'Sequence Memory',
    difficulty: 'Medium',
    accuracy: 88,
    mistakes: 1,
    time: 52,
    completed: true,
    sequence_length: 5,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 5,
    user_id: 1,
    game: 'NER Cultural Recall',
    difficulty: 'Easy',
    accuracy: 94,
    mistakes: 0,
    time: 40,
    completed: true,
    correct: 5,
    wrong: 0,
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 6,
    user_id: 1,
    game: 'Object Recall',
    difficulty: 'Easy',
    accuracy: 82,
    mistakes: 1,
    time: 55,
    completed: true,
    target_count: 5,
    correct: 4,
    wrong: 1,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 7,
    user_id: 1,
    game: 'Memory Match',
    difficulty: 'Standard',
    accuracy: 90,
    mistakes: 1,
    time: 46,
    completed: true,
    matches: 6,
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 8,
    user_id: 1,
    game: 'Sequence Memory',
    difficulty: 'Medium',
    accuracy: 86,
    mistakes: 1,
    time: 54,
    completed: true,
    sequence_length: 5,
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 9,
    user_id: 1,
    game: 'NER Cultural Recall',
    difficulty: 'Easy',
    accuracy: 92,
    mistakes: 1,
    time: 42,
    completed: true,
    correct: 5,
    wrong: 1,
    created_at: new Date(Date.now() - 9 * 86400000).toISOString(),
  },
  {
    id: 10,
    user_id: 1,
    game: 'Memory Match',
    difficulty: 'Standard',
    accuracy: 88,
    mistakes: 1,
    time: 47,
    completed: true,
    matches: 6,
    created_at: new Date(Date.now() - 11 * 86400000).toISOString(),
  },
  {
    id: 11,
    user_id: 1,
    game: 'Object Recall',
    difficulty: 'Easy',
    accuracy: 80,
    mistakes: 2,
    time: 59,
    completed: true,
    target_count: 5,
    correct: 4,
    wrong: 1,
    created_at: new Date(Date.now() - 13 * 86400000).toISOString(),
  },
  {
    id: 12,
    user_id: 1,
    game: 'Sequence Memory',
    difficulty: 'Medium',
    accuracy: 85,
    mistakes: 2,
    time: 56,
    completed: true,
    sequence_length: 4,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 13,
    user_id: 1,
    game: 'NER Cultural Recall',
    difficulty: 'Easy',
    accuracy: 90,
    mistakes: 1,
    time: 44,
    completed: true,
    correct: 5,
    wrong: 1,
    created_at: new Date(Date.now() - 17 * 86400000).toISOString(),
  },
  {
    id: 14,
    user_id: 1,
    game: 'Memory Match',
    difficulty: 'Standard',
    accuracy: 86,
    mistakes: 1,
    time: 49,
    completed: true,
    matches: 6,
    created_at: new Date(Date.now() - 19 * 86400000).toISOString(),
  },
  {
    id: 15,
    user_id: 1,
    game: 'Object Recall',
    difficulty: 'Easy',
    accuracy: 78,
    mistakes: 2,
    time: 64,
    completed: true,
    target_count: 5,
    correct: 4,
    wrong: 2,
    created_at: new Date(Date.now() - 21 * 86400000).toISOString(),
  },
  {
    id: 16,
    user_id: 1,
    game: 'Sequence Memory',
    difficulty: 'Easy',
    accuracy: 82,
    mistakes: 2,
    time: 58,
    completed: true,
    sequence_length: 4,
    created_at: new Date(Date.now() - 23 * 86400000).toISOString(),
  },
  {
    id: 17,
    user_id: 1,
    game: 'NER Cultural Recall',
    difficulty: 'Easy',
    accuracy: 88,
    mistakes: 1,
    time: 48,
    completed: true,
    correct: 4,
    wrong: 1,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 18,
    user_id: 1,
    game: 'Memory Match',
    difficulty: 'Standard',
    accuracy: 85,
    mistakes: 2,
    time: 52,
    completed: true,
    matches: 6,
    created_at: new Date(Date.now() - 28 * 86400000).toISOString(),
  },
  {
    id: 19,
    user_id: 1,
    game: 'Object Recall',
    difficulty: 'Easy',
    accuracy: 75,
    mistakes: 3,
    time: 68,
    completed: true,
    target_count: 5,
    correct: 3,
    wrong: 2,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 20,
    user_id: 1,
    game: 'Sequence Memory',
    difficulty: 'Easy',
    accuracy: 80,
    mistakes: 2,
    time: 62,
    completed: true,
    sequence_length: 4,
    created_at: new Date(Date.now() - 32 * 86400000).toISOString(),
  },
  {
    id: 21,
    user_id: 1,
    game: 'Memory Match',
    difficulty: 'Standard',
    accuracy: 83,
    mistakes: 2,
    time: 54,
    completed: true,
    matches: 6,
    created_at: new Date(Date.now() - 34 * 86400000).toISOString(),
  },
];

const memories: MemoryRecord[] = [
  {
    id: 1,
    user_id: 1,
    title: 'Family Trip to Shillong',
    description: 'We visited the beautiful hills and tea gardens together with Priya and Rohan in 1985.',
    category: 'Travel',
    memory_date: '1985-05-15',
    image_data: null,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 2,
    user_id: 1,
    title: 'Diwali in Jaipur',
    description: 'Lighting clay diyas and making fresh besan laddus with my mother.',
    category: 'Celebration',
    memory_date: '1992-11-04',
    image_data: null,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 3,
    user_id: 1,
    title: 'Our Home Garden Tulsi',
    description: 'Planting sacred Tulsi and jasmine flowers in the verandah.',
    category: 'Home',
    memory_date: '2005-08-10',
    image_data: null,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

const reminders: ReminderRecord[] = [
  {
    id: 1,
    user_id: 1,
    title: 'Morning Blood Pressure Medicine',
    description: 'Take 1 tablet of Telmisartan with a warm glass of water after breakfast.',
    category: 'Medicine',
    due_datetime: new Date(Date.now() + 4 * 3600000).toISOString(),
    completed: false,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 2,
    user_id: 1,
    title: 'Gentle Evening Walk in the Courtyard',
    description: '15 minutes of slow walking and deep breathing fresh air.',
    category: 'Exercise',
    due_datetime: new Date(Date.now() + 10 * 3600000).toISOString(),
    completed: false,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 3,
    user_id: 1,
    title: 'Drink Herbal Warm Tea',
    description: 'Ginger and tulsi tea to soothe the throat.',
    category: 'Health',
    due_datetime: new Date(Date.now() - 2 * 3600000).toISOString(),
    completed: true,
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
];

// ============================================================
// Auth Helpers & Middleware
// ============================================================

interface AuthRequest extends Request {
  user?: UserRecord;
}

function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ detail: 'Missing authentication token.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err || !decoded?.user_id) {
      return res.status(401).json({ detail: 'Invalid or expired token.' });
    }

    const user = users.find((u) => u.id === decoded.user_id);
    if (!user || !user.is_active) {
      return res.status(401).json({ detail: 'User not found or inactive.' });
    }

    req.user = user;
    next();
  });
}

// ============================================================
// Health Endpoints
// ============================================================

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.get('/db-health', (req, res) => {
  res.json({ status: 'connected', database: 'cognicare-in-memory' });
});

app.get('/api-status', (req, res) => {
  res.json({
    message: 'Cognicare NER API is running',
    status: 'success',
  });
});

// ============================================================
// Auth Endpoints (/auth)
// ============================================================

app.post('/auth/register', (req, res) => {
  const { full_name, email, password, role } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({ detail: 'Full name, email and password are required.' });
  }

  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ detail: 'An account with this email already exists.' });
  }

  const newUser: UserRecord = {
    id: nextUserId++,
    full_name,
    email: email.toLowerCase(),
    hashed_password: bcrypt.hashSync(password, 10),
    role: role || 'elderly',
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
  if (!user) {
    return res.status(401).json({ detail: 'Invalid email or password.' });
  }

  const isMatch = bcrypt.compareSync(password, user.hashed_password);
  if (!isMatch) {
    return res.status(401).json({ detail: 'Invalid email or password.' });
  }

  if (!user.is_active) {
    return res.status(403).json({ detail: 'User account is inactive.' });
  }

  const token = jwt.sign(
    {
      user_id: user.id,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({
    access_token: token,
    token_type: 'bearer',
  });
});

app.get('/auth/me', authenticateToken, (req: AuthRequest, res) => {
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
// Game Sessions Endpoints (/game-sessions)
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

app.post('/game-sessions', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const sessionData = req.body;

  if (sessionData.clientSessionId) {
    const existing = gameSessions.find(
      (s) => s.user_id === user.id && s.client_session_id === sessionData.clientSessionId
    );
    if (existing) {
      return res.json({
        message: 'Game session already saved',
        session: serializeGameSession(existing),
        idempotent: true,
      });
    }
  }

  const newSession: GameSessionRecord = {
    id: nextSessionId++,
    user_id: user.id,
    game: sessionData.game || 'Cognitive Activity',
    difficulty: sessionData.difficulty || 'Easy',
    accuracy: Number(sessionData.accuracy) || 0,
    mistakes: Number(sessionData.mistakes) || 0,
    time: Number(sessionData.time) || 0,
    completed: sessionData.completed ?? true,
    matches: sessionData.matches ?? null,
    sequence_length: sessionData.sequenceLength ?? null,
    target_count: sessionData.targetCount ?? null,
    correct: sessionData.correct ?? null,
    wrong: sessionData.wrong ?? null,
    client_session_id: sessionData.clientSessionId ?? null,
    created_at: new Date().toISOString(),
  };

  gameSessions.unshift(newSession);

  res.status(201).json({
    message: 'Game session saved successfully',
    session: serializeGameSession(newSession),
  });
});

app.get('/game-sessions', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const userSessions = gameSessions
    .filter((s) => s.user_id === user.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json({
    count: userSessions.length,
    sessions: userSessions.map(serializeGameSession),
  });
});

// ============================================================
// Memories Endpoints (/memories)
// ============================================================

function serializeMemory(item: MemoryRecord) {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    category: item.category,
    memoryDate: item.memory_date,
    imageData: item.image_data,
    clientMutationId: item.client_mutation_id ?? null,
    created_at: item.created_at,
  };
}

app.post('/memories', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const { title, description, category, memoryDate, imageData, clientMutationId } = req.body;

  if (clientMutationId) {
    const existing = memories.find(
      (m) => m.user_id === user.id && m.client_mutation_id === clientMutationId
    );
    if (existing) {
      return res.json({
        message: 'Memory already saved',
        memory: serializeMemory(existing),
        idempotent: true,
      });
    }
  }

  const newMemory: MemoryRecord = {
    id: nextMemoryId++,
    user_id: user.id,
    title: title || 'Untitled Memory',
    description: description || '',
    category: category || 'General',
    memory_date: memoryDate || null,
    image_data: imageData || null,
    client_mutation_id: clientMutationId || null,
    created_at: new Date().toISOString(),
  };

  memories.unshift(newMemory);

  res.status(201).json({
    message: 'Memory saved successfully',
    memory: serializeMemory(newMemory),
  });
});

app.get('/memories', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const userMemories = memories
    .filter((m) => m.user_id === user.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json({
    count: userMemories.length,
    memories: userMemories.map(serializeMemory),
  });
});

app.put('/memories/:id', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const memoryId = Number(req.params.id);
  const memory = memories.find((m) => m.id === memoryId && m.user_id === user.id);

  if (!memory) {
    return res.status(404).json({ detail: 'Memory not found' });
  }

  const { title, description, category, memoryDate, imageData, clientMutationId } = req.body;

  if (clientMutationId && memory.client_mutation_id === clientMutationId) {
    return res.json({
      message: 'Memory update already applied',
      memory: serializeMemory(memory),
      idempotent: true,
    });
  }

  if (title !== undefined) memory.title = title;
  if (description !== undefined) memory.description = description;
  if (category !== undefined) memory.category = category;
  if (memoryDate !== undefined) memory.memory_date = memoryDate;
  if (imageData !== undefined) memory.image_data = imageData;
  if (clientMutationId !== undefined) memory.client_mutation_id = clientMutationId;

  res.json({
    message: 'Memory updated successfully',
    memory: serializeMemory(memory),
  });
});

app.delete('/memories/:id', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const memoryId = Number(req.params.id);
  const index = memories.findIndex((m) => m.id === memoryId && m.user_id === user.id);

  if (index === -1) {
    return res.status(404).json({ detail: 'Memory not found' });
  }

  memories.splice(index, 1);
  res.json({ message: 'Memory deleted successfully' });
});

// ============================================================
// Reminders Endpoints (/reminders)
// ============================================================

function serializeReminder(item: ReminderRecord) {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    category: item.category,
    dueDatetime: item.due_datetime,
    completed: item.completed,
    clientMutationId: item.client_mutation_id ?? null,
    created_at: item.created_at,
  };
}

app.post('/reminders', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const { title, description, category, dueDatetime, completed, clientMutationId } = req.body;

  if (clientMutationId) {
    const existing = reminders.find(
      (r) => r.user_id === user.id && r.client_mutation_id === clientMutationId
    );
    if (existing) {
      return res.json({
        message: 'Reminder already saved',
        reminder: serializeReminder(existing),
        idempotent: true,
      });
    }
  }

  const newReminder: ReminderRecord = {
    id: nextReminderId++,
    user_id: user.id,
    title: title || 'Untitled Reminder',
    description: description || '',
    category: category || 'General',
    due_datetime: dueDatetime || null,
    completed: completed ?? false,
    client_mutation_id: clientMutationId || null,
    created_at: new Date().toISOString(),
  };

  reminders.unshift(newReminder);

  res.status(201).json({
    message: 'Reminder saved successfully',
    reminder: serializeReminder(newReminder),
  });
});

app.get('/reminders', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const userReminders = reminders
    .filter((r) => r.user_id === user.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json({
    count: userReminders.length,
    reminders: userReminders.map(serializeReminder),
  });
});

app.put('/reminders/:id', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const reminderId = Number(req.params.id);
  const reminder = reminders.find((r) => r.id === reminderId && r.user_id === user.id);

  if (!reminder) {
    return res.status(404).json({ detail: 'Reminder not found' });
  }

  const { title, description, category, dueDatetime, completed, clientMutationId } = req.body;

  if (clientMutationId && reminder.client_mutation_id === clientMutationId) {
    return res.json({
      message: 'Reminder update already applied',
      reminder: serializeReminder(reminder),
      idempotent: true,
    });
  }

  if (title !== undefined) reminder.title = title;
  if (description !== undefined) reminder.description = description;
  if (category !== undefined) reminder.category = category;
  if (dueDatetime !== undefined) reminder.due_datetime = dueDatetime;
  if (completed !== undefined) reminder.completed = completed;
  if (clientMutationId !== undefined) reminder.client_mutation_id = clientMutationId;

  res.json({
    message: 'Reminder updated successfully',
    reminder: serializeReminder(reminder),
  });
});

app.delete('/reminders/:id', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const reminderId = Number(req.params.id);
  const index = reminders.findIndex((r) => r.id === reminderId && r.user_id === user.id);

  if (index === -1) {
    return res.status(404).json({ detail: 'Reminder not found' });
  }

  reminders.splice(index, 1);
  res.json({ message: 'Reminder deleted successfully' });
});

// ============================================================
// Caregiver Links Endpoints (/caregiver-links)
// ============================================================

function buildLinkResponse(link: CaregiverLinkRecord) {
  const caregiver = users.find((u) => u.id === link.caregiver_id);
  const elderly = users.find((u) => u.id === link.elderly_id);

  return {
    id: link.id,
    caregiver_id: caregiver?.id ?? link.caregiver_id,
    caregiver_name: caregiver?.full_name ?? 'Unknown Caregiver',
    caregiver_email: caregiver?.email ?? '',
    elderly_id: elderly?.id ?? link.elderly_id,
    elderly_name: elderly?.full_name ?? 'Unknown Elderly',
    elderly_email: elderly?.email ?? '',
    status: link.status,
    created_at: link.created_at,
  };
}

app.post('/caregiver-links', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;

  if (user.role !== 'caregiver') {
    return res.status(403).json({ detail: 'Only caregiver accounts can send link requests.' });
  }

  const { elderly_email } = req.body;
  if (!elderly_email) {
    return res.status(400).json({ detail: 'Elderly email is required.' });
  }

  const elderly = users.find((u) => u.email.toLowerCase() === elderly_email.toLowerCase());
  if (!elderly) {
    return res.status(404).json({ detail: 'No elderly user was found with that email address.' });
  }

  if (elderly.role !== 'elderly') {
    return res.status(400).json({ detail: 'The selected account is not an elderly user account.' });
  }

  if (elderly.id === user.id) {
    return res.status(400).json({ detail: 'A user cannot link to their own account.' });
  }

  const existing = caregiverLinks.find(
    (l) => l.caregiver_id === user.id && l.elderly_id === elderly.id
  );

  if (existing) {
    if (existing.status === 'pending') {
      return res.status(409).json({ detail: 'A link request is already pending.' });
    }
    if (existing.status === 'approved') {
      return res.status(409).json({ detail: 'This caregiver is already linked to this elderly user.' });
    }
    existing.status = 'pending';
    return res.json(buildLinkResponse(existing));
  }

  const newLink: CaregiverLinkRecord = {
    id: nextLinkId++,
    caregiver_id: user.id,
    elderly_id: elderly.id,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  caregiverLinks.push(newLink);
  res.status(201).json(buildLinkResponse(newLink));
});

app.get('/caregiver-links', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;

  let links: CaregiverLinkRecord[] = [];
  if (user.role === 'caregiver') {
    links = caregiverLinks.filter((l) => l.caregiver_id === user.id);
  } else if (user.role === 'elderly') {
    links = caregiverLinks.filter((l) => l.elderly_id === user.id);
  } else {
    return res.status(403).json({ detail: 'Unsupported user role.' });
  }

  links.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  res.json(links.map(buildLinkResponse));
});

app.put('/caregiver-links/:id', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  if (user.role !== 'elderly') {
    return res.status(403).json({ detail: 'Only elderly users can approve or reject link requests.' });
  }

  const linkId = Number(req.params.id);
  const link = caregiverLinks.find((l) => l.id === linkId && l.elderly_id === user.id);

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

app.get('/caregiver-links/:id/data', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  if (user.role !== 'caregiver') {
    return res.status(403).json({ detail: 'Only caregiver accounts can access linked elderly data.' });
  }

  const linkId = Number(req.params.id);
  const link = caregiverLinks.find(
    (l) => l.id === linkId && l.caregiver_id === user.id && l.status === 'approved'
  );

  if (!link) {
    return res.status(404).json({ detail: 'Approved caregiver link not found.' });
  }

  const elderly = users.find((u) => u.id === link.elderly_id && u.is_active);
  if (!elderly) {
    return res.status(404).json({ detail: 'Linked elderly user was not found.' });
  }

  const sessions = gameSessions
    .filter((s) => s.user_id === elderly.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 30)
    .map((s) => ({
      id: s.id,
      game: s.game,
      difficulty: s.difficulty,
      accuracy: s.accuracy,
      mistakes: s.mistakes,
      time: s.time,
      created_at: s.created_at,
    }));

  const memory_count = memories.filter((m) => m.user_id === elderly.id).length;

  const remindersData = reminders
    .filter((r) => r.user_id === elderly.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      dueDatetime: r.due_datetime,
      completed: r.completed,
    }));

  res.json({
    link: { id: link.id, status: link.status },
    elderly_user: { id: elderly.id, full_name: elderly.full_name },
    sessions,
    memory_count,
    reminders: remindersData,
  });
});

app.delete('/caregiver-links/:id', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const linkId = Number(req.params.id);
  const index = caregiverLinks.findIndex((l) => l.id === linkId);

  if (index === -1) {
    return res.status(404).json({ detail: 'Caregiver link not found.' });
  }

  const link = caregiverLinks[index];
  if (link.caregiver_id !== user.id && link.elderly_id !== user.id) {
    return res.status(403).json({ detail: 'You are not allowed to remove this link.' });
  }

  caregiverLinks.splice(index, 1);
  res.json({ message: 'Caregiver link removed successfully.' });
});

// ============================================================
// Cognitive Progress Insights Engine & Endpoints
// ============================================================

function calculateCognitiveProgressInsights(
  userId: number,
  period: string = '30d',
  gameFilter?: string,
  difficultyFilter?: string
) {
  const now = Date.now();
  let daysLimit = 30;
  if (period === '7d') daysLimit = 7;
  else if (period === '90d') daysLimit = 90;
  else if (period === 'all') daysLimit = 3650;

  const cutoffTime = now - daysLimit * 86400000;

  // Filter completed sessions for this user, sorted chronologically
  let userSessions = gameSessions
    .filter((s) => s.user_id === userId && s.completed)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  if (gameFilter && gameFilter !== 'all') {
    userSessions = userSessions.filter((s) => s.game === gameFilter);
  }

  if (difficultyFilter && difficultyFilter !== 'all') {
    userSessions = userSessions.filter((s) => s.difficulty === difficultyFilter);
  }

  // Filter for the selected period
  const periodSessions = userSessions.filter(
    (s) => new Date(s.created_at).getTime() >= cutoffTime
  );

  // Overall metrics in period
  const totalCompleted = periodSessions.length;
  const avgAccuracy = totalCompleted
    ? Math.round(
        (periodSessions.reduce((acc, s) => acc + Number(s.accuracy || 0), 0) / totalCompleted) * 10
      ) / 10
    : 0;

  const avgMistakes = totalCompleted
    ? Math.round(
        (periodSessions.reduce((acc, s) => acc + Number(s.mistakes || 0), 0) / totalCompleted) * 10
      ) / 10
    : 0;

  const validTimes = periodSessions.filter((s) => Number(s.time) > 0);
  const avgTime = validTimes.length
    ? Math.round(
        validTimes.reduce((acc, s) => acc + Number(s.time), 0) / validTimes.length
      )
    : 0;

  // Most played game
  const gameCounts: Record<string, number> = {};
  for (const s of periodSessions) {
    gameCounts[s.game] = (gameCounts[s.game] || 0) + 1;
  }
  let mostPlayedGame = 'None';
  let maxCount = 0;
  for (const [g, count] of Object.entries(gameCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostPlayedGame = g;
    }
  }

  // Participation metrics
  const activeDates = new Set(
    periodSessions.map((s) => new Date(s.created_at).toISOString().split('T')[0])
  );
  const activeDaysCount = activeDates.size;
  const daysInPeriod = Math.min(
    daysLimit,
    Math.max(
      1,
      userSessions.length > 0
        ? Math.round((now - new Date(userSessions[0].created_at).getTime()) / 86400000)
        : 1
    )
  );
  const daysWithoutActivity = Math.max(0, daysInPeriod - activeDaysCount);
  const weeksCount = Math.max(1, daysLimit / 7);
  const sessionsPerWeek = Math.round((totalCompleted / weeksCount) * 10) / 10;

  // ----------------------------------------------------------
  // Personal Baseline vs Recent Performance
  // ----------------------------------------------------------
  const MIN_BASELINE_SESSIONS = 3;
  const MIN_RECENT_SESSIONS = 2;
  const MIN_TOTAL_FOR_BASELINE = MIN_BASELINE_SESSIONS + MIN_RECENT_SESSIONS; // 5

  let baselineComparison: any = {
    isReliable: false,
    reason: `Establishing a personal baseline requires at least ${MIN_TOTAL_FOR_BASELINE} completed sessions.`,
    minSessionsRequired: MIN_TOTAL_FOR_BASELINE,
    baselineSessionsCount: 0,
    recentSessionsCount: 0,
    baselineAccuracy: 0,
    recentAccuracy: 0,
    accuracyDiff: 0,
    accuracyStatus: 'insufficient_data',
    baselineMistakes: 0,
    recentMistakes: 0,
    mistakesDiff: 0,
    mistakesStatus: 'insufficient_data',
    baselineTime: 0,
    recentTime: 0,
    timeDiff: 0,
    timeStatus: 'insufficient_data',
    overallStatus: 'insufficient_data',
    evidenceText: 'Keep playing cognitive activities to build your personal baseline.',
  };

  if (periodSessions.length >= MIN_TOTAL_FOR_BASELINE) {
    const recentCount = Math.min(
      5,
      Math.max(MIN_RECENT_SESSIONS, Math.floor(periodSessions.length * 0.35))
    );
    const baselineSessions = periodSessions.slice(0, periodSessions.length - recentCount);
    const recentSessions = periodSessions.slice(periodSessions.length - recentCount);

    const bAcc =
      Math.round(
        (baselineSessions.reduce((acc, s) => acc + Number(s.accuracy), 0) /
          baselineSessions.length) *
          10
      ) / 10;
    const rAcc =
      Math.round(
        (recentSessions.reduce((acc, s) => acc + Number(s.accuracy), 0) /
          recentSessions.length) *
          10
      ) / 10;
    const accDiff = Math.round((rAcc - bAcc) * 10) / 10;

    const bMis =
      Math.round(
        (baselineSessions.reduce((acc, s) => acc + Number(s.mistakes), 0) /
          baselineSessions.length) *
          10
      ) / 10;
    const rMis =
      Math.round(
        (recentSessions.reduce((acc, s) => acc + Number(s.mistakes), 0) /
          recentSessions.length) *
          10
      ) / 10;
    const misDiff = Math.round((rMis - bMis) * 10) / 10;

    const bTimes = baselineSessions.filter((s) => Number(s.time) > 0);
    const rTimes = recentSessions.filter((s) => Number(s.time) > 0);
    const bTime = bTimes.length
      ? Math.round(bTimes.reduce((acc, s) => acc + Number(s.time), 0) / bTimes.length)
      : 0;
    const rTime = rTimes.length
      ? Math.round(rTimes.reduce((acc, s) => acc + Number(s.time), 0) / rTimes.length)
      : 0;
    const timeDiff = rTime - bTime;

    let overallStatus = 'broadly_stable';
    if (accDiff >= 4.0) overallStatus = 'improving';
    else if (accDiff <= -4.0) overallStatus = 'declining';

    let accuracyStatus = 'stable';
    if (accDiff >= 4.0) accuracyStatus = 'improving';
    else if (accDiff <= -4.0) accuracyStatus = 'declining';

    let mistakesStatus = 'stable';
    if (misDiff <= -0.5) mistakesStatus = 'improving';
    else if (misDiff >= 0.5) mistakesStatus = 'increasing';

    let timeStatus = 'stable';
    if (timeDiff <= -4) timeStatus = 'faster';
    else if (timeDiff >= 4) timeStatus = 'slower';

    baselineComparison = {
      isReliable: true,
      baselineSessionsCount: baselineSessions.length,
      recentSessionsCount: recentSessions.length,
      baselineAccuracy: bAcc,
      recentAccuracy: rAcc,
      accuracyDiff: accDiff,
      accuracyStatus,
      baselineMistakes: bMis,
      recentMistakes: rMis,
      mistakesDiff: misDiff,
      mistakesStatus,
      baselineTime: bTime,
      recentTime: rTime,
      timeDiff,
      timeStatus,
      overallStatus,
      evidenceText: `Based on ${baselineSessions.length} baseline sessions and ${recentSessions.length} recent sessions in the selected ${period} window.`,
    };
  }

  // ----------------------------------------------------------
  // Sustained-Change Detection
  // ----------------------------------------------------------
  const sustainedChanges: any[] = [];
  if (baselineComparison.isReliable) {
    const recentSessions = periodSessions.slice(
      -Math.max(3, baselineComparison.recentSessionsCount)
    );
    if (recentSessions.length >= 3) {
      // 1. Sustained accuracy decrease across at least 3 sessions
      const accDrops = recentSessions.filter(
        (s) => Number(s.accuracy) <= baselineComparison.baselineAccuracy - 6
      );
      if (accDrops.length >= 3) {
        const avgDropAcc =
          Math.round(
            (accDrops.reduce((a, b) => a + Number(b.accuracy), 0) / accDrops.length) * 10
          ) / 10;
        const mag = Math.round((baselineComparison.baselineAccuracy - avgDropAcc) * 10) / 10;
        sustainedChanges.push({
          id: 'sustained-acc-drop',
          type: 'attention',
          metric: 'Accuracy',
          direction: 'lower',
          magnitude: `-${mag}%`,
          sessionCount: accDrops.length,
          title: 'Recent Activity Accuracy Differs from Baseline',
          description: `Accuracy averaged ${avgDropAcc}% across ${accDrops.length} consecutive sessions, compared with your personal baseline of ${baselineComparison.baselineAccuracy}%.`,
          contextNote:
            'Game performance naturally fluctuates with sleep, time of day, distractions, or activity difficulty. This is an assistive observation, not a clinical diagnosis.',
        });
      } else {
        // Sustained accuracy improvement across at least 3 sessions
        const accGains = recentSessions.filter(
          (s) => Number(s.accuracy) >= baselineComparison.baselineAccuracy + 5
        );
        if (accGains.length >= 3) {
          const avgGainAcc =
            Math.round(
              (accGains.reduce((a, b) => a + Number(b.accuracy), 0) / accGains.length) * 10
            ) / 10;
          const mag = Math.round((avgGainAcc - baselineComparison.baselineAccuracy) * 10) / 10;
          sustainedChanges.push({
            id: 'sustained-acc-gain',
            type: 'positive',
            metric: 'Accuracy',
            direction: 'higher',
            magnitude: `+${mag}%`,
            sessionCount: accGains.length,
            title: 'Sustained Accuracy Improvement Recorded',
            description: `Accuracy averaged ${avgGainAcc}% across ${accGains.length} recent sessions, higher than your baseline of ${baselineComparison.baselineAccuracy}%.`,
            contextNote:
              'Continued practice and familiarity with memory activities are reflected in sustained results.',
          });
        }
      }

      // 2. Sustained time change evaluated strictly per-game
      for (const [gameName, count] of Object.entries(gameCounts)) {
        if (count >= 5) {
          const gameSessionsAll = periodSessions.filter(
            (s) => s.game === gameName && Number(s.time) > 0
          );
          if (gameSessionsAll.length >= 5) {
            const gameRecent = gameSessionsAll.slice(-3);
            const gameBaseline = gameSessionsAll.slice(0, gameSessionsAll.length - 3);
            const bTimeG = Math.round(
              gameBaseline.reduce((a, b) => a + Number(b.time), 0) / gameBaseline.length
            );
            const rTimeG = Math.round(
              gameRecent.reduce((a, b) => a + Number(b.time), 0) / gameRecent.length
            );
            if (bTimeG > 0) {
              const diffPercent = Math.round(((rTimeG - bTimeG) / bTimeG) * 100);
              if (diffPercent >= 25) {
                sustainedChanges.push({
                  id: `sustained-time-slower-${gameName}`,
                  type: 'attention',
                  metric: `Completion Time (${gameName})`,
                  direction: 'slower',
                  magnitude: `+${diffPercent}% longer`,
                  sessionCount: 3,
                  title: `More Time Spent in ${gameName}`,
                  description: `Average completion time for ${gameName} was ${diffPercent}% longer across 3 consecutive sessions (${rTimeG}s vs baseline ${bTimeG}s).`,
                  contextNote:
                    'Taking more time often reflects careful consideration or harder puzzles. Look at accuracy together with duration.',
                });
              } else if (diffPercent <= -20) {
                sustainedChanges.push({
                  id: `sustained-time-faster-${gameName}`,
                  type: 'positive',
                  metric: `Completion Time (${gameName})`,
                  direction: 'faster',
                  magnitude: `${diffPercent}% quicker`,
                  sessionCount: 3,
                  title: `Quicker Completion in ${gameName}`,
                  description: `Sessions for ${gameName} were finished ${Math.abs(diffPercent)}% faster across 3 recent sessions (${rTimeG}s vs baseline ${bTimeG}s).`,
                  contextNote:
                    'Game familiarity and confidence allow quicker task navigation.',
                });
              }
            }
          }
        }
      }
    }
  }

  // ----------------------------------------------------------
  // Game-by-Game Breakdown
  // ----------------------------------------------------------
  const gameBreakdown: any[] = [];
  const uniqueGames = Array.from(new Set(periodSessions.map((s) => s.game)));
  for (const gameName of uniqueGames) {
    const gSessions = periodSessions.filter((s) => s.game === gameName);
    const count = gSessions.length;
    const avgAcc =
      Math.round(
        (gSessions.reduce((a, b) => a + Number(b.accuracy), 0) / count) * 10
      ) / 10;
    const avgMis =
      Math.round(
        (gSessions.reduce((a, b) => a + Number(b.mistakes), 0) / count) * 10
      ) / 10;
    const gTimes = gSessions.filter((s) => Number(s.time) > 0);
    const avgT = gTimes.length
      ? Math.round(gTimes.reduce((a, b) => a + Number(b.time), 0) / gTimes.length)
      : 0;

    let bAccG = null;
    let rAccG = null;
    let statusG = 'stable';
    let trendG = 0;

    if (count >= 4) {
      const rec = gSessions.slice(-2);
      const bas = gSessions.slice(0, count - 2);
      bAccG =
        Math.round((bas.reduce((a, b) => a + Number(b.accuracy), 0) / bas.length) * 10) /
        10;
      rAccG =
        Math.round((rec.reduce((a, b) => a + Number(b.accuracy), 0) / rec.length) * 10) /
        10;
      trendG = Math.round((rAccG - bAccG) * 10) / 10;
      if (trendG >= 4) statusG = 'improving';
      else if (trendG <= -4) statusG = 'declining';
    } else {
      statusG = 'insufficient_data';
    }

    gameBreakdown.push({
      game: gameName,
      sessionCount: count,
      avgAccuracy: avgAcc,
      avgMistakes: avgMis,
      avgTime: avgT,
      baselineAccuracy: bAccG,
      recentAccuracy: rAccG,
      trend: trendG,
      status: statusG,
    });
  }

  // ----------------------------------------------------------
  // Chronological Trend Points for Charts
  // ----------------------------------------------------------
  const trendPoints = periodSessions.map((s, idx) => {
    const prevSlice = periodSessions.slice(Math.max(0, idx - 2), idx + 1);
    const rolling =
      Math.round(
        (prevSlice.reduce((a, b) => a + Number(b.accuracy), 0) / prevSlice.length) * 10
      ) / 10;
    const dateObj = new Date(s.created_at);
    return {
      id: s.id,
      date: s.created_at,
      dateFormatted: dateObj.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      }),
      game: s.game,
      difficulty: s.difficulty,
      accuracy: Number(s.accuracy),
      mistakes: Number(s.mistakes),
      time: Number(s.time) || 0,
      rollingAccuracy: rolling,
    };
  });

  // ----------------------------------------------------------
  // Weekly Participation Breakdown
  // ----------------------------------------------------------
  const weeklyParticipation: any[] = [];
  const weeksToGenerate = Math.min(12, Math.ceil(daysLimit / 7));
  for (let w = weeksToGenerate - 1; w >= 0; w--) {
    const wEnd = now - w * 7 * 86400000;
    const wStart = wEnd - 7 * 86400000;
    const wSessions = userSessions.filter((s) => {
      const t = new Date(s.created_at).getTime();
      return t >= wStart && t < wEnd;
    });
    const label = new Date(wStart).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    });
    const avgAccW = wSessions.length
      ? Math.round(
          (wSessions.reduce((a, b) => a + Number(b.accuracy), 0) / wSessions.length) * 10
        ) / 10
      : null;
    weeklyParticipation.push({
      weekLabel: label,
      sessionCount: wSessions.length,
      avgAccuracy: avgAccW,
    });
  }

  // ----------------------------------------------------------
  // Insight Cards
  // ----------------------------------------------------------
  const insightCards: any[] = [];
  if (totalCompleted === 0) {
    insightCards.push({
      id: 'no-sessions',
      type: 'neutral',
      title: 'No Recorded Activity in this Period',
      message:
        'No completed game sessions were found in the selected date range. Play an activity to see your progress.',
      evidence: '0 sessions recorded in period.',
    });
  } else if (!baselineComparison.isReliable) {
    insightCards.push({
      id: 'building-baseline',
      type: 'neutral',
      title: 'Building Personal Baseline',
      message: `You have completed ${totalCompleted} session(s) in this period. As you play more, Cognicare establishes an individualized baseline reflecting your natural pace.`,
      evidence: `${totalCompleted} of ${MIN_TOTAL_FOR_BASELINE} recommended sessions completed.`,
    });
  } else {
    if (baselineComparison.overallStatus === 'improving') {
      insightCards.push({
        id: 'positive-accuracy',
        type: 'positive',
        title: 'Accuracy is Trending Upward',
        message: `Your recent average accuracy of ${baselineComparison.recentAccuracy}% is higher than your personal baseline of ${baselineComparison.baselineAccuracy}% (+${baselineComparison.accuracyDiff}%).`,
        evidence: `Supported by your last ${baselineComparison.recentSessionsCount} sessions.`,
      });
    } else if (baselineComparison.overallStatus === 'declining') {
      insightCards.push({
        id: 'accuracy-notice',
        type: 'attention',
        title: 'Recent Accuracy Differs from Baseline',
        message: `Recent sessions showed an average accuracy of ${baselineComparison.recentAccuracy}%, compared with your baseline of ${baselineComparison.baselineAccuracy}% (${baselineComparison.accuracyDiff}%).`,
        evidence: `Observed across ${baselineComparison.recentSessionsCount} recent sessions.`,
      });
    } else {
      insightCards.push({
        id: 'stable-accuracy',
        type: 'neutral',
        title: 'Performance is Broadly Stable',
        message: `Your cognitive activity scores have remained steady around your baseline of ${baselineComparison.baselineAccuracy}%, showing consistent engagement.`,
        evidence: `Variation within ±${Math.abs(baselineComparison.accuracyDiff)}% across recent sessions.`,
      });
    }

    if (baselineComparison.mistakesStatus === 'improving') {
      insightCards.push({
        id: 'fewer-mistakes',
        type: 'positive',
        title: 'Mistake Frequency Reduced',
        message: `Average mistakes decreased from ${baselineComparison.baselineMistakes} to ${baselineComparison.recentMistakes} per completed game.`,
        evidence: `Difference of ${baselineComparison.mistakesDiff} mistakes per session.`,
      });
    }

    if (sessionsPerWeek >= 2.5) {
      insightCards.push({
        id: 'regular-participation',
        type: 'positive',
        title: 'Healthy Activity Routine',
        message: `You maintained a regular schedule averaging ${sessionsPerWeek} sessions per week across ${activeDaysCount} active days.`,
        evidence: `Recorded across ${weeksCount.toFixed(0)} reporting weeks.`,
      });
    } else if (totalCompleted >= 3 && sessionsPerWeek < 1.5) {
      insightCards.push({
        id: 'participation-pace',
        type: 'neutral',
        title: 'Gentle Activity Pace',
        message: `Recorded participation was quieter during this reporting period (${sessionsPerWeek} sessions/week). Breaks in play are completely normal.`,
        evidence: `${activeDaysCount} active days recorded in the period.`,
      });
    }
  }

  // ----------------------------------------------------------
  // Difficulty Breakdown (avoids misleading cross-tier comparisons)
  // ----------------------------------------------------------
  const difficultyBreakdown: any[] = [];
  const diffOrder = ['Easy', 'Medium', 'Hard', 'Standard'];
  for (const diff of diffOrder) {
    const dSessions = periodSessions.filter((s) => s.difficulty === diff);
    if (dSessions.length > 0) {
      const dTimes = dSessions.filter((s) => Number(s.time) > 0);
      difficultyBreakdown.push({
        difficulty: diff,
        sessionCount: dSessions.length,
        avgAccuracy:
          Math.round(
            (dSessions.reduce((a, b) => a + Number(b.accuracy || 0), 0) / dSessions.length) * 10
          ) / 10,
        avgMistakes:
          Math.round(
            (dSessions.reduce((a, b) => a + Number(b.mistakes || 0), 0) / dSessions.length) * 10
          ) / 10,
        avgTime: dTimes.length
          ? Math.round(dTimes.reduce((a, b) => a + Number(b.time), 0) / dTimes.length)
          : 0,
      });
    }
  }

  const disclaimer =
    'Cognitive activity trends describe recorded game performance and participation only. They are not a medical assessment or diagnosis. Performance can vary with factors such as fatigue, mood, health and familiarity with an activity. For health concerns, consult a qualified healthcare professional.';

  return {
    period,
    daysLimit,
    overview: {
      totalCompleted,
      avgAccuracy,
      avgMistakes,
      avgTime,
      mostPlayedGame,
      activeDaysCount,
      daysWithoutActivity,
      sessionsPerWeek,
    },
    baselineComparison,
    sustainedChanges,
    gameBreakdown,
    difficultyBreakdown,
    trendPoints,
    weeklyParticipation,
    insightCards,
    disclaimer,
  };
}

// ------------------------------------------------------------
// GET /cognitive-insights — Authenticated User's Progress Insights
// ------------------------------------------------------------
app.get('/cognitive-insights', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const period = typeof req.query.period === 'string' ? req.query.period : '30d';
  const game = typeof req.query.game === 'string' ? req.query.game : undefined;
  const difficulty = typeof req.query.difficulty === 'string' ? req.query.difficulty : undefined;

  const validPeriods = ['7d', '30d', '90d', 'all'];
  const sanitizedPeriod = validPeriods.includes(period) ? period : '30d';

  const insights = calculateCognitiveProgressInsights(user.id, sanitizedPeriod, game, difficulty);
  res.json(insights);
});

// ------------------------------------------------------------
// GET /caregiver-links/:id/progress-report — Caregiver Progress Report
// ------------------------------------------------------------
app.get('/caregiver-links/:id/progress-report', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;

  if (user.role !== 'caregiver') {
    return res.status(403).json({
      detail: 'Only caregiver accounts can access cognitive progress reports.',
    });
  }

  const linkId = Number(req.params.id);
  const link = caregiverLinks.find(
    (l) => l.id === linkId && l.caregiver_id === user.id && l.status === 'approved'
  );

  if (!link) {
    return res.status(404).json({
      detail: 'Approved caregiver link not found or access has been revoked.',
    });
  }

  const elderly = users.find((u) => u.id === link.elderly_id && u.is_active);
  if (!elderly) {
    return res.status(404).json({
      detail: 'Linked elderly user was not found or is inactive.',
    });
  }

  const period = typeof req.query.period === 'string' ? req.query.period : '30d';
  const game = typeof req.query.game === 'string' ? req.query.game : undefined;
  const difficulty = typeof req.query.difficulty === 'string' ? req.query.difficulty : undefined;
  const validPeriods = ['7d', '30d', '90d', 'all'];
  const sanitizedPeriod = validPeriods.includes(period) ? period : '30d';

  const insights = calculateCognitiveProgressInsights(elderly.id, sanitizedPeriod, game, difficulty);

  // Generate clear caregiver plain-language summary
  let statusSummary = 'is broadly stable';
  if (insights.baselineComparison.overallStatus === 'improving') {
    statusSummary = 'is showing positive progress';
  } else if (insights.baselineComparison.overallStatus === 'declining') {
    statusSummary = 'shows slight variation from usual baseline';
  } else if (!insights.baselineComparison.isReliable) {
    statusSummary = 'is building initial history';
  }

  const plainLanguageSummary = `${elderly.full_name} completed ${insights.overview.totalCompleted} cognitive activity sessions in the selected ${sanitizedPeriod} period. Recent performance ${statusSummary} with an average accuracy of ${insights.overview.avgAccuracy}%. The most frequently enjoyed activity was ${insights.overview.mostPlayedGame}.`;

  res.json({
    elderly_user: {
      id: elderly.id,
      full_name: elderly.full_name,
      email: elderly.email,
    },
    caregiver_link: {
      id: link.id,
      status: link.status,
    },
    reporting_period: sanitizedPeriod,
    plain_language_summary: plainLanguageSummary,
    ...insights,
  });
});

// ============================================================
// Recommendation Engine (/recommendation)
// Ported directly from backend/routes/recommendation.py
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

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(value, maximum));
}

function average(values: number[]): number | null {
  if (!values || values.length === 0) return null;
  return values.reduce((acc, curr) => acc + curr, 0) / values.length;
}

function determinePerformanceStatus(summary: any): string {
  const sessions = summary.sessions;
  const trend = summary.trend;
  const recent_accuracy = summary.recent_accuracy;

  if (sessions === 0) return 'New';
  if (sessions < 3) return 'Not enough data';
  if (trend >= 7 && recent_accuracy >= 70) return 'Improving';
  if (trend <= -7) return 'Declining';
  return 'Stable';
}

function calculateGameSummary(sessions: GameSessionRecord[]) {
  if (!sessions || sessions.length === 0) return null;

  const recentSessions = sessions.slice(0, 3);
  const olderSessions = sessions.slice(3, 6);

  const recentAccuracyValues = recentSessions.map((s) => Number(s.accuracy));
  const overallAccuracyValues = sessions.map((s) => Number(s.accuracy));

  const recent_accuracy = average(recentAccuracyValues) || 0;
  const overall_accuracy = average(overallAccuracyValues) || 0;

  const mistakeValues = recentSessions.map((s) => Number(s.mistakes));
  const average_mistakes = average(mistakeValues) || 0;

  let trend = 0.0;
  if (olderSessions.length > 0) {
    const olderAccuracyValues = olderSessions.map((s) => Number(s.accuracy));
    const older_accuracy = average(olderAccuracyValues) || recent_accuracy;
    trend = recent_accuracy - older_accuracy;
  }

  const recentTimes = recentSessions
    .map((s) => Number(s.time))
    .filter((t) => t > 0);
  const olderTimes = olderSessions
    .map((s) => Number(s.time))
    .filter((t) => t > 0);

  const recent_time = recentTimes.length > 0 ? average(recentTimes) : null;
  const older_time = olderTimes.length > 0 ? average(olderTimes) : null;

  let time_change_percent = 0.0;
  if (recent_time !== null && older_time !== null && older_time > 0) {
    time_change_percent = ((recent_time - older_time) / older_time) * 100;
  }

  let consistency_std = 0.0;
  if (recentAccuracyValues.length >= 2) {
    const mean = recent_accuracy;
    const variance =
      recentAccuracyValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
      recentAccuracyValues.length;
    consistency_std = Math.sqrt(variance);
  }

  const last_difficulty = sessions[0].difficulty;

  return {
    sessions: sessions.length,
    recent_accuracy: Math.round(recent_accuracy * 10) / 10,
    overall_accuracy: Math.round(overall_accuracy * 10) / 10,
    average_mistakes: Math.round(average_mistakes * 10) / 10,
    trend: Math.round(trend * 10) / 10,
    recent_time: recent_time !== null ? Math.round(recent_time * 10) / 10 : null,
    time_change_percent: Math.round(time_change_percent * 10) / 10,
    consistency_std: Math.round(consistency_std * 10) / 10,
    last_difficulty,
  };
}

function calculatePriorityScore(summary: any): number {
  const sessions = summary.sessions;
  const accuracy_need = clamp((100 - summary.recent_accuracy) / 100, 0, 1);
  const trend_need = clamp(-summary.trend / 20, 0, 1);
  const mistake_need = clamp(summary.average_mistakes / 4, 0, 1);
  const time_need = clamp(summary.time_change_percent / 50, 0, 1);
  const experience_gap = clamp((5 - sessions) / 5, 0, 1);

  const score =
    accuracy_need * 0.45 +
    trend_need * 0.25 +
    mistake_need * 0.15 +
    time_need * 0.05 +
    experience_gap * 0.1;

  return Math.round(score * 10000) / 100;
}

function chooseDifficulty(game: string, summary: any): string {
  const levels = GAME_DIFFICULTIES[game];
  if (levels.length === 1) return levels[0];
  if (summary.sessions === 0) return 'Easy';

  const last_difficulty = summary.last_difficulty;
  const current_level = levels.includes(last_difficulty) ? last_difficulty : 'Easy';
  const current_index = DIFFICULTY_ORDER[current_level] ?? 0;

  const strong_performance =
    summary.recent_accuracy >= 85 && summary.trend >= -5 && summary.average_mistakes <= 1;

  const needs_support =
    summary.recent_accuracy < 60 ||
    summary.trend <= -10 ||
    (summary.time_change_percent >= 25 && summary.recent_accuracy < 80);

  if (needs_support) {
    return levels[Math.max(0, current_index - 1)];
  }

  if (strong_performance) {
    return levels[Math.min(levels.length - 1, current_index + 1)];
  }

  return current_level;
}

function buildReason(game: string, difficulty: string, summary: any): string {
  const status = determinePerformanceStatus(summary);
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
    const trendSign = trend >= 0 ? `+${trend}` : `${trend}`;
    return `Your recent ${game} accuracy is ${accuracy}% with a recent trend of ${trendSign} percentage points. The recommended level is ${difficulty} to provide a more comfortable challenge.`;
  }
  return `Your recent ${game} accuracy is ${accuracy}% with about ${mistakes} mistakes per session. The recommended level is ${difficulty}.`;
}

function calculateConfidence(summary: any): string {
  const sessions = summary.sessions;
  if (sessions === 0) return 'low';
  if (sessions < 3) return 'low';
  if (sessions < 6) return 'moderate';
  return 'high';
}

app.get('/recommendation', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;

  const userSessions = gameSessions
    .filter((s) => s.user_id === user.id && s.completed && GAME_NAMES.includes(s.game))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 60);

  const grouped: Record<string, GameSessionRecord[]> = {
    'Memory Match': [],
    'Sequence Memory': [],
    'Object Recall': [],
  };

  for (const session of userSessions) {
    if (grouped[session.game]) {
      grouped[session.game].push(session);
    }
  }

  const summaries: Record<string, any> = {};

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

  if (userSessions.length === 0) {
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

  const recommended_game = GAME_NAMES.reduce((best, game) =>
    summaries[game].priority_score > summaries[best].priority_score ? game : best
  );

  const selected = summaries[recommended_game];
  const recommended_difficulty = chooseDifficulty(recommended_game, selected);
  const reason = buildReason(recommended_game, recommended_difficulty, selected);

  res.json({
    recommendation: {
      game: recommended_game,
      difficulty: recommended_difficulty,
      reason,
      performance_status: selected.performance_status,
    },
    based_on_sessions: userSessions.length,
    engine: 'rule-based-v3',
    personalization: 'performance-based',
    confidence: selected.confidence,
    game_summaries: summaries,
  });
});

// ============================================================
// Frontend Serving (Vite middleware in dev, dist in prod)
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

    // Fallback for SPA routing in dev mode
    app.use(async (req, res, next) => {
      if (req.method !== 'GET') {
        return next();
      }
      const url = req.originalUrl;
      try {
        const indexHtmlPath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(indexHtmlPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (err) {
        vite.ssrFixStacktrace(err as Error);
        next(err);
      }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.use((_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cognicare NER running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
