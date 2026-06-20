'use client'

import { useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { TaskCategory } from '@blackfire/types'
import { useUser } from '@/context/UserContext'
import { TASK_CATEGORY_LABELS, visibleTaskCategories } from '@/lib/tracker'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'https://blackfiresolutions.co.za/api'

export default function NewTaskPage() {
  const router = useRouter()
  const user = useUser()
  const categories = visibleTaskCategories(user)
  const requested = useSearchParams().get('category') as TaskCategory | null
  const initialCategory = requested && categories.includes(requested) ? requested : categories[0]
  const [category, setCategory] = useState<TaskCategory>(initialCategory)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    const data = new FormData(event.currentTarget)
    try {
      const response = await fetch(`${API_BASE}/tasks.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({
          category,
          title: data.get('title'),
          description: data.get('description') || null,
          priority: data.get('priority'),
          assigned_to: data.get('assigned_to') || null,
          start_at: data.get('start_at') || null,
          end_at: data.get('end_at') || null,
          due_at: data.get('due_at') || null,
        }),
      })
      const body = await response.json()
      if (!response.ok || !body.success) {
        setError(body.error ?? 'Task could not be created.')
        return
      }
      router.push(`/tracker?stream=${category}`)
      router.refresh()
    } catch {
      setError('Could not reach the portal API.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-5xl text-ink-text">New Task</h1>
      <p className="mb-8 mt-2 text-sm uppercase tracking-[0.28em] text-ash">Add work to the correct tracker stream</p>
      <form onSubmit={submit} className="space-y-5 rounded border border-steel-dark bg-white p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-xs uppercase tracking-[0.16em] text-ash">Stream
            <select value={category} onChange={event => setCategory(event.target.value as TaskCategory)} className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text">
              {categories.map(item => <option key={item} value={item}>{TASK_CATEGORY_LABELS[item]}</option>)}
            </select>
          </label>
          <label className="text-xs uppercase tracking-[0.16em] text-ash">Priority
            <select name="priority" defaultValue="Normal" className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text">
              <option>Low</option><option>Normal</option><option>High</option><option>Urgent</option>
            </select>
          </label>
        </div>
        <label className="block text-xs uppercase tracking-[0.16em] text-ash">Title
          <input name="title" required maxLength={255} className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
        </label>
        <label className="block text-xs uppercase tracking-[0.16em] text-ash">Description
          <textarea name="description" rows={5} maxLength={2000} className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
        </label>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-xs uppercase tracking-[0.16em] text-ash">Assign to username
            <input name="assigned_to" maxLength={50} className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
          </label>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <label className="text-xs uppercase tracking-[0.16em] text-ash">Start date and time<input name="start_at" type="datetime-local" className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" /></label>
          <label className="text-xs uppercase tracking-[0.16em] text-ash">End date and time<input name="end_at" type="datetime-local" className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" /></label>
          <label className="text-xs uppercase tracking-[0.16em] text-ash">Due date and time<input name="due_at" type="datetime-local" className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" /></label>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="rounded border border-steel-dark px-4 py-2 text-xs uppercase tracking-[0.16em] text-ash">Cancel</button>
          <button disabled={saving} className="rounded bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white disabled:opacity-50">{saving ? 'Creating…' : 'Create Task'}</button>
        </div>
      </form>
    </div>
  )
}
