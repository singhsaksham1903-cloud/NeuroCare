const API_URL = 'http://127.0.0.1:8000'

const TOKEN_KEY = 'cognicare-access-token'
const USER_KEY = 'cognicare-current-user'


export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY)
}


export function saveAccessToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}


export function removeAccessToken() {
  localStorage.removeItem(TOKEN_KEY)
}


export function getStoredUser() {
  const storedUser = localStorage.getItem(USER_KEY)

  if (!storedUser) {
    return null
  }

  try {
    return JSON.parse(storedUser)
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}


export function saveStoredUser(user) {
  localStorage.setItem(
    USER_KEY,
    JSON.stringify(user),
  )
}


export function removeStoredUser() {
  localStorage.removeItem(USER_KEY)
}


export function logout() {
  removeAccessToken()
  removeStoredUser()
}


export async function loginUser(email, password) {
  const response = await fetch(
    `${API_URL}/auth/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    },
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail || 'Login failed.',
    )
  }

  saveAccessToken(data.access_token)

  const user = await getCurrentUser()

  return user
}


export async function getCurrentUser() {
  const token = getAccessToken()

  if (!token) {
    return null
  }

  const response = await fetch(
    `${API_URL}/auth/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    logout()
    return null
  }

  const user = await response.json()

  saveStoredUser(user)

  return user
}


export async function registerUser(
  fullName,
  email,
  password,
  role,
) {
  const response = await fetch(
    `${API_URL}/auth/register`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        full_name: fullName,
        email,
        password,
        role,
      }),
    },
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail || 'Registration failed.',
    )
  }

  return data
}