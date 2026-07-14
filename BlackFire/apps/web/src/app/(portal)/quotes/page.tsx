import Link from 'next/link'
import { getCurrentUser, can } from '@/lib/server-auth'
import { getQuotes } from '@/lib/data/quotes'
import { quotePdfUrl } from '@blackfire/api-client'
import type { Quote } from '@blackfire/types'

function Status({ value }: { value: string }) {
  const tone =
    value === 'Approved' ? 'bg-success/10 text-success' :
    value === 'Declined' || value === 'Expired' ? 'bg-danger/10 text-danger' :
    value === 'Pending Approval' ? 'bg-warning/10 text-warning' :
    'bg-info/10 text-info'
  return <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${tone}`}>{value}</span>
}

function quotePdfRef(quote: Quote) {
  return quote.quote_number || quote.id
}

export default async function QuotesPage() {
  const user = await getCurrentUser()
  const result = await getQuotes()
  const quotes: Quote[] = result.data

  const canCreate = user != null && can(user, 'quote.create')

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl tracking-tight text-ink-text">Quote Log</h1>
          <p className="mt-2 text-sm uppercase tracking-[0.28em] text-ash">Finance - service quotations and approvals</p>
        </div>
        {canCreate && (
          <Link href="/quotes/new" className="rounded border border-fire-orange bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
            + Submit Quote
          </Link>
        )}
      </div>

      <div className="overflow-hidden rounded border border-steel-dark bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="border-b border-steel-dark bg-charcoal text-[11px] uppercase tracking-[0.18em] text-ash">
              <tr>
                <th className="px-4 py-3 text-left">Quote Ref</th>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-left">Valid Until</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotes.length ? quotes.map((q: Quote) => (
                <tr key={q.id} className="border-b border-steel-dark/60 last:border-0 hover:bg-charcoal/60">
                  <td className="px-4 py-3 font-mono text-xs text-fire-orange">{q.quote_number}</td>
                  <td className="px-4 py-3 font-medium text-ink-text">{q.client_name}</td>
                  <td className="px-4 py-3"><Status value={q.status} /></td>
                  <td className="px-4 py-3 text-ash">R {Number(q.total ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-ash">{q.valid_until ? new Date(q.valid_until).toLocaleDateString('en-ZA') : '—'}</td>
                  <td className="px-4 py-3 text-ash">{q.created_at ? new Date(q.created_at).toLocaleDateString('en-ZA') : '—'}</td>
                  <td className="px-4 py-3">
                    <a
                      href={quotePdfUrl(quotePdfRef(q))}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded border border-steel-dark bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-ash hover:border-fire-orange hover:text-fire-orange"
                    >
                      PDF
                    </a>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="px-4 py-14 text-center text-ash">No quotes found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
