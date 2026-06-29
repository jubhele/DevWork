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
