# AI API Keys & Cross-Provider Fallback

This document explains how the BlackFire Portal manages AI provider credentials and implements intelligent fallback between multiple LLM providers.

## Overview

The portal supports **three LLM providers** with automatic **cascading fallback**:
1. **Anthropic Claude** (primary)
2. **OpenAI GPT** (secondary)
3. **Google Gemini** (tertiary)

When Claude is unavailable or fails (rate limit, auth error, timeout), the system automatically falls back to OpenAI. If OpenAI also fails, it tries Google. If all providers fail, the API returns HTTP 503 Service Unavailable.

This ensures **high availability** and prevents single-provider outages from taking down the portal.

## Configuration

All API keys are stored as environment variables in `.env` (workspace root) and `.env` (app-level). Never commit `.env` to version control.

### Required Environment Variables

Create or edit `.env` in your workspace root (`c:\DevWork\.env`):

```env
# Anthropic Claude (Primary LLM Provider)
GBL_ANTHROPIC_API_KEY=sk-ant-xxx

# OpenAI (Secondary LLM Provider)
GBL_OPENAI_API_KEY=sk-xxx

# Google Gemini (Tertiary LLM Provider)
GBL_GOOGLE_AI_API_KEY=AIzaSyxxx
```

Each provider needs **only one primary key**. The system manages fallback automatically — you do not need multiple keys per provider.

**Why only one key per provider?**
- Each provider has a single quota pool per account.
- Multiple keys from the same account don't create redundancy.
- The fallback mechanism is designed for **cross-provider** switching, not key-per-provider redundancy.

### Optional: App-Level Overrides

If you want provider-specific keys for the web app only, set these in `apps/web/.env`:

```env
GBL_ANTHROPIC_API_KEY=sk-ant-yyy
GBL_OPENAI_API_KEY=sk-yyy
GBL_GOOGLE_AI_API_KEY=AIzaSyyyy
```

App-level vars take precedence over workspace root vars.

## How Fallback Works

### Architecture

All AI calls go through a unified handler (`ai-retry-handler.ts`):

```typescript
const result = await callLLMWithFallback(
  anthropicKey,
  openaiKey,
  googleKey,
  messages,
  { model: 'claude-sonnet-4-6', maxTokens: 1024 },
  logger
)
```

The handler tries providers **in order**:

1. **Anthropic Claude** — primary choice (most capable, best instruction-following)
   - Model: `claude-sonnet-4-6` or `claude-haiku-4-5-20251001` (depending on route)
   - Success: returns immediately ✓
   - Failure: logs attempt, waits 100ms, tries OpenAI

2. **OpenAI GPT-4o** — secondary choice (if Claude unavailable)
   - Model: `gpt-4o`
   - Success: returns, logs provider used
   - Failure: logs attempt, waits 100ms, tries Google

3. **Google Gemini** — tertiary choice (if both above failed)
   - Model: `gemini-2-5-pro`
   - Success: returns, logs provider used
   - Failure: returns HTTP 503 with `"All providers exhausted"`

### Response Normalization

Each provider returns different response structures. The handler normalizes all responses to:

```typescript
{
  success: true,
  data: {
    content: [{ type: 'text', text: '...' }]
  },
  providerUsed: 'anthropic' | 'openai' | 'google',
  totalProvidersAttempted: number
}
```

Routes extract the text via: `result.data.content[0].text`

## Routes Using Cross-Provider Fallback

### 1. **`/api/ai/anomaly`** — Callout Pattern Analysis
- **Purpose**: Detect operational anomalies in callout history
- **Primary model**: `claude-sonnet-4-6`
- **Max tokens**: 1024
- **Example log**: `✓ Analysis complete via openai. Found 2 anomalies in 47 records.`

### 2. **`/api/ai/reports`** — Monthly Security Intelligence Reports
- **Purpose**: Generate executive reports with KPIs and recommendations
- **Primary model**: `claude-sonnet-4-6`
- **Max tokens**: 2048
- **Example log**: `✓ Report generated via anthropic for AECI Chempark (2026-01)`

### 3. **`/api/ai/safety-copilot`** — OHS Compliance Support
- **Purpose**: Two capabilities:
  - `action=comment` — Generate regulation-referenced remediation comments
  - `action=risk` — Predict forward risks in safety files
- **Primary model**: `claude-sonnet-4-6`
- **Max tokens**: 400 (comment) / 600 (risk)
- **Example log**: `✓ Risk assessment via google — found 2 risks`

### 4. **`/api/ai/voice-to-callout`** — Audio Transcription + Field Extraction
- **Purpose**: Transcribe field officer voice notes → structured callout data
- **Step 1**: OpenAI Whisper (no fallback — Whisper is OpenAI-only for now)
- **Step 2**: Claude extraction with full fallback
- **Model (extraction)**: `claude-haiku-4-5-20251001` (lightweight extraction model)
- **Max tokens (extraction)**: 512
- **Example log**: `[Whisper] ✓ Transcription complete (342 chars)` → `✓ Callout extraction complete via anthropic`

## Error Handling

### When All Providers Fail

Routes return **HTTP 503 Service Unavailable** with:

```json
{
  "success": false,
  "message": "AI service unavailable after 3 attempts"
}
```

### Specific Provider Errors

