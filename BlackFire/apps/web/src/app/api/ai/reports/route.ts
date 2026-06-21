import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'https://blackfiresolutions.co.za/api'

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
  const apiKey = process.env.GBL_ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ success: false, message: 'AI not configured — set GBL_ANTHROPIC_API_KEY' }, { status: 503 })
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

  const client = new Anthropic({ apiKey })

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{
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

End with a professional closing paragraph from BlackFire Solutions leadership. Keep each section concise — this is an executive-level document.`
    }],
  })

  const reportText = message.content[0].type === 'text' ? message.content[0].text : 'Report generation failed.'

  return NextResponse.json({
    success: true,
    report: reportText,
    period: month,
    client: client_name,
    generated_at: new Date().toISOString(),
  })
}
