'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function NewCalloutPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    const data = new FormData(event.currentTarget)
    try {
      const res = await fetch('/api/callouts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({
          clientName: data.get('client_name'),
          service: data.get('service'),
          location: data.get('location'),
          priority: data.get('priority'),
          tech: data.get('assigned_to') || undefined,
          calloutDate: data.get('callout_date') || undefined,
          calloutTime: data.get('callout_time') || undefined,
          notes: data.get('notes') || undefined,
        }),
      })
      const body = await res.json()
      if (!res.ok || !body.success) { setError(body.message ?? 'Could not create callout.'); return }
      router.push('/tracker?stream=call-log')
      router.refresh()
    } catch {
      setError('Could not reach the API.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-5xl text-ink-text">New Callout</h1>
      <p className="mb-8 mt-2 text-sm uppercase tracking-[0.28em] text-ash">Log a new field service callout</p>
      <form onSubmit={submit} className="space-y-5 rounded border border-steel-dark bg-white p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-xs uppercase tracking-[0.16em] text-ash">Client / Site Name
            <input name="client_name" required maxLength={255} className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
          </label>
          <label className="block text-xs uppercase tracking-[0.16em] text-ash">Service / Job Type
            <input name="service" required maxLength={255} className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
          </label>
        </div>
        <label className="block text-xs uppercase tracking-[0.16em] text-ash">Location / Address
          <input name="location" required maxLength={500} className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
        </label>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-xs uppercase tracking-[0.16em] text-ash">Priority
            <select name="priority" defaultValue="Normal" className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text">
              <option>Normal</option><option>Urgent</option><option>Emergency</option>
            </select>
          </label>
          <label className="block text-xs uppercase tracking-[0.16em] text-ash">Assign to (username)
            <input name="assigned_to" maxLength={50} className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
          </label>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-xs uppercase tracking-[0.16em] text-ash">Callout Date
            <input name="callout_date" type="date" required className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
          </label>
          <label className="block text-xs uppercase tracking-[0.16em] text-ash">Callout Time
            <input name="callout_time" type="time" className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
          </label>
        </div>
        <label className="block text-xs uppercase tracking-[0.16em] text-ash">Notes
          <textarea name="notes" rows={4} maxLength={2000} className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
        </label>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="rounded border border-steel-dark px-4 py-2 text-xs uppercase tracking-[0.16em] text-ash">Cancel</button>
          <button disabled={saving} className="rounded bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white disabled:opacity-50">{saving ? 'Logging…' : 'Log Callout'}</button>
        </div>
      </form>
    </div>
  )
}