| Error | Cause | Fallback Behavior |
|-------|-------|-------------------|
| Invalid API key | Auth failure | Try next provider |
| Rate limit exceeded | Quota hit | Try next provider |
| Timeout (>30s) | Network/processing | Try next provider (with 100ms delay) |
| Model not available | Billing issue | Try next provider |

### Logging

Each attempt is logged with provider name and attempt number:

```
[api/ai/anomaly] [attempt 1/3] Trying anthropic...
[api/ai/anomaly] ✗ anthropic failed: 401 auth error — retrying...
[api/ai/anomaly] [attempt 2/3] Trying openai...
[api/ai/anomaly] ✓ openai success
[api/ai/anomaly] ✓ Analysis complete via openai. Found 2 anomalies.
```

See the route logger via `createRouteLogger('api/ai/anomaly')`.

## Troubleshooting

### Q: Why is my request still timing out if fallback is enabled?
**A**: Each provider attempt has a 30-second timeout. If all three providers timeout or fail, the request fails after ~90 seconds. This is intentional to prevent hanging requests. Check:
- Network connectivity to api.anthropic.com, api.openai.com, generativelanguage.googleapis.com
- That at least one provider key is valid (test via curl or Postman)

### Q: How do I know which provider was used?
**A**: Check the route logger output. Example:
```
✓ Report generated via anthropic for AECI Chempark
✓ Risk assessment via google — found 2 risks
✓ Analysis complete via openai
```

The response JSON also includes `"providerUsed"` in debug mode (to be added to response body if needed).

### Q: What if I only have one API key?
**A**: The fallback system still works — whichever provider you configure will be the only one tried. No fallback occurs, but the code handles it gracefully (returns 503 if the single provider fails).

### Q: Can I prioritize Google over OpenAI?
**A**: Not currently. The cascade order is hard-coded: `Anthropic → OpenAI → Google`. This reflects capability ranking and cost optimization (Anthropic best for instructions, Google cheapest). To change this, edit `ai-retry-handler.ts` function `callLLMWithFallback()` and reorder the provider calls.

### Q: Do I need separate keys for each route?
**A**: No. All routes share the same three provider keys from environment variables. Routes don't know or care which provider handles their request.

## Cost Considerations

**Fallback has a cost trade-off:**
- If Anthropic fails and you fallback to OpenAI or Google, you pay for both the failed attempt AND the successful attempt.
- In practice, this is rare (<1% of requests under normal conditions).
- For high-volume deployments, consider monitoring fallback rates and investigating root causes.

**Model costs (as of Q2 2026):**
| Provider | Model | Cost (1K tokens) |
|----------|-------|-----------------|
| Anthropic | claude-sonnet-4-6 | $3/$15 (in/out) |
| OpenAI | gpt-4o | $5/$15 (in/out) |
| Google | gemini-2-5-pro | $1.25/$5 (in/out) |

## Implementation Details

### Key Reading

`server-ai-key.ts` reads environment variables in this order:
1. Process environment (`process.env.GBL_*`)
2. Workspace `.env` (parsed from file)
3. Returns deduplicated array

### Route Integration

Each route calls:
```typescript
const anthropicKey = getServerAnthropicKey() ?? process.env.GBL_ANTHROPIC_API_KEY
const openaiKey = process.env.GBL_OPENAI_API_KEY
const googleKey = process.env.GBL_GOOGLE_AI_API_KEY

if (!anthropicKey && !openaiKey && !googleKey) {
  // Return 503 — no providers configured
}

const result = await callLLMWithFallback(
  anthropicKey,
  openaiKey,
  googleKey,
  messages,
  options,
  logger
)
```

### Adding a New Route

1. Create `src/app/api/ai/new-endpoint/route.ts`
2. Get three provider keys and validate at least one exists
3. Call `callLLMWithFallback()` with appropriate maxTokens
4. Handle 503 failure case
5. Extract text from `result.data.content[0].text`
6. Log which provider was used

Example:
```typescript
import { callLLMWithFallback, createRouteLogger } from '@/lib/ai-retry-handler'
import { getServerAnthropicKey } from '@/lib/server-ai-key'

const logger = createRouteLogger('api/ai/my-endpoint')

const anthropicKey = getServerAnthropicKey() ?? process.env.GBL_ANTHROPIC_API_KEY
const openaiKey = process.env.GBL_OPENAI_API_KEY
const googleKey = process.env.GBL_GOOGLE_AI_API_KEY

if (!anthropicKey && !openaiKey && !googleKey) {
  return NextResponse.json({ error: 'No AI providers configured' }, { status: 503 })
}

const result = await callLLMWithFallback(anthropicKey, openaiKey, googleKey, messages, options, logger)
if (!result.success) return NextResponse.json({ error: result.error }, { status: 503 })
logger.log(`✓ Operation complete via ${result.providerUsed}`)
return NextResponse.json({ success: true, data: result.data.content[0].text })
```

## Monitoring

Monitor these metrics to detect issues:

1. **Fallback rate** — % of requests that fail on primary and use secondary/tertiary
2. **Provider availability** — success rate per provider
3. **Cost per request** — alert if unusually high (may indicate excessive fallback)
4. **Response latency** — fallback adds ~100ms per failed attempt

Add to dashboard for visibility.