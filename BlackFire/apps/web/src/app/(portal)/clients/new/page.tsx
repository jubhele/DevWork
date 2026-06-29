'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function NewClientPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    const data = new FormData(event.currentTarget)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:          data.get('name'),
          contactPerson: data.get('contact_person') || undefined,
          email:         data.get('email') || undefined,
          phone:         data.get('phone') || undefined,
          address:       data.get('address') || undefined,
        }),
      })
      const body = await res.json()
      if (!res.ok || !body.success) { setError(body.message ?? 'Could not create client.'); return }
      router.push('/clients')
      router.refresh()
    } catch {
      setError('Could not reach the portal API.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-5xl text-ink-text">New Client</h1>
      <p className="mb-8 mt-2 text-sm uppercase tracking-[0.28em] text-ash">Add a client account to the portal</p>
      <form onSubmit={submit} className="space-y-5 rounded border border-steel-dark bg-white p-6 shadow-sm">
        <label className="block text-xs uppercase tracking-[0.16em] text-ash">Company / Client Name
          <input name="name" required maxLength={255} className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
        </label>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-xs uppercase tracking-[0.16em] text-ash">Contact Person
            <input name="contact_person" maxLength={255} className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
          </label>
          <label className="block text-xs uppercase tracking-[0.16em] text-ash">Email
            <input name="email" type="email" maxLength={255} className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
          </label>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-xs uppercase tracking-[0.16em] text-ash">Phone
            <input name="phone" type="tel" maxLength={30} className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
          </label>
          <label className="block text-xs uppercase tracking-[0.16em] text-ash">Site / Location
            <input name="site" maxLength={255} className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
          </label>
        </div>
        <label className="block text-xs uppercase tracking-[0.16em] text-ash">Address
          <textarea name="address" rows={3} maxLength={500} className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
        </label>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="rounded border border-steel-dark px-4 py-2 text-xs uppercase tracking-[0.16em] text-ash">Cancel</button>
          <button disabled={saving} className="rounded bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white disabled:opacity-50">{saving ? 'Creating…' : 'Create Client'}</button>
        </div>
      </form>
    </div>
  )
}
