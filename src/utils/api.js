import { getAccessToken, logout } from './auth'

const API_URL = 'http://127.0.0.1:8000'


export async function apiRequest(
  path,
  options = {},
) {
  const token = getAccessToken()

  const headers = {
    ...(options.headers || {}),
  }

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers,
    },
  )

  if (response.status === 401) {
    logout()
    window.dispatchEvent(
      new Event('cognicare-auth-expired'),
    )

    throw new Error(
      'Your session has expired. Please log in again.',
    )
  }

  const contentType =
    response.headers.get('content-type') || ''

  let data = null

  if (contentType.includes('application/json')) {
    data = await response.json()
  } else {
    data = await response.text()
  }

  if (!response.ok) {
    const message =
      typeof data === 'object' && data?.detail
        ? data.detail
        : `Request failed with status ${response.status}`

    throw new Error(message)
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