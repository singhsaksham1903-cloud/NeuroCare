import { GoogleGenAI } from '@google/genai';

// ============================================================
// Types & Interfaces
// ============================================================

export interface DailyActivityItem {
  id: string;
  gameId: string; // 'sequence-memory' | 'memory-match' | 'object-recall' | 'ner-cultural-recall' | 'personal-memory'
  gameName: string;
  category: string;
  recommendedDifficulty: string;
  estimatedDuration: string;
  description: string;
  reason: string;
  completed: boolean;
  completedAt: string | null;
  accuracy: number | null;
}

export interface DailyBrainPlanRecord {
  id: string;
  userId: number;
  planDate: string; // YYYY-MM-DD
  companionGreeting: string;
  focusTitle: string;
  encouragementNote: string;
  activities: DailyActivityItem[];
  completedCount: number;
  totalCount: number;
  source: 'gemini' | 'rule-based';
  aiPowered: boolean;
  disclaimer: string;
  createdAt: string;
  updatedAt: string;
}

export interface GameSessionHistoryItem {
  id: number;
  user_id: number;
  game: string;
  difficulty: string;
  accuracy: number;
  mistakes: number;
  time: number;
  completed: boolean;
  created_at: string;
}

export interface MemoryItem {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
}

// ============================================================
// Game Catalogue Definitions
// ============================================================

export const GAME_CATALOGUE = [
  {
    gameId: 'sequence-memory',
    gameName: 'Sequence Memory',
    category: 'Pattern & Working Memory',
    estimatedDuration: '5 minutes',
    allowedDifficulties: ['Easy', 'Medium', 'Hard'],
    defaultDifficulty: 'Easy',
    description: 'Follow the gentle musical and visual pattern, then repeat it step-by-step.',
  },
  {
    gameId: 'memory-match',
    gameName: 'Memory Match',
    category: 'Visual & Spatial Memory',
    estimatedDuration: '4 minutes',
    allowedDifficulties: ['Standard'],
    defaultDifficulty: 'Standard',
    description: 'Turn over pairs of cards to discover and recall familiar pictures.',
  },
  {
    gameId: 'object-recall',
    gameName: 'Object Recall',
    category: 'Focus & Short-Term Recall',
    estimatedDuration: '5 minutes',
    allowedDifficulties: ['Easy', 'Medium', 'Hard'],
    defaultDifficulty: 'Easy',
    description: 'Take a calm look at everyday objects on the screen, then pick the ones you remember.',
  },
  {
    gameId: 'ner-cultural-recall',
    gameName: 'Cultural Recall',
    category: 'Cultural & Semantic Memory',
    estimatedDuration: '5 minutes',
    allowedDifficulties: ['Easy', 'Medium', 'Hard'],
    defaultDifficulty: 'Easy',
    description: 'Celebrate your heritage by recalling traditional festivals, monuments, and crafts.',
  },
  {
    gameId: 'personal-memory',
    gameName: 'Personal Memory Recall',
    category: 'Autobiographical Memory',
    estimatedDuration: '3 minutes',
    allowedDifficulties: ['Personalized'],
    defaultDifficulty: 'Personalized',
    description: 'Gentle, heartwarming recall based on your cherished family photos and milestone moments.',
  },
];

// ============================================================
// Adaptive Difficulty Engine
// ============================================================

export function computeAdaptiveDifficulty(
  gameName: string,
  userSessions: GameSessionHistoryItem[]
): {
  difficulty: string;
  reason: string;
  status: 'new' | 'improving' | 'struggling' | 'stable';
  recentAccuracy: number | null;
} {
  const catalogEntry = GAME_CATALOGUE.find(
    (g) => g.gameName.toLowerCase() === gameName.toLowerCase()
  );

  if (!catalogEntry || catalogEntry.allowedDifficulties.length <= 1) {
    return {
      difficulty: catalogEntry?.defaultDifficulty || 'Standard',
      reason: `${gameName} maintains a gentle, comfortable standard level for steady practice.`,
      status: 'stable',
      recentAccuracy: null,
    };
  }

  // Filter completed sessions for this game, sorted newest first
  const sessions = userSessions
    .filter((s) => s.game.toLowerCase() === gameName.toLowerCase() && s.completed !== false)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // 1. No history: gentle beginner onboarding
  if (sessions.length === 0) {
    return {
      difficulty: 'Easy',
      reason: 'A welcoming starting activity to get comfortably familiar with Cognicare.',
      status: 'new',
      recentAccuracy: null,
    };
  }

  // 2. Analyze recent attempts (up to 3)
  const recent = sessions.slice(0, 3);
  const avgAccuracy = Math.round(
    recent.reduce((sum, s) => sum + (Number(s.accuracy) || 0), 0) / recent.length
  );
  const avgMistakes =
    recent.reduce((sum, s) => sum + (Number(s.mistakes) || 0), 0) / recent.length;

  const currentLevel = recent[0].difficulty || 'Easy';
  const levels = catalogEntry.allowedDifficulties;
  const currentIndex = levels.indexOf(currentLevel);
  const safeCurrentIndex = currentIndex === -1 ? 0 : currentIndex;

  // 3. Consistently high accuracy across attempts: gently increase
  if (recent.length >= 2 && avgAccuracy >= 85 && avgMistakes <= 1) {
    if (safeCurrentIndex < levels.length - 1) {
      const nextLevel = levels[safeCurrentIndex + 1];
      return {
        difficulty: nextLevel,
        reason: `Your recent accuracy has been consistently strong (${avgAccuracy}%), so we have stepped up the level to ${nextLevel}.`,
        status: 'improving',
        recentAccuracy: avgAccuracy,
      };
    }
    return {
      difficulty: currentLevel,
      reason: `You are performing with great confidence (${avgAccuracy}% accuracy) at ${currentLevel} difficulty.`,
      status: 'improving',
      recentAccuracy: avgAccuracy,
    };
  }

  // 4. Repeated difficulty / struggle: offer a gentle step down
  if (avgAccuracy < 60 || avgMistakes >= 4) {
    if (safeCurrentIndex > 0) {
      const easierLevel = levels[safeCurrentIndex - 1];
      return {
        difficulty: easierLevel,
        reason: `We have adjusted to a more comfortable pace (${easierLevel}) to help you practise with confidence.`,
        status: 'struggling',
        recentAccuracy: avgAccuracy,
      };
    }
    return {
      difficulty: levels[0],
      reason: `We'll keep practising at this comfortable level so you can take your time without pressure.`,
      status: 'struggling',
      recentAccuracy: avgAccuracy,
    };
  }

  // 5. Steady / mixed results: maintain current level
  return {
    difficulty: levels[safeCurrentIndex],
    reason: `Steady practice at ${levels[safeCurrentIndex]} reinforces your recall skills without causing fatigue.`,
    status: 'stable',
    recentAccuracy: avgAccuracy,
  };
}

// ============================================================
// Daily Plan Generator (Deterministic + Gemini AI Enhancement)
// ============================================================

