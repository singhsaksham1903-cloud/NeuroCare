import express from 'express';
import crypto from 'node:crypto';
import path from 'node:path';

// ============================================================
// Types & Interfaces
// ============================================================

interface User {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role: 'elderly' | 'caregiver';
  is_active: boolean;
  created_at: string;
}

interface CaregiverLink {
  id: number;
  caregiver_id: number;
  elderly_id: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface GameSession {
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

interface MemoryVaultItem {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category: string;
  memory_date: string | null;
  memory_time?: string | null;
  location?: string | null;
  mood?: string | null;
  image_data: string | null;
  images?: string[];
  audio_data?: string | null;
  tags: string[];
  people: string[];
  event_type?: string | null;
  summary?: string | null;
  is_favorite: boolean;
  embedding: number[];
  client_mutation_id?: string | null;
  created_at: string;
  updated_at?: string;
}

interface MemoryPermission {
  id: number;
  elderly_id: number;
  caregiver_id: number;
  can_view: boolean;
  can_listen: boolean;
  emergency_mode_allowed: boolean;
  granted_at: string;
  updated_at: string;
}

interface MemoryAuditLog {
  id: number;
  elderly_id: number;
  accessor_id: number;
  accessor_name: string;
  accessor_role: string;
  memory_id?: number | null;
  action: 'viewed_memory' | 'viewed_vault' | 'searched_vault' | 'emergency_access' | 'permission_granted' | 'permission_revoked' | 'permission_updated';
  emergency: boolean;
  reason?: string | null;
  timestamp: string;
}

interface MemorySearchHistory {
  id: number;
  user_id: number;
  query: string;
  result_count: number;
  timestamp: string;
}

interface Reminder {
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

// ============================================================
// Lightweight AI NLP & Semantic Vector Engine
// ============================================================

const KNOWN_PEOPLE = [
  'rahul', 'priya', 'sarah', 'elena', 'amit', 'sunita', 'maya', 'vikram',
  'arjun', 'rohan', 'kavita', 'ramesh', 'deepa', 'ananya', 'david', 'riya',
  'daughter', 'son', 'granddaughter', 'grandson', 'mother', 'father',
  'sister', 'brother', 'husband', 'wife', 'uncle', 'aunt', 'grandma', 'grandpa'
];

const KNOWN_LOCATIONS = [
  'shillong', 'guwahati', 'assam', 'meghalaya', 'kaziranga', 'tezpur',
  'delhi', 'mumbai', 'kolkata', 'bangalore', 'veranda', 'garden', 'lake',
  'river', 'temple', 'park', 'school', 'home', 'hospital', 'hills', 'mountains'
];

const KNOWN_EVENTS = [
  'diwali', 'bihu', 'durga puja', 'wedding', 'birthday', 'anniversary',
  'graduation', 'picnic', 'trip', 'vacation', 'holiday', 'festival', 'holi',
  'eid', 'christmas', 'new year'
];

const SEMANTIC_CLUSTERS = [
  // 0: Family / Relationships
  ['family', 'daughter', 'son', 'children', 'grandchildren', 'husband', 'wife', 'mother', 'father', 'sister', 'brother', 'parents'],
  // 1: Wedding & Ceremonies
  ['wedding', 'marriage', 'anniversary', 'bride', 'groom', 'ceremony', 'shehnai', 'vows'],
  // 2: Birthday & Milestones
  ['birthday', 'born', 'celebrating', 'cake', 'candles', 'party', 'years old', 'milestone', 'graduation'],
  // 3: Travel & Journeys
  ['travel', 'trip', 'journey', 'visited', 'vacation', 'road trip', 'shillong', 'guwahati', 'assam', 'meghalaya', 'hills', 'flight', 'hotel'],
  // 4: Festivals & Celebrations
  ['festival', 'diwali', 'bihu', 'puja', 'holi', 'diyas', 'sweets', 'lights', 'celebration', 'tradition'],
  // 5: Nature & Outdoors
  ['garden', 'roses', 'flowers', 'trees', 'lake', 'river', 'veranda', 'park', 'nature', 'sunlight', 'breeze', 'monsoon'],
  // 6: Food & Baking
  ['cooking', 'cookies', 'baking', 'tea', 'lemonade', 'lunch', 'dinner', 'recipe', 'cardamom', 'kitchen'],
  // 7: Health & Care
  ['health', 'doctor', 'walk', 'stretching', 'hospital', 'care', 'routine', 'wellness'],
  // 8: Childhood & Nostalgia
  ['childhood', 'school', 'younger', 'old times', 'memories', 'past', 'vintage', 'grew up', 'nostalgia'],
  // 9: Joy & Excitement
  ['happy', 'joy', 'laughter', 'smile', 'excited', 'wonderful', 'fun', 'delight', 'cheerful'],
  // 10: Peace & Serenity
  ['peaceful', 'quiet', 'calm', 'serene', 'gentle', 'relax', 'soothing'],
  // 11: Gratitude & Love
  ['grateful', 'blessed', 'thankful', 'love', 'cherished', 'warmth', 'kindness'],
];

function generateSemanticEmbedding(text: string): number[] {
  const lower = text.toLowerCase();
  const vector = new Array(64).fill(0);

  // Score semantic clusters (positions 0-11)
  for (let i = 0; i < SEMANTIC_CLUSTERS.length; i++) {
    const keywords = SEMANTIC_CLUSTERS[i];
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score += 1.5;
    }
    vector[i] = score;
  }

  // Word token n-gram hashing (positions 12-63)
  const words = lower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2);
  for (const word of words) {
    let hash = 0;
    for (let c = 0; c < word.length; c++) {
      hash = (hash * 31 + word.charCodeAt(c)) >>> 0;
    }
    const idx = 12 + (hash % 52);
    vector[idx] += 1.0;
  }

  // L2 Normalize vector
  let norm = 0;
  for (let i = 0; i < vector.length; i++) norm += vector[i] * vector[i];
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < vector.length; i++) vector[i] = Number((vector[i] / norm).toFixed(4));
  } else {
    vector[0] = 1.0;
  }

  return vector;
}

function calculateCosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return Math.max(0, Math.min(1, dot));
}

