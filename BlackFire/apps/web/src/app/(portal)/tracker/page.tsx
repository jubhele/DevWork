import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Callout, Task, TaskCategory } from '@blackfire/types'
import { getCurrentUser, can } from '@/lib/server-auth'
import { streamLabel, visibleTrackerStreams, type TrackerStream } from '@/lib/tracker'
import { getTasks } from '@/lib/data/tasks'
import { getCallouts } from '@/lib/data/callouts'

function Status({ value }: { value: string }) {
  const tone = value === 'Done' || value === 'Completed' || value === 'Invoiced'
    ? 'bg-success/10 text-success'
    : value === 'In Progress'
      ? 'bg-info/10 text-info'
      : 'bg-warning/10 text-warning'
  return <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${tone}`}>{value}</span>
}

function DateTime({ value }: { value: string | null | undefined }) {
  return <span className="whitespace-nowrap text-xs text-ash">{value ? new Date(value.replace(' ', 'T')).toLocaleString('en-ZA', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</span>
}

export default async function TrackerPage({
  searchParams,
}: {
  searchParams: Promise<{ stream?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) notFound()

  const streams = visibleTrackerStreams(user)
  if (!streams.length) notFound()

  const requested = (await searchParams).stream as TrackerStream | undefined
  const active = requested && streams.includes(requested) ? requested : streams[0]
  const tasks = active === 'call-log' ? [] : (await getTasks({ category: active as TaskCategory }).catch(() => ({ data: [] }))).data
  const callouts = active === 'call-log' ? (await getCallouts().catch(() => ({ data: [] }))).data : []

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl tracking-tight text-ink-text">Tracker</h1>
          <p className="mt-2 text-sm uppercase tracking-[0.28em] text-ash">Company workstreams and operational call log</p>
        </div>
        {active !== 'call-log' && can(user, 'task.create') && (
          <Link href={`/tracker/new?category=${active}`} className="rounded border border-fire-orange bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
            + New Task
          </Link>
        )}
      </div>

      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-steel-dark" aria-label="Tracker streams">
        {streams.map(stream => (
          <Link
            key={stream}
            href={`/tracker?stream=${stream}`}
            className={`-mb-px whitespace-nowrap border-b-2 px-5 py-3 text-xs uppercase tracking-[0.2em] ${stream === active ? 'border-fire-orange text-fire-orange' : 'border-transparent text-ash hover:text-ink-text'}`}
          >
            {streamLabel(stream)}
          </Link>
        ))}
      </nav>

      <div className="overflow-hidden rounded border border-steel-dark bg-white shadow-sm">
        <div className="overflow-x-auto">
          {active === 'call-log' ? (
            <table className="w-full min-w-[1220px] text-sm">
              <thead className="border-b border-steel-dark bg-charcoal text-[11px] uppercase tracking-[0.18em] text-ash">
                <tr><th className="px-4 py-3 text-left">Job ID</th><th className="px-4 py-3 text-left">Service</th><th className="px-4 py-3 text-left">Client</th><th className="px-4 py-3 text-left">Priority</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Created</th><th className="px-4 py-3 text-left">Start</th><th className="px-4 py-3 text-left">End</th><th className="px-4 py-3 text-left">Due</th></tr>
              </thead>
              <tbody>
                {callouts.length ? callouts.map(callout => (
                  <tr key={callout.id} className="border-b border-steel-dark/60 last:border-0 hover:bg-charcoal/60">
                    <td className="px-4 py-3"><Link href={`/tracker/call-log/${callout.ref_id}`} className="font-mono text-xs text-fire-orange hover:underline">{callout.ref_id}</Link></td>
                    <td className="px-4 py-3 font-medium text-ink-text"><Link href={`/tracker/call-log/${callout.ref_id}`}>{callout.service}</Link></td>
                    <td className="px-4 py-3 text-ash">{callout.client_name}</td>
                    <td className="px-4 py-3 text-ash">{callout.priority}</td>
                    <td className="px-4 py-3"><Status value={callout.status} /></td>
                    <td className="px-4 py-3"><DateTime value={callout.created_at} /></td>
                    <td className="px-4 py-3"><DateTime value={callout.start_at} /></td>
                    <td className="px-4 py-3"><DateTime value={callout.end_at} /></td>
                    <td className="px-4 py-3"><DateTime value={callout.due_at} /></td>
                  </tr>
                )) : <tr><td colSpan={9} className="px-4 py-14 text-center text-ash">No operational callouts found.</td></tr>}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[1240px] text-sm">
              <thead className="border-b border-steel-dark bg-charcoal text-[11px] uppercase tracking-[0.18em] text-ash">
                <tr><th className="px-4 py-3 text-left">Ref</th><th className="px-4 py-3 text-left">Task</th><th className="px-4 py-3 text-left">Assigned To</th><th className="px-4 py-3 text-left">Priority</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Created</th><th className="px-4 py-3 text-left">Start</th><th className="px-4 py-3 text-left">End</th><th className="px-4 py-3 text-left">Due</th></tr>
              </thead>
              <tbody>
                {tasks.length ? tasks.map((task: Task) => (
                  <tr key={task.id} className="border-b border-steel-dark/60 last:border-0 hover:bg-charcoal/60">
                    <td className="px-4 py-3"><Link href={`/tracker/${task.ref_id}`} className="font-mono text-xs text-fire-orange hover:underline">{task.ref_id}</Link></td>
                    <td className="px-4 py-3 font-medium text-ink-text"><Link href={`/tracker/${task.ref_id}`}>{task.title}</Link></td>
                    <td className="px-4 py-3 text-ash">{task.assignee_name ?? task.assigned_to ?? '—'}</td>
                    <td className="px-4 py-3 text-ash">{task.priority}</td>
                    <td className="px-4 py-3"><Status value={task.status} /></td>
                    <td className="px-4 py-3"><DateTime value={task.created_at} /></td>
                    <td className="px-4 py-3"><DateTime value={task.start_at} /></td>
                    <td className="px-4 py-3"><DateTime value={task.end_at} /></td>
                    <td className="px-4 py-3"><DateTime value={task.due_at} /></td>
                  </tr>
                )) : <tr><td colSpan={9} className="px-4 py-14 text-center text-ash">No tasks in {streamLabel(active)}.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
