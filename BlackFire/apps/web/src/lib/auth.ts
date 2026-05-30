import type { User } from '@blackfire/types'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'https://blackfiresolutions.co.za/api'

// Server-side: validate the bf_portal session cookie by calling the PHP auth endpoint.
// Returns the user if the session is valid, null otherwise.
export async function getServerUser(cookieHeader: string | null): Promise<User | null> {
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

export function can(user: User, permission: string): boolean {
  if (user.role === 'sysadmin') return true
  return user.permissions.includes(permission)
}

export function hasRole(user: User, ...roles: User['role'][]): boolean {
  return roles.includes(user.role)
}
