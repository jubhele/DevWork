import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { getServerUser, can } from '@/lib/auth'
import { TASK_CATEGORY_LABELS } from '@/lib/tracker'
import TaskActions from './TaskActions'
import TrackerRecordPanel from '@/components/TrackerRecordPanel'
import { getTask } from '@/lib/data/tasks'

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getServerUser((await cookies()).toString())
  if (!user) notFound()

  const task = await getTask(id).catch(() => null)
  if (!task) notFound()

  return (
    <div className="max-w-5xl">
      <Link href={`/tracker?stream=${task.category}`} className="text-xs uppercase tracking-[0.18em] text-fire-orange">← {TASK_CATEGORY_LABELS[task.category]}</Link>
      <h1 className="mt-3 font-display text-5xl text-ink-text">{task.ref_id}</h1>
      <p className="mb-8 mt-2 text-lg text-ash">{task.title}</p>
      <dl className="mb-5 grid gap-5 rounded border border-steel-dark bg-white p-6 shadow-sm md:grid-cols-2">
        <div><dt className="text-xs uppercase tracking-[0.16em] text-ash">Stream</dt><dd className="mt-1 text-ink-text">{TASK_CATEGORY_LABELS[task.category]}</dd></div>
        <div><dt className="text-xs uppercase tracking-[0.16em] text-ash">Status</dt><dd className="mt-1 text-ink-text">{task.status}</dd></div>
        <div><dt className="text-xs uppercase tracking-[0.16em] text-ash">Priority</dt><dd className="mt-1 text-ink-text">{task.priority}</dd></div>
        <div><dt className="text-xs uppercase tracking-[0.16em] text-ash">Assigned to</dt><dd className="mt-1 text-ink-text">{task.assignee_name ?? task.assigned_to ?? '—'}</dd></div>
        {task.source_callout_ref && <div><dt className="text-xs uppercase tracking-[0.16em] text-ash">Original call-log ref</dt><dd className="mt-1 font-mono text-sm text-fire-orange">{task.source_callout_ref}</dd></div>}
        <div><dt className="text-xs uppercase tracking-[0.16em] text-ash">Created</dt><dd className="mt-1 text-ink-text">{new Date(task.created_at).toLocaleString('en-ZA')}</dd></div>
      </dl>
      <TaskActions task={task} canUpdate={can(user, 'task.update')} />
      <div className="mt-6">
        <TrackerRecordPanel entityType="task" entityRef={task.ref_id} createdAt={task.created_at} startAt={task.start_at} endAt={task.end_at} dueAt={task.due_at} canEdit={can(user, 'task.update')} />
      </div>
    </div>
  )
}
