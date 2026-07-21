import { db, schema } from '@/db/client'
import { desc, eq } from 'drizzle-orm'
import type { ScheduledStatement } from '@blackfire/types'

const { bfStatements, bfCompanyProfiles } = schema

function value(value: Date | string | null): string | null {
  if (value == null) return null
  return value instanceof Date ? value.toISOString() : String(value)
}

export async function getStatements(): Promise<ScheduledStatement[]> {
  const rows = await db.select({
    statement: bfStatements,
    companyName: bfCompanyProfiles.displayName,
  }).from(bfStatements)
    .leftJoin(bfCompanyProfiles, eq(bfCompanyProfiles.id, bfStatements.companyProfileId))
    .orderBy(desc(bfStatements.createdAt))

  return rows.map(({ statement, companyName }) => ({
    id: statement.id,
    ref_id: statement.refId,
    company_profile_id: statement.companyProfileId,
    company_name: companyName || 'Issuing company',
    scheduled_for: value(statement.scheduledFor) ?? '',
    status: statement.status,
    from_email: statement.fromEmail,
    to_emails: statement.toEmails,
    invoice_refs: statement.invoiceRefs,
    total_outstanding: Number(statement.totalOutstanding),
    released_by: '',
    released_at: value(statement.releasedAt),
    created_at: value(statement.createdAt) ?? '',
  }))
}
