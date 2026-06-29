import Link from 'next/link'
import { getFinanceSummary } from '@/lib/data/finance'

function KPI({ label, value, tone }: { label: string; value: string; tone?: 'danger' | 'warning' }) {
  const textClass = tone === 'danger' ? 'text-danger' : tone === 'warning' ? 'text-warning' : 'text-ink-text'
  return (
    <div className="bg-white border border-steel-dark rounded-md p-5 shadow-[0_1px_0_rgba(0,0,0,.02)]">
      <p className="text-[11px] tracking-[0.28em] uppercase text-ash mb-2">{label}</p>
      <p className={`text-[40px] leading-none font-display ${textClass}`}>{value}</p>
    </div>
  )
}

function rnd(n: number) {
  return `R ${Number(n ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`
}

export default async function FinancePage() {
  const summary = await getFinanceSummary()

  return (
    <div>
      <h1 className="font-display text-5xl tracking-tight text-ink-text">Finance Overview</h1>
      <p className="mt-2 mb-8 text-sm uppercase tracking-[0.28em] text-ash">Month-to-date financial health</p>

      {summary ? (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4 mb-8">
            <KPI label="MTD Invoiced" value={rnd(summary.mtd_invoiced)} />
            <KPI label="MTD Collected" value={rnd(summary.mtd_collected)} />
            <KPI label="Outstanding Balance" value={rnd(summary.outstanding_balance)} tone="warning" />
            <KPI label="Overdue Amount" value={rnd(summary.overdue_amount)} tone="danger" />
          </div>

          {summary.aging?.length > 0 && (
            <section className="mb-8 rounded border border-steel-dark bg-white p-6 shadow-sm">
              <h2 className="font-display text-xl text-ink-text mb-4">Invoice Aging</h2>
              <div className="space-y-3">
                {summary.aging.map(a => {
                  const pct = summary.outstanding_balance > 0 ? Math.round((a.amount / summary.outstanding_balance) * 100) : 0
                  return (
                    <div key={a.band}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-ash">{a.band}</span>
                        <span className="text-sm font-medium text-ink-text">{rnd(a.amount)}</span>
                      </div>
                      <div className="h-2 rounded bg-steel-dark/30 overflow-hidden">
                        <div className="h-2 rounded bg-fire-orange transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          <div className="flex gap-3 flex-wrap">
            <Link href="/invoices" className="rounded border border-steel-dark bg-white px-4 py-2 text-xs uppercase tracking-[0.18em] text-ash hover:text-ink-text">View Invoices</Link>
            <Link href="/invoices?filter=overdue" className="rounded border border-danger bg-danger/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-danger hover:bg-danger/20">View Overdue ({summary.overdue_count})</Link>
          </div>
        </>
      ) : (
        <p className="text-sm text-ash">Finance data could not be loaded. Check your connection or contact your Admin.</p>
      )}
    </div>
  )
}
