import Anthropic from '@anthropic-ai/sdk'

interface RetryResult<T> {
  success: boolean
  data?: T
  error?: string
  providerUsed?: 'anthropic' | 'openai' | 'google'
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
function getProviderModel(claudeModel: string, provider: 'anthropic' | 'openai' | 'google'): string {
  if (provider === 'anthropic') {
    return claudeModel
  }

  if (claudeModel.includes('sonnet-4-6')) {
    // Equivalent to Claude Sonnet 4.6
    return provider === 'openai' ? 'gpt-4o' : 'gemini-2-5-pro'
  }

  if (claudeModel.includes('haiku')) {
    // Equivalent to Claude Haiku
    return provider === 'openai' ? 'gpt-4o-mini' : 'gemini-1-5-flash'
  }

  // Default for unknown models
  return provider === 'openai' ? 'gpt-4o' : 'gemini-2-5-pro'
}

/**
 * Unified LLM client that abstracts over Anthropic, OpenAI, and Google.
 * Handles cross-provider fallback with transparent model selection.
 */
export async function callLLMWithFallback(
  anthropicKey: string | undefined,
  openaiKey: string | undefined,
  googleKey: string | undefined,
  messages: LLMMessage[],
  options: { model?: string; maxTokens?: number },
  logger?: { log: (msg: string) => void; error: (msg: string) => void }
): Promise<RetryResult<LLMResponse>> {
  const providers: Array<{ name: 'anthropic' | 'openai' | 'google'; key: string | undefined }> = [
    { name: 'anthropic', key: anthropicKey },
    { name: 'openai', key: openaiKey },
    { name: 'google', key: googleKey },
  ]

  const availableProviders = providers.filter(p => p.key)

  if (availableProviders.length === 0) {
    return {
      success: false,
      error: 'No API keys configured',
      totalProvidersAttempted: 0,
    }
  }

  let lastError: Error | undefined

  for (let i = 0; i < availableProviders.length; i++) {
    const provider = availableProviders[i]
    const attemptNum = i + 1

    try {
      logger?.log(`[LLM-Fallback] Attempting ${provider.name} (${attemptNum}/${availableProviders.length})...`)

      let response: LLMResponse

      if (provider.name === 'anthropic') {
        response = await callAnthropicAPI(provider.key!, messages, options, provider.name)
      } else if (provider.name === 'openai') {
        response = await callOpenAIAPI(provider.key!, messages, options, provider.name)
      } else if (provider.name === 'google') {
        response = await callGoogleAPI(provider.key!, messages, options, provider.name)
      } else {
        throw new Error(`Unknown provider: ${provider.name}`)
      }

      logger?.log(`[LLM-Fallback] ✓ Success with ${provider.name}`)
      return {
        success: true,
        data: response,
        providerUsed: provider.name,
        keyUsed: attemptNum,
        totalProvidersAttempted: attemptNum,
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      const errorMsg = lastError.message || 'Unknown error'

      logger?.error(
        `[LLM-Fallback] ✗ ${provider.name} failed: ${errorMsg}${
          i < availableProviders.length - 1 ? ' — trying next provider...' : ' — no more providers'
        }`
      )

      if (i < availableProviders.length - 1) {
        continue
      }
    }
  }

  return {
    success: false,
    error: `All ${availableProviders.length} providers failed. Last error: ${lastError?.message || 'Unknown'}`,
    totalProvidersAttempted: availableProviders.length,
  }
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
        'AI provider credits are exhausted. Top up Anthropic billing or configure GBL_OPENAI_API_KEY / GBL_GOOGLE_AI_API_KEY.',
    }
  }

  if (lower.includes('invalid api key') || lower.includes('authentication') || lower.includes('unauthorized')) {
    return {
      status: 503,
      message:
        'AI provider authentication failed. Verify GBL_ANTHROPIC_API_KEY (or configure alternate provider keys).',
    }
  }

  return {
    status: 503,
    message: 'AI service unavailable. Please try again shortly.',
  }
}

