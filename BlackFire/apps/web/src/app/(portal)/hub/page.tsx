import { cookies } from 'next/headers'
import Link from 'next/link'
import { getServerUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

const PORTALS = [
  {
    title: 'Umlilo Portal',
    subtitle: 'Core operations',
    description: 'Tracker, callouts, quotes, invoices, safety files, and client management.',
    href: '/dashboard',
    accent: 'border-fire-orange',
    badge: 'Live',
    badgeStyle: 'bg-success/10 text-success',
  },
  {
    title: 'Reporting Workspace',
    subtitle: 'Power BI embedded views',
    description: 'Open the live executive dashboard and finance reporting surfaces.',
    href: '/dashboard',
    accent: 'border-flame-gold',
    badge: 'Live',
    badgeStyle: 'bg-success/10 text-success',
  },
  {
    title: 'Secure Command',
    subtitle: 'Priority incident feed',
    description: 'Urgent and emergency callout monitoring with live status tracking.',
    href: '/secure/incidents',
    accent: 'border-danger',
    badge: 'Live',
    badgeStyle: 'bg-success/10 text-success',
  },
  {
    title: 'Ops Hub',
    subtitle: 'UMLILO Mission Control',
    description: 'Daily task schedule, open work board, and team roster visibility.',
    href: '/ops/schedule',
    accent: 'border-info',
    badge: 'Live',
    badgeStyle: 'bg-success/10 text-success',
  },
  {
    title: 'Secure Vault',
    subtitle: 'Controlled documents',
    description: 'Encrypted storage for SLAs, risk assessments, and vetting records.',
    href: '/secure/vault',
    accent: 'border-flame-gold',
    badge: 'Phase 2',
    badgeStyle: 'bg-warning/10 text-warning',
  },
  {
    title: 'Client Portal',
    subtitle: 'External client view',
    description: 'Read-only portal for AECI and other clients to view callouts and invoices.',
    href: '#',
    accent: 'border-ash',
    badge: 'Planned',
    badgeStyle: 'bg-ash/10 text-ash',
  },
]

export default async function HubPage() {
  const cookieHeader = (await cookies()).toString()
  const user = await getServerUser(cookieHeader)
  if (!user) redirect('/login')

  return (
    <div>
      <h1 className="font-display text-5xl tracking-tight text-ink-text mb-2">Portal Hub</h1>
      <p className="mb-8 text-sm uppercase tracking-[0.28em] text-ash">BlackFire Solutions - all portals in one place</p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PORTALS.map(portal => (
          <Link
            key={portal.title}
            href={portal.href}
            className={`block rounded border-l-4 border border-steel-dark bg-white p-6 shadow-sm hover:shadow-md transition-shadow ${portal.accent}`}
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <h2 className="font-display text-xl text-ink-text">{portal.title}</h2>
                <p className="text-xs uppercase tracking-[0.18em] text-ash mt-0.5">{portal.subtitle}</p>
              </div>
              <span className={`flex-shrink-0 rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] ${portal.badgeStyle}`}>{portal.badge}</span>
            </div>
            <p className="text-sm text-ash leading-relaxed">{portal.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
