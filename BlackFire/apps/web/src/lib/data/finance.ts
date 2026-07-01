import { db, schema } from '@/db/client'
import { sql, and, notInArray, inArray } from 'drizzle-orm'

const { bfInvoices, bfPayments } = schema

export interface FinanceSummary {
  mtd_invoiced: number
  mtd_collected: number
  outstanding_balance: number
  overdue_amount: number
  overdue_count: number
  aging: { band: string; amount: number }[]
}

function startOfMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

function today(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export async function getFinanceSummary(): Promise<FinanceSummary | null> {
  try {
    const monthStart = startOfMonth()
    const todayStr = today()

    const [invoicedRow] = await db
      .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
      .from(bfInvoices)
      .where(sql`${bfInvoices.invoiceDate} >= ${monthStart}`)

    const [collectedRow] = await db
      .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
      .from(bfPayments)
      .where(sql`${bfPayments.paymentDate} >= ${monthStart}`)

    const [outstandingRow] = await db
      .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
      .from(bfInvoices)
      .where(inArray(bfInvoices.status, ['Draft', 'Sent', 'Overdue']))

    const overdueRows = await db
      .select({
        total: sql<string>`COALESCE(SUM(amount), 0)`,
        cnt: sql<number>`COUNT(*)`,
      })
      .from(bfInvoices)
      .where(
        and(
          sql`${bfInvoices.dueDate} < ${todayStr}`,
          notInArray(bfInvoices.status, ['Paid', 'Cancelled']),
        ),
      )

    // Aging buckets based on days overdue
    const agingRows = await db.execute(sql`
      SELECT
        CASE
          WHEN DATEDIFF(CURDATE(), due_date) BETWEEN 1 AND 30  THEN '0-30 days'
          WHEN DATEDIFF(CURDATE(), due_date) BETWEEN 31 AND 60 THEN '31-60 days'
          WHEN DATEDIFF(CURDATE(), due_date) BETWEEN 61 AND 90 THEN '61-90 days'
          WHEN DATEDIFF(CURDATE(), due_date) > 90              THEN '90+ days'
          ELSE 'Current'
        END AS band,
        COALESCE(SUM(amount), 0) AS amount
      FROM bf_invoices
      WHERE
        due_date < CURDATE()
        AND status NOT IN ('Paid', 'Cancelled', 'Written Off')
      GROUP BY band
      ORDER BY FIELD(band, '0-30 days', '31-60 days', '61-90 days', '90+ days')
    `)

    const aging = (agingRows as unknown as Array<{ band: string; amount: string }>).map(r => ({
      band: r.band,
      amount: parseFloat(r.amount) || 0,
    }))

    return {
      mtd_invoiced:       parseFloat(invoicedRow.total) || 0,
      mtd_collected:      parseFloat(collectedRow.total) || 0,
      outstanding_balance: parseFloat(outstandingRow.total) || 0,
      overdue_amount:     parseFloat(String(overdueRows[0]?.total ?? '0')) || 0,
      overdue_count:      Number(overdueRows[0]?.cnt ?? 0),
      aging,
    }
  } catch (err) {
    console.error('[finance] getFinanceSummary failed:', err)
    return null
  }
}
