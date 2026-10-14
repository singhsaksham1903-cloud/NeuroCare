/**
 * Cognicare NER — AI-Assisted Personal Memory Vault Engine
 * 
 * Provides:
 * 1. AI Memory Organization (Title synthesis, auto-categorization, entity extraction, mood detection, AI summaries, tag generation)
 * 2. Local Dense Vector Embeddings (64-dimensional semantic space with L2 normalization)
 * 3. Fast In-Memory Semantic & Hybrid Search (Vector cosine similarity + entity/temporal intent boosts)
 * 4. Related Memories Recommendation Engine
 * 5. Role-based Caregiver Sharing & Privacy Access Control with Audit Logging
 */

export interface MemoryRecord {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category: string;
  memory_date: string | null;
  time: string | null;
  location: string | null;
  mood: string | null;
  image_data: string | null;
  images: string[];
  audio_data: string | null;
  audio_duration?: number | null;
  tags: string[];
  people: string[];
  locations: string[];
  events: string[];
  ai_summary: string;
  embedding: number[];
  is_favorite: boolean;
  client_mutation_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemoryPermissionRecord {
  id: number;
  elderly_id: number;
  caregiver_id: number;
  access_granted: boolean;
  emergency_mode_enabled: boolean;
  updated_at: string;
}

export interface MemoryAuditLogRecord {
  id: number;
  elderly_id: number;
  caregiver_id: number;
  caregiver_name: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface MemorySearchHistoryRecord {
  id: number;
  user_id: number;
  query: string;
  result_count: number;
  timestamp: string;
}

// ============================================================
// Semantic Embedding Space (64 Dimensions)
// ============================================================

const EMBEDDING_DIM = 64;

// Semantic topic anchor clusters for projection
const SEMANTIC_CLUSTERS: Record<string, string[]> = {
  family_relations: [
    'daughter', 'son', 'mother', 'father', 'maa', 'baba', 'granddaughter', 'grandson',
    'children', 'child', 'husband', 'wife', 'brother', 'sister', 'priya', 'rohan',
    'rahul', 'meera', 'ananya', 'family', 'parents', 'aunt', 'uncle', 'cousin'
  ],
  celebration_events: [
    'wedding', 'marriage', 'anniversary', 'birthday', 'diwali', 'bihu', 'puja',
    'pooja', 'durga', 'festival', 'celebration', 'party', 'feast', 'sweets', 'laddus',
    'diyas', 'gifts', 'ceremony', 'gathering', 'ritual'
  ],
  travel_places: [
    'shillong', 'guwahati', 'assam', 'jaipur', 'kolkata', 'delhi', 'meghalaya',
    'trip', 'travel', 'journey', 'visited', 'vacation', 'hills', 'mountains',
    'tea', 'gardens', 'lake', 'river', 'brahmaputra', 'tour', 'train', 'bus'
  ],
  home_peace: [
    'home', 'garden', 'tulsi', 'verandah', 'courtyard', 'balcony', 'morning',
    'evening', 'flowers', 'jasmine', 'peaceful', 'quiet', 'serene', 'sunshine',
    'breeze', 'kitchen', 'cooking', 'tea', 'chai'
  ],
  nostalgia_memory: [
    'remember', 'memory', 'childhood', 'years', 'bygone', 'past', 'cherish',
    'story', 'reminisce', 'recollect', 'miss', 'long', 'youth', 'old', 'days'
  ],
  health_wellness: [
    'walk', 'doctor', 'medicine', 'health', 'hospital', 'resting', 'gentle',
    'stroll', 'exercise', 'care', 'fresh', 'air', 'breathing'
  ],
  positive_emotion: [
    'joy', 'happy', 'blessed', 'grateful', 'loving', 'smile', 'laughter', 'warmth',
    'proud', 'delight', 'wonderful', 'content', 'peace'
  ]
};

/**
 * Computes a deterministic 64-dimensional dense semantic embedding vector
 * using token frequency, semantic cluster projection, and n-gram hashing,
 * normalized with L2 unit norm for exact cosine similarity dot products.
 */
export function computeLocalEmbedding(text: string): number[] {
  const vec = new Float64Array(EMBEDDING_DIM);
  if (!text || text.trim().length === 0) {
    vec[0] = 1.0;
    return Array.from(vec);
  }

  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const tokens = clean.split(/\s+/).filter((t) => t.length > 1);

  // 1. Cluster alignment projection (Dimensions 0 to 27)
  const clusterKeys = Object.keys(SEMANTIC_CLUSTERS);
  clusterKeys.forEach((key, cIdx) => {
    const clusterWords = SEMANTIC_CLUSTERS[key];
    let clusterScore = 0;
    for (const token of tokens) {
      if (clusterWords.includes(token)) {
        clusterScore += 1.5;
      } else {
        // substring match for stems (e.g. 'traveling' matches 'travel')
        for (const word of clusterWords) {
          if (token.startsWith(word) || word.startsWith(token)) {
            clusterScore += 0.75;
            break;
          }
        }
      }
    }
    const baseDim = cIdx * 4;
    vec[baseDim] += clusterScore * 1.2;
    vec[baseDim + 1] += clusterScore * 0.8;
  });

  // 2. Token hash projections across all dimensions (Dimensions 0 to 63)
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    let h = 0;
    for (let j = 0; j < token.length; j++) {
      h = (h << 5) - h + token.charCodeAt(j);
      h |= 0;
    }
    const idx1 = Math.abs(h) % EMBEDDING_DIM;
    const idx2 = Math.abs((h >> 3) ^ (h << 7)) % EMBEDDING_DIM;
    const weight = 1.0 / Math.sqrt(i + 1);
    vec[idx1] += weight;
    vec[idx2] += weight * 0.5;

    // Character trigrams
    for (let k = 0; k <= token.length - 3; k++) {
      const tri = token.slice(k, k + 3);
      let triH = 0;
      for (let m = 0; m < tri.length; m++) {
        triH = (triH << 3) ^ tri.charCodeAt(m);
      }
      const triIdx = Math.abs(triH) % EMBEDDING_DIM;
      vec[triIdx] += 0.3;
    }
  }

