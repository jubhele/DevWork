import { db, schema } from '@/db/client'
import { eq, and, inArray, desc, like, or, sql } from 'drizzle-orm'
import type { Task, TaskCategory, TaskStatus } from '@blackfire/types'

const { bfTasks, bfTaskSequences } = schema

type DbTask = typeof bfTasks.$inferSelect

const TASK_PREFIX: Record<string, string> = {
  admin: 'ADM',
  sales: 'SLS',
  general: 'GEN',
}

function ddmmyy(): string {
  const d = new Date()
  return String(d.getDate()).padStart(2, '0') +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getFullYear()).slice(-2)
}

async function nextTaskRefId(category: string): Promise<string> {
  await db
    .update(bfTaskSequences)
    .set({ lastSeq: sql`${bfTaskSequences.lastSeq} + 1` })
    .where(eq(bfTaskSequences.category, category))

  const [row] = await db
    .select({ n: bfTaskSequences.lastSeq })
    .from(bfTaskSequences)
    .where(eq(bfTaskSequences.category, category))
    .limit(1)

  const n = row?.n ?? 1
  const prefix = TASK_PREFIX[category] ?? category.toUpperCase().slice(0, 3)
  return `${prefix}-${ddmmyy()}-${String(n).padStart(4, '0')}`
}



function d(v: Date | string | null | undefined): string | null {
  if (!v) return null
  return v instanceof Date ? v.toISOString() : String(v)
}

function toTaskType(row: DbTask): Task {
  return {
    id: row.id,
    ref_id: row.refId,
    category: row.category as TaskCategory,
    title: row.title,
    description: row.description ?? null,
    status: row.status as TaskStatus,
    priority: row.priority as Task['priority'],
    assigned_to_user_id: row.assignedToUserId ?? null,
    assigned_to: row.assignedTo ?? null,
    assignee_name: null,
    created_by_user_id: row.createdByUserId,
    created_by: row.createdBy,
    creator_name: null,
    source_callout_ref: row.sourceCalloutRef ?? null,
    due_date: d(row.dueDate),
    start_at: d(row.startAt),
    end_at: d(row.endAt),
    due_at: d(row.dueAt),
    completed_at: d(row.completedAt),
    created_at: d(row.createdAt) ?? '',
    updated_at: d(row.updatedAt) ?? '',
  }
}

export async function getTasks(params?: {
  category?: TaskCategory | TaskCategory[]
  status?: TaskStatus | TaskStatus[]
  search?: string
  dueDate?: string
  limit?: number
  offset?: number
}): Promise<{ data: Task[]; total: number }> {
  const { category, status, search, dueDate, limit = 500, offset = 0 } = params ?? {}

  const conditions = []
  if (category) {
    const cats = Array.isArray(category) ? category : [category]
    conditions.push(inArray(bfTasks.category, cats))
  }
  if (status) {
    const statuses = Array.isArray(status) ? status : [status]
    conditions.push(inArray(bfTasks.status, statuses))
  }
  if (search) {
    conditions.push(
      or(like(bfTasks.title, `%${search}%`), like(bfTasks.refId, `%${search}%`))!
    )
  }
  if (dueDate) {
    conditions.push(sql`DATE(${bfTasks.dueDate}) = ${dueDate}`)
  }

  const where = conditions.length === 0 ? undefined
    : conditions.length === 1 ? conditions[0]
    : and(...conditions)

  const rows = await db
    .select()
    .from(bfTasks)
    .where(where)
    .orderBy(desc(bfTasks.createdAt))
    .limit(limit)
    .offset(offset)

  const [{ count }] = await db
    .select({ count: db.$count(bfTasks, where) })
    .from(bfTasks)

  return { data: rows.map(toTaskType), total: Number(count) }
}

export async function getTask(refIdOrId: string | number): Promise<Task | null> {
  const where = typeof refIdOrId === 'number'
    ? eq(bfTasks.id, refIdOrId)
    : eq(bfTasks.refId, refIdOrId)

  const [row] = await db.select().from(bfTasks).where(where).limit(1)
  return row ? toTaskType(row) : null
}

export async function createTask(
  data: {
    category: TaskCategory
    title: string
    description?: string
    priority?: string
    assignedTo?: string
    assignedToUserId?: number
    sourceCalloutRef?: string
    startAt?: string
    endAt?: string
    dueAt?: string
    dueDate?: string
  },
  createdByUserId: number,
  createdBy: string,
): Promise<number> {
  const refId = await nextTaskRefId(data.category)

  const result = await db.insert(bfTasks).values({
    refId,
    category: data.category,
    title: data.title,
    description: data.description ?? null,
    priority: (data.priority ?? 'Normal') as 'Low' | 'Normal' | 'High' | 'Urgent',
    assignedTo: data.assignedTo ?? null,
    assignedToUserId: data.assignedToUserId,
    sourceCalloutRef: data.sourceCalloutRef ?? null,
    startAt: data.startAt ? new Date(data.startAt) : null,
    endAt: data.endAt ? new Date(data.endAt) : null,
    dueAt: data.dueAt ? new Date(data.dueAt) : null,
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    createdByUserId,
    createdBy,
  })

  return (result as unknown as [{ insertId: number }])[0].insertId
}

export async function updateTask(
  refId: string,
  data: Partial<{
    status: TaskStatus
    priority: string
    assignedTo: string | null
    assignedToUserId: number | null
    startAt: string | null
    endAt: string | null
    dueAt: string | null
    completedAt: string | null
  }>,
): Promise<void> {
  const update: Record<string, unknown> = {}
  if (data.status !== undefined) {
    update.status = data.status
    if (data.status === 'Done') update.completedAt = new Date()
  }
  if (data.priority !== undefined) update.priority = data.priority
  if ('assignedTo' in data) update.assignedTo = data.assignedTo
  if ('assignedToUserId' in data) update.assignedToUserId = data.assignedToUserId
  if ('startAt' in data) update.startAt = data.startAt ? new Date(data.startAt) : null
  if ('endAt' in data) update.endAt = data.endAt ? new Date(data.endAt) : null
  if ('dueAt' in data) update.dueAt = data.dueAt ? new Date(data.dueAt) : null

  if (Object.keys(update).length === 0) return
  await db.update(bfTasks).set(update).where(eq(bfTasks.refId, refId))
}
