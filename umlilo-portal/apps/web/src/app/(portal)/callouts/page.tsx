import { cookies } from 'next/headers'
import Link from 'next/link'
import { getApiAuthHeaders } from '@/lib/auth'
import type { Callout, PaginatedResponse } from '@blackfire/types'

const PRIORITY_COLOUR: Record<string, string> = {
  Normal:    'text-ash',
  Urgent:    'text-ember-amber',
  Emergency: 'text-ember-red',
}

const STATUS_COLOUR: Record<string, string> = {
  Open:          'bg-ember-amber/10 text-ember-amber',
  'In Progress': 'bg-info/10 text-info',
  Completed:     'bg-success/10 text-success',
  Invoiced:      'bg-ash/10 text-ash',
  Cancelled:     'bg-danger/10 text-danger',
}

async function getCallouts(headers: Record<string, string> | null): Promise<PaginatedResponse<Callout> | null> {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE
    ?? `http://localhost:${process.env.PORT ?? '3000'}/api`
  if (!headers) return null
  try {
    const res = await fetch(`${API_BASE}/callouts.php`, {
      headers,
      cache: 'no-store',
    })
    return res.ok ? res.json() : null
  } catch {
    return null
  }
}

export default async function CalloutsPage() {
  const cookieStore = await cookies()
  const result = await getCallouts(getApiAuthHeaders(cookieStore.get('bf_portal')?.value))
  const callouts = result?.data ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl tracking-wider text-bone-paper uppercase">Callouts</h1>
      </div>

      {callouts.length === 0 ? (
        <p className="text-ash text-sm">No callouts found.</p>
      ) : (
        <div className="bg-navy border border-steel-dark rounded-lg overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-steel-dark text-xs text-ash uppercase tracking-wider">
                <th className="text-left px-4 py-3">Ref</th>
                <th className="text-left px-4 py-3">Client</th>
                <th className="text-left px-4 py-3">Service</th>
                <th className="text-left px-4 py-3">Priority</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {callouts.map((c, i) => (
                <tr
                  key={c.id}
                  className={`border-b border-steel-dark/50 hover:bg-charcoal transition-colors ${i % 2 === 0 ? '' : 'bg-charcoal/30'}`}
                >
                  <td className="px-4 py-3">
                    <Link href={`/callouts/${c.id}`} className="text-flame-gold hover:text-fire-orange font-mono text-xs">
                      {c.ref_id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-bone-paper">{c.client_name}</td>
                  <td className="px-4 py-3 text-ash">{c.service}</td>
                  <td className={`px-4 py-3 font-medium ${PRIORITY_COLOUR[c.priority] ?? 'text-ash'}`}>
                    {c.priority}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOUR[c.status] ?? 'text-ash'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ash text-xs">
                    {new Date(c.callout_date).toLocaleDateString('en-ZA')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
