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

function normalizeHtml(html) {
  return html
    .replace(/nonce="[^"]+"/g, 'nonce=""')
    .replace(/csp-nonce" content="[^"]+"/g, 'csp-nonce" content=""')
    .replace(/v=\d+/g, 'v=')
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  })

  if (!res.ok) {
    throw new Error(`${url} returned ${res.status}`)
  }

  return res.text()
}

async function fetchStatus(url) {
  const res = await fetch(url, {
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  })

  if (!res.ok) {
    throw new Error(`${url} returned ${res.status}`)
  }

  return {
    status: res.status,
    contentType: res.headers.get('content-type') ?? '',
  }
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
    'Request a Security Assessment',
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
  for (const route of ROUTES) {
    const webHtml = normalizeHtml(await fetchText(`${NEXT_BASE}${route}`))
    const webTitle = getTitle(webHtml)

    if (!webTitle) {
      throw new Error(`Missing title on ${NEXT_BASE}${route}`)
    }

    requireNextMarkers(webHtml, route)
  }

  const assetResults = await Promise.all(
    ASSETS.map(async asset => {
      const web = await fetchStatus(`${NEXT_BASE}${asset}`)

      if (web.status !== 200) {
        throw new Error(`Asset status mismatch for ${asset}: ${web.status}`)
      }

      if (asset.endsWith('.jpg') || asset.endsWith('.png') || asset.endsWith('.ico')) {
        if (!web.contentType) {
          throw new Error(`Asset missing content-type for ${asset}`)
        }
      }

      return asset
    })
  )

  console.log(`Next app QA OK for ${ROUTES.length} routes and ${assetResults.length} assets.`)
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
