import { cookies } from 'next/headers'
import { getApiAuthHeaders } from '@/lib/auth'
import type { AuditEvent, ApiResponse } from '@blackfire/types'

type AuditRow = Partial<AuditEvent> & {
  created_at?: string
  username?: string
  action?: string
  entity?: string
  detail?: string | null
}

async function getAuditEvents(headers: Record<string, string> | null): Promise<AuditRow[] | null> {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE
    ?? `http://localhost:${process.env.PORT ?? '3000'}/api`
  if (!headers) return null
  try {
    const res = await fetch(`${API_BASE}/audit.php`, {
      headers,
      cache: 'no-store',
    })
    if (!res.ok) return null
    const body = await res.json() as ApiResponse<AuditRow[]>
    return Array.isArray(body.data) ? body.data : []
  } catch {
    return null
  }
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? '-' : date.toLocaleString('en-ZA')
}

export default async function AuditPage() {
  const cookieStore = await cookies()
  const events = await getAuditEvents(getApiAuthHeaders(cookieStore.get('bf_portal')?.value))

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl tracking-wider text-bone-paper uppercase">Audit Log</h1>
      </div>

      {events == null ? (
        <p className="text-ash text-sm">Could not load audit events.</p>
      ) : events.length === 0 ? (
        <p className="text-ash text-sm">No audit events recorded yet.</p>
      ) : (
        <div className="bg-navy border border-steel-dark rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-steel-dark text-xs text-ash uppercase tracking-wider">
                <th className="text-left px-4 py-3">Time</th>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Action</th>
                <th className="text-left px-4 py-3">Entity</th>
                <th className="text-left px-4 py-3">Detail</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, index) => (
                <tr
                  key={`${event.created_at ?? 'event'}-${index}`}
                  className={`border-b border-steel-dark/50 hover:bg-charcoal transition-colors ${index % 2 === 0 ? '' : 'bg-charcoal/30'}`}
                >
                  <td className="px-4 py-3 text-ash text-xs whitespace-nowrap">{formatDate(event.created_at)}</td>
                  <td className="px-4 py-3 text-bone-paper">{event.username ?? '-'}</td>
                  <td className="px-4 py-3 text-flame-gold font-mono text-xs">{event.action ?? '-'}</td>
                  <td className="px-4 py-3 text-ash">{event.entity ?? '-'}</td>
                  <td className="px-4 py-3 text-ash">{event.detail ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
