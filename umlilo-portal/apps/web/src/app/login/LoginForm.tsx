'use client'

import { Suspense, useState, useEffect, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

interface CaptchaState {
  question: string
  answer: string
}

type Panel = 'login' | 'forgot'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'

  const [panel, setPanel] = useState<Panel>('login')

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [captcha, setCaptcha] = useState<CaptchaState>({ question: '', answer: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [fpUsername, setFpUsername] = useState('')
  const [fpMsg, setFpMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [fpLoading, setFpLoading] = useState(false)

  async function fetchCaptcha() {
    try {
      const res = await fetch('/api/auth/captcha', { credentials: 'same-origin' })
      const data = await res.json()
      if (data.success && data.question) {
        setCaptcha({ question: data.question, answer: '' })
      }
    } catch {
      // silently retry on next submit
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchCaptcha()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

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

  async function handleForgot(e: FormEvent) {
    e.preventDefault()
    setFpMsg(null)
    setFpLoading(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE ?? ''}/api/auth.php?action=reset_request`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: fpUsername }),
        }
      )
      const data = await res.json()
      setFpMsg({ text: data.message ?? 'Check your email for a reset link.', ok: !!data.success })
    } catch {
      setFpMsg({ text: 'Could not reach the server. Try again.', ok: false })
    } finally {
      setFpLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <ThemeToggle />
      </div>
      {/* ── Login Panel ── */}
      {panel === 'login' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/blackfire_logo_transparent.png" alt="BlackFire Solutions" style={{ height: 74, width: 'auto' }} />
            </div>
            <div style={{ fontFamily: "'Big Shoulders Display', sans-serif", fontSize: 14, fontWeight: 900, color: 'var(--text)', letterSpacing: 2, marginTop: 8, textTransform: 'uppercase' }}>
              BlackFire Solutions
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 2, marginTop: 4, textTransform: 'uppercase' }}>
              Umlilo Portal
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 28 }}>
            {error && (
              <div style={{ background: 'rgba(192,57,43,.12)', border: '1px solid rgba(192,57,43,.3)', color: '#e05a4a', padding: '10px 14px', fontSize: 12, borderRadius: 2, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                Username
              </label>
              <input
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 12px', fontSize: 14, borderRadius: 2, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 12px', fontSize: 14, borderRadius: 2, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {captcha.question && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                  Security check: {captcha.question}
                </label>
                <input
                  type="number"
                  required
                  value={captcha.answer}
                  onChange={e => setCaptcha(c => ({ ...c, answer: e.target.value }))}
                  style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 12px', fontSize: 14, borderRadius: 2, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !captcha.question}
              style={{ width: '100%', padding: 12, background: 'var(--accent)', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', borderRadius: 2, opacity: loading || !captcha.question ? 0.5 : 1, transition: 'opacity .15s' }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: 11, color: 'var(--muted)' }}>
              <span style={{ cursor: 'pointer' }} onClick={() => { setPanel('forgot'); setFpMsg(null) }}>
                Forgot password?
              </span>
              <span style={{ color: 'var(--muted)' }}>·</span>
              <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
                Back to site
              </Link>
            </div>
          </form>
        </div>
      )}

      {/* ── Forgot Password Panel ── */}
      {panel === 'forgot' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/blackfire_logo_transparent.png" alt="BlackFire Solutions" style={{ height: 74, width: 'auto' }} />
            </div>
            <div style={{ fontFamily: "'Big Shoulders Display', sans-serif", fontSize: 14, fontWeight: 900, color: 'var(--text)', letterSpacing: 2, marginTop: 8, textTransform: 'uppercase' }}>
              Reset Password
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 2, marginTop: 4, textTransform: 'uppercase' }}>
              Umlilo Portal
            </div>
          </div>

          <form onSubmit={handleForgot} style={{ padding: 28 }}>
            {fpMsg && (
              <div style={{ background: fpMsg.ok ? 'rgba(39,174,96,.12)' : 'rgba(192,57,43,.12)', border: `1px solid ${fpMsg.ok ? 'rgba(39,174,96,.3)' : 'rgba(192,57,43,.3)'}`, color: fpMsg.ok ? '#2ecc71' : '#e05a4a', padding: '10px 14px', fontSize: 12, borderRadius: 2, marginBottom: 16 }}>
                {fpMsg.text}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                Username
              </label>
              <input
                type="text"
                required
                value={fpUsername}
                onChange={e => setFpUsername(e.target.value)}
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 12px', fontSize: 14, borderRadius: 2, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
              disabled={fpLoading}
              style={{ width: '100%', padding: 12, background: 'var(--accent)', color: '#fff', border: 'none', cursor: fpLoading ? 'not-allowed' : 'pointer', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', borderRadius: 2, opacity: fpLoading ? 0.5 : 1, transition: 'opacity .15s' }}
            >
              {fpLoading ? 'Sending…' : 'Send Reset Email'}
            </button>

            <div style={{ marginTop: 16, fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>
              <span style={{ cursor: 'pointer' }} onClick={() => setPanel('login')}>
                Back to sign in
              </span>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default function LoginFormPage() {
  return (
    <Suspense fallback={
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, width: '100%', maxWidth: 400, padding: 40, textAlign: 'center' }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'var(--muted)' }}>Loading…</span>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
