import { cookies } from 'next/headers'
import { getApiAuthHeaders } from '@/lib/auth'
import type { Quote, PaginatedResponse } from '@blackfire/types'

const STATUS_COLOUR: Record<string, string> = {
  Draft:             'bg-ash/10 text-ash',
  Sent:              'bg-info/10 text-info',
  'Pending Approval':'bg-flame-gold/10 text-flame-gold',
  Approved:          'bg-success/10 text-success',
  Converted:         'bg-info/10 text-info',
  Accepted:          'bg-success/10 text-success',
  Rejected:          'bg-danger/10 text-danger',
  Declined:          'bg-danger/10 text-danger',
  Expired:           'bg-ash/10 text-ash opacity-60',
}

type QuoteRow = Quote & {
  total_amount?: number  // PHP DB column name
  amount?: number
  quote_no?: string
  ref_id?: string
}

function asNumber(value: unknown) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function quoteTotal(quote: QuoteRow) {
  if (quote.total != null) return asNumber(quote.total)
  if (quote.total_amount != null) return asNumber(quote.total_amount) // PHP column name
  if (quote.amount != null) return asNumber(quote.amount)
  return (quote.items ?? []).reduce((sum, item) => sum + asNumber(item.total ?? item.qty * item.unit_price), 0)
}

function formatCurrency(value: unknown) {
  return `R${asNumber(value).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? '-' : date.toLocaleDateString('en-ZA')
}

async function getQuotes(headers: Record<string, string> | null): Promise<PaginatedResponse<Quote> | null> {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE
    ?? `http://localhost:${process.env.PORT ?? '3000'}/api`
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
  const quotes = (result?.data ?? []) as QuoteRow[]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl tracking-wider text-bone-paper uppercase">Quotes</h1>
        <a href="/quotes/new" className="h-9 px-4 inline-flex items-center rounded-[3px] border border-steel-dark bg-navy font-mono text-[10px] uppercase tracking-[0.16em] text-fire-orange hover:border-fire-orange transition-colors">
          + Draft New
        </a>
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
                    <span className="text-flame-gold font-mono text-xs">
                      {q.quote_number ?? q.quote_no ?? q.ref_id ?? q.id}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-bone-paper">{q.client_name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOUR[q.status] ?? 'text-ash'}`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-bone-paper font-mono text-xs">
                    {formatCurrency(quoteTotal(q))}
                  </td>
                  <td className="px-4 py-3 text-ash text-xs">
                    {formatDate(q.valid_until)}
                  </td>
                  <td className="px-4 py-3 text-ash text-xs">
                    {formatDate(q.created_at)}
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