export async function generatePersonalizedDailyPlan(
  userId: number,
  userName: string,
  userSessions: GameSessionHistoryItem[],
  userMemories: MemoryItem[],
  planDate: string,
  aiClient: GoogleGenAI | null,
  forceRefresh = false
): Promise<DailyBrainPlanRecord> {
  const completedToday = userSessions.filter((s) => {
    const sDate = new Date(s.created_at).toISOString().split('T')[0];
    return sDate === planDate && s.completed;
  });

  // Pick 3 balanced activities from catalogue:
  // Activity 1: Core working/visual memory (Sequence Memory or Memory Match)
  // Activity 2: Focus / Attention (Object Recall or Cultural Recall)
  // Activity 3: Reminiscence (Personal Memory if user has saved memories, else Cultural Recall or Memory Match)
  const hasMemories = userMemories.length > 0;
  
  // Decide rotation based on day of month or total sessions
  const dayNum = parseInt(planDate.split('-')[2] || '1', 10);
  const useSequenceFirst = dayNum % 2 === 0;

  const act1Info = useSequenceFirst
    ? GAME_CATALOGUE.find((g) => g.gameId === 'sequence-memory')!
    : GAME_CATALOGUE.find((g) => g.gameId === 'memory-match')!;

  const act2Info = GAME_CATALOGUE.find((g) => g.gameId === 'object-recall')!;

  const act3Info = hasMemories
    ? GAME_CATALOGUE.find((g) => g.gameId === 'personal-memory')!
    : GAME_CATALOGUE.find((g) => g.gameId === 'ner-cultural-recall')!;

  const selectedCatalog = [act1Info, act2Info, act3Info];

  // Build baseline deterministic activities with adaptive difficulties
  const activities: DailyActivityItem[] = selectedCatalog.map((catalogItem) => {
    const adaptive = computeAdaptiveDifficulty(catalogItem.gameName, userSessions);
    
    // Check if user already completed this game today
    const sessionToday = completedToday.find(
      (s) => s.game.toLowerCase() === catalogItem.gameName.toLowerCase()
    );

    return {
      id: `act-${catalogItem.gameId}`,
      gameId: catalogItem.gameId,
      gameName: catalogItem.gameName,
      category: catalogItem.category,
      recommendedDifficulty: adaptive.difficulty,
      estimatedDuration: catalogItem.estimatedDuration,
      description: catalogItem.description,
      reason: adaptive.reason,
      completed: Boolean(sessionToday),
      completedAt: sessionToday ? sessionToday.created_at : null,
      accuracy: sessionToday ? sessionToday.accuracy : null,
    };
  });

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  let companionGreeting = `${timeGreeting}, ${userName}! Welcome to your daily brain workout.`;
  let focusTitle = 'Daily Visual Focus & Memory Wellness';
  let encouragementNote = 'Take your time, enjoy each activity at your own pace, and remember that every gentle exercise helps keep your mind active.';
  let source: 'gemini' | 'rule-based' = 'rule-based';
  let aiPowered = false;

  // Try Gemini AI enhancement if key is provided
  if (aiClient && process.env.GEMINI_API_KEY) {
    try {
      const totalSessions = userSessions.length;
      const recentAccuracies = userSessions.slice(0, 5).map((s) => s.accuracy);
      const avgRecentAcc = recentAccuracies.length
        ? Math.round(recentAccuracies.reduce((a, b) => a + b, 0) / recentAccuracies.length)
        : null;

      const pseudonymousSummary = {
        totalSessions,
        avgRecentAccuracy: avgRecentAcc,
        hasPersonalMemories: hasMemories,
        timeOfDay: hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening',
        planActivities: activities.map((a) => ({
          gameId: a.gameId,
          gameName: a.gameName,
          category: a.category,
          recommendedDifficulty: a.recommendedDifficulty,
          duration: a.estimatedDuration,
        })),
      };

      const prompt = `You are a supportive, reassuring cognitive wellness companion for an older adult using the Cognicare NER memory platform.
Generate a calm, encouraging daily activity plan narrative and tailor the natural-language explanations for why each activity was selected based strictly on this pseudonymous summary:
${JSON.stringify(pseudonymousSummary, null, 2)}

Strict rules:
1. Speak in a warm, respectful, gentle elder-friendly tone.
2. NEVER mention or diagnose dementia, Alzheimer's, cognitive decline, disease progression, or medical risk.
3. Frame activities as daily brain stretches, enjoyable practice, and relaxation.
4. Output valid JSON ONLY matching this structure:
{
  "focusTitle": "Short 3-5 word inspirational focus title",
  "companionGreeting": "Warm 1-sentence greeting for the user",
  "encouragementNote": "Warm 1-2 sentence reassuring encouragement",
  "activityReasons": [
    { "gameId": "string", "reason": "1-2 sentence gentle explanation of why this activity is helpful today" }
  ]
}`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const text = response.text?.trim();
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed.focusTitle) focusTitle = parsed.focusTitle;
        if (parsed.companionGreeting) companionGreeting = parsed.companionGreeting;
        if (parsed.encouragementNote) encouragementNote = parsed.encouragementNote;

        if (Array.isArray(parsed.activityReasons)) {
          for (const item of parsed.activityReasons) {
            const matchAct = activities.find((a) => a.gameId === item.gameId);
            if (matchAct && typeof item.reason === 'string' && item.reason.trim()) {
              matchAct.reason = item.reason.trim();
            }
          }
        }
        source = 'gemini';
        aiPowered = true;
      }
    } catch (err) {
      console.warn('[Cognicare Companion] Gemini AI explanation generation skipped, using clinical rule engine:', err);
      // Fallback stays as rule-based without breaking
      source = 'rule-based';
      aiPowered = false;
    }
  }

  const completedCount = activities.filter((a) => a.completed).length;

  return {
    id: `plan-${userId}-${planDate}`,
    userId,
    planDate,
    companionGreeting,
    focusTitle,
    encouragementNote,
    activities,
    completedCount,
    totalCount: activities.length,
    source,
    aiPowered,
    disclaimer: 'Cognicare NER provides wellness-focused cognitive exercises. Recommendations and companion notes are not medical diagnoses.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
