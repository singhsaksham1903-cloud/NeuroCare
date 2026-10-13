import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// ============================================================
// Data Models & Store
// ============================================================

interface UserRecord {
  id: number;
  full_name: string;
  email: string;
  password: string;
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
  memoryDate: string;
  imageData?: string;
  clientMutationId?: string | null;
  created_at: string;
}

interface ReminderRecord {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category: string;
  dueDatetime: string;
  completed: boolean;
  clientMutationId?: string | null;
  created_at: string;
}

interface GameSessionRecord {
  id: number;
  user_id: number;
  game: string;
  difficulty: string;
  accuracy: number;
  mistakes: number;
  time: number | null;
  completed: boolean;
  matches?: number;
  sequenceLength?: number;
  targetCount?: number;
  correct?: number;
  wrong?: number;
  clientSessionId?: string | null;
  created_at: string;
}

interface CaregiverLinkRecord {
  id: number;
  caregiver_id: number;
  elderly_id: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const dataDir = path.resolve(__dirname, 'data');
const storeFile = path.resolve(dataDir, 'store.json');

const users: UserRecord[] = [
  {
    id: 1,
    full_name: 'Grandma Alice',
    email: 'elderly@cognicare.com',
    password: 'password123',
    role: 'elderly',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 2,
    full_name: 'Nurse Sarah',
    email: 'caregiver@cognicare.com',
    password: 'password123',
    role: 'caregiver',
    is_active: true,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
];

const tokens = new Map<string, number>();
tokens.set('demo-token-elderly', 1);
tokens.set('demo-token-caregiver', 2);

const memories: MemoryRecord[] = [
  {
    id: 1,
    user_id: 1,
    title: 'Spring Tea in the Courtyard',
    description: 'Drinking fresh warm Assam tea with family under the blooming garden trees.',
    category: 'Family',
    memoryDate: '2026-03-21',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 2,
    user_id: 1,
    title: 'Rongali Bihu Festivities',
    description: 'Joyful music, rhythmic dhol beats, and sharing freshly prepared homemade pitha.',
    category: 'Culture',
    memoryDate: '2026-04-14',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

const reminders: ReminderRecord[] = [
  {
    id: 1,
    user_id: 1,
    title: 'Morning Blood Pressure Medication',
    description: 'Take one blue tablet with breakfast and a glass of water.',
    category: 'Medication',
    dueDatetime: new Date(Date.now() + 2 * 3600000).toISOString().slice(0, 16),
    completed: false,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 2,
    user_id: 1,
    title: 'Gentle Evening Garden Walk',
    description: '15 minutes of peaceful walking and fresh air in the courtyard.',
    category: 'Activity',
    dueDatetime: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 16),
    completed: false,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
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
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 2,
    user_id: 1,
    game: 'Sequence Memory',
    difficulty: 'Easy',
    accuracy: 82,
    mistakes: 1,
    time: 32,
    completed: true,
    sequenceLength: 5,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 3,
    user_id: 1,
    game: 'Object Recall',
    difficulty: 'Easy',
    accuracy: 75,
    mistakes: 2,
    time: 29,
    completed: true,
    targetCount: 4,
    correct: 3,
    wrong: 1,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

const caregiverLinks: CaregiverLinkRecord[] = [
  {
    id: 1,
    caregiver_id: 2,
    elderly_id: 1,
    status: 'approved',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
];

let nextUserId = 3;
let nextMemoryId = 3;
let nextReminderId = 3;
let nextSessionId = 4;
let nextLinkId = 2;

function loadStore() {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (fs.existsSync(storeFile)) {
      const raw = fs.readFileSync(storeFile, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.users)) {
        users.length = 0;
        users.push(...data.users);
      }
      if (Array.isArray(data.tokens)) {
        tokens.clear();
        data.tokens.forEach(([k, v]: [string, number]) => tokens.set(k, v));
      }
      if (Array.isArray(data.memories)) {
        memories.length = 0;
        memories.push(...data.memories);
      }
      if (Array.isArray(data.reminders)) {
        reminders.length = 0;
        reminders.push(...data.reminders);
      }
      if (Array.isArray(data.gameSessions)) {
        gameSessions.length = 0;
        gameSessions.push(...data.gameSessions);
      }
      if (Array.isArray(data.caregiverLinks)) {
        caregiverLinks.length = 0;
        caregiverLinks.push(...data.caregiverLinks);
      }

      nextUserId = Math.max(3, ...users.map((u) => u.id + 1));
      nextMemoryId = Math.max(3, ...memories.map((m) => m.id + 1));
      nextReminderId = Math.max(3, ...reminders.map((r) => r.id + 1));
      nextSessionId = Math.max(4, ...gameSessions.map((s) => s.id + 1));
      nextLinkId = Math.max(2, ...caregiverLinks.map((l) => l.id + 1));
      return;
    }
  } catch (err) {
    console.warn('Failed to load store from disk:', err);
  }
  saveStore();
}

function saveStore() {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const data = {
      users,
      tokens: Array.from(tokens.entries()),
      memories,
      reminders,
      gameSessions,
      caregiverLinks,
    };
    fs.writeFileSync(storeFile, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to save store to disk:', err);
  }
}

// Initial store hydration
loadStore();

// ============================================================
// Auth Middleware
// ============================================================

function authenticate(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ detail: 'Authentication token missing or invalid.' });
    return;
  }

  const token = authHeader.slice(7).trim();
  const userId = tokens.get(token);

  if (!userId) {
    res.status(401).json({ detail: 'Session expired or invalid.' });
    return;
  }

  const user = users.find((u) => u.id === userId && u.is_active);
  if (!user) {
    res.status(401).json({ detail: 'User account not found or inactive.' });
    return;
  }

  (req as any).user = user;
  next();
}

// ============================================================
// Auth Routes
// ============================================================

app.post('/auth/register', (req, res) => {
  const { full_name, email, password, role } = req.body || {};

  if (!email || !password || !full_name) {
    res.status(400).json({ detail: 'Full name, email, and password are required.' });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    res.status(409).json({ detail: 'An account with this email already exists.' });
    return;
  }

  const newUser: UserRecord = {
    id: nextUserId++,
    full_name: String(full_name).trim(),
    email: normalizedEmail,
    password: String(password),
    role: role === 'caregiver' ? 'caregiver' : 'elderly',
    is_active: true,
    created_at: new Date().toISOString(),
  };

  users.push(newUser);

  const token = `token-${newUser.id}-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  tokens.set(token, newUser.id);
  saveStore();

  res.status(201).json({
    id: newUser.id,
    full_name: newUser.full_name,
    email: newUser.email,
    role: newUser.role,
    is_active: newUser.is_active,
    created_at: newUser.created_at,
    access_token: token,
    token_type: 'bearer',
  });
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    res.status(400).json({ detail: 'Email and password are required.' });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = users.find(
    (u) => u.email.toLowerCase() === normalizedEmail && u.password === String(password),
  );

  if (!user) {
    res.status(401).json({ detail: 'Invalid email or password.' });
    return;
  }

  if (!user.is_active) {
    res.status(403).json({ detail: 'User account is inactive.' });
    return;
  }

  const token = `token-${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  tokens.set(token, user.id);
  saveStore();

  res.json({
    access_token: token,
    token_type: 'bearer',
  });
});

app.get('/auth/me', authenticate, (req, res) => {
  const user = (req as any).user as UserRecord;
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
    memoryDate: m.memoryDate,
    imageData: m.imageData || '',
    clientMutationId: m.clientMutationId || null,
    created_at: m.created_at,
  };
}

app.get('/memories', authenticate, (req, res) => {
  const user = (req as any).user as UserRecord;
  const userMemories = memories
    .filter((m) => m.user_id === user.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(serializeMemory);

  res.json({
    count: userMemories.length,
    memories: userMemories,
  });
});

app.post('/memories', authenticate, (req, res) => {
  const user = (req as any).user as UserRecord;
  const { title, description, category, memoryDate, imageData, clientMutationId } = req.body || {};

  if (clientMutationId) {
    const existing = memories.find(
      (m) => m.user_id === user.id && m.clientMutationId === clientMutationId,
    );
    if (existing) {
      res.json({
        message: 'Memory already saved',
        memory: serializeMemory(existing),
        idempotent: true,
      });
      return;
    }
  }

  const newMemory: MemoryRecord = {
    id: nextMemoryId++,
    user_id: user.id,
    title: title || 'Untitled Memory',
    description: description || '',
    category: category || 'General',
    memoryDate: memoryDate || '',
    imageData: imageData || '',
    clientMutationId: clientMutationId || null,
    created_at: new Date().toISOString(),
  };

  memories.push(newMemory);
  saveStore();

  res.status(201).json({
    message: 'Memory saved successfully',
    memory: serializeMemory(newMemory),
  });
});

app.put('/memories/:id', authenticate, (req, res) => {
  const user = (req as any).user as UserRecord;
  const id = Number(req.params.id);
  const memory = memories.find((m) => m.id === id && m.user_id === user.id);

  if (!memory) {
    res.status(404).json({ detail: 'Memory not found.' });
    return;
  }

  const { title, description, category, memoryDate, imageData } = req.body || {};
  if (title !== undefined) memory.title = title;
  if (description !== undefined) memory.description = description;
  if (category !== undefined) memory.category = category;
  if (memoryDate !== undefined) memory.memoryDate = memoryDate;
  if (imageData !== undefined) memory.imageData = imageData;

  saveStore();

  res.json({
    message: 'Memory updated successfully',
    memory: serializeMemory(memory),
  });
});

app.delete('/memories/:id', authenticate, (req, res) => {
  const user = (req as any).user as UserRecord;
  const id = Number(req.params.id);
  const index = memories.findIndex((m) => m.id === id && m.user_id === user.id);

  if (index === -1) {
    res.status(404).json({ detail: 'Memory not found.' });
    return;
  }

  memories.splice(index, 1);
  saveStore();

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
    dueDatetime: r.dueDatetime,
    completed: r.completed,
    clientMutationId: r.clientMutationId || null,
    created_at: r.created_at,
  };
}

app.get('/reminders', authenticate, (req, res) => {
  const user = (req as any).user as UserRecord;
  const userReminders = reminders
    .filter((r) => r.user_id === user.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(serializeReminder);

  res.json({
    count: userReminders.length,
    reminders: userReminders,
  });
});

app.post('/reminders', authenticate, (req, res) => {
  const user = (req as any).user as UserRecord;
  const { title, description, category, dueDatetime, completed, clientMutationId } = req.body || {};

  if (clientMutationId) {
    const existing = reminders.find(
      (r) => r.user_id === user.id && r.clientMutationId === clientMutationId,
    );
    if (existing) {
      res.json({
        message: 'Reminder already saved',
        reminder: serializeReminder(existing),
        idempotent: true,
      });
      return;
    }
  }

  const newReminder: ReminderRecord = {
    id: nextReminderId++,
    user_id: user.id,
    title: title || 'Untitled Reminder',
    description: description || '',
    category: category || 'General',
    dueDatetime: dueDatetime || new Date().toISOString(),
    completed: Boolean(completed),
    clientMutationId: clientMutationId || null,
    created_at: new Date().toISOString(),
  };

  reminders.push(newReminder);
  saveStore();

  res.status(201).json({
    message: 'Reminder created successfully',
    reminder: serializeReminder(newReminder),
  });
});

app.put('/reminders/:id', authenticate, (req, res) => {
  const user = (req as any).user as UserRecord;
  const id = Number(req.params.id);
  const reminder = reminders.find((r) => r.id === id && r.user_id === user.id);

  if (!reminder) {
    res.status(404).json({ detail: 'Reminder not found.' });
    return;
  }

  const { title, description, category, dueDatetime, completed } = req.body || {};
  if (title !== undefined) reminder.title = title;
  if (description !== undefined) reminder.description = description;
  if (category !== undefined) reminder.category = category;
  if (dueDatetime !== undefined) reminder.dueDatetime = dueDatetime;
  if (completed !== undefined) reminder.completed = Boolean(completed);

  saveStore();

  res.json({
    message: 'Reminder updated successfully',
    reminder: serializeReminder(reminder),
  });
});

app.delete('/reminders/:id', authenticate, (req, res) => {
  const user = (req as any).user as UserRecord;
  const id = Number(req.params.id);
  const index = reminders.findIndex((r) => r.id === id && r.user_id === user.id);

  if (index === -1) {
    res.status(404).json({ detail: 'Reminder not found.' });
    return;
  }

  reminders.splice(index, 1);
  saveStore();

  res.json({ message: 'Reminder deleted successfully' });
});

// ============================================================
// Game Sessions Routes
// ============================================================

function serializeSession(s: GameSessionRecord) {
  return {
    id: s.id,
    game: s.game,
    difficulty: s.difficulty,
    accuracy: s.accuracy,
    mistakes: s.mistakes,
    time: s.time,
    completed: s.completed,
    matches: s.matches ?? 0,
    sequenceLength: s.sequenceLength ?? 0,
    targetCount: s.targetCount ?? 0,
    correct: s.correct ?? 0,
    wrong: s.wrong ?? 0,
    clientSessionId: s.clientSessionId || null,
    created_at: s.created_at,
  };
}

app.get('/game-sessions', authenticate, (req, res) => {
  const user = (req as any).user as UserRecord;
  const sessions = gameSessions
    .filter((s) => s.user_id === user.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(serializeSession);

  res.json({
    count: sessions.length,
    sessions,
  });
});

app.post('/game-sessions', authenticate, (req, res) => {
  const user = (req as any).user as UserRecord;
  const {
    game,
    difficulty,
    accuracy,
    mistakes,
    time,
    completed,
    matches,
    sequenceLength,
    targetCount,
    correct,
    wrong,
    clientSessionId,
  } = req.body || {};

  if (clientSessionId) {
    const existing = gameSessions.find(
      (s) => s.user_id === user.id && s.clientSessionId === clientSessionId,
    );
    if (existing) {
      res.json({
        message: 'Game session already saved',
        session: serializeSession(existing),
        idempotent: true,
      });
      return;
    }
  }

  const newSession: GameSessionRecord = {
    id: nextSessionId++,
    user_id: user.id,
    game: game || 'Memory Match',
    difficulty: difficulty || 'Standard',
    accuracy: Number(accuracy) || 0,
    mistakes: Number(mistakes) || 0,
    time: time !== undefined && time !== null ? Number(time) : null,
    completed: completed !== undefined ? Boolean(completed) : true,
    matches: matches ? Number(matches) : 0,
    sequenceLength: sequenceLength ? Number(sequenceLength) : 0,
    targetCount: targetCount ? Number(targetCount) : 0,
    correct: correct ? Number(correct) : 0,
    wrong: wrong ? Number(wrong) : 0,
    clientSessionId: clientSessionId || null,
    created_at: new Date().toISOString(),
  };

  gameSessions.push(newSession);
  saveStore();

  res.status(201).json({
    message: 'Game session saved successfully',
    session: serializeSession(newSession),
  });
});

// ============================================================
// Recommendation Engine Route
// ============================================================

const GAME_NAMES = ['Memory Match', 'Sequence Memory', 'Object Recall'];

app.get('/recommendation', authenticate, (req, res) => {
  const user = (req as any).user as UserRecord;
  const userSessions = gameSessions
    .filter((s) => s.user_id === user.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const summaries: Record<string, any> = {};

  for (const gameName of GAME_NAMES) {
    const gameList = userSessions.filter((s) => s.game === gameName);

    if (gameList.length === 0) {
      summaries[gameName] = {
        game: gameName,
        sessions: 0,
        recent_accuracy: 0,
        overall_accuracy: 0,
        average_mistakes: 0,
        trend: 0,
        performance_status: 'New',
        priority_score: 100,
        confidence: 'low',
      };
      continue;
    }

    const recent = gameList.slice(0, 3);
    const older = gameList.slice(3, 6);

    const recentAcc = recent.reduce((sum, s) => sum + s.accuracy, 0) / recent.length;
    const overallAcc = gameList.reduce((sum, s) => sum + s.accuracy, 0) / gameList.length;
    const avgMistakes = recent.reduce((sum, s) => sum + s.mistakes, 0) / recent.length;

    let trend = 0;
    if (older.length > 0) {
      const olderAcc = older.reduce((sum, s) => sum + s.accuracy, 0) / older.length;
      trend = recentAcc - olderAcc;
    }

    let status = 'Stable';
    if (gameList.length < 3) {
      status = 'Not enough data';
    } else if (trend >= 7 && recentAcc >= 70) {
      status = 'Improving';
    } else if (trend <= -7) {
      status = 'Declining';
    }

    const priorityScore = (100 - recentAcc) + avgMistakes * 5 - trend * 2;
    const confidence = gameList.length >= 6 ? 'high' : gameList.length >= 3 ? 'medium' : 'low';

    summaries[gameName] = {
      game: gameName,
      sessions: gameList.length,
      recent_accuracy: Math.round(recentAcc * 10) / 10,
      overall_accuracy: Math.round(overallAcc * 10) / 10,
      average_mistakes: Math.round(avgMistakes * 10) / 10,
      trend: Math.round(trend * 10) / 10,
      performance_status: status,
      priority_score: priorityScore,
      confidence,
    };
  }

  if (userSessions.length === 0) {
    res.json({
      recommendation: {
        game: 'Memory Match',
        difficulty: 'Standard',
        reason: 'Start with Memory Match to begin building your personalized performance history.',
        performance_status: 'New',
      },
      based_on_sessions: 0,
      engine: 'rule-based-v3',
      personalization: 'performance-based',
      confidence: 'low',
      game_summaries: summaries,
    });
    return;
  }

  let recommendedGame = GAME_NAMES[0];
  let maxScore = -Infinity;
  for (const name of GAME_NAMES) {
    if (summaries[name].priority_score > maxScore) {
      maxScore = summaries[name].priority_score;
      recommendedGame = name;
    }
  }

  const selected = summaries[recommendedGame];

  let recommendedDifficulty = 'Easy';
  if (recommendedGame === 'Memory Match') {
    recommendedDifficulty = 'Standard';
  } else {
    if (selected.recent_accuracy >= 85 && selected.average_mistakes <= 1) {
      recommendedDifficulty = 'Hard';
    } else if (selected.recent_accuracy >= 65) {
      recommendedDifficulty = 'Medium';
    } else {
      recommendedDifficulty = 'Easy';
    }
  }

  let reason = `Practice with ${recommendedGame} at ${recommendedDifficulty} difficulty to keep your memory sharp.`;
  if (selected.sessions === 0) {
    reason = `Start exploring ${recommendedGame} to build your activity profile.`;
  } else if (selected.performance_status === 'Declining') {
    reason = `Your recent scores in ${recommendedGame} dipped slightly. A quick session will help you regain focus.`;
  } else if (selected.performance_status === 'Improving') {
    reason = `You are performing strongly in ${recommendedGame}! Keep up your great rhythm.`;
  }

  res.json({
    recommendation: {
      game: recommendedGame,
      difficulty: recommendedDifficulty,
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
// Caregiver Links Routes
// ============================================================

function buildLinkResponse(link: CaregiverLinkRecord) {
  const caregiver = users.find((u) => u.id === link.caregiver_id);
  const elderly = users.find((u) => u.id === link.elderly_id);

  return {
    id: link.id,
    caregiver_id: link.caregiver_id,
    caregiver_name: caregiver?.full_name || 'Caregiver',
    caregiver_email: caregiver?.email || '',
    elderly_id: link.elderly_id,
    elderly_name: elderly?.full_name || 'Elderly User',
    elderly_email: elderly?.email || '',
    status: link.status,
    created_at: link.created_at,
  };
}

app.get('/caregiver-links', authenticate, (req, res) => {
  const user = (req as any).user as UserRecord;

  let links: CaregiverLinkRecord[] = [];
  if (user.role === 'caregiver') {
    links = caregiverLinks.filter((l) => l.caregiver_id === user.id);
  } else if (user.role === 'elderly') {
    links = caregiverLinks.filter((l) => l.elderly_id === user.id);
  }

  res.json(links.map(buildLinkResponse));
});

app.post('/caregiver-links', authenticate, (req, res) => {
  const user = (req as any).user as UserRecord;

  if (user.role !== 'caregiver') {
    res.status(403).json({ detail: 'Only caregiver accounts can send link requests.' });
    return;
  }

  const { elderly_email } = req.body || {};
  if (!elderly_email) {
    res.status(400).json({ detail: 'Elderly user email is required.' });
    return;
  }

  const normalized = String(elderly_email).trim().toLowerCase();
  const elderly = users.find((u) => u.email.toLowerCase() === normalized);

  if (!elderly) {
    res.status(404).json({ detail: 'No elderly user was found with that email address.' });
    return;
  }

  if (elderly.role !== 'elderly') {
    res.status(400).json({ detail: 'The selected account is not an elderly user account.' });
    return;
  }

  if (elderly.id === user.id) {
    res.status(400).json({ detail: 'A user cannot link to their own account.' });
    return;
  }

  const existing = caregiverLinks.find(
    (l) => l.caregiver_id === user.id && l.elderly_id === elderly.id,
  );

  if (existing) {
    if (existing.status === 'pending') {
      res.status(409).json({ detail: 'A link request is already pending.' });
      return;
    }
    if (existing.status === 'approved') {
      res.status(409).json({ detail: 'This caregiver is already linked to this elderly user.' });
      return;
    }
    existing.status = 'pending';
    saveStore();
    res.json(buildLinkResponse(existing));
    return;
  }

  const newLink: CaregiverLinkRecord = {
    id: nextLinkId++,
    caregiver_id: user.id,
    elderly_id: elderly.id,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  caregiverLinks.push(newLink);
  saveStore();
  res.status(201).json(buildLinkResponse(newLink));
});

app.put('/caregiver-links/:id', authenticate, (req, res) => {
  const user = (req as any).user as UserRecord;
  const id = Number(req.params.id);

  if (user.role !== 'elderly') {
    res.status(403).json({ detail: 'Only elderly users can approve or reject link requests.' });
    return;
  }

  const link = caregiverLinks.find((l) => l.id === id && l.elderly_id === user.id);
  if (!link) {
    res.status(404).json({ detail: 'Caregiver link request not found.' });
    return;
  }

  if (link.status !== 'pending') {
    res.status(400).json({ detail: 'This link request has already been decided.' });
    return;
  }

  const { status } = req.body || {};
  if (status !== 'approved' && status !== 'rejected') {
    res.status(400).json({ detail: "Status must be 'approved' or 'rejected'." });
    return;
  }

  link.status = status;
  saveStore();
  res.json(buildLinkResponse(link));
});

app.get('/caregiver-links/:id/data', authenticate, (req, res) => {
  const user = (req as any).user as UserRecord;
  const id = Number(req.params.id);

  if (user.role !== 'caregiver') {
    res.status(403).json({ detail: 'Only caregiver accounts can access linked elderly data.' });
    return;
  }

  const link = caregiverLinks.find(
    (l) => l.id === id && l.caregiver_id === user.id && l.status === 'approved',
  );

  if (!link) {
    res.status(404).json({ detail: 'Approved caregiver link not found.' });
    return;
  }

  const elderly = users.find((u) => u.id === link.elderly_id);
  if (!elderly) {
    res.status(404).json({ detail: 'Linked elderly user was not found.' });
    return;
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

  const userMemories = memories.filter((m) => m.user_id === elderly.id);
  const userReminders = reminders
    .filter((r) => r.user_id === elderly.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      dueDatetime: r.dueDatetime,
      completed: r.completed,
    }));

  res.json({
    link: { id: link.id, status: link.status },
    elderly_user: { id: elderly.id, full_name: elderly.full_name },
    sessions,
    memory_count: userMemories.length,
    reminders: userReminders,
  });
});

app.delete('/caregiver-links/:id', authenticate, (req, res) => {
  const user = (req as any).user as UserRecord;
  const id = Number(req.params.id);

  const index = caregiverLinks.findIndex((l) => l.id === id);
  if (index === -1) {
    res.status(404).json({ detail: 'Caregiver link not found.' });
    return;
  }

  const link = caregiverLinks[index];
  if (link.caregiver_id !== user.id && link.elderly_id !== user.id) {
    res.status(403).json({ detail: 'You are not allowed to remove this link.' });
    return;
  }

  caregiverLinks.splice(index, 1);
  saveStore();
  res.json({ message: 'Caregiver link removed successfully.' });
});

// ============================================================
// System Health Checks
// ============================================================

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy' });
});

app.get('/db-health', (_req, res) => {
  res.json({ status: 'connected', database: 'cognicare-store' });
});

app.get('/api-status', (_req, res) => {
  res.json({ message: 'Cognicare NER API is running', status: 'success' });
});

// ============================================================
// Vite Dev Server / Static Production Server
// ============================================================

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const PORT = parseInt(process.env.PORT || '3000', 10);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cognicare server running on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
