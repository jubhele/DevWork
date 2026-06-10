'use client'

import { Suspense, useState, useEffect, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { auth } from '@blackfire/api-client'


interface CaptchaState {
  question: string
  answer: string
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [captcha, setCaptcha] = useState<CaptchaState>({ question: '', answer: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function fetchCaptcha() {
    try {
      const res = await auth.captcha()
      if (res.success && res.question) {
        setCaptcha({ question: res.question, answer: '' })
      }
    } catch {
      // silently retry on next submit
    }
  }

  useEffect(() => { fetchCaptcha() }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ username, password, captcha: parseInt(captcha.answer, 10) }),
      })
      const data = await res.json()
      if (data.success) {
        router.push(next)
      } else {
        setError(data.message ?? 'Login failed')
        fetchCaptcha()
      }
    } catch {
      setError('Could not reach the server. Try again.')
      fetchCaptcha()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-navy border border-steel-dark rounded-lg p-6 space-y-4">
      <div>
        <label htmlFor="username" className="block text-xs text-ash mb-1 uppercase tracking-wider">Username</label>
        <input
          id="username"
          name="username"
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
        <label htmlFor="password" className="block text-xs text-ash mb-1 uppercase tracking-wider">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full bg-charcoal border border-steel-dark rounded px-3 py-2 text-sm text-bone-paper
                     focus:outline-none focus:border-fire-orange transition-colors"
        />
      </div>

      {captcha.question && (
        <div>
          <label htmlFor="captcha" className="block text-xs text-ash mb-1 uppercase tracking-wider">
            Security check: {captcha.question}
          </label>
          <input
            id="captcha"
            name="captcha"
            type="number"
            required
            value={captcha.answer}
            onChange={e => setCaptcha(c => ({ ...c, answer: e.target.value }))}
            className="w-full bg-charcoal border border-steel-dark rounded px-3 py-2 text-sm text-bone-paper
                       focus:outline-none focus:border-fire-orange transition-colors"
          />
        </div>
      )}

      {error && (
        <p className="text-danger text-xs">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !captcha.question}
        className="w-full bg-fire-orange hover:bg-ember-amber disabled:opacity-50 disabled:cursor-not-allowed
                   text-coal font-display tracking-wider uppercase text-sm py-2.5 rounded transition-colors"
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-coal flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="font-display text-3xl tracking-widest text-flame-gold uppercase">
            BlackFire
          </span>
          <p className="text-ash text-sm mt-1 font-body">Umlilo Portal</p>
        </div>

        <Suspense fallback={
          <div className="bg-navy border border-steel-dark rounded-lg p-6 flex items-center justify-center h-40">
            <span className="text-ash text-sm">Loading…</span>
          </div>
        }>
          <LoginForm />
        </Suspense>

        <p className="text-center text-xs text-ash mt-6">
          BlackFire Solutions · Umlilo Portal
        </p>
      </div>
    </div>
  )
}
