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
  status_breakdown: { status: string; count: number; amount: number }[]
  monthly_trend: { month: string; invoiced: number; collected: number }[]
  client_breakdown: { client: string; amount: number; outstanding: number; invoice_count: number }[]
  ledger_summary: {
    net_balance: number
    total_credits: number
    total_debits: number
    payments_received: number
    transaction_count: number
  }
  ledger_trend: { month: string; credits: number; debits: number }[]
  ledger_transactions: {
    id: number
    trans_date: string
    reference: string
    callout_ref: string
    description: string
    category: string
    credit: number
    debit: number
  }[]
  ledger_categories: { category: string; credits: number; debits: number; count: number }[]
  recent_invoices: {
    invoice_no: string
    ref_id: string
    client_name: string
    status: string
    due_date: string
    amount: number
  }[]
}

function startOfMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

function today(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function resultRows<T>(result: unknown): T[] {
  if (!Array.isArray(result)) return []
  return Array.isArray(result[0]) ? result[0] as T[] : result as T[]
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

    const aging = resultRows<{ band: string; amount: string }>(agingRows).map(r => ({
      band: r.band,
      amount: parseFloat(r.amount) || 0,
    }))

    const statusRows = await db.execute(sql`
      SELECT
        status,
        COUNT(*) AS count,
        COALESCE(SUM(amount), 0) AS amount
      FROM bf_invoices
      GROUP BY status
      ORDER BY FIELD(status, 'Paid', 'Sent', 'Overdue', 'Draft', 'Cancelled')
    `)

    const trendRows = await db.execute(sql`
      SELECT
        DATE_FORMAT(m.month_start, '%b %Y') AS month,
        COALESCE(inv.total, 0) AS invoiced,
        COALESCE(pay.total, 0) AS collected
      FROM (
        SELECT DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%Y-%m-01') AS month_start
        UNION ALL SELECT DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 4 MONTH), '%Y-%m-01')
        UNION ALL SELECT DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 3 MONTH), '%Y-%m-01')
        UNION ALL SELECT DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m-01')
        UNION ALL SELECT DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
        UNION ALL SELECT DATE_FORMAT(CURDATE(), '%Y-%m-01')
      ) m
      LEFT JOIN (
        SELECT DATE_FORMAT(invoice_date, '%Y-%m-01') AS month_start, SUM(amount) AS total
        FROM bf_invoices
        WHERE invoice_date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%Y-%m-01')
        GROUP BY DATE_FORMAT(invoice_date, '%Y-%m-01')
      ) inv ON inv.month_start = m.month_start
      LEFT JOIN (
        SELECT DATE_FORMAT(payment_date, '%Y-%m-01') AS month_start, SUM(amount) AS total
        FROM bf_payments
        WHERE payment_date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%Y-%m-01')
        GROUP BY DATE_FORMAT(payment_date, '%Y-%m-01')
      ) pay ON pay.month_start = m.month_start
      ORDER BY m.month_start
    `)

    const clientRows = await db.execute(sql`
      SELECT
        COALESCE(NULLIF(client_name, ''), 'Unassigned') AS client,
        COALESCE(SUM(amount), 0) AS amount,
        COALESCE(SUM(CASE WHEN status IN ('Draft', 'Sent', 'Overdue') THEN amount ELSE 0 END), 0) AS outstanding,
        COUNT(*) AS invoice_count
      FROM bf_invoices
      WHERE invoice_date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%Y-%m-01')
      GROUP BY COALESCE(NULLIF(client_name, ''), 'Unassigned')
      ORDER BY amount DESC
      LIMIT 6
    `)

    const recentRows = await db.execute(sql`
      SELECT
        COALESCE(NULLIF(invoice_no, ''), ref_id) AS invoice_no,
        ref_id,
        client_name,
        status,
        due_date,
        amount
      FROM bf_invoices
      ORDER BY due_date ASC, invoice_date DESC
      LIMIT 8
    `)

    const ledgerTotalsResult = await db.execute(sql`
      SELECT
        COALESCE(SUM(credit), 0) AS total_credits,
        COALESCE(SUM(debit), 0) AS total_debits,
        COALESCE(SUM(CASE WHEN category = 'Invoice Payment' OR credit > 0 THEN credit ELSE 0 END), 0) AS payments_received,
        COUNT(*) AS transaction_count
      FROM bf_transactions
    `)

    const ledgerTrendRows = await db.execute(sql`
      SELECT
        DATE_FORMAT(m.month_start, '%b %Y') AS month,
        COALESCE(tx.credits, 0) AS credits,
        COALESCE(tx.debits, 0) AS debits
      FROM (
        SELECT DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%Y-%m-01') AS month_start
        UNION ALL SELECT DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 4 MONTH), '%Y-%m-01')
        UNION ALL SELECT DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 3 MONTH), '%Y-%m-01')
        UNION ALL SELECT DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m-01')
        UNION ALL SELECT DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
        UNION ALL SELECT DATE_FORMAT(CURDATE(), '%Y-%m-01')
      ) m
      LEFT JOIN (
        SELECT
          DATE_FORMAT(trans_date, '%Y-%m-01') AS month_start,
          SUM(credit) AS credits,
          SUM(debit) AS debits
        FROM bf_transactions
        WHERE trans_date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%Y-%m-01')
        GROUP BY DATE_FORMAT(trans_date, '%Y-%m-01')
      ) tx ON tx.month_start = m.month_start
      ORDER BY m.month_start
    `)

    const ledgerTransactionRows = await db.execute(sql`
      SELECT
        id,
        trans_date,
        reference,
        callout_ref,
        description,
        category,
        credit,
        debit
      FROM bf_transactions
      ORDER BY trans_date DESC, id DESC
      LIMIT 10
    `)

    const ledgerCategoryRows = await db.execute(sql`
      SELECT
        COALESCE(NULLIF(category, ''), 'Uncategorised') AS category,
        COALESCE(SUM(credit), 0) AS credits,
        COALESCE(SUM(debit), 0) AS debits,
        COUNT(*) AS count
      FROM bf_transactions
      GROUP BY COALESCE(NULLIF(category, ''), 'Uncategorised')
      ORDER BY GREATEST(COALESCE(SUM(credit), 0), COALESCE(SUM(debit), 0)) DESC
      LIMIT 6
    `)

    const [ledgerTotalRow] = resultRows<{
      total_credits: string
      total_debits: string
      payments_received: string
      transaction_count: number
    }>(ledgerTotalsResult)
    const totalCredits = parseFloat(ledgerTotalRow?.total_credits ?? '0') || 0
    const totalDebits = parseFloat(ledgerTotalRow?.total_debits ?? '0') || 0

    return {
      mtd_invoiced:       parseFloat(invoicedRow.total) || 0,
      mtd_collected:      parseFloat(collectedRow.total) || 0,
      outstanding_balance: parseFloat(outstandingRow.total) || 0,
      overdue_amount:     parseFloat(String(overdueRows[0]?.total ?? '0')) || 0,
      overdue_count:      Number(overdueRows[0]?.cnt ?? 0),
      aging,
      status_breakdown: resultRows<{ status: string; count: number; amount: string }>(statusRows).map(r => ({
        status: r.status,
        count: Number(r.count) || 0,
        amount: parseFloat(r.amount) || 0,
      })),
      monthly_trend: resultRows<{ month: string; invoiced: string; collected: string }>(trendRows).map(r => ({
        month: r.month,
        invoiced: parseFloat(r.invoiced) || 0,
        collected: parseFloat(r.collected) || 0,
      })),
      client_breakdown: resultRows<{ client: string; amount: string; outstanding: string; invoice_count: number }>(clientRows).map(r => ({
        client: r.client,
        amount: parseFloat(r.amount) || 0,
        outstanding: parseFloat(r.outstanding) || 0,
        invoice_count: Number(r.invoice_count) || 0,
      })),
      ledger_summary: {
        net_balance: totalCredits - totalDebits,
        total_credits: totalCredits,
        total_debits: totalDebits,
        payments_received: parseFloat(ledgerTotalRow?.payments_received ?? '0') || 0,
        transaction_count: Number(ledgerTotalRow?.transaction_count ?? 0),
      },
      ledger_trend: resultRows<{ month: string; credits: string; debits: string }>(ledgerTrendRows).map(r => ({
        month: r.month,
        credits: parseFloat(r.credits) || 0,
        debits: parseFloat(r.debits) || 0,
      })),
      ledger_transactions: resultRows<{ id: number; trans_date: string; reference: string; callout_ref: string; description: string; category: string; credit: string; debit: string }>(ledgerTransactionRows).map(r => ({
        id: Number(r.id),
        trans_date: r.trans_date,
        reference: r.reference,
        callout_ref: r.callout_ref,
        description: r.description,
        category: r.category,
        credit: parseFloat(r.credit) || 0,
        debit: parseFloat(r.debit) || 0,
      })),
      ledger_categories: resultRows<{ category: string; credits: string; debits: string; count: number }>(ledgerCategoryRows).map(r => ({
        category: r.category,
        credits: parseFloat(r.credits) || 0,
        debits: parseFloat(r.debits) || 0,
        count: Number(r.count) || 0,
      })),
      recent_invoices: resultRows<{ invoice_no: string; ref_id: string; client_name: string; status: string; due_date: string; amount: string }>(recentRows).map(r => ({
        invoice_no: r.invoice_no,
        ref_id: r.ref_id,
        client_name: r.client_name,
        status: r.status,
        due_date: r.due_date,
        amount: parseFloat(r.amount) || 0,
      })),
    }
  } catch (err) {
    console.error('[finance] getFinanceSummary failed:', err)
    return null
  }
}
