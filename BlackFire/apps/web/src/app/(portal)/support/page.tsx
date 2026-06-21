import { cookies } from 'next/headers'
import Link from 'next/link'
import { getServerUser } from '@/lib/auth'

const ROLE_LABELS: Record<string, string> = {
  sysadmin: 'System Administrator',
  admin: 'Administrator',
  manager: 'Manager',
  admin_clerk: 'Admin Clerk',
  call_logger: 'Call Logger',
  senior_tech: 'Senior Technician',
  junior_tech: 'Junior Technician',
  client_support: 'Client Support',
  safety_officer: 'Safety Officer',
  viewer: 'Viewer',
}

const CONTACTS = [
  {
    label: 'Emergency Line',
    value: '+27 68 912 6581',
    note: 'Active security incidents, immediate dispatch, on-site emergencies. Do not use the portal for emergencies.',
    urgent: true,
  },
  {
    label: 'Operations Email',
    value: 'ops@blackfiresolutions.co.za',
    note: 'Operational queries, scheduling, technician dispatch coordination.',
    urgent: false,
  },
  {
    label: 'Finance Email',
    value: 'finance@blackfiresolutions.co.za',
    note: 'Invoice queries, payment allocations, statements.',
    urgent: false,
  },
]

const QUICK_LINKS = [
  { href: '/safety', label: 'Safety Files', desc: 'View and upload compliance documents' },
  { href: '/admin/users', label: 'Users & Roles', desc: 'Manage portal access — Admins only', adminOnly: true },
  { href: '/admin/audit', label: 'Audit Log', desc: 'Full portal action history — Admins only', adminOnly: true },
  { href: '/help', label: 'Help & Guide', desc: 'Step-by-step guides for every portal section' },
]

export default async function SupportPage() {
  const cookieHeader = (await cookies()).toString()
  const user = await getServerUser(cookieHeader)
  const isAdmin = user?.role === 'sysadmin' || user?.role === 'admin'

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-5xl text-ink-text">Support</h1>
      <p className="mb-8 mt-2 text-sm uppercase tracking-[0.28em] text-ash">Platform overview and support resources</p>

      {/* Current session info */}
      <section className="mb-8 rounded border border-steel-dark bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-ink-text mb-4">Your Account</h2>
        <dl className="grid gap-4 md:grid-cols-2">
          <div>
            <dt className="text-[11px] uppercase tracking-[0.2em] text-ash">Name</dt>
            <dd className="mt-1 font-medium text-ink-text">{user?.name ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.2em] text-ash">Username</dt>
            <dd className="mt-1 font-mono text-sm text-fire-orange">{user?.username ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.2em] text-ash">Role</dt>
            <dd className="mt-1 text-ink-text">{user?.role ? (ROLE_LABELS[user.role] ?? user.role) : '—'}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.2em] text-ash">Permissions</dt>
            <dd className="mt-1 text-sm text-ash">{user?.permissions?.length ? `${user.permissions.length} granted` : 'Role-default access'}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-ash">To change your role or reset your password, contact your portal Admin.</p>
      </section>

      {/* Quick links */}
      <section className="mb-8">
        <h2 className="font-display text-2xl text-ink-text mb-4">Quick Access</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {QUICK_LINKS.filter(l => !l.adminOnly || isAdmin).map(link => (
            <Link key={link.href} href={link.href} className="block rounded border border-steel-dark bg-white p-5 shadow-sm hover:border-fire-orange transition-colors group">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-ink-text group-hover:text-fire-orange transition-colors">{link.label}</h3>
                <span className="text-ash group-hover:text-fire-orange transition-colors">→</span>
              </div>
              <p className="mt-1 text-sm text-ash">{link.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Contact details */}
      <section className="mb-8">
        <h2 className="font-display text-2xl text-ink-text mb-4">Contact</h2>
        <div className="space-y-4">
          {CONTACTS.map(c => (
            <div key={c.label} className={`rounded border p-5 ${c.urgent ? 'border-fire-orange bg-[#fff3e8]' : 'border-steel-dark bg-white'} shadow-sm`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className={`font-semibold ${c.urgent ? 'text-fire-orange' : 'text-ink-text'}`}>{c.label}</h3>
                  <p className={`mt-1 text-lg font-mono ${c.urgent ? 'text-fire-orange' : 'text-ink-text'}`}>{c.value}</p>
                  <p className="mt-2 text-sm text-ash">{c.note}</p>
                </div>
                {c.urgent && (
                  <span className="flex-shrink-0 rounded bg-fire-orange px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-coal">
                    Emergency
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Platform info */}
      <section className="rounded border border-steel-dark bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-ink-text mb-4">Platform Information</h2>
        <dl className="grid gap-4 md:grid-cols-2 text-sm">
          <div>
            <dt className="text-[11px] uppercase tracking-[0.2em] text-ash">Portal</dt>
            <dd className="mt-1 text-ink-text">Umlilo Portal — BlackFire Solutions</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.2em] text-ash">Client</dt>
            <dd className="mt-1 text-ink-text">AECI Chempark</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.2em] text-ash">App availability</dt>
            <dd className="mt-1 text-ink-text">Web (this portal) · Android app · iOS app</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.2em] text-ash">Data</dt>
            <dd className="mt-1 text-ink-text">All data is live. No offline or staging mode.</dd>
          </div>
        </dl>
        <div className="mt-5 border-t border-steel-dark pt-4">
          <p className="text-xs text-ash">Work started in the portal can be continued in the mobile app, and vice versa — all devices share the same live database. For step-by-step guidance on any section, see the <Link href="/help" className="text-fire-orange underline">Help &amp; Guide</Link>.</p>
        </div>
      </section>
    </div>
  )
}
