'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Task, TaskStatus } from '@blackfire/types'

const STATUSES: TaskStatus[] = ['Open', 'In Progress', 'Done', 'Cancelled']

interface Props {
  task: Task
  canUpdate: boolean
  canDelete: boolean
}

export default function TaskActions({ task, canUpdate, canDelete }: Props) {
  const router              = useRouter()
  const [pending, start]    = useTransition()
  const [error, setError]   = useState<string | null>(null)
  const [status, setStatus] = useState<TaskStatus>(task.status)

  async function updateStatus(newStatus: TaskStatus) {
    if (newStatus === status) return
    setError(null)
    start(async () => {
      try {
        const res = await fetch(`/api/tasks.php?id=${encodeURIComponent(task.ref_id)}`, {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ status: newStatus }),
        })
        const body = await res.json()
        if (!res.ok || !body.success) {
          setError(body.error ?? 'Update failed')
          return
        }
        setStatus(newStatus)
        router.refresh()
      } catch {
        setError('Network error')
      }
    })
  }

  async function deleteTask() {
    if (!confirm(`Delete task ${task.ref_id}? This cannot be undone.`)) return
    setError(null)
    start(async () => {
      try {
        const res = await fetch(`/api/tasks.php?id=${encodeURIComponent(task.ref_id)}`, {
          method: 'DELETE',
        })
        const body = await res.json()
        if (!res.ok || !body.success) {
          setError(body.error ?? 'Delete failed')
          return
        }
        router.push(`/tracker?category=${task.category}`)
        router.refresh()
      } catch {
        setError('Network error')
      }
    })
  }

  return (
    <div className="bg-navy border border-steel-dark rounded-lg p-4 flex flex-wrap items-center gap-3">
      {error && (
        <span className="text-danger text-xs w-full">{error}</span>
      )}

      {canUpdate && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-ash uppercase tracking-wider">Status:</span>
          <div className="flex gap-1">
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                disabled={pending}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  s === status
                    ? 'bg-fire-orange text-coal'
                    : 'bg-charcoal text-ash hover:text-bone-paper hover:bg-steel-dark'
                } disabled:opacity-50`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {canUpdate && (
        <a
          href={`/tracker/${task.ref_id}/edit`}
          className="ml-auto px-3 py-1 rounded text-xs font-medium bg-charcoal text-ash hover:text-bone-paper hover:bg-steel-dark transition-colors"
        >
          Edit
        </a>
      )}

      {canDelete && (
        <button
          onClick={deleteTask}
          disabled={pending}
          className="px-3 py-1 rounded text-xs font-medium text-danger hover:bg-danger/10 border border-danger/30 transition-colors disabled:opacity-50"
        >
          Delete
        </button>
      )}
    </div>
  )
}
