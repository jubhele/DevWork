import { NextResponse } from 'next/server'

export async function GET() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? ''

  // No PHP backend configured (local dev) — return a static captcha so the login
  // form is usable without the production server.
  if (!API_BASE) {
    return NextResponse.json({ success: true, question: '5 + 3 = ?', answer_hint: 8 })
  }

  let phpRes: Response
  try {
    phpRes = await fetch(`${API_BASE}/auth.php?action=captcha`, {
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })
  } catch {
    return NextResponse.json({ success: false, message: 'Could not reach auth server.' }, { status: 502 })
  }

  let data: { success: boolean; question: string; message: string }
  try {
    data = await phpRes.json()
  } catch {
    return NextResponse.json({ success: false, message: 'Unexpected auth server response.' }, { status: 502 })
  }

  const response = NextResponse.json(data)

  // Relay the PHP session cookie onto our domain so it can be forwarded on login
  const setCookieHeader = phpRes.headers.get('set-cookie') ?? ''
  const match = setCookieHeader.match(/bf_portal=([^;]+)/)
  if (match) {
    response.cookies.set('php_sess', match[1], {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    })
  }

  return response
}
