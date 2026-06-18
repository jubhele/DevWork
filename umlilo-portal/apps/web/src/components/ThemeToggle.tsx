'use client'

import { useEffect, useState } from 'react'

type ThemeMode = 'light' | 'dark'

function preferredTheme(): ThemeMode {
  const saved = window.localStorage.getItem('bf-theme')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<ThemeMode>('light')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = preferredTheme()
      document.documentElement.dataset.theme = next
      setTheme(next)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    window.localStorage.setItem('bf-theme', next)
    setTheme(next)
  }

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <span className="theme-toggle__mark" aria-hidden="true" />
      <span className="theme-toggle__label">{theme === 'dark' ? 'DARK' : 'LIGHT'}</span>
    </button>
  )
}
