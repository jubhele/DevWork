import type { User } from '@blackfire/types'
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? (process.env.NODE_ENV === 'production' ? 'https://blackfiresolutions.co.za/api' : 'http://localhost:8080/api')

// Server-side: validate the backend session cookie by calling the PHP auth endpoint.
export async function getServerUser(cookieHeader?: string | null): Promise<User | null> {
  if (!cookieHeader) return null
  try {
    const res = await fetch(`${API_BASE}/auth.php?action=me`, {
      headers: {
        Cookie: cookieHeader,
        'X-Requested-With': 'XMLHttpRequest',
      },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const body = await res.json()
    return body.success ? (body.user as User) : null
  } catch {
    return null
  }
}

export function can(user: User | null | undefined, permission: string): boolean {
  if (!user) return false
  if (user.role === 'sysadmin') return true
  return (user.permissions ?? []).includes(permission)
}

export function hasRole(user: User | null | undefined, ...roles: User['role'][]): boolean {
  if (!user) return false
  return roles.includes(user.role)
}