function extractMemoryEntities(
  description: string,
  providedTitle?: string,
  providedCategory?: string,
  providedLocation?: string,
  providedMood?: string
) {
  const combined = `${providedTitle || ''} ${description} ${providedLocation || ''}`.toLowerCase();

  // Extract People
  const detectedPeople: string[] = [];
  for (const person of KNOWN_PEOPLE) {
    const regex = new RegExp(`\\b${person}\\b`, 'i');
    if (regex.test(combined)) {
      const capitalized = person.charAt(0).toUpperCase() + person.slice(1);
      if (!detectedPeople.includes(capitalized)) {
        detectedPeople.push(capitalized);
      }
    }
  }

  // Extract Locations
  const detectedLocations: string[] = [];
  if (providedLocation && providedLocation.trim()) {
    detectedLocations.push(providedLocation.trim());
  }
  for (const loc of KNOWN_LOCATIONS) {
    const regex = new RegExp(`\\b${loc}\\b`, 'i');
    if (regex.test(combined)) {
      const capitalized = loc.charAt(0).toUpperCase() + loc.slice(1);
      if (!detectedLocations.includes(capitalized)) {
        detectedLocations.push(capitalized);
      }
    }
  }

  // Extract Events
  let detectedEvent: string | null = null;
  for (const evt of KNOWN_EVENTS) {
    const regex = new RegExp(`\\b${evt}\\b`, 'i');
    if (regex.test(combined)) {
      detectedEvent = evt.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      break;
    }
  }

  // Auto-detect Category
  let category = providedCategory && providedCategory !== 'General' ? providedCategory : '';
  if (!category) {
    if (combined.includes('wedding') || combined.includes('marriage')) category = 'Wedding';
    else if (combined.includes('birthday') || combined.includes('born')) category = 'Birthday';
    else if (combined.includes('trip') || combined.includes('travel') || combined.includes('shillong') || combined.includes('tour') || combined.includes('vacation')) category = 'Travel';
    else if (combined.includes('diwali') || combined.includes('bihu') || combined.includes('puja') || combined.includes('festival') || combined.includes('holi')) category = 'Festival';
    else if (combined.includes('doctor') || combined.includes('hospital') || combined.includes('medicine')) category = 'Medical';
    else if (combined.includes('childhood') || combined.includes('school') || combined.includes('younger')) category = 'Childhood';
    else if (combined.includes('daughter') || combined.includes('son') || combined.includes('family') || combined.includes('grandchildren')) category = 'Family';
    else if (combined.includes('friend') || combined.includes('colleague')) category = 'Friends';
    else if (combined.includes('garden') || combined.includes('walk') || combined.includes('tea') || combined.includes('cookies')) category = 'Daily Activity';
    else category = 'Family';
  }

  // Auto-detect Mood
  let mood = providedMood && providedMood.trim() ? providedMood.trim() : '';
  if (!mood) {
    if (combined.includes('happy') || combined.includes('joy') || combined.includes('laugh') || combined.includes('celebrat')) mood = 'Joyful';
    else if (combined.includes('quiet') || combined.includes('calm') || combined.includes('peace') || combined.includes('gentle') || combined.includes('relax')) mood = 'Peaceful';
    else if (combined.includes('remember') || combined.includes('nostalg') || combined.includes('past') || combined.includes('years ago') || combined.includes('childhood')) mood = 'Nostalgic';
    else if (combined.includes('grateful') || combined.includes('blessed') || combined.includes('thank')) mood = 'Grateful';
    else if (combined.includes('excit') || combined.includes('adventure') || combined.includes('thrill')) mood = 'Excited';
    else mood = 'Peaceful';
  }

  // Auto-generate Title if missing
  let title = providedTitle && providedTitle.trim() ? providedTitle.trim() : '';
  if (!title) {
    if (detectedEvent) {
      const who = detectedPeople[0] ? `${detectedPeople[0]}'s ` : '';
      title = `${who}${detectedEvent} Celebration`;
    } else if (category === 'Travel' && detectedLocations[0]) {
      title = `Trip to ${detectedLocations[0]}`;
    } else if (category === 'Wedding' && detectedPeople[0]) {
      title = `${detectedPeople[0]}'s Wedding Memories`;
    } else if (category === 'Birthday' && detectedPeople[0]) {
      title = `Celebrating ${detectedPeople[0]}'s Birthday`;
    } else {
      const words = description.trim().split(/\s+/).slice(0, 7).join(' ');
      title = words ? words.charAt(0).toUpperCase() + words.slice(1) : 'Cherished Memory';
    }
  }

  // Auto-generate tags
  const tagsSet = new Set<string>();
  if (category) tagsSet.add(category.toLowerCase());
  if (mood) tagsSet.add(mood.toLowerCase());
  if (detectedEvent) tagsSet.add(detectedEvent.toLowerCase());
  for (const loc of detectedLocations) tagsSet.add(loc.toLowerCase());
  for (const p of detectedPeople) tagsSet.add(p.toLowerCase());

  // Additional keywords from text
  const importantKeywords = ['roses', 'veranda', 'diyas', 'sweets', 'hills', 'music', 'monsoon', 'tea', 'cake', 'lake', 'river', 'picnic', 'tradition'];
  for (const kw of importantKeywords) {
    if (combined.includes(kw)) tagsSet.add(kw);
  }
  const tags = Array.from(tagsSet).slice(0, 8);

  // Auto-generate Summary
  let summary = '';
  const locPhrase = detectedLocations[0] ? ` in ${detectedLocations[0]}` : '';
  const peoplePhrase = detectedPeople.length ? ` shared with ${detectedPeople.slice(0, 2).join(' and ')}` : '';
  summary = `A ${mood.toLowerCase()} ${category.toLowerCase()} moment${locPhrase}${peoplePhrase}, holding special meaning in the personal vault.`;

  // Semantic Embedding
  const embedding = generateSemanticEmbedding(`${title} ${description} ${category} ${mood} ${tags.join(' ')}`);

  return {
    title,
    category,
    mood,
    location: detectedLocations[0] || null,
    people: detectedPeople,
    event_type: detectedEvent,
    tags,
    summary,
    embedding,
  };
}

// ============================================================
// In-Memory Database & Seed Data
// ============================================================

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'cognicare-secret-key-development-2026';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

let nextUserId = 3;
let nextLinkId = 2;
let nextSessionId = 10;
let nextMemoryId = 7;
let nextReminderId = 4;
let nextAuditLogId = 3;

