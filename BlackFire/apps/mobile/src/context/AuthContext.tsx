import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@blackfire/types'
import { auth } from '@blackfire/api-client'
import { saveToken, getToken, clearToken } from '../lib/token'
import { getDeviceId, getDeviceName } from '../lib/device'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  login: (username: string, password: string) => Promise<string | null>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore session from secure storage on app start
    getToken().then(async (stored) => {
      if (stored) {
        try {
          const res = await auth.me(stored)
          if (res.success && res.data) {
            setToken(stored)
            setUser(res.data)
          } else {
            await clearToken()
          }
        } catch {
          await clearToken()
        }
      }
      setLoading(false)
    })
  }, [])

  async function login(username: string, password: string): Promise<string | null> {
    const device_id = await getDeviceId()
    const device_name = getDeviceName()
    const res = await auth.mobileLogin(username, password, device_id, device_name)
    if (res.success && res.token && res.user) {
      await saveToken(res.token)
      setToken(res.token)
      setUser(res.user)
      return null
    }
    return res.message ?? 'Login failed'
  }

  async function logout(): Promise<void> {
    if (token) await auth.logout(token).catch(() => {})
    await clearToken()
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
