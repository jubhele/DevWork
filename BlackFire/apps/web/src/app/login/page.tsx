'use client'

import { Suspense, useState, type FormEvent, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { auth } from '@blackfire/api-client'

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await auth.login(username, password)
      if (res.success) {
        router.push(next)
      } else {
        setError(res.message ?? 'Login failed')
      }
    } catch {
      setError('Could not reach the server. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <LoginShell
      form={
        <form onSubmit={handleSubmit} className="bg-navy border border-steel-dark rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-xs text-ash mb-1 uppercase tracking-wider">Username</label>
            <input
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-charcoal border border-steel-dark rounded px-3 py-2 text-sm text-bone-paper
                         focus:outline-none focus:border-fire-orange transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-ash mb-1 uppercase tracking-wider">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-charcoal border border-steel-dark rounded px-3 py-2 text-sm text-bone-paper
                         focus:outline-none focus:border-fire-orange transition-colors"
            />
          </div>

          {error && (
            <p className="text-danger text-xs">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-fire-orange hover:bg-ember-amber disabled:opacity-50 disabled:cursor-not-allowed
                       text-coal font-display tracking-wider uppercase text-sm py-2.5 rounded transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      }
    />
  )
}

function LoginShell({ form }: { form?: ReactNode }) {
  return (
    <div className="min-h-screen bg-coal flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="font-display text-3xl tracking-widest text-flame-gold uppercase">
            BlackFire
          </span>
          <p className="text-ash text-sm mt-1 font-body">Umlilo Portal</p>
        </div>

        {form ?? <div className="h-64 bg-navy border border-steel-dark rounded-lg" />}

        <p className="text-center text-xs text-ash mt-6">
          BlackFire Solutions - Umlilo Portal
        </p>
      </div>
    </div>
  )
}
