// Regression: ISSUE-008 — public assets were redirected through authentication
// Found by /qa on 2026-06-18
// Report: .gstack/qa-reports/qa-report-localhost-8080-2026-06-18.md

import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const appDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const proxySource = await readFile(join(appDir, 'src', 'proxy.ts'), 'utf8')
const matcherLiteral = proxySource.match(/matcher:\s*\[\s*'([^']+)'/)?.[1]

if (!matcherLiteral) throw new Error('Proxy matcher was not found')

const matcher = new RegExp(`^${matcherLiteral.replaceAll('\\\\', '\\')}$`)
const expectations = new Map([
  ['/dashboard', true],
  ['/privacy', true],
  ['/blackfire_logo_transparent.png', false],
  ['/images/services/armed-response-247.jpg', false],
  ['/_next/static/chunks/app.js', false],
  ['/api/auth/login', false],
])

for (const [pathname, expected] of expectations) {
  const actual = matcher.test(pathname)
  if (actual !== expected) throw new Error(`Proxy matcher returned ${actual} for ${pathname}; expected ${expected}`)
}

const logo = await readFile(join(appDir, 'public', 'blackfire_logo_transparent.png'))
if (logo.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
  throw new Error('BlackFire logo is missing or is not a valid PNG')
}

console.log('Public asset check passed: static files bypass authentication and the BlackFire logo is valid.')
