'use client'

import { useEffect, useState } from 'react'

interface AnomalyFlag {
  type: 'frequency' | 'cluster' | 'priority' | 'location' | 'trend'
  severity: 'info' | 'warning' | 'critical'
  title: string
  detail: string
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'border-danger/40 bg-danger/5 text-danger',
  warning:  'border-warning/40 bg-warning/5 text-warning',
  info:     'border-info/40 bg-info/5 text-info',
}

const SEVERITY_DOT: Record<string, string> = {
  critical: 'bg-danger',
  warning:  'bg-warning',
  info:     'bg-info',
}

export default function AnomalyWidget() {
  const [flags, setFlags] = useState<AnomalyFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [analysed, setAnalysed] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/ai/anomaly', { credentials: 'include' })
      .then(r => r.json())
      .then(body => {
        if (body.success) {
          setFlags(body.flags ?? [])
          setNote(body.note ?? null)
          setAnalysed(body.analysed ?? null)
        } else {
          setError(body.message ?? 'AI analysis unavailable')
        }
      })
      .catch(() => setError('Could not reach AI service'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="rounded border border-steel-dark bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-steel-dark bg-charcoal px-5 py-4">
        <div>
          <h2 className="font-display text-xl text-ink-text">AI Intelligence</h2>
          {analysed != null && <p className="text-[10px] uppercase tracking-[0.18em] text-ash mt-0.5">{analysed} callouts analysed</p>}
        </div>
        <span className="rounded bg-flame-gold/10 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-flame-gold">Beta</span>
      </div>

      <div className="p-5">
        {loading && (
          <div className="flex items-center gap-3 text-sm text-ash">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-fire-orange border-t-transparent" />
            Analysing callout patterns…
          </div>
        )}

        {!loading && error && (
          <p className="text-sm text-ash">{error}</p>
        )}

        {!loading && note && !error && (
          <p className="text-sm text-ash">{note}</p>
        )}

        {!loading && !error && flags.length === 0 && !note && (
          <p className="text-sm text-ash">No anomalies detected in recent callout data.</p>
        )}

        {!loading && flags.length > 0 && (
          <ul className="space-y-3">
            {flags.map((flag, i) => (
              <li key={i} className={`rounded border p-4 ${SEVERITY_STYLES[flag.severity] ?? SEVERITY_STYLES.info}`}>
                <div className="flex items-start gap-3">
                  <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${SEVERITY_DOT[flag.severity] ?? 'bg-info'}`} />
                  <div>
                    <p className="text-sm font-semibold">{flag.title}</p>
                    <p className="mt-1 text-xs leading-relaxed opacity-80">{flag.detail}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
