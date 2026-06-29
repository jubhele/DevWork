import { db, schema } from '@/db/client'
import { sql, like, or } from 'drizzle-orm'

const { bfTransactions } = schema

export interface Transaction {
  id: number
  transDate: string
  description: string
  category: string
  reference: string
  credit: string
  debit: string
  createdAt: Date
}

export interface TransactionListResult {
  data: Transaction[]
  total: number
  totalCredit: number
  totalDebit: number
}

export async function getTransactions(params?: {
  search?: string
  limit?: number
  offset?: number
}): Promise<TransactionListResult> {
  const limit = params?.limit ?? 50
  const offset = params?.offset ?? 0
  const search = params?.search?.trim()

  const whereClause = search
    ? sql`WHERE (description LIKE ${`%${search}%`} OR category LIKE ${`%${search}%`} OR reference LIKE ${`%${search}%`})`
    : sql``

  const [countRow] = await db.execute<{ n: number }>(
    sql`SELECT COUNT(*) AS n FROM bf_transactions ${whereClause}`,
  )
  const [totalsRow] = await db.execute<{ total_credit: string; total_debit: string }>(
    sql`SELECT COALESCE(SUM(credit),0) AS total_credit, COALESCE(SUM(debit),0) AS total_debit FROM bf_transactions ${whereClause}`,
  )

  const rows = await db.execute<Transaction>(
    sql`SELECT id, trans_date AS transDate, description, category, reference, credit, debit, created_at AS createdAt
        FROM bf_transactions ${whereClause}
        ORDER BY trans_date DESC
        LIMIT ${limit} OFFSET ${offset}`,
  )

  return {
    data: rows as unknown as Transaction[],
    total: Number((countRow as unknown as { n: number }).n ?? 0),
    totalCredit: parseFloat(String((totalsRow as unknown as { total_credit: string }).total_credit ?? '0')) || 0,
    totalDebit: parseFloat(String((totalsRow as unknown as { total_debit: string }).total_debit ?? '0')) || 0,
  }
}

export async function createTransaction(data: {
  transDate: string
  description: string
  category: string
  reference?: string
  credit?: number
  debit?: number
}): Promise<number> {
  const result = await db.insert(bfTransactions).values({
    transDate: new Date(data.transDate),
    description: data.description,
    category: data.category,
    reference: data.reference ?? '',
    credit: String(data.credit ?? 0),
    debit: String(data.debit ?? 0),
  })
  return (result[0] as unknown as { insertId: number }).insertId
}
