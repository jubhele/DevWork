import { NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? (process.env.NODE_ENV === 'production' ? 'https://blackfiresolutions.co.za/api' : 'http://localhost:8080/api')

function normalizeCookieForDev(request: Request, cookie: string) {
  if (process.env.NODE_ENV === 'production') return cookie
  const protoHeader = request.headers.get('x-forwarded-proto')
  const proto = protoHeader || new URL(request.url).protocol.replace(':', '')
  if (proto === 'https') return cookie
  return cookie.replace(/;\s*secure/ig, '')
}

function mirrorUpstreamCookies(response: NextResponse, upstream: Response) {
  const setCookies = typeof upstream.headers.getSetCookie === 'function'
    ? upstream.headers.getSetCookie()
    : []

  if (setCookies.length) {
    for (const cookie of setCookies) {
      response.headers.append('set-cookie', cookie)
    }
    return
  }

  const fallback = upstream.headers.get('set-cookie')
  if (fallback) response.headers.append('set-cookie', fallback)
}

export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie')
  const bodyText = await request.text()
  const upstream = await fetch(`${API_BASE}/auth.php?action=login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: bodyText,
    cache: 'no-store',
  })

  const payload = await upstream.json().catch(() => ({}))
  const response = NextResponse.json(
    upstream.ok
      ? payload
      : { success: false, message: payload.error ?? payload.message ?? 'Login failed' },
    { status: upstream.status },
  )

  mirrorUpstreamCookies(response, upstream)
  const merged = response.headers.getSetCookie?.() ?? []
  if (merged.length) {
    response.headers.delete('set-cookie')
    for (const cookie of merged) {
      response.headers.append('set-cookie', normalizeCookieForDev(request, cookie))
    }
  }
  return response
}
