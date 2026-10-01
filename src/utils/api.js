import { getAccessToken, getStoredUser, logout } from './auth'
import {
  cacheServerCollection,
  getCachedCollection,
  handleOfflineMutation,
  syncPendingOfflineData,
} from './offlineData'


const API_URL = 'http://127.0.0.1:8000'


export class ApiError extends Error {
  constructor(message, status = null, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}


function getMethod(options) {
  return (options.method || 'GET').toUpperCase()
}


function getOfflineResource(path) {
  if (path === '/memories') {
    return 'memories'
  }

  if (path === '/reminders') {
    return 'reminders'
  }

  return null
}


function isNetworkOffline() {
  return (
    typeof navigator !== 'undefined' &&
    navigator.onLine === false
  )
}


function buildOfflineCollectionResponse(
  resource,
) {
  const items = getCachedCollection(resource)
  const collectionKey = resource

  return {
    count: items.length,
    [collectionKey]: items,
    local: true,
    offline: true,
  }
}


function getLocalPerformanceResponse() {
  const userId = getStoredUser()?.id || null

  if (!userId) {
    return {
      count: 0,
      sessions: [],
      local: true,
      offline: true,
    }
  }

  const key =
    `cognicare-performance-history-${userId}`
  const raw = localStorage.getItem(key)

  if (!raw) {
    return {
      count: 0,
      sessions: [],
      local: true,
      offline: true,
    }
  }

  try {
    const parsed = JSON.parse(raw)
    const history = Array.isArray(parsed)
      ? parsed
      : []

    return {
      count: history.length,
      sessions: history.map((item) => ({
        ...item,
        created_at:
          item.created_at ||
          item.date ||
          null,
      })),
      local: true,
      offline: true,
    }
  } catch {
    return {
      count: 0,
      sessions: [],
      local: true,
      offline: true,
    }
  }
}


function getMutationPathInfo(path) {
  const match = path.match(
    /^\/(memories|reminders)(?:\/([^/]+))?$/,
  )

  if (!match) {
    return null
  }

  return {
    resource: match[1],
    itemId: match[2] || null,
  }
}


export async function apiRequest(
  path,
  options = {},
) {
  const token = getAccessToken()
  const method = getMethod(options)
  const offlineResource =
    getOfflineResource(path)

  const headers = {
    ...(options.headers || {}),
  }

  if (
    options.body &&
    !headers['Content-Type']
  ) {
    headers['Content-Type'] =
      'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  // ----------------------------------------------------------
  // Offline-first read fallback.
  // ----------------------------------------------------------

  if (isNetworkOffline()) {
    if (
      method === 'GET' &&
      offlineResource &&
      token
    ) {
      return buildOfflineCollectionResponse(
        offlineResource,
      )
    }

    if (
      method === 'GET' &&
      path === '/game-sessions' &&
      token
    ) {
      return getLocalPerformanceResponse()
    }

    const mutationInfo =
      getMutationPathInfo(path)

    if (
      mutationInfo &&
      token &&
      method !== 'GET'
    ) {
      const body = options.body
        ? JSON.parse(options.body)
        : {}

      const localResponse =
        handleOfflineMutation(
          mutationInfo.resource,
          method,
          mutationInfo.itemId,
          body,
        )

      if (localResponse) {
        return localResponse
      }
    }
  }

  // Sync older offline changes before refreshing
  // a collection from the server.
  if (
    method === 'GET' &&
    offlineResource &&
    token &&
    !isNetworkOffline()
  ) {
    await syncPendingOfflineData()
  }

  let response

  try {
    response = await fetch(
      `${API_URL}${path}`,
      {
        ...options,
        headers,
      },
    )
  } catch (error) {
    // A failed fetch means the backend is unreachable.
    // Save memories/reminders locally rather than losing
    // the user's action.
    const mutationInfo =
      getMutationPathInfo(path)

    if (
      error instanceof TypeError &&
      mutationInfo &&
      token &&
      method !== 'GET'
    ) {
      const body = options.body
        ? JSON.parse(options.body)
        : {}

      const localResponse =
        handleOfflineMutation(
          mutationInfo.resource,
          method,
          mutationInfo.itemId,
          body,
        )

      if (localResponse) {
        return localResponse
      }
    }

    if (
      error instanceof TypeError &&
      method === 'GET' &&
      offlineResource &&
      token
    ) {
      return buildOfflineCollectionResponse(
        offlineResource,
      )
    }

    if (
      error instanceof TypeError &&
      method === 'GET' &&
      path === '/game-sessions' &&
      token
    ) {
      return getLocalPerformanceResponse()
    }

    throw error
  }

  if (response.status === 401) {
    logout()
    window.dispatchEvent(
      new Event('cognicare-auth-expired'),
    )

    throw new ApiError(
      'Your session has expired. Please log in again.',
      401,
    )
  }

  const contentType =
    response.headers.get('content-type') || ''

  let data

  if (
    contentType.includes('application/json')
  ) {
    data = await response.json()
  } else {
    data = await response.text()
  }

  if (!response.ok) {
    const message =
      typeof data === 'object' && data?.detail
        ? data.detail
        : `Request failed with status ${response.status}`

    throw new ApiError(
      message,
      response.status,
      data,
    )
  }

  // Cache successful server collections locally.
  if (
    method === 'GET' &&
    offlineResource &&
    data &&
    Array.isArray(data[offlineResource])
  ) {
    data = {
      ...data,
      [offlineResource]:
        cacheServerCollection(
          offlineResource,
          data[offlineResource],
        ),
    }
  }

  return data
}


export async function apiGet(path) {
  return apiRequest(path)
}


export async function apiPost(
  path,
  body,
) {
  return apiRequest(path, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}


export async function apiPut(
  path,
  body,
) {
  return apiRequest(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}


export async function apiDelete(path) {
  return apiRequest(path, {
    method: 'DELETE',
  })
}
