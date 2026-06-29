import { NextResponse } from 'next/server'
import { getCurrentUser, can } from '@/lib/server-auth'
import { getFinanceSummary } from '@/lib/data/finance'

// GET /api/finance — finance summary (MTD invoiced, collected, outstanding, aging)
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 })
  if (!can(user, 'finance.view')) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })

  const summary = await getFinanceSummary()
  if (!summary) return NextResponse.json({ success: false, message: 'Failed to load finance summary' }, { status: 500 })

  return NextResponse.json({ success: true, data: summary })
}
