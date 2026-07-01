import { NextResponse } from 'next/server'
import { getCurrentUser, can } from '@/lib/server-auth'
import { getCallouts, getCallout, createCallout } from '@/lib/data/callouts'
import type { CalloutStatus } from '@blackfire/types'
import { z } from 'zod'

// GET /api/callouts[?id=…&status=…&clientId=…&search=…&limit=…&offset=…]
export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 })
  if (!can(user, 'callout.view')) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (id) {
    const callout = await getCallout(Number(id))
    if (!callout) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: callout })
  }

  const result = await getCallouts({
    search: searchParams.get('search') ?? undefined,
    status: (searchParams.get('status') ?? undefined) as CalloutStatus | undefined,
    clientId: searchParams.get('clientId') ? Number(searchParams.get('clientId')) : undefined,
    limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
    offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined,
  })

  return NextResponse.json({ success: true, data: result.data, total: result.total })
}

const createSchema = z.object({
  clientId: z.number().int().positive().optional(),
  clientName: z.string().min(1).max(255),
  clientEmail: z.string().email().or(z.literal('')).optional().default(''),
  service: z.string().min(1).max(255),
  location: z.string().min(1).max(255),
  tech: z.string().max(100).optional().default(''),
  priority: z.enum(['Normal', 'Urgent', 'Emergency']).optional().default('Normal'),
  calloutDate: z.string().optional(),
  calloutTime: z.string().max(10).optional().default(''),
  notes: z.string().optional(),
  po: z.string().max(50).optional().default(''),
})

// POST /api/callouts
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 })
  if (!can(user, 'callout.create')) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Invalid input', errors: parsed.error.flatten() }, { status: 400 })
  }

  const id = await createCallout(parsed.data, user.id)
  const callout = await getCallout(id)
  return NextResponse.json({ success: true, message: 'Callout created', data: callout }, { status: 201 })
}
