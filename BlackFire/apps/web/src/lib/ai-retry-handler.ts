import Anthropic from '@anthropic-ai/sdk'
import { getServerAnthropicKeys, getServerGoogleKeys, getServerKimiKeys, getServerOpenAIKeys } from './server-ai-key'

interface RetryResult<T> {
  success: boolean
  data?: T
  error?: string
  providerUsed?: 'anthropic' | 'openai' | 'google' | 'kimi'
  keyUsed?: number
  totalProvidersAttempted: number
}

interface LLMMessage {
  role: 'user' | 'assistant'
  content: string
}

interface LLMResponse {
  content: Array<{ type: 'text'; text: string }>
}

/**
 * Map Anthropic model names to equivalent models for other providers.
 * When routes pass a Claude model name, translate it for the active provider.
 */
function getProviderModel(claudeModel: string, provider: 'anthropic' | 'openai' | 'google' | 'kimi'): string {
  if (provider === 'anthropic') {
    return claudeModel
  }

  if (claudeModel.includes('sonnet-4-6')) {
    // Equivalent to Claude Sonnet 4.6
    if (provider === 'openai') return 'gpt-4o'
    if (provider === 'google') return 'gemini-2-5-pro'
    return 'kimi-k2.6'
  }

  if (claudeModel.includes('haiku')) {
    // Equivalent to Claude Haiku
    if (provider === 'openai') return 'gpt-4o-mini'
    if (provider === 'google') return 'gemini-1-5-flash'
    return 'kimi-k2.6'
  }

  // Default for unknown models
  if (provider === 'openai') return 'gpt-4o'
  if (provider === 'google') return 'gemini-2-5-pro'
  return 'kimi-k2.6'
}

/**
 * Unified LLM client that abstracts over Anthropic, OpenAI, and Google.
 * Handles cross-provider fallback with transparent model selection.
 */
export async function callLLMWithFallback(
  anthropicKey: string | undefined,
  openaiKey: string | undefined,
  googleKey: string | undefined,
  kimiKey: string | undefined,
  messages: LLMMessage[],
  options: { model?: string; maxTokens?: number },
  logger?: { log: (msg: string) => void; error: (msg: string) => void }
): Promise<RetryResult<LLMResponse>> {
  const providers: Array<{ name: 'anthropic' | 'openai' | 'google' | 'kimi'; keys: string[] }> = [
    { name: 'anthropic', keys: mergeProviderKeys(anthropicKey, getServerAnthropicKeys()) },
    { name: 'openai', keys: mergeProviderKeys(openaiKey, getServerOpenAIKeys()) },
    { name: 'google', keys: mergeProviderKeys(googleKey, getServerGoogleKeys()) },
    { name: 'kimi', keys: mergeProviderKeys(kimiKey, getServerKimiKeys()) },
  ]

  const availableProviders = providers.filter(p => p.keys.length > 0)

  if (availableProviders.length === 0) {
    return {
      success: false,
      error: 'No API keys configured',
      totalProvidersAttempted: 0,
    }
  }

  let lastError: Error | undefined
  let totalAttempts = 0

  for (let i = 0; i < availableProviders.length; i++) {
    const provider = availableProviders[i]

    for (let keyIndex = 0; keyIndex < provider.keys.length; keyIndex++) {
      const key = provider.keys[keyIndex]
      const keyAttempt = keyIndex + 1
      totalAttempts++

      try {
        logger?.log(
          `[LLM-Fallback] Attempting ${provider.name} key ${keyAttempt}/${provider.keys.length} (attempt ${totalAttempts})...`
        )

        let response: LLMResponse

        if (provider.name === 'anthropic') {
          response = await callAnthropicAPI(key, messages, options, provider.name)
        } else if (provider.name === 'openai') {
          response = await callOpenAIAPI(key, messages, options, provider.name)
        } else if (provider.name === 'google') {
          response = await callGoogleAPI(key, messages, options, provider.name)
        } else if (provider.name === 'kimi') {
          response = await callKimiAPI(key, messages, options, provider.name)
        } else {
          throw new Error(`Unknown provider: ${provider.name}`)
        }

        logger?.log(`[LLM-Fallback] ✓ Success with ${provider.name} key ${keyAttempt}`)
        return {
          success: true,
          data: response,
          providerUsed: provider.name,
          keyUsed: keyAttempt,
          totalProvidersAttempted: totalAttempts,
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        const errorMsg = lastError.message || 'Unknown error'
        const hasMoreKeysHere = keyIndex < provider.keys.length - 1
        const hasMoreProviders = i < availableProviders.length - 1

        logger?.error(
          `[LLM-Fallback] ✗ ${provider.name} key ${keyAttempt} failed: ${errorMsg}${
            hasMoreKeysHere || hasMoreProviders ? ' — trying next key/provider...' : ' — no more providers'
          }`
        )

        if (hasMoreKeysHere) {
          continue
        }
      }
    }
  }

  return {
    success: false,
    error: `All ${availableProviders.length} providers failed. Last error: ${lastError?.message || 'Unknown'}`,
    totalProvidersAttempted: totalAttempts,
  }
}

function mergeProviderKeys(primaryKey: string | undefined, configuredKeys: string[]): string[] {
  const keys: string[] = []

  if (primaryKey) keys.push(primaryKey)

  for (const key of configuredKeys) {
    if (key && !keys.includes(key)) keys.push(key)
  }

  return keys
}

/**
 * Call Anthropic Claude API
 */
async function callAnthropicAPI(
  apiKey: string,
  messages: LLMMessage[],
  options: { model?: string; maxTokens?: number },
  provider: 'anthropic'
): Promise<LLMResponse> {
  const client = new Anthropic({ apiKey })
  const model = getProviderModel(options.model || 'claude-sonnet-4-6', provider)

  const response = await client.messages.create({
    model,
    max_tokens: options.maxTokens || 2048,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
  })

  return {
    content: response.content
      .filter(c => c.type === 'text')
      .map(c => ({
        type: 'text' as const,
        text: (c as { type: 'text'; text: string }).text,
      })),
  }
}

/**
 * Call OpenAI API (GPT-4 compatible)
 */
async function callOpenAIAPI(
  apiKey: string,
  messages: LLMMessage[],
  options: { model?: string; maxTokens?: number },
  provider: 'openai'
): Promise<LLMResponse> {
  const model = getProviderModel(options.model || 'claude-sonnet-4-6', provider)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: options.maxTokens || 2048,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(
      `OpenAI error ${response.status}: ${
        (error as { error?: { message?: string } }).error?.message || 'unknown'
      }`
    )
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = data.choices?.[0]?.message?.content || ''

  return {
    content: [{ type: 'text' as const, text: content }],
  }
}

/**
 * Call Google AI API (Gemini compatible)
 * 
 * Available models (in order of preference):
 * - gemini-2.0-flash (recommended - fastest, cheapest)
 * - gemini-2.0-pro (more capable, slower)
 * - gemini-1.5-pro (legacy but reliable)
 * - gemini-1.5-flash (legacy alternative)
 */
async function callGoogleAPI(
  apiKey: string,
  messages: LLMMessage[],
  options: { model?: string; maxTokens?: number },
  provider: 'google'
): Promise<LLMResponse> {
  const model = getProviderModel(options.model || 'claude-sonnet-4-6', provider)

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        })),
        generationConfig: {
          maxOutputTokens: options.maxTokens || 2048,
        },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(
      `Google API error ${response.status}: ${
        (error as { error?: { message?: string } }).error?.message || 'unknown'
      }`
    )
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  return {
    content: [{ type: 'text' as const, text: content }],
  }
}

