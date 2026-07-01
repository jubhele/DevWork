import { NextRequest, NextResponse } from 'next/server'
import { encodeCookie } from '@/lib/auth'
import type { AuthResponse } from '@blackfire/types'

function getPhpSessionId(response: Response): string {
  const setCookieHeader = response.headers.get('set-cookie') ?? ''
  return setCookieHeader.match(/bf_portal=([^;]+)/)?.[1] ?? ''
}

export async function POST(req: NextRequest) {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE
    ?? `http://localhost:${process.env.PORT ?? '3000'}/api`

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 })
  }

  // Forward the PHP captcha session cookie (stored on our domain by /api/auth/captcha)
  const phpSessId = req.cookies.get('php_sess')?.value ?? ''

  let phpRes: Response
  try {
    phpRes = await fetch(`${API_BASE}/auth.php?action=login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(phpSessId ? { Cookie: `bf_portal=${phpSessId}` } : {}),
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

  if (!data.success || !data.user) {
    return NextResponse.json(
      { success: false, message: (data as unknown as Record<string, string>).error ?? data.message ?? 'Login failed' },
      { status: phpRes.ok ? 401 : phpRes.status }
    )
  }

  // token may be absent if Afrihost PHP hasn't been updated yet — degrade gracefully
  const phpSessionId = getPhpSessionId(phpRes) || phpSessId
  const cookieValue = encodeCookie({ user: data.user, token: data.token ?? '', phpSessionId })

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
