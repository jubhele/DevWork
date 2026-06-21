'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'https://blackfiresolutions.co.za/api'

const ROLES = [
  'admin', 'manager', 'admin_clerk', 'call_logger',
  'senior_tech', 'junior_tech', 'client_support', 'safety_officer', 'viewer',
]

export default function NewUserPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    const data = new FormData(event.currentTarget)
    const password = data.get('password') as string
    const confirm = data.get('confirm') as string
    if (password !== confirm) { setError('Passwords do not match.'); setSaving(false); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); setSaving(false); return }
    try {
      const res = await fetch(`${API_BASE}/users.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({
          username: data.get('username'),
          name: data.get('name'),
          email: data.get('email'),
          role: data.get('role'),
          password,
        }),
      })
      const body = await res.json()
      if (!res.ok || !body.success) { setError(body.message ?? 'Could not create user.'); return }
      router.push('/admin/users')
      router.refresh()
    } catch {
      setError('Could not reach the portal API.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-5xl text-ink-text">New User</h1>
      <p className="mb-8 mt-2 text-sm uppercase tracking-[0.28em] text-ash">Add a portal user account</p>
      <form onSubmit={submit} className="space-y-5 rounded border border-steel-dark bg-white p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-xs uppercase tracking-[0.16em] text-ash">Username
            <input name="username" required maxLength={50} autoComplete="off" className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
          </label>
          <label className="block text-xs uppercase tracking-[0.16em] text-ash">Full Name
            <input name="name" required maxLength={255} className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
          </label>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-xs uppercase tracking-[0.16em] text-ash">Email
            <input name="email" type="email" required maxLength={255} className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
          </label>
          <label className="block text-xs uppercase tracking-[0.16em] text-ash">Role
            <select name="role" defaultValue="viewer" className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text capitalize">
              {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
            </select>
          </label>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-xs uppercase tracking-[0.16em] text-ash">Password
            <input name="password" type={showPassword ? 'text' : 'password'} required minLength={8} autoComplete="new-password" className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
          </label>
          <label className="block text-xs uppercase tracking-[0.16em] text-ash">Confirm Password
            <input name="confirm" type={showPassword ? 'text' : 'password'} required autoComplete="new-password" className="mt-2 w-full rounded border border-steel-dark bg-white px-3 py-2.5 text-sm text-ink-text" />
          </label>
        </div>
        <label className="flex items-center gap-2 text-xs text-ash cursor-pointer select-none">
          <input type="checkbox" checked={showPassword} onChange={e => setShowPassword(e.target.checked)} className="rounded" />
          Show passwords
        </label>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="rounded border border-steel-dark px-4 py-2 text-xs uppercase tracking-[0.16em] text-ash">Cancel</button>
          <button disabled={saving} className="rounded bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white disabled:opacity-50">{saving ? 'Creating…' : 'Create User'}</button>
        </div>
      </form>
    </div>
  )
}
