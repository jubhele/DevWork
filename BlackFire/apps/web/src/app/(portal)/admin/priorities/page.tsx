'use client'

import { useState } from 'react'
import { notFound } from 'next/navigation'
import { useUser } from '@/context/UserContext'

const PRIORITY_DEFINITIONS: Array<{ key: string; label: string; usedIn: string; colour: string }> = [
  { key: 'Low',       label: 'Low',       usedIn: 'Tasks',              colour: 'bg-ash/10 text-ash' },
  { key: 'Normal',    label: 'Normal',    usedIn: 'Tasks',              colour: 'bg-info/10 text-info' },
  { key: 'High',      label: 'High',      usedIn: 'Tasks',              colour: 'bg-warning/10 text-warning' },
  { key: 'Urgent',    label: 'Urgent',    usedIn: 'Tasks, Callouts',    colour: 'bg-danger/10 text-danger' },
  { key: 'Emergency', label: 'Emergency', usedIn: 'Callouts',           colour: 'bg-fire-orange/10 text-fire-orange' },
]

export default function PrioritiesPage() {
  const user = useUser()
  const [adding, setAdding] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [notice, setNotice] = useState<string | null>(null)

  if (!user || !['sysadmin', 'admin'].includes(user.role)) notFound()

  function handleAdd() {
    if (!newKey.trim()) return
    setNotice(`Priority "${newKey}" queued — a schema migration is required to activate it.`)
    setAdding(false)
    setNewKey('')
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl tracking-tight text-ink-text">Priority Levels</h1>
          <p className="mt-2 text-sm uppercase tracking-[0.28em] text-ash">Task and callout priority options</p>
        </div>
        <button onClick={() => setAdding(true)} className="rounded border border-fire-orange bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
          + Add Priority
        </button>
      </div>

      {notice && (
        <div className="mb-6 rounded border border-info bg-info/10 px-4 py-3 text-sm text-info">{notice}</div>
      )}

      {adding && (
        <div className="mb-6 rounded border border-steel-dark bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-display text-xl text-ink-text">New Priority</h2>
          <label className="block text-xs uppercase tracking-[0.16em] text-ash">
            Label
            <input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="e.g. Critical" className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2 text-sm text-ink-text" />
          </label>
          <div className="mt-4 flex justify-end gap-3">
            <button onClick={() => setAdding(false)} className="rounded border border-steel-dark px-4 py-2 text-xs uppercase tracking-[0.16em] text-ash">Cancel</button>
            <button onClick={handleAdd} className="rounded bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white">Submit</button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded border border-steel-dark bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-steel-dark bg-charcoal text-[11px] uppercase tracking-[0.18em] text-ash">
            <tr>
              <th className="px-4 py-3 text-left">Key</th>
              <th className="px-4 py-3 text-left">Badge</th>
              <th className="px-4 py-3 text-left">Used In</th>
            </tr>
          </thead>
          <tbody>
            {PRIORITY_DEFINITIONS.map(p => (
              <tr key={p.key} className="border-b border-steel-dark/60 last:border-0 hover:bg-charcoal/60">
                <td className="px-4 py-3 font-mono text-xs text-fire-orange">{p.key}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${p.colour}`}>{p.label}</span>
                </td>
                <td className="px-4 py-3 text-sm text-ash">{p.usedIn}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