  // 3. L2 Normalization
  let norm = 0;
  for (let d = 0; d < EMBEDDING_DIM; d++) {
    norm += vec[d] * vec[d];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let d = 0; d < EMBEDDING_DIM; d++) {
      vec[d] /= norm;
    }
  } else {
    vec[0] = 1.0;
  }

  return Array.from(vec);
}

/**
 * Computes Cosine Similarity between two L2-normalized embedding vectors.
 */
export function cosineSimilarity(v1: number[], v2: number[]): number {
  if (!v1 || !v2 || v1.length === 0 || v2.length === 0) return 0;
  let dot = 0;
  const len = Math.min(v1.length, v2.length);
  for (let i = 0; i < len; i++) {
    dot += v1[i] * v2[i];
  }
  // Clamp between 0.0 and 1.0
  return Math.max(0, Math.min(1, Math.round(dot * 1000) / 1000));
}

// ============================================================
// Entity & Concept Extraction Dictionaries
// ============================================================

const KNOWN_PEOPLE = [
  'Priya', 'Rohan', 'Rahul', 'Meera', 'Ananya', 'Dr. Ananya Sharma', 'Dr. Sharma',
  'Sunita', 'Anita', 'Amit', 'Rajesh', 'Suresh', 'Vikram', 'Geeta', 'Sita',
  'Mother', 'Father', 'Daughter', 'Son', 'Granddaughter', 'Grandson', 'Husband',
  'Wife', 'Sister', 'Brother', 'Aunt', 'Uncle', 'Maa', 'Baba', 'Dadi', 'Nani',
  'Dada', 'Nana', 'Teacher', 'Doctor', 'Friend', 'Neighbour'
];

const KNOWN_LOCATIONS = [
  'Shillong', 'Guwahati', 'Assam', 'Jaipur', 'Kolkata', 'Delhi', 'Mumbai',
  'Darjeeling', 'Meghalaya', 'Rajasthan', 'Cherrapunji', 'Kaziranga',
  'Brahmaputra', 'Kamakhya', 'Hills', 'Tea Garden', 'Verandah', 'Courtyard',
  'Home Garden', 'Temple', 'Lake', 'School', 'Railway Station'
];

