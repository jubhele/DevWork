import Link from 'next/link'
import { getCurrentUser, can } from '@/lib/server-auth'
import { redirect } from 'next/navigation'
import type { SafetyFile } from '@blackfire/types'
import { getSafetyFiles } from '@/lib/data/safety'

function StatusBadge({ value }: { value: string }) {
  const tone =
    value === 'Approved' || value === 'Compliant' ? 'bg-success/10 text-success' :
    value === 'Expired' ? 'bg-danger/10 text-danger' :
    value === 'Expiring Soon' ? 'bg-warning/10 text-warning' :
    'bg-info/10 text-info'
  return <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${tone}`}>{value}</span>
}

const FILTERS = [
  { value: 'all', label: 'All Files' },
  { value: 'compliant', label: 'Compliant' },
  { value: 'expiring', label: 'Expiring Soon' },
  { value: 'expired', label: 'Expired' },
]

export default async function SafetyPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const filter = (await searchParams).filter ?? 'all'
  const files = await getSafetyFiles({ filter })

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl tracking-tight text-ink-text">Safety Files</h1>
          <p className="mt-2 text-sm uppercase tracking-[0.28em] text-ash">Compliance and safety document management</p>
        </div>
        {user != null && can(user, 'safety.create') && (
          <Link href="/safety/new" className="rounded border border-fire-orange bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
            + New Audit
          </Link>
        )}
      </div>

      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-steel-dark">
        {FILTERS.map(f => (
          <Link
            key={f.value}
            href={`/safety?filter=${f.value}`}
            className={`-mb-px whitespace-nowrap border-b-2 px-5 py-3 text-xs uppercase tracking-[0.2em] ${filter === f.value ? 'border-fire-orange text-fire-orange' : 'border-transparent text-ash hover:text-ink-text'}`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      <div className="overflow-hidden rounded border border-steel-dark bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-steel-dark bg-charcoal text-[11px] uppercase tracking-[0.18em] text-ash">
              <tr>
                <th className="px-4 py-3 text-left">Ref</th>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Site</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Approved</th>
                <th className="px-4 py-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {files.length ? files.map(f => (
                <tr key={f.id} className="border-b border-steel-dark/60 last:border-0 hover:bg-charcoal/60">
                  <td className="px-4 py-3 font-mono text-xs text-fire-orange">{f.ref_id}</td>
                  <td className="px-4 py-3 font-medium text-ink-text">{f.client_name}</td>
                  <td className="px-4 py-3 text-ash">{f.site}</td>
                  <td className="px-4 py-3"><StatusBadge value={f.status} /></td>
                  <td className="px-4 py-3 text-ash">{f.approved_at ? new Date(f.approved_at).toLocaleDateString('en-ZA') : '—'}</td>
                  <td className="px-4 py-3 text-ash">{new Date(f.created_at).toLocaleDateString('en-ZA')}</td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-4 py-14 text-center text-ash">No safety files found for this filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
