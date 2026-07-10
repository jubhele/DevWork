import Link from 'next/link'
import { cookies } from 'next/headers'
import { getServerUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import type { Task, TaskCategory } from '@blackfire/types'
import { getTasks } from '@/lib/data/tasks'

const ACTIVE_STATUSES = ['Open', 'In Progress'] as const
const STREAMS: Array<{ key: TaskCategory; label: string }> = [
  { key: 'admin', label: 'Admin' },
  { key: 'sales', label: 'Sales' },
  { key: 'general', label: 'General' },
]

const STATUS_STYLE: Record<string, string> = {
  Open: 'bg-info/10 text-info',
  'In Progress': 'bg-warning/10 text-warning',
  Done: 'bg-success/10 text-success',
  Cancelled: 'bg-ash/10 text-ash',
}

const PRIORITY_RANK: Record<string, number> = {
  Urgent: 0,
  High: 1,
  Normal: 2,
  Low: 3,
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

function formatDate(value: string | null | undefined) {
  return value ? new Date(value.replace(' ', 'T')).toLocaleDateString('en-ZA', { dateStyle: 'medium' }) : 'No date'
}

function MetricCard({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="rounded border border-steel-dark bg-white p-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ash">{label}</div>
      <div className="mt-3 font-display text-4xl leading-none text-ink-text">{value}</div>
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
    <Link href={`/tracker/${task.ref_id}`} className="block rounded border border-steel-dark bg-white p-4 shadow-sm transition hover:border-fire-orange">
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-xs text-fire-orange">{task.ref_id}</span>
        <span className={`rounded px-2 py-1 text-[10px] font-semibold uppercase ${dueTone}`}>{due}</span>
      </div>
      <div className="mt-3 font-medium leading-snug text-ink-text">{task.title}</div>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.14em] text-ash">
        <span>{assignee(task)}</span>
        <span>{task.priority}</span>
        <span className={`rounded px-2 py-0.5 ${STATUS_STYLE[task.status] ?? 'bg-ash/10 text-ash'}`}>{task.status}</span>
      </div>
      <div className="mt-2 text-xs text-ash">Due {formatDate(dueDate(task))}</div>
    </Link>
  )
}

export default async function OpsTasksPage() {
  const cookieHeader = (await cookies()).toString()
  const user = await getServerUser(cookieHeader)
  if (!user) redirect('/login')

  const results = await Promise.all(
    ACTIVE_STATUSES.map(status => getTasks({ status, limit: 300 }).catch(() => ({ data: [] as Task[] }))),
  )
  const tasks = results.flatMap(result => result.data)
  const active = tasks.filter(task => ACTIVE_STATUSES.includes(task.status as (typeof ACTIVE_STATUSES)[number]))
  const overdue = active.filter(task => dueState(task) === 'Overdue')
  const dueToday = active.filter(task => dueState(task) === 'Due today')
  const urgent = active.filter(task => task.priority === 'Urgent')
  const priorityTasks = [...active].sort((a, b) => urgencyRank(a) - urgencyRank(b)).slice(0, 8)

  const assigneeCounts = active.reduce<Record<string, number>>((acc, task) => {
    const name = assignee(task)
    acc[name] = (acc[name] ?? 0) + 1
    return acc
  }, {})
  const assigneeRows = Object.entries(assigneeCounts).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const maxAssignee = Math.max(...assigneeRows.map(([, count]) => count), 1)

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-tight text-ink-text sm:text-5xl">Operations Tasks</h1>
          <p className="mt-2 text-xs uppercase tracking-[0.24em] text-ash">Open work, assignee load, due dates</p>
        </div>
        <Link href="/tracker/new" className="rounded border border-fire-orange bg-fire-orange px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white">
          New Task
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Open Tasks" value={active.length} sub="Admin, Sales, General" />
        <MetricCard label="Urgent" value={urgent.length} sub="Highest priority active work" />
        <MetricCard label="Due / Overdue" value={dueToday.length + overdue.length} sub={`${overdue.length} overdue, ${dueToday.length} due today`} />
        <MetricCard label="Streams" value={STREAMS.filter(stream => active.some(task => task.category === stream.key)).length} sub="Streams with active work" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded border border-steel-dark bg-white p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-lg uppercase tracking-[0.14em] text-ink-text">Due / Overdue Work</h2>
            <Link href="/tracker" className="text-xs font-semibold uppercase tracking-[0.16em] text-fire-orange">Tracker</Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {priorityTasks.length ? priorityTasks.map(task => <TaskCard key={task.ref_id} task={task} />) : (
              <div className="rounded border border-dashed border-steel-dark p-8 text-center text-sm text-ash md:col-span-2">No active task pressure.</div>
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
    </div>
  )
}
