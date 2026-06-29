import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getServerAnthropicKey } from '@/lib/server-ai-key'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'https://blackfiresolutions.co.za/api'

// Fetch the last 90 days of callouts from the PHP API using the request's session cookie
async function fetchCallouts(cookieHeader: string) {
  const res = await fetch(`${API_BASE}/callouts.php?limit=500`, {
    headers: { Cookie: cookieHeader, 'X-Requested-With': 'XMLHttpRequest' },
    cache: 'no-store',
  })
  if (!res.ok) return []
  const body = await res.json()
  return body.success ? (body.data ?? []) : []
}

export async function GET(req: NextRequest) {
  const apiKey = getServerAnthropicKey()
  if (!apiKey) {
    return NextResponse.json({ success: false, message: 'AI not configured — set GBL_ANTHROPIC_API_KEY or ANTHROPIC_API_KEY' }, { status: 503 })
  }

  const cookieHeader = req.headers.get('cookie') ?? ''
  let callouts: Record<string, unknown>[]
  try {
    callouts = await fetchCallouts(cookieHeader)
  } catch {
    return NextResponse.json({ success: false, message: 'Could not fetch callout data' }, { status: 502 })
  }

  if (callouts.length < 5) {
    return NextResponse.json({ success: true, flags: [], note: 'Insufficient data for pattern analysis (need at least 5 callouts)' })
  }

  // Build a compact statistical summary for Claude — avoid sending PII
  const summary = callouts.map(c => ({
    date: c.callout_date,
    priority: c.priority,
    status: c.status,
    service: c.service,
    location: c.location,
  }))

  const client = new Anthropic({ apiKey })

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a security operations analyst reviewing field service callout data for BlackFire Solutions, a security company at AECI Chempark, South Africa.

Analyse the following callout history (most recent first) and identify up to 4 statistically notable patterns, anomalies, or operational risks. Focus on: unusual frequency spikes, recurring incident clusters, response time trends (based on status transitions), priority distribution shifts, and location concentration.

Return ONLY a JSON array. Each item must have exactly these fields:
- "type": one of "frequency" | "cluster" | "priority" | "location" | "trend"
- "severity": one of "info" | "warning" | "critical"
- "title": short summary (max 80 chars)
- "detail": 1-2 sentence operational finding with specific numbers where possible

If no noteworthy patterns exist, return an empty array [].

Callout data (${callouts.length} records):
${JSON.stringify(summary, null, 2)}`
    }],
  })

  let flags: unknown[] = []
  try {
    const text = message.content[0].type === 'text' ? message.content[0].text : '[]'
    const match = text.match(/\[[\s\S]*\]/)
    flags = match ? JSON.parse(match[0]) : []
  } catch {
    flags = []
  }

  return NextResponse.json({ success: true, flags, analysed: callouts.length })
}
