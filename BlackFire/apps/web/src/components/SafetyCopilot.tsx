'use client'

import { useState } from 'react'

interface SafetyItem {
  id: number
  section: string
  item_number: number
  description: string
  status: string
  comment: string | null
}

interface RiskFlag { risk: string; severity: 'high' | 'medium' | 'low'; detail: string }

const SEVERITY_STYLE: Record<string, string> = {
  high:   'border-danger/40 bg-danger/5 text-danger',
  medium: 'border-warning/40 bg-warning/5 text-warning',
  low:    'border-info/40 bg-info/5 text-info',
}

export default function SafetyCopilot({ items }: { items: SafetyItem[] }) {
  const [activeItemId, setActiveItemId] = useState<number | null>(null)
  const [generatedComment, setGeneratedComment] = useState<string | null>(null)
  const [commentLoading, setCommentLoading] = useState(false)
  const [riskFlags, setRiskFlags] = useState<RiskFlag[] | null>(null)
  const [riskLoading, setRiskLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const failingItems = items.filter(i => i.status === 'Not to Standard' || i.status === 'Fail')

  async function generateComment(item: SafetyItem) {
    setActiveItemId(item.id)
    setCommentLoading(true)
    setGeneratedComment(null)
    setError(null)
    try {
      const res = await fetch('/api/ai/safety-copilot', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'comment',
          section: item.section,
          item_number: item.item_number,
          description: item.description,
          status: item.status,
          notes: item.comment,
        }),
      })
      const body = await res.json()
      if (body.success) setGeneratedComment(body.comment)
      else setError(body.message ?? 'Generation failed')
    } catch {
      setError('Could not reach AI service')
    } finally {
      setCommentLoading(false)
    }
  }

  async function assessRisk() {
    setRiskLoading(true)
    setRiskFlags(null)
    setError(null)
    try {
      const res = await fetch('/api/ai/safety-copilot', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'risk',
          items: items.map(i => ({ section: i.section, item_no: i.item_number, description: i.description, status: i.status })),
        }),
      })
      const body = await res.json()
      if (body.success) setRiskFlags(body.flags ?? [])
      else setError(body.message ?? 'Risk assessment failed')
    } catch {
      setError('Could not reach AI service')
    } finally {
      setRiskLoading(false)
    }
  }

  if (!items.length) return null

  return (
    <div className="mt-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-ink-text">AI Co-pilot</h2>
        <span className="rounded bg-flame-gold/10 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-flame-gold">Beta</span>
      </div>

      {/* Risk Assessment */}
      <div className="rounded border border-steel-dark bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium text-ink-text">Pre-submission Risk Assessment</h3>
            <p className="text-xs text-ash mt-1">{failingItems.length} items failing — AI identifies what inspectors are likely to flag</p>
          </div>
          <button
            onClick={assessRisk}
            disabled={riskLoading || failingItems.length === 0}
            className="rounded bg-fire-orange px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white disabled:opacity-40"
          >
            {riskLoading ? 'Assessing…' : 'Assess Risk'}
          </button>
        </div>
        {riskFlags && (
          riskFlags.length === 0
            ? <p className="text-sm text-success">No significant risks detected.</p>
            : <ul className="space-y-2">
              {riskFlags.map((f, i) => (
                <li key={i} className={`rounded border p-3 ${SEVERITY_STYLE[f.severity] ?? SEVERITY_STYLE.low}`}>
                  <p className="text-xs font-semibold">{f.risk}</p>
                  <p className="text-xs mt-1 opacity-80">{f.detail}</p>
                </li>
              ))}
            </ul>
        )}
      </div>

      {/* Comment Generator */}
      {failingItems.length > 0 && (
        <div className="rounded border border-steel-dark bg-white p-5 shadow-sm">
          <h3 className="font-medium text-ink-text mb-1">Remediation Comment Generator</h3>
          <p className="text-xs text-ash mb-4">Select a failing item to generate an OHS Act-referenced remediation comment</p>
          <div className="space-y-2">
            {failingItems.map(item => (
              <div key={item.id} className="rounded border border-steel-dark/60 p-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="font-mono text-[10px] text-ash">{item.section} — Item {item.item_number}</span>
                    <p className="text-sm text-ink-text mt-0.5">{item.description}</p>
                  </div>
                  <button
                    onClick={() => generateComment(item)}
                    disabled={commentLoading && activeItemId === item.id}
                    className="flex-shrink-0 rounded border border-fire-orange px-3 py-1.5 text-xs text-fire-orange hover:bg-fire-orange hover:text-white transition-colors disabled:opacity-40"
                  >
                    {commentLoading && activeItemId === item.id ? 'Writing…' : 'Generate'}
                  </button>
                </div>
                {activeItemId === item.id && generatedComment && (
                  <div className="mt-3 rounded bg-bone-paper border border-steel-dark/40 p-3 text-xs text-ink-text leading-relaxed">
                    {generatedComment}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  )
}
