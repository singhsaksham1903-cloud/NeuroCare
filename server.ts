import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  MemoryRecord,
  MemoryPermissionRecord,
  MemoryAuditLogRecord,
  MemorySearchHistoryRecord,
  organizeMemoryWithAI,
  semanticSearchMemories,
  findRelatedMemories
} from './src/server/memoryVaultEngine';
import {
  SEED_PHOTO_SHILLONG,
  SEED_PHOTO_JAIPUR,
  SEED_PHOTO_TULSI,
  SEED_PHOTO_WEDDING,
  SEED_PHOTO_BIRTHDAY
} from './src/server/seedImages';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'cognicare-ner-secret-key-2026';
const PORT = Number(process.env.PORT) || 3000;

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// In-Memory cache for Gemini AI performance analyses
const aiAnalysisCache = new Map<string, { timestamp: number; data: any }>();

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

interface CaregiverReportPermissionRecord {
  id: number;
  elderly_id: number;
  caregiver_id: number;
  report_access_granted: boolean;
  updated_at: string;
}

// Global In-Memory Stores
let nextUserId = 3;
let nextSessionId = 30;
let nextMemoryId = 6;
let nextReminderId = 5;
let nextLinkId = 2;
let nextPermissionId = 2;
let nextReportPermissionId = 2;
let nextAuditLogId = 2;
let nextSearchHistoryId = 2;