/**
 * Call Kimi (Moonshot) API.
 * Moonshot exposes an OpenAI-compatible chat completions endpoint.
 */
async function callKimiAPI(
  apiKey: string,
  messages: LLMMessage[],
  options: { model?: string; maxTokens?: number },
  provider: 'kimi'
): Promise<LLMResponse> {
  const model = getProviderModel(options.model || 'claude-sonnet-4-6', provider)

  const response = await fetch('https://api.moonshot.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: options.maxTokens || 2048,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(
      `Kimi error ${response.status}: ${((error as { error?: { message?: string } }).error?.message) || 'unknown'}`
    )
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = data.choices?.[0]?.message?.content || ''

  return {
    content: [{ type: 'text' as const, text: content }],
  }
}

/**
 * Simple logger for Next.js API routes. Outputs to console.
 * In production, integrate with your logging service.
 */
export function createRouteLogger(route: string) {
  return {
    log: (msg: string) => console.log(`[${route}] ${msg}`),
    error: (msg: string) => console.error(`[${route}] ${msg}`),
  }
}

export function mapAIServiceError(errorText: string | undefined): { status: number; message: string } {
  const lower = (errorText ?? '').toLowerCase()

  if (
    lower.includes('credit balance is too low') ||
    lower.includes('insufficient_quota') ||
    lower.includes('quota exceeded')
  ) {
    return {
      status: 503,
      message:
        'AI provider credits are exhausted. Top up Anthropic billing or configure GBL_OPENAI_API_KEY / GBL_GOOGLE_AI_API_KEY / GBL_KIMI_AI_API_KEY.',
    }
  }

  if (lower.includes('invalid api key') || lower.includes('authentication') || lower.includes('unauthorized')) {
    return {
      status: 503,
      message:
        'AI provider authentication failed. Verify GBL_ANTHROPIC_API_KEY, GBL_OPENAI_API_KEY, GBL_GOOGLE_AI_API_KEY, or GBL_KIMI_AI_API_KEY.',
    }
  }

  return {
    status: 503,
    message: 'AI service unavailable. Please try again shortly.',
  }
}

