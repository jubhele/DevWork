'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Task, TaskStatus } from '@blackfire/types'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'https://blackfiresolutions.co.za/api'
const STATUSES: TaskStatus[] = ['Open', 'In Progress', 'Done', 'Cancelled']

export default function TaskActions({ task, canUpdate }: { task: Task; canUpdate: boolean }) {
  const router = useRouter()
  const [status, setStatus] = useState(task.status)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  if (!canUpdate) return null

  function update(nextStatus: TaskStatus) {
    if (nextStatus === status) return
    startTransition(async () => {
      setError(null)
      try {
        const response = await fetch(`${API_BASE}/tasks.php?id=${encodeURIComponent(task.ref_id)}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: JSON.stringify({ status: nextStatus }),
        })
        const body = await response.json()
        if (!response.ok || !body.success) {
          setError(body.error ?? 'Status could not be updated.')
          return
        }
        setStatus(nextStatus)
        router.refresh()
      } catch {
        setError('Could not reach the portal API.')
      }
    })
  }

  return (
    <div className="rounded border border-steel-dark bg-white p-5 shadow-sm">
      <p className="mb-3 text-xs uppercase tracking-[0.18em] text-ash">Update status</p>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map(item => <button key={item} disabled={pending} onClick={() => update(item)} className={`rounded border px-3 py-2 text-xs ${item === status ? 'border-fire-orange bg-fire-orange text-white' : 'border-steel-dark text-ash hover:text-ink-text'}`}>{item}</button>)}
      </div>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </div>
  )
}