const caregiverReportPermissions: CaregiverReportPermissionRecord[] = [
  {
    id: 1,
    elderly_id: 1,
    caregiver_id: 2,
    report_access_granted: true,
    updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

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

const rawSeedMemories = [
  {
    id: 1,
    user_id: 1,
    title: 'Family Trip to Shillong',
    description: 'We visited the beautiful hills and tea gardens together with Priya and Rohan in 1985. The mountain air was so crisp and pleasant.',
    category: 'Travel',
    memory_date: '1985-05-15',
    time: '11:00',
    location: 'Shillong, Meghalaya',
    mood: 'Peaceful',
    image_data: SEED_PHOTO_SHILLONG,
    images: [SEED_PHOTO_SHILLONG],
    audio_data: null,
    audio_duration: null,
    is_favorite: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 2,
    user_id: 1,
    title: 'Diwali in Jaipur',
    description: 'Lighting clay diyas and making fresh besan laddus with my mother. The entire courtyard was glowing with warm golden lights.',
    category: 'Festival',
    memory_date: '1992-11-04',
    time: '19:30',
    location: 'Jaipur, Rajasthan',
    mood: 'Joyful',
    image_data: SEED_PHOTO_JAIPUR,
    images: [SEED_PHOTO_JAIPUR],
    audio_data: null,
    audio_duration: null,
    is_favorite: true,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 3,
    user_id: 1,
    title: 'Our Home Garden Tulsi',
    description: 'Planting sacred Tulsi and fragrant jasmine flowers in the verandah. Morning sunshine and fresh dew make every day serene.',
    category: 'Daily Activity',
    memory_date: '2005-08-10',
    time: '07:30',
    location: 'Home Verandah, Guwahati',
    mood: 'Grateful',
    image_data: SEED_PHOTO_TULSI,
    images: [SEED_PHOTO_TULSI],
    audio_data: null,
    audio_duration: null,
    is_favorite: false,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 4,
    user_id: 1,
    title: "Granddaughter Priya's Wedding",
    description: 'My daughter Priya’s daughter got married in Guwahati. Traditional Assamese Biya with golden Mekhela Sador, relatives singing, and blessings from everyone.',
    category: 'Wedding',
    memory_date: '2024-02-18',
    time: '16:00',
    location: 'Guwahati, Assam',
    mood: 'Loving',
    image_data: SEED_PHOTO_WEDDING,
    images: [SEED_PHOTO_WEDDING],
    audio_data: null,
    audio_duration: null,
    is_favorite: true,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 5,
    user_id: 1,
    title: "Rahul's 5th Birthday Celebration",
    description: 'Celebrating little grandson Rahul turning 5 years old. We cut a chocolate cake, sang birthday songs together, and he wore a festive red cap.',
    category: 'Birthday',
    memory_date: '2023-09-12',
    time: '17:00',
    location: 'Family Home, Guwahati',
    mood: 'Joyful',
    image_data: SEED_PHOTO_BIRTHDAY,
    images: [SEED_PHOTO_BIRTHDAY],
    audio_data: null,
    audio_duration: null,
    is_favorite: false,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

const memories: MemoryRecord[] = rawSeedMemories.map((raw) => {
  const analyzed = organizeMemoryWithAI({
    title: raw.title,
    description: raw.description,
    category: raw.category,
    memoryDate: raw.memory_date,
    time: raw.time,
    location: raw.location,
    mood: raw.mood,
  });
  return {
    ...raw,
    title: analyzed.title,
    category: analyzed.category,
    mood: analyzed.mood,
    location: raw.location || analyzed.location,
    tags: analyzed.tags,
    people: analyzed.people,
    locations: analyzed.locations,
    events: analyzed.events,
    ai_summary: analyzed.ai_summary,
    embedding: analyzed.embedding,
  };
});

const memoryPermissions: MemoryPermissionRecord[] = [
  {
    id: 1,
    elderly_id: 1,
    caregiver_id: 2,
    access_granted: true,
    emergency_mode_enabled: false,
    updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

const memoryAuditLogs: MemoryAuditLogRecord[] = [
  {
    id: 1,
    elderly_id: 1,
    caregiver_id: 2,
    caregiver_name: 'Dr. Ananya Sharma',
    action: 'VIEW_MEMORIES',
    details: 'Reviewed memory vault timeline during weekly cognitive check-in',
    timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

const memorySearchHistory: MemorySearchHistoryRecord[] = [
  {
    id: 1,
    user_id: 1,
    query: 'Trip to Shillong',
    result_count: 1,
    timestamp: new Date(Date.now() - 86400000).toISOString(),
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
// AI-Assisted Personal Memory Vault Endpoints (/memories)
// ============================================================

function serializeMemory(item: MemoryRecord) {
  const images = item.images && item.images.length > 0
    ? item.images
    : item.image_data
      ? [item.image_data]
      : [];

  return {
    id: item.id,
    title: item.title,
    description: item.description,
    category: item.category,
    memoryDate: item.memory_date,
    time: item.time || null,
    location: item.location || null,
    mood: item.mood || 'Joyful',
    imageData: item.image_data || (images[0] ?? null),
    images,
    audioData: item.audio_data || null,
    audioDuration: item.audio_duration ?? null,
    tags: item.tags || [],
    people: item.people || [],
    locations: item.locations || [],
    events: item.events || [],
    aiSummary: item.ai_summary || '',
    isFavorite: item.is_favorite ?? false,
    clientMutationId: item.client_mutation_id ?? null,
    created_at: item.created_at,
    updated_at: item.updated_at || item.created_at,
  };
}

app.post('/memories', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const {
    title,
    description,
    category,
    memoryDate,
    time,
    location,
    mood,
    imageData,
    images,
    audioData,
    audioDuration,
    isFavorite,
    clientMutationId
  } = req.body;

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

  // Run AI Organization Pipeline
  const analyzed = organizeMemoryWithAI({
    title,
    description: description || '',
    category,
    memoryDate,
    time,
    location,
    mood,
  });

  const photoList: string[] = Array.isArray(images) && images.length > 0
    ? images
    : imageData
      ? [imageData]
      : [];

  const nowIso = new Date().toISOString();

  const newMemory: MemoryRecord = {
    id: nextMemoryId++,
    user_id: user.id,
    title: analyzed.title,
    description: description || '',
    category: analyzed.category,
    memory_date: memoryDate || null,
    time: time || null,
    location: location || analyzed.location,
    mood: analyzed.mood,
    image_data: photoList[0] || null,
    images: photoList,
    audio_data: audioData || null,
    audio_duration: audioDuration ? Number(audioDuration) : null,
    tags: analyzed.tags,
    people: analyzed.people,
    locations: analyzed.locations,
    events: analyzed.events,
    ai_summary: analyzed.ai_summary,
    embedding: analyzed.embedding,
    is_favorite: Boolean(isFavorite),
    client_mutation_id: clientMutationId || null,
    created_at: nowIso,
    updated_at: nowIso,
  };

  memories.unshift(newMemory);

  res.status(201).json({
    message: 'Memory saved successfully with AI organization',
    memory: serializeMemory(newMemory),
  });
});

app.get('/memories', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  let userMemories = memories.filter((m) => m.user_id === user.id);

  const { category, mood, favorite, search } = req.query;

  // Semantic search via GET ?search=
  if (search && typeof search === 'string' && search.trim()) {
    const searchRes = semanticSearchMemories(search.trim(), userMemories);
    return res.json({
      count: searchRes.results.length,
      query: search,
      extracted_entities: searchRes.extracted_entities,
      memories: searchRes.results.map((r) => ({
        ...serializeMemory(r.memory),
        semanticScore: r.score,
        relevanceReason: r.relevance_reason,
      })),
    });
  }

  if (category && category !== 'All') {
    userMemories = userMemories.filter((m) => m.category === category);
  }

  if (mood && mood !== 'All') {
    userMemories = userMemories.filter((m) => m.mood === mood);
  }

  if (favorite === 'true') {
    userMemories = userMemories.filter((m) => m.is_favorite);
  }

  userMemories.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json({
    count: userMemories.length,
    memories: userMemories.map(serializeMemory),
  });
});

// Single memory details
app.get('/memories/:id', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const memoryId = Number(req.params.id);
  const memory = memories.find((m) => m.id === memoryId && m.user_id === user.id);

  if (!memory) {
    return res.status(404).json({ detail: 'Memory not found' });
  }

  const userMemories = memories.filter((m) => m.user_id === user.id);
  const related = findRelatedMemories(memory, userMemories, 3);

  res.json({
    memory: serializeMemory(memory),
    related: related.map((r) => ({
      ...serializeMemory(r.memory),
      similarityScore: r.score,
      reason: r.reason,
    })),
  });
});

// Natural Language & Semantic Search
app.post('/memories/search', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const { query } = req.body;
  const userMemories = memories.filter((m) => m.user_id === user.id);

  const searchRes = semanticSearchMemories(query || '', userMemories);

  if (query && query.trim()) {
    memorySearchHistory.unshift({
      id: nextSearchHistoryId++,
      user_id: user.id,
      query: query.trim(),
      result_count: searchRes.results.length,
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    query: searchRes.query,
    extracted_entities: searchRes.extracted_entities,
    count: searchRes.results.length,
    results: searchRes.results.map((r) => ({
      ...serializeMemory(r.memory),
      semanticScore: r.score,
      relevanceReason: r.relevance_reason,
    })),
  });
});

// Related Memories
app.get('/memories/:id/related', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const memoryId = Number(req.params.id);
  const memory = memories.find((m) => m.id === memoryId && m.user_id === user.id);

  if (!memory) {
    return res.status(404).json({ detail: 'Memory not found' });
  }

  const userMemories = memories.filter((m) => m.user_id === user.id);
  const related = findRelatedMemories(memory, userMemories, 3);

  res.json({
    memoryId,
    related: related.map((r) => ({
      ...serializeMemory(r.memory),
      similarityScore: r.score,
      reason: r.reason,
    })),
  });
});

// Timeline View
app.get('/memories-timeline', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const userMemories = memories
    .filter((m) => m.user_id === user.id)
    .sort((a, b) => {
      const dateA = a.memory_date ? new Date(a.memory_date).getTime() : new Date(a.created_at).getTime();
      const dateB = b.memory_date ? new Date(b.memory_date).getTime() : new Date(b.created_at).getTime();
      return dateB - dateA;
    });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = startOfToday - 7 * 86400000;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

  const groups: {
    today: any[];
    this_week: any[];
    this_month: any[];
    this_year: any[];
    older: any[];
  } = {
    today: [],
    this_week: [],
    this_month: [],
    this_year: [],
    older: [],
  };

  const byYear: Record<string, any[]> = {};
  const allPhotos: any[] = [];

  for (const m of userMemories) {
    const memTime = m.memory_date ? new Date(m.memory_date).getTime() : new Date(m.created_at).getTime();
    const serialized = serializeMemory(m);

    if (memTime >= startOfToday) {
      groups.today.push(serialized);
    } else if (memTime >= startOfWeek) {
      groups.this_week.push(serialized);
    } else if (memTime >= startOfMonth) {
      groups.this_month.push(serialized);
    } else if (memTime >= startOfYear) {
      groups.this_year.push(serialized);
    } else {
      groups.older.push(serialized);
    }

    const dateStr = m.memory_date || m.created_at;
    const year = dateStr ? new Date(dateStr).getFullYear().toString() : 'Earlier';
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(serialized);

    const photos = serialized.images && serialized.images.length > 0
      ? serialized.images
      : (serialized.imageData ? [serialized.imageData] : []);

    photos.forEach((photoUrl: string, pIdx: number) => {
      allPhotos.push({
        id: `${m.id}-photo-${pIdx}`,
        memoryId: m.id,
        photoUrl,
        photoIndex: pIdx,
        totalPhotos: photos.length,
        title: m.title,
        description: m.description,
        category: m.category,
        mood: m.mood,
        location: m.location,
        memoryDate: m.memory_date,
        time: m.time,
        created_at: m.created_at,
      });
    });
  }

  res.json({
    total: userMemories.length,
    groups,
    by_year: byYear,
    all_photos: allPhotos,
  });
});

// Toggle favorite
app.post('/memories/:id/favorite', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const memoryId = Number(req.params.id);
  const memory = memories.find((m) => m.id === memoryId && m.user_id === user.id);

  if (!memory) {
    return res.status(404).json({ detail: 'Memory not found' });
  }

  memory.is_favorite = !memory.is_favorite;
  memory.updated_at = new Date().toISOString();

  res.json({
    message: memory.is_favorite ? 'Memory added to favorites' : 'Memory removed from favorites',
    isFavorite: memory.is_favorite,
    memory: serializeMemory(memory),
  });
});

// Caregiver Sharing & Permissions
app.get('/memories-permissions', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  if (user.role !== 'elderly') {
    return res.status(403).json({ detail: 'Only elderly users manage memory permissions.' });
  }

  const links = caregiverLinks.filter((l) => l.elderly_id === user.id && l.status === 'approved');
  const result = links.map((l) => {
    const caregiver = users.find((u) => u.id === l.caregiver_id);
    const perm = memoryPermissions.find((p) => p.elderly_id === user.id && p.caregiver_id === l.caregiver_id);
    return {
      linkId: l.id,
      caregiverId: l.caregiver_id,
      caregiverName: caregiver?.full_name || 'Caregiver',
      caregiverEmail: caregiver?.email || '',
      accessGranted: perm ? perm.access_granted : true,
      emergencyModeEnabled: perm ? perm.emergency_mode_enabled : false,
      updatedAt: perm?.updated_at || l.created_at,
    };
  });

  res.json({ permissions: result });
});

app.post('/memories-permissions', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  if (user.role !== 'elderly') {
    return res.status(403).json({ detail: 'Only elderly users manage memory permissions.' });
  }

  const { caregiverId, accessGranted, emergencyModeEnabled } = req.body;
  if (!caregiverId) {
    return res.status(400).json({ detail: 'caregiverId is required.' });
  }

  let perm = memoryPermissions.find(
    (p) => p.elderly_id === user.id && p.caregiver_id === Number(caregiverId)
  );

  if (!perm) {
    perm = {
      id: nextPermissionId++,
      elderly_id: user.id,
      caregiver_id: Number(caregiverId),
      access_granted: accessGranted !== undefined ? Boolean(accessGranted) : true,
      emergency_mode_enabled: emergencyModeEnabled !== undefined ? Boolean(emergencyModeEnabled) : false,
      updated_at: new Date().toISOString(),
    };
    memoryPermissions.push(perm);
  } else {
    if (accessGranted !== undefined) perm.access_granted = Boolean(accessGranted);
    if (emergencyModeEnabled !== undefined) perm.emergency_mode_enabled = Boolean(emergencyModeEnabled);
    perm.updated_at = new Date().toISOString();
  }

  res.json({
    message: 'Memory permissions updated successfully.',
    permission: perm,
  });
});

// Audit Logs
app.get('/memories-audit-logs', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const logs = memoryAuditLogs
    .filter((l) => l.elderly_id === user.id || l.caregiver_id === user.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 30);

  res.json({ count: logs.length, logs });
});

// Update Memory
app.put('/memories/:id', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const memoryId = Number(req.params.id);
  const memory = memories.find((m) => m.id === memoryId && m.user_id === user.id);

  if (!memory) {
    return res.status(404).json({ detail: 'Memory not found' });
  }

  const {
    title,
    description,
    category,
    memoryDate,
    time,
    location,
    mood,
    imageData,
    images,
    audioData,
    audioDuration,
    isFavorite,
    clientMutationId
  } = req.body;

  if (clientMutationId && memory.client_mutation_id === clientMutationId) {
    return res.json({
      message: 'Memory update already applied',
      memory: serializeMemory(memory),
      idempotent: true,
    });
  }

  if (description !== undefined || title !== undefined) {
    const analyzed = organizeMemoryWithAI({
      title: title ?? memory.title,
      description: description ?? memory.description,
      category: category ?? memory.category,
      memoryDate: memoryDate ?? memory.memory_date,
      time: time ?? memory.time,
      location: location ?? memory.location,
      mood: mood ?? memory.mood,
    });
    memory.title = analyzed.title;
    memory.category = analyzed.category;
    memory.mood = analyzed.mood;
    memory.location = location ?? analyzed.location;
    memory.tags = analyzed.tags;
    memory.people = analyzed.people;
    memory.locations = analyzed.locations;
    memory.events = analyzed.events;
    memory.ai_summary = analyzed.ai_summary;
    memory.embedding = analyzed.embedding;
  }

  if (description !== undefined) memory.description = description;
  if (memoryDate !== undefined) memory.memory_date = memoryDate;
  if (time !== undefined) memory.time = time;
  if (location !== undefined) memory.location = location;
  if (mood !== undefined) memory.mood = mood;
  if (imageData !== undefined) {
    memory.image_data = imageData;
    if (imageData && (!memory.images || memory.images.length === 0)) {
      memory.images = [imageData];
    }
  }
  if (images !== undefined && Array.isArray(images)) {
    memory.images = images;
    memory.image_data = images[0] || null;
  }
  if (audioData !== undefined) memory.audio_data = audioData;
  if (audioDuration !== undefined) memory.audio_duration = audioDuration ? Number(audioDuration) : null;
  if (isFavorite !== undefined) memory.is_favorite = Boolean(isFavorite);
  if (clientMutationId !== undefined) memory.client_mutation_id = clientMutationId;
  memory.updated_at = new Date().toISOString();

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

  const perm = memoryPermissions.find(
    (p) => p.elderly_id === elderly.id && p.caregiver_id === user.id
  );
  const memoryAccessGranted = perm ? (perm.access_granted || perm.emergency_mode_enabled) : true;
  let accessibleMemories: any[] = [];
  if (memoryAccessGranted) {
    accessibleMemories = memories
      .filter((m) => m.user_id === elderly.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map(serializeMemory);
  }

  res.json({
    link: { id: link.id, status: link.status },
    elderly_user: { id: elderly.id, full_name: elderly.full_name },
    sessions,
    memory_count,
    memory_permission: {
      access_granted: perm ? perm.access_granted : true,
      emergency_mode_enabled: perm ? perm.emergency_mode_enabled : false,
      can_view: memoryAccessGranted,
    },
    memories: accessibleMemories,
    reminders: remindersData,
  });
});

app.get('/caregiver-links/:id/memories', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  if (user.role !== 'caregiver') {
    return res.status(403).json({ detail: 'Only caregiver accounts can access linked elderly memories.' });
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

  const perm = memoryPermissions.find(
    (p) => p.elderly_id === elderly.id && p.caregiver_id === user.id
  );
  const isAllowed = perm ? (perm.access_granted || perm.emergency_mode_enabled) : true;

  if (!isAllowed) {
    return res.status(403).json({
      detail: 'Access to Memory Vault has been kept private by the user.',
      accessGranted: false,
    });
  }

  // Audit Log Entry
  memoryAuditLogs.unshift({
    id: nextAuditLogId++,
    elderly_id: elderly.id,
    caregiver_id: user.id,
    caregiver_name: user.full_name,
    action: perm?.emergency_mode_enabled && !perm.access_granted ? 'EMERGENCY_ACCESS' : 'VIEW_MEMORIES',
    details: 'Viewed Memory Vault stories and photos via Caregiver Dashboard',
    timestamp: new Date().toISOString(),
  });

  const elderlyMemories = memories
    .filter((m) => m.user_id === elderly.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json({
    count: elderlyMemories.length,
    elderly_name: elderly.full_name,
    emergency_mode: perm?.emergency_mode_enabled ?? false,
    memories: elderlyMemories.map(serializeMemory),
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

// ============================================================
// Supported Cognitive Games Registry & Recommendations
// ============================================================

const SUPPORTED_GAMES: Record<
  string,
  {
    gameId: string;
    difficulties: string[];
    defaultDifficulty: string;
    description: string;
  }
> = {
  'Memory Match': {
    gameId: 'memory-match',
    difficulties: ['Standard'],
    defaultDifficulty: 'Standard',
    description: 'Visual card pair recall to exercise short-term visual memory.',
  },
  'Sequence Memory': {
    gameId: 'sequence-memory',
    difficulties: ['Easy', 'Medium', 'Hard'],
    defaultDifficulty: 'Easy',
    description: 'Flashing sequence retention to strengthen working memory and focus.',
  },
  'Object Recall': {
    gameId: 'object-recall',
    difficulties: ['Easy', 'Medium', 'Hard'],
    defaultDifficulty: 'Easy',
    description: 'Item identification and recall to enhance recognition speed.',
  },
  'NER Cultural Recall': {
    gameId: 'ner-cultural-recall',
    difficulties: ['Easy'],
    defaultDifficulty: 'Easy',
    description: 'Familiar cultural landmark and tradition recall from North East India.',
  },
  'Personal Memory Recall': {
    gameId: 'personal-memory',
    difficulties: ['Standard'],
    defaultDifficulty: 'Standard',
    description: 'Personal life story reflection from your personal Memory Vault.',
  },
};

function computeGameRecommendation(userSessions: GameSessionRecord[]) {
  const candidateGames = ['Sequence Memory', 'Memory Match', 'Object Recall', 'NER Cultural Recall'];

  if (!userSessions || userSessions.length === 0) {
    return {
      game: 'Memory Match',
      gameId: 'memory-match',
      difficulty: 'Standard',
      supportedDifficulties: ['Standard'],
      reason: 'Start with Memory Match to begin building your personalized cognitive activity history.',
      performance_status: 'New' as const,
      history_summary: 'No previous sessions recorded in this period.',
    };
  }

  // Calculate detailed performance metrics per candidate game
  const statsByGame: Record<string, any> = {};
  for (const gName of candidateGames) {
    const gSessions = userSessions.filter((s) => s.game === gName);
    const gameInfo = SUPPORTED_GAMES[gName];

    if (gSessions.length === 0) {
      statsByGame[gName] = {
        sessions: 0,
        recentAccuracy: 0,
        overallAccuracy: 0,
        averageMistakes: 0,
        trend: 0,
        lastDifficulty: gameInfo.defaultDifficulty,
        recentAtTier: [],
      };
      continue;
    }

    const recent = gSessions.slice(-3);
    const older = gSessions.slice(0, Math.max(0, gSessions.length - 3));
    const recentAcc = recent.reduce((a, b) => a + Number(b.accuracy || 0), 0) / recent.length;
    const overallAcc = gSessions.reduce((a, b) => a + Number(b.accuracy || 0), 0) / gSessions.length;
    const avgMis = recent.reduce((a, b) => a + Number(b.mistakes || 0), 0) / recent.length;
    const olderAcc = older.length
      ? older.reduce((a, b) => a + Number(b.accuracy || 0), 0) / older.length
      : recentAcc;
    const trend = recentAcc - olderAcc;
    const lastDifficulty = gSessions[gSessions.length - 1].difficulty || gameInfo.defaultDifficulty;
    const tierSessions = gSessions.filter((s) => s.difficulty === lastDifficulty);
    const recentAtTier = tierSessions.slice(-3);

    statsByGame[gName] = {
      sessions: gSessions.length,
      recentAccuracy: Math.round(recentAcc),
      overallAccuracy: Math.round(overallAcc),
      averageMistakes: Math.round(avgMis * 10) / 10,
      trend: Math.round(trend),
      lastDifficulty,
      recentAtTier,
    };
  }

  // Score candidate games by practice benefit & engagement balance
  let targetGame = 'Sequence Memory';
  let highestNeed = -999;
  for (const gName of candidateGames) {
    const s = statsByGame[gName];
    let score = 0;
    if (s.sessions === 0) score += 65;
    else if (s.sessions < 3) score += 45;
    else {
      score += (100 - s.recentAccuracy) * 0.45;
      score += s.averageMistakes * 12;
      if (s.trend < 0) score += Math.abs(s.trend) * 1.8;
    }
    if (score > highestNeed) {
      highestNeed = score;
      targetGame = gName;
    }
  }

  const gameInfo = SUPPORTED_GAMES[targetGame];
  const summary = statsByGame[targetGame];
  const supportedDifficulties = gameInfo.difficulties;

  let recommendedDifficulty = summary.lastDifficulty;
  if (!supportedDifficulties.includes(recommendedDifficulty)) {
    recommendedDifficulty = gameInfo.defaultDifficulty;
  }

  let status: 'Improving' | 'Stable' | 'Needs Practice' | 'New' = 'Stable';
  let reason = '';

  if (summary.sessions === 0) {
    status = 'New';
    recommendedDifficulty = gameInfo.defaultDifficulty;
    reason = `${targetGame} has not been played yet in this period. Starting at ${recommendedDifficulty} level offers an unhurried, engaging start.`;
  } else if (supportedDifficulties.length === 1) {
    recommendedDifficulty = supportedDifficulties[0];
    if (summary.recentAccuracy >= 85) status = 'Improving';
    else if (summary.recentAccuracy < 65) status = 'Needs Practice';
    reason = `Your recent accuracy is ${summary.recentAccuracy}% with ${summary.averageMistakes} mistakes per game. Practicing ${targetGame} will continue building cognitive retention.`;
  } else {
    // Multi-tier games (e.g., Sequence Memory, Object Recall: Easy, Medium, Hard)
    const diffIndex = supportedDifficulties.indexOf(recommendedDifficulty);
    const recentTier = summary.recentAtTier || [];
    const avgAccAtTier = recentTier.length
      ? recentTier.reduce((a: number, b: any) => a + Number(b.accuracy || 0), 0) / recentTier.length
      : summary.recentAccuracy;
    const avgMisAtTier = recentTier.length
      ? recentTier.reduce((a: number, b: any) => a + Number(b.mistakes || 0), 0) / recentTier.length
      : summary.averageMistakes;

    // Rule: Suggest easier levels only when repeated struggles occur (at least 2 sessions with <65% or >=2.5 mistakes). Never react to one bad session!
    const repeatedStruggles = recentTier.length >= 2 && (avgAccAtTier < 65 || avgMisAtTier >= 2.5);

    // Rule: Increase difficulty only after consistently strong results (at least 3 sessions with >=88% accuracy and <=1.0 mistakes).
    const consistentlyStrong = recentTier.length >= 3 && avgAccAtTier >= 88 && avgMisAtTier <= 1.0;

    if (repeatedStruggles && diffIndex > 0) {
      recommendedDifficulty = supportedDifficulties[diffIndex - 1];
      status = 'Needs Practice';
      reason = `Across ${recentTier.length} recent sessions at ${supportedDifficulties[diffIndex]} level, accuracy averaged ${Math.round(avgAccAtTier)}%. Stepping to ${recommendedDifficulty} level provides a comfortable pace to restore confidence without strain.`;
    } else if (consistentlyStrong && diffIndex < supportedDifficulties.length - 1) {
      recommendedDifficulty = supportedDifficulties[diffIndex + 1];
      status = 'Improving';
      reason = `You achieved ${Math.round(avgAccAtTier)}% average accuracy and ${avgMisAtTier} mistakes across ${recentTier.length} consecutive sessions at ${supportedDifficulties[diffIndex]} level. You are ready to advance to ${recommendedDifficulty} level!`;
    } else {
      status = summary.trend >= 4 ? 'Improving' : summary.trend <= -4 ? 'Needs Practice' : 'Stable';
      reason = `Your performance is steady at ${recommendedDifficulty} level (${Math.round(avgAccAtTier)}% recent accuracy, ${avgMisAtTier} mistakes). Maintaining this level preserves steady cognitive rhythm.`;
    }
  }

  return {
    game: targetGame,
    gameId: gameInfo.gameId,
    difficulty: recommendedDifficulty,
    supportedDifficulties,
    reason,
    performance_status: status,
    history_summary: `${summary.sessions} sessions recorded, recent accuracy ${summary.recentAccuracy}%.`,
  };
}

// ============================================================
// Cognitive Progress Insights Engine
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

  const personalBestAccuracy = totalCompleted
    ? Math.max(...periodSessions.map((s) => Number(s.accuracy || 0)))
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

  // Compute adaptive game recommendation based on actual sessions
  const recommendation = computeGameRecommendation(
    periodSessions.length > 0 ? periodSessions : userSessions
  );

  const disclaimer =
    'Cognitive activity trends describe recorded game performance and participation only. They are not a medical assessment or diagnosis.';

  return {
    period,
    daysLimit,
    overview: {
      totalCompleted,
      avgAccuracy,
      avgMistakes,
      avgTime,
      personalBestAccuracy,
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
    recommendation,
    disclaimer,
  };
}

// ------------------------------------------------------------
// Fallback Assistive Cognitive Analysis Generator
// ------------------------------------------------------------
function generateFallbackAiAnalysis(insights: any, userName: string) {
  const { overview, baselineComparison, sustainedChanges, gameBreakdown, recommendation } = insights;

  let summary = '';
  if (overview.totalCompleted === 0) {
    summary = `Welcome, ${userName}! No completed sessions were recorded in this period. Engaging with gentle cognitive activities helps maintain memory vitality and starts building your personal baseline.`;
  } else if (!baselineComparison.isReliable) {
    summary = `Great start, ${userName}! You completed ${overview.totalCompleted} activity sessions with an average accuracy of ${overview.avgAccuracy}%. You are actively establishing your personalized baseline.`;
  } else if (baselineComparison.overallStatus === 'improving') {
    summary = `Commendable progress, ${userName}! Your recent average accuracy of ${baselineComparison.recentAccuracy}% shows positive gains over your ${baselineComparison.baselineAccuracy}% baseline (+${baselineComparison.accuracyDiff}%), reflecting focused recall and regular practice.`;
  } else if (baselineComparison.overallStatus === 'declining') {
    summary = `Steady engagement recorded, ${userName}. Your recent sessions averaged ${baselineComparison.recentAccuracy}% accuracy compared with your personal baseline of ${baselineComparison.baselineAccuracy}%. Daily performance naturally fluctuates with rest and time of day.`;
  } else {
    summary = `Consistent engagement, ${userName}! Your cognitive activities remain solidly in rhythm with your historical baseline of ${baselineComparison.baselineAccuracy}%, averaging ${overview.sessionsPerWeek} sessions per week.`;
  }

  const strengths: string[] = [];
  const sortedGames = [...gameBreakdown].sort((a, b) => b.avgAccuracy - a.avgAccuracy);
  if (sortedGames.length > 0 && sortedGames[0].avgAccuracy >= 80) {
    strengths.push(
      `High accuracy in ${sortedGames[0].game} (${sortedGames[0].avgAccuracy}%), showing strong visual pattern recognition.`
    );
  }
  if (overview.avgMistakes <= 1.5 && overview.totalCompleted > 0) {
    strengths.push(
      `Thoughtful, deliberate pacing with an average of only ${overview.avgMistakes} mistakes per completed round.`
    );
  }
  if (overview.sessionsPerWeek >= 2) {
    strengths.push(
      `Consistent weekly routine (${overview.sessionsPerWeek} sessions/week), which is key for cognitive maintenance.`
    );
  }
  if (strengths.length < 2) {
    strengths.push('Regular engagement with cognitive activities, supporting healthy mental stimulation.');
    strengths.push('Willingness to explore different memory exercises at a comfortable pace.');
  }

  const areasToPractice: string[] = [];
  const lowerGames = [...gameBreakdown].sort((a, b) => a.avgAccuracy - b.avgAccuracy);
  if (lowerGames.length > 0 && lowerGames[0].avgAccuracy < 80) {
    areasToPractice.push(
      `Take extra time when playing ${lowerGames[0].game}. Pausing for a few moments before tapping helps reduce accidental errors.`
    );
  } else {
    areasToPractice.push('Take relaxed breaths between puzzle stages to maintain steady focus without eye strain.');
  }
  if (overview.avgTime > 60) {
    areasToPractice.push('There is never any rush—continue focusing on accuracy over speed for the best memory benefits.');
  } else {
    areasToPractice.push('Maintain regular hydration and daylight when practicing memory games to maximize alertness.');
  }

  let progressTrends = '';
  if (!baselineComparison.isReliable) {
    progressTrends = `Baseline accumulating. ${overview.totalCompleted} session(s) recorded in this period. Once 5 or more sessions are logged, Cognicare compares your recent sessions against your established rhythm.`;
  } else {
    progressTrends = `Your recent accuracy is ${baselineComparison.recentAccuracy}% vs. a personal baseline of ${baselineComparison.baselineAccuracy}% (${baselineComparison.accuracyDiff >= 0 ? '+' : ''}${baselineComparison.accuracyDiff}% change). Average mistakes shifted from ${baselineComparison.baselineMistakes} to ${baselineComparison.recentMistakes} per game.`;
    if (sustainedChanges.length > 0) {
      progressTrends += ` Observed note: ${sustainedChanges[0].title}.`;
    }
  }

  const personalizedPracticePlan = [
    {
      day_or_frequency: '2–3 Days a Week',
      recommended_game: recommendation.game,
      recommended_difficulty: recommendation.difficulty,
      focus_tip: 'Play 1 to 2 rounds in the morning when you feel most refreshed.',
    },
    {
      day_or_frequency: 'Midweek Focus',
      recommended_game: recommendation.game === 'Sequence Memory' ? 'Memory Match' : 'Sequence Memory',
      recommended_difficulty: recommendation.game === 'Sequence Memory' ? 'Standard' : 'Easy',
      focus_tip: 'Whisper patterns softly to yourself to activate dual visual and auditory memory pathways.',
    },
    {
      day_or_frequency: 'Weekend Reflection',
      recommended_game: 'NER Cultural Recall',
      recommended_difficulty: 'Easy',
      focus_tip: 'Enjoy the rich cultural memories and traditions at a relaxed, unhurried pace.',
    },
  ];

  return {
    summary,
    strengths,
    areas_to_practice: areasToPractice,
    progress_trends: progressTrends,
    personalized_practice_plan: personalizedPracticePlan,
    is_ai_powered: false,
    model: 'assistive-clinical-engine',
    generated_at: new Date().toISOString(),
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
// POST /cognitive-insights/ai-analysis — Gemini AI Performance Analysis
// ------------------------------------------------------------
app.post('/cognitive-insights/ai-analysis', authenticateToken, async (req: AuthRequest, res) => {
  const user = req.user!;
  const { period = '30d', game, difficulty } = req.body || {};
  const validPeriods = ['7d', '30d', '90d', 'all'];
  const sanitizedPeriod = validPeriods.includes(period) ? period : '30d';

  const insights = calculateCognitiveProgressInsights(user.id, sanitizedPeriod, game, difficulty);

  // Check in-memory cache
  const cacheKey = `${user.id}_${sanitizedPeriod}_${insights.overview.totalCompleted}_${insights.overview.avgAccuracy}_${insights.recommendation.game}_${insights.recommendation.difficulty}`;
  if (aiAnalysisCache.has(cacheKey)) {
    const cached = aiAnalysisCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < 3600000) {
      return res.json({
        ...cached.data,
        cached: true,
      });
    }
  }

  let aiResult = null;
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `You are a clinical cognitive wellness analyst for the NeuroCare elder-care platform.
Analyze the actual gameplay performance metrics for an older adult named ${user.full_name || 'User'} over the ${sanitizedPeriod === '7d' ? 'last 7 days' : sanitizedPeriod === '30d' ? 'last 30 days' : sanitizedPeriod === '90d' ? 'last 90 days' : 'all recorded history'}:
- Total Completed Game Sessions: ${insights.overview.totalCompleted}
- Overall Average Accuracy: ${insights.overview.avgAccuracy}%
- Average Mistakes Per Session: ${insights.overview.avgMistakes}
- Average Completion Duration: ${insights.overview.avgTime > 0 ? `${insights.overview.avgTime}s` : 'not recorded'}
- Personal Best Accuracy: ${insights.overview.personalBestAccuracy}%
- Weekly Participation: ${insights.overview.sessionsPerWeek} sessions/week across ${insights.overview.activeDaysCount} active days
- Most Played Activity: ${insights.overview.mostPlayedGame}
- Baseline Status: ${
        insights.baselineComparison.isReliable
          ? `Baseline accuracy ${insights.baselineComparison.baselineAccuracy}%, Recent accuracy ${insights.baselineComparison.recentAccuracy}% (${insights.baselineComparison.accuracyDiff >= 0 ? '+' : ''}${insights.baselineComparison.accuracyDiff}%), Status: ${insights.baselineComparison.overallStatus}`
          : 'Baseline accumulating (fewer than 5 sessions in window)'
      }
- Sustained Changes: ${JSON.stringify(insights.sustainedChanges.map((c: any) => ({ title: c.title, magnitude: c.magnitude })))}
- Activity Breakdown: ${JSON.stringify(insights.gameBreakdown.map((g: any) => ({ game: g.game, sessions: g.sessionCount, avgAcc: g.avgAccuracy, avgMis: g.avgMistakes })))}
- Difficulty Breakdown: ${JSON.stringify(insights.difficultyBreakdown.map((d: any) => ({ difficulty: d.difficulty, sessions: d.sessionCount, avgAcc: d.avgAccuracy })))}
- Algorithmic Recommendation: ${insights.recommendation.game} at ${insights.recommendation.difficulty} (${insights.recommendation.reason})

Requirements:
1. summary: A warm, clear, elder-friendly 2-3 sentence overview of their engagement and cognitive rhythm.
2. strengths: Array of 2-4 specific cognitive strengths based directly on their recorded scores (e.g. pattern recognition, patient pace).
3. areas_to_practice: Array of 1-3 gentle, constructive areas to focus on without frustration or alarm.
4. progress_trends: Clear explanation comparing recent performance with their baseline and sustained changes.
5. personalized_practice_plan: Array of 3 realistic, gentle scheduled sessions for the week ahead (day_or_frequency, recommended_game, recommended_difficulty, focus_tip).
Never invent sessions, diagnose medical conditions, or use clinical jargon.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              areas_to_practice: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              progress_trends: { type: Type.STRING },
              personalized_practice_plan: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    day_or_frequency: { type: Type.STRING },
                    recommended_game: { type: Type.STRING },
                    recommended_difficulty: { type: Type.STRING },
                    focus_tip: { type: Type.STRING },
                  },
                  required: ['day_or_frequency', 'recommended_game', 'recommended_difficulty', 'focus_tip'],
                },
              },
            },
            required: ['summary', 'strengths', 'areas_to_practice', 'progress_trends', 'personalized_practice_plan'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.summary && Array.isArray(parsed.strengths)) {
        aiResult = {
          ...parsed,
          is_ai_powered: true,
          model: 'gemini-3.8-flash',
          generated_at: new Date().toISOString(),
        };
      }
    } catch (err: any) {
      console.warn('[Gemini AI Analysis] Fallback activated due to API error:', err?.message || err);
    }
  }

  // Graceful rule-based fallback if Gemini API key is missing or failed
  if (!aiResult) {
    aiResult = generateFallbackAiAnalysis(insights, user.full_name);
  }

  aiAnalysisCache.set(cacheKey, { timestamp: Date.now(), data: aiResult });
  res.json(aiResult);
});

// ------------------------------------------------------------
// Caregiver Report Permissions Endpoints
// ------------------------------------------------------------
app.get('/caregiver-report-permissions', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  if (user.role !== 'elderly') {
    return res.status(403).json({ detail: 'Only elderly users manage progress report permissions.' });
  }

  const approvedLinks = caregiverLinks.filter(
    (l) => l.elderly_id === user.id && l.status === 'approved'
  );

  const permissions = approvedLinks.map((l) => {
    const caregiver = users.find((u) => u.id === l.caregiver_id);
    const perm = caregiverReportPermissions.find(
      (p) => p.elderly_id === user.id && p.caregiver_id === l.caregiver_id
    );

    return {
      linkId: l.id,
      caregiverId: l.caregiver_id,
      caregiverName: caregiver?.full_name || 'Caregiver',
      caregiverEmail: caregiver?.email || '',
      reportAccessGranted: perm ? perm.report_access_granted : true,
      updatedAt: perm?.updated_at || l.created_at,
    };
  });

  res.json({ permissions });
});

app.post('/caregiver-report-permissions', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  if (user.role !== 'elderly') {
    return res.status(403).json({ detail: 'Only elderly users manage progress report permissions.' });
  }

  const { caregiverId, accessGranted } = req.body;
  if (!caregiverId) {
    return res.status(400).json({ detail: 'caregiverId is required.' });
  }

  let perm = caregiverReportPermissions.find(
    (p) => p.elderly_id === user.id && p.caregiver_id === Number(caregiverId)
  );

  if (!perm) {
    perm = {
      id: nextReportPermissionId++,
      elderly_id: user.id,
      caregiver_id: Number(caregiverId),
      report_access_granted: accessGranted !== undefined ? Boolean(accessGranted) : true,
      updated_at: new Date().toISOString(),
    };
    caregiverReportPermissions.push(perm);
  } else {
    perm.report_access_granted = Boolean(accessGranted);
    perm.updated_at = new Date().toISOString();
  }

  res.json({
    message: perm.report_access_granted
      ? 'Caregiver progress report sharing enabled.'
      : 'Caregiver progress report sharing paused.',
    permission: perm,
  });
});

// ------------------------------------------------------------
// GET /caregiver-links/:id/progress-report — Caregiver Progress Report
// ------------------------------------------------------------
app.get('/caregiver-links/:id/progress-report', authenticateToken, async (req: AuthRequest, res) => {
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

  // Check consent permission
  const perm = caregiverReportPermissions.find(
    (p) => p.elderly_id === elderly.id && p.caregiver_id === user.id
  );
  if (perm && !perm.report_access_granted) {
    return res.status(403).json({
      detail: 'Access to the cognitive progress report has not been granted by the user.',
      accessGranted: false,
    });
  }

  const period = typeof req.query.period === 'string' ? req.query.period : '30d';
  const game = typeof req.query.game === 'string' ? req.query.game : undefined;
  const difficulty = typeof req.query.difficulty === 'string' ? req.query.difficulty : undefined;
  const validPeriods = ['7d', '30d', '90d', 'all'];
  const sanitizedPeriod = validPeriods.includes(period) ? period : '30d';

  const insights = calculateCognitiveProgressInsights(elderly.id, sanitizedPeriod, game, difficulty);
  const aiAnalysis = generateFallbackAiAnalysis(insights, elderly.full_name);

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
    ai_analysis: aiAnalysis,
    ...insights,
  });
});

// ------------------------------------------------------------
// GET /my-progress-report — Shareable/Printable Report for Elderly User
// ------------------------------------------------------------
app.get('/my-progress-report', authenticateToken, async (req: AuthRequest, res) => {
  const user = req.user!;
  const period = typeof req.query.period === 'string' ? req.query.period : '30d';
  const validPeriods = ['7d', '30d', '90d', 'all'];
  const sanitizedPeriod = validPeriods.includes(period) ? period : '30d';

  const insights = calculateCognitiveProgressInsights(user.id, sanitizedPeriod);
  const aiAnalysis = generateFallbackAiAnalysis(insights, user.full_name);

  res.json({
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
    },
    reporting_period: sanitizedPeriod,
    ai_analysis: aiAnalysis,
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

  const rec = computeGameRecommendation(userSessions);

  res.json({
    recommendation: {
      game: rec.game,
      gameId: rec.gameId,
      difficulty: rec.difficulty,
      supportedDifficulties: rec.supportedDifficulties,
      reason: rec.reason,
      performance_status: rec.performance_status,
    },
    based_on_sessions: userSessions.length,
    engine: 'adaptive-cognitive-v4',
    personalization: 'performance-based',
    confidence: selected.confidence,
    game_summaries: summaries,
  });
});

// ============================================================
// Voice Companion AI Conversational Endpoint
// ============================================================

app.post('/voice-companion/chat', async (req: Request, res: Response) => {
  const { message = '', language = 'en-IN' } = req.body || {};
  const cleanMessage = String(message).trim();

  if (!cleanMessage) {
    return res.status(400).json({ detail: 'Message cannot be empty.' });
  }

  const langCode = String(language).toLowerCase();
  const shortLang = langCode.startsWith('hi') ? 'hi' : langCode.startsWith('as') ? 'as' : 'en';

  // Check optional auth for personalized greeting
  let userName = '';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded: any = jwt.verify(token, JWT_SECRET);
      if (decoded?.user_id) {
        const found = users.find((u) => u.id === decoded.user_id);
        if (found) userName = found.full_name;
      }
    } catch {
      // Ignore invalid token in optional context
    }
  }

  // Check for navigation commands first
  const lower = cleanMessage.toLowerCase();
  let navTarget: { targetPage: string; gameId?: string; reply: Record<string, string> } | null = null;

  if (
    lower.includes('memory match') ||
    lower.includes('card match') ||
    lower.includes('कार्ड मैच') ||
    lower.includes('মেমৰি মেচ')
  ) {
    navTarget = {
      targetPage: 'games',
      gameId: 'memory-match',
      reply: {
        en: 'Opening Memory Match card pair activity.',
        hi: 'मेमोरी मैच कार्ड गेम शुरू किया जा रहा है।',
        as: 'মেমৰি মেচ কাৰ্ড খেল খোলা হৈছে।',
      },
    };
  } else if (
    lower.includes('sequence memory') ||
    lower.includes('सीक्वेंस') ||
    lower.includes('क्रम स्मृति') ||
    lower.includes('ক্ৰম স্মৃতি')
  ) {
    navTarget = {
      targetPage: 'games',
      gameId: 'sequence-memory',
      reply: {
        en: 'Starting Sequence Memory pattern exercise.',
        hi: 'सीक्वेंस मेमोरी खेल शुरू किया जा रहा है।',
        as: 'ক্ৰম স্মৃতি খেল আৰম্ভ কৰা হৈছে।',
      },
    };
  } else if (
    lower.includes('object recall') ||
    lower.includes('वस्तु स्मरण') ||
    lower.includes('ऑब्जेक्ट') ||
    lower.includes('বস্তু মনত')
  ) {
    navTarget = {
      targetPage: 'games',
      gameId: 'object-recall',
      reply: {
        en: 'Opening Object Recall recognition game.',
        hi: 'ऑब्जेक्ट रिकॉल खेल खोला जा रहा है।',
        as: 'বস্তু মনত পেলোৱা খেল খোলা হৈছে।',
      },
    };
  } else if (
    lower.includes('cultural recall') ||
    lower.includes('सांस्कृतिक') ||
    lower.includes('नॉर्थ ईस्ट') ||
    lower.includes('সাংস্কৃতিক')
  ) {
    navTarget = {
      targetPage: 'games',
      gameId: 'ner-cultural-recall',
      reply: {
        en: 'Opening Cultural Recall of North East India traditions.',
        hi: 'पूर्वोत्तर भारत की सांस्कृतिक यादों का खेल शुरू किया जा रहा है।',
        as: 'উত্তৰ-পূব ভাৰতৰ সাংস্কৃতিক স্মৃতিৰ খেল খোলা হৈছে।',
      },
    };
  } else if (
    lower.includes('personal memory') ||
    lower.includes('व्यक्तिगत याद') ||
    lower.includes('ব্যক্তিগত স্মৃতি')
  ) {
    navTarget = {
      targetPage: 'games',
      gameId: 'personal-memory',
      reply: {
        en: 'Opening your personal Memory Recall reflections.',
        hi: 'आपकी व्यक्तिगत यादों का खेल खोला जा रहा है।',
        as: 'আপোনাৰ व्यक्तिगत স্মৃতিৰ খেল খোলা হৈছে।',
      },
    };
  } else if (
    lower.includes('home') ||
    lower.includes('dashboard') ||
    lower.includes('होम') ||
    lower.includes('मुख्य पृष्ठ') ||
    lower.includes('মুখ্য পৃষ্ঠা')
  ) {
    navTarget = {
      targetPage: 'dashboard',
      reply: {
        en: 'Taking you to the Home Dashboard.',
        hi: 'आपको मुख्य डैशबोर्ड पर ले जाया जा रहा है।',
        as: 'আপোনাক মুখ্য ডেচবৰ্ডলৈ লৈ যোৱা হৈছে।',
      },
    };
  } else if (
    lower.includes('game') ||
    lower.includes('play') ||
    lower.includes('खेल') ||
    lower.includes('खेलो') ||
    lower.includes('খেল')
  ) {
    navTarget = {
      targetPage: 'games',
      reply: {
        en: 'Opening your cognitive activities and games.',
        hi: 'आपके संज्ञानात्मक खेल खोले जा रहे हैं।',
        as: 'আপোনাৰ কগনিটিভ খেলসমূহ খোলা হৈছে।',
      },
    };
  } else if (
    lower.includes('progress') ||
    lower.includes('performance') ||
    lower.includes('score') ||
    lower.includes('प्रगति') ||
    lower.includes('प्रदर्शन') ||
    lower.includes('অগ্ৰগতি') ||
    lower.includes('প্ৰদৰ্শন')
  ) {
    navTarget = {
      targetPage: 'performance',
      reply: {
        en: 'Opening your cognitive progress insights and trend charts.',
        hi: 'आपकी प्रगति रिपोर्ट और चार्ट खोले जा रहे हैं।',
        as: 'আপোনাৰ অগ্ৰগতি আৰু প্ৰদৰ্শন ৰিপৰ্ট খোলা হৈছে।',
      },
    };
  } else if (
    lower.includes('memories') ||
    lower.includes('memory vault') ||
    lower.includes('यादें') ||
    lower.includes('पुराणी यादें') ||
    lower.includes('স্মৃতি')
  ) {
    navTarget = {
      targetPage: 'memories',
      reply: {
        en: 'Opening your personal Memory Vault.',
        hi: 'आपकी यादों का खजाना खोला जा रहा है।',
        as: 'আপোনাৰ স্মৃতি ভঁৰাল খোলা হৈছে।',
      },
    };
  } else if (
    lower.includes('reminder') ||
    lower.includes('medicine') ||
    lower.includes('रिमाइंडर') ||
    lower.includes('दवा') ||
    lower.includes('ৰিমাইণ্ডাৰ') ||
    lower.includes('ঔষধ')
  ) {
    navTarget = {
      targetPage: 'reminders',
      reply: {
        en: 'Opening your daily reminders and schedule.',
        hi: 'आपके दैनिक रिमाइंडर और समय-सारणी खोली जा रही है।',
        as: 'আপোনাৰ দৈনন্দিন ৰিমাইণ্ডাৰসমূহ খোলা হৈছে।',
      },
    };
  } else if (
    lower.includes('caregiver') ||
    lower.includes('केयरगिवर') ||
    lower.includes('কেয়াৰগিভাৰ')
  ) {
    navTarget = {
      targetPage: 'caregiver',
      reply: {
        en: 'Opening Caregiver Dashboard.',
        hi: 'केयरगिवर डैशबोर्ड खोला जा रहा है।',
        as: 'কেয়াৰগিভাৰ ডেচবৰ্ড খোলা হৈছে।',
      },
    };
  }

  if (navTarget) {
    const replyText = navTarget.reply[shortLang] || navTarget.reply.en;
    return res.json({
      action: 'navigate',
      targetPage: navTarget.targetPage,
      gameId: navTarget.gameId || null,
      reply: replyText,
      is_ai_powered: false,
    });
  }

  // Conversational response via Gemini or Assistive Engine
  const apiKey = process.env.GEMINI_API_KEY;
  let replyText = '';
  let isAi = false;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const langPrompt =
        shortLang === 'hi'
          ? 'in conversational, elder-friendly Hindi (Devanagari script)'
          : shortLang === 'as'
          ? 'in conversational, elder-friendly Assamese (Bengali/Assamese script)'
          : 'in warm, simple, elder-friendly English';

      const prompt = `You are Cognicare Voice Companion, a gentle, kind, and supportive digital assistant for an older adult named ${userName || 'friend'} in Northeast India.
The user said: "${cleanMessage}".
Reply directly ${langPrompt}.
Guidelines:
- Keep the response to exactly 1 or 2 calm, encouraging sentences.
- Speak naturally so it sounds clear and compassionate when read aloud via speech synthesis.
- Never use markdown formatting (no asterisks, no bullets, no headers, no quotes).
- Do not use emojis or technical jargon.
- If they ask for help, explain gently that they can ask you to open games, show their progress, look at memories, or check reminders.`;

      const geminiRes = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      const raw = geminiRes.text?.trim();
      if (raw) {
        replyText = raw.replace(/[*#_`]/g, '').trim();
        isAi = true;
      }
    } catch (err: any) {
      console.warn('[Voice Companion AI] Gemini chat fallback:', err?.message || err);
    }
  }

  // Fallback conversational responses
  if (!replyText) {
    if (
      lower.includes('hello') ||
      lower.includes('hi') ||
      lower.includes('नमस्ते') ||
      lower.includes('নমস্কাৰ') ||
      lower.includes('morning')
    ) {
      replyText =
        shortLang === 'hi'
          ? `नमस्ते ${userName ? userName + ' ' : ''}! आज आपका दिन कैसा जा रहा है? मैं आपके साथ हूँ।`
          : shortLang === 'as'
          ? `নমস্কাৰ ${userName ? userName + ' ' : ''}! আজি আপোনাৰ দিনটো কেনে চলিছে? মই আপোনাৰ সহায়ৰ বাবে সাজু আছোঁ।`
          : `Hello ${userName ? userName : 'there'}! How is your day going? I am right here with you.`;
    } else if (
      lower.includes('how are you') ||
      lower.includes('कैसे हो') ||
      lower.includes('कहा हो') ||
      lower.includes('কেনে আছ')
    ) {
      replyText =
        shortLang === 'hi'
          ? 'मैं बहुत अच्छा हूँ और आपकी मदद के लिए हमेशा तैयार हूँ। आप आज कैसा महसूस कर रहे हैं?'
          : shortLang === 'as'
          ? 'মই ভালে আছোঁ আৰু আপোনাক সহায় কৰিবলৈ সাজু। আপুনি আজি কেনে অনুভৱ কৰিছে?'
          : 'I am doing wonderful, thank you for asking. How are you feeling today?';
    } else if (
      lower.includes('thank') ||
      lower.includes('धन्यवाद') ||
      lower.includes('शुक्रिया') ||
      lower.includes('ধন্যবাদ')
    ) {
      replyText =
        shortLang === 'hi'
          ? 'आपका बहुत स्वागत है। मुझे आपकी सहायता करके हमेशा खुशी होती है।'
          : shortLang === 'as'
          ? 'আপোনাক বহুত ধন্যবাদ। আপোনাৰ সহায় কৰিবলৈ পাই মই সদায় আনন্দিত।'
          : 'You are very welcome. It is always my pleasure to assist you.';
    } else if (
      lower.includes('who are you') ||
      lower.includes('who are') ||
      lower.includes('तुम कौन') ||
      lower.includes('आप कौन') ||
      lower.includes('আপুনি কোন')
    ) {
      replyText =
        shortLang === 'hi'
          ? 'मैं कॉग्निकेयर का आवाज सहायक हूँ। मैं आपको खेल शुरू करने, यादें देखने और रिमाइंडर में मदद करता हूँ।'
          : shortLang === 'as'
          ? 'মই Cognicare কণ্ঠ সংগী। মই আপোনাক খেল খেলা, স্মৃতি চোৱা আৰু ৰিমাইণ্ডাৰত সহায় কৰোঁ।'
          : 'I am your Cognicare Voice Companion. I can help you play memory games, view your progress, explore memories, or check reminders.';
    } else {
      replyText =
        shortLang === 'hi'
          ? 'मैं आपकी बात समझ रहा हूँ। आप मुझसे खेल खेलने, अपनी प्रगति देखने या यादें खोलने के लिए कह सकते हैं।'
          : shortLang === 'as'
          ? 'মই আপোনাৰ কথা বুজি পাইছোঁ। আপুনি মোক খেল আৰম্ভ কৰিবলৈ, অগ্ৰগতি চাবলৈ বা স্মৃতি খুলিবলৈ ক’ব পাৰে।'
          : 'I hear you. You can ask me to play a memory game, show your progress, view your memories, or check your reminders.';
    }
  }

  res.json({
    reply: replyText,
    action: 'chat',
    is_ai_powered: isAi,
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
      server: { middlewareMode: true, allowedHosts: true },
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
