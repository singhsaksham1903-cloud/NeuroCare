import { apiPost, ApiError } from './api'

import {
  getAccessToken,
  getStoredUser,
} from './auth'


const PERFORMANCE_KEY =
  'cognicare-performance-history'

const PENDING_SESSIONS_PREFIX =
  'cognicare-pending-game-sessions-'


function getCurrentUserId() {
  return getStoredUser()?.id || null
}


function getPerformanceHistoryKey() {
  const userId = getCurrentUserId()

  if (!userId) {
    return null
  }

  return `${PERFORMANCE_KEY}-${userId}`
}


function getPendingQueueKey() {
  const userId = getCurrentUserId()

  if (!userId) {
    return null
  }

  return `${PENDING_SESSIONS_PREFIX}${userId}`
}


function createClientSessionId() {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return `session-${crypto.randomUUID()}`
  }

  return `session-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`
}


export function getPerformanceHistory() {
  const historyKey =
    getPerformanceHistoryKey()

  if (!historyKey) {
    return []
  }

  const savedData =
    localStorage.getItem(historyKey)

  if (!savedData) {
    return []
  }

  try {
    const parsedData = JSON.parse(savedData)

    return Array.isArray(parsedData)
      ? parsedData
      : []
  } catch {
    return []
  }
}


function savePerformanceHistory(history) {
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


function getPendingGameSessions() {
  const queueKey = getPendingQueueKey()

  if (!queueKey) {
    return []
  }

  const savedQueue =
    localStorage.getItem(queueKey)

  if (!savedQueue) {
    return []
  }

  try {
    const parsedQueue = JSON.parse(savedQueue)

    return Array.isArray(parsedQueue)
      ? parsedQueue
      : []
  } catch {
    localStorage.removeItem(queueKey)
    return []
  }
}


function savePendingGameSessions(sessions) {
  const queueKey = getPendingQueueKey()

  if (!queueKey) {
    return
  }

  localStorage.setItem(
    queueKey,
    JSON.stringify(sessions),
  )
}


function queueGameSession(result) {
  const userId = getCurrentUserId()
  const accessToken = getAccessToken()

  if (!userId || !accessToken) {
    return false
  }

  const pendingSessions =
    getPendingGameSessions()

  const queuedSession = {
    queueId: createClientSessionId(),
    clientSessionId:
      result.clientSessionId ||
      createClientSessionId(),
    userId,
    queuedAt: new Date().toISOString(),
    ...result,
  }

  const updatedQueue = [
    ...pendingSessions,
    queuedSession,
  ].slice(-100)

  savePendingGameSessions(updatedQueue)

  window.dispatchEvent(
    new CustomEvent(
      'cognicare:offline-session-queued',
    ),
  )

  return true
}


function isNetworkError(error) {
  return error instanceof TypeError
}


export async function syncPendingGameSessions() {
  const userId = getCurrentUserId()
  const accessToken = getAccessToken()

  if (!userId || !accessToken) {
    return {
      synced: 0,
      remaining: 0,
    }
  }

  if (
    typeof navigator !== 'undefined' &&
    !navigator.onLine
  ) {
    return {
      synced: 0,
      remaining: getPendingGameSessions().length,
    }
  }

  let remainingSessions =
    getPendingGameSessions()

  if (remainingSessions.length === 0) {
    return {
      synced: 0,
      remaining: 0,
    }
  }

  let syncedCount = 0

  while (remainingSessions.length > 0) {
    const current = remainingSessions[0]

    try {
      await apiPost(
        '/game-sessions',
        current,
      )

      syncedCount += 1
      remainingSessions =
        remainingSessions.slice(1)

      savePendingGameSessions(
        remainingSessions,
      )
    } catch (error) {
      if (
        isNetworkError(error) ||
        error instanceof ApiError
      ) {
        // Keep the failed item and everything after it.
        savePendingGameSessions(
          remainingSessions,
        )
        break
      }

      savePendingGameSessions(
        remainingSessions,
      )
      break
    }
  }

  window.dispatchEvent(
    new CustomEvent(
      'cognicare:performance-updated',
    ),
  )

  return {
    synced: syncedCount,
    remaining: remainingSessions.length,
  }
}


export async function savePerformanceResult(result) {
  const history = getPerformanceHistory()

  const clientSessionId =
    result.clientSessionId ||
    createClientSessionId()

  const localResult = {
    id: Date.now(),
    clientSessionId,
    date: new Date().toISOString(),
    ...result,
  }

  const updatedHistory = [
    localResult,
    ...history,
  ].slice(0, 100)

  savePerformanceHistory(updatedHistory)

  const accessToken = getAccessToken()

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

  const requestPayload = {
    ...result,
    clientSessionId,
  }

  if (
    typeof navigator !== 'undefined' &&
    !navigator.onLine
  ) {
    queueGameSession(requestPayload)

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

  await syncPendingGameSessions()

  try {
    const backendResult =
      await apiPost(
        '/game-sessions',
        requestPayload,
      )

    window.dispatchEvent(
      new CustomEvent(
        'cognicare:performance-updated',
      ),
    )

    return backendResult
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn(
        'Backend unavailable. Game result queued for later sync.',
      )

      queueGameSession(requestPayload)

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

    if (!getAccessToken()) {
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


export function clearPerformanceHistory() {
  const historyKey =
    getPerformanceHistoryKey()

  if (!historyKey) {
    return
  }

  localStorage.removeItem(historyKey)
}


if (
  typeof window !== 'undefined'
) {
  window.addEventListener(
    'online',
    () => {
      void syncPendingGameSessions()
    },
  )
}
