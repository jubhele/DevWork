import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { getUserFromPortalCookie, getApiAuthHeaders, can } from '@/lib/auth'
import { CATEGORY_LABELS, PRIORITY_DOT, STATUS_BADGE } from '@/lib/tracker'
import type { Task } from '@blackfire/types'
import TaskActions from './TaskActions'

async function getTask(
  id: string,
  headers: Record<string, string> | null,
): Promise<Task | null> {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'https://blackfiresolutions.co.za/api'
  if (!headers) return null
  try {
    const res = await fetch(`${API_BASE}/tasks.php?id=${encodeURIComponent(id)}`, {
      headers,
      cache: 'no-store',
    })
    if (!res.ok) return null
    const body = await res.json()
    return body.success ? body.data : null
  } catch {
    return null
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-ash uppercase tracking-wider mb-1">{label}</dt>
      <dd className="text-sm text-bone-paper">{children}</dd>
    </div>
  )
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id }       = await params
  const cookieStore  = await cookies()
  const portalCookie = cookieStore.get('bf_portal')?.value
  const user         = getUserFromPortalCookie(portalCookie)
  const authHeaders  = getApiAuthHeaders(portalCookie)

  const task = await getTask(id, authHeaders)
  if (!task || !user) notFound()

  const canUpdate = can(user, 'task.update')
  const canDelete = can(user, 'task.delete')

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <a
            href={`/tracker?category=${task.category}`}
            className="text-xs text-ash hover:text-fire-orange uppercase tracking-wider"
          >
            ← {CATEGORY_LABELS[task.category]}
          </a>
          <h1 className="font-display text-2xl tracking-wider text-bone-paper uppercase mt-2">
            {task.ref_id}
          </h1>
          <p className="text-ash text-sm mt-1">{task.title}</p>
        </div>
        <div className="flex flex-col items-end gap-2 mt-7">
          <span className={`px-3 py-1 rounded text-xs font-medium ${STATUS_BADGE[task.status] ?? 'text-ash'}`}>
            {task.status}
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[task.priority] ?? 'bg-ash'}`} />
            <span className="text-xs text-ash">{task.priority}</span>
          </span>
        </div>
      </div>

      {/* Details card */}
      <div className="bg-navy border border-steel-dark rounded-lg p-6 mb-4">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Category">{CATEGORY_LABELS[task.category]}</Field>
          <Field label="Assigned To">{task.assignee_name ?? task.assigned_to ?? '—'}</Field>
          <Field label="Created By">{task.creator_name ?? task.created_by}</Field>
          <Field label="Created At">
            {new Date(task.created_at).toLocaleString('en-ZA')}
          </Field>
          {task.due_date && (
            <Field label="Due Date">
              {new Date(task.due_date).toLocaleDateString('en-ZA', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </Field>
          )}
          {task.completed_at && (
            <Field label="Completed At">
              {new Date(task.completed_at).toLocaleString('en-ZA')}
            </Field>
          )}
          {task.description && (
            <div className="sm:col-span-2">
              <Field label="Description">
                <p className="whitespace-pre-wrap text-ash">{task.description}</p>
              </Field>
            </div>
          )}
        </dl>
      </div>

      {/* Actions (client component — handles status update + delete) */}
      {(canUpdate || canDelete) && (
        <TaskActions
          task={task}
          canUpdate={canUpdate}
          canDelete={canDelete}
        />
      )}
    </div>
  )
}