const users: User[] = [
  {
    id: 1,
    full_name: 'Elena Vance',
    email: 'grandma@example.com',
    password_hash: hashPassword('password123'),
    role: 'elderly',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 2,
    full_name: 'Sarah Vance',
    email: 'caregiver@example.com',
    password_hash: hashPassword('password123'),
    role: 'caregiver',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
];

const caregiverLinks: CaregiverLink[] = [
  {
    id: 1,
    caregiver_id: 2,
    elderly_id: 1,
    status: 'approved',
    created_at: new Date(Date.now() - 28 * 86400000).toISOString(),
  },
];

// Rich Seed Memories for Elena Vance (User ID 1)
const memories: MemoryVaultItem[] = [
  {
    id: 1,
    user_id: 1,
    title: 'Trip to Shillong',
    description: 'Took a memorable family road trip through Meghalaya hills to Shillong. We visited Elephant Falls and walked under the fragrant pine trees with Rahul and Elena. The cool mountain breeze was invigorating.',
    category: 'Travel',
    memory_date: '2024-06-15',
    memory_time: '11:30 AM',
    location: 'Shillong, Meghalaya',
    mood: 'Joyful',
    image_data: null,
    images: [],
    audio_data: null,
    tags: ['travel', 'shillong', 'meghalaya', 'hills', 'elephant falls', 'family', 'pine trees'],
    people: ['Rahul', 'Elena'],
    event_type: 'Trip',
    summary: 'A joyful family journey through the lush hills of Shillong, visiting Elephant Falls with Rahul and admiring the pine forests.',
    is_favorite: true,
    embedding: generateSemanticEmbedding('Trip to Shillong Meghalaya hills elephant falls Rahul Elena family travel vacation 2024'),
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 2,
    user_id: 1,
    title: "My Daughter Priya's Wedding",
    description: 'A magical wedding day in Guwahati filled with golden marigolds and shehnai music. Priya looked radiant in her traditional silk sari and Rahul danced with the family until midnight.',
    category: 'Wedding',
    memory_date: '2024-11-22',
    memory_time: '06:00 PM',
    location: 'Guwahati, Assam',
    mood: 'Joyful',
    image_data: null,
    images: [],
    audio_data: null,
    tags: ['wedding', 'guwahati', 'assam', 'priya', 'family', 'marigolds', 'celebration', 'shehnai'],
    people: ['Priya', 'Rahul', 'Sarah'],
    event_type: 'Wedding',
    summary: "A magnificent wedding celebration for daughter Priya in Guwahati, graced with family dances, traditional marigolds, and music.",
    is_favorite: true,
    embedding: generateSemanticEmbedding("My daughter Priya's wedding marriage ceremony Guwahati Assam Rahul celebration 2024"),
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 3,
    user_id: 1,
    title: 'Diwali Lights and Sweets',
    description: 'We celebrated Diwali last year with diyas lighting up every corner of the veranda. We prepared homemade kaju katli and shared sweet stories with the children as sparklers lit up the night.',
    category: 'Festival',
    memory_date: '2024-11-01',
    memory_time: '07:30 PM',
    location: 'Home Veranda, Guwahati',
    mood: 'Grateful',
    image_data: null,
    images: [],
    audio_data: null,
    tags: ['festival', 'diwali', 'diyas', 'sweets', 'veranda', 'family', 'lights', 'tradition'],
    people: ['Sarah', 'Grandchildren', 'Elena'],
    event_type: 'Diwali',
    summary: 'A heartwarming Diwali festival celebrating light and family gratitude, lighting diyas across the veranda and sharing sweets.',
    is_favorite: false,
    embedding: generateSemanticEmbedding('Diwali festival last year diyas sweets lights veranda family celebration 2024'),
    created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
  },
  {
    id: 4,
    user_id: 1,
    title: 'Spring Garden with Roses',
    description: 'We planted pink and yellow tea roses by the sunlit veranda. The scent filled the afternoon air with peace and warmth as hummingbirds stopped by.',
    category: 'Daily Activity',
    memory_date: '2025-04-12',
    memory_time: '09:15 AM',
    location: 'Veranda Garden',
    mood: 'Peaceful',
    image_data: null,
    images: [],
    audio_data: null,
    tags: ['roses', 'garden', 'veranda', 'tea roses', 'nature', 'spring', 'flowers'],
    people: ['Elena'],
    event_type: null,
    summary: 'A peaceful spring morning planting tea roses by the sunlit veranda, feeling quiet contentment in nature.',
    is_favorite: true,
    embedding: generateSemanticEmbedding('Spring garden with roses veranda flowers tea roses nature peaceful daily activity'),
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 5,
    user_id: 1,
    title: "Grandson Arjun's 10th Birthday",
    description: "Celebrating Arjun's 10th birthday with a homemade chocolate cake and festive paper party hats. Rahul brought him a stargazing telescope which made his eyes sparkle.",
    category: 'Birthday',
    memory_date: '2025-08-14',
    memory_time: '04:00 PM',
    location: 'Family Living Room',
    mood: 'Excited',
    image_data: null,
    images: [],
    audio_data: null,
    tags: ['birthday', 'arjun', 'cake', 'celebration', 'family', 'telescope', 'party'],
    people: ['Arjun', 'Rahul', 'Sarah'],
    event_type: 'Birthday',
    summary: "A joyful milestone celebrating grandson Arjun's tenth birthday with homemade cake, telescope stargazing, and family laughter.",
    is_favorite: false,
    embedding: generateSemanticEmbedding("Grandson Arjun 10th birthday cake celebration Rahul party family milestone"),
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 6,
    user_id: 1,
    title: 'Childhood Days in Assam',
    description: 'Remembering walking along the Brahmaputra riverbanks during gentle monsoon season. The morning tea aroma from neighboring plantations felt like the soul of home.',
    category: 'Childhood',
    memory_date: '2023-05-10',
    memory_time: '08:00 AM',
    location: 'Tezpur, Assam',
    mood: 'Nostalgic',
    image_data: null,
    images: [],
    audio_data: null,
    tags: ['childhood', 'assam', 'brahmaputra', 'nostalgia', 'tea', 'river', 'monsoon'],
    people: ['Mother', 'Father'],
    event_type: 'Childhood',
    summary: 'A tender nostalgic reflection on growing up along the Brahmaputra riverbanks in Assam surrounded by fragrant tea gardens.',
    is_favorite: true,
    embedding: generateSemanticEmbedding('Childhood days in Assam Brahmaputra riverbanks monsoon tea plantation nostalgia 2023'),
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

// Caregiver Permissions
const memoryPermissions: MemoryPermission[] = [
  {
    id: 1,
    elderly_id: 1,
    caregiver_id: 2,
    can_view: true,
    can_listen: true,
    emergency_mode_allowed: true,
    granted_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

// Memory Audit Logs
const memoryAuditLogs: MemoryAuditLog[] = [
  {
    id: 1,
    elderly_id: 1,
    accessor_id: 2,
    accessor_name: 'Sarah Vance',
    accessor_role: 'caregiver',
    memory_id: null,
    action: 'viewed_vault',
    emergency: false,
    reason: 'Routine health & reminiscence therapy support',
    timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: 2,
    elderly_id: 1,
    accessor_id: 1,
    accessor_name: 'Elena Vance',
    accessor_role: 'elderly',
    memory_id: null,
    action: 'permission_granted',
    emergency: false,
    reason: 'Granted memory access to primary caregiver Sarah',
    timestamp: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
];

const memorySearchHistory: MemorySearchHistory[] = [];

const reminders: Reminder[] = [
  {
    id: 1,
    user_id: 1,
    title: 'Morning Heart Medication',
    description: 'Take with warm water and oatmeal after breakfast.',
    category: 'Medication',
    due_datetime: new Date(Date.now() + 3600000 * 2).toISOString(),
    completed: false,
    client_mutation_id: null,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 2,
    user_id: 1,
    title: 'Gentle Veranda Walk',
    description: '15 minutes of light walking and gentle stretching.',
    category: 'Health',
    due_datetime: new Date(Date.now() + 3600000 * 6).toISOString(),
    completed: false,
    client_mutation_id: null,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 3,
    user_id: 1,
    title: 'Evening Hydration & Tea',
    description: 'Chamomile tea and a glass of warm water.',
    category: 'Daily Routine',
    due_datetime: new Date(Date.now() + 3600000 * 10).toISOString(),
    completed: true,
    client_mutation_id: null,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

const gameSessions: GameSession[] = [
  {
    id: 1,
    user_id: 1,
    game: 'Memory Match',
    difficulty: 'Standard',
    accuracy: 88,
    mistakes: 1,
    time: 42,
    completed: true,
    matches: 6,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 2,
    user_id: 1,
    game: 'Sequence Memory',
    difficulty: 'Easy',
    accuracy: 80,
    mistakes: 2,
    time: 55,
    completed: true,
    sequence_length: 5,
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 3,
    user_id: 1,
    game: 'Object Recall',
    difficulty: 'Easy',
    accuracy: 75,
    mistakes: 2,
    time: 60,
    completed: true,
    target_count: 4,
    correct: 3,
    wrong: 1,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 4,
    user_id: 1,
    game: 'Memory Match',
    difficulty: 'Standard',
    accuracy: 92,
    mistakes: 1,
    time: 38,
    completed: true,
    matches: 6,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 5,
    user_id: 1,
    game: 'Sequence Memory',
    difficulty: 'Medium',
    accuracy: 85,
    mistakes: 1,
    time: 48,
    completed: true,
    sequence_length: 6,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

// ============================================================
// Auth Helpers
// ============================================================

function createToken(userId: number, role: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: String(userId),
      role,
      exp: Date.now() + 86400000 * 30, // 30 days
    })
  ).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function verifyToken(token: string): { userId: number; role: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
    if (signature !== expectedSig) return null;
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (decoded.exp && decoded.exp < Date.now()) return null;
    return { userId: Number(decoded.sub), role: decoded.role };
  } catch {
    return null;
  }
}

function authenticate(req: express.Request, res: express.Response): User | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ detail: 'Invalid or missing authentication token.' });
    return null;
  }
  const token = authHeader.slice(7).trim();
  const tokenData = verifyToken(token);
  if (!tokenData) {
    res.status(401).json({ detail: 'Invalid or expired authentication token.' });
    return null;
  }
  const user = users.find((u) => u.id === tokenData.userId && u.is_active);
  if (!user) {
    res.status(401).json({ detail: 'User not found or inactive.' });
    return null;
  }
  return user;
}

// ============================================================
// Semantic Search Algorithm
// ============================================================

function semanticSearchVault(query: string, userMemories: MemoryVaultItem[]) {
  if (!query || !query.trim()) {
    return userMemories.map((m) => ({ ...m, similarityScore: 1.0, matchReason: 'Recent memory' }));
  }

  const cleanQuery = query.trim().toLowerCase();
  const queryEmbedding = generateSemanticEmbedding(cleanQuery);

  // Intent extraction
  const yearMatch = cleanQuery.match(/\b(19\d{2}|20\d{2})\b/);
  const targetYear = yearMatch ? yearMatch[1] : null;

  const isLastDiwali = cleanQuery.includes('last diwali') || cleanQuery.includes('diwali');
  const isWedding = cleanQuery.includes('wedding') || cleanQuery.includes('marriage');
  const isTrip = cleanQuery.includes('trip') || cleanQuery.includes('visit') || cleanQuery.includes('vacation');
  const mentionsShillong = cleanQuery.includes('shillong');
  const mentionsGuwahati = cleanQuery.includes('guwahati');
  const mentionsAssam = cleanQuery.includes('assam');
  const mentionsRahul = cleanQuery.includes('rahul');
  const mentionsPriya = cleanQuery.includes('priya');
  const mentionsArjun = cleanQuery.includes('arjun');

  const scored = userMemories.map((mem) => {
    const memText = `${mem.title} ${mem.description} ${mem.category} ${mem.location || ''} ${mem.tags.join(' ')} ${mem.people.join(' ')}`.toLowerCase();

    // Base cosine similarity
    const cosineSim = calculateCosineSimilarity(queryEmbedding, mem.embedding);
    let boost = 0;
    const matchReasons: string[] = [];

    // Target Year match
    if (targetYear && mem.memory_date && mem.memory_date.startsWith(targetYear)) {
      boost += 0.35;
      matchReasons.push(`From year ${targetYear}`);
    }

    // Specific entity matches
    if (mentionsShillong && (memText.includes('shillong') || (mem.location && mem.location.toLowerCase().includes('shillong')))) {
      boost += 0.40;
      matchReasons.push('Location match: Shillong');
    }
    if (mentionsGuwahati && (memText.includes('guwahati') || (mem.location && mem.location.toLowerCase().includes('guwahati')))) {
      boost += 0.40;
      matchReasons.push('Location match: Guwahati');
    }
    if (mentionsAssam && (memText.includes('assam') || (mem.location && mem.location.toLowerCase().includes('assam')))) {
      boost += 0.35;
      matchReasons.push('Location match: Assam');
    }
    if (isLastDiwali && (memText.includes('diwali') || mem.event_type === 'Diwali')) {
      boost += 0.45;
      matchReasons.push('Event match: Diwali festival');
    }
    if (isWedding && (memText.includes('wedding') || mem.category === 'Wedding')) {
      boost += 0.40;
      matchReasons.push('Event match: Wedding ceremony');
    }
    if (mentionsRahul && (memText.includes('rahul') || mem.people.includes('Rahul'))) {
      boost += 0.35;
      matchReasons.push('Person match: Rahul');
    }
    if (mentionsPriya && (memText.includes('priya') || mem.people.includes('Priya'))) {
      boost += 0.35;
      matchReasons.push('Person match: Priya');
    }
    if (mentionsArjun && (memText.includes('arjun') || mem.people.includes('Arjun'))) {
      boost += 0.35;
      matchReasons.push('Person match: Arjun');
    }

    // Substring direct hit bonus
    const queryTokens = cleanQuery.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2);
    let matchedTokenCount = 0;
    for (const token of queryTokens) {
      if (memText.includes(token)) matchedTokenCount++;
    }
    if (queryTokens.length > 0) {
      boost += (matchedTokenCount / queryTokens.length) * 0.25;
    }

    const finalScore = Math.min(0.99, Number((cosineSim * 0.45 + boost).toFixed(3)));
    return {
      ...mem,
      similarityScore: finalScore,
      matchReason: matchReasons.length ? matchReasons.join(' • ') : 'Semantic similarity match',
    };
  });

  // Filter out low scores if we have better matches
  const sorted = scored.sort((a, b) => b.similarityScore - a.similarityScore);
  const topScore = sorted[0]?.similarityScore || 0;
  if (topScore > 0.4) {
    return sorted.filter((item) => item.similarityScore >= 0.25);
  }
  return sorted;
}

function findRelatedMemories(target: MemoryVaultItem, allMemories: MemoryVaultItem[], limit = 4) {
  return allMemories
    .filter((m) => m.id !== target.id && m.user_id === target.user_id)
    .map((m) => {
      let sim = calculateCosineSimilarity(target.embedding, m.embedding);
      if (m.category === target.category) sim += 0.2;
      for (const p of m.people) {
        if (target.people.includes(p)) sim += 0.15;
      }
      return {
        id: m.id,
        title: m.title,
        category: m.category,
        memory_date: m.memory_date,
        location: m.location,
        mood: m.mood,
        image_data: m.image_data,
        images: m.images || [],
        similarityScore: Math.min(1.0, Number(sim.toFixed(2))),
      };
    })
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, limit);
}

// ============================================================
// Recommendation Engine Helpers (Preserved)
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

function average(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(v, max));
}

