import { cookies } from 'next/headers'
import { can, getServerUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAuditLog, type AuditEntry } from '@/lib/data/audit'

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const cookieHeader = (await cookies()).toString()
  const user = await getServerUser(cookieHeader)
  const roles = user ? [user.role, ...(user.roles ?? [])].map((r) => String(r).toLowerCase()) : []

  if (!user || (!roles.includes('sysadmin') && !roles.includes('admin') && !can(user, 'security.audit'))) redirect('/forbidden')

  const page = Math.max(1, parseInt((await searchParams).page ?? '1'))
  const { data: entries, total } = await getAuditLog(page)
  const totalPages = Math.ceil(total / 100)

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-5xl tracking-tight text-ink-text">Audit Log</h1>
        <p className="mt-2 text-sm uppercase tracking-[0.28em] text-ash">All recorded portal actions — {total.toLocaleString()} total entries</p>
      </div>

      <div className="overflow-hidden rounded border border-steel-dark bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="border-b border-steel-dark bg-charcoal text-[11px] uppercase tracking-[0.18em] text-ash">
              <tr>
                <th className="px-4 py-3 text-left">When</th>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Record</th>
                <th className="px-4 py-3 text-left">Detail</th>
              </tr>
            </thead>
            <tbody>
              {entries.length ? entries.map(e => (
                <tr key={e.id} className="border-b border-steel-dark/60 last:border-0 hover:bg-charcoal/60">
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-ash">{new Date(e.created_at).toLocaleString('en-ZA', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td className="px-4 py-3 font-mono text-xs text-fire-orange">{e.username}</td>
                  <td className="px-4 py-3 text-ink-text">{e.action}</td>
                  <td className="px-4 py-3 text-xs text-ash">{[e.entity_type, e.entity_ref].filter(Boolean).join(' / ') || '—'}</td>
                  <td className="px-4 py-3 text-xs text-ash max-w-[300px] truncate" title={e.detail ?? ''}>{e.detail ?? '—'}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-4 py-14 text-center text-ash">No audit entries found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex gap-2 items-center justify-end">
          {page > 1 && (
            <a href={`/admin/audit?page=${page - 1}`} className="rounded border border-steel-dark bg-white px-4 py-2 text-xs uppercase tracking-[0.16em] text-ash hover:text-ink-text">← Previous</a>
          )}
          <span className="text-xs text-ash">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <a href={`/admin/audit?page=${page + 1}`} className="rounded border border-steel-dark bg-white px-4 py-2 text-xs uppercase tracking-[0.16em] text-ash hover:text-ink-text">Next →</a>
          )}
        </div>
      )}
    </div>
  )
}
