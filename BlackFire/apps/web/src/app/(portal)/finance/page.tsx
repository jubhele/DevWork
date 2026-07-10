import Link from 'next/link'
import { getFinanceSummary } from '@/lib/data/finance'
import PowerBIReport from '@/components/PowerBIReport'
import { KpiCard, KpiGrid, ReportFrame, SectionCard } from '@/components/report/ReportFrame'

function rnd(n: number) {
  return `R ${Number(n ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`
}

function pct(value: number, total: number) {
  if (total <= 0) return 0
  return Math.max(4, Math.round((value / total) * 100))
}

function shortDate(value: string) {
  if (!value) return 'No due date'
  return new Date(value).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' })
}

function ledgerDate(value: string) {
  if (!value) return 'No date'
  return new Date(value).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function FinancePage() {
  const summary = await getFinanceSummary()
  const maxTrend = Math.max(...(summary?.monthly_trend ?? []).flatMap(row => [row.invoiced, row.collected]), 1)
  const clientTotal = Math.max(...(summary?.client_breakdown ?? []).map(row => row.amount), 1)
  const statusTotal = Math.max(...(summary?.status_breakdown ?? []).map(row => row.amount), 1)
  const maxLedgerTrend = Math.max(...(summary?.ledger_trend ?? []).flatMap(row => [row.credits, row.debits]), 1)
  const ledgerCategoryTotal = Math.max(...(summary?.ledger_categories ?? []).map(row => Math.max(row.credits, row.debits)), 1)

  return (
    <ReportFrame title="Finance Overview" eyebrow="Month-to-date financial health">
      {summary ? (
        <>
          <KpiGrid>
            <KpiCard label="MTD Invoiced" value={rnd(summary.mtd_invoiced)} />
            <KpiCard label="MTD Collected" value={rnd(summary.mtd_collected)} />
            <KpiCard label="Outstanding Balance" value={rnd(summary.outstanding_balance)} tone="warning" />
            <KpiCard label="Overdue Amount" value={rnd(summary.overdue_amount)} tone="danger" />
          </KpiGrid>

          <section id="ledger" className="space-y-6 scroll-mt-40">
            <div className="flex flex-col gap-2">
              <p className="text-[11px] uppercase tracking-[0.28em] text-ash">Ledger Deep-Dive</p>
              <h2 className="font-display text-3xl text-ink-text">Credits, Debits and Transaction Feed</h2>
            </div>

            <KpiGrid>
              <KpiCard label="Net Balance" value={rnd(summary.ledger_summary.net_balance)} tone={summary.ledger_summary.net_balance < 0 ? 'danger' : 'default'} />
              <KpiCard label="Total Credits" value={rnd(summary.ledger_summary.total_credits)} />
              <KpiCard label="Total Debits" value={rnd(summary.ledger_summary.total_debits)} tone="warning" />
              <KpiCard label="Payments Received" value={rnd(summary.ledger_summary.payments_received)} sub={`${summary.ledger_summary.transaction_count} posted transactions`} />
            </KpiGrid>

            <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
              {summary.ledger_trend?.length > 0 && (
                <SectionCard title="Credits vs Debits by Month">
                  <div className="grid gap-4 p-5 sm:grid-cols-3 lg:grid-cols-6">
                    {summary.ledger_trend.map(row => (
                      <div key={row.month} className="min-w-0">
                        <div className="flex h-48 items-end gap-2 rounded border border-steel-dark bg-charcoal px-3 py-4">
                          <div className="flex flex-1 flex-col items-center justify-end gap-2">
                            <span className="text-[10px] text-ash">{rnd(row.credits)}</span>
                            <div className="w-full rounded-sm bg-success" style={{ height: `${pct(row.credits, maxLedgerTrend)}%` }} />
                          </div>
                          <div className="flex flex-1 flex-col items-center justify-end gap-2">
                            <span className="text-[10px] text-ash">{rnd(row.debits)}</span>
                            <div className="w-full rounded-sm bg-warning" style={{ height: `${pct(row.debits, maxLedgerTrend)}%` }} />
                          </div>
                        </div>
                        <p className="mt-2 truncate text-center text-[11px] uppercase text-ash">{row.month}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-4 border-t border-steel-dark px-5 py-3 text-xs text-ash">
                    <span><span className="mr-2 inline-block size-2 rounded-sm bg-success" />Credits</span>
                    <span><span className="mr-2 inline-block size-2 rounded-sm bg-warning" />Debits</span>
                  </div>
                </SectionCard>
              )}

              {summary.ledger_categories?.length > 0 && (
                <SectionCard title="Category Exposure">
                  <div className="space-y-4 p-5">
                    {summary.ledger_categories.map(row => {
                      const amount = Math.max(row.credits, row.debits)
                      return (
                        <div key={row.category}>
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-ink-text">{row.category}</p>
                              <p className="text-xs text-ash">{row.count} transactions · credits {rnd(row.credits)} · debits {rnd(row.debits)}</p>
                            </div>
                            <span className="shrink-0 text-sm font-medium text-ink-text">{rnd(amount)}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded bg-steel-dark/30">
                            <div className="h-2 rounded bg-flame-gold" style={{ width: `${pct(amount, ledgerCategoryTotal)}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </SectionCard>
              )}
            </div>

            {summary.ledger_transactions?.length > 0 && (
              <SectionCard title="Transaction Ledger" action={{ href: '/finance', label: 'Audit view' }}>
                <div className="divide-y divide-steel-dark">
                  {summary.ledger_transactions.map(tx => (
                    <article key={tx.id} className="grid gap-3 p-5 lg:grid-cols-[120px_1fr_140px_140px] lg:items-center">
                      <div className="text-xs uppercase tracking-[0.16em] text-ash">{ledgerDate(tx.trans_date)}</div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink-text">{tx.description}</p>
                        <p className="truncate text-xs text-ash">{tx.category} · {tx.reference || 'No reference'}</p>
                      </div>
                      <div className="flex items-center justify-between gap-2 rounded border border-steel-dark bg-charcoal px-3 py-2 text-xs">
                        <span className="text-ash">Credit</span>
                        <strong className="font-mono text-success">{tx.credit > 0 ? rnd(tx.credit) : '-'}</strong>
                      </div>
                      <div className="flex items-center justify-between gap-2 rounded border border-steel-dark bg-charcoal px-3 py-2 text-xs">
                        <span className="text-ash">Debit</span>
                        <strong className="font-mono text-warning">{tx.debit > 0 ? rnd(tx.debit) : '-'}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              </SectionCard>
            )}
          </section>

          {summary.monthly_trend?.length > 0 && (
            <SectionCard title="Monthly Finance Trend">
              <div className="grid gap-4 p-5 lg:grid-cols-6">
                {summary.monthly_trend.map(row => (
                  <div key={row.month} className="min-w-0">
                    <div className="flex h-44 items-end gap-2 rounded border border-steel-dark bg-charcoal px-3 py-4">
                      <div className="flex flex-1 flex-col items-center justify-end gap-2">
                        <span className="text-[10px] text-ash">{rnd(row.invoiced)}</span>
                        <div className="w-full rounded-sm bg-fire-orange" style={{ height: `${pct(row.invoiced, maxTrend)}%` }} />
                      </div>
                      <div className="flex flex-1 flex-col items-center justify-end gap-2">
                        <span className="text-[10px] text-ash">{rnd(row.collected)}</span>
                        <div className="w-full rounded-sm bg-success" style={{ height: `${pct(row.collected, maxTrend)}%` }} />
                      </div>
                    </div>
                    <p className="mt-2 truncate text-center text-[11px] uppercase text-ash">{row.month}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4 border-t border-steel-dark px-5 py-3 text-xs text-ash">
                <span><span className="mr-2 inline-block size-2 rounded-sm bg-fire-orange" />Invoiced</span>
                <span><span className="mr-2 inline-block size-2 rounded-sm bg-success" />Collected</span>
              </div>
            </SectionCard>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {summary.client_breakdown?.length > 0 && (
              <SectionCard title="Client Breakdown">
                <div className="space-y-4 p-5">
                  {summary.client_breakdown.map(client => (
                    <div key={client.client}>
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink-text">{client.client}</p>
                          <p className="text-xs text-ash">{client.invoice_count} invoices · {rnd(client.outstanding)} outstanding</p>
                        </div>
                        <span className="shrink-0 text-sm font-medium text-ink-text">{rnd(client.amount)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded bg-steel-dark/30">
                        <div className="h-2 rounded bg-fire-orange" style={{ width: `${pct(client.amount, clientTotal)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {summary.status_breakdown?.length > 0 && (
              <SectionCard title="Invoice Status">
                <div className="space-y-4 p-5">
                  {summary.status_breakdown.map(row => (
                    <div key={row.status}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-sm text-ash">{row.status} ({row.count})</span>
                        <span className="text-sm font-medium text-ink-text">{rnd(row.amount)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded bg-steel-dark/30">
                        <div className="h-2 rounded bg-flame-gold" style={{ width: `${pct(row.amount, statusTotal)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            {summary.aging?.length > 0 && (
              <SectionCard title="Invoice Aging">
                <div className="space-y-3 p-5">
                  {summary.aging.map((a, i) => {
                    const width = pct(a.amount, summary.outstanding_balance)
                  return (
                    <div key={`${a.band}-${i}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-ash">{a.band}</span>
                        <span className="text-sm font-medium text-ink-text">{rnd(a.amount)}</span>
                      </div>
                      <div className="h-2 rounded bg-steel-dark/30 overflow-hidden">
                        <div className="h-2 rounded bg-danger transition-all" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  )
                })}
                </div>
              </SectionCard>
            )}

            {summary.recent_invoices?.length > 0 && (
              <SectionCard title="Invoice List Fallback" action={{ href: '/invoices', label: 'View all' }}>
                <div className="divide-y divide-steel-dark">
                  {summary.recent_invoices.map(invoice => (
                    <div key={invoice.ref_id} className="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink-text">{invoice.invoice_no}</p>
                        <p className="truncate text-xs text-ash">{invoice.client_name} · Due {shortDate(invoice.due_date)}</p>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <span className="rounded border border-steel-dark bg-charcoal px-2 py-1 text-[11px] uppercase text-ash">{invoice.status}</span>
                        <span className="text-sm font-medium text-ink-text">{rnd(invoice.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>

          <div className="flex gap-3 flex-wrap">
            <Link href="/invoices" className="rounded border border-steel-dark bg-white px-4 py-2 text-xs uppercase tracking-[0.18em] text-ash hover:text-ink-text">View Invoices</Link>
            <Link href="/invoices?filter=overdue" className="rounded border border-danger bg-danger/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-danger hover:bg-danger/20">View Overdue ({summary.overdue_count})</Link>
          </div>

          <div className="mt-8">
            <PowerBIReport surface="finance" />
          </div>
        </>
      ) : (
        <p className="text-sm text-ash">Finance data could not be loaded. Check your connection or contact your Admin.</p>
      )}
    </ReportFrame>
  )
}
