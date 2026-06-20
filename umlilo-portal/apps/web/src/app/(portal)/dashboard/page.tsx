import { cookies } from 'next/headers'
import Link from 'next/link'
import { getApiAuthHeaders, getUserFromPortalCookie } from '@/lib/auth'
import type { DashboardKPIs } from '@blackfire/types'

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null
}

function asNumber(value: unknown) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function normalizeKPIs(body: unknown): DashboardKPIs | null {
  const root = asRecord(body)
  if (!root || root.success === false) return null
  const data = asRecord(root.data) ?? root
  const nestedData = asRecord(data.data)
  const kpi = asRecord(root.kpi) ?? asRecord(data.kpi)
  const source = kpi ?? (nestedData && nestedData.open_callouts != null ? nestedData : data)
  if (source.open_callouts == null && source.pending_quotes == null && source.active_clients == null) return null
  return {
    open_callouts: asNumber(source.open_callouts),
    overdue_invoices: asNumber(source.overdue_invoices ?? source.overdue_inv),
    mtd_revenue: asNumber(source.mtd_revenue),
    safety_score: source.safety_score == null ? null : asNumber(source.safety_score),
    pending_quotes: asNumber(source.pending_quotes),
    active_clients: asNumber(source.active_clients),
  }
}

function formatCurrency(value: unknown) {
  return `R${asNumber(value).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`
}

async function getKPIs(headers: Record<string, string> | null): Promise<DashboardKPIs | null> {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'https://blackfiresolutions.co.za/api'
  if (!headers) return null
  try {
    const response = await fetch(`${API_BASE}/dashboard.php`, { headers, cache: 'no-store' })
    return normalizeKPIs(await response.json())
  } catch {
    return null
  }
}

function KPICard({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <article className="border border-steel-dark bg-navy p-5">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ash">{label}</p>
      <p className="font-display text-4xl font-bold leading-none text-bone-paper">{value}</p>
      <p className="mt-2 text-xs text-ash">{sub}</p>
    </article>
  )
}

function WorkloadRow({ label, value, max }: { label: string; value: number; max: number }) {
  const width = value === 0 ? 0 : Math.max(3, Math.round((value / Math.max(max, 1)) * 100))
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ash">
        <span>{label}</span>
        <span className="text-bone-paper">{value}</span>
      </div>
      <div className="h-1.5 bg-charcoal"><div className="h-full bg-fire-orange" style={{ width: `${width}%` }} /></div>
    </div>
  )
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const portalCookie = cookieStore.get('bf_portal')?.value
  const user = getUserFromPortalCookie(portalCookie)
  const kpis = await getKPIs(getApiAuthHeaders(portalCookie))
  const workloadMax = kpis ? Math.max(kpis.open_callouts, kpis.pending_quotes, kpis.overdue_invoices, 1) : 1

  return (
    <div>
      <div className="mb-10 flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 className="font-display text-5xl font-bold leading-none text-bone-paper">Dashboard</h1>
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.24em] text-ash">AECI Chempark - {user?.role.replace('_', ' ')} view</p>
        </div>
        <button type="button" className="border border-steel-dark bg-navy px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-steel">Edit Layout</button>
      </div>

      {kpis ? (
        <>
          <div className="mb-5 grid gap-4 md:grid-cols-2">
            <Link href="/callouts" className="border-l-2 border-fire-orange bg-[#fff4e8] p-6 text-fire-orange">
              <p className="font-mono text-[11px] uppercase tracking-[0.24em]">Open Callouts</p>
              <p className="mt-2 font-display text-5xl font-bold leading-none">{kpis.open_callouts}</p>
              <p className="mt-2 text-sm">Operational jobs requiring attention</p>
            </Link>
            <Link href="/quotes" className="border-l-2 border-info bg-[#edf4ff] p-6 text-info">
              <p className="font-mono text-[11px] uppercase tracking-[0.24em]">Quotes Pending Approval</p>
              <p className="mt-2 font-display text-5xl font-bold leading-none">{kpis.pending_quotes}</p>
              <p className="mt-2 text-sm">Submitted and awaiting review</p>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KPICard label="MTD Revenue" value={formatCurrency(kpis.mtd_revenue)} sub="Month to date" />
            <KPICard label="Overdue Invoices" value={kpis.overdue_invoices} sub="Payment follow-up" />
            <KPICard label="Safety Score" value={kpis.safety_score != null ? `${kpis.safety_score}%` : '-'} sub="Current compliance" />
            <KPICard label="Active Clients" value={kpis.active_clients} sub="Current accounts" />
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[1.25fr_.85fr]">
            <section className="border border-steel-dark bg-navy">
              <div className="border-b border-steel-dark bg-charcoal px-5 py-4"><h2 className="font-display text-2xl font-bold text-bone-paper">Current Workload</h2></div>
              <div className="space-y-6 p-6">
                <WorkloadRow label="Open Callouts" value={kpis.open_callouts} max={workloadMax} />
                <WorkloadRow label="Pending Quotes" value={kpis.pending_quotes} max={workloadMax} />
                <WorkloadRow label="Overdue Invoices" value={kpis.overdue_invoices} max={workloadMax} />
              </div>
            </section>
            <section className="border border-steel-dark bg-navy">
              <div className="border-b border-steel-dark bg-charcoal px-5 py-4"><h2 className="font-display text-2xl font-bold text-bone-paper">Quick Access</h2></div>
              <div className="divide-y divide-steel-dark">
                <Link href="/callouts" className="flex items-center justify-between px-5 py-4 text-sm hover:bg-charcoal"><span>Callout register</span><span className="text-fire-orange">View</span></Link>
                <Link href="/tracker" className="flex items-center justify-between px-5 py-4 text-sm hover:bg-charcoal"><span>Work tracker</span><span className="text-fire-orange">View</span></Link>
                <Link href="/invoices" className="flex items-center justify-between px-5 py-4 text-sm hover:bg-charcoal"><span>Invoice register</span><span className="text-fire-orange">View</span></Link>
              </div>
            </section>
          </div>
        </>
      ) : <p className="text-sm text-ash">Could not load dashboard data.</p>}
    </div>
  )
}
