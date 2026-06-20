'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useUser } from '@/context/UserContext'

const PRIMARY = [
  { href: '/dashboard', label: 'Dashboard', group: 'dashboard', matches: ['/dashboard'] },
  { href: '/tracker', label: 'Operations', group: 'operations', matches: ['/tracker', '/callouts', '/quotes', '/clients'] },
  { href: '/finance', label: 'Finance', group: 'finance', matches: ['/finance', '/invoices'] },
  { href: '/safety', label: 'Support', group: 'support', matches: ['/safety', '/admin'] },
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
    { href: '/clients', label: 'Clients', permission: 'client.view' },
  ],
  finance: [
    { href: '/invoices', label: 'Invoices', permission: 'invoice.view' },
    { href: '/finance', label: 'Finance Overview', permission: 'finance.view' },
  ],
  support: [
    { href: '/safety', label: 'Overview', permission: 'safety.view' },
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

  const primary = PRIMARY.find(item => item.matches.some(prefix => pathname.startsWith(prefix))) ?? PRIMARY[0]
  const secondary = (SECONDARY[primary.group] || []).filter(item => isVisible(user.role, user.permissions, item))

  async function signOut() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? 'https://blackfiresolutions.co.za/api'
    await fetch(`${apiBase}/auth.php?action=logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    }).catch(() => null)
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-bone-paper text-ink-text">
      <header className="sticky top-0 z-50 border-b border-steel-dark/80 bg-white/95 backdrop-blur">
        <div className="h-20 px-6 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Image src="/blackfire_logo_transparent.png" alt="BlackFire Solutions" width={150} height={50} priority className="h-12 w-auto" />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:block text-sm text-ink-text/80 truncate max-w-[200px]">{user.name}</span>
            <span className="grid h-12 w-12 place-items-center rounded border border-steel-dark bg-bone-paper text-ink-text" aria-label="Light theme">☾</span>
            <button onClick={() => router.refresh()} className="h-12 w-12 rounded border border-steel-dark bg-[#eee] text-ash" aria-label="Refresh page">↻</button>
            <Link href="/help" className="grid h-12 w-12 place-items-center rounded border border-steel-dark bg-[#eee] text-ash" aria-label="Help and guide">?</Link>
            <button onClick={signOut} className="h-12 rounded border border-steel-dark bg-white px-4 text-[11px] uppercase tracking-[0.22em] text-ash">Sign Out</button>
          </div>
        </div>
        <nav className="border-t border-steel-dark/60 bg-white">
          <div className="px-6 sm:px-8 flex items-center gap-6 justify-center overflow-x-auto">
            {PRIMARY.map(item => {
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
        <div className="border-t border-steel-dark/60 bg-[#efefef]">
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
