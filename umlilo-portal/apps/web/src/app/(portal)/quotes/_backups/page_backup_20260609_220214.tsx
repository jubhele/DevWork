import { cookies } from 'next/headers'
import Link from 'next/link'
import { getApiAuthHeaders } from '@/lib/auth'
import type { Quote, PaginatedResponse } from '@blackfire/types'

const STATUS_COLOUR: Record<string, string> = {
  Draft:    'bg-ash/10 text-ash',
  Sent:     'bg-info/10 text-info',
  Accepted: 'bg-success/10 text-success',
  Rejected: 'bg-danger/10 text-danger',
  Expired:  'bg-ash/10 text-ash opacity-60',
}

async function getQuotes(headers: Record<string, string> | null): Promise<PaginatedResponse<Quote> | null> {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'https://blackfiresolutions.co.za/api'
  if (!headers) return null
  try {
    const res = await fetch(`${API_BASE}/quotes.php`, {
      headers,
      cache: 'no-store',
    })
    return res.ok ? res.json() : null
  } catch {
    return null
  }
}

export default async function QuotesPage() {
  const cookieStore = await cookies()
  const result = await getQuotes(getApiAuthHeaders(cookieStore.get('bf_portal')?.value))
  const quotes = result?.data ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl tracking-wider text-bone-paper uppercase">Quotes</h1>
      </div>

      {quotes.length === 0 ? (
        <p className="text-ash text-sm">No quotes found.</p>
      ) : (
        <div className="bg-navy border border-steel-dark rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-steel-dark text-xs text-ash uppercase tracking-wider">
                <th className="text-left px-4 py-3">Quote #</th>
                <th className="text-left px-4 py-3">Client</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Valid Until</th>
                <th className="text-left px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q, i) => (
                <tr
                  key={q.id}
                  className={`border-b border-steel-dark/50 hover:bg-charcoal transition-colors ${i % 2 === 0 ? '' : 'bg-charcoal/30'}`}
                >
                  <td className="px-4 py-3">
                    <Link href={`/quotes/${q.id}`} className="text-flame-gold hover:text-fire-orange font-mono text-xs">
                      {q.quote_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-bone-paper">{q.client_name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOUR[q.status] ?? 'text-ash'}`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-bone-paper font-mono text-xs">
                    R{q.total.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-ash text-xs">
                    {new Date(q.valid_until).toLocaleDateString('en-ZA')}
                  </td>
                  <td className="px-4 py-3 text-ash text-xs">
                    {new Date(q.created_at).toLocaleDateString('en-ZA')}
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
