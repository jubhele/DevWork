'use client'

import { useEffect, useRef, useState } from 'react'
import { factories, models, service, type Report } from 'powerbi-client'
import type { PowerBISurface } from '@/lib/powerbi'

interface EmbedPayload {
  success: boolean
  data?: {
    title: string
    embedUrl: string
    reportId: string
    datasetId: string
    accessToken: string
    expiresOn: string | null
  }
  error?: string
  missing?: string[]
}

function surfaceLabel(surface: PowerBISurface) {
  return surface === 'invoices' ? 'Finance reporting' : 'Executive dashboard'
}

export default function PowerBIReport({ surface }: { surface: PowerBISurface }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const reportRef = useRef<Report | null>(null)
  const [powerBIService] = useState(() => new service.Service(factories.hpmFactory, factories.wpmpFactory, factories.routerFactory))
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshNote, setRefreshNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expiresOn, setExpiresOn] = useState<string | null>(null)

  async function handleRefresh() {
    const report = reportRef.current
    if (!report || refreshing) return
    setRefreshing(true)
    setRefreshNote(null)
    try {
      await report.refresh()
      setRefreshNote(`Refreshed ${new Date().toLocaleTimeString('en-ZA')}`)
    } catch (err: unknown) {
      const message = (err as { detailedMessage?: string })?.detailedMessage
        ?? (err instanceof Error ? err.message : 'Refresh failed — try again in 15 seconds.')
      setRefreshNote(message)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    const host = hostRef.current

    async function loadReport() {
      if (!host) return

      setLoading(true)
      setError(null)
      powerBIService.reset(host)

      const response = await fetch(`/api/powerbi/embed?surface=${surface}`, { cache: 'no-store' })
      const payload = await response.json() as EmbedPayload

      if (cancelled) return

      if (!response.ok || !payload.success || !payload.data) {
        const missing = payload.missing?.length ? ` Missing: ${payload.missing.join(', ')}.` : ''
        setError(payload.error ?? `Power BI could not be loaded.${missing}`)
        setLoading(false)
        return
      }

      if (!host) return

      setExpiresOn(payload.data.expiresOn)
      const report = powerBIService.embed(host, {
        type: 'report',
        id: payload.data.reportId,
        embedUrl: payload.data.embedUrl,
        accessToken: payload.data.accessToken,
        tokenType: models.TokenType.Embed,
        settings: {
          panes: {
            filters: { expanded: false, visible: false },
            pageNavigation: { visible: true },
          },
        },
      })

      if (!report) {
        setError('Power BI service could not be initialized.')
        setLoading(false)
        return
      }

      reportRef.current = report as Report

      report.off('loaded')
      report.on('loaded', () => {
        if (!cancelled) setLoading(false)
      })
      report.on('rendered', () => {
        if (!cancelled) setLoading(false)
      })
      report.on('error', (event) => {
        if (!cancelled) {
          const message = (event as { detail?: { message?: string } })?.detail?.message
          setError(message ?? 'Power BI rendering failed.')
          setLoading(false)
        }
      })
    }

    loadReport().catch((err: unknown) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : 'Power BI failed to load.')
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
      reportRef.current = null
      if (host) powerBIService.reset(host)
    }
  }, [powerBIService, surface])

  return (
    <section className="overflow-hidden border border-steel-dark bg-navy shadow-[0_12px_48px_rgba(10,14,25,0.28)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-steel-dark bg-charcoal px-5 py-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-ash">Power BI Embedded</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-bone-paper">{surfaceLabel(surface)}</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">Session protected</p>
            <p className="mt-1 text-xs text-steel">{refreshNote ?? 'Portal auth controls access'}</p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || refreshing || !!error}
            className="border border-fire-orange px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-fire-orange transition hover:bg-fire-orange hover:text-navy disabled:cursor-not-allowed disabled:opacity-40"
          >
            {refreshing ? 'Refreshing…' : '⟳ Refresh'}
          </button>
        </div>
      </div>

      <div className="relative min-h-[72vh] bg-[#0f1520]">
        <div ref={hostRef} className="absolute inset-0" />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0f1520]/90">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-fire-orange border-t-transparent" />
              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-ash">Loading report</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0f1520]/95 px-6 text-center">
            <div className="max-w-xl border border-ember-red/50 bg-navy px-6 py-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ember-red">Power BI unavailable</p>
              <p className="mt-3 text-sm text-bone-paper">{error}</p>
              {expiresOn && (
                <p className="mt-3 text-xs text-ash">Token expiry: {new Date(expiresOn).toLocaleString('en-ZA')}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
