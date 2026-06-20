'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Metric = { label: string; value: string }
type ActivityItem = { id: string; title: string; detail: string; time: string }
type User = { name: string; role: string }

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth').then(r => r.json()),
      fetch('/api/dashboard').then(r => r.json()),
    ]).then(([auth, dash]) => {
      if (!auth.ok) {
        router.replace('/login')
        return
      }
      setUser(auth.user)
      if (dash.ok) {
        setMetrics(dash.metrics)
        setActivity(dash.activity)
      }
    }).finally(() => setLoading(false))
  }, [router])

  async function handleSignOut() {
    await fetch('/api/auth', { method: 'DELETE' })
    router.replace('/login')
  }

  if (loading) {
    return (
      <main className="auth-shell">
        <p className="mono accent" style={{ opacity: 0.6 }}>Loading…</p>
      </main>
    )
  }

  return (
    <main className="dashboard-shell">
      <div className="wrap dashboard-grid">
        <section className="panel dashboard-hero">
          <p className="mono accent">Astute Insights / Dashboard</p>
          <h1>Good {greeting()}.</h1>
          {user && (
            <p className="mono" style={{ color: 'var(--ash)', marginTop: 6 }}>
              {user.name} · {user.role}
            </p>
          )}
          <p className="lede">
            Your working surface for briefs, approvals, and reporting. Focused, readable, and always current.
          </p>
        </section>

        <section className="panel metrics-panel">
          {metrics.map(item => (
            <div key={item.label} className="metric metric-lg">
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </section>

        <section className="panel list-panel">
          <div className="section-head">
            <p className="mono accent">Recent activity</p>
            <button
              onClick={handleSignOut}
              className="btn ghost"
              style={{ padding: '8px 18px', fontSize: '11px' }}
            >
              Sign out
            </button>
          </div>
          <div className="activity-list">
            {activity.map(item => (
              <article key={item.id} className="activity-item">
                <h2>
                  {item.title}
                  <span className="mono" style={{ fontSize: '10px', color: 'var(--ash)', marginLeft: 10 }}>
                    {item.time}
                  </span>
                </h2>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
