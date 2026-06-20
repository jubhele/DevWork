'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useUser } from '@/context/UserContext'

interface NavItem {
  href: string
  label: string
  permission?: string
  roles?: string[]
}

const PRIMARY = [
  { href: '/dashboard', label: 'Dashboard', group: 'dashboard', matches: ['/dashboard'] },
  { href: '/callouts', label: 'Operations', group: 'operations', matches: ['/callouts', '/tracker', '/quotes'] },
  { href: '/invoices', label: 'Finance', group: 'finance', matches: ['/invoices'] },
  { href: '/admin/audit', label: 'Support', group: 'support', matches: ['/admin'] },
]

const SECONDARY: Record<string, NavItem[]> = {
  dashboard: [{ href: '/dashboard', label: 'Overview' }],
  operations: [
    { href: '/callouts', label: 'Callouts', permission: 'callout.view' },
    { href: '/tracker', label: 'Work Tracker', permission: 'task.view' },
    { href: '/quotes', label: 'Quotes', permission: 'quote.view' },
  ],
  finance: [{ href: '/invoices', label: 'Invoices', permission: 'invoice.view' }],
  support: [{ href: '/admin/audit', label: 'Audit Log', roles: ['sysadmin', 'admin'] }],
}

function canSee(role: string, permissions: string[], item: NavItem) {
  if (item.roles) return item.roles.includes(role)
  if (!item.permission || role === 'sysadmin' || role === 'admin') return true
  return permissions.includes(item.permission)
}

export default function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const user = useUser()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  const currentPrimary = PRIMARY.find(item => item.matches.some(prefix => pathname.startsWith(prefix))) ?? PRIMARY[0]
  const secondary = SECONDARY[currentPrimary.group].filter(item => canSee(user.role, user.permissions ?? [], item))

  useEffect(() => {
    const nextTheme = window.localStorage.getItem('bf-portal-theme') === 'dark' ? 'dark' : 'light'
    document.documentElement.dataset.theme = nextTheme
    setTheme(nextTheme)
  }, [])

  function toggleTheme() {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    document.documentElement.dataset.theme = nextTheme
    window.localStorage.setItem('bf-portal-theme', nextTheme)
    setTheme(nextTheme)
  }

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-coal text-bone-paper">
      <header className="sticky top-0 z-50 border-b border-steel-dark bg-navy shadow-[0_3px_16px_rgba(10,14,25,0.08)]">
        <div className="grid min-h-20 grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-7 max-sm:grid-cols-[auto_1fr]">
          <div className="max-sm:hidden" aria-hidden="true" />
          <Link href="/dashboard" className="flex items-center justify-center max-sm:justify-start" aria-label="BlackFire dashboard">
            <Image src="/blackfire_logo_transparent.png" alt="BlackFire Solutions" width={176} height={58} priority className="h-12 w-auto max-sm:h-10" />
          </Link>
          <div className="flex min-w-0 items-center justify-end gap-2.5">
            <span className="max-w-52 truncate text-sm text-steel max-sm:hidden">{user.name}</span>
            <button type="button" onClick={toggleTheme} className="grid h-11 w-11 place-items-center rounded-[3px] border border-steel-dark bg-navy font-mono text-xs font-semibold text-steel hover:border-fire-orange hover:text-fire-orange" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}>
              {theme === 'light' ? 'D' : 'L'}
            </button>
            <button type="button" onClick={() => router.refresh()} className="grid h-11 w-11 place-items-center rounded-[3px] border border-steel-dark bg-charcoal font-mono text-xs font-semibold text-steel hover:border-fire-orange hover:text-fire-orange max-sm:hidden" aria-label="Refresh page">R</button>
            <Link href="/privacy" className="grid h-11 w-11 place-items-center rounded-[3px] border border-steel-dark bg-charcoal font-mono text-xs font-semibold text-steel hover:border-fire-orange hover:text-fire-orange max-sm:hidden" aria-label="Portal information">?</Link>
            <button type="button" onClick={signOut} className="h-11 rounded-[3px] border border-steel-dark bg-navy px-4 font-mono text-[10px] uppercase tracking-[0.16em] text-steel hover:border-fire-orange hover:text-fire-orange max-sm:hidden">Sign Out</button>
          </div>
        </div>

        <nav className="flex items-center justify-center overflow-x-auto border-t border-steel-dark bg-navy max-sm:justify-start" aria-label="Primary navigation">
          {PRIMARY.map(item => {
            const active = item.matches.some(prefix => pathname.startsWith(prefix))
            return (
              <Link key={item.href} href={item.href} className={`relative shrink-0 px-6 py-[18px] font-mono text-[11px] uppercase tracking-[0.19em] transition-colors max-sm:px-4 ${active ? 'text-fire-orange after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-fire-orange' : 'text-ash hover:text-fire-orange'}`}>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <nav className="flex min-h-11 items-center justify-center overflow-x-auto border-t border-steel-dark bg-charcoal max-sm:justify-start" aria-label={`${currentPrimary.label} navigation`}>
          {secondary.map(item => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link key={item.href} href={item.href} className={`relative shrink-0 px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors max-sm:px-4 ${active ? 'text-fire-orange after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-fire-orange' : 'text-ash hover:text-fire-orange'}`}>
                {item.label}
              </Link>
            )
          })}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1220px] px-5 py-10 sm:px-8 sm:py-16">{children}</main>
    </div>
  )
}
