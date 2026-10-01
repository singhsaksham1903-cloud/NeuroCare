import {
  getAccessToken,
  getStoredUser,
  logout,
} from './auth'


const API_URL = 'http://127.0.0.1:8000'

const RESOURCE_CONFIG = {
  memories: {
    collectionKey: 'memories',
    itemKey: 'memory',
    cachePrefix: 'cognicare-cache-memories-',
  },
  reminders: {
    collectionKey: 'reminders',
    itemKey: 'reminder',
    cachePrefix: 'cognicare-cache-reminders-',
  },
}

const QUEUE_PREFIX =
  'cognicare-offline-mutations-'


function getCurrentUserId() {
  return getStoredUser()?.id || null
}


function createClientId(prefix) {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`
}


function getConfig(resource) {
  return RESOURCE_CONFIG[resource] || null
}


function getCacheKey(resource) {
  const config = getConfig(resource)
  const userId = getCurrentUserId()

  if (!config || !userId) {
    return null
  }

  return `${config.cachePrefix}${userId}`
}


function getQueueKey() {
  const userId = getCurrentUserId()

  if (!userId) {
    return null
  }

  return `${QUEUE_PREFIX}${userId}`
}


function readJson(key, fallback) {
  if (!key) {
    return fallback
  }

  try {
    const raw = localStorage.getItem(key)

    if (!raw) {
      return fallback
    }

    const parsed = JSON.parse(raw)

    return parsed
  } catch {
    return fallback
  }
}


function writeJson(key, value) {
  if (!key) {
    return
  }

  localStorage.setItem(
    key,
    JSON.stringify(value),
  )
}


function getQueue() {
  const queue = readJson(
    getQueueKey(),
    [],
  )

  return Array.isArray(queue) ? queue : []
}


function saveQueue(queue) {
  writeJson(getQueueKey(), queue)
}


export function getCachedCollection(resource) {
  const cached = readJson(
    getCacheKey(resource),
    [],
  )

  return Array.isArray(cached) ? cached : []
}


function applyMutationToItems(
  resource,
  items,
  mutation,
) {
  const config = getConfig(resource)
  if (!config) {
    return items
  }

  const cleanPayload = {
    ...(mutation.payload || {}),
  }

  delete cleanPayload.clientMutationId

  if (mutation.action === 'create') {
    const localItem = mutation.localItem || {
      id: mutation.localId,
      ...cleanPayload,
      created_at:
        mutation.queuedAt ||
        new Date().toISOString(),
    }

    return [
      localItem,
      ...items.filter(
        (item) =>
          String(item.id) !==
          String(localItem.id),
      ),
    ]
  }

  if (mutation.action === 'update') {
    return items.map((item) => {
      if (
        String(item.id) !==
        String(mutation.id)
      ) {
        return item
      }

      return {
        ...item,
        ...cleanPayload,
      }
    })
  }

  if (mutation.action === 'delete') {
    return items.filter(
      (item) =>
        String(item.id) !==
        String(mutation.id),
    )
  }

  return items
}


function applyPendingMutations(
  resource,
  serverItems,
) {
  return getQueue()
    .filter(
      (mutation) =>
        mutation.resource === resource,
    )
    .reduce(
      (items, mutation) =>
        applyMutationToItems(
          resource,
          items,
          mutation,
        ),
      Array.isArray(serverItems)
        ? serverItems
        : [],
    )
}


export function cacheServerCollection(
  resource,
  items,
) {
  const mergedItems =
    applyPendingMutations(
      resource,
      items,
    )

  writeJson(
    getCacheKey(resource),
    mergedItems,
  )

  return mergedItems
}


function createLocalItem(
  resource,
  localId,
  payload,
  queuedAt,
) {
  const cleanPayload = {
    ...(payload || {}),
  }

  delete cleanPayload.clientMutationId

  return {
    id: localId,
    ...cleanPayload,
    created_at: queuedAt,
  }
}


function enqueueMutation(mutation) {
  const queue = getQueue()

  const nextQueue = [
    ...queue,
    mutation,
  ].slice(-100)

  saveQueue(nextQueue)

  window.dispatchEvent(
    new CustomEvent(
      'cognicare:offline-data-updated',
    ),
  )

  return mutation
}


export function handleOfflineMutation(
  resource,
  method,
  itemId,
  body = {},
) {
  const config = getConfig(resource)
  const userId = getCurrentUserId()
  const token = getAccessToken()

  if (!config || !userId || !token) {
    return null
  }

  const normalizedMethod = method.toUpperCase()
  const queuedAt =
    new Date().toISOString()
  const clientMutationId =
    createClientId('mutation')

  if (normalizedMethod === 'POST') {
    const localId =
      -Math.abs(
        Date.now() * 1000 +
        Math.floor(Math.random() * 1000),
      )

    const payload = {
      ...(body || {}),
      clientMutationId,
    }

    const localItem = createLocalItem(
      resource,
      localId,
      payload,
      queuedAt,
    )

    cacheLocalMutation(
      resource,
      {
        action: 'create',
        localId,
        localItem,
        payload,
      },
    )

    enqueueMutation({
      id: createClientId('queue'),
      resource,
      action: 'create',
      localId,
      payload,
      localItem,
      clientMutationId,
      queuedAt,
    })

    return {
      local: true,
      queued: true,
      message:
        'Saved on this device. It will sync when you reconnect.',
      [config.itemKey]: localItem,
    }
  }

  const payload = {
    ...(body || {}),
    clientMutationId,
  }

  const numericOrStringId = itemId

  if (normalizedMethod === 'PUT') {
    cacheLocalMutation(
      resource,
      {
        action: 'update',
        id: numericOrStringId,
        payload,
      },
    )

    enqueueMutation({
      resource,
      action: 'update',
      id: numericOrStringId,
      payload,
      clientMutationId,
      queuedAt,
    })

    return {
      local: true,
      queued: true,
      message:
        'Updated on this device. It will sync when you reconnect.',
      [config.itemKey]: findCachedItem(
        resource,
        numericOrStringId,
      ),
    }
  }

  if (normalizedMethod === 'DELETE') {
    cacheLocalMutation(
      resource,
      {
        action: 'delete',
        id: numericOrStringId,
      },
    )

    enqueueMutation({
      resource,
      action: 'delete',
      id: numericOrStringId,
      payload: {},
      clientMutationId,
      queuedAt,
    })

    return {
      local: true,
      queued: true,
      message:
        'Deleted on this device. The change will sync when you reconnect.',
    }
  }

  return null
}


function findCachedItem(resource, id) {
  return getCachedCollection(resource)
    .find(
      (item) =>
        String(item.id) === String(id),
    ) || null
}


function cacheLocalMutation(
  resource,
  mutation,
) {
  const current =
    getCachedCollection(resource)

  const updated = applyMutationToItems(
    resource,
    current,
    mutation,
  )

  writeJson(
    getCacheKey(resource),
    updated,
  )
}


async function parseResponse(response) {
  const contentType =
    response.headers.get('content-type') || ''

  if (
    contentType.includes('application/json')
  ) {
    return response.json()
  }

  return response.text()
}


async function rawRequest(
  path,
  method,
  body,
) {
  const token = getAccessToken()

  if (!token) {
    throw new Error(
      'Authentication is required to synchronize offline data.',
    )
  }

  const headers = {
    Authorization: `Bearer ${token}`,
  }

  const request = {
    method,
    headers,
  }

  if (
    body !== undefined &&
    method !== 'DELETE'
  ) {
    headers['Content-Type'] =
      'application/json'

    request.body = JSON.stringify(body)
  }

  const response = await fetch(
    `${API_URL}${path}`,
    request,
  )

  const data = await parseResponse(response)

  if (response.status === 401) {
    logout()
    window.dispatchEvent(
      new Event('cognicare-auth-expired'),
    )

    const error = new Error(
      'Your session has expired. Please log in again.',
    )
    error.status = 401
    throw error
  }

  if (!response.ok) {
    const error = new Error(
      typeof data === 'object' && data?.detail
        ? data.detail
        : `Request failed with status ${response.status}`,
    )
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}


function resolveServerId(
  id,
  idMap,
) {
  if (
    id !== undefined &&
    id !== null &&
    idMap.has(String(id))
  ) {
    return idMap.get(String(id))
  }

  return id
}


function replaceLocalItemWithServerItem(
  resource,
  localId,
  serverItem,
) {
  const current =
    getCachedCollection(resource)

  const next = current.map((item) => {
    if (
      String(item.id) === String(localId)
    ) {
      return serverItem
    }

    return item
  })

  if (
    !next.some(
      (item) =>
        String(item.id) ===
        String(serverItem.id),
    )
  ) {
    return [
      serverItem,
      ...next,
    ]
  }

  return next
}


function removeCachedItem(
  resource,
  id,
) {
  const current =
    getCachedCollection(resource)

  const next = current.filter(
    (item) =>
      String(item.id) !== String(id),
  )

  writeJson(
    getCacheKey(resource),
    next,
  )
}


function updateCachedItem(
  resource,
  id,
  payload,
) {
  const current =
    getCachedCollection(resource)

  const next = current.map((item) => {
    if (String(item.id) !== String(id)) {
      return item
    }

    const cleanPayload = {
      ...(payload || {}),
    }

    delete cleanPayload.clientMutationId

    return {
      ...item,
      ...cleanPayload,
      id: item.id,
    }
  })

  writeJson(
    getCacheKey(resource),
    next,
  )
}


async function syncOneMutation(
  mutation,
  idMap,
) {
  const serverId =
    resolveServerId(
      mutation.id,
      idMap,
    )

  if (
    mutation.action === 'create'
  ) {
    const response =
      await rawRequest(
        `/${mutation.resource}`,
        'POST',
        mutation.payload,
      )

    const config =
      getConfig(mutation.resource)
    const serverItem =
      response?.[config.itemKey]

    if (serverItem?.id !== undefined) {
      idMap.set(
        String(mutation.localId),
        serverItem.id,
      )
      writeJson(
        getCacheKey(mutation.resource),
        replaceLocalItemWithServerItem(
          mutation.resource,
          mutation.localId,
          serverItem,
        ),
      )
    }

    return
  }

  if (
    mutation.action === 'update'
  ) {
    if (
      serverId === undefined ||
      serverId === null
    ) {
      throw new Error(
        'Waiting for the related offline create operation to synchronize.',
      )
    }

    const response =
      await rawRequest(
        `/${mutation.resource}/${serverId}`,
        'PUT',
        mutation.payload,
      )

    const config =
      getConfig(mutation.resource)
    const serverItem =
      response?.[config.itemKey]

    if (serverItem?.id !== undefined) {
      writeJson(
        getCacheKey(mutation.resource),
        replaceLocalItemWithServerItem(
          mutation.resource,
          serverId,
          serverItem,
        ),
      )
    } else {
      updateCachedItem(
        mutation.resource,
        serverId,
        mutation.payload,
      )
    }

    return
  }

  if (
    mutation.action === 'delete'
  ) {
    if (
      serverId === undefined ||
      serverId === null
    ) {
      throw new Error(
        'Waiting for the related offline create operation to synchronize.',
      )
    }

    try {
      await rawRequest(
        `/${mutation.resource}/${serverId}`,
        'DELETE',
      )
    } catch (error) {
      // DELETE is idempotent for our client:
      // if the record is already gone, the desired state is satisfied.
      if (error?.status !== 404) {
        throw error
      }
    }

    removeCachedItem(
      mutation.resource,
      serverId,
    )
  }
}


export async function syncPendingOfflineData() {
  const userId = getCurrentUserId()
  const token = getAccessToken()

  if (!userId || !token) {
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
      remaining: getQueue().length,
    }
  }

  const queue = getQueue()

  if (queue.length === 0) {
    return {
      synced: 0,
      remaining: 0,
    }
  }

  const idMap = new Map()
  let remaining = [...queue]
  let synced = 0

  while (remaining.length > 0) {
    const current = remaining[0]

    try {
      await syncOneMutation(
        current,
        idMap,
      )

      synced += 1
      remaining = remaining.slice(1)
      saveQueue(remaining)

      window.dispatchEvent(
        new CustomEvent(
          'cognicare:offline-data-updated',
        ),
      )
    } catch (error) {
      // Keep the failed operation and every
      // dependent operation for the next retry.
      saveQueue(remaining)

      window.dispatchEvent(
        new CustomEvent(
          'cognicare:offline-sync-failed',
          {
            detail: {
              resource: current.resource,
              error: error?.message || 'Sync failed',
            },
          },
        ),
      )

      break
    }
  }

  return {
    synced,
    remaining: remaining.length,
  }
}


export function getPendingOfflineCount() {
  return getQueue().length
}


if (
  typeof window !== 'undefined'
) {
  window.addEventListener(
    'online',
    () => {
      void syncPendingOfflineData()
    },
  )
}
