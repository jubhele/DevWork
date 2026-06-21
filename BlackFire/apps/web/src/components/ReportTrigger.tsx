'use client'

import { useState } from 'react'

export default function ReportTrigger({ clientName }: { clientName: string }) {
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const month = new Date().toISOString().slice(0, 7)

  async function generate() {
    setLoading(true)
    setError(null)
    setReport(null)
    try {
      const res = await fetch('/api/ai/reports', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_name: clientName, month }),
      })
      const body = await res.json()
      if (!res.ok || !body.success) { setError(body.message ?? 'Generation failed'); return }
      setReport(body.report)
    } catch {
      setError('Could not reach AI service')
    } finally {
      setLoading(false)
    }
  }

  function download() {
    if (!report) return
    const blob = new Blob([report], { type: 'text/markdown' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `BlackFire_Intelligence_${clientName.replace(/\s+/g, '_')}_${month}.md`
    a.click()
  }

  return (
    <section className="rounded border border-steel-dark bg-white shadow-sm">
      <div className="border-b border-steel-dark bg-charcoal px-5 py-4">
        <h2 className="font-display text-xl text-ink-text">Client Intelligence Report</h2>
        <p className="text-[10px] uppercase tracking-[0.18em] text-ash mt-0.5">{clientName} — {month}</p>
      </div>
      <div className="p-5">
        {!report && !loading && (
          <>
            <p className="mb-4 text-sm text-ash leading-relaxed">Generate a monthly security intelligence report for {clientName}. The AI analyses callout patterns, response metrics, safety compliance, and financials to produce an executive-ready document.</p>
            <button
              onClick={generate}
              className="rounded bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white"
            >
              Generate Report
            </button>
          </>
        )}

        {loading && (
          <div className="flex items-center gap-3 text-sm text-ash">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-fire-orange border-t-transparent" />
            Generating intelligence report…
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        {report && (
          <div className="space-y-4">
            <div className="max-h-64 overflow-y-auto rounded border border-steel-dark bg-bone-paper p-4 text-xs text-ink-text leading-relaxed whitespace-pre-wrap font-mono">
              {report.slice(0, 1200)}{report.length > 1200 ? '\n\n[…truncated for preview]' : ''}
            </div>
            <div className="flex gap-2">
              <button onClick={download} className="rounded bg-fire-orange px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white">Download .md</button>
              <button onClick={() => setReport(null)} className="rounded border border-steel-dark px-4 py-2 text-xs uppercase tracking-[0.16em] text-ash">Regenerate</button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
