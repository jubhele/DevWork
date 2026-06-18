import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Appearance } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { themes } from '@blackfire/ui-tokens'
import type { ThemeMode, ThemePalette } from '@blackfire/ui-tokens'

interface ThemeContextValue {
  mode: ThemeMode
  palette: ThemePalette
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemMode: ThemeMode = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
  const [mode, setMode] = useState<ThemeMode>(systemMode)

  useEffect(() => {
    SecureStore.getItemAsync('bf-theme').then(saved => {
      if (saved === 'light' || saved === 'dark') setMode(saved)
    }).catch(() => {})
  }, [])

  function toggleTheme() {
    setMode(current => {
      const next = current === 'dark' ? 'light' : 'dark'
      SecureStore.setItemAsync('bf-theme', next).catch(() => {})
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ mode, palette: themes[mode], toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme must be used inside ThemeProvider')
  return value
}
