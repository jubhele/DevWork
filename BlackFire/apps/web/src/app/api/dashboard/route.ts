import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/server-auth'
import { getDashboardData } from '@/lib/data/dashboard'

// GET /api/dashboard — native replacement for dashboard.php
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 })

  const data = await getDashboardData(user)
  return NextResponse.json({ success: true, ...data })
}
