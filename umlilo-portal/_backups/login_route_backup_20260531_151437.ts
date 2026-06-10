import { NextRequest, NextResponse } from 'next/server'
import { encodeCookie } from '@/lib/auth'
import type { AuthResponse } from '@blackfire/types'

export async function POST(req: NextRequest) {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'https://blackfiresolutions.co.za/api'

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 })
  }

  // Forward browser cookies to PHP so PHPSESSID (captcha session) is validated
  const phpCookies = req.headers.get('cookie') ?? ''

  let phpRes: Response
  try {
    phpRes = await fetch(`${API_BASE}/auth.php?action=login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(phpCookies ? { Cookie: phpCookies } : {}),
      },
      body: JSON.stringify(body),
    })
  } catch {
    return NextResponse.json({ success: false, message: 'Could not reach auth server.' }, { status: 502 })
  }

  let data: AuthResponse
  try {
    const raw = await phpRes.json()
    data = raw?.data ? { ...raw, ...raw.data } : raw
  } catch {
    return NextResponse.json({ success: false, message: 'Unexpected auth server response.' }, { status: 502 })
  }

  if (!data.success || !data.user || !data.token) {
    return NextResponse.json(
      { success: false, message: data.message ?? 'Login failed' },
      { status: phpRes.ok ? 401 : phpRes.status }
    )
  }

  const cookieValue = encodeCookie({ user: data.user, token: data.token })

  const response = NextResponse.json({ success: true })
  response.cookies.set('bf_portal', cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7200,
    path: '/',
  })
  return response
}
