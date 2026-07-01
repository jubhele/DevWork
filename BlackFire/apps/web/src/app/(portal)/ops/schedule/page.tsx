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

export default async function SchedulePage() {
  const cookieHeader = (await cookies()).toString()
  const user = await getServerUser(cookieHeader)
  if (!user) redirect('/login')

  const todayStr = new Date().toISOString().slice(0, 10)
  const [todayResult, upcomingResult] = await Promise.all([
    getTasks({ dueDate: todayStr, limit: 100 }).catch(() => ({ data: [] as Task[] })),
    getTasks({ status: ['Open', 'In Progress'], limit: 100 }).catch(() => ({ data: [] as Task[] })),
  ])
  const todayTasks = todayResult.data
  const upcoming  = upcomingResult.data

  const today = new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl tracking-tight text-ink-text">Ops Hub</h1>
          <p className="mt-2 text-sm uppercase tracking-[0.28em] text-ash">UMLILO Mission Control — {today}</p>
        </div>
        <Link href="/tracker/new" className="rounded border border-fire-orange bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
          + New Task
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section>
          <h2 className="font-display text-lg uppercase tracking-widest text-ink-text mb-3">Due Today — {todayTasks.length}</h2>
          {todayTasks.length ? (
            <div className="space-y-2">
              {todayTasks.map(t => (
                <Link key={t.ref_id} href={`/tracker/${t.ref_id}`} className="flex items-center justify-between rounded border border-steel-dark bg-white p-4 hover:bg-bone-paper">
                  <div>
                    <span className="font-mono text-[10px] text-fire-orange block">{t.ref_id}</span>
                    <p className="text-sm font-medium text-ink-text">{t.title}</p>
                    {t.assignee_name && <p className="text-xs text-ash">{t.assignee_name}</p>}
                  </div>
                  <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-medium uppercase ${STATUS_STYLE[t.status] ?? ''}`}>{t.status}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded border border-steel-dark bg-white p-8 text-center text-ash text-sm">No tasks due today.</div>
          )}
        </section>

        <section>
          <h2 className="font-display text-lg uppercase tracking-widest text-ink-text mb-3">Open Work — {upcoming.length}</h2>
          <div className="overflow-x-auto rounded border border-steel-dark bg-white shadow-sm">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-steel-dark bg-charcoal text-[11px] uppercase tracking-[0.18em] text-ash">
                <tr>
                  <th className="px-4 py-3 text-left">Ref</th>
                  <th className="px-4 py-3 text-left">Task</th>
                  <th className="px-4 py-3 text-left">Stream</th>
                  <th className="px-4 py-3 text-left">Due</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.length ? upcoming.slice(0, 20).map(t => (
                  <tr key={t.ref_id} className="border-b border-steel-dark/60 last:border-0 hover:bg-bone-paper">
                    <td className="px-4 py-3 font-mono text-xs text-fire-orange">
                      <Link href={`/tracker/${t.ref_id}`}>{t.ref_id}</Link>
                    </td>
                    <td className="px-4 py-3 text-ink-text max-w-[240px] truncate">{t.title}</td>
                    <td className="px-4 py-3 text-ash capitalize">{t.category}</td>
                    <td className="px-4 py-3 text-ash">{t.due_at ? new Date(t.due_at).toLocaleDateString('en-ZA') : '—'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-ash">No open tasks.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
