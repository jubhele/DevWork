import { cookies } from 'next/headers'
import Link from 'next/link'
import { getServerUser } from '@/lib/auth'
import type { DashboardResponse, TaskCategory } from '@blackfire/types'
import AnomalyWidget from '@/components/AnomalyWidget'
import ReportTrigger from '@/components/ReportTrigger'

async function getDashboard(): Promise<DashboardResponse | null> {
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
    return body.success ? body : null
  } catch {
    return null
  }
}

function KPICard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-steel-dark rounded-md p-5 shadow-[0_1px_0_rgba(0,0,0,.02)]">
      <p className="text-[11px] tracking-[0.28em] uppercase text-ash mb-2">{label}</p>
      <p className="text-[44px] leading-none font-display text-ink-text">{value}</p>
      {sub && <p className="text-xs text-ash mt-2">{sub}</p>}
    </div>
  )
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const user = await getServerUser(cookieStore.toString())
  const dashboard = await getDashboard()
  const kpis = dashboard?.data
  const streamLabels: Record<TaskCategory, string> = { admin: 'Admin', sales: 'Sales', general: 'General' }

  return (
    <div>
      <h1 className="font-display text-5xl tracking-tight text-ink-text uppercase">
        Dashboard
      </h1>
      <p className="mt-2 mb-8 text-sm tracking-[0.28em] uppercase text-ash">
        AECI Chempark - {user?.role === 'sysadmin' ? 'Sysadmin View' : 'Admin View'}
      </p>

      {kpis && dashboard ? (
        <>
          <div className="mb-5 grid gap-4 md:grid-cols-2">
            <Link href="/tracker" className="border-l-2 border-fire-orange bg-[#fff3e8] p-6">
              <p className="text-[11px] uppercase tracking-[0.28em] text-fire-orange">Urgent Tracker Tasks</p>
              <p className="mt-2 font-display text-4xl text-fire-orange">{kpis.urgent_tasks}</p>
              <p className="mt-1 text-sm text-fire-orange">Internal work requiring attention</p>
            </Link>
            <Link href="/quotes" className="border-l-2 border-info bg-[#eef5ff] p-6">
              <p className="text-[11px] uppercase tracking-[0.28em] text-info">Quotes Pending Approval</p>
              <p className="mt-2 font-display text-4xl text-info">{kpis.pending_quotes}</p>
              <p className="mt-1 text-sm text-info">Submitted and awaiting review</p>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
            <KPICard label="Open Tasks" value={kpis.open_tasks} sub="Admin, Sales & General" />
            <KPICard label="Open Callouts" value={kpis.open_callouts} sub="Operational jobs only" />
            <KPICard label="Due Today" value={kpis.tasks_due_today} sub="Tracker tasks" />
            <KPICard label="Overdue Invoices" value={kpis.overdue_invoices} />
            <KPICard label="MTD Revenue" value={`R${kpis.mtd_revenue.toLocaleString()}`} />
            <KPICard label="Active Clients" value={kpis.active_clients} />
          </div>
          <div className="mt-6 grid gap-5 xl:grid-cols-3">
            <div className="xl:col-span-2"><AnomalyWidget /></div>
            <ReportTrigger clientName="AECI Chempark" />
          </div>
          <div className="mt-6 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <section className="overflow-hidden rounded border border-steel-dark bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-steel-dark bg-charcoal px-5 py-4">
                <h2 className="font-display text-xl text-ink-text">Recent Tracker Activity</h2>
                <Link href="/tracker" className="text-xs uppercase tracking-[0.16em] text-fire-orange">View all</Link>
              </div>
              <div>
                {dashboard.recent_tasks.length ? dashboard.recent_tasks.map(task => (
                  <Link key={task.ref_id} href={`/tracker/${task.ref_id}`} className="grid gap-2 border-b border-steel-dark/60 px-5 py-4 last:border-0 hover:bg-charcoal/60 sm:grid-cols-[120px_1fr_auto]">
                    <span className="font-mono text-xs text-fire-orange">{task.ref_id}</span>
                    <span className="text-sm font-medium text-ink-text">{task.title}</span>
                    <span className="text-xs uppercase tracking-[0.12em] text-ash">{streamLabels[task.category]}</span>
                  </Link>
                )) : <p className="px-5 py-12 text-center text-sm text-ash">No tracker activity yet.</p>}
              </div>
            </section>
            <section className="rounded border border-steel-dark bg-white p-5 shadow-sm">
              <h2 className="font-display text-xl text-ink-text">Open Work by Stream</h2>
              <div className="mt-5 space-y-4">
                {(Object.entries(dashboard.task_streams) as [TaskCategory, number][]).map(([stream, count]) => (
                  <Link key={stream} href={`/tracker?stream=${stream}`} className="flex items-center justify-between border-b border-steel-dark/60 pb-3 last:border-0">
                    <span className="text-sm text-ash">{streamLabels[stream]}</span><span className="font-display text-2xl text-ink-text">{count}</span>
                  </Link>
                ))}
                <Link href="/tracker?stream=call-log" className="flex items-center justify-between border-b border-steel-dark/60 pb-3 last:border-0">
                  <span className="text-sm text-ash">Call Log</span><span className="font-display text-2xl text-ink-text">{kpis.open_callouts}</span>
                </Link>
              </div>
            </section>
          </div>
        </>
      ) : (
        <p className="text-ash text-sm">Could not load dashboard data.</p>
      )}
    </div>
  )
}
