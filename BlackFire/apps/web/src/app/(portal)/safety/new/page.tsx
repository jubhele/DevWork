'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'https://blackfiresolutions.co.za/api'

export default function NewSafetyAuditPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    const data = new FormData(event.currentTarget)
    try {
      const res = await fetch(`${API_BASE}/safety.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({
          client_name: data.get('client_name'),
          site: data.get('site'),
          audit_date: data.get('audit_date'),
          auditor: data.get('auditor') || null,
          notes: data.get('notes') || null,
        }),
      })
      const body = await res.json()
      if (!res.ok || !body.success) { setError(body.message ?? 'Could not create safety audit.'); return }
      router.push('/safety')
      router.refresh()
    } catch {
      setError('Could not reach the portal API.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-5xl text-ink-text">New Safety Audit</h1>
      <p className="mb-8 mt-2 text-sm uppercase tracking-[0.28em] text-ash">Initiate a contractor safety file audit</p>
      <form onSubmit={submit} className="space-y-5 rounded border border-steel-dark bg-white p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-xs uppercase tracking-[0.16em] text-ash">Client Name
            <input name="client_name" required maxLength={255} className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
          </label>
          <label className="block text-xs uppercase tracking-[0.16em] text-ash">Site
            <input name="site" required maxLength={255} className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
          </label>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-xs uppercase tracking-[0.16em] text-ash">Audit Date
            <input name="audit_date" type="date" required className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
          </label>
          <label className="block text-xs uppercase tracking-[0.16em] text-ash">Lead Auditor (username)
            <input name="auditor" maxLength={50} className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
          </label>
        </div>
        <label className="block text-xs uppercase tracking-[0.16em] text-ash">Notes / Scope
          <textarea name="notes" rows={4} maxLength={2000} className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
        </label>
        <div className="rounded border border-flame-gold/30 bg-flame-gold/5 p-4 text-xs text-ash">
          After creation, open the audit record to complete each checklist section (A–H) and upload evidence documents.
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="rounded border border-steel-dark px-4 py-2 text-xs uppercase tracking-[0.16em] text-ash">Cancel</button>
          <button disabled={saving} className="rounded bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white disabled:opacity-50">{saving ? 'Creating…' : 'Create Audit'}</button>
        </div>
      </form>
    </div>
  )
}
