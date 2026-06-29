import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser, can } from '@/lib/server-auth'
import { getTransactions, createTransaction } from '@/lib/data/transactions'
import { z } from 'zod'

// GET /api/transactions[?q=search&limit=50&offset=0]
export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 })
  if (!can(user, 'finance.transactions')) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const result = await getTransactions({
    search: searchParams.get('q') ?? undefined,
    limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 50,
    offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : 0,
  })

  return NextResponse.json({
    success: true,
    data: result.data,
    total: result.total,
    totals: { total_credit: result.totalCredit, total_debit: result.totalDebit },
  })
}

const createSchema = z.object({
  trans_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
  description: z.string().min(1).max(500),
  category: z.string().min(1).max(50),
  reference: z.string().max(100).optional().default(''),
  credit: z.number().min(0).optional().default(0),
  debit: z.number().min(0).optional().default(0),
}).refine(d => !(d.credit > 0 && d.debit > 0), {
  message: 'A transaction cannot have both credit and debit amounts',
})

// POST /api/transactions
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 })
  if (!can(user, 'finance.transactions')) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
  }

  const raw = await request.json().catch(() => null)
  const parsed = createSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Validation failed', errors: parsed.error.flatten() }, { status: 400 })
  }

  const { trans_date, description, category, reference, credit, debit } = parsed.data

  // Validate date range (not in future, not > 5 years ago)
  const d = new Date(trans_date)
  const fiveYearsAgo = new Date()
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)
  if (d > new Date() || d < fiveYearsAgo) {
    return NextResponse.json(
      { success: false, message: 'trans_date must be within the last 5 years and not in the future' },
      { status: 400 },
    )
  }

  const id = await createTransaction({ transDate: trans_date, description, category, reference, credit, debit })
  return NextResponse.json({ success: true, data: { id }, message: 'Transaction recorded' }, { status: 201 })
}
