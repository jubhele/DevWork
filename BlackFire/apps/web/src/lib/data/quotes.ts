import { db, schema } from '@/db/client'
import { eq, and, like, desc, or } from 'drizzle-orm'
import type { Quote, QuoteItem } from '@blackfire/types'
import { nextRefId } from './counters'

const { bfQuotes, bfQuoteItems } = schema

type DbQuote = typeof bfQuotes.$inferSelect
type DbQuoteItem = typeof bfQuoteItems.$inferSelect

function d(v: Date | string | null | undefined): string | null {
  if (!v) return null
  return v instanceof Date ? v.toISOString() : String(v)
}

function toQuoteItemType(row: DbQuoteItem): QuoteItem {
  const qty = Number(row.qty)
  const unit = Number(row.unitPrice)
  return {
    id: row.id,
    quote_id: row.quoteId,
    description: row.description,
    qty,
    unit_price: unit,
    total: qty * unit,
  }
}

function toQuoteType(row: DbQuote, items: QuoteItem[] = []): Quote {
  const total = Number(row.totalAmount)
  return {
    id: row.id,
    quote_number: row.quoteNo || row.refId,
    client_id: row.clientId ?? 0,
    client_name: row.clientName,
    callout_id: row.calloutId ?? null,
    status: row.status as Quote['status'],
    subtotal: total,
    tax: 0,
    total,
    valid_until: d(row.validUntil) ?? '',
    notes: row.notes ?? null,
    items,
    created_by: String(row.submittedByUserId ?? ''),
    created_at: d(row.createdAt) ?? '',
  }
}

export async function getQuotes(params?: {
  search?: string
  status?: string
  clientId?: number
  limit?: number
  offset?: number
}): Promise<{ data: Quote[]; total: number }> {
  const { search, status, clientId, limit = 500, offset = 0 } = params ?? {}

  const conditions = []
  if (status) conditions.push(eq(bfQuotes.status, status))
  if (clientId) conditions.push(eq(bfQuotes.clientId, clientId))
  if (search) {
    conditions.push(
      or(
        like(bfQuotes.clientName, `%${search}%`),
        like(bfQuotes.refId, `%${search}%`),
      )!
    )
  }

  const where = conditions.length === 0 ? undefined
    : conditions.length === 1 ? conditions[0]
    : and(...conditions)

  const rows = await db
    .select()
    .from(bfQuotes)
    .where(where)
    .orderBy(desc(bfQuotes.createdAt))
    .limit(limit)
    .offset(offset)

  const [{ count }] = await db
    .select({ count: db.$count(bfQuotes, where) })
    .from(bfQuotes)

  return { data: rows.map(r => toQuoteType(r)), total: Number(count) }
}

export async function getQuote(id: number): Promise<Quote | null> {
  const [row] = await db
    .select()
    .from(bfQuotes)
    .where(eq(bfQuotes.id, id))
    .limit(1)

  if (!row) return null

  const itemRows = await db
    .select()
    .from(bfQuoteItems)
    .where(eq(bfQuoteItems.quoteId, id))

  return toQuoteType(row, itemRows.map(toQuoteItemType))
}

export async function createQuote(
  data: {
    clientId?: number
    clientName: string
    clientEmail?: string
    calloutId?: number
    calloutRef?: string
    notes?: string
    validUntil?: string
    items: { description: string; qty: number; unitPrice: number }[]
  },
  submittedByUserId: number,
): Promise<number> {
  const refId = await nextRefId('q')
  const totalAmount = data.items.reduce((s, i) => s + i.qty * i.unitPrice, 0)

  const result = await db.insert(bfQuotes).values({
    refId,
    clientId: data.clientId,
    clientName: data.clientName,
    clientEmail: data.clientEmail ?? '',
    calloutId: data.calloutId,
    calloutRef: data.calloutRef ?? '',
    notes: data.notes ?? '',
    validUntil: data.validUntil ? new Date(data.validUntil) : null,
    totalAmount: String(totalAmount),
    submittedByUserId,
  })

  const quoteId = (result as unknown as [{ insertId: number }])[0].insertId

  if (data.items.length) {
    await db.insert(bfQuoteItems).values(
      data.items.map(i => ({
        quoteId,
        description: i.description,
        qty: String(i.qty),
        unitPrice: String(i.unitPrice),
      }))
    )
  }

  return quoteId
}
