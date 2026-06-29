import { db, schema } from '@/db/client'
import { desc, sql } from 'drizzle-orm'

const { bfAuditLog } = schema

type DbAuditEntry = typeof bfAuditLog.$inferSelect

export interface AuditEntry {
  id: number
  username: string
  action: string
  entity_type: string | null
  entity_ref: string | null
  detail: string | null
  ip: string | null
  created_at: string
}

function toAuditEntry(row: DbAuditEntry): AuditEntry {
  return {
    id: row.id,
    username: row.username,
    action: row.action,
    entity_type: null,
    entity_ref: null,
    detail: row.detail || null,
    ip: row.ipAddress || null,
    created_at: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  }
}

const PAGE_SIZE = 100

export async function getAuditLog(page: number): Promise<{ data: AuditEntry[]; total: number }> {
  const offset = (page - 1) * PAGE_SIZE

  const rows = await db
    .select()
    .from(bfAuditLog)
    .orderBy(desc(bfAuditLog.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset)

  const [{ total }] = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(bfAuditLog)

  return { data: rows.map(toAuditEntry), total: Number(total) }
}
