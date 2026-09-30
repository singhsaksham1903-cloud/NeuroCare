import {
  getPerformanceHistory,
} from './performanceStorage'


// ============================================================
// Game difficulty configuration
// ============================================================

const GAME_CONFIG = {
  'Sequence Memory': {
    levels: [
      'Easy',
      'Medium',
      'Hard',
    ],
  },

  'Object Recall': {
    levels: [
      'Easy',
      'Medium',
      'Hard',
    ],
  },

  'Memory Match': {
    levels: [
      'Standard',
    ],
  },

  'Personal Memory Recall': {
    levels: [
      'Personalized',
    ],
  },
}


// ============================================================
// Safe numeric conversion
// ============================================================

function toNumber(
  value,
) {
  const number =
    Number(value)

  return Number.isFinite(
    number,
  )
    ? number
    : null
}


// ============================================================
// Average
// ============================================================

function average(
  values,
) {
  if (
    values.length === 0
  ) {
    return null
  }

  return (
    values.reduce(
      (
        total,
        value,
      ) =>
        total + value,
      0,
    ) /
    values.length
  )
}


// ============================================================
// Get recent sessions
// ============================================================

function getGameSessions(
  gameName,
) {
  const history =
    getPerformanceHistory()

  return history
    .filter(
      (session) =>
        session?.game ===
          gameName &&
        session?.completed !==
          false,
    )
    .sort(
      (
        first,
        second,
      ) => {
        const firstTime =
          new Date(
            first?.date ||
              0,
          ).getTime()

        const secondTime =
          new Date(
            second?.date ||
              0,
          ).getTime()

        return (
          secondTime -
          firstTime
        )
      },
    )
}


// ============================================================
// Get current valid difficulty
// ============================================================

function getValidDifficulty(
  gameName,
  value,
) {
  const levels =
    GAME_CONFIG[
      gameName
    ]?.levels

  if (
    !levels ||
    levels.length === 0
  ) {
    return null
  }

  return levels.includes(
    value,
  )
    ? value
    : levels[0]
}


// ============================================================
// Move one step easier
// ============================================================

function decreaseDifficulty(
  levels,
  current,
) {
  const index =
    levels.indexOf(
      current,
    )

  if (
    index <= 0
  ) {
    return levels[0]
  }

  return levels[
    index - 1
  ]
}


// ============================================================
// Move one step harder
// ============================================================

function increaseDifficulty(
  levels,
  current,
) {
  const index =
    levels.indexOf(
      current,
    )

  if (
    index < 0
  ) {
    return levels[0]
  }

  if (
    index >=
    levels.length - 1
  ) {
    return levels[
      levels.length - 1
    ]
  }

  return levels[
    index + 1
  ]
}


// ============================================================
// Main adaptive difficulty function
// ============================================================

