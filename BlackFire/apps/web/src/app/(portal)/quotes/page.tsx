import Link from 'next/link'
import { getCurrentUser, can } from '@/lib/server-auth'
import { getQuotes } from '@/lib/data/quotes'
import { getCallouts } from '@/lib/data/callouts'
import { quotePdfUrl } from '@blackfire/api-client'
import type { Callout, Quote } from '@blackfire/types'

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
  const [quoteResult, calloutResult] = await Promise.all([getQuotes(), getCallouts({ limit: 500 })])
  const quotes = quoteResult.data
  const calloutsById = new Map(calloutResult.data.map(callout => [callout.id, callout]))
  const calloutsByRef = new Map(calloutResult.data.map(callout => [callout.ref_id, callout]))
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

      <div className="space-y-3">
        {quotes.length ? quotes.map((quote: Quote) => {
          const linkedCallout: Callout | undefined =
            (quote.callout_ref ? calloutsByRef.get(quote.callout_ref) : undefined) ??
            (quote.callout_id ? calloutsById.get(quote.callout_id) : undefined)
          const calloutRef = linkedCallout?.ref_id ?? quote.callout_ref

          return (
            <article key={quote.id} className="overflow-hidden rounded border border-steel-dark bg-white shadow-sm">
              <div className="grid gap-5 p-5 md:grid-cols-[1.2fr_1.5fr_0.8fr_auto] md:items-center">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-ash">Quote record</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-fire-orange">{quote.quote_number}</p>
                  <p className="mt-2 font-medium text-ink-text">{quote.client_name}</p>
                </div>

                <div className="border-l-2 border-fire-orange pl-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-ash">Associated Call Log</p>
                  {linkedCallout ? (
                    <Link href={`/tracker/call-log/${linkedCallout.id}`} className="group mt-1 block">
                      <span className="font-mono text-sm font-semibold text-fire-orange group-hover:underline">{linkedCallout.ref_id}</span>
                      <span className="mt-1 block text-sm font-medium text-ink-text">{linkedCallout.service}</span>
                    </Link>
                  ) : (
                    <div className="mt-1">
                      <span className="font-mono text-sm text-ash">{calloutRef || 'Not linked'}</span>
                      <span className="mt-1 block text-sm text-ash">Service unavailable</span>
                    </div>
                  )}
                </div>

                <div>
                  <Status value={quote.status} />
                  <p className="mt-3 font-display text-2xl text-ink-text">R {Number(quote.total ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
                  <p className="mt-1 text-xs text-ash">Valid to {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('en-ZA') : 'not set'}</p>
                </div>

                <div className="flex flex-wrap gap-2 md:flex-col">
                  {linkedCallout && (
                    <Link href={`/tracker/call-log/${linkedCallout.id}`} className="inline-flex justify-center rounded border border-steel-dark px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ash hover:border-fire-orange hover:text-fire-orange">
                      Call Log
                    </Link>
                  )}
                  <a href={quotePdfUrl(quotePdfRef(quote))} target="_blank" rel="noreferrer" className="inline-flex justify-center rounded border border-fire-orange px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-fire-orange hover:bg-fire-orange hover:text-white">
                    PDF
                  </a>
                </div>
              </div>
              <details className="border-t border-steel-dark/60 px-5 py-3 text-sm text-ash">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.16em]">Record details</summary>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <span>Created: {quote.created_at ? new Date(quote.created_at).toLocaleDateString('en-ZA') : 'Unknown'}</span>
                  <span>Line items: {quote.items?.length ?? 0}</span>
                  <span>Call Log: {calloutRef || 'Not linked'}</span>
                </div>
              </details>
            </article>
          )
        }) : <div className="rounded border border-steel-dark bg-white px-4 py-14 text-center text-ash">No quotes found.</div>}
      </div>
    </div>
  )
}
