import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import type { Task, TaskCategory } from '@blackfire/types'
import { can, getServerUser } from '@/lib/auth'
import { streamLabel, visibleTrackerStreams, type TrackerStream } from '@/lib/tracker'
import { getTasks } from '@/lib/data/tasks'
import { getCallouts } from '@/lib/data/callouts'

const ACTIVE_STATUSES = ['Open', 'In Progress'] as const
const PRIORITY_RANK: Record<string, number> = { Urgent: 0, High: 1, Normal: 2, Low: 3 }

function Status({ value }: { value: string }) {
  const tone = value === 'Done' || value === 'Completed' || value === 'Invoiced'
    ? 'bg-success/10 text-success'
    : value === 'In Progress'
      ? 'bg-info/10 text-info'
      : 'bg-warning/10 text-warning'
  return <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${tone}`}>{value}</span>
}

function DateTime({ value }: { value: string | null | undefined }) {
  return <span className="whitespace-nowrap text-xs text-ash">{value ? new Date(value.replace(' ', 'T')).toLocaleString('en-ZA', { dateStyle: 'short', timeStyle: 'short' }) : 'No date'}</span>
}

function dueDate(task: Task) {
  return task.due_at ?? task.due_date ?? null
}

function todayIso() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function dueState(task: Task) {
  const value = dueDate(task)
  if (!value || !ACTIVE_STATUSES.includes(task.status as (typeof ACTIVE_STATUSES)[number])) return 'No date'
  const day = value.slice(0, 10)
  const today = todayIso()
  if (day < today) return 'Overdue'
  if (day === today) return 'Due today'
  return 'Upcoming'
}

function urgencyRank(task: Task) {
  const due = dueState(task)
  const dueRank = due === 'Overdue' ? 0 : due === 'Due today' ? 1 : due === 'Upcoming' ? 2 : 3
  return dueRank * 10 + (PRIORITY_RANK[task.priority] ?? 4)
}

function assignee(task: Task) {
  return task.assignee_name ?? task.assigned_to ?? 'Unassigned'
}

function MetricCard({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="rounded border border-steel-dark bg-white p-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ash">{label}</div>
      <div className="mt-3 font-display text-3xl leading-none text-ink-text">{value}</div>
      <div className="mt-2 text-xs text-ash">{sub}</div>
    </div>
  )
}

function TaskCard({ task }: { task: Task }) {
  const due = dueState(task)
  const dueTone = due === 'Overdue'
    ? 'bg-danger/10 text-danger'
    : due === 'Due today'
      ? 'bg-warning/10 text-warning'
      : 'bg-ash/10 text-ash'

  return (
    <Link href={`/tracker/${task.ref_id}`} className="block rounded border border-steel-dark bg-white p-4 shadow-sm hover:border-fire-orange">
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-xs text-fire-orange">{task.ref_id}</span>
        <span className={`rounded px-2 py-1 text-[10px] font-semibold uppercase ${dueTone}`}>{due}</span>
      </div>
      <div className="mt-3 font-medium leading-snug text-ink-text">{task.title}</div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-ash">
        <span>{assignee(task)}</span>
        <span>{task.priority}</span>
        <Status value={task.status} />
      </div>
      <div className="mt-2"><DateTime value={dueDate(task)} /></div>
    </Link>
  )
}

export default async function TrackerPage({
  searchParams,
}: {
  searchParams: Promise<{ stream?: string }>
}) {
  const cookieHeader = (await cookies()).toString()
  const user = await getServerUser(cookieHeader)
  if (!user) notFound()

  const streams = visibleTrackerStreams(user)
  if (!streams.length) notFound()

  const requested = (await searchParams).stream as TrackerStream | undefined
  const active = requested && streams.includes(requested) ? requested : streams[0]
  const taskStreams = streams.filter((stream): stream is Exclude<TrackerStream, 'call-log'> => stream !== 'call-log')
  const taskCategories = taskStreams as TaskCategory[]
  const tasks = active === 'call-log' ? [] : (await getTasks({ category: active as TaskCategory }).catch(() => ({ data: [] }))).data
  const summaryTasks = taskCategories.length
    ? (await getTasks({ category: taskCategories, status: [...ACTIVE_STATUSES], limit: 500 }).catch(() => ({ data: [] as Task[] }))).data
    : []
  const callouts = active === 'call-log' ? (await getCallouts().catch(() => ({ data: [] }))).data : []

  const activeTasks = summaryTasks.filter(task => ACTIVE_STATUSES.includes(task.status as (typeof ACTIVE_STATUSES)[number]))
  const currentActive = tasks.filter(task => ACTIVE_STATUSES.includes(task.status as (typeof ACTIVE_STATUSES)[number]))
  const overdue = currentActive.filter(task => dueState(task) === 'Overdue')
  const dueToday = currentActive.filter(task => dueState(task) === 'Due today')
  const urgent = currentActive.filter(task => task.priority === 'Urgent')
  const orderedTasks = [...tasks].sort((a, b) => urgencyRank(a) - urgencyRank(b))

  const assigneeRows = Object.entries(activeTasks.reduce<Record<string, number>>((acc, task) => {
    const name = assignee(task)
    acc[name] = (acc[name] ?? 0) + 1
    return acc
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxAssignee = Math.max(...assigneeRows.map(([, count]) => count), 1)

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-tight text-ink-text sm:text-5xl">Tracker</h1>
          <p className="mt-2 text-xs uppercase tracking-[0.24em] text-ash">Company workstreams and operational call log</p>
        </div>
        {active !== 'call-log' && can(user, 'task.create') && (
          <Link href={`/tracker/new?category=${active}`} className="rounded border border-fire-orange bg-fire-orange px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white">
            New Task
          </Link>
        )}
      </div>

      <nav className="flex gap-1 overflow-x-auto border-b border-steel-dark" aria-label="Tracker streams">
        {streams.map(stream => (
          <Link
            key={stream}
            href={`/tracker?stream=${stream}`}
            className={`-mb-px min-h-11 whitespace-nowrap border-b-2 px-5 py-3 text-xs uppercase tracking-[0.16em] ${stream === active ? 'border-fire-orange text-fire-orange' : 'border-transparent text-ash hover:text-ink-text'}`}
          >
            {streamLabel(stream)}
          </Link>
        ))}
      </nav>

      {active === 'call-log' ? (
        <section className="rounded border border-steel-dark bg-white p-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="border-b border-steel-dark bg-charcoal text-[11px] uppercase tracking-[0.18em] text-ash">
                <tr><th className="px-4 py-3 text-left">Job ID</th><th className="px-4 py-3 text-left">Service</th><th className="px-4 py-3 text-left">Client</th><th className="px-4 py-3 text-left">Priority</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Due</th></tr>
              </thead>
              <tbody>
                {callouts.length ? callouts.map(callout => (
                  <tr key={callout.id} className="border-b border-steel-dark/60 last:border-0 hover:bg-bone-paper">
                    <td className="px-4 py-3"><Link href={`/tracker/call-log/${callout.ref_id}`} className="font-mono text-xs text-fire-orange hover:underline">{callout.ref_id}</Link></td>
                    <td className="px-4 py-3 font-medium text-ink-text"><Link href={`/tracker/call-log/${callout.ref_id}`}>{callout.service}</Link></td>
                    <td className="px-4 py-3 text-ash">{callout.client_name}</td>
                    <td className="px-4 py-3 text-ash">{callout.priority}</td>
                    <td className="px-4 py-3"><Status value={callout.status} /></td>
                    <td className="px-4 py-3"><DateTime value={callout.due_at} /></td>
                  </tr>
                )) : <tr><td colSpan={6} className="px-4 py-14 text-center text-ash">No operational callouts found.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Stream Open" value={currentActive.length} sub={streamLabel(active)} />
            <MetricCard label="Urgent" value={urgent.length} sub="Highest priority" />
            <MetricCard label="Due / Overdue" value={dueToday.length + overdue.length} sub={`${overdue.length} overdue, ${dueToday.length} due today`} />
            <MetricCard label="All Active" value={activeTasks.length} sub="Visible workstreams" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.75fr]">
            <section className="rounded border border-steel-dark bg-white p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-display text-lg uppercase tracking-[0.14em] text-ink-text">{streamLabel(active)} Tasks</h2>
                <Link href="/ops/tasks" className="text-xs font-semibold uppercase tracking-[0.16em] text-fire-orange">Ops View</Link>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {orderedTasks.length ? orderedTasks.map((task: Task) => <TaskCard key={task.ref_id} task={task} />) : (
                  <div className="rounded border border-dashed border-steel-dark p-8 text-center text-sm text-ash md:col-span-2">No tasks in {streamLabel(active)}.</div>
                )}
              </div>
            </section>

            <section className="rounded border border-steel-dark bg-white p-4">
              <h2 className="font-display text-lg uppercase tracking-[0.14em] text-ink-text">Assignee Load</h2>
              <div className="mt-5 space-y-4">
                {assigneeRows.length ? assigneeRows.map(([name, count]) => (
                  <div key={name}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-ink-text">{name}</span>
                      <span className="text-ash">{count}</span>
                    </div>
                    <div className="h-2 rounded bg-steel-dark/25">
                      <div className="h-2 rounded bg-fire-orange" style={{ width: `${Math.max(6, Math.round((count / maxAssignee) * 100))}%` }} />
                    </div>
                  </div>
                )) : <div className="text-sm text-ash">No active assignee load.</div>}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  )
}
