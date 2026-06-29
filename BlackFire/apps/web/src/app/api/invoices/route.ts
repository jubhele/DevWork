import { NextResponse } from 'next/server'
import { getCurrentUser, can } from '@/lib/server-auth'
import { getInvoices, getInvoice, createInvoice, markInvoicePaid } from '@/lib/data/invoices'
import { z } from 'zod'

// GET /api/invoices[?id=…&status=…&clientId=…&search=…&limit=…&offset=…]
export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 })
  if (!can(user, 'invoices.view')) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (id) {
    const invoice = await getInvoice(Number(id))
    if (!invoice) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: invoice })
  }

  const result = await getInvoices({
    search: searchParams.get('search') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    clientId: searchParams.get('clientId') ? Number(searchParams.get('clientId')) : undefined,
    limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
    offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined,
  })

  return NextResponse.json({ success: true, data: result.data, total: result.total })
}

const createSchema = z.object({
  clientId: z.number().int().positive().optional(),
  clientName: z.string().min(1).max(255),
  clientEmail: z.string().email().or(z.literal('')).optional().default(''),
  amount: z.number().min(0),
  dueDate: z.string().optional(),
  quoteId: z.number().int().positive().optional(),
  quoteRef: z.string().max(30).optional().default(''),
  calloutId: z.number().int().positive().optional(),
  calloutRef: z.string().max(30).optional().default(''),
  po: z.string().max(50).optional().default(''),
  invoiceDate: z.string().optional(),
})

// POST /api/invoices
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 })
  if (!can(user, 'invoices.create')) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Invalid input', errors: parsed.error.flatten() }, { status: 400 })
  }

  const id = await createInvoice(parsed.data, user.id)
  const invoice = await getInvoice(id)
  return NextResponse.json({ success: true, message: 'Invoice created', data: invoice }, { status: 201 })
}

const paidSchema = z.object({
  id: z.number().int().positive(),
  paidDate: z.string().optional(),
})

// PATCH /api/invoices — mark paid
export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 })
  if (!can(user, 'invoices.update')) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const parsed = paidSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Invalid input', errors: parsed.error.flatten() }, { status: 400 })
  }

  await markInvoicePaid(parsed.data.id, parsed.data.paidDate)
  const invoice = await getInvoice(parsed.data.id)
  return NextResponse.json({ success: true, data: invoice })
}
