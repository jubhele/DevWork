import { db, schema } from '@/db/client'
import { eq, desc } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

const { bfUsers } = schema

type DbUser = typeof bfUsers.$inferSelect

export interface PortalUser {
  id: number
  username: string
  display_name: string
  role: string
  status: string
  last_login: string | null
  created_at: string
}

function d(v: Date | string | null | undefined): string | null {
  if (!v) return null
  return v instanceof Date ? v.toISOString() : String(v)
}

function toPortalUser(row: DbUser): PortalUser {
  return {
    id: row.id,
    username: row.username,
    display_name: row.name,
    role: row.role,
    status: row.active ? 'Active' : 'Inactive',
    last_login: d(row.lastLogin),
    created_at: d(row.createdAt) ?? '',
  }
}

export async function getPortalUsers(): Promise<PortalUser[]> {
  const rows = await db
    .select()
    .from(bfUsers)
    .orderBy(desc(bfUsers.createdAt))

  return rows.map(toPortalUser)
}

export async function createPortalUser(data: {
  username: string
  name: string
  email: string
  role: string
  password: string
}): Promise<number> {
  const passwordHash = await bcrypt.hash(data.password, 12)
  const result = await db.insert(bfUsers).values({
    username:     data.username,
    name:         data.name,
    email:        data.email,
    role:         data.role as DbUser['role'],
    passwordHash,
    active:       1,
    createdAt:    new Date(),
  })
  return (result as unknown as [{ insertId: number }])[0].insertId
}
