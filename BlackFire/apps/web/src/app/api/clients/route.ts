import { NextResponse } from 'next/server'
import { getCurrentUser, can } from '@/lib/server-auth'
import { getClients, getClient, createClient } from '@/lib/data/clients'
import { z } from 'zod'

// GET /api/clients[?search=…&id=…] — native replacement for clients.php
export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 })
  if (!can(user, 'callout.view')) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const search = searchParams.get('search') ?? undefined

  if (id) {
    const client = await getClient(Number(id))
    if (!client) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: client })
  }

  const clients = await getClients(search)
  return NextResponse.json({ success: true, data: clients })
}

const createSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().or(z.literal('')).optional().default(''),
  phone: z.string().max(50).optional().default(''),
  vatNumber: z.string().max(50).optional().default(''),
  address: z.string().optional().default(''),
  contactPerson: z.string().max(255).optional().default(''),
  notes: z.string().optional().default(''),
})

// POST /api/clients — create a new client
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 })
  if (!can(user, 'user.create')) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Invalid input', errors: parsed.error.flatten() }, { status: 400 })
  }

  const id = await createClient(parsed.data, user.username)
  const client = await getClient(id)
  return NextResponse.json({ success: true, message: 'Client created', data: client }, { status: 201 })
}
