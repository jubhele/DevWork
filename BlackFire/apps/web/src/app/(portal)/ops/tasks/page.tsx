import Link from 'next/link'
import { cookies } from 'next/headers'
import { getServerUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import type { Task } from '@blackfire/types'
import { getTasks } from '@/lib/data/tasks'

const STATUS_STYLE: Record<string, string> = {
  'Open':        'bg-info/10 text-info',
  'In Progress': 'bg-warning/10 text-warning',
  'Done':        'bg-success/10 text-success',
  'Cancelled':   'bg-ash/10 text-ash',
}

export default async function OpsTasksPage() {
  const cookieHeader = (await cookies()).toString()
  const user = await getServerUser(cookieHeader)
  if (!user) redirect('/login')

  const [openResult, inProgressResult] = await Promise.all([
    getTasks({ status: 'Open', limit: 200 }).catch(() => ({ data: [] as Task[] })),
    getTasks({ status: 'In Progress', limit: 200 }).catch(() => ({ data: [] as Task[] })),
  ])

  const all = [...inProgressResult.data, ...openResult.data]
  const byStream: Record<string, Task[]> = {}
  for (const t of all) {
    const key = t.category ?? 'General'
    if (!byStream[key]) byStream[key] = []
    byStream[key].push(t)
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl tracking-tight text-ink-text">Task Planning</h1>
          <p className="mt-2 text-sm uppercase tracking-[0.28em] text-ash">Ops Hub — open & active work by stream</p>
        </div>
        <Link href="/tracker/new" className="rounded border border-fire-orange bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
          + New Task
        </Link>
      </div>

      {Object.keys(byStream).length === 0 ? (
        <div className="rounded border border-steel-dark bg-white p-16 text-center text-ash">No open tasks.</div>
      ) : (
        <div className="space-y-8">
          {Object.entries(byStream).map(([stream, tasks]) => (
            <section key={stream}>
              <h2 className="font-display text-lg uppercase tracking-widest text-ink-text mb-3 capitalize">{stream} — {tasks.length}</h2>
              <div className="overflow-x-auto rounded border border-steel-dark bg-white shadow-sm">
                <table className="w-full min-w-[980px] text-sm">
                  <thead className="border-b border-steel-dark bg-charcoal text-[11px] uppercase tracking-[0.18em] text-ash">
                    <tr>
                      <th className="px-4 py-3 text-left">Ref</th>
                      <th className="px-4 py-3 text-left">Title</th>
                      <th className="px-4 py-3 text-left">Assigned To</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(t => (
                      <tr key={t.ref_id} className="border-b border-steel-dark/60 last:border-0 hover:bg-bone-paper">
                        <td className="px-4 py-3 font-mono text-xs text-fire-orange">
                          <Link href={`/tracker/${t.ref_id}`}>{t.ref_id}</Link>
                        </td>
                        <td className="px-4 py-3 text-ink-text max-w-[260px] truncate">{t.title}</td>
                        <td className="px-4 py-3 text-ash">{t.assignee_name ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-medium uppercase ${STATUS_STYLE[t.status] ?? ''}`}>{t.status}</span>
                        </td>
                        <td className="px-4 py-3 text-ash">{t.due_at ? new Date(t.due_at).toLocaleDateString('en-ZA') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
