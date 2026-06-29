import { db, schema } from '@/db/client'
import { eq, like, and, sql } from 'drizzle-orm'
import type { Client } from '@blackfire/types'

const { bfClients, bfClientContacts } = schema

type DbClient = typeof bfClients.$inferSelect

function toClientType(row: DbClient): Client {
  return {
    id: row.id,
    name: row.name,
    contact_person: row.contactPerson || null,
    email: row.email || null,
    phone: row.phone || null,
    address: row.address || null,
    site: null,
    active: !!row.isActive,
    created_at: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  }
}

export async function getClients(search?: string): Promise<Client[]> {
  const rows = await db
    .select()
    .from(bfClients)
    .where(
      search
        ? and(eq(bfClients.isActive, 1), like(bfClients.name, `%${search}%`))
        : eq(bfClients.isActive, 1)
    )
    .orderBy(bfClients.name)

  return rows.map(toClientType)
}

export async function getClient(id: number): Promise<Client | null> {
  const [row] = await db
    .select()
    .from(bfClients)
    .where(eq(bfClients.id, id))
    .limit(1)

  return row ? toClientType(row) : null
}

export async function createClient(
  data: { name: string; email?: string; phone?: string; vatNumber?: string; address?: string; contactPerson?: string; notes?: string },
  createdBy: string,
): Promise<number> {
  const result = await db.insert(bfClients).values({
    name: data.name,
    email: data.email ?? '',
    phone: data.phone ?? '',
    vatNumber: data.vatNumber ?? '',
    address: data.address ?? '',
    contactPerson: data.contactPerson ?? '',
    notes: data.notes ?? '',
    createdBy,
  })
  return (result as unknown as [{ insertId: number }])[0].insertId
}
