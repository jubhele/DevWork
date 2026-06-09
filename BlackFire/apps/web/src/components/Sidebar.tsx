'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser, useCan } from '@/context/UserContext'

interface NavItem {
  href: string
  label: string
  permission?: string
  roles?: string[]
}

const NAV: NavItem[] = [
  { href: '/dashboard',         label: 'Dashboard' },
  { href: '/callouts',          label: 'Callouts',       permission: 'callout.view' },
  { href: '/quotes',            label: 'Quotes',         permission: 'quote.view' },
  { href: '/invoices',          label: 'Invoices',       permission: 'invoice.view' },
  { href: '/safety',            label: 'Safety Files',   permission: 'safety.view' },
  { href: '/clients',           label: 'Clients',        permission: 'client.view' },
  { href: '/finance',           label: 'Finance',        permission: 'finance.view' },
  { href: '/admin/users',       label: 'Users',          permission: 'user.view' },
  { href: '/admin/audit',       label: 'Audit Log',      roles: ['sysadmin', 'admin'] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const user = useUser()

  const visible = NAV.filter(item => {
    if (item.roles) return item.roles.includes(user.role)
    if (item.permission) {
      if (user.role === 'sysadmin') return true
      return user.permissions.includes(item.permission)
    }
    return true
  })

  return (
    <aside className="w-56 bg-navy flex flex-col border-r border-steel-dark shrink-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-steel-dark">
        <span className="font-display text-xl tracking-widest text-flame-gold uppercase">
          BlackFire
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
        {visible.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-5 py-2.5 text-sm font-body transition-colors ${
                active
                  ? 'bg-charcoal text-bone-paper border-l-2 border-fire-orange'
                  : 'text-ash hover:bg-charcoal hover:text-bone-paper'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-5 py-4 border-t border-steel-dark text-xs text-ash">
        <div className="font-medium text-bone-paper truncate">{user.name}</div>
        <div className="capitalize">{user.role.replace('_', ' ')}</div>
      </div>
    </aside>
  )
}
