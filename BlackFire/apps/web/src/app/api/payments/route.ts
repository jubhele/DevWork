import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser, can } from '@/lib/server-auth'
import { db, schema } from '@/db/client'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const { bfPayments, bfInvoices } = schema

const PaymentBody = z.object({
  invoice_id:   z.coerce.number().int().positive(),
  amount:       z.coerce.number().positive(),
  method:       z.string().max(50).optional(),
  reference:    z.string().max(100).optional().nullable(),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes:        z.string().max(1000).optional().nullable(),
})

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 })
  if (!can(user, 'invoices.update')) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })

  const raw = await req.json().catch(() => null)
  const parsed = PaymentBody.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Validation failed', errors: parsed.error.flatten() }, { status: 400 })
  }

  const { invoice_id, amount, method, reference, payment_date, notes } = parsed.data

  // Lookup invoice
  const [invoice] = await db
    .select({ id: bfInvoices.id, refId: bfInvoices.refId, clientId: bfInvoices.clientId, clientName: bfInvoices.clientName })
    .from(bfInvoices)
    .where(eq(bfInvoices.id, invoice_id))
    .limit(1)

  if (!invoice) {
    return NextResponse.json({ success: false, message: 'Invoice not found' }, { status: 404 })
  }

  const fullNotes = [method ? `Method: ${method}` : null, notes].filter(Boolean).join('\n') || null

  await db.insert(bfPayments).values({
    invoiceRef:      invoice.refId,
    invoiceId:       invoice.id,
    clientId:        invoice.clientId ?? undefined,
    clientName:      invoice.clientName,
    amount:          String(amount),
    paymentDate:     new Date(payment_date),
    paymentRef:      reference ?? '',
    notes:           fullNotes ?? '',
    loggedByUserId:  user.id,
  })

  return NextResponse.json({ success: true, message: 'Payment logged' }, { status: 201 })
}
