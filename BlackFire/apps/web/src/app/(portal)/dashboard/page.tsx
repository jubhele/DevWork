import { cookies } from 'next/headers'
import Link from 'next/link'
import { getServerUser } from '@/lib/auth'
import { getDashboardData } from '@/lib/data/dashboard'
import type { TaskCategory } from '@blackfire/types'
import AnomalyWidget from '@/components/AnomalyWidget'
import ReportTrigger from '@/components/ReportTrigger'
import PowerBIReport from '@/components/PowerBIReport'
import { KpiCard, KpiGrid, ReportFrame, SectionCard } from '@/components/report/ReportFrame'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const user = await getServerUser(cookieStore.toString())
  const dashboard = user ? await getDashboardData(user.role) : null
  const kpis = dashboard?.data
  const streamLabels: Record<TaskCategory, string> = { admin: 'Admin', sales: 'Sales', general: 'General' }
  const maxRevenue = Math.max(...(dashboard?.monthly_revenue.map(month => month.value) ?? [0]), 1)

  return (
    <ReportFrame
      title="Dashboard"
      eyebrow={`AECI Chempark - ${user?.role === 'sysadmin' ? 'Sysadmin View' : 'Admin View'}`}
    >
      {kpis && dashboard ? (
        <>
          <section className="grid gap-5 rounded-[2px] border border-[#ccc] border-l-fire-orange bg-white p-5 shadow-none lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-fire-orange">Executive Dashboard</p>
              <h2 className="mt-2 font-display text-3xl text-ink-text sm:text-4xl">AECI Chempark health check</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-ash">
                Leadership view of open work, finance pressure, urgent operations, and compliance attention points.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:w-[360px]">
              <Link href="/tracker" className="rounded-[2px] border border-[#ccc] px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-fire-orange">
                Open Operations
              </Link>
              <Link href="/finance" className="rounded-[2px] border border-[#ccc] px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-fire-orange">
                Review Finance
              </Link>
            </div>
          </section>
          <KpiGrid>
            <KpiCard label="Active Work" value={kpis.open_tasks + kpis.open_callouts} sub="Tasks + callouts" />
            <KpiCard label="Attention Items" value={kpis.urgent_tasks + kpis.overdue_invoices + kpis.pending_quotes} sub="Urgent, overdue, approvals" tone={kpis.urgent_tasks + kpis.overdue_invoices + kpis.pending_quotes > 0 ? 'warning' : 'default'} />
            <KpiCard label="MTD Collected" value={`R${kpis.mtd_revenue.toLocaleString()}`} sub="Payments received this month" />
            <KpiCard label="Active Clients" value={kpis.active_clients} sub="Client accounts" />
          </KpiGrid>
          <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
            <SectionCard title="Revenue Trend">
              <div className="flex h-56 items-end gap-3 px-5 py-4">
                {dashboard.monthly_revenue.map(month => (
                  <div key={month.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                    <span className="min-h-4 font-mono text-[10px] text-ash">{month.value > 0 ? `R${Math.round(month.value / 1000)}K` : ''}</span>
                    <span
                      className="w-full rounded-t-sm bg-fire-orange"
                      style={{ height: `${Math.max(6, Math.round((month.value / maxRevenue) * 100))}%` }}
                    />
                    <span className="font-mono text-[10px] uppercase text-ash">{month.label}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
            <SectionCard title="Open Work Status">
              <div className="px-5 py-4">
                {([...Object.entries(dashboard.task_streams), ['call-log', kpis.open_callouts]] as Array<[string, number]>).map(([stream, count]) => (
                  <div key={stream} className="border-b border-steel-dark py-3 last:border-0">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-ash">{stream === 'call-log' ? 'Call Log' : streamLabels[stream as TaskCategory]}</span>
                      <span className="font-mono text-ink-text">{count}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-charcoal">
                      <span className="block h-full rounded-full bg-fire-orange" style={{ width: `${Math.round((count / Math.max(kpis.open_tasks + kpis.open_callouts, 1)) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Link href="/tracker" className="rounded-[2px] border border-[#ccc] border-l-fire-orange bg-white p-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-fire-orange">Urgent Tracker Tasks</p>
              <p className="mt-2 font-display text-3xl text-fire-orange">{kpis.urgent_tasks}</p>
              <p className="mt-1 text-xs text-ash">Internal work requiring attention</p>
            </Link>
            <Link href="/tracker" className="rounded-[2px] border border-[#ccc] border-l-warning bg-white p-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-warning">Urgent Callouts</p>
              <p className="mt-2 font-display text-3xl text-warning">{kpis.open_callouts}</p>
              <p className="mt-1 text-xs text-ash">Operational jobs in motion</p>
            </Link>
            <Link href="/finance" className="rounded-[2px] border border-[#ccc] border-l-danger bg-white p-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-danger">Overdue Invoices</p>
              <p className="mt-2 font-display text-3xl text-danger">{kpis.overdue_invoices}</p>
              <p className="mt-1 text-xs text-ash">Immediate follow-up</p>
            </Link>
            <Link href="/quotes" className="rounded-[2px] border border-[#ccc] border-l-info bg-white p-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-info">Quote Approvals</p>
              <p className="mt-2 font-display text-3xl text-info">{kpis.pending_quotes}</p>
              <p className="mt-1 text-xs text-ash">Submitted and awaiting review</p>
            </Link>
          </div>
          <div className="mt-6 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <SectionCard title="Recent Tracker Activity" action={{ href: '/tracker', label: 'View all' }}>
              <div>
                {dashboard.recent_tasks.length ? dashboard.recent_tasks.map(task => (
                  <Link key={task.ref_id} href={`/tracker/${task.ref_id}`} className="grid gap-2 border-b border-steel-dark/60 px-5 py-4 last:border-0 hover:bg-charcoal/60 sm:grid-cols-[120px_1fr_auto]">
                    <span className="font-mono text-xs text-fire-orange">{task.ref_id}</span>
                    <span className="text-sm font-medium text-ink-text">{task.title}</span>
                    <span className="text-xs uppercase tracking-[0.12em] text-ash">{streamLabels[task.category]}</span>
                  </Link>
                )) : <p className="px-5 py-12 text-center text-sm text-ash">No tracker activity yet.</p>}
              </div>
          </SectionCard>
            <SectionCard title="Open Work by Stream">
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
            </SectionCard>
          </div>
          <div className="mt-6 grid gap-5 xl:grid-cols-3">
            <div className="xl:col-span-2"><AnomalyWidget /></div>
            <ReportTrigger clientName="AECI Chempark" />
          </div>
          <div className="mt-6">
            <PowerBIReport surface="dashboard" />
          </div>
        </>
      ) : (
        <p className="text-ash text-sm">Could not load dashboard data.</p>
      )}
    </ReportFrame>
  )
}