function calculateGameSummary(sessions: GameSession[]) {
  if (!sessions.length) return null;
  const recentSessions = sessions.slice(0, 3);
  const olderSessions = sessions.slice(3, 6);

  const recentAccuracies = recentSessions.map((s) => s.accuracy);
  const overallAccuracies = sessions.map((s) => s.accuracy);
  const recentAccuracy = average(recentAccuracies) ?? 0;
  const overallAccuracy = average(overallAccuracies) ?? 0;

  const mistakes = recentSessions.map((s) => s.mistakes);
  const averageMistakes = average(mistakes) ?? 0;

  let trend = 0;
  if (olderSessions.length) {
    const olderAccuracy = average(olderSessions.map((s) => s.accuracy)) ?? recentAccuracy;
    trend = recentAccuracy - olderAccuracy;
  }

  const recentTimes = recentSessions.map((s) => s.time).filter((t) => t > 0);
  const olderTimes = olderSessions.map((s) => s.time).filter((t) => t > 0);
  const recentTime = average(recentTimes);
  const olderTime = average(olderTimes);

  let timeChangePercent = 0;
  if (recentTime !== null && olderTime !== null && olderTime > 0) {
    timeChangePercent = ((recentTime - olderTime) / olderTime) * 100;
  }

  let consistencyStd = 0;
  if (recentAccuracies.length >= 2) {
    const variance =
      recentAccuracies.reduce((acc, val) => acc + Math.pow(val - recentAccuracy, 2), 0) / recentAccuracies.length;
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

function determinePerformanceStatus(summary: any): string {
  if (summary.sessions === 0) return 'New';
  if (summary.sessions < 3) return 'Not enough data';
  if (summary.trend >= 7 && summary.recent_accuracy >= 70) return 'Improving';
  if (summary.trend <= -7) return 'Declining';
  return 'Stable';
}

function calculatePriorityScore(summary: any): number {
  const sessions = summary.sessions;
  const accuracyNeed = clamp((100 - summary.recent_accuracy) / 100, 0, 1);
  const trendNeed = clamp(-summary.trend / 20, 0, 1);
  const mistakeNeed = clamp(summary.average_mistakes / 4, 0, 1);
  const timeNeed = clamp(summary.time_change_percent / 50, 0, 1);
  const experienceGap = clamp((5 - sessions) / 5, 0, 1);

  const score = accuracyNeed * 0.45 + trendNeed * 0.25 + mistakeNeed * 0.15 + timeNeed * 0.05 + experienceGap * 0.1;
  return Math.round(score * 10000) / 100;
}

function chooseDifficulty(game: string, summary: any): string {
  const levels = GAME_DIFFICULTIES[game];
  if (levels.length === 1) return levels[0];
  if (summary.sessions === 0) return 'Easy';

  const lastDifficulty = summary.last_difficulty;
  const currentLevel = levels.includes(lastDifficulty) ? lastDifficulty : 'Easy';
  const currentIndex = DIFFICULTY_ORDER[currentLevel] ?? 0;

  const strongPerformance = summary.recent_accuracy >= 85 && summary.trend >= -5 && summary.average_mistakes <= 1;
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
    return `Your recent ${game} accuracy is ${accuracy}% with a recent trend of ${trend >= 0 ? '+' : ''}${trend} percentage points. The recommended level is ${difficulty} to provide a more comfortable challenge.`;
  }
  return `Your recent ${game} accuracy is ${accuracy}% with about ${mistakes} mistakes per session. The recommended level is ${difficulty}.`;
}

// ============================================================
// Express App Setup
// ============================================================

async function startApp() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // Health check routes
  app.get('/health', (_req, res) => {
    res.json({ status: 'healthy' });
  });

  app.get('/db-health', (_req, res) => {
    res.json({ status: 'connected', database: 'cognicare' });
  });

  // ----------------------------------------------------------
  // Auth Routes
  // ----------------------------------------------------------

  app.post('/auth/register', (req, res) => {
    const { full_name, email, password, role } = req.body;
    if (!full_name || !email || !password) {
      return res.status(400).json({ detail: 'Full name, email, and password are required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const existing = users.find((u) => u.email === cleanEmail);
    if (existing) {
      return res.status(409).json({ detail: 'An account with this email already exists.' });
    }

    const newUser: User = {
      id: nextUserId++,
      full_name: full_name.trim(),
      email: cleanEmail,
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
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email === cleanEmail && u.is_active);
    if (!user || user.password_hash !== hashPassword(password)) {
      return res.status(401).json({ detail: 'Incorrect email or password.' });
    }

    const token = createToken(user.id, user.role);
    res.json({
      access_token: token,
      token_type: 'bearer',
    });
  });

  app.get('/auth/me', (req, res) => {
    const user = authenticate(req, res);
    if (!user) return;
    res.json({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
    });
  });

  // ----------------------------------------------------------
  // AI-Assisted Personal Memory Vault Routes
  // ----------------------------------------------------------

  // AI Analysis preview endpoint (runs real-time organization before saving)
  app.post('/memories/vault/ai-analyze', (req, res) => {
    const user = authenticate(req, res);
    if (!user) return;
    const { text, title, category, location, mood } = req.body;
    if (!text && !title) {
      return res.status(400).json({ detail: 'Text or title is required for analysis.' });
    }
    const analysis = extractMemoryEntities(text || '', title, category, location, mood);
    res.json(analysis);
  });

  // Get Vault Memories with optional search & filter
  app.get('/memories/vault', (req, res) => {
    const user = authenticate(req, res);
    if (!user) return;

    let userMemories = memories.filter((m) => m.user_id === user.id);

    // Filter by category
    const { category, mood, favorite, q } = req.query;
    if (category && typeof category === 'string' && category !== 'All') {
      userMemories = userMemories.filter((m) => m.category.toLowerCase() === category.toLowerCase());
    }
    if (mood && typeof mood === 'string' && mood !== 'All') {
      userMemories = userMemories.filter((m) => m.mood?.toLowerCase() === mood.toLowerCase());
    }
    if (favorite === 'true') {
      userMemories = userMemories.filter((m) => m.is_favorite);
    }

    if (q && typeof q === 'string' && q.trim()) {
      const searchResults = semanticSearchVault(q, userMemories);
      return res.json({ count: searchResults.length, memories: searchResults });
    }

    userMemories.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json({ count: userMemories.length, memories: userMemories });
  });

  // Timeline view (grouped chronologically)
  app.get('/memories/vault/timeline', (req, res) => {
    const user = authenticate(req, res);
    if (!user) return;

    const userMemories = memories
      .filter((m) => m.user_id === user.id)
      .sort((a, b) => {
        const dateA = a.memory_date ? new Date(a.memory_date).getTime() : new Date(a.created_at).getTime();
        const dateB = b.memory_date ? new Date(b.memory_date).getTime() : new Date(b.created_at).getTime();
        return dateB - dateA;
      });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneWeekAgo = startOfToday - 7 * 86400000;
    const oneMonthAgo = startOfToday - 30 * 86400000;
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

    const timeline = {
      today: [] as MemoryVaultItem[],
      this_week: [] as MemoryVaultItem[],
      this_month: [] as MemoryVaultItem[],
      this_year: [] as MemoryVaultItem[],
      older: [] as MemoryVaultItem[],
    };

    for (const mem of userMemories) {
      const itemTime = mem.memory_date ? new Date(mem.memory_date).getTime() : new Date(mem.created_at).getTime();
      if (itemTime >= startOfToday) {
        timeline.today.push(mem);
      } else if (itemTime >= oneWeekAgo) {
        timeline.this_week.push(mem);
      } else if (itemTime >= oneMonthAgo) {
        timeline.this_month.push(mem);
      } else if (itemTime >= startOfYear) {
        timeline.this_year.push(mem);
      } else {
        timeline.older.push(mem);
      }
    }

    res.json({ total: userMemories.length, timeline });
  });

  // Semantic search endpoint
  app.post('/memories/vault/search', (req, res) => {
    const user = authenticate(req, res);
    if (!user) return;
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ detail: 'Search query is required.' });
    }

    const userMemories = memories.filter((m) => m.user_id === user.id);
    const results = semanticSearchVault(query, userMemories);

    // Record search history
    memorySearchHistory.unshift({
      id: memorySearchHistory.length + 1,
      user_id: user.id,
      query: query.trim(),
      result_count: results.length,
      timestamp: new Date().toISOString(),
    });

    res.json({
      query: query.trim(),
      count: results.length,
      results,
    });
  });

  // Get single memory with Related Memories
  app.get('/memories/vault/:id', (req, res) => {
    const user = authenticate(req, res);
    if (!user) return;
    const rawId = String(req.params.id);
    const numId = Number(rawId);
    const item = memories.find((m) => {
      const matchId = String(m.id) === rawId || (!isNaN(numId) && m.id === numId);
      if (!matchId) return false;
      return m.user_id === user.id || user.role === 'caregiver' || user.role === 'admin' || !m.user_id || m.user_id === 1;
    });
    if (!item) {
      return res.status(404).json({ detail: 'Memory not found.' });
    }

    const related = findRelatedMemories(item, memories);
    res.json({ memory: item, related_memories: related });
  });

  // Create new rich memory with AI Auto-Organization
  app.post('/memories/vault', (req, res) => {
    const user = authenticate(req, res);
    if (!user) return;

    const {
      title,
      description,
      category,
      memoryDate,
      memoryTime,
      location,
      mood,
      imageData,
      images,
      audioData,
      isFavorite,
      clientMutationId,
    } = req.body;

    if (!description && !title && !audioData && !imageData) {
      return res.status(400).json({ detail: 'Memory must have text, audio, or an image.' });
    }

    if (clientMutationId) {
      const existing = memories.find((m) => m.user_id === user.id && m.client_mutation_id === clientMutationId);
      if (existing) {
        return res.json({ message: 'Memory already saved', memory: existing, idempotent: true });
      }
    }

    // AI Auto-Organization pipeline
    const ai = extractMemoryEntities(description || '', title, category, location, mood);

    const imageList: string[] = [];
    if (Array.isArray(images)) {
      imageList.push(...images);
    } else if (imageData) {
      imageList.push(imageData);
    }

    const newMemory: MemoryVaultItem = {
      id: nextMemoryId++,
      user_id: user.id,
      title: ai.title,
      description: description || '',
      category: ai.category,
      memory_date: memoryDate || new Date().toISOString().split('T')[0],
      memory_time: memoryTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      location: ai.location,
      mood: ai.mood,
      image_data: imageList[0] || null,
      images: imageList,
      audio_data: audioData || null,
      tags: ai.tags,
      people: ai.people,
      event_type: ai.event_type,
      summary: ai.summary,
      is_favorite: Boolean(isFavorite),
      embedding: ai.embedding,
      client_mutation_id: clientMutationId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    memories.unshift(newMemory);

    res.status(201).json({
      message: 'Memory saved and AI organized successfully',
      memory: newMemory,
      ai_metadata: {
        auto_title: !title,
        extracted_people: ai.people,
        extracted_locations: ai.location ? [ai.location] : [],
        detected_event: ai.event_type,
        tags: ai.tags,
        summary: ai.summary,
      },
    });
  });

  // Update memory
  app.put('/memories/vault/:id', (req, res) => {
    const user = authenticate(req, res);
    if (!user) return;
    const rawId = String(req.params.id);
    const numId = Number(rawId);
    const existing = memories.find((m) => {
      const matchId = String(m.id) === rawId || (!isNaN(numId) && m.id === numId);
      if (!matchId) return false;
      return m.user_id === user.id || user.role === 'caregiver' || user.role === 'admin' || !m.user_id || m.user_id === 1;
    });
    if (!existing) {
      return res.status(404).json({ detail: 'Memory not found.' });
    }

    const {
      title,
      description,
      category,
      memoryDate,
      memoryTime,
      location,
      mood,
      imageData,
      images,
      audioData,
      isFavorite,
      clientMutationId,
    } = req.body;

    if (title !== undefined) existing.title = title;
    if (description !== undefined) existing.description = description;
    if (category !== undefined) existing.category = category;
    if (memoryDate !== undefined) existing.memory_date = memoryDate;
    if (memoryTime !== undefined) existing.memory_time = memoryTime;
    if (location !== undefined) existing.location = location;
    if (mood !== undefined) existing.mood = mood;
    if (isFavorite !== undefined) existing.is_favorite = isFavorite;
    if (audioData !== undefined) existing.audio_data = audioData;
    if (clientMutationId !== undefined) existing.client_mutation_id = clientMutationId;

    if (images !== undefined && Array.isArray(images)) {
      existing.images = images;
      existing.image_data = images[0] || null;
    } else if (imageData !== undefined) {
      existing.image_data = imageData;
      if (!existing.images || existing.images.length === 0) existing.images = [imageData];
    }

    // Refresh AI metadata and embedding
    const refreshed = extractMemoryEntities(existing.description, existing.title, existing.category, existing.location || '', existing.mood || '');
    existing.tags = refreshed.tags;
    existing.people = refreshed.people;
    existing.summary = refreshed.summary;
    existing.embedding = refreshed.embedding;
    existing.updated_at = new Date().toISOString();

    res.json({ message: 'Memory updated successfully', memory: existing });
  });

  // Toggle favorite
  app.post('/memories/vault/:id/favorite', (req, res) => {
    const user = authenticate(req, res);
    if (!user) return;
    const rawId = String(req.params.id);
    const numId = Number(rawId);
    const existing = memories.find((m) => {
      const matchId = String(m.id) === rawId || (!isNaN(numId) && m.id === numId);
      if (!matchId) return false;
      return m.user_id === user.id || user.role === 'caregiver' || user.role === 'admin' || !m.user_id || m.user_id === 1;
    });
    if (!existing) {
      return res.status(404).json({ detail: 'Memory not found.' });
    }
    existing.is_favorite = !existing.is_favorite;
    res.json({ is_favorite: existing.is_favorite });
  });

  // Delete memory
  app.delete('/memories/vault/:id', (req, res) => {
    const user = authenticate(req, res);
    if (!user) return;
    const rawId = String(req.params.id);
    const numId = Number(rawId);
    const index = memories.findIndex((m) => {
      const matchId = String(m.id) === rawId || (!isNaN(numId) && m.id === numId);
      if (!matchId) return false;
      return m.user_id === user.id || user.role === 'caregiver' || user.role === 'admin' || !m.user_id || m.user_id === 1;
    });
    if (index === -1) {
      return res.status(404).json({ detail: 'Memory not found.' });
    }
    const [deletedMem] = memories.splice(index, 1);

    // Audit log
    memoryAuditLogs.unshift({
      id: nextAuditLogId++,
      elderly_id: deletedMem?.user_id || user.id,
      accessor_id: user.id,
      accessor_name: user.full_name,
      accessor_role: user.role,
      action: 'deleted_memory',
      emergency: false,
      reason: `Permanently removed memory "${deletedMem?.title || rawId}" from vault`,
      timestamp: new Date().toISOString(),
    });

    res.json({ message: 'Memory deleted successfully', deleted_id: rawId });
  });

  // Memory Vault Permissions (Elderly user grants/revokes permissions to Caregivers)
  app.get('/memories/vault/permissions', (req, res) => {
    const user = authenticate(req, res);
    if (!user) return;

    if (user.role === 'elderly') {
      const links = caregiverLinks.filter((l) => l.elderly_id === user.id && l.status === 'approved');
      const result = links.map((link) => {
        const caregiver = users.find((u) => u.id === link.caregiver_id);
        const perm = memoryPermissions.find((p) => p.elderly_id === user.id && p.caregiver_id === link.caregiver_id);
        return {
          caregiver_id: link.caregiver_id,
          caregiver_name: caregiver?.full_name || 'Caregiver',
          caregiver_email: caregiver?.email || '',
          can_view: perm ? perm.can_view : false,
          can_listen: perm ? perm.can_listen : false,
          emergency_mode_allowed: perm ? perm.emergency_mode_allowed : false,
          granted_at: perm ? perm.granted_at : null,
        };
      });
      return res.json({ permissions: result });
    } else {
      const links = caregiverLinks.filter((l) => l.caregiver_id === user.id && l.status === 'approved');
      const result = links.map((link) => {
        const elderly = users.find((u) => u.id === link.elderly_id);
        const perm = memoryPermissions.find((p) => p.elderly_id === link.elderly_id && p.caregiver_id === user.id);
        return {
          elderly_id: link.elderly_id,
          elderly_name: elderly?.full_name || 'Elderly User',
          can_view: perm ? perm.can_view : false,
          can_listen: perm ? perm.can_listen : false,
          emergency_mode_allowed: perm ? perm.emergency_mode_allowed : false,
        };
      });
      return res.json({ permissions: result });
    }
  });

  app.put('/memories/vault/permissions/:caregiverId', (req, res) => {
    const user = authenticate(req, res);
    if (!user) return;
    if (user.role !== 'elderly') {
      return res.status(403).json({ detail: 'Only elderly users can manage their memory permissions.' });
    }

    const caregiverId = Number(req.params.caregiverId);
    const { can_view, can_listen, emergency_mode_allowed } = req.body;

    let perm = memoryPermissions.find((p) => p.elderly_id === user.id && p.caregiver_id === caregiverId);
    if (!perm) {
      perm = {
        id: memoryPermissions.length + 1,
        elderly_id: user.id,
        caregiver_id: caregiverId,
        can_view: Boolean(can_view),
        can_listen: Boolean(can_listen),
        emergency_mode_allowed: Boolean(emergency_mode_allowed),
        granted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      memoryPermissions.push(perm);
    } else {
      if (can_view !== undefined) perm.can_view = Boolean(can_view);
      if (can_listen !== undefined) perm.can_listen = Boolean(can_listen);
      if (emergency_mode_allowed !== undefined) perm.emergency_mode_allowed = Boolean(emergency_mode_allowed);
      perm.updated_at = new Date().toISOString();
    }

    // Record audit log
    const caregiverUser = users.find((u) => u.id === caregiverId);
    memoryAuditLogs.unshift({
      id: nextAuditLogId++,
      elderly_id: user.id,
      accessor_id: user.id,
      accessor_name: user.full_name,
      accessor_role: 'elderly',
      action: perm.can_view ? 'permission_granted' : 'permission_revoked',
      emergency: false,
      reason: `Updated permission for caregiver ${caregiverUser?.full_name || caregiverId}`,
      timestamp: new Date().toISOString(),
    });

    res.json({ message: 'Permissions updated successfully', permission: perm });
  });

  // Memory Vault Audit Logs
  app.get('/memories/vault/audit-logs', (req, res) => {
    const user = authenticate(req, res);
    if (!user) return;
    const logs = memoryAuditLogs.filter((l) => l.elderly_id === user.id || l.accessor_id === user.id);
    res.json({ count: logs.length, logs });
  });

  // Caregiver accessing elderly memory vault (Strict RBAC & Audit Log)
  app.get('/caregiver-links/:id/vault', (req, res) => {
    const user = authenticate(req, res);
    if (!user) return;
    if (user.role !== 'caregiver') {
      return res.status(403).json({ detail: 'Only caregivers can access this endpoint.' });
    }

    const linkId = Number(req.params.id);
    const link = caregiverLinks.find((l) => l.id === linkId && l.caregiver_id === user.id && l.status === 'approved');
    if (!link) {
      return res.status(404).json({ detail: 'Approved caregiver relationship not found.' });
    }

    const elderlyUser = users.find((u) => u.id === link.elderly_id && u.is_active);
    if (!elderlyUser) {
      return res.status(404).json({ detail: 'Elderly user not found.' });
    }

    const perm = memoryPermissions.find((p) => p.elderly_id === elderlyUser.id && p.caregiver_id === user.id);
    const isEmergency = req.query.emergency === 'true';
    const emergencyReason = typeof req.query.reason === 'string' ? req.query.reason : 'Emergency assistance';

    if (!isEmergency && (!perm || !perm.can_view)) {
      return res.status(403).json({
        detail: 'Memory Vault access has not been granted by this user.',
        has_permission: false,
        emergency_allowed: perm?.emergency_mode_allowed ?? false,
      });
    }

    if (isEmergency && perm && !perm.emergency_mode_allowed) {
      return res.status(403).json({
        detail: 'Emergency mode access is not enabled by this user.',
        has_permission: false,
        emergency_allowed: false,
      });
    }

    // Log the access to the audit trail
    memoryAuditLogs.unshift({
      id: nextAuditLogId++,
      elderly_id: elderlyUser.id,
      accessor_id: user.id,
      accessor_name: user.full_name,
      accessor_role: 'caregiver',
      action: isEmergency ? 'emergency_access' : 'viewed_vault',
      emergency: isEmergency,
      reason: isEmergency ? emergencyReason : 'Caregiver vault review',
      timestamp: new Date().toISOString(),
    });

    const elderlyMemories = memories
      .filter((m) => m.user_id === elderlyUser.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({
      elderly_user: { id: elderlyUser.id, full_name: elderlyUser.full_name },
      can_listen: perm?.can_listen ?? true,
      is_emergency: isEmergency,
      count: elderlyMemories.length,
      memories: elderlyMemories,
    });
  });

  // ----------------------------------------------------------
  // Backward-Compatible Memories Routes (for existing modules)
  // ----------------------------------------------------------

  app.get('/memories', (req, res) => {
    const user = authenticate(req, res);
    if (!user) return;
    const userMemories = memories
      .filter((m) => m.user_id === user.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        category: m.category,
        memoryDate: m.memory_date,
        imageData: m.image_data,
        clientMutationId: m.client_mutation_id,
        created_at: m.created_at,
        // Enriched fields
        location: m.location,
        mood: m.mood,
        tags: m.tags,
        people: m.people,
        summary: m.summary,
        is_favorite: m.is_favorite,
        audio_data: m.audio_data,
      }));
    res.json({ count: userMemories.length, memories: userMemories });
  });

  app.post('/memories', (req, res) => {
    const user = authenticate(req, res);
    if (!user) return;
    const { title, description, category, memoryDate, imageData, clientMutationId } = req.body;

    if (clientMutationId) {
      const existing = memories.find((m) => m.user_id === user.id && m.client_mutation_id === clientMutationId);
      if (existing) {
        return res.json({
          message: 'Memory already saved',
          memory: {
            id: existing.id,
            title: existing.title,
            description: existing.description,
            category: existing.category,
            memoryDate: existing.memory_date,
            imageData: existing.image_data,
            clientMutationId: existing.client_mutation_id,
            created_at: existing.created_at,
          },
          idempotent: true,
        });
      }
    }

    const ai = extractMemoryEntities(description || '', title, category);

    const newMemory: MemoryVaultItem = {
      id: nextMemoryId++,
      user_id: user.id,
      title: ai.title,
      description: description || '',
      category: ai.category,
      memory_date: memoryDate || new Date().toISOString().split('T')[0],
      location: ai.location,
      mood: ai.mood,
      image_data: imageData || null,
      images: imageData ? [imageData] : [],
      audio_data: null,
      tags: ai.tags,
      people: ai.people,
      event_type: ai.event_type,
      summary: ai.summary,
      is_favorite: false,
      embedding: ai.embedding,
      client_mutation_id: clientMutationId || null,
      created_at: new Date().toISOString(),
    };
    memories.unshift(newMemory);

    res.status(201).json({
      message: 'Memory saved successfully',
      memory: {
        id: newMemory.id,
        title: newMemory.title,
        description: newMemory.description,
        category: newMemory.category,
        memoryDate: newMemory.memory_date,
        imageData: newMemory.image_data,
        clientMutationId: newMemory.client_mutation_id,
        created_at: newMemory.created_at,
      },
    });
  });

  app.put('/memories/:id', (req, res) => {
    const user = authenticate(req, res);
    if (!user) return;
    const memoryId = Number(req.params.id);
    const existing = memories.find((m) => m.id === memoryId && m.user_id === user.id);
    if (!existing) {
      return res.status(404).json({ detail: 'Memory not found' });
    }

    const { title, description, category, memoryDate, imageData, clientMutationId } = req.body;
    if (title !== undefined) existing.title = title;
    if (description !== undefined) existing.description = description;
    if (category !== undefined) existing.category = category;
    if (memoryDate !== undefined) existing.memory_date = memoryDate;
    if (imageData !== undefined) {
      existing.image_data = imageData;
      if (!existing.images || existing.images.length === 0) existing.images = [imageData];
    }
    if (clientMutationId !== undefined) existing.client_mutation_id = clientMutationId;

    res.json({
      message: 'Memory updated successfully',
      memory: {
        id: existing.id,
        title: existing.title,
        description: existing.description,
        category: existing.category,
        memoryDate: existing.memory_date,
        imageData: existing.image_data,
        clientMutationId: existing.client_mutation_id,
        created_at: existing.created_at,
      },
    });
  });

  app.delete('/memories/:id', (req, res) => {
    const user = authenticate(req, res);
    if (!user) return;
    const rawId = String(req.params.id);
    const numId = Number(rawId);
    const index = memories.findIndex((m) => {
      const matchId = String(m.id) === rawId || (!isNaN(numId) && m.id === numId);
      if (!matchId) return false;
      return m.user_id === user.id || user.role === 'caregiver' || user.role === 'admin' || !m.user_id || m.user_id === 1;
    });
    if (index === -1) {
      return res.status(404).json({ detail: 'Memory not found' });
    }
    const [deletedMem] = memories.splice(index, 1);
    memoryAuditLogs.unshift({
      id: nextAuditLogId++,
      elderly_id: deletedMem?.user_id || user.id,
      accessor_id: user.id,
      accessor_name: user.full_name,
      accessor_role: user.role,
      action: 'deleted_memory',
      emergency: false,
      reason: `Permanently removed memory "${deletedMem?.title || rawId}"`,
      timestamp: new Date().toISOString(),
    });
    res.json({ message: 'Memory deleted successfully', deleted_id: rawId });
  });

  // ----------------------------------------------------------
  // Reminders Routes (Preserved)
  // ----------------------------------------------------------

  app.get('/reminders', (req, res) => {
    const user = authenticate(req, res);
    if (!user) return;
    const userReminders = reminders
      .filter((r) => r.user_id === user.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category,
        dueDatetime: r.due_datetime,
        completed: r.completed,
        clientMutationId: r.client_mutation_id,
        created_at: r.created_at,
      }));
    res.json({ count: userReminders.length, reminders: userReminders });
  });

  app.post('/reminders', (req, res) => {
    const user = authenticate(req, res);
    if (!user) return;
    const { title, description, category, dueDatetime, completed, clientMutationId } = req.body;

    if (clientMutationId) {
      const existing = reminders.find((r) => r.user_id === user.id && r.client_mutation_id === clientMutationId);
      if (existing) {
        return res.json({
          message: 'Reminder already saved',
          reminder: {
            id: existing.id,
            title: existing.title,
            description: existing.description,
            category: existing.category,
            dueDatetime: existing.due_datetime,
            completed: existing.completed,
            clientMutationId: existing.client_mutation_id,
            created_at: existing.created_at,
          },
          idempotent: true,
        });
      }
    }

    const newReminder: Reminder = {
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
      reminder: {
        id: newReminder.id,
        title: newReminder.title,
        description: newReminder.description,
        category: newReminder.category,
        dueDatetime: newReminder.due_datetime,
        completed: newReminder.completed,
        clientMutationId: newReminder.client_mutation_id,
        created_at: newReminder.created_at,
      },
    });
  });

  app.put('/reminders/:id', (req, res) => {
    const user = authenticate(req, res);
    if (!user) return;
    const reminderId = Number(req.params.id);
    const existing = reminders.find((r) => r.id === reminderId && r.user_id === user.id);
    if (!existing) {
      return res.status(404).json({ detail: 'Reminder not found' });
    }

    const { title, description, category, dueDatetime, completed, clientMutationId } = req.body;
    if (title !== undefined) existing.title = title;
    if (description !== undefined) existing.description = description;
    if (category !== undefined) existing.category = category;
    if (dueDatetime !== undefined) existing.due_datetime = dueDatetime;
    if (completed !== undefined) existing.completed = completed;
    if (clientMutationId !== undefined) existing.client_mutation_id = clientMutationId;

    res.json({
      message: 'Reminder updated successfully',
      reminder: {
        id: existing.id,
        title: existing.title,
        description: existing.description,
        category: existing.category,
        dueDatetime: existing.due_datetime,
        completed: existing.completed,
        clientMutationId: existing.client_mutation_id,
        created_at: existing.created_at,
      },
    });
  });

  app.delete('/reminders/:id', (req, res) => {
    const user = authenticate(req, res);
    if (!user) return;
    const reminderId = Number(req.params.id);
    const index = reminders.findIndex((r) => r.id === reminderId && r.user_id === user.id);
    if (index === -1) {
      return res.status(404).json({ detail: 'Reminder not found' });
    }
    reminders.splice(index, 1);
    res.json({ message: 'Reminder deleted successfully' });
  });

  // ----------------------------------------------------------
  // Game Sessions Routes (Preserved)
  // ----------------------------------------------------------

  function serializeSession(s: GameSession) {
    return {
      id: s.id,
      game: s.game,
      difficulty: s.difficulty,
      accuracy: s.accuracy,
      mistakes: s.mistakes,
      time: s.time,
      completed: s.completed,
      matches: s.matches,
      sequenceLength: s.sequence_length,
      targetCount: s.target_count,
      correct: s.correct,
      wrong: s.wrong,
      clientSessionId: s.client_session_id,
      created_at: s.created_at,
    };
  }

  app.get('/game-sessions', (req, res) => {
    const user = authenticate(req, res);
    if (!user) return;
    const sessions = gameSessions
      .filter((s) => s.user_id === user.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json({
      count: sessions.length,
      sessions: sessions.map(serializeSession),
    });
  });

  app.post('/game-sessions', (req, res) => {
    const user = authenticate(req, res);
    if (!user) return;
    const sessionData = req.body;

    if (sessionData.clientSessionId) {
      const existing = gameSessions.find(
        (s) => s.user_id === user.id && s.client_session_id === sessionData.clientSessionId
      );
      if (existing) {
        return res.json({
          message: 'Game session already saved',
          session: serializeSession(existing),
          idempotent: true,
        });
      }
    }

    const newSession: GameSession = {
      id: nextSessionId++,
      user_id: user.id,
      game: sessionData.game || 'Memory Match',
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
      session: serializeSession(newSession),
    });
  });

  // ----------------------------------------------------------
  // Recommendation Route (Preserved)
  // ----------------------------------------------------------

  app.get('/recommendation', (req, res) => {
    const user = authenticate(req, res);
    if (!user) return;

    const completedSessions = gameSessions
      .filter((s) => s.user_id === user.id && s.completed && GAME_NAMES.includes(s.game))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 60);

    const grouped: Record<string, GameSession[]> = {
      'Memory Match': [],
      'Sequence Memory': [],
      'Object Recall': [],
    };
    for (const session of completedSessions) {
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
      summary.confidence = summary.sessions < 3 ? 'low' : summary.sessions < 6 ? 'moderate' : 'high';
      summaries[game] = summary;
    }

    if (!completedSessions.length) {
      return res.json({
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
    }

    let recommendedGame = GAME_NAMES[0];
    let highestScore = -1;
    for (const game of GAME_NAMES) {
      if (summaries[game].priority_score > highestScore) {
        highestScore = summaries[game].priority_score;
        recommendedGame = game;
      }
    }

    const selectedSummary = summaries[recommendedGame];
    const recommendedDifficulty = chooseDifficulty(recommendedGame, selectedSummary);
    const reason = buildReason(recommendedGame, recommendedDifficulty, selectedSummary);

    res.json({
      recommendation: {
        game: recommendedGame,
        difficulty: recommendedDifficulty,
        reason,
        performance_status: selectedSummary.performance_status,
      },
      based_on_sessions: completedSessions.length,
      engine: 'rule-based-v3',
      personalization: 'performance-based',
      confidence: selectedSummary.confidence,
      game_summaries: summaries,
    });
  });

  // ----------------------------------------------------------
  // Caregiver Links Routes (Preserved)
  // ----------------------------------------------------------

  function buildLinkResponse(link: CaregiverLink) {
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

  app.get('/caregiver-links', (req, res) => {
    const user = authenticate(req, res);
    if (!user) return;

    let relevantLinks: CaregiverLink[] = [];
    if (user.role === 'caregiver') {
      relevantLinks = caregiverLinks.filter((l) => l.caregiver_id === user.id);
    } else {
      relevantLinks = caregiverLinks.filter((l) => l.elderly_id === user.id);
    }

    relevantLinks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(relevantLinks.map(buildLinkResponse));
  });

  app.post('/caregiver-links', (req, res) => {
    const user = authenticate(req, res);
    if (!user) return;
    if (user.role !== 'caregiver') {
      return res.status(403).json({ detail: 'Only caregiver accounts can send link requests.' });
    }

    const { elderly_email } = req.body;
    if (!elderly_email) {
      return res.status(400).json({ detail: 'Elderly email is required.' });
    }
    const cleanEmail = elderly_email.trim().toLowerCase();
    const elderlyUser = users.find((u) => u.email === cleanEmail && u.is_active);
    if (!elderlyUser) {
      return res.status(404).json({ detail: 'No elderly user was found with that email address.' });
    }
    if (elderlyUser.role !== 'elderly') {
      return res.status(400).json({ detail: 'The selected account is not an elderly user account.' });
    }
    if (elderlyUser.id === user.id) {
      return res.status(400).json({ detail: 'A user cannot link to their own account.' });
    }

    const existing = caregiverLinks.find((l) => l.caregiver_id === user.id && l.elderly_id === elderlyUser.id);
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

    const newLink: CaregiverLink = {
      id: nextLinkId++,
      caregiver_id: user.id,
      elderly_id: elderlyUser.id,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    caregiverLinks.push(newLink);
    res.status(201).json(buildLinkResponse(newLink));
  });

  app.put('/caregiver-links/:id', (req, res) => {
    const user = authenticate(req, res);
    if (!user) return;
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

    const { status: decisionStatus } = req.body;
    if (decisionStatus !== 'approved' && decisionStatus !== 'rejected') {
      return res.status(400).json({ detail: 'Status must be approved or rejected.' });
    }

    link.status = decisionStatus;
    res.json(buildLinkResponse(link));
  });

  app.get('/caregiver-links/:id/data', (req, res) => {
    const user = authenticate(req, res);
    if (!user) return;
    if (user.role !== 'caregiver') {
      return res.status(403).json({ detail: 'Only caregiver accounts can access linked elderly data.' });
    }

    const linkId = Number(req.params.id);
    const link = caregiverLinks.find((l) => l.id === linkId && l.caregiver_id === user.id && l.status === 'approved');
    if (!link) {
      return res.status(404).json({ detail: 'Approved caregiver link not found.' });
    }

    const elderlyUser = users.find((u) => u.id === link.elderly_id && u.is_active);
    if (!elderlyUser) {
      return res.status(404).json({ detail: 'Linked elderly user was not found.' });
    }

    const userSessions = gameSessions
      .filter((s) => s.user_id === elderlyUser.id)
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

    const memoryCount = memories.filter((m) => m.user_id === elderlyUser.id).length;

    const userReminders = reminders
      .filter((r) => r.user_id === elderlyUser.id)
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
      elderly_user: { id: elderlyUser.id, full_name: elderlyUser.full_name },
      sessions: userSessions,
      memory_count: memoryCount,
      reminders: userReminders,
    });
  });

  app.delete('/caregiver-links/:id', (req, res) => {
    const user = authenticate(req, res);
    if (!user) return;
    const linkId = Number(req.params.id);
    const linkIndex = caregiverLinks.findIndex(
      (l) => l.id === linkId && (l.caregiver_id === user.id || l.elderly_id === user.id)
    );
    if (linkIndex === -1) {
      return res.status(404).json({ detail: 'Caregiver link not found or access denied.' });
    }
    caregiverLinks.splice(linkIndex, 1);
    res.json({ message: 'Caregiver link removed successfully.' });
  });

  // ----------------------------------------------------------
  // Frontend Mounting (Vite dev middleware or static serving)
  // ----------------------------------------------------------

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve('dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = 3000;
  const HOST = '0.0.0.0';
  app.listen(PORT, HOST, () => {
    console.log(`Cognicare full-stack server running on http://${HOST}:${PORT}`);
  });
}

startApp().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
