import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'

let cachedWorkspaceEnv: Record<string, string> | null = null

function findNearestEnvFile(startDir: string): string | null {
  let current = startDir
  for (;;) {
    const candidate = path.join(current, '.env')
    if (fs.existsSync(candidate)) return candidate

    const parent = path.dirname(current)
    if (parent === current) return null
    current = parent
  }
}

function readWorkspaceEnv(): Record<string, string> {
  if (cachedWorkspaceEnv) return cachedWorkspaceEnv

  const workspaceEnvPath = findNearestEnvFile(process.cwd())
  if (!workspaceEnvPath) {
    cachedWorkspaceEnv = {}
    return cachedWorkspaceEnv
  }

  cachedWorkspaceEnv = dotenv.parse(fs.readFileSync(workspaceEnvPath))
  return cachedWorkspaceEnv
}

export function getServerAnthropicKey(): string | undefined {
  const keyFromAppEnv = process.env.GBL_ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY
  if (keyFromAppEnv) return keyFromAppEnv

  const workspaceEnv = readWorkspaceEnv()
  return workspaceEnv.GBL_ANTHROPIC_API_KEY ?? workspaceEnv.ANTHROPIC_API_KEY
}

/**
 * Get array of Anthropic API keys in priority order (primary + fallbacks).
 * Returns only non-empty keys, sorted by priority.
 */
export function getServerAnthropicKeys(): string[] {
  const workspaceEnv = readWorkspaceEnv()
  const keys: string[] = []

  // Check environment variables first (highest priority)
  const appKey = process.env.GBL_ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY
  if (appKey) keys.push(appKey)

  // Then check workspace .env in priority order
  const primaryKey = workspaceEnv.GBL_ANTHROPIC_API_KEY ?? workspaceEnv.ANTHROPIC_API_KEY
  if (primaryKey && !keys.includes(primaryKey)) keys.push(primaryKey)

  // Add fallback keys
  for (let i = 2; i <= 3; i++) {
    const fallbackKey = workspaceEnv[`GBL_ANTHROPIC_API_KEY_${i}`]
    if (fallbackKey && !keys.includes(fallbackKey)) keys.push(fallbackKey)
  }

  return keys
}

export function getServerOpenAIKeys(): string[] {
  const workspaceEnv = readWorkspaceEnv()
  const keys: string[] = []

  const appKey = process.env.GBL_OPENAI_API_KEY
  if (appKey) keys.push(appKey)

  const primaryKey = workspaceEnv.GBL_OPENAI_API_KEY
  if (primaryKey && !keys.includes(primaryKey)) keys.push(primaryKey)

  for (let i = 2; i <= 3; i++) {
    const fallbackKey = workspaceEnv[`GBL_OPENAI_API_KEY_${i}`]
    if (fallbackKey && !keys.includes(fallbackKey)) keys.push(fallbackKey)
  }

  return keys
}

export function getServerGoogleKeys(): string[] {
  const workspaceEnv = readWorkspaceEnv()
  const keys: string[] = []

  const appKey = process.env.GBL_GOOGLE_AI_API_KEY
  if (appKey) keys.push(appKey)

  const primaryKey = workspaceEnv.GBL_GOOGLE_AI_API_KEY
  if (primaryKey && !keys.includes(primaryKey)) keys.push(primaryKey)

  for (let i = 2; i <= 3; i++) {
    const fallbackKey = workspaceEnv[`GBL_GOOGLE_AI_API_KEY_${i}`]
    if (fallbackKey && !keys.includes(fallbackKey)) keys.push(fallbackKey)
  }

  return keys
}

export function getServerKimiKeys(): string[] {
  const workspaceEnv = readWorkspaceEnv()
  const keys: string[] = []

  const appKey = process.env.GBL_KIMI_AI_API_KEY ?? process.env.MOONSHOT_API_KEY
  if (appKey) keys.push(appKey)

  const primaryKey = workspaceEnv.GBL_KIMI_AI_API_KEY ?? workspaceEnv.MOONSHOT_API_KEY
  if (primaryKey && !keys.includes(primaryKey)) keys.push(primaryKey)

  for (let i = 2; i <= 3; i++) {
    const fallbackKey = workspaceEnv[`GBL_KIMI_AI_API_KEY_${i}`] ?? workspaceEnv[`MOONSHOT_API_KEY_${i}`]
    if (fallbackKey && !keys.includes(fallbackKey)) keys.push(fallbackKey)
  }

  return keys
}
