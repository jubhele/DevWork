import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/server-auth'
import { getAuditLog } from '@/lib/data/audit'

const ALLOWED_ROLES = ['sysadmin', 'admin']

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 })
  if (!ALLOWED_ROLES.includes(user.role)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })

  const page = Math.max(1, Number(new URL(req.url).searchParams.get('page') ?? 1))
  const { data, total } = await getAuditLog(page)
  return NextResponse.json({ success: true, data, total })
}
