'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useUser } from '@/context/UserContext'

const CATEGORY_DEFINITIONS: Array<{ key: string; label: string; roles: string }> = [
  { key: 'admin',      label: 'Admin',      roles: 'Sysadmin, Admin, Admin Clerk, Manager' },
  { key: 'sales',      label: 'Sales',      roles: 'Sysadmin, Admin, Manager' },
  { key: 'finance',    label: 'Finance',    roles: 'Sysadmin, Admin, Manager, Finance' },
  { key: 'operations', label: 'Operations', roles: 'Sysadmin, Admin, Manager, Senior Tech, Junior Tech, Call Logger' },
  { key: 'general',    label: 'General',    roles: 'All roles' },
]

export default function CategoriesPage() {
  const user = useUser()
  const [adding, setAdding] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const roles = user ? [user.role, ...(user.roles ?? [])].map((r) => String(r).toLowerCase()) : []

  if (!user || (!roles.includes('sysadmin') && !roles.includes('admin'))) {
    return (
      <div className="mx-auto max-w-3xl rounded border border-steel-dark bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-ash">403 Access Denied</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight text-ink-text">You do not have permission to manage task categories.</h1>
        <p className="mt-4 text-sm text-ash">This section is restricted to Admin and Sysadmin accounts.</p>
        <div className="mt-6">
          <Link href="/dashboard" className="rounded border border-fire-orange bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white">Go To Dashboard</Link>
        </div>
      </div>
    )
  }

  function handleAdd() {
    if (!newKey.trim() || !newLabel.trim()) return
    setNotice(`Category "${newLabel}" queued — a schema migration and tracker lib update are required to activate it.`)
    setAdding(false)
    setNewKey('')
    setNewLabel('')
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl tracking-tight text-ink-text">Task Categories</h1>
          <p className="mt-2 text-sm uppercase tracking-[0.28em] text-ash">Tracker stream categories and role visibility</p>
        </div>
        <button onClick={() => setAdding(true)} className="rounded border border-fire-orange bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
          + Add Category
        </button>
      </div>

      {notice && (
        <div className="mb-6 rounded border border-info bg-info/10 px-4 py-3 text-sm text-info">{notice}</div>
      )}

      {adding && (
        <div className="mb-6 rounded border border-steel-dark bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-display text-xl text-ink-text">New Category</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-xs uppercase tracking-[0.16em] text-ash">
              Category Key
              <input value={newKey} onChange={e => setNewKey(e.target.value.toLowerCase().replace(/\s+/g, '_'))} placeholder="e.g. compliance" className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2 text-sm text-ink-text" />
            </label>
            <label className="block text-xs uppercase tracking-[0.16em] text-ash">
              Display Label
              <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="e.g. Compliance" className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2 text-sm text-ink-text" />
            </label>
          </div>
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
              <th className="px-4 py-3 text-left">Label</th>
              <th className="px-4 py-3 text-left">Visible to Roles</th>
            </tr>
          </thead>
          <tbody>
            {CATEGORY_DEFINITIONS.map(c => (
              <tr key={c.key} className="border-b border-steel-dark/60 last:border-0 hover:bg-charcoal/60">
                <td className="px-4 py-3 font-mono text-xs text-fire-orange">{c.key}</td>
                <td className="px-4 py-3 font-medium text-ink-text">{c.label}</td>
                <td className="px-4 py-3 text-sm text-ash">{c.roles}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
