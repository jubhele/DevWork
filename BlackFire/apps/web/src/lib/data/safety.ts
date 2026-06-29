import { db, schema } from '@/db/client'
import { eq, and, inArray, desc, sql } from 'drizzle-orm'
import type { SafetyFile } from '@blackfire/types'
import { nextRefId } from './counters'

const { bfSafetyFiles } = schema

type DbSafetyFile = typeof bfSafetyFiles.$inferSelect

function d(v: Date | string | null | undefined): string | null {
  if (!v) return null
  return v instanceof Date ? v.toISOString() : String(v)
}

function toSafetyFileType(row: DbSafetyFile): SafetyFile {
  return {
    id: row.id,
    ref_id: row.refId,
    client_id: 0,
    client_name: row.contractor,
    site: row.region,
    status: row.status as SafetyFile['status'],
    score: parseFloat(String(row.score ?? '0')) || 0,
    total_items: 0,
    score_percent: parseFloat(String(row.score ?? '0')) || 0,
    compliance_level: 'RED' as SafetyFile['compliance_level'],
    submitted_by: null,
    approved_by: null,
    submitted_at: null,
    approved_at: d(row.signOffDate),
    created_at: d(row.createdAt) ?? '',
  }
}

// Filter value → DB status mapping
const FILTER_STATUS: Record<string, string> = {
  compliant: 'Approved',
  expiring:  'Submitted',
  expired:   'In Progress',
}

export async function getSafetyFiles(params?: {
  filter?: string
  limit?: number
  offset?: number
}): Promise<SafetyFile[]> {
  const { filter, limit = 500, offset = 0 } = params ?? {}

  const conditions = [eq(bfSafetyFiles.isActive, 1)]
  if (filter && filter !== 'all') {
    const dbStatus = FILTER_STATUS[filter]
    if (dbStatus) conditions.push(eq(bfSafetyFiles.status, dbStatus as typeof bfSafetyFiles.status._.data))
  }

  const where = conditions.length === 1 ? conditions[0] : and(...conditions)

  const rows = await db
    .select()
    .from(bfSafetyFiles)
    .where(where)
    .orderBy(desc(bfSafetyFiles.createdAt))
    .limit(limit)
    .offset(offset)

  return rows.map(toSafetyFileType)
}

export async function createSafetyFile(
  data: {
    clientName: string
    site: string
    auditDate: string
    auditorName?: string | null
    notes?: string | null
  },
  createdByUsername: string,
): Promise<string> {
  const refId = await nextRefId('saf')
  await db.insert(bfSafetyFiles).values({
    refId,
    contractor:   data.clientName,
    region:       data.site,
    auditDate:    data.auditDate ? sql`${data.auditDate}` : undefined,
    auditorName:  data.auditorName ?? '',
    scopeOfWork:  data.notes ?? undefined,
    status:       'Draft',
    createdBy:    createdByUsername,
    updatedBy:    createdByUsername,
  })
  return refId
}
