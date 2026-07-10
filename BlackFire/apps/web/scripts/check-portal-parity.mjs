import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ROUTES = ['/', '/login']
const NEXT_BASE = 'http://localhost:3000'

const ASSETS = [
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/favicon-512x512.png',
  '/apple-touch-icon.png',
  '/blackfire_logo_transparent.png',
  '/images/services/armed-response.jpg',
]

const API_EXPECTATIONS = [
  { path: '/api/auth/captcha', expected: [200] },
  { path: '/api/auth/me', expected: [401] },
  { path: '/api/ai/anomaly', expected: [200] },
  { path: '/api/audit', expected: [401] },
]

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const APP_ROOT = path.resolve(SCRIPT_DIR, '..', 'src', 'app', '(portal)')

function routeFromFile(filePath) {
  const rel = path.relative(APP_ROOT, filePath).replace(/\\/g, '/')
  const route = rel.replace(/\/page\.tsx$/, '').replace(/\/index$/, '')
  return route ? `/${route}` : '/'
}

async function listPortalPages(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const found = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      found.push(...(await listPortalPages(fullPath)))
      continue
    }
    if (entry.isFile() && entry.name === 'page.tsx') {
      found.push(routeFromFile(fullPath))
    }
  }
  return found
}

function normalizeHtml(html) {
  return html
    .replace(/nonce="[^"]+"/g, 'nonce=""')
    .replace(/csp-nonce" content="[^"]+"/g, 'csp-nonce" content=""')
    .replace(/v=\d+/g, 'v=')
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchText(url) {
  let res
  try {
    res = await fetch(url, {
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      redirect: 'follow',
    })
  } catch (error) {
    throw new Error(
      `Failed to reach ${url}. Start the Next.js app first (for example: pnpm -C C:\\DevWork\\BlackFire\\apps\\web dev).`
    )
  }

  if (!res.ok) {
    throw new Error(`${url} returned ${res.status}`)
  }

  return res.text()
}

async function fetchStatus(url) {
  let res
  try {
    res = await fetch(url, {
      method: 'HEAD',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      redirect: 'manual',
    })
  } catch (error) {
    throw new Error(
      `Failed to reach ${url}. Start the Next.js app first (for example: pnpm -C C:\\DevWork\\BlackFire\\apps\\web dev).`
    )
  }

  return {
    status: res.status,
    contentType: res.headers.get('content-type') ?? '',
  }
}

async function fetchApiStatus(url) {
  let res
  try {
    res = await fetch(url, {
      method: 'HEAD',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      redirect: 'manual',
    })
  } catch (error) {
    throw new Error(
      `Failed to reach ${url}. Start the Next.js app first (for example: pnpm -C C:\\DevWork\\BlackFire\\apps\\web dev).`
    )
  }
  return res.status
}

function extractAssetPaths(html) {
  const matches = html.match(/\/(?:[a-zA-Z0-9._\-/]+)\.(?:png|jpg|jpeg|svg|ico|webp)/g) ?? []
  return [...new Set(matches)]
}

function getTitle(html) {
  const match = html.match(/<title>(.*?)<\/title>/i)
  return match?.[1] ?? ''
}

function requireNextMarkers(html, route) {
  const mustHave = [
    '/_next/static',
    'BlackFire Solutions',
  ]
  const mustNotHave = [
    'portal.css',
    'portal.js',
    'data-state="public"',
  ]

  for (const marker of mustHave) {
    if (!html.includes(marker)) {
      throw new Error(`${NEXT_BASE}${route} is missing required Next marker: ${marker}`)
    }
  }

  for (const marker of mustNotHave) {
    if (html.includes(marker)) {
      throw new Error(`${NEXT_BASE}${route} contains unexpected PHP marker: ${marker}`)
    }
  }
}

async function main() {
  const discoveredPortalRoutes = await listPortalPages(APP_ROOT)
  const protectedRoutes = discoveredPortalRoutes.map(route => (route === '/' ? '/dashboard' : route))
  const routeSet = [...new Set([...ROUTES, ...protectedRoutes])]
  const discoveredAssets = new Set(ASSETS)

  for (const route of ROUTES) {
    const webHtml = normalizeHtml(await fetchText(`${NEXT_BASE}${route}`))
    const webTitle = getTitle(webHtml)

    if (!webTitle) {
      throw new Error(`Missing title on ${NEXT_BASE}${route}`)
    }

    requireNextMarkers(webHtml, route)
    for (const asset of extractAssetPaths(webHtml)) discoveredAssets.add(asset)
  }

  for (const route of protectedRoutes) {
    if (route === '/login') continue
    const status = await fetchStatus(`${NEXT_BASE}${route}`)
    if (![307, 308, 302].includes(status.status)) {
      throw new Error(`Expected auth redirect for ${route}, got ${status.status}`)
    }
  }

  const assetResults = []
  for (const asset of discoveredAssets) {
    const web = await fetchStatus(`${NEXT_BASE}${asset}`)
    if (web.status !== 200) {
      throw new Error(`Asset status mismatch for ${asset}: ${web.status}`)
    }
    if ((asset.endsWith('.jpg') || asset.endsWith('.png') || asset.endsWith('.ico')) && !web.contentType) {
      throw new Error(`Asset missing content-type for ${asset}`)
    }
    assetResults.push(asset)
  }

  const apiResults = []
  for (const api of API_EXPECTATIONS) {
    const status = await fetchApiStatus(`${NEXT_BASE}${api.path}`)
    if (!api.expected.includes(status)) {
      throw new Error(`${api.path} expected [${api.expected.join(', ')}], got ${status}`)
    }
    apiResults.push(`${api.path}:${status}`)
  }

  console.log(
    `Next app QA OK for ${routeSet.length} routes (${protectedRoutes.length} protected), ${assetResults.length} assets, ${apiResults.length} API checks.`
  )
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
