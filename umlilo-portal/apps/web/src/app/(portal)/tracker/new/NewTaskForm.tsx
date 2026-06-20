'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { TaskCategory } from '@blackfire/types'

interface Props {
  visibleCategories: TaskCategory[]
  categoryLabels: Record<TaskCategory, string>
  defaultCategory: TaskCategory
}

export default function NewTaskForm({ visibleCategories, categoryLabels, defaultCategory }: Props) {
  const router           = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    category:    defaultCategory,
    title:       '',
    description: '',
    priority:    'Normal',
    assigned_to: '',
    due_date:    '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    start(async () => {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'https://blackfiresolutions.co.za/api'
        const res = await fetch(`${API_BASE}/tasks.php`, {
          method:      'POST',
          credentials: 'include',
          headers:     { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body:        JSON.stringify({
            category:    form.category,
            title:       form.title.trim(),
            description: form.description.trim() || undefined,
            priority:    form.priority,
            assigned_to: form.assigned_to.trim() || undefined,
            due_date:    form.due_date || undefined,
          }),
        })
        const body = await res.json()
        if (!res.ok || !body.success) {
          setError(body.error ?? 'Failed to create task')
          return
        }
        router.push(`/tracker?category=${form.category}`)
        router.refresh()
      } catch {
        setError('Network error — please try again')
      }
    })
  }

  const labelCls   = 'block text-xs text-ash uppercase tracking-wider mb-1'
  const inputCls   = 'w-full bg-charcoal border border-steel-dark rounded px-3 py-2 text-sm text-bone-paper placeholder-ash/50 focus:outline-none focus:border-fire-orange'
  const selectCls  = `${inputCls} appearance-none`

  return (
    <form onSubmit={handleSubmit} className="bg-navy border border-steel-dark rounded-lg p-6 space-y-5">
      {error && (
        <div className="px-3 py-2 rounded bg-danger/10 border border-danger/30 text-danger text-sm">
          {error}
        </div>
      )}

      {/* Category */}
      <div>
        <label className={labelCls}>Category</label>
        <select
          value={form.category}
          onChange={e => set('category', e.target.value)}
          className={selectCls}
          required
        >
          {visibleCategories.map(cat => (
            <option key={cat} value={cat}>{categoryLabels[cat]}</option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div>
        <label className={labelCls}>Title *</label>
        <input
          type="text"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          className={inputCls}
          placeholder="Short description of the task"
          required
          maxLength={255}
        />
      </div>

      {/* Description */}
      <div>
        <label className={labelCls}>Description</label>
        <textarea
          value={form.description}
          onChange={e => set('description', e.target.value)}
          className={`${inputCls} h-28 resize-none`}
          placeholder="Additional context or steps"
          maxLength={2000}
        />
      </div>

      {/* Priority + Due date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Priority</label>
          <select
            value={form.priority}
            onChange={e => set('priority', e.target.value)}
            className={selectCls}
          >
            <option value="Low">Low</option>
            <option value="Normal">Normal</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Due Date</label>
          <input
            type="date"
            value={form.due_date}
            onChange={e => set('due_date', e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      {/* Assign to */}
      <div>
        <label className={labelCls}>Assign To (username)</label>
        <input
          type="text"
          value={form.assigned_to}
          onChange={e => set('assigned_to', e.target.value)}
          className={inputCls}
          placeholder="e.g. j.shange"
          maxLength={50}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending || !form.title.trim()}
          className="px-5 py-2 text-sm font-medium bg-fire-orange text-coal rounded hover:bg-flame-gold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? 'Creating…' : 'Create Task'}
        </button>
        <a
          href={`/tracker?category=${form.category}`}
          className="px-4 py-2 text-sm text-ash hover:text-bone-paper transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  )
}
