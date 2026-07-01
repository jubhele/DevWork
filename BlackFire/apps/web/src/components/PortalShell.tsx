'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useUser } from '@/context/UserContext'

const PRIMARY = [
  { href: '/dashboard', label: 'Dashboard', group: 'dashboard', matches: ['/dashboard'] },
  { href: '/tracker', label: 'Operations', group: 'operations', matches: ['/tracker', '/callouts', '/quotes', '/clients'] },
  { href: '/finance', label: 'Finance', group: 'finance', matches: ['/finance', '/invoices'] },
  { href: '/secure', label: 'Secure', group: 'secure', matches: ['/secure'], roles: ['sysadmin', 'admin', 'manager'] },
  { href: '/ops', label: 'Ops', group: 'ops', matches: ['/ops'], roles: ['sysadmin', 'admin', 'manager'] },
  { href: '/support', label: 'Support', group: 'support', matches: ['/support', '/safety', '/admin'] },
]

const SECONDARY: Record<string, Array<{ href: string; label: string; permission?: string; roles?: string[] }>> = {
  dashboard: [
    { href: '/dashboard', label: 'Overview' },
    { href: '/admin/users', label: 'Users & Roles', roles: ['sysadmin', 'admin'] },
    { href: '/safety', label: 'Safety Files', permission: 'safety.view' },
    { href: '/admin/audit', label: 'Audit Log', roles: ['sysadmin', 'admin'] },
  ],
  operations: [
    { href: '/tracker', label: 'Tracker', permission: 'task.view' },
    { href: '/quotes', label: 'Quotes', permission: 'quote.view' },
    { href: '/clients', label: 'Clients', permission: 'callout.view' },
  ],
  finance: [
    { href: '/invoices', label: 'Invoices', permission: 'invoice.view' },
    { href: '/finance', label: 'Finance Overview', permission: 'finance.income' },
  ],
  secure: [
    { href: '/secure/incidents', label: 'Incidents', roles: ['sysadmin', 'admin', 'manager'] },
    { href: '/secure/vault', label: 'Vault', roles: ['sysadmin', 'admin'] },
  ],
  ops: [
    { href: '/ops/schedule', label: 'Schedule', roles: ['sysadmin', 'admin', 'manager'] },
    { href: '/ops/tasks', label: 'Task Planning', roles: ['sysadmin', 'admin', 'manager'] },
  ],
  hub: [
    { href: '/hub', label: 'All Portals' },
  ],
  support: [
    { href: '/support', label: 'Overview' },
    { href: '/safety', label: 'Safety Files', permission: 'safety.view' },
    { href: '/admin/users', label: 'Users & Roles', roles: ['sysadmin', 'admin'] },
    { href: '/admin/audit', label: 'Audit Log', roles: ['sysadmin', 'admin'] },
  ],
}

function isVisible(userRole: string, permissions: string[], item: { permission?: string; roles?: string[] }) {
  if (item.roles) return item.roles.includes(userRole)
  if (item.permission) {
    if (userRole === 'sysadmin') return true
    return (permissions ?? []).includes(item.permission)
  }
  return true
}

export default function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const user = useUser()
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    return (localStorage.getItem('bf-theme') as 'light' | 'dark') ?? 'light'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('bf-theme', theme)
  }, [theme])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
  }

  const visiblePrimary = PRIMARY.filter(item => isVisible(user.role, user.permissions, item))
  const primary = visiblePrimary.find(item => item.matches.some(prefix => pathname.startsWith(prefix))) ?? visiblePrimary[0]
  const secondary = (SECONDARY[primary.group] || []).filter(item => isVisible(user.role, user.permissions, item))

  async function signOut() {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    }).catch(() => null)
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-bone-paper text-ink-text">
      <header className="sticky top-0 z-50 border-b border-steel-dark/80 bg-bone-paper/95 backdrop-blur">
        <div className="h-20 px-6 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Image src="/blackfire_logo_transparent.png" alt="BlackFire Solutions" width={150} height={50} priority className="h-12 w-auto" />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:block text-sm text-ink-text/80 truncate max-w-[200px]">{user.name}</span>
            <button onClick={toggleTheme} className="grid h-12 w-12 place-items-center rounded border border-steel-dark bg-charcoal text-ink-text hover:bg-charcoal/80 transition-colors" aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>{theme === 'dark' ? '☀' : '☾'}</button>
            <button onClick={() => router.refresh()} className="h-12 w-12 rounded border border-steel-dark bg-charcoal text-ash hover:text-ink-text transition-colors" aria-label="Refresh page">↻</button>
            <Link href="/help" className="grid h-12 w-12 place-items-center rounded border border-steel-dark bg-charcoal text-ash hover:text-ink-text transition-colors" aria-label="Help and guide">?</Link>
            <button onClick={signOut} className="h-12 rounded border border-steel-dark bg-charcoal px-4 text-[11px] uppercase tracking-[0.22em] text-ash hover:text-ink-text transition-colors">Sign Out</button>
          </div>
        </div>
        <nav className="border-t border-steel-dark/60 bg-charcoal">
          <div className="px-6 sm:px-8 flex items-center gap-6 justify-center overflow-x-auto">
            {visiblePrimary.map(item => {
              const active = item.matches.some(prefix => pathname.startsWith(prefix))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative py-5 text-[12px] uppercase tracking-[0.25em] transition-colors ${
                    active ? 'text-fire-orange' : 'text-ash hover:text-ink-text'
                  }`}
                >
                  {item.label}
                  {active && <span className="absolute inset-x-0 bottom-0 h-[2px] bg-fire-orange" />}
                </Link>
              )
            })}
          </div>
        </nav>
        <div className="border-t border-steel-dark/60 bg-coal">
          <div className="px-6 sm:px-8 flex items-center gap-6 justify-center overflow-x-auto">
            {secondary.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative py-4 text-[11px] uppercase tracking-[0.24em] transition-colors ${
                    active ? 'text-fire-orange' : 'text-ash hover:text-ink-text'
                  }`}
                >
                  {item.label}
                  {active && <span className="absolute inset-x-0 bottom-0 h-[2px] bg-fire-orange" />}
                </Link>
              )
            })}
          </div>
        </div>
      </header>

      <main className="px-6 sm:px-10 py-8 sm:py-10">
        {children}
      </main>
    </div>
  )
}
