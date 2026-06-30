'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useUser } from '@/context/UserContext'

const STATUS_DEFINITIONS: Array<{ key: string; label: string; entity: string; colour: string }> = [
  { key: 'Open',           label: 'Open',           entity: 'Tasks, Callouts',         colour: 'bg-warning/10 text-warning' },
  { key: 'In Progress',    label: 'In Progress',    entity: 'Tasks, Callouts',         colour: 'bg-info/10 text-info' },
  { key: 'Done',           label: 'Done',           entity: 'Tasks',                   colour: 'bg-success/10 text-success' },
  { key: 'Completed',      label: 'Completed',      entity: 'Callouts',                colour: 'bg-success/10 text-success' },
  { key: 'Invoiced',       label: 'Invoiced',       entity: 'Callouts',                colour: 'bg-success/10 text-success' },
  { key: 'Cancelled',      label: 'Cancelled',      entity: 'Tasks, Callouts, Invoices', colour: 'bg-ash/10 text-ash' },
  { key: 'Draft',          label: 'Draft',          entity: 'Quotes, Invoices, Safety Files', colour: 'bg-ash/10 text-ash' },
  { key: 'Sent',           label: 'Sent',           entity: 'Quotes, Invoices',        colour: 'bg-info/10 text-info' },
  { key: 'Accepted',       label: 'Accepted',       entity: 'Quotes',                  colour: 'bg-success/10 text-success' },
  { key: 'Rejected',       label: 'Rejected',       entity: 'Quotes, Safety Files',    colour: 'bg-danger/10 text-danger' },
  { key: 'Expired',        label: 'Expired',        entity: 'Quotes',                  colour: 'bg-ash/10 text-ash' },
  { key: 'Paid',           label: 'Paid',           entity: 'Invoices',                colour: 'bg-success/10 text-success' },
  { key: 'Overdue',        label: 'Overdue',        entity: 'Invoices',                colour: 'bg-danger/10 text-danger' },
  { key: 'Submitted',      label: 'Submitted',      entity: 'Safety Files',            colour: 'bg-info/10 text-info' },
  { key: 'Approved',       label: 'Approved',       entity: 'Safety Files',            colour: 'bg-success/10 text-success' },
]

export default function StatusesPage() {
  const user = useUser()
  const [adding, setAdding] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newEntity, setNewEntity] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const roles = user ? [user.role, ...(user.roles ?? [])].map((r) => String(r).toLowerCase()) : []

  if (!user || (!roles.includes('sysadmin') && !roles.includes('admin'))) {
    return (
      <div className="mx-auto max-w-3xl rounded border border-steel-dark bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-ash">403 Access Denied</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight text-ink-text">You do not have permission to manage status values.</h1>
        <p className="mt-4 text-sm text-ash">This section is restricted to Admin and Sysadmin accounts.</p>
        <div className="mt-6">
          <Link href="/dashboard" className="rounded border border-fire-orange bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white">Go To Dashboard</Link>
        </div>
      </div>
    )
  }

  function handleAdd() {
    if (!newKey.trim()) return
    setNotice(`Status "${newKey}" queued — a schema migration is required to activate it.`)
    setAdding(false)
    setNewKey('')
    setNewEntity('')
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl tracking-tight text-ink-text">Status Values</h1>
          <p className="mt-2 text-sm uppercase tracking-[0.28em] text-ash">Status options across tasks, callouts, quotes, invoices, and safety files</p>
        </div>
        <button onClick={() => setAdding(true)} className="rounded border border-fire-orange bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
          + Add Status
        </button>
      </div>

      {notice && (
        <div className="mb-6 rounded border border-info bg-info/10 px-4 py-3 text-sm text-info">{notice}</div>
      )}

      {adding && (
        <div className="mb-6 rounded border border-steel-dark bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-display text-xl text-ink-text">New Status</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-xs uppercase tracking-[0.16em] text-ash">
              Status Label
              <input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="e.g. On Hold" className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2 text-sm text-ink-text" />
            </label>
            <label className="block text-xs uppercase tracking-[0.16em] text-ash">
              Applies To
              <input value={newEntity} onChange={e => setNewEntity(e.target.value)} placeholder="e.g. Tasks, Callouts" className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2 text-sm text-ink-text" />
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
              <th className="px-4 py-3 text-left">Badge</th>
              <th className="px-4 py-3 text-left">Used In</th>
            </tr>
          </thead>
          <tbody>
            {STATUS_DEFINITIONS.map(s => (
              <tr key={s.key + s.entity} className="border-b border-steel-dark/60 last:border-0 hover:bg-charcoal/60">
                <td className="px-4 py-3 font-mono text-xs text-fire-orange">{s.key}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${s.colour}`}>{s.label}</span>
                </td>
                <td className="px-4 py-3 text-sm text-ash">{s.entity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
