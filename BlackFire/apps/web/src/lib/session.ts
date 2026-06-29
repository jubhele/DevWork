import type { User } from '@blackfire/types'

export const SESSION_COOKIE = 'bf_portal'

export function createDevUser(username: string): User {
  const now = new Date().toISOString()
  return {
    id: 1,
    username,
    name: username,
    email: '',
    role: 'sysadmin',
    roles: ['sysadmin'],
    permissions: [],
    client_id: null,
    active: true,
    created_at: now,
    last_login: now,
  }
}

export function encodeSession(user: User): string {
  return Buffer.from(JSON.stringify(user)).toString('base64url')
}

export function decodeSession(value: string | undefined | null): User | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as User
    if (!parsed || typeof parsed.username !== 'string') return null
    return parsed
  } catch {
    return null
  }
}

export function getCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null
  const pair = cookieHeader
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith(`${name}=`))
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : null
}
