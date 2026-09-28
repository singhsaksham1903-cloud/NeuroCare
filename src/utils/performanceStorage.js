import {
  apiPost,
} from './api'

import {
  getAccessToken,
  getStoredUser,
} from './auth'


const PERFORMANCE_KEY =
  'cognicare-performance-history'

const PENDING_SESSIONS_PREFIX =
  'cognicare-pending-game-sessions-'


// ============================================================
// Get Current User ID
// ============================================================

function getCurrentUserId() {
  const user = getStoredUser()

  return user?.id || null
}
function getPerformanceHistoryKey() {
  const userId =
    getCurrentUserId()

  if (!userId) {
    return null
  }

  return `${PERFORMANCE_KEY}-${userId}`
}


// ============================================================
// Get User-Specific Pending Queue Key
// ============================================================

function getPendingQueueKey() {
  const userId =
    getCurrentUserId()

  if (!userId) {
    return null
  }

  return `${PENDING_SESSIONS_PREFIX}${userId}`
}


// ============================================================
// Read Performance History
// ============================================================

export function getPerformanceHistory() {
  const historyKey =
    getPerformanceHistoryKey()

  if (!historyKey) {
    return []
  }
  const savedData =
    localStorage.getItem(
      historyKey,
    )

  if (!savedData) {
    return []
  }

  try {
    const parsedData =
      JSON.parse(savedData)

    return Array.isArray(parsedData)
      ? parsedData
      : []
  } catch {
    return []
  }
}


// ============================================================
// Save Performance History
// ============================================================

function savePerformanceHistory(
  history,
) {
  const historyKey =
    getPerformanceHistoryKey()

  if (!historyKey) {
    return
  }

  localStorage.setItem(
    historyKey,
    JSON.stringify(history),
  )
}


// ============================================================
// Read Pending Game Sessions
// ============================================================

function getPendingGameSessions() {
  const queueKey =
    getPendingQueueKey()

  if (!queueKey) {
    return []
  }

  const savedQueue =
    localStorage.getItem(queueKey)

  if (!savedQueue) {
    return []
  }

  try {
    const parsedQueue =
      JSON.parse(savedQueue)

    return Array.isArray(parsedQueue)
      ? parsedQueue
      : []
  } catch {
    localStorage.removeItem(
      queueKey,
    )

    return []
  }
}


// ============================================================
// Save Pending Game Sessions
// ============================================================

function savePendingGameSessions(
  sessions,
) {
  const queueKey =
    getPendingQueueKey()

  if (!queueKey) {
    return
  }

  localStorage.setItem(
    queueKey,
    JSON.stringify(sessions),
  )
}


// ============================================================
// Add Result to Offline Queue
// ============================================================

