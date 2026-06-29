import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/server-auth'
import { getPortalUsers, createPortalUser } from '@/lib/data/users'
import { z } from 'zod'

const ALLOWED_ROLES = ['sysadmin', 'admin']

function isAdmin(role: string) {
  return ALLOWED_ROLES.includes(role)
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 })
  if (!isAdmin(user.role)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })

  const data = await getPortalUsers()
  return NextResponse.json({ success: true, data })
}

const CreateBody = z.object({
  username: z.string().min(1).max(50).regex(/^\w+$/, 'Username must be alphanumeric'),
  name:     z.string().min(1).max(255),
  email:    z.string().email().max(255),
  role:     z.string().min(1).max(50),
  password: z.string().min(8).max(100),
})

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 })
  if (!isAdmin(user.role)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })

  const raw = await req.json().catch(() => null)
  const parsed = CreateBody.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Validation failed', errors: parsed.error.flatten() }, { status: 400 })
  }

  await createPortalUser(parsed.data)
  return NextResponse.json({ success: true, message: 'User created' }, { status: 201 })
}
