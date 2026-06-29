import { db, schema } from '@/db/client'
import { eq, and, like, desc, or } from 'drizzle-orm'
import type { Invoice } from '@blackfire/types'
import { nextRefId } from './counters'

const { bfInvoices } = schema

type DbInvoice = typeof bfInvoices.$inferSelect

function d(v: Date | string | null | undefined): string | null {
  if (!v) return null
  return v instanceof Date ? v.toISOString() : String(v)
}

function toInvoiceType(row: DbInvoice): Invoice {
  const amount = Number(row.amount)
  return {
    id: row.id,
    invoice_number: row.invoiceNo || row.refId,
    client_id: row.clientId ?? 0,
    client_name: row.clientName,
    quote_id: row.quoteId ?? null,
    amount,
    tax: 0,
    total: amount,
    status: row.status as Invoice['status'],
    due_date: d(row.dueDate) ?? '',
    paid_date: d(row.paidDate),
    notes: null,
    created_by: String(row.sentByUserId ?? ''),
    created_at: d(row.createdAt) ?? '',
  }
}

export async function getInvoices(params?: {
  search?: string
  status?: string
  clientId?: number
  limit?: number
  offset?: number
}): Promise<{ data: Invoice[]; total: number }> {
  const { search, status, clientId, limit = 500, offset = 0 } = params ?? {}

  const conditions = []
  if (status) conditions.push(eq(bfInvoices.status, status))
  if (clientId) conditions.push(eq(bfInvoices.clientId, clientId))
  if (search) {
    conditions.push(
      or(
        like(bfInvoices.clientName, `%${search}%`),
        like(bfInvoices.refId, `%${search}%`),
        like(bfInvoices.invoiceNo, `%${search}%`),
      )!
    )
  }

  const where = conditions.length === 0 ? undefined
    : conditions.length === 1 ? conditions[0]
    : and(...conditions)

  const rows = await db
    .select()
    .from(bfInvoices)
    .where(where)
    .orderBy(desc(bfInvoices.createdAt))
    .limit(limit)
    .offset(offset)

  const [{ count }] = await db
    .select({ count: db.$count(bfInvoices, where) })
    .from(bfInvoices)

  return { data: rows.map(toInvoiceType), total: Number(count) }
}

export async function getInvoice(id: number): Promise<Invoice | null> {
  const [row] = await db
    .select()
    .from(bfInvoices)
    .where(eq(bfInvoices.id, id))
    .limit(1)
  return row ? toInvoiceType(row) : null
}

export async function createInvoice(
  data: {
    clientId?: number
    clientName: string
    clientEmail?: string
    amount: number
    dueDate?: string
    quoteId?: number
    quoteRef?: string
    calloutId?: number
    calloutRef?: string
    po?: string
    invoiceDate?: string
  },
  sentByUserId: number,
): Promise<number> {
  const refId = await nextRefId('inv', data.invoiceDate)
  const result = await db.insert(bfInvoices).values({
    refId,
    clientId: data.clientId,
    clientName: data.clientName,
    clientEmail: data.clientEmail ?? '',
    amount: String(data.amount),
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    quoteId: data.quoteId,
    quoteRef: data.quoteRef ?? '',
    calloutId: data.calloutId,
    calloutRef: data.calloutRef ?? '',
    po: data.po ?? '',
    invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
    sentByUserId,
  })
  return (result as unknown as [{ insertId: number }])[0].insertId
}

export async function markInvoicePaid(
  id: number,
  paidDate?: string,
): Promise<void> {
  await db
    .update(bfInvoices)
    .set({ status: 'Paid', paidDate: paidDate ? new Date(paidDate) : new Date() })
    .where(eq(bfInvoices.id, id))
}
