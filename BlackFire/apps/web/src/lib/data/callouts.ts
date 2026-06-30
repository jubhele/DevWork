import { db, schema } from '@/db/client'
import { eq, and, like, desc, or } from 'drizzle-orm'
import type { Callout } from '@blackfire/types'
import { nextRefId } from './counters'

const { bfCallouts } = schema

type DbCallout = typeof bfCallouts.$inferSelect
type CalloutRow = Pick<
  DbCallout,
  | 'id'
  | 'refId'
  | 'clientId'
  | 'clientName'
  | 'service'
  | 'location'
  | 'priority'
  | 'status'
  | 'assignedTo'
  | 'calloutDate'
  | 'calloutTime'
  | 'notes'
  | 'startAt'
  | 'endAt'
  | 'dueAt'
  | 'loggedByUserId'
  | 'createdAt'
  | 'updatedAt'
>

function d(v: Date | string | null | undefined): string | null {
  if (!v) return null
  return v instanceof Date ? v.toISOString() : String(v)
}

function toCalloutType(row: CalloutRow): Callout {
  return {
    id: row.id,
    ref_id: row.refId,
    client_id: row.clientId ?? null,
    client_name: row.clientName,
    service: row.service,
    location: row.location,
    priority: row.priority as Callout['priority'],
    status: row.status as Callout['status'],
    assigned_to: row.assignedTo || null,
    callout_date: d(row.calloutDate) ?? '',
    callout_time: row.calloutTime || null,
    notes: row.notes ?? null,
    start_at: d(row.startAt),
    end_at: d(row.endAt),
    due_at: d(row.dueAt),
    created_by: String(row.loggedByUserId ?? ''),
    created_at: d(row.createdAt) ?? '',
    updated_at: d(row.updatedAt) ?? '',
  }
}

export async function getCallouts(params?: {
  search?: string
  status?: string
  priorities?: string[]
  clientId?: number
  limit?: number
  offset?: number
}): Promise<{ data: Callout[]; total: number }> {
  const { search, status, priorities, clientId, limit = 500, offset = 0 } = params ?? {}
  const priorityLike = priorities?.map((p) => `%${p}%`) ?? []

  const buildWhere = (includeIsActive: boolean) => {
    const conditions = []
    if (includeIsActive) {
      conditions.push(eq(bfCallouts.isActive, 1))
    }
    if (status) conditions.push(eq(bfCallouts.status, status))
    if (priorityLike.length) {
      const priorityConditions = priorityLike.map((pattern) => like(bfCallouts.priority, pattern))
      conditions.push(or(...priorityConditions)!)
    }
    if (clientId) conditions.push(eq(bfCallouts.clientId, clientId))
    if (search) {
      conditions.push(
        or(
          like(bfCallouts.clientName, `%${search}%`),
          like(bfCallouts.service, `%${search}%`),
          like(bfCallouts.refId, `%${search}%`),
        )!
      )
    }

    if (conditions.length === 0) {
      return undefined
    }
    return conditions.length === 1 ? conditions[0] : and(...conditions)
  }

  const runQuery = async (includeIsActive: boolean) => {
    const where = buildWhere(includeIsActive)
    const selectColumns = {
      id: bfCallouts.id,
      refId: bfCallouts.refId,
      clientId: bfCallouts.clientId,
      clientName: bfCallouts.clientName,
      service: bfCallouts.service,
      location: bfCallouts.location,
      priority: bfCallouts.priority,
      status: bfCallouts.status,
      assignedTo: bfCallouts.assignedTo,
      calloutDate: bfCallouts.calloutDate,
      calloutTime: bfCallouts.calloutTime,
      notes: bfCallouts.notes,
      startAt: bfCallouts.startAt,
      endAt: bfCallouts.endAt,
      dueAt: bfCallouts.dueAt,
      loggedByUserId: bfCallouts.loggedByUserId,
      createdAt: bfCallouts.createdAt,
      updatedAt: bfCallouts.updatedAt,
    }
    const rows = await db
      .select(selectColumns)
      .from(bfCallouts)
      .where(where)
      .orderBy(desc(bfCallouts.createdAt))
      .limit(limit)
      .offset(offset)

    const [{ count }] = await db
      .select({ count: db.$count(bfCallouts, where) })
      .from(bfCallouts)

    return { data: rows.map(toCalloutType), total: Number(count) }
  }

  try {
    return await runQuery(true)
  } catch (error) {
    if (error instanceof Error) {
      return runQuery(false)
    }
    throw error
  }
}

export async function getCallout(id: number): Promise<Callout | null> {
  const [row] = await db
    .select()
    .from(bfCallouts)
    .where(eq(bfCallouts.id, id))
    .limit(1)
  return row ? toCalloutType(row) : null
}

export async function createCallout(
  data: {
    clientId?: number
    clientName: string
    clientEmail?: string
    service: string
    location: string
    tech?: string
    priority?: string
    calloutDate?: string
    calloutTime?: string
    notes?: string
    po?: string
  },
  loggedByUserId: number,
): Promise<number> {
  const refId = await nextRefId('co', data.calloutDate)
  const result = await db.insert(bfCallouts).values({
    refId,
    clientId: data.clientId,
    clientName: data.clientName,
    clientEmail: data.clientEmail ?? '',
    service: data.service,
    location: data.location,
    tech: data.tech ?? '',
    assignedTo: '',
    priority: (data.priority ?? 'Normal') as 'Low' | 'Normal' | 'High' | 'Critical',
    calloutDate: data.calloutDate ? new Date(data.calloutDate) : new Date(),
    calloutTime: data.calloutTime ?? '',
    notes: data.notes ?? '',
    po: data.po ?? '',
    loggedByUserId,
  })
  return (result as unknown as [{ insertId: number }])[0].insertId
}

export async function updateCalloutStatus(
  id: number,
  status: string,
): Promise<void> {
  await db
    .update(bfCallouts)
    .set({ status })
    .where(eq(bfCallouts.id, id))
}
