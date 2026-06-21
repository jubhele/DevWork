'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import { useUser } from '@/context/UserContext'

const ROLE_DEFINITIONS: Array<{ key: string; label: string; description: string }> = [
  { key: 'sysadmin',       label: 'System Administrator', description: 'Full platform access including system settings and all admin functions.' },
  { key: 'admin',          label: 'Administrator',         description: 'Portal administration: users, roles, audit log, all modules.' },
  { key: 'manager',        label: 'Manager',               description: 'Cross-module oversight: tracker, callouts, quotes, invoices, safety.' },
  { key: 'finance',        label: 'Finance',               description: 'Finance stream, invoices, quotes, statements, and payments.' },
  { key: 'admin_clerk',    label: 'Admin Clerk',           description: 'Admin and general tracker streams, callout logging, client records.' },
  { key: 'call_logger',    label: 'Call Logger',           description: 'Callout creation and the call log stream only.' },
  { key: 'senior_tech',    label: 'Senior Technician',     description: 'Operations stream, callout updates, safety files.' },
  { key: 'junior_tech',    label: 'Junior Technician',     description: 'Operations stream and assigned callouts — read-focused.' },
  { key: 'safety_officer', label: 'Safety Officer',        description: 'Safety module full access, general tracker stream.' },
  { key: 'client_support', label: 'Client Support',        description: 'Client-facing read access: callouts, invoices, safety status.' },
  { key: 'viewer',         label: 'Viewer',                description: 'Read-only access to general tracker stream and dashboard.' },
]

export default function RolesPage() {
  const user = useUser()
  const [adding, setAdding] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [notice, setNotice] = useState<string | null>(null)

  if (!user || !['sysadmin', 'admin'].includes(user.role)) {
    notFound()
  }

  function handleAdd() {
    if (!newKey.trim() || !newLabel.trim()) return
    setNotice(`Role "${newLabel}" queued — a schema migration is required to activate it. Contact your system administrator.`)
    setAdding(false)
    setNewKey('')
    setNewLabel('')
    setNewDesc('')
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl tracking-tight text-ink-text">Roles</h1>
          <p className="mt-2 text-sm uppercase tracking-[0.28em] text-ash">Portal role definitions and access levels</p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="rounded border border-fire-orange bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white"
        >
          + Add Role
        </button>
      </div>

      {notice && (
        <div className="mb-6 rounded border border-info bg-info/10 px-4 py-3 text-sm text-info">
          {notice}
        </div>
      )}

      {adding && (
        <div className="mb-6 rounded border border-steel-dark bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-display text-xl text-ink-text">New Role</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-xs uppercase tracking-[0.16em] text-ash">
              Role Key (slug)
              <input
                value={newKey}
                onChange={e => setNewKey(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                placeholder="e.g. compliance_officer"
                className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2 text-sm text-ink-text"
              />
            </label>
            <label className="block text-xs uppercase tracking-[0.16em] text-ash">
              Display Label
              <input
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="e.g. Compliance Officer"
                className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2 text-sm text-ink-text"
              />
            </label>
          </div>
          <label className="mt-4 block text-xs uppercase tracking-[0.16em] text-ash">
            Description
            <textarea
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              rows={2}
              className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2 text-sm text-ink-text"
            />
          </label>
          <div className="mt-4 flex justify-end gap-3">
            <button onClick={() => setAdding(false)} className="rounded border border-steel-dark px-4 py-2 text-xs uppercase tracking-[0.16em] text-ash">Cancel</button>
            <button onClick={handleAdd} className="rounded bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white">Submit</button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded border border-steel-dark bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-steel-dark bg-charcoal text-[11px] uppercase tracking-[0.18em] text-ash">
              <tr>
                <th className="px-4 py-3 text-left">Role Key</th>
                <th className="px-4 py-3 text-left">Display Label</th>
                <th className="px-4 py-3 text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              {ROLE_DEFINITIONS.map(role => (
                <tr key={role.key} className="border-b border-steel-dark/60 last:border-0 hover:bg-charcoal/60">
                  <td className="px-4 py-3 font-mono text-xs text-fire-orange">{role.key}</td>
                  <td className="px-4 py-3 font-medium text-ink-text">{role.label}</td>
                  <td className="px-4 py-3 text-sm text-ash">{role.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
