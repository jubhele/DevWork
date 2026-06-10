import { cookies } from 'next/headers'
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
    const res = await fetch(`${API_BASE}/dashboard.php`, {
      headers,
      cache: 'no-store',
    })
    const body = await res.json()
    return normalizeKPIs(body)
  } catch {
    return null
  }
}

function KPICard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-navy border border-steel-dark rounded-lg p-5">
      <p className="text-xs text-ash uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-display text-bone-paper">{value}</p>
      {sub && <p className="text-xs text-ash mt-1">{sub}</p>}
    </div>
  )
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const portalCookie = cookieStore.get('bf_portal')?.value
  const user = getUserFromPortalCookie(portalCookie)
  const kpis = await getKPIs(getApiAuthHeaders(portalCookie))

  return (
    <div>
      <h1 className="font-display text-2xl tracking-wider text-bone-paper mb-1 uppercase">
        Dashboard
      </h1>
      {user && (
        <p className="text-ash text-sm mb-6">Welcome back, {user.name}.</p>
      )}

      {kpis ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <KPICard label="Open Callouts"    value={kpis.open_callouts} />
          <KPICard label="Overdue Invoices" value={kpis.overdue_invoices} />
          <KPICard label="MTD Revenue"      value={formatCurrency(kpis.mtd_revenue)} />
          <KPICard label="Safety Score"     value={kpis.safety_score != null ? `${kpis.safety_score}%` : '—'} />
          <KPICard label="Pending Quotes"   value={kpis.pending_quotes} />
          <KPICard label="Active Clients"   value={kpis.active_clients} />
        </div>
      ) : (
        <p className="text-ash text-sm">Could not load dashboard data.</p>
      )}
    </div>
  )
}
