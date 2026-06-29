import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Callout } from '@blackfire/types'
import { getCurrentUser, can } from '@/lib/server-auth'
import TrackerRecordPanel from '@/components/TrackerRecordPanel'
import { getCallout } from '@/lib/data/callouts'

export default async function CallLogRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) notFound()

  const callout = await getCallout(isNaN(Number(id)) ? 0 : Number(id)).catch(() => null)
  if (!callout) notFound()

  return (
    <div className="max-w-5xl">
      <Link href="/tracker?stream=call-log" className="text-xs uppercase tracking-[0.18em] text-fire-orange">← Call Log</Link>
      <h1 className="mt-3 font-display text-5xl text-ink-text">{callout.ref_id}</h1>
      <p className="mb-8 mt-2 text-lg text-ash">{callout.service}</p>
      <dl className="mb-6 grid gap-5 rounded border border-steel-dark bg-white p-6 shadow-sm md:grid-cols-2 lg:grid-cols-4">
        <div><dt className="text-xs uppercase tracking-[0.16em] text-ash">Client</dt><dd className="mt-1 text-ink-text">{callout.client_name}</dd></div>
        <div><dt className="text-xs uppercase tracking-[0.16em] text-ash">Status</dt><dd className="mt-1 text-ink-text">{callout.status}</dd></div>
        <div><dt className="text-xs uppercase tracking-[0.16em] text-ash">Priority</dt><dd className="mt-1 text-ink-text">{callout.priority}</dd></div>
        <div><dt className="text-xs uppercase tracking-[0.16em] text-ash">Assigned to</dt><dd className="mt-1 text-ink-text">{callout.assigned_to ?? '—'}</dd></div>
      </dl>
      <TrackerRecordPanel entityType="callout" entityRef={callout.ref_id} createdAt={callout.created_at} startAt={callout.start_at} endAt={callout.end_at} dueAt={callout.due_at} canEdit={can(user, 'callout.update')} />
    </div>
  )
}