export function getAdaptiveDifficulty(
  gameName,
) {
  const config =
    GAME_CONFIG[
      gameName
    ]

  // ----------------------------------------------------------
  // Unknown or fixed-difficulty game
  // ----------------------------------------------------------

  if (
    !config ||
    config.levels.length === 0
  ) {
    return {
      difficulty: 'Easy',
      status: 'new',
      reason:
        'No adaptive difficulty configuration is available.',
      sessionsConsidered: 0,
    }
  }


  if (
    config.levels.length === 1
  ) {
    return {
      difficulty:
        config.levels[0],

      status:
        'stable',

      reason:
        `${config.levels[0]} is the available level for this activity.`,

      sessionsConsidered:
        0,
    }
  }


  // ----------------------------------------------------------
  // Read history
  // ----------------------------------------------------------

  const sessions =
    getGameSessions(
      gameName,
    )


  // ----------------------------------------------------------
  // New user / no history
  // ----------------------------------------------------------

  if (
    sessions.length === 0
  ) {
    return {
      difficulty:
        'Easy',

      status:
        'new',

      reason:
        'Start at an easy level so Cognicare can learn your performance pattern.',

      sessionsConsidered:
        0,
    }
  }


  // ----------------------------------------------------------
  // Determine current difficulty
  // ----------------------------------------------------------

  const mostRecentSession =
    sessions[0]

  const currentDifficulty =
    getValidDifficulty(
      gameName,
      mostRecentSession?.difficulty,
    ) || 'Easy'


  // ----------------------------------------------------------
  // Use up to the most recent 3 sessions
  // ----------------------------------------------------------

  const recentSessions =
    sessions.slice(
      0,
      3,
    )

  const olderSessions =
    sessions.slice(
      3,
      6,
    )


  // ----------------------------------------------------------
  // Accuracy
  // ----------------------------------------------------------

  const recentAccuracies =
    recentSessions
      .map(
        (
          session,
        ) =>
          toNumber(
            session?.accuracy,
          ),
      )
      .filter(
        (
          value,
        ) =>
          value !==
          null,
      )


  const olderAccuracies =
    olderSessions
      .map(
        (
          session,
        ) =>
          toNumber(
            session?.accuracy,
          ),
      )
      .filter(
        (
          value,
        ) =>
          value !==
          null,
      )


  const recentAccuracy =
    average(
      recentAccuracies,
    )


  const olderAccuracy =
    average(
      olderAccuracies,
    )


  const accuracyTrend =
    recentAccuracy !==
      null &&
    olderAccuracy !==
      null
      ? recentAccuracy -
        olderAccuracy
      : 0


  // ----------------------------------------------------------
  // Mistakes
  // ----------------------------------------------------------

  const recentMistakes =
    recentSessions
      .map(
        (
          session,
        ) =>
          toNumber(
            session?.mistakes,
          ),
      )
      .filter(
        (
          value,
        ) =>
          value !==
          null,
      )


  const averageMistakes =
    average(
      recentMistakes,
    ) ?? 0


  // ----------------------------------------------------------
  // Time
  //
  // Time is used as a secondary signal because game duration
  // can vary naturally between sessions.
  // ----------------------------------------------------------

  const recentTimes =
    recentSessions
      .map(
        (
          session,
        ) =>
          toNumber(
            session?.time,
          ),
      )
      .filter(
        (
          value,
        ) =>
          value !==
          null &&
          value > 0,
      )


  const olderTimes =
    olderSessions
      .map(
        (
          session,
        ) =>
          toNumber(
            session?.time,
          ),
      )
      .filter(
        (
          value,
        ) =>
          value !==
          null &&
          value > 0,
      )


  const recentTime =
    average(
      recentTimes,
    )


  const olderTime =
    average(
      olderTimes,
    )


  const timeChangePercent =
    recentTime !==
      null &&
    olderTime !==
      null &&
    olderTime > 0
      ? (
          (
            recentTime -
            olderTime
          ) /
          olderTime
        ) *
        100
      : 0


  // ----------------------------------------------------------
  // Adaptation decision
  // ----------------------------------------------------------

  let nextDifficulty =
    currentDifficulty

  let status =
    'stable'

  let reason =
    'Your recent performance is stable, so the current difficulty is appropriate.'


  // ==========================================================
  // STRUGGLING
  // ==========================================================

  const clearlyStruggling =
    (
      recentAccuracy !==
        null &&
      recentAccuracy <
        60
    ) ||
    accuracyTrend <=
      -10 ||
    (
      recentTime >
        0 &&
      timeChangePercent >=
        25 &&
      recentAccuracy !==
        null &&
      recentAccuracy <
        80
    )


  if (
    clearlyStruggling
  ) {
    nextDifficulty =
      decreaseDifficulty(
        config.levels,
        currentDifficulty,
      )

    status =
      'struggling'

    reason =
      'Your recent performance suggests that a slightly easier level may provide a more comfortable challenge.'
  }


  // ==========================================================
  // STRONG PERFORMANCE
  // ==========================================================

  const consistentlyStrong =
    recentAccuracy !==
      null &&
    recentAccuracy >=
      85 &&
    accuracyTrend >=
      -5 &&
    averageMistakes <=
      1


  if (
    !clearlyStruggling &&
    consistentlyStrong
  ) {
    nextDifficulty =
      increaseDifficulty(
        config.levels,
        currentDifficulty,
      )

    status =
      'improving'

    reason =
      'Your recent performance has been strong, so the next session can provide a slightly greater challenge.'
  }


  // ==========================================================
  // STABLE / MIXED
  // ==========================================================

  if (
    !clearlyStruggling &&
    !consistentlyStrong
  ) {
    if (
      accuracyTrend >
      5
    ) {
      status =
        'improving'

      reason =
        'Your recent performance is improving, so the current difficulty will be maintained for a steady progression.'
    } else if (
      accuracyTrend <
      -5
    ) {
      status =
        'declining'

      reason =
        'Your recent performance has changed, so the current difficulty will be maintained while more sessions are collected.'
    }
  }


  return {
    difficulty:
      nextDifficulty,

    status,

    reason,

    sessionsConsidered:
      recentSessions.length,

    metrics: {
      recentAccuracy:
        recentAccuracy ===
        null
          ? null
          : Number(
              recentAccuracy.toFixed(
                1,
              ),
            ),

      accuracyTrend:
        Number(
          accuracyTrend.toFixed(
            1,
          ),
        ),

      averageMistakes:
        Number(
          averageMistakes.toFixed(
            1,
          ),
        ),

      timeChangePercent:
        Number(
          timeChangePercent.toFixed(
            1,
          ),
        ),
    },
  }
}