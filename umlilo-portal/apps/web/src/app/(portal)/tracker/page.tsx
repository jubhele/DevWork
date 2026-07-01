import { cookies } from 'next/headers'
import Link from 'next/link'
import { getUserFromPortalCookie, getApiAuthHeaders, can } from '@/lib/auth'
import { CATEGORY_LABELS, visibleCategoriesForRole, STATUS_BADGE, PRIORITY_DOT } from '@/lib/tracker'
import type { Task, TaskCategory, TaskListResponse } from '@blackfire/types'

async function getTasks(
  category: TaskCategory,
  headers: Record<string, string> | null,
): Promise<Task[]> {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE
    ?? `http://localhost:${process.env.PORT ?? '3000'}/api`
  if (!headers) return []
  try {
    const res = await fetch(
      `${API_BASE}/tasks.php?category=${encodeURIComponent(category)}`,
      { headers, cache: 'no-store' },
    )
    if (!res.ok) return []
    const body = await res.json() as TaskListResponse
    return Array.isArray(body.data) ? body.data : []
  } catch {
    return []
  }
}

function formatDate(value: string | null | undefined) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.valueOf()) ? null : d.toLocaleDateString('en-ZA')
}

export default async function TrackerPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const cookieStore  = await cookies()
  const portalCookie = cookieStore.get('bf_portal')?.value
  const user         = getUserFromPortalCookie(portalCookie)
  const authHeaders  = getApiAuthHeaders(portalCookie)

  const visibleCategories = user ? visibleCategoriesForRole(user.role) : []
  const sp = await searchParams
  const activeCategory: TaskCategory =
    (visibleCategories.includes(sp.category as TaskCategory) ? sp.category as TaskCategory : null)
    ?? visibleCategories[0]
    ?? 'general'

  const tasks = activeCategory ? await getTasks(activeCategory, authHeaders) : []
  const canCreate = user ? can(user, 'task.create') : false

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl tracking-wider text-bone-paper uppercase">Work Tracker</h1>
        {canCreate && (
          <Link
            href={`/tracker/new?category=${activeCategory}`}
            className="h-9 px-4 inline-flex items-center rounded-[3px] border border-steel-dark bg-navy font-mono text-[10px] uppercase tracking-[0.16em] text-fire-orange hover:border-fire-orange transition-colors"
          >
            + New Task
          </Link>
        )}
      </div>

      {/* Category tabs */}
      {visibleCategories.length > 1 && (
        <nav className="flex gap-1 mb-6 border-b border-steel-dark" aria-label="Task categories">
          {visibleCategories.map(cat => (
            <Link
              key={cat}
              href={`/tracker?category=${cat}`}
              className={`relative px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
                cat === activeCategory
                  ? 'text-fire-orange after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-fire-orange'
                  : 'text-ash hover:text-fire-orange'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </Link>
          ))}
        </nav>
      )}

      {/* Task list */}
      {tasks.length === 0 ? (
        <p className="text-ash text-sm">No tasks in this category.</p>
      ) : (
        <div className="bg-navy border border-steel-dark rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-steel-dark text-xs text-ash uppercase tracking-wider">
                <th className="text-left px-4 py-3">Ref</th>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Priority</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Assigned</th>
                <th className="text-left px-4 py-3">Due</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, i) => (
                <tr
                  key={task.id}
                  className={`border-b border-steel-dark/50 hover:bg-charcoal transition-colors ${i % 2 === 0 ? '' : 'bg-charcoal/30'}`}
                >
                  <td className="px-4 py-3">
                    <Link href={`/tracker/${task.ref_id}`} className="text-flame-gold hover:text-fire-orange font-mono text-xs">
                      {task.ref_id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-bone-paper max-w-xs truncate">{task.title}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[task.priority] ?? 'bg-ash'}`} />
                      <span className="text-xs text-ash">{task.priority}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[task.status] ?? 'text-ash'}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ash text-xs">
                    {task.assignee_name ?? task.assigned_to ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-ash text-xs">
                    {formatDate(task.due_date) ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
