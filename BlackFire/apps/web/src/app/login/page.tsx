'use client'

import { Suspense, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ApiError, auth } from '@blackfire/api-client'

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
  const [panel, setPanel] = useState<'login' | 'forgot'>('login')

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [captchaQuestion, setCaptchaQuestion] = useState('Security check: loading...')
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fpUsername, setFpUsername] = useState('')
  const [fpLoading, setFpLoading] = useState(false)
  const [fpMsg, setFpMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const usernameRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      usernameRef.current?.focus({ preventScroll: true })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    let active = true

    auth.captcha()
      .then(res => {
        if (!active) return
        setCaptchaQuestion(res.question ?? 'Security check: 1 + 5 = ?')
      })
      .catch(() => {
        if (!active) return
        setCaptchaQuestion('Security check: 1 + 5 = ?')
      })

    return () => {
      active = false
    }
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await auth.login(username, password, captchaAnswer)
      if (res.success) {
        router.push(next)
      } else {
        setError(res.message ?? 'Login failed')
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Could not reach the server. Try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleForgot(e: FormEvent) {
    e.preventDefault()
    setFpMsg(null)
    setFpLoading(true)
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE ?? ''
      const res = await fetch(`${base}/auth.php?action=reset_request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({ username: fpUsername }),
      })
      const data = await res.json().catch(() => ({})) as { success?: boolean; message?: string }
      setFpMsg({ text: data.message ?? 'Check your email for a reset link.', ok: !!data.success })
    } catch {
      setFpMsg({ text: 'Could not reach the server. Try again.', ok: false })
    } finally {
      setFpLoading(false)
    }
  }

  return (
    <LoginShell
      form={panel === 'login' ? (
        <form onSubmit={handleSubmit} className="relative z-20 bg-navy border border-steel-dark rounded-lg p-6 space-y-4">
          <div>
            <label htmlFor="username" className="block text-xs text-ash mb-1 uppercase tracking-wider">Username</label>
            <input
              id="username"
              type="text"
              ref={usernameRef}
              autoComplete="username"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full cursor-text bg-charcoal border border-steel-dark rounded px-3 py-2 text-sm text-ink-text
                         focus:outline-none focus:border-fire-orange focus:ring-1 focus:ring-fire-orange transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs text-ash mb-1 uppercase tracking-wider">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full cursor-text bg-charcoal border border-steel-dark rounded px-3 py-2 text-sm text-ink-text
                         focus:outline-none focus:border-fire-orange focus:ring-1 focus:ring-fire-orange transition-colors"
            />
          </div>

          <div>
            <label htmlFor="captcha" className="block text-xs text-ash mb-1 uppercase tracking-wider">
              {captchaQuestion}
            </label>
            <input
              id="captcha"
              type="number"
              inputMode="numeric"
              autoComplete="off"
              required
              value={captchaAnswer}
              onChange={e => setCaptchaAnswer(e.target.value)}
              className="w-full cursor-text bg-charcoal border border-steel-dark rounded px-3 py-2 text-sm text-ink-text
                         focus:outline-none focus:border-fire-orange focus:ring-1 focus:ring-fire-orange transition-colors"
            />
          </div>

          {error && <p className="text-danger text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-fire-orange hover:bg-ember-amber disabled:opacity-50 disabled:cursor-not-allowed
                       text-coal font-display tracking-wider uppercase text-sm py-2.5 rounded transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="flex items-center justify-between text-xs text-ash pt-1">
            <button type="button" className="hover:text-ink-text" onClick={() => { setPanel('forgot'); setFpMsg(null) }}>
              Forgot password?
            </button>
            <Link href="/" className="hover:text-ink-text">Back to site</Link>
          </div>
        </form>
      ) : (
        <form onSubmit={handleForgot} className="relative z-20 bg-navy border border-steel-dark rounded-lg p-6 space-y-4">
          <div className="text-center">
            <h2 className="font-display text-xl tracking-wider uppercase text-ink-text">Reset Password</h2>
            <p className="text-ash text-xs mt-1 uppercase tracking-[0.18em]">Umlilo Portal</p>
          </div>

          {fpMsg && (
            <p className={`text-xs ${fpMsg.ok ? 'text-success' : 'text-danger'}`}>{fpMsg.text}</p>
          )}

          <div>
            <label htmlFor="fp-username" className="block text-xs text-ash mb-1 uppercase tracking-wider">Username</label>
            <input
              id="fp-username"
              type="text"
              required
              value={fpUsername}
              onChange={e => setFpUsername(e.target.value)}
              className="w-full cursor-text bg-charcoal border border-steel-dark rounded px-3 py-2 text-sm text-ink-text
                         focus:outline-none focus:border-fire-orange focus:ring-1 focus:ring-fire-orange transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={fpLoading}
            className="w-full bg-fire-orange hover:bg-ember-amber disabled:opacity-50 disabled:cursor-not-allowed
                       text-coal font-display tracking-wider uppercase text-sm py-2.5 rounded transition-colors"
          >
            {fpLoading ? 'Sending...' : 'Send Reset Email'}
          </button>

          <div className="flex items-center justify-center text-xs text-ash pt-1">
            <button type="button" className="hover:text-ink-text" onClick={() => setPanel('login')}>
              Back to sign in
            </button>
          </div>
        </form>
      )}
    />
  )
}

function LoginShell({ form }: { form?: ReactNode }) {
  return (
    <div className="min-h-screen bg-coal flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <Image src="/blackfire_logo_transparent.png" alt="BlackFire Solutions" width={220} height={74} className="h-[74px] w-auto" priority />
            </div>
          <span className="block font-display text-[28px] leading-none tracking-[0.3em] text-flame-gold uppercase">
            Umlilo Portal
          </span>
          <p className="text-ash text-sm mt-2 tracking-[0.22em] uppercase font-body">Secure Access</p>
        </div>

        {form ?? <div className="h-64 bg-navy border border-steel-dark rounded-lg" />}

        <p className="text-center text-xs text-ash mt-6">Umlilo Portal</p>
      </div>
    </div>
  )
}
