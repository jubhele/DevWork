import { NextRequest, NextResponse } from 'next/server'
import { getServerAnthropicKey, getServerGoogleKeys, getServerKimiKeys, getServerOpenAIKeys } from '@/lib/server-ai-key'
import { callLLMWithFallback, createRouteLogger, mapAIServiceError } from '@/lib/ai-retry-handler'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? (process.env.NODE_ENV === 'production' ? 'https://blackfiresolutions.co.za/api' : 'http://localhost:8080/api')
const logger = createRouteLogger('api/ai/reports')

async function fetchAll(cookieHeader: string) {
  const headers = { Cookie: cookieHeader, 'X-Requested-With': 'XMLHttpRequest' }
  const [calloutsRes, invoicesRes, safetyRes, dashboardRes] = await Promise.all([
    fetch(`${API_BASE}/callouts.php?limit=200`, { headers, cache: 'no-store' }),
    fetch(`${API_BASE}/invoices.php?limit=200`, { headers, cache: 'no-store' }),
    fetch(`${API_BASE}/safety.php?limit=10`, { headers, cache: 'no-store' }),
    fetch(`${API_BASE}/dashboard.php`, { headers, cache: 'no-store' }),
  ])
  const [callouts, invoices, safety, dashboard] = await Promise.all([
    calloutsRes.ok ? calloutsRes.json() : null,
    invoicesRes.ok ? invoicesRes.json() : null,
    safetyRes.ok ? safetyRes.json() : null,
    dashboardRes.ok ? dashboardRes.json() : null,
  ])
  return { callouts, invoices, safety, dashboard }
}

export async function POST(req: NextRequest) {
  const anthropicKey = getServerAnthropicKey() ?? process.env.GBL_ANTHROPIC_API_KEY
  const openaiKey = getServerOpenAIKeys()[0]
  const googleKey = getServerGoogleKeys()[0]
  const kimiKey = getServerKimiKeys()[0]

  if (!anthropicKey && !openaiKey && !googleKey && !kimiKey) {
    return NextResponse.json(
      { success: false, message: 'No AI providers configured — set GBL_ANTHROPIC_API_KEY, GBL_OPENAI_API_KEY, GBL_GOOGLE_AI_API_KEY, or GBL_KIMI_AI_API_KEY' },
      { status: 503 }
    )
  }

  const cookieHeader = req.headers.get('cookie') ?? ''
  const body = await req.json().catch(() => ({}))
  const client_name = (body.client_name as string) || 'AECI Chempark'
  const month = (body.month as string) || new Date().toISOString().slice(0, 7)

  const { callouts, invoices, safety, dashboard } = await fetchAll(cookieHeader)

  const kpis = dashboard?.data ?? {}
  const calloutList = (callouts?.data ?? []) as Record<string, unknown>[]
  const invoiceList = (invoices?.data ?? []) as Record<string, unknown>[]
  const safetyList = (safety?.data ?? []) as Record<string, unknown>[]

  // Build anonymised metrics — no PII in Claude prompt
  const calloutStats = {
    total: calloutList.length,
    byPriority: {
      Normal: calloutList.filter(c => c.priority === 'Normal').length,
      Urgent: calloutList.filter(c => c.priority === 'Urgent').length,
      Emergency: calloutList.filter(c => c.priority === 'Emergency').length,
    },
    byStatus: {
      Open: calloutList.filter(c => c.status === 'Open').length,
      InProgress: calloutList.filter(c => c.status === 'In Progress').length,
      Completed: calloutList.filter(c => c.status === 'Completed').length,
    },
    topServices: [...new Set(calloutList.map(c => c.service as string))].slice(0, 5),
  }

  const invoiceStats = {
    total: invoiceList.length,
    totalValue: invoiceList.reduce((s, i) => s + (Number(i.total) || 0), 0),
    paid: invoiceList.filter(i => i.status === 'Paid').length,
    overdue: invoiceList.filter(i => i.status === 'Overdue').length,
  }

  const latestSafety = safetyList[0] as Record<string, unknown> | undefined

  const result = await callLLMWithFallback(
    anthropicKey,
    openaiKey,
    googleKey,
    kimiKey,
    [{
      role: 'user',
      content: `You are a senior security analyst writing a monthly client intelligence report for BlackFire Solutions — a professional security services company operating at ${client_name} in Modderfontein, Johannesburg, South Africa.

Write a formal, factual, client-ready security intelligence report for the period ${month}. Use specific numbers from the data below. Write in a confident, professional tone — like a senior analyst who knows the site. No filler, no generic statements.

DATA:
- Callouts: ${JSON.stringify(calloutStats)}
- Financials: ${JSON.stringify(invoiceStats)} (MTD Revenue: R${kpis.mtd_revenue ?? 0})
- Safety file compliance: ${latestSafety ? `${latestSafety.score_percent}% (${latestSafety.compliance_level})` : 'No current file'}
- Active clients: ${kpis.active_clients ?? 1}
- Overdue invoices: ${kpis.overdue_invoices ?? 0}

REPORT STRUCTURE (use these exact headings):
## Executive Summary
## Operational Overview
## Incident Analysis
## Response Performance
## Safety & Compliance Status
## Financial Summary
## Risk Assessment
## Recommended Actions for ${client_name}

End with a professional closing paragraph from BlackFire Solutions leadership. Keep each section concise — this is an executive-level document.`,
    }],
    { model: 'claude-sonnet-4-6', maxTokens: 2048 },
    logger
  )

  if (!result.success) {
    logger.error(`All providers failed: ${result.error}`)
    const mapped = mapAIServiceError(result.error)
    return NextResponse.json(
      { success: false, message: mapped.message },
      { status: mapped.status }
    )
  }

  const reportText = result.data?.content[0]?.text ?? 'Report generation failed.'

  logger.log(`✓ Report generated via ${result.providerUsed} for ${client_name} (${month})`)
  return NextResponse.json({
    success: true,
    report: reportText,
    period: month,
    client: client_name,
    generated_at: new Date().toISOString(),
  })
}
