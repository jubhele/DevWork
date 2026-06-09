'use client'

import { createContext, useContext } from 'react'
import type { User } from '@blackfire/types'

const UserContext = createContext<User | null>(null)

export function UserProvider({ user, children }: { user: User; children: React.ReactNode }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>
}

export function useUser(): User {
  const user = useContext(UserContext)
  if (!user) throw new Error('useUser must be used inside UserProvider')
  return user
}

export function useCan(permission: string): boolean {
  const user = useUser()
  if (user.role === 'sysadmin') return true
  return user.permissions.includes(permission)
}
