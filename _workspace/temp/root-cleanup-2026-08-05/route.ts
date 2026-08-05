import { NextResponse } from 'next/server'
import { getCurrentUser, can } from '@/lib/server-auth'
import { getTasks, getTask, createTask, updateTask } from '@/lib/data/tasks'
import type { TaskCategory, TaskStatus } from '@blackfire/types'
import { z } from 'zod'

// GET /api/tasks[?id=…&category=…&status=…&search=…&limit=…&offset=…]
export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 })
  if (!can(user, 'task.view')) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (id) {
    const task = await getTask(id.match(/^\d+$/) ? Number(id) : id)
    if (!task) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: task })
  }

  const category = searchParams.get('category') as TaskCategory | null
  const status = searchParams.get('status')

  const result = await getTasks({
    category: category ?? undefined,
    status: status ? (status as TaskStatus) : undefined,
    search: searchParams.get('search') ?? undefined,
    limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
    offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined,
  })

  return NextResponse.json({ success: true, data: result.data, total: result.total })
}

const createSchema = z.object({
  category: z.enum(['admin', 'sales', 'general']),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  priority: z.enum(['Low', 'Normal', 'High', 'Urgent']).optional().default('Normal'),
  assigned_to: z.string().max(100).nullable().optional(),
  assigned_to_user_id: z.number().int().positive().nullable().optional(),
  source_callout_ref: z.string().max(20).nullable().optional(),
  start_at: z.string().nullable().optional(),
  end_at: z.string().nullable().optional(),
  due_at: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
})

// POST /api/tasks
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 })
  if (!can(user, 'task.create')) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Invalid input', errors: parsed.error.flatten() }, { status: 400 })
  }

  const { data } = parsed
  const id = await createTask(
    {
      category: data.category,
      title: data.title,
      description: data.description,
      priority: data.priority,
      assignedTo: data.assigned_to ?? undefined,
      assignedToUserId: data.assigned_to_user_id ?? undefined,
      sourceCalloutRef: data.source_callout_ref ?? undefined,
      startAt: data.start_at ?? undefined,
      endAt: data.end_at ?? undefined,
      dueAt: data.due_at ?? undefined,
      dueDate: data.due_date ?? undefined,
    },
    user.id,
    user.username,
  )
  const task = await getTask(id)
  return NextResponse.json({ success: true, message: 'Task created', data: task }, { status: 201 })
}

const updateSchema = z.object({
  id: z.string(),
  status: z.enum(['Open', 'In Progress', 'Done', 'Cancelled']).optional(),
  priority: z.enum(['Low', 'Normal', 'High', 'Urgent']).optional(),
  assigned_to: z.string().max(100).nullable().optional(),
  assigned_to_user_id: z.number().int().positive().nullable().optional(),
  start_at: z.string().nullable().optional(),
  end_at: z.string().nullable().optional(),
  due_at: z.string().nullable().optional(),
})

// PATCH /api/tasks — update status / fields
export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 })
  if (!can(user, 'task.update')) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Invalid input', errors: parsed.error.flatten() }, { status: 400 })
  }

  const { id, ...rest } = parsed.data
  await updateTask(id, {
    status: rest.status,
    priority: rest.priority,
    assignedTo: rest.assigned_to,
    assignedToUserId: rest.assigned_to_user_id,
    startAt: rest.start_at ?? undefined,
    endAt: rest.end_at ?? undefined,
    dueAt: rest.due_at ?? undefined,
  })
  const task = await getTask(id)
  return NextResponse.json({ success: true, data: task })
}
