import { NextRequest, NextResponse } from 'next/server'
import { getServerAnthropicKey, getServerGoogleKeys, getServerKimiKeys, getServerOpenAIKeys } from '@/lib/server-ai-key'
import { callLLMWithFallback, createRouteLogger, mapAIServiceError } from '@/lib/ai-retry-handler'

const logger = createRouteLogger('api/ai/safety-copilot')

// Safety Co-pilot — three capabilities:
//   action=prefill   → pre-populate new file from prior submissions for same site
//   action=comment   → generate regulation-referenced remediation comment for a failing item
//   action=risk      → forward risk assessment before submission

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

  const body = await req.json().catch(() => ({}))
  const action = body.action as string

  // ── Comment generation ────────────────────────────────────────────────────
  if (action === 'comment') {
    const { section, item_number, description, status, notes } = body
    try {
      const result = await callLLMWithFallback(
        anthropicKey,
        openaiKey,
        googleKey,
        kimiKey,
        [{
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
        { model: 'claude-sonnet-4-6', maxTokens: 400 },
        logger
      )
    if (!result.success) {
        const mapped = mapAIServiceError(result.error)
        return NextResponse.json({ success: false, message: mapped.message }, { status: mapped.status })
    }
    const comment = result.data?.content[0]?.text?.trim() ?? ''
    logger.log(`✓ Comment generated via ${result.providerUsed}`)
    return NextResponse.json({ success: true, comment })
    } catch (err) {
      const mapped = mapAIServiceError(err instanceof Error ? err.message : String(err))
      return NextResponse.json({ success: false, message: mapped.message }, { status: mapped.status })
    }
  }

  // ── Risk prediction ───────────────────────────────────────────────────────
  if (action === 'risk') {
    const { items } = body as { items: { section: string; item_no: number; description: string; status: string }[] }
    if (!items?.length) return NextResponse.json({ success: true, flags: [] })

    const failing = items.filter(i => i.status === 'Not to Standard' || i.status === 'Fail')
    const pending = items.filter(i => i.status === 'Pending')

    const result = await callLLMWithFallback(
      anthropicKey,
      openaiKey,
      googleKey,
      kimiKey,
      [{
        role: 'user',
        content: `You are an OHS compliance risk analyst reviewing a safety file before submission for AECI Chempark, South Africa.

Failing items (${failing.length}): ${JSON.stringify(failing.slice(0, 20))}
Pending items (${pending.length}): ${JSON.stringify(pending.slice(0, 10))}

Identify up to 3 forward risks that AECI's safety department is likely to flag at inspection. Return a JSON array only — no other text:
[{ "risk": "short title", "severity": "high|medium|low", "detail": "1-2 sentences explaining the risk and suggested pre-submission action" }]`
      }],
      { model: 'claude-sonnet-4-6', maxTokens: 600 },
      logger
    )
    if (!result.success) {
      const mapped = mapAIServiceError(result.error)
      return NextResponse.json({ success: false, message: mapped.message }, { status: mapped.status })
    }
    let flags: unknown[] = []
    try {
      const text = result.data?.content[0]?.text ?? '[]'
      const match = text.match(/\[[\s\S]*\]/)
      flags = match ? JSON.parse(match[0]) : []
    } catch { flags = [] }
    logger.log(`✓ Risk assessment via ${result.providerUsed} — found ${flags.length} risks`)
    return NextResponse.json({ success: true, flags })
  }

  return NextResponse.json({ success: false, message: `Unknown action: ${action}` }, { status: 400 })
}