function queueGameSession(
  result,
) {
  const userId =
    getCurrentUserId()

  const accessToken =
    getAccessToken()

  // Never queue data without an authenticated user.
  if (!userId || !accessToken) {
    return false
  }

  const pendingSessions =
    getPendingGameSessions()

  const queuedSession = {
    queueId: `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,

    userId,

    queuedAt:
      new Date().toISOString(),

    ...result,
  }

  const updatedQueue = [
    ...pendingSessions,
    queuedSession,
  ].slice(-50)

  savePendingGameSessions(
    updatedQueue,
  )

  window.dispatchEvent(
    new CustomEvent(
      'cognicare:offline-session-queued',
    ),
  )

  return true
}


// ============================================================
// Sync Pending Game Sessions
// ============================================================

export async function syncPendingGameSessions() {
  const userId =
    getCurrentUserId()

  const accessToken =
    getAccessToken()

  // No authenticated user.
  if (!userId || !accessToken) {
    return {
      synced: 0,
      remaining: 0,
    }
  }

  // Browser reports no network connection.
  if (
    typeof navigator !== 'undefined' &&
    !navigator.onLine
  ) {
    return {
      synced: 0,
      remaining:
        getPendingGameSessions().length,
    }
  }

  const pendingSessions =
    getPendingGameSessions()

  if (
    pendingSessions.length === 0
  ) {
    return {
      synced: 0,
      remaining: 0,
    }
  }

  let syncedCount = 0

  const remainingSessions = []

  for (
    const session
    of pendingSessions
  ) {
    try {
      await apiPost(
        '/game-sessions',
        session,
      )

      syncedCount += 1

    } catch (error) {
      // Network failure:
      // keep the session for a future retry.
      if (
        error instanceof TypeError
      ) {
        remainingSessions.push(
          session,
        )

        continue
      }

      // Authentication/session failure:
      // do not keep retrying after logout.
      if (
        !getAccessToken()
      ) {
        remainingSessions.push(
          ...pendingSessions.slice(
            syncedCount,
          ),
        )

        break
      }

      // Other backend errors:
      // keep the session so we don't lose the result.
      remainingSessions.push(
        session,
      )
    }
  }

  savePendingGameSessions(
    remainingSessions,
  )

  window.dispatchEvent(
    new CustomEvent(
      'cognicare:performance-updated',
    ),
  )

  return {
    synced: syncedCount,
    remaining:
      remainingSessions.length,
  }
}


// ============================================================
// Save Game Performance Result
// ============================================================

export async function savePerformanceResult(
  result,
) {
  const history =
    getPerformanceHistory()

  const localResult = {
    id: Date.now(),
    date:
      new Date().toISOString(),
    ...result,
  }

  const updatedHistory = [
    localResult,
    ...history,
  ].slice(0, 50)

  savePerformanceHistory(
    updatedHistory,
  )

  const accessToken =
    getAccessToken()

  // ----------------------------------------------------------
  // User is not authenticated.
  // Keep local copy only.
  // ----------------------------------------------------------

  if (!accessToken) {
    window.dispatchEvent(
      new CustomEvent(
        'cognicare:performance-updated',
      ),
    )

    return {
      local: true,
      result: localResult,
    }
  }

  // ----------------------------------------------------------
  // Browser is offline.
  // Queue the authenticated session locally.
  // ----------------------------------------------------------

  if (
    typeof navigator !== 'undefined' &&
    !navigator.onLine
  ) {
    queueGameSession(result)

    window.dispatchEvent(
      new CustomEvent(
        'cognicare:performance-updated',
      ),
    )

    return {
      local: true,
      queued: true,
      result: localResult,
    }
  }


  // ----------------------------------------------------------
  // Try to synchronize older pending sessions first.
  // ----------------------------------------------------------

  await syncPendingGameSessions()


  // ----------------------------------------------------------
  // Try saving the current result online.
  // ----------------------------------------------------------

  try {
    const backendResult =
      await apiPost(
        '/game-sessions',
        result,
      )


    window.dispatchEvent(
      new CustomEvent(
        'cognicare:performance-updated',
      ),
    )

    return backendResult

  } catch (error) {

    // --------------------------------------------------------
    // Network failure:
    // save to the offline queue.
    // --------------------------------------------------------

    if (
      error instanceof TypeError
    ) {
      console.warn(
        'Backend unavailable. Game result queued for later sync.',
      )

      queueGameSession(result)

      window.dispatchEvent(
        new CustomEvent(
          'cognicare:performance-updated',
        ),
      )

      return {
        local: true,
        queued: true,
        result: localResult,
      }
    }


    // --------------------------------------------------------
    // Authentication failure:
    // do not pretend this is an offline result.
    // --------------------------------------------------------

    if (
      !getAccessToken()
    ) {
      console.warn(
        'Game result kept locally because the user session is no longer authenticated.',
      )

      window.dispatchEvent(
        new CustomEvent(
          'cognicare:performance-updated',
        ),
      )

      return {
        local: true,
        result: localResult,
      }
    }


    // --------------------------------------------------------
    // Other backend error:
    // Keep the local copy and report the error.
    // --------------------------------------------------------



    window.dispatchEvent(
      new CustomEvent(
        'cognicare:performance-updated',
      ),
    )

    return {
      local: true,
      result: localResult,
      error: error.message,
    }
  }
}


// ============================================================
// Clear Local Performance History
// ============================================================

export function clearPerformanceHistory() {
  const historyKey =
    getPerformanceHistoryKey()

  if (!historyKey) {
    return
  }

  localStorage.removeItem(
    historyKey,
  )
}


// ============================================================
// Automatic Sync When Internet Returns
// ============================================================

if (
  typeof window !== 'undefined'
) {
  window.addEventListener(
    'online',
    () => {
      syncPendingGameSessions()
    },
  )
}