import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser, can } from '@/lib/server-auth'
import { getSafetyFiles, createSafetyFile } from '@/lib/data/safety'
import { z } from 'zod'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 })
  if (!can(user, 'safety.view')) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') ?? 'all'
  const limit  = Number(searchParams.get('limit') ?? 500)

  const data = await getSafetyFiles({ filter, limit })
  return NextResponse.json({ success: true, data, total: data.length })
}

const CreateBody = z.object({
  clientName:  z.string().min(1).max(255),
  site:        z.string().min(1).max(255),
  auditDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  auditorName: z.string().max(255).optional().nullable(),
  notes:       z.string().max(2000).optional().nullable(),
})

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 })
  if (!can(user, 'safety.create')) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })

  const raw = await req.json().catch(() => null)
  const parsed = CreateBody.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Validation failed', errors: parsed.error.flatten() }, { status: 400 })
  }

  const refId = await createSafetyFile(parsed.data, user.username)
  return NextResponse.json({ success: true, message: 'Safety audit created', data: { ref_id: refId } }, { status: 201 })
}
