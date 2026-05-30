import { cookies } from 'next/headers'
import { getServerUser } from '@/lib/auth'
import type { DashboardKPIs } from '@blackfire/types'

async function getKPIs(): Promise<DashboardKPIs | null> {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'https://blackfiresolutions.co.za/api'
  const cookieStore = await cookies()
  try {
    const res = await fetch(`${API_BASE}/dashboard.php`, {
      headers: {
        Cookie: cookieStore.toString(),
        'X-Requested-With': 'XMLHttpRequest',
      },
      cache: 'no-store',
    })
    const body = await res.json()
    return body.success ? body.data : null
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
  const user = await getServerUser(cookieStore.toString())
  const kpis = await getKPIs()

  return (
    <div>
      <h1 className="font-display text-2xl tracking-wider text-bone-paper mb-6 uppercase">
        Dashboard
      </h1>

      {kpis ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <KPICard label="Open Callouts"    value={kpis.open_callouts} />
          <KPICard label="Overdue Invoices" value={kpis.overdue_invoices} />
          <KPICard label="MTD Revenue"      value={`R${kpis.mtd_revenue.toLocaleString()}`} />
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
