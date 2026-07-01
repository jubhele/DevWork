import { NextResponse } from 'next/server'
import { getCurrentUser, can } from '@/lib/server-auth'
import { getQuotes, getQuote, createQuote } from '@/lib/data/quotes'
import type { QuoteStatus } from '@blackfire/types'
import { z } from 'zod'

// GET /api/quotes[?id=…&status=…&clientId=…&search=…&limit=…&offset=…]
export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 })
  if (!can(user, 'quotes.view')) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (id) {
    const quote = await getQuote(Number(id))
    if (!quote) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: quote })
  }

  const result = await getQuotes({
    search: searchParams.get('search') ?? undefined,
    status: (searchParams.get('status') ?? undefined) as QuoteStatus | undefined,
    clientId: searchParams.get('clientId') ? Number(searchParams.get('clientId')) : undefined,
    limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
    offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined,
  })

  return NextResponse.json({ success: true, data: result.data, total: result.total })
}

const quoteItemSchema = z.object({
  description: z.string().min(1).max(500),
  qty: z.number().positive(),
  unitPrice: z.number().min(0),
})

const createSchema = z.object({
  clientId: z.number().int().positive().optional(),
  clientName: z.string().min(1).max(255),
  clientEmail: z.string().email().or(z.literal('')).optional().default(''),
  calloutId: z.number().int().positive().optional(),
  calloutRef: z.string().max(30).optional().default(''),
  notes: z.string().optional(),
  validUntil: z.string().optional(),
  items: z.array(quoteItemSchema).min(1),
})

// POST /api/quotes
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 })
  if (!can(user, 'quotes.create')) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Invalid input', errors: parsed.error.flatten() }, { status: 400 })
  }

  const id = await createQuote(parsed.data, user.id)
  const quote = await getQuote(id)
  return NextResponse.json({ success: true, message: 'Quote created', data: quote }, { status: 201 })
}
