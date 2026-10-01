import { getStoredUser } from './auth'


export function getUserScopedStorageKey(
  prefix,
) {
  const userId = getStoredUser()?.id

  if (!userId) {
    return null
  }

  return `${prefix}-${userId}`
}