const KNOWN_EVENTS = [
  { name: 'Diwali', triggers: ['diwali', 'deepavali', 'diya', 'diyas', 'laddus'] },
  { name: 'Bihu', triggers: ['bihu', 'rongali', 'bhogali', 'magh', 'dhol', 'pepa'] },
  { name: 'Durga Puja', triggers: ['durga', 'puja', 'pooja', 'pandal', 'dhaak'] },
  { name: 'Wedding', triggers: ['wedding', 'marriage', 'shaadi', 'bride', 'groom', 'vows', 'baraat', 'saptapadi'] },
  { name: 'Birthday', triggers: ['birthday', 'born', 'cake', 'candles', 'birth'] },
  { name: 'Anniversary', triggers: ['anniversary', 'milestone', 'years together'] },
  { name: 'Family Vacation', triggers: ['trip', 'tour', 'travel', 'vacation', 'holiday', 'visited'] },
  { name: 'Home Celebration', triggers: ['plantation', 'verandah', 'tulsi', 'pooja at home', 'family dinner'] },
  { name: 'Medical Visit', triggers: ['doctor', 'clinic', 'hospital', 'checkup', 'medicine'] }
];

const CATEGORIES = [
  'Birthday', 'Wedding', 'Travel', 'Family', 'Friends', 'Festival',
  'Medical', 'Childhood', 'Daily Activity', 'Other'
];

const MOODS = [
  'Joyful', 'Peaceful', 'Nostalgic', 'Grateful', 'Loving', 'Energetic', 'Reflective'
];

// ============================================================
// AI Memory Organizer Pipeline
// ============================================================

export interface MemoryAnalysisResult {
  title: string;
  category: string;
  mood: string;
  location: string | null;
  tags: string[];
  people: string[];
  locations: string[];
  events: string[];
  ai_summary: string;
  embedding: number[];
}

export function organizeMemoryWithAI(input: {
  title?: string;
  description: string;
  category?: string;
  memoryDate?: string | null;
  time?: string | null;
  location?: string | null;
  mood?: string | null;
}): MemoryAnalysisResult {
  const desc = input.description || '';
  const textFull = `${input.title || ''} ${desc}`;
  const lowerFull = textFull.toLowerCase();

  // 1. Extract People
  const detectedPeople: string[] = [];
  for (const person of KNOWN_PEOPLE) {
    const regex = new RegExp(`\\b${person}\\b`, 'i');
    if (regex.test(textFull)) {
      if (!detectedPeople.includes(person)) {
        detectedPeople.push(person);
      }
    }
  }

  // 2. Extract Locations
  const detectedLocations: string[] = [];
  if (input.location && input.location.trim()) {
    detectedLocations.push(input.location.trim());
  }
  for (const loc of KNOWN_LOCATIONS) {
    const regex = new RegExp(`\\b${loc}\\b`, 'i');
    if (regex.test(textFull)) {
      if (!detectedLocations.includes(loc)) {
        detectedLocations.push(loc);
      }
    }
  }

  // 3. Extract Events
  const detectedEvents: string[] = [];
  for (const evt of KNOWN_EVENTS) {
    if (evt.triggers.some((trigger) => lowerFull.includes(trigger))) {
      detectedEvents.push(evt.name);
    }
  }

  // 4. Auto-detect Category
  let category = input.category && input.category !== 'General' ? input.category : '';
  if (!category || category === 'Other') {
    if (lowerFull.includes('wedding') || lowerFull.includes('marriage')) {
      category = 'Wedding';
    } else if (lowerFull.includes('birthday')) {
      category = 'Birthday';
    } else if (lowerFull.includes('trip') || lowerFull.includes('shillong') || lowerFull.includes('travel') || lowerFull.includes('hills')) {
      category = 'Travel';
    } else if (lowerFull.includes('diwali') || lowerFull.includes('bihu') || lowerFull.includes('puja') || lowerFull.includes('festival')) {
      category = 'Festival';
    } else if (lowerFull.includes('childhood') || lowerFull.includes('school days') || lowerFull.includes('growing up')) {
      category = 'Childhood';
    } else if (lowerFull.includes('doctor') || lowerFull.includes('medicine') || lowerFull.includes('hospital')) {
      category = 'Medical';
    } else if (detectedPeople.some((p) => ['Daughter', 'Son', 'Priya', 'Rohan', 'Mother', 'Father', 'Maa', 'Baba'].includes(p))) {
      category = 'Family';
    } else if (lowerFull.includes('friend') || lowerFull.includes('friends') || lowerFull.includes('colleague')) {
      category = 'Friends';
    } else if (lowerFull.includes('walk') || lowerFull.includes('garden') || lowerFull.includes('morning tea')) {
      category = 'Daily Activity';
    } else {
      category = 'Family';
    }
  }

  // 5. Auto-detect Mood
  let mood = input.mood || '';
  if (!mood) {
    if (lowerFull.includes('peace') || lowerFull.includes('calm') || lowerFull.includes('tulsi') || lowerFull.includes('gentle')) {
      mood = 'Peaceful';
    } else if (lowerFull.includes('remember') || lowerFull.includes('bygone') || lowerFull.includes('198') || lowerFull.includes('199') || lowerFull.includes('miss')) {
      mood = 'Nostalgic';
    } else if (lowerFull.includes('blessed') || lowerFull.includes('grateful') || lowerFull.includes('thankful') || lowerFull.includes('prayer')) {
      mood = 'Grateful';
    } else if (lowerFull.includes('love') || lowerFull.includes('daughter') || lowerFull.includes('son') || lowerFull.includes('mother') || lowerFull.includes('hugs')) {
      mood = 'Loving';
    } else if (lowerFull.includes('dance') || lowerFull.includes('bihu') || lowerFull.includes('celebrate') || lowerFull.includes('walked')) {
      mood = 'Energetic';
    } else if (lowerFull.includes('thought') || lowerFull.includes('wisdom') || lowerFull.includes('ponder')) {
      mood = 'Reflective';
    } else {
      mood = 'Joyful';
    }
  }

  // 6. Generate Title if missing or empty
  let title = (input.title || '').trim();
  if (!title || title.toLowerCase() === 'untitled memory') {
    const primaryPerson = detectedPeople[0];
    const primaryLoc = detectedLocations[0];
    const primaryEvt = detectedEvents[0];

    if (primaryEvt && primaryLoc) {
      title = `${primaryEvt} in ${primaryLoc}`;
    } else if (primaryEvt && primaryPerson) {
      title = `${primaryEvt} with ${primaryPerson}`;
    } else if (primaryPerson && primaryLoc) {
      title = `Visit to ${primaryLoc} with ${primaryPerson}`;
    } else if (primaryEvt) {
      title = `Cherished ${primaryEvt} Memory`;
    } else if (primaryLoc) {
      title = `Beautiful Moments in ${primaryLoc}`;
    } else if (desc.length > 0) {
      // First 5-7 words
      const words = desc.split(/\s+/).slice(0, 6).join(' ');
      title = words.charAt(0).toUpperCase() + words.slice(1);
      if (!title.endsWith('.')) title += '...';
    } else {
      title = `Precious ${category} Moment`;
    }
  }

  // 7. Auto-generate Tags
  const tagSet = new Set<string>();
  tagSet.add(category.toLowerCase());
  tagSet.add(mood.toLowerCase());

  detectedPeople.forEach((p) => tagSet.add(p.toLowerCase()));
  detectedLocations.forEach((l) => tagSet.add(l.toLowerCase()));
  detectedEvents.forEach((e) => tagSet.add(e.toLowerCase()));

  // Keyword extraction for common topics
  const keywords = [
    'tea garden', 'diyas', 'sweets', 'hills', 'vacation', 'tulsi', 'flowers',
    'verandah', 'walk', 'songs', 'food', 'family', 'festive', 'traditional',
    'photos', 'cherished', 'rain', 'morning'
  ];
  keywords.forEach((kw) => {
    if (lowerFull.includes(kw)) {
      tagSet.add(kw);
    }
  });

  const tags = Array.from(tagSet).slice(0, 8);

  // 8. Generate AI Summary (warm, comforting story digest for elder users)
  let ai_summary = '';
  const dateStr = input.memoryDate ? ` from ${input.memoryDate.split('-')[0]}` : '';
  const locStr = detectedLocations[0] ? ` in ${detectedLocations[0]}` : '';
  const peopleStr = detectedPeople.length > 0 ? ` with ${detectedPeople.slice(0, 2).join(' and ')}` : '';

  if (category === 'Travel') {
    ai_summary = `A heartwarming travel memory${locStr}${peopleStr}${dateStr}, celebrating scenic journeys and time spent together.`;
  } else if (category === 'Festival' || detectedEvents.includes('Diwali') || detectedEvents.includes('Bihu')) {
    ai_summary = `A joyful festive celebration filled with warmth, sacred traditions, and cherished family gatherings${locStr}.`;
  } else if (category === 'Wedding') {
    ai_summary = `A milestone celebration of love, sacred blessings, and family happiness that brings smiles every time it is remembered.`;
  } else if (category === 'Birthday') {
    ai_summary = `A joyful birthday celebration${peopleStr}, filled with smiles, well-wishes, and warm family affection.`;
  } else {
    ai_summary = `A peaceful personal memory${locStr}${peopleStr}${dateStr}, capturing a special moment of ${mood.toLowerCase()} reflection.`;
  }

  // 9. Dense Embedding
  const embeddingText = `${title}. ${category}. ${mood}. ${desc}. ${tags.join(', ')}. ${detectedPeople.join(' ')}. ${detectedLocations.join(' ')}`;
  const embedding = computeLocalEmbedding(embeddingText);

  return {
    title,
    category,
    mood,
    location: input.location || detectedLocations[0] || null,
    tags,
    people: detectedPeople,
    locations: detectedLocations,
    events: detectedEvents,
    ai_summary,
    embedding
  };
}

// ============================================================
// Semantic Search & Natural Language Matcher
// ============================================================

export interface SearchMatch {
  memory: MemoryRecord;
  score: number;
  relevance_reason: string;
}

export function semanticSearchMemories(
  query: string,
  userMemories: MemoryRecord[]
): {
  query: string;
  extracted_entities: {
    people: string[];
    locations: string[];
    events: string[];
    year?: string;
  };
  results: SearchMatch[];
} {
  const cleanQ = (query || '').trim();
  if (!cleanQ) {
    return {
      query: cleanQ,
      extracted_entities: { people: [], locations: [], events: [] },
      results: userMemories.map((m) => ({
        memory: m,
        score: 1.0,
        relevance_reason: 'Recent memory in your vault'
      }))
    };
  }

  const queryEmbedding = computeLocalEmbedding(cleanQ);
  const qLower = cleanQ.toLowerCase();

  // Extract query entities
  const qPeople = KNOWN_PEOPLE.filter((p) => new RegExp(`\\b${p}\\b`, 'i').test(cleanQ));
  const qLocations = KNOWN_LOCATIONS.filter((l) => new RegExp(`\\b${l}\\b`, 'i').test(cleanQ));
  const qEvents = KNOWN_EVENTS.filter((e) => e.triggers.some((t) => qLower.includes(t))).map((e) => e.name);

  // Extract year if specified (e.g., "1985", "2024", "1992")
  const yearMatch = cleanQ.match(/\b(19\d{2}|20\d{2})\b/);
  const queryYear = yearMatch ? yearMatch[1] : undefined;

  const matches: SearchMatch[] = userMemories.map((mem) => {
    // 1. Base embedding cosine similarity (0.0 to 1.0)
    const baseSim = cosineSimilarity(queryEmbedding, mem.embedding || []);

    let score = baseSim;
    const reasons: string[] = [];

    // 2. Person exact / role match boost
    if (qPeople.length > 0) {
      const matchedPerson = qPeople.find((p) =>
        mem.people?.some((mp) => mp.toLowerCase().includes(p.toLowerCase())) ||
        mem.description.toLowerCase().includes(p.toLowerCase()) ||
        mem.title.toLowerCase().includes(p.toLowerCase())
      );
      if (matchedPerson) {
        score += 0.35;
        reasons.push(`Matched person: ${matchedPerson}`);
      }
    }

    // 3. Location match boost
    if (qLocations.length > 0) {
      const matchedLoc = qLocations.find((l) =>
        mem.locations?.some((ml) => ml.toLowerCase().includes(l.toLowerCase())) ||
        (mem.location && mem.location.toLowerCase().includes(l.toLowerCase())) ||
        mem.description.toLowerCase().includes(l.toLowerCase())
      );
      if (matchedLoc) {
        score += 0.35;
        reasons.push(`Location matched: ${matchedLoc}`);
      }
    }

    // 4. Event / Celebration boost
    if (qEvents.length > 0) {
      const matchedEvt = qEvents.find((e) =>
        mem.events?.includes(e) ||
        mem.category.toLowerCase().includes(e.toLowerCase()) ||
        mem.title.toLowerCase().includes(e.toLowerCase()) ||
        mem.description.toLowerCase().includes(e.toLowerCase())
      );
      if (matchedEvt) {
        score += 0.30;
        reasons.push(`Event matched: ${matchedEvt}`);
      }
    }

    // 5. Year / Date match boost
    if (queryYear) {
      if (mem.memory_date && mem.memory_date.startsWith(queryYear)) {
        score += 0.40;
        reasons.push(`Occurred in ${queryYear}`);
      } else if (mem.description.includes(queryYear) || mem.title.includes(queryYear)) {
        score += 0.35;
        reasons.push(`Year mentioned: ${queryYear}`);
      }
    }

    // 6. Word n-gram and keyword matches
    const qTokens = qLower.split(/\s+/).filter((t) => t.length > 2);
    let tokenOverlap = 0;
    for (const token of qTokens) {
      if (mem.title.toLowerCase().includes(token) || mem.tags?.some((t) => t.toLowerCase().includes(token))) {
        tokenOverlap += 1;
      }
    }
    if (tokenOverlap > 0) {
      score += Math.min(0.25, tokenOverlap * 0.08);
    }

    // Cap score at 1.0, minimum 0.0
    const finalScore = Math.min(1.0, Math.round(score * 100) / 100);

    let relevance_reason = reasons.join(' • ');
    if (!relevance_reason) {
      if (finalScore >= 0.65) {
        relevance_reason = 'Strong semantic match with story themes';
      } else if (finalScore >= 0.4) {
        relevance_reason = 'Related emotional and topical context';
      } else {
        relevance_reason = 'Topic similarity';
      }
    }

    return {
      memory: mem,
      score: finalScore,
      relevance_reason
    };
  });

  // Filter relevant results and sort by score descending
  const sorted = matches
    .filter((m) => m.score >= 0.25)
    .sort((a, b) => b.score - a.score);

  return {
    query: cleanQ,
    extracted_entities: {
      people: qPeople,
      locations: qLocations,
      events: qEvents,
      year: queryYear
    },
    results: sorted
  };
}

// ============================================================
// Related Memories Engine
// ============================================================

export function findRelatedMemories(
  targetMemory: MemoryRecord,
  allMemories: MemoryRecord[],
  limit = 3
): Array<{ memory: MemoryRecord; score: number; reason: string }> {
  const others = allMemories.filter((m) => m.id !== targetMemory.id);
  if (others.length === 0) return [];

  const scored = others.map((m) => {
    const sim = cosineSimilarity(targetMemory.embedding || [], m.embedding || []);
    let score = sim;
    const reasons: string[] = [];

    // Shared people
    const sharedPeople = (targetMemory.people || []).filter((p) =>
      (m.people || []).includes(p)
    );
    if (sharedPeople.length > 0) {
      score += 0.3;
      reasons.push(`Also shares memories with ${sharedPeople.join(', ')}`);
    }

    // Shared location
    if (
      targetMemory.location &&
      m.location &&
      (targetMemory.location.toLowerCase().includes(m.location.toLowerCase()) ||
        m.location.toLowerCase().includes(targetMemory.location.toLowerCase()))
    ) {
      score += 0.25;
      reasons.push(`Takes place in ${targetMemory.location}`);
    }

    // Category affinity (e.g. Wedding <-> Anniversary <-> Family)
    if (targetMemory.category === m.category) {
      score += 0.2;
      reasons.push(`Same category: ${targetMemory.category}`);
    } else if (
      (targetMemory.category === 'Wedding' && m.category === 'Family') ||
      (targetMemory.category === 'Family' && m.category === 'Celebration')
    ) {
      score += 0.15;
      reasons.push(`Connected celebration`);
    }

    const finalScore = Math.min(1.0, Math.round(score * 100) / 100);
    const reason = reasons.length > 0 ? reasons.join(' • ') : 'Similar cherished reflection';

    return {
      memory: m,
      score: finalScore,
      reason
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
