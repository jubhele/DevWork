'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { tasks as taskApi } from '@blackfire/api-client'
import type { Task, TaskAssignableUser, TaskStatus } from '@blackfire/types'

const STATUSES: TaskStatus[] = ['Open', 'In Progress', 'Done', 'Cancelled']

export default function TaskActions({ task, canUpdate }: { task: Task; canUpdate: boolean }) {
  const router = useRouter()
  const [status, setStatus] = useState(task.status)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [users, setUsers] = useState<TaskAssignableUser[]>([])
  const [selected, setSelected] = useState<string[]>(task.assignees?.map(item => item.username) ?? [])
  const [usersLoading, setUsersLoading] = useState(canUpdate)
  const [assignmentSaving, setAssignmentSaving] = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!canUpdate) return
    let active = true
    taskApi.assignableUsers()
      .then(response => {
        if (!active) return
        const available = response.success ? (response.data ?? []) : []
        setUsers(available)
        setSelected(current => {
          if (current.length || !task.assigned_to_user_id) return current
          const legacy = available.find(item => item.id === task.assigned_to_user_id)
          return legacy ? [legacy.username] : current
        })
      })
      .catch(() => active && setError('Assignable users could not be loaded.'))
      .finally(() => active && setUsersLoading(false))
    return () => { active = false }
  }, [canUpdate, task.assigned_to_user_id])

  if (!canUpdate) return null

  function update(nextStatus: TaskStatus) {
    if (nextStatus === status) return
    startTransition(async () => {
      setError(null)
      setMessage(null)
      try {
        const response = await fetch('/api/tasks', {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: JSON.stringify({ id: task.ref_id, status: nextStatus }),
        })
        const body = await response.json()
        if (!response.ok || !body.success) {
          setError(body.message ?? 'Status could not be updated.')
          return
        }
        setStatus(nextStatus)
        router.refresh()
      } catch {
        setError('Could not reach the API.')
      }
    })
  }

  async function saveAssignment() {
    if (!selected.length) {
      setError('Select at least one user.')
      return
    }
    setAssignmentSaving(true)
    setError(null)
    setMessage(null)
    try {
      const response = await taskApi.reassign(task.ref_id, selected)
      if (!response.success) {
        setError(response.message ?? 'Assignment could not be updated.')
        return
      }
      setMessage('Assigned users updated.')
      router.refresh()
    } catch {
      setError('Could not reach the API.')
    } finally {
      setAssignmentSaving(false)
    }
  }

  return (
    <div className="grid gap-6 rounded border border-steel-dark bg-white p-5 shadow-sm md:grid-cols-2">
      <div>
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-ash">Update status</p>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(item => <button key={item} disabled={pending} onClick={() => update(item)} className={`rounded border px-3 py-2 text-xs ${item === status ? 'border-fire-orange bg-fire-orange text-white' : 'border-steel-dark text-ash hover:text-ink-text'}`}>{item}</button>)}
        </div>
      </div>
      <div>
        <label htmlFor="task-assignees" className="mb-3 block text-xs uppercase tracking-[0.18em] text-ash">Reassign users</label>
        <select
          id="task-assignees"
          multiple
          disabled={usersLoading || assignmentSaving}
          value={selected}
          onChange={event => setSelected(Array.from(event.currentTarget.selectedOptions, option => option.value))}
          className="min-h-32 w-full rounded border border-steel-dark bg-white p-2 text-sm text-ink-text"
        >
          {users.map(item => <option key={item.id} value={item.username}>{item.name} ({item.username})</option>)}
        </select>
        <p className="mt-2 text-xs text-ash">Hold Ctrl or Command to select multiple users.</p>
        <button type="button" disabled={usersLoading || assignmentSaving || !selected.length} onClick={saveAssignment} className="mt-3 rounded border border-fire-orange bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white disabled:opacity-50">
          {assignmentSaving ? 'Saving...' : 'Save assignment'}
        </button>
      </div>
      {error && <p className="text-sm text-danger md:col-span-2">{error}</p>}
      {message && <p className="text-sm text-success md:col-span-2">{message}</p>}
    </div>
  )
}
