# Session: Cross-Provider API Key Fallback Implementation

Date: 2026-06-29
Provider: GitHub Copilot
Model: Claude Haiku 4.5

## Goal

Implement cascading cross-provider fallback for AI LLM calls in BlackFire Portal. Replace single-provider retry logic with intelligent fallback: Anthropic Claude (primary) → OpenAI GPT-4o (secondary) → Google Gemini (tertiary). Ensure all four AI routes use the unified `callLLMWithFallback()` handler and document the architecture.

## Goal Status
ACHIEVED

## Decisions

- **Cascading order**: Anthropic → OpenAI → Google (capability ranking + cost optimization)
- **One key per provider**: No multi-key-per-provider slots needed since fallback is cross-provider
- **Single unified handler**: All four routes use `callLLMWithFallback()` from `ai-retry-handler.ts`
- **Response normalization**: Each provider returns different structure; normalize to `{ content: [{ type: 'text', text }] }`
- **Logging pattern**: Include provider name in logs (e.g., `✓ Report generated via anthropic`)

## Work Done

### Files Modified

1. **`src/app/api/ai/anomaly/route.ts`** ✓
   - Replaced old `getServerAnthropicKeys()` + `callAnthropicWithRetry()` pattern
   - Gets three provider keys: `anthropicKey`, `openaiKey`, `googleKey`
   - Validates at least one provider exists
   - Calls `callLLMWithFallback()` with maxTokens: 1024
   - Returns 503 if all providers fail
   - Logs which provider handled the request

2. **`src/app/api/ai/reports/route.ts`** ✓
   - Replaced old multi-key Anthropic-only pattern
   - Gets three provider keys and validates configuration
   - Calls `callLLMWithFallback()` with maxTokens: 2048
   - Maintains existing KPI and report generation logic
   - Logs provider used in output

3. **`src/app/api/ai/safety-copilot/route.ts`** ✓
   - Updated both action handlers (comment + risk assessment)
   - Gets three provider keys and validates
   - Comment action: calls `callLLMWithFallback()` with maxTokens: 400
   - Risk action: calls `callLLMWithFallback()` with maxTokens: 600
   - Each action independently falls through the three providers

4. **`src/app/api/ai/voice-to-callout/route.ts`** ✓
   - Step 1 (Whisper transcription): OpenAI-only (no cross-provider alt available)
   - Step 2 (JSON extraction): Uses `callLLMWithFallback()` with claude-haiku model
   - Extracts from `result.data.content[0].text` consistently
   - Logs both transcription and extraction steps

5. **`docs/AI_API_KEYS.md`** ✓ (Created)
   - Comprehensive documentation of cascading fallback architecture
   - Configuration examples (one key per provider)
   - How fallback works step-by-step
   - Route-by-route implementation details
   - Error handling and troubleshooting
   - Cost considerations
   - Monitoring guidance
   - Instructions for adding new routes

### Backups Created

All modified files backed up to `_backups/` with timestamps:
- `anomaly_backup_20260629_*.ts`
- `reports_backup_20260629_*.ts`
- `safety-copilot_backup_20260629_*.ts`
- `voice-to-callout_backup_20260629_*.ts`

### TypeScript Validation

✅ **All changes compile without type errors** — verified with `npm run typecheck` (exit code 0)

## Blockers / Next Steps

None — implementation complete and validated.

**Optional future enhancements:**
- Add Google Speech-to-Text as alternative to OpenAI Whisper (separate task)
- Add provider-specific request counting and metrics dashboard
- Implement adaptive fallback ordering based on real-time provider health

## Learnings

1. **Cross-provider cascading is cleaner than multi-key-per-provider**: Simpler configuration, better fault isolation, clearer logging
2. **Response normalization pays off**: Each provider (Anthropic SDK, OpenAI REST, Google REST) has different response shapes; normalizing to a common structure eliminates route-specific parsing
3. **One unified handler scales**: All four routes now follow identical integration pattern — easy to add new routes or modify behavior globally
4. **Logging with provider names critical**: Operators can immediately see which provider served each request, enabling quick troubleshooting
5. **TypeScript compilation important before deployment**: All changes validated with type checker to prevent runtime issues

## Provider Usage Pattern (for future reference)

```typescript
// Every route now follows this pattern:
const anthropicKey = getServerAnthropicKey() ?? process.env.GBL_ANTHROPIC_API_KEY
const openaiKey = process.env.GBL_OPENAI_API_KEY
const googleKey = process.env.GBL_GOOGLE_AI_API_KEY

if (!anthropicKey && !openaiKey && !googleKey) {
  return NextResponse.json({ error: '...' }, { status: 503 })
}

const result = await callLLMWithFallback(
  anthropicKey, openaiKey, googleKey,
  messages, options, logger
)

if (!result.success) {
  return NextResponse.json({ error: result.error }, { status: 503 })
}

logger.log(`✓ Completed via ${result.providerUsed}`)
```

---

**Completed by**: GitHub Copilot  
**Status**: COMPLETED  
**Confirmed**: User confirmed ACHIEVED  
**Timestamp**: 2026-06-29 18:00:00 UTC