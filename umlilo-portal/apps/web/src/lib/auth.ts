import { createHmac } from 'crypto'
import type { User } from '@blackfire/types'

export interface CookiePayload {
  user: User
  token: string
  phpSessionId?: string
}

const SECRET = process.env.COOKIE_SECRET

function sign(data: string): string {
  return createHmac('sha256', SECRET!).update(data).digest('hex')
}

// Cookie format: base64(JSON.stringify({user, token})).<hmac_hex>
export function encodeCookie(payload: CookiePayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return SECRET ? `${data}.${sign(data)}` : data
}

export function decodeCookie(cookieValue: string | undefined): CookiePayload | null {
  if (!cookieValue) return null
  try {
    const dotIdx = cookieValue.lastIndexOf('.')
    if (SECRET && dotIdx !== -1) {
      const data = cookieValue.slice(0, dotIdx)
      const sig  = cookieValue.slice(dotIdx + 1)
      if (sign(data) !== sig) return null   // tampered — reject
      const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8')) as CookiePayload
      return payload?.user?.id ? payload : null
    }
    // Unsigned fallback for cookies set before Phase 2 migration
    const decoded = Buffer.from(cookieValue, 'base64').toString('utf-8')
    const parsed = JSON.parse(decoded)
    if (parsed?.user?.id) return parsed as CookiePayload
    if (parsed?.id) return { user: parsed as User, token: '' }
    return null
  } catch {
    return null
  }
}

export function getUserFromPortalCookie(cookieValue: string | undefined): User | null {
  return decodeCookie(cookieValue)?.user ?? null
}

export function getTokenFromPortalCookie(cookieValue: string | undefined): string {
  return decodeCookie(cookieValue)?.token ?? ''
}

export function getApiAuthHeaders(cookieValue: string | undefined): Record<string, string> | null {
  const payload = decodeCookie(cookieValue)
  if (!payload) return null

  if (payload.token) {
    return {
      Authorization: `Bearer ${payload.token}`,
      'X-Requested-With': 'XMLHttpRequest',
    }
  }

  if (payload.phpSessionId) {
    return {
      Cookie: `bf_portal=${payload.phpSessionId}`,
      'X-Requested-With': 'XMLHttpRequest',
    }
  }

  return null
}

export function can(user: User, permission: string): boolean {
  if (user.role === 'sysadmin' || user.role === 'admin') return true
  return (user.permissions ?? []).includes(permission)
}

export function hasRole(user: User, ...roles: User['role'][]): boolean {
  return roles.includes(user.role)
}
