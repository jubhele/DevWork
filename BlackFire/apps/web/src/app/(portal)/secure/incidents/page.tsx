import Link from 'next/link'
import { getCurrentUser } from '@/lib/server-auth'
import { redirect } from 'next/navigation'
import type { Callout } from '@blackfire/types'
import { getCallouts } from '@/lib/data/callouts'

const PRIORITY_STYLE: Record<string, string> = {
  Emergency: 'bg-danger/10 text-danger',
  Urgent:    'bg-warning/10 text-warning',
  Normal:    'bg-ash/10 text-ash',
}

export default async function IncidentsPage() {
  const user = await getCurrentUser()
  if (!user || !['sysadmin', 'admin', 'manager'].includes(user.role)) redirect('/dashboard')

  const { data: incidents } = await getCallouts({ priorities: ['Urgent', 'Emergency'], limit: 200 })
  const open = incidents.filter(c => c.status === 'Open' || c.status === 'In Progress')
  const closed = incidents.filter(c => c.status !== 'Open' && c.status !== 'In Progress')

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl tracking-tight text-ink-text">Secure Command</h1>
          <p className="mt-2 text-sm uppercase tracking-[0.28em] text-ash">Priority incident feed — Urgent & Emergency only</p>
        </div>
        <Link href="/tracker/call-log/new" className="rounded border border-fire-orange bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
          + Log Incident
        </Link>
      </div>

      {open.length > 0 && (
        <div className="mb-6">
          <h2 className="font-display text-lg uppercase tracking-widest text-danger mb-3">Active — {open.length}</h2>
          <div className="space-y-3">
            {open.map(c => (
              <Link key={c.id} href={`/tracker/call-log/${c.id}`} className="block rounded border border-danger/30 bg-white p-4 hover:bg-bone-paper">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] text-fire-orange">{c.ref_id}</span>
                      <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-medium uppercase ${PRIORITY_STYLE[c.priority] ?? ''}`}>{c.priority}</span>
                    </div>
                    <p className="font-medium text-ink-text">{c.client_name}</p>
                    <p className="text-sm text-ash">{c.service} — {c.location}</p>
                  </div>
                  <div className="text-right text-xs text-ash flex-shrink-0">
                    <p>{new Date(c.callout_date).toLocaleDateString('en-ZA')}</p>
                    <p className="mt-1 font-medium text-warning">{c.status}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-display text-lg uppercase tracking-widest text-ash mb-3">Resolved — {closed.length}</h2>
        <div className="overflow-hidden rounded border border-steel-dark bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-steel-dark bg-charcoal text-[11px] uppercase tracking-[0.18em] text-ash">
              <tr>
                <th className="px-4 py-3 text-left">Ref</th>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Priority</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {closed.length ? closed.map(c => (
                <tr key={c.id} className="border-b border-steel-dark/60 last:border-0 hover:bg-bone-paper">
                  <td className="px-4 py-3 font-mono text-xs text-fire-orange">{c.ref_id}</td>
                  <td className="px-4 py-3 text-ink-text">{c.client_name}</td>
                  <td className="px-4 py-3"><span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-medium uppercase ${PRIORITY_STYLE[c.priority] ?? ''}`}>{c.priority}</span></td>
                  <td className="px-4 py-3 text-ash">{c.status}</td>
                  <td className="px-4 py-3 text-ash">{new Date(c.callout_date).toLocaleDateString('en-ZA')}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-ash">No resolved priority incidents.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
