import { eq, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { bfCounters } from '@/db/schema'

// Port of next_ref_id() from includes/db.php.
// Produces [TYPE]-[ddmmyy]-[counter], e.g. CO-190526-0042.
const PREFIX: Record<string, string> = {
  co: 'CO',
  q: 'Q',
  inv: 'INV',
  stmt: 'STMT',
  saf: 'SAF',
}

function ddmmyy(date?: string): string {
  const d = date ? new Date(date) : new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(-2)
  return `${dd}${mm}${yy}`
}

export async function nextRefId(type: string, date?: string): Promise<string> {
  await db
    .update(bfCounters)
    .set({ currentValue: sql`${bfCounters.currentValue} + 1` })
    .where(eq(bfCounters.counterType, type))

  const [row] = await db
    .select({ value: bfCounters.currentValue })
    .from(bfCounters)
    .where(eq(bfCounters.counterType, type))
    .limit(1)

  const n = row?.value ?? 1
  const prefix = PREFIX[type] ?? type.toUpperCase()
  return `${prefix}-${ddmmyy(date)}-${String(n).padStart(4, '0')}`
}
