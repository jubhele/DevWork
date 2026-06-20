import { NextRequest, NextResponse } from 'next/server'

const STUB_USERS = [
  { email: 'analyst@astuteinsights.co.za', password: 'astute2024', name: 'J. Shange', role: 'Senior Analyst' },
  { email: 'admin@astuteinsights.co.za',   password: 'astute2024', name: 'Portal Admin', role: 'Administrator' },
]

function makeToken(user: { email: string; name: string; role: string }) {
  return Buffer.from(JSON.stringify({ email: user.email, name: user.name, role: user.role, iat: Date.now() })).toString('base64')
}

function parseToken(token: string): { email: string; name: string; role: string } | null {
  try {
    return JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { email, password } = body as { email?: string; password?: string }
  const match = STUB_USERS.find(u => u.email === email && u.password === password)
  if (!match) {
    return NextResponse.json({ ok: false, error: 'Invalid email or password.' }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true, user: { name: match.name, role: match.role } })
  res.cookies.set('astute_session', makeToken(match), { httpOnly: true, path: '/', maxAge: 60 * 60 * 8, sameSite: 'lax' })
  return res
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('astute_session')?.value
  if (!token) return NextResponse.json({ ok: false }, { status: 401 })
  const user = parseToken(token)
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })
  return NextResponse.json({ ok: true, user: { name: user.name, role: user.role } })
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('astute_session', '', { httpOnly: true, path: '/', maxAge: 0 })
  return res
}
