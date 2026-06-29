import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getServerAnthropicKey } from '@/lib/server-ai-key'

// Safety Co-pilot — three capabilities:
//   action=prefill   → pre-populate new file from prior submissions for same site
//   action=comment   → generate regulation-referenced remediation comment for a failing item
//   action=risk      → forward risk assessment before submission

export async function POST(req: NextRequest) {
  const apiKey = getServerAnthropicKey()
  if (!apiKey) {
    return NextResponse.json({ success: false, message: 'AI not configured — set GBL_ANTHROPIC_API_KEY or ANTHROPIC_API_KEY' }, { status: 503 })
  }

  const body = await req.json().catch(() => ({}))
  const action = body.action as string

  const client = new Anthropic({ apiKey })

  // ── Comment generation ────────────────────────────────────────────────────
  if (action === 'comment') {
    const { section, item_number, description, status, notes } = body
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `You are a South African OHS Act compliance officer writing a safety file audit comment for AECI Chempark.

Section: ${section}
Item ${item_number}: ${description}
Status: ${status}
Auditor notes: ${notes || 'none'}

Write a concise, professional remediation comment (2-3 sentences) that:
1. Names the specific deficiency with reference to the relevant OHS Act section or AECI requirement where applicable
2. States the required corrective action with a timeframe
3. Uses formal, audit-standard language

Return only the comment text, no preamble.`
      }],
    })
    const comment = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    return NextResponse.json({ success: true, comment })
  }

  // ── Risk prediction ───────────────────────────────────────────────────────
  if (action === 'risk') {
    const { items } = body as { items: { section: string; item_no: number; description: string; status: string }[] }
    if (!items?.length) return NextResponse.json({ success: true, flags: [] })

    const failing = items.filter(i => i.status === 'Not to Standard' || i.status === 'Fail')
    const pending = items.filter(i => i.status === 'Pending')

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `You are an OHS compliance risk analyst reviewing a safety file before submission for AECI Chempark, South Africa.

Failing items (${failing.length}): ${JSON.stringify(failing.slice(0, 20))}
Pending items (${pending.length}): ${JSON.stringify(pending.slice(0, 10))}

Identify up to 3 forward risks that AECI's safety department is likely to flag at inspection. Return a JSON array only — no other text:
[{ "risk": "short title", "severity": "high|medium|low", "detail": "1-2 sentences explaining the risk and suggested pre-submission action" }]`
      }],
    })
    let flags: unknown[] = []
    try {
      const text = message.content[0].type === 'text' ? message.content[0].text : '[]'
      const match = text.match(/\[[\s\S]*\]/)
      flags = match ? JSON.parse(match[0]) : []
    } catch { flags = [] }
    return NextResponse.json({ success: true, flags })
  }

  return NextResponse.json({ success: false, message: `Unknown action: ${action}` }, { status: 400 })
}
