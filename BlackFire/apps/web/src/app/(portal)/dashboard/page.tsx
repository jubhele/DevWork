import { cookies } from 'next/headers'
import Link from 'next/link'
import { getServerUser } from '@/lib/auth'
import { getDashboardData } from '@/lib/data/dashboard'
import type { TaskCategory } from '@blackfire/types'
import AnomalyWidget from '@/components/AnomalyWidget'
import ReportTrigger from '@/components/ReportTrigger'
import PowerBIReport from '@/components/PowerBIReport'
import { ReportFrame, SectionCard } from '@/components/report/ReportFrame'

const money = (value: number) => `R${value.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const compactMoney = (value: number) => value >= 1_000_000 ? `R${(value / 1_000_000).toFixed(1)}M` : value >= 1_000 ? `R${Math.round(value / 1_000)}K` : `R${Math.round(value)}`

function MetricCard({ label, value, sub, amount = false }: { label: string; value: string | number; sub: string; amount?: boolean }) {
  return (
    <div className="min-w-0 border border-[#ccc] bg-white p-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-ash">{label}</p>
      <p className={`mt-2 font-display leading-none text-ink-text ${amount ? 'text-2xl' : 'text-3xl'}`}>{value}</p>
      <p className="mt-2 text-xs text-ash">{sub}</p>
    </div>
  )
}

function AttentionCard({ label, value, sub, danger = false }: { label: string; value: number; sub: string; danger?: boolean }) {
  const active = value > 0
  return (
    <div className={`border border-[#ccc] border-l-2 bg-white p-4 ${danger && active ? 'border-l-danger' : active ? 'border-l-warning' : 'border-l-[#999]'}`}>
      <p className="text-[10px] uppercase tracking-[0.2em] text-ash">{label}</p>
      <p className={`mt-2 font-display text-3xl leading-none ${danger && active ? 'text-danger' : active ? 'text-warning' : 'text-ink-text'}`}>{value}</p>
      <p className="mt-2 text-xs text-ash">{sub}</p>
    </div>
  )
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const user = await getServerUser(cookieStore.toString())
  const dashboard = user ? await getDashboardData(user) : null
  const kpis = dashboard?.data
  const streamLabels: Record<TaskCategory, string> = { admin: 'Admin', sales: 'Sales', general: 'General' }

  if (!kpis || !dashboard) {
    return <ReportFrame title="Dashboard" eyebrow="AECI Chempark"><p className="text-sm text-ash">Could not load dashboard data.</p></ReportFrame>
  }

  const maxInvoice = Math.max(...dashboard.invoice_run_rate.months.map(month => month.amount), 1)
  const activeUsers = dashboard.usage.filter(row => row.current_logins > 0).length
  const inactiveUsers = dashboard.usage.length - activeUsers
  const today = new Date(); today.setHours(0, 0, 0, 0)

  return (
    <ReportFrame title="Dashboard" eyebrow={`AECI Chempark - ${user?.role === 'sysadmin' ? 'Sysadmin View' : 'Admin View'}`}>
      <section className="grid gap-5 rounded-[2px] border border-[#ccc] border-l-fire-orange bg-white p-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-fire-orange">Executive Dashboard</p>
          <h2 className="mt-2 font-display text-3xl text-ink-text sm:text-4xl">AECI Chempark health check</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ash">One view of workload counts, financial amounts, deadline risk, invoice run rate, cash collection and portal adoption.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:w-[360px]">
          <Link href="/tracker" className="rounded-[2px] border border-[#ccc] px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-fire-orange">Open Operations</Link>
          <Link href="/finance" className="rounded-[2px] border border-[#ccc] px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-fire-orange">Review Finance</Link>
        </div>
      </section>

      <section className="mt-5">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ash">Counts</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Open Tasks" value={kpis.open_tasks} sub="Admin, sales and general" />
          <MetricCard label="Open Callouts" value={kpis.open_callouts} sub="Operational jobs" />
          <MetricCard label="Pending Quotes" value={kpis.pending_quotes} sub="Draft, sent or awaiting approval" />
          <MetricCard label="Active Clients" value={kpis.active_clients} sub="Enabled client accounts" />
        </div>
      </section>

      <section className="mt-5">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ash">Amounts</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Invoiced" value={money(dashboard.amounts.invoiced)} sub={dashboard.invoice_run_rate.period_label} amount />
          <MetricCard label="Outstanding" value={money(dashboard.amounts.outstanding)} sub="All sent and overdue invoices" amount />
          <MetricCard label="Net Cash Movement" value={money(dashboard.amounts.net_cash_movement)} sub="Credits less debits in period" amount />
          <MetricCard label="Quote Pipeline" value={money(dashboard.amounts.quote_pipeline)} sub="Active quote value in period" amount />
        </div>
      </section>

      <section className="mt-5">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ash">Attention</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AttentionCard label="Urgent Tasks" value={kpis.urgent_tasks} sub="Immediate internal attention" />
          <AttentionCard label="Urgent Callouts" value={kpis.urgent_callouts} sub="Priority dispatch" />
          <AttentionCard label="Due in 7 Days" value={dashboard.due_soon.length} sub="Intervene before deadline" />
          <AttentionCard label="Overdue Invoices" value={kpis.overdue_invoices} sub="Past due and unpaid" danger />
        </div>
      </section>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <SectionCard title="Invoice Run Rate">
          <div className="flex items-center justify-between gap-4 border-b border-steel-dark/60 px-5 py-3 text-xs text-ash">
            <span>Invoice value and count over {dashboard.invoice_run_rate.period_label.toLowerCase()}</span>
            <span className="rounded-full border border-[#ccc] px-3 py-1 font-mono text-[10px]">Avg {dashboard.invoice_run_rate.average_count.toFixed(1)} invoices / month</span>
          </div>
          <div className="flex h-60 items-end gap-3 px-5 py-4">
            {dashboard.invoice_run_rate.months.map(month => (
              <div key={month.month} title={`${month.count} invoices · ${money(month.amount)}`} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                <span className="flex min-h-8 flex-col items-center justify-end font-mono text-[9px] leading-tight">
                  <span className="text-ash">{month.count} inv</span><strong className="text-ink-text">{compactMoney(month.amount)}</strong>
                </span>
                <span className="w-full rounded-t-sm bg-fire-orange" style={{ height: `${Math.max(6, Math.round((month.amount / maxInvoice) * 100))}%` }} />
                <span className="font-mono text-[9px] uppercase text-ash">{month.label}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2 border-t border-steel-dark/60 px-5 py-4 text-xs text-ash">
            <span>Average monthly invoice value</span><strong className="font-mono text-ink-text">{money(dashboard.invoice_run_rate.average_amount)}</strong>
            <span>Period total</span><strong className="font-mono text-ink-text">{money(dashboard.invoice_run_rate.total_amount)}</strong>
          </div>
        </SectionCard>

        <SectionCard title="Cash Collected Comparisons">
          <div className="grid gap-3 p-5">
            {dashboard.cash_comparisons.map(item => {
              const positive = item.change_percent != null && item.change_percent > 0
              const negative = item.change_percent != null && item.change_percent < 0
              return (
                <div key={item.key} className="border border-[#ccc] bg-white p-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-ash">{item.label}</p>
                  <div className="mt-2 flex items-end justify-between gap-3"><strong className="font-display text-2xl text-ink-text">{money(item.current)}</strong><span className={`rounded px-2 py-1 font-mono text-[10px] ${positive ? 'bg-success/10 text-success' : negative ? 'bg-danger/10 text-danger' : 'bg-charcoal text-ash'}`}>{item.change_percent == null ? 'New' : `${item.change_percent > 0 ? '+' : ''}${item.change_percent}%`}</span></div>
                  <p className="mt-2 text-xs text-ash">Prior year: {money(item.previous)}</p>
                </div>
              )
            })}
          </div>
        </SectionCard>
      </div>

      <div className="mt-6 overflow-hidden border border-[#ccc] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ccc] bg-[#f3f3f3] px-5 py-4">
          <div><h3 className="font-display text-xl text-ink-text">Approaching Deadlines</h3><p className="mt-1 text-xs text-ash">Open records due today through the next seven days, ordered by deadline</p></div>
          <span className="rounded-full border border-[#ccc] px-3 py-1 font-mono text-[10px] text-ash">{dashboard.due_soon.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b border-[#ccc] text-[10px] uppercase tracking-[0.16em] text-ash"><th className="px-5 py-3">Type</th><th>Ref</th><th>Record</th><th>Assigned To</th><th>Due Date</th><th>Remaining</th></tr></thead><tbody>
            {dashboard.due_soon.length ? dashboard.due_soon.slice(0, 12).map(record => {
              const due = new Date(`${record.due_date}T00:00:00`)
              const days = Math.max(0, Math.round((due.getTime() - today.getTime()) / 86_400_000))
              return <tr key={`${record.record_type}-${record.ref_id}`} className="border-b border-[#ddd] last:border-0"><td className="px-5 py-3"><span className="rounded bg-charcoal px-2 py-1 text-[10px] text-ash">{record.record_type}</span></td><td className="font-mono text-xs">{record.ref_id}</td><td>{record.record_title}</td><td>{record.assignee}</td><td className="font-mono text-xs">{record.due_date}</td><td><span className={`rounded-full px-2 py-1 font-mono text-[10px] ${days <= 2 ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>{days === 0 ? 'Today' : `${days}d`}</span></td></tr>
            }) : <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-ash">No records are due in the next seven days.</td></tr>}
          </tbody></table>
        </div>
      </div>

      {dashboard.usage.length > 0 && (
        <div className="mt-6 overflow-hidden border border-[#ccc] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ccc] bg-[#f3f3f3] px-5 py-4">
            <div><h3 className="font-display text-xl text-ink-text">Portal Usage by User</h3><p className="mt-1 text-xs text-ash">Last 7 days compared with the preceding 7 days; no successful login means inactive</p></div>
            <div className="flex gap-2"><span className="rounded-full border border-[#ccc] px-3 py-1 font-mono text-[10px] text-ash">{activeUsers} active</span><span className="rounded-full border border-danger/30 bg-danger/5 px-3 py-1 font-mono text-[10px] text-danger">{inactiveUsers} inactive</span></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm"><thead><tr className="border-b border-[#ccc] text-[10px] uppercase tracking-[0.16em] text-ash"><th className="px-5 py-3">User</th><th>Status</th><th>Last Login</th><th>Logins 7d</th><th>Prior 7d</th><th>Change</th><th>Page Views</th><th>Actions</th></tr></thead><tbody>
              {dashboard.usage.map(row => {
                const inactive = row.current_logins === 0
                const change = row.current_logins - row.previous_logins
                return <tr key={row.username} className={`border-b border-[#ddd] last:border-0 ${inactive ? 'bg-danger/[0.035]' : ''}`}><td className={`px-5 py-3 ${inactive ? 'border-l-2 border-l-danger' : ''}`}><strong className="text-ink-text">{row.name || row.username}</strong><div className="font-mono text-[10px] text-ash">{row.username}</div></td><td><span className={`rounded-full px-2 py-1 font-mono text-[10px] ${inactive ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>{inactive ? 'Inactive' : 'Active'}</span></td><td className="font-mono text-xs">{row.last_login?.slice(0, 16) || 'Never'}</td><td>{row.current_logins}</td><td>{row.previous_logins}</td><td className={change > 0 ? 'text-success' : change < 0 ? 'text-danger' : 'text-ash'}>{change > 0 ? '+' : ''}{change}</td><td>{row.page_views}</td><td>{row.actions}</td></tr>
              })}
            </tbody></table>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <SectionCard title="Recent Tracker Activity" action={{ href: '/tracker', label: 'View all' }}>
          <div>{dashboard.recent_tasks.length ? dashboard.recent_tasks.map(task => <Link key={task.ref_id} href={`/tracker/${task.ref_id}`} className="grid gap-2 border-b border-steel-dark/60 px-5 py-4 last:border-0 hover:bg-charcoal/60 sm:grid-cols-[120px_1fr_auto]"><span className="font-mono text-xs text-fire-orange">{task.ref_id}</span><span className="text-sm font-medium text-ink-text">{task.title}</span><span className="text-xs uppercase tracking-[0.12em] text-ash">{streamLabels[task.category]}</span></Link>) : <p className="px-5 py-12 text-center text-sm text-ash">No tracker activity yet.</p>}</div>
        </SectionCard>
        <SectionCard title="Open Work by Stream">
          <div className="mt-5 space-y-4">{(Object.entries(dashboard.task_streams) as [TaskCategory, number][]).map(([stream, count]) => <Link key={stream} href={`/tracker?stream=${stream}`} className="flex items-center justify-between border-b border-steel-dark/60 pb-3 last:border-0"><span className="text-sm text-ash">{streamLabels[stream]}</span><span className="font-display text-2xl text-ink-text">{count}</span></Link>)}<Link href="/tracker?stream=call-log" className="flex items-center justify-between border-b border-steel-dark/60 pb-3 last:border-0"><span className="text-sm text-ash">Call Log</span><span className="font-display text-2xl text-ink-text">{kpis.open_callouts}</span></Link></div>
        </SectionCard>
      </div>
      <div className="mt-6 grid gap-5 xl:grid-cols-3"><div className="xl:col-span-2"><AnomalyWidget /></div><ReportTrigger clientName="AECI Chempark" /></div>
      <div className="mt-6"><PowerBIReport surface="dashboard" /></div>
    </ReportFrame>
  )
}
