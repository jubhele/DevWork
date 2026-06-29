# AI API Keys Configuration & Fallback System

## Overview

The BlackFire portal supports automatic fallback to multiple API keys when the primary key fails. This ensures service continuity even if one API provider experiences issues, quota limits, or authentication problems.

## Supported Providers

- **Anthropic Claude** (primary for intelligence generation)
- **OpenAI** (used for Whisper audio transcription)
- **Google AI** (configured for future expansion)

## Environment Variables

All API keys are stored in `.env` (never committed). Configure up to 3 keys per provider:

### Anthropic Claude
```
GBL_ANTHROPIC_API_KEY=sk-ant-...        # Primary key
GBL_ANTHROPIC_API_KEY_2=sk-ant-...      # Fallback 1
GBL_ANTHROPIC_API_KEY_3=sk-ant-...      # Fallback 2
```

### OpenAI (Whisper transcription)
```
GBL_OPENAI_API_KEY=sk-...               # Primary key
GBL_OPENAI_API_KEY_2=sk-...             # Fallback 1
GBL_OPENAI_API_KEY_3=sk-...             # Fallback 2
```

### Google AI (Future)
```
GBL_GOOGLE_AI_API_KEY=...               # Primary key
GBL_GOOGLE_AI_API_KEY_2=...             # Fallback 1
GBL_GOOGLE_AI_API_KEY_3=...             # Fallback 2
```

## How It Works

1. **On each request**, the system fetches an array of configured API keys in priority order
2. **It tries each key sequentially** until one succeeds
3. **If all keys fail**, the system returns a 503 Service Unavailable with error details
4. **Success is logged** with which key number was used (1, 2, or 3)
5. **Failures are logged** with the specific error from each key

### Example Request Flow

```
GET /api/ai/anomaly
  → Get keys: [primary, fallback-1, fallback-2]
  → Try primary → FAILS (auth error)
  → Try fallback-1 → FAILS (rate limit)
  → Try fallback-2 → SUCCESS
  → Log: "✓ Analysis complete with API key 3"
```

## API Routes Using Fallback

| Route | Provider | Keys Used |
|-------|----------|-----------|
| `/api/ai/anomaly` | Anthropic | GBL_ANTHROPIC_API_KEY* |
| `/api/ai/reports` | Anthropic | GBL_ANTHROPIC_API_KEY* |
| `/api/ai/safety-copilot` | Anthropic | GBL_ANTHROPIC_API_KEY* |
| `/api/ai/voice-to-callout` | OpenAI (transcribe) + Anthropic (extract) | GBL_OPENAI_API_KEY* + GBL_ANTHROPIC_API_KEY* |

\* _Can use primary + fallback slots_

## Implementation Details

### Getting Keys

All keys are fetched via helper functions in `src/lib/server-ai-key.ts`:

```typescript
import { getServerAnthropicKeys, getServerOpenAIKeys } from '@/lib/server-ai-key'

const anthropicKeys = getServerAnthropicKeys()      // Returns string[]
const openAiKeys = getServerOpenAIKeys()            // Returns string[]
```

These functions:
1. Check process.env first (highest priority)
2. Parse workspace `.env` file
3. Collect all non-empty key slots (primary + fallbacks)
4. Return deduplicated array in priority order

### Retry Handler

All AI calls use the retry wrapper in `src/lib/ai-retry-handler.ts`:

```typescript
const result = await callAnthropicWithRetry(
  apiKeys,
  async (client) => {
    // Your Claude API call
    return await client.messages.create({...})
  },
  logger
)

if (result.success) {
  console.log(`Success with key ${result.keyUsed}`)
} else {
  console.error(`Failed after ${result.totalKeysAttempted} attempts`)
}
```

Returns:
```typescript
{
  success: boolean
  data?: T                    // Your API response
  error?: string             // Error message if failed
  keyUsed?: number           // Which key succeeded (1-3)
  totalKeysAttempted: number // Number of keys tried
}
```

### Logging

Each route logs all attempts to console. In production, integrate with a logging service:

```
[api/ai/anomaly] Attempting with API key 1/3...
[api/ai/anomaly] ✗ API key 1 failed: 401 Invalid API key — trying next key...
[api/ai/anomaly] Attempting with API key 2/3...
[api/ai/anomaly] ✓ Success with API key 2
[api/ai/anomaly] ✓ Analysis complete with API key 2. Found 3 anomalies in 47 records.
```

## Setup Instructions

### 1. Get API Keys

- **Anthropic**: Visit [console.anthropic.com](https://console.anthropic.com) → API Keys
- **OpenAI**: Visit [platform.openai.com](https://platform.openai.com) → API Keys
- **Google**: Visit [ai.google.dev](https://ai.google.dev) → Get API Key

### 2. Add to `.env`

Copy and fill `.env.example`:

```bash
cp .env.example .env
```

Edit `.env`:
```
GBL_ANTHROPIC_API_KEY=sk-ant-xxxxx
GBL_ANTHROPIC_API_KEY_2=sk-ant-yyyyy  # Optional: fallback
GBL_OPENAI_API_KEY=sk-xxxxx
```

### 3. Verify Configuration

The app will check on startup. If keys are missing, endpoints return 503 with a clear message:

```json
{
  "success": false,
  "message": "AI not configured — set GBL_ANTHROPIC_API_KEY or GBL_ANTHROPIC_API_KEY_2/3"
}
```

## Quota & Rate Limits

Each provider has rate limits. Fallback keys help distribute load:

| Provider | Tier | RPM | TPM |
|----------|------|-----|-----|
| Anthropic | Free | 10 | 50K |
| Anthropic | Pro | 600 | N/A |
| OpenAI | Free | 3 | 90K |
| OpenAI | Paid | 3,500 | 200K |

**Recommendation**: Use at least 2 keys per provider in production, split across different accounts to avoid hitting shared rate limits.

## Troubleshooting

### All keys failed: "401 Invalid API key"
- Check that your keys are copied exactly (no extra spaces or quotes)
- Verify the key format matches the provider (e.g., `sk-ant-` for Anthropic)
- Ensure keys are not expired or revoked

### All keys failed: "rate_limit_exceeded"
- You've hit the provider's RPM or TPM limit
- Add a second key to split the load
- Implement request backoff/retry in your client (currently only API-side)

### All keys failed: "Invalid request / 400"
- The API payload is malformed
- Check the route implementation for bugs
- Review the provider's API docs

### One key works, another doesn't
- This is normal! Some keys may have different quotas or permissions
- The system will use the working key
- No action needed

## Future Enhancements

- [ ] Support custom LLM endpoints (self-hosted models)
- [ ] Add request batching to balance across keys
- [ ] Implement exponential backoff for rate-limited keys
- [ ] Per-route key affinity (prefer specific key for certain tasks)
- [ ] Metrics dashboard showing key health and usage patterns
