import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser, can } from '@/lib/server-auth'
import {
  getTrackerUpdates,
  getTrackerRevisions,
  createTrackerUpdate,
  updateTrackerUpdate,
  deleteTrackerUpdate,
} from '@/lib/data/tracker-updates'
import { z } from 'zod'

const VALID_ENTITY_TYPES = ['callout', 'quote', 'invoice', 'task', 'safety'] as const

function permFor(entityType: string): string {
  const map: Record<string, string> = {
    callout: 'callouts.view',
    quote: 'quotes.view',
    invoice: 'invoices.view',
    task: 'tasks.view',
    safety: 'safety.view',
  }
  return map[entityType] ?? 'callouts.view'
}

// GET /api/tracker-updates?entity_type=callout&entity_ref=CO-001
// GET /api/tracker-updates?id=123&action=revisions
export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const action = searchParams.get('action')

  if (id && action === 'revisions') {
    const revisions = await getTrackerRevisions(Number(id))
    return NextResponse.json({ success: true, data: revisions })
  }

  const entityType = searchParams.get('entity_type') ?? ''
  const entityRef = searchParams.get('entity_ref') ?? ''

  if (!entityType || !entityRef) {
    return NextResponse.json(
      { success: false, message: 'entity_type and entity_ref are required' },
      { status: 400 },
    )
  }

  if (!can(user, permFor(entityType))) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
  }

  const updates = await getTrackerUpdates(entityType, entityRef)
  return NextResponse.json({ success: true, data: updates })
}

const createSchema = z.object({
  entityType: z.enum(VALID_ENTITY_TYPES),
  entityRef: z.string().min(1).max(50),
  label: z.string().min(1).max(120),
  content: z.string().min(1).max(10000),
  sourceKind: z.string().max(40).optional(),
})

// POST /api/tracker-updates
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 })

  const raw = await request.json().catch(() => null)
  const parsed = createSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Validation failed', errors: parsed.error.flatten() }, { status: 400 })
  }

  if (!can(user, permFor(parsed.data.entityType))) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
  }

  const id = await createTrackerUpdate({
    entityType: parsed.data.entityType,
    entityRef: parsed.data.entityRef,
    label: parsed.data.label,
    content: parsed.data.content,
    sourceKind: parsed.data.sourceKind,
    userId: user.id,
    userName: user.name ?? user.username,
  })

  return NextResponse.json({ success: true, data: { id }, message: 'Description added' }, { status: 201 })
}

const updateSchema = z.object({
  label: z.string().min(1).max(120),
  content: z.string().min(1).max(10000),
})

// PUT /api/tracker-updates?id=123
export async function PUT(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = Number(searchParams.get('id'))
  if (!id) return NextResponse.json({ success: false, message: 'id is required' }, { status: 400 })

  const raw = await request.json().catch(() => null)
  const parsed = updateSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Validation failed', errors: parsed.error.flatten() }, { status: 400 })
  }

  const result = await updateTrackerUpdate(id, {
    label: parsed.data.label,
    content: parsed.data.content,
    userId: user.id,
    userName: user.name ?? user.username,
  })

  if (!result.ok) {
    return NextResponse.json({ success: false, message: result.error ?? 'Update failed' }, { status: result.error === 'Not found' ? 404 : 400 })
  }

  return NextResponse.json({ success: true, message: 'Description updated' })
}

// DELETE /api/tracker-updates?id=123
export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 })
  if (!can(user, 'callouts.update')) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = Number(searchParams.get('id'))
  if (!id) return NextResponse.json({ success: false, message: 'id is required' }, { status: 400 })

  const deleted = await deleteTrackerUpdate(id)
  if (!deleted) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 })

  return NextResponse.json({ success: true, message: 'Description deleted' })
}
