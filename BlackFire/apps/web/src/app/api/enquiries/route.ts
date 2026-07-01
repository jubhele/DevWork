import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser, can } from '@/lib/server-auth'
import { db, schema } from '@/db/client'
import { desc } from 'drizzle-orm'
import { z } from 'zod'

const { bfPortalEnquiries } = schema

const submitSchema = z.object({
  name: z.string().min(1).max(255),
  company: z.string().max(255).optional().default(''),
  phone: z.string().max(50).optional().default(''),
  email: z.string().email().max(255),
  service: z.string().min(1).max(100),
  message: z.string().max(2000).optional().default(''),
})

// POST /api/enquiries — submit a portal enquiry
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 })

  const raw = await request.json().catch(() => null)
  const parsed = submitSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Validation failed', errors: parsed.error.flatten() }, { status: 400 })
  }

  const { name, company, phone, email, service, message } = parsed.data

  await db.insert(bfPortalEnquiries).values({
    name,
    company,
    phone,
    email,
    service,
    message,
    submittedBy: user.username,
    submittedAt: new Date(),
  })

  return NextResponse.json(
    { success: true, message: 'Enquiry received — a member of the BlackFire team will be in touch.' },
    { status: 201 },
  )
}

// GET /api/enquiries — list enquiries (requires callout.view)
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 })
  if (!can(user, 'callout.view')) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
  }

  const rows = await db
    .select({
      id: bfPortalEnquiries.id,
      name: bfPortalEnquiries.name,
      company: bfPortalEnquiries.company,
      phone: bfPortalEnquiries.phone,
      email: bfPortalEnquiries.email,
      service: bfPortalEnquiries.service,
      submittedBy: bfPortalEnquiries.submittedBy,
      submittedAt: bfPortalEnquiries.submittedAt,
      status: bfPortalEnquiries.status,
    })
    .from(bfPortalEnquiries)
    .orderBy(desc(bfPortalEnquiries.submittedAt))
    .limit(200)

  return NextResponse.json({ success: true, enquiries: rows })
}
