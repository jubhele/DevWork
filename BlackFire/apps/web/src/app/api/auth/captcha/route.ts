import { NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'https://blackfiresolutions.co.za/api'

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

export async function GET(request: Request) {
  const cookieHeader = request.headers.get('cookie')
  const upstream = await fetch(`${API_BASE}/auth.php?action=captcha`, {
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    cache: 'no-store',
  })

  const payload = await upstream.json().catch(() => ({}))
  const response = NextResponse.json(
    upstream.ok
      ? payload
      : { success: false, message: payload.error ?? payload.message ?? 'Could not load security check' },
    { status: upstream.status },
  )

  mirrorUpstreamCookies(response, upstream)
  return response
}