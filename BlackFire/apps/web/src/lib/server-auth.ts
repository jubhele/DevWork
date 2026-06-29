import { cookies, headers } from 'next/headers'
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { and, eq } from 'drizzle-orm'
import type { Role, User } from '@blackfire/types'
import { db } from '@/db/client'
import {
  bfAuditLog,
  bfMobileTokens,
  bfRolePermissions,
  bfUserRoles,
  bfUsers,
} from '@/db/schema'

// Native replacement for includes/auth.php + api/auth.php.
// Session model reuses the existing bf_mobile_tokens table:
//   - web  → raw token stored in httpOnly `bf_auth` cookie
//   - mobile → same raw token passed as `Authorization: Bearer …`
// This mirrors the PHP dual-path exactly, so the mobile app keeps working.

export const AUTH_COOKIE = 'bf_auth'
export const HINT_COOKIE = 'bf_session_hint'
export const CAPTCHA_COOKIE = 'bf_captcha'
export const SESSION_TTL_S = Number(process.env.BF_SESSION_LIFETIME ?? 7200)

const SECRET =
  process.env.BF_APP_KEY || process.env.BF_JWT_SECRET || 'dev-insecure-secret-change-me'
const IS_PROD = process.env.NODE_ENV === 'production'

export class LoginError extends Error {
  constructor(message: string, public status = 401) {
    super(message)
  }
}

const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex')
const hmac = (s: string) => crypto.createHmac('sha256', SECRET).update(s).digest('hex')
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

function fmtDate(d: Date = new Date()): string {
  return d.toISOString().slice(0, 19).replace('T', ' ')
}

// ─── CAPTCHA (stateless, signed cookie) ──────────────────────────────────────

export function buildCaptcha(): { question: string; cookie: string } {
  const a = crypto.randomInt(1, 13)
  const b = crypto.randomInt(1, 13)
  const payload = `${a + b}.${Date.now()}`
  return { question: `${a} + ${b} = ?`, cookie: `${payload}.${hmac(payload)}` }
}

export function verifyCaptcha(cookie: string | undefined, input: number): boolean {
  if (!cookie) return false
  const [answer, ts, mac] = cookie.split('.')
  if (!answer || !ts || !mac) return false
  if (hmac(`${answer}.${ts}`) !== mac) return false
  if (Date.now() - Number(ts) > 600_000) return false
  return Number(answer) === input
}

// ─── CSRF (double-submit, derived from session token) ────────────────────────

export const csrfFor = (token: string) => hmac(`csrf.${token}`)

// ─── RBAC ────────────────────────────────────────────────────────────────────

async function rolePermissionMap(): Promise<Record<string, string[]>> {
  const rows = await db
    .select({ role: bfRolePermissions.role, permission: bfRolePermissions.permission })
    .from(bfRolePermissions)
  const map: Record<string, string[]> = {}
  for (const r of rows) (map[r.permission] ??= []).push(r.role)
  return map
}

async function rolesForUser(userId: number, fallbackRole: string): Promise<Role[]> {
  const rows = await db
    .select({ role: bfUserRoles.role })
    .from(bfUserRoles)
    .where(eq(bfUserRoles.userId, userId))
  const roles = rows.map((r) => r.role)
  return (roles.length ? roles : [fallbackRole]) as Role[]
}

async function permissionsForRoles(roles: string[]): Promise<string[]> {
  const map = await rolePermissionMap()
  if (roles.includes('sysadmin')) return Object.keys(map).sort()
  const set = new Set<string>()
  for (const [perm, allowed] of Object.entries(map)) {
    if (allowed.some((r) => roles.includes(r))) set.add(perm)
  }
  return [...set].sort()
}

export function can(user: User, permission: string): boolean {
  if (user.roles.includes('sysadmin')) return true
  return user.permissions.includes(permission)
}

// ─── User assembly ───────────────────────────────────────────────────────────

interface UserRow {
  id: number
  username: string
  name: string
  role: string
  email: string | null
  active: number
  clientId: number | null
  createdAt: Date | null
  lastLogin: Date | null
}

async function buildUser(row: UserRow): Promise<User> {
  const roles = await rolesForUser(row.id, row.role)
  const permissions = await permissionsForRoles(roles)
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    email: row.email ?? '',
    role: row.role as Role,
    roles,
    permissions,
    client_id: row.clientId ?? null,
    active: !!row.active,
    created_at: row.createdAt ? fmtDate(row.createdAt) : '',
    last_login: row.lastLogin ? fmtDate(row.lastLogin) : null,
  }
}

async function audit(username: string, action: string, detail: string): Promise<void> {
  await db.insert(bfAuditLog).values({ username, action, detail, ipAddress: '', createdAt: new Date() })
}

// ─── Session resolution (current_user) ───────────────────────────────────────

export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies()
  let raw = jar.get(AUTH_COOKIE)?.value
  if (!raw) {
    const authHeader = (await headers()).get('authorization') ?? ''
    if (authHeader.startsWith('Bearer ')) raw = authHeader.slice(7)
  }
  if (!raw || raw.length < 16) return null

  const rows = await db
    .select({
      tokenId: bfMobileTokens.id,
      revoked: bfMobileTokens.revoked,
      expiresAt: bfMobileTokens.expiresAt,
      id: bfUsers.id,
      username: bfUsers.username,
      name: bfUsers.name,
      role: bfUsers.role,
      email: bfUsers.email,
      active: bfUsers.active,
      clientId: bfUsers.clientId,
      createdAt: bfUsers.createdAt,
      lastLogin: bfUsers.lastLogin,
    })
    .from(bfMobileTokens)
    .innerJoin(bfUsers, eq(bfUsers.id, bfMobileTokens.userId))
    .where(eq(bfMobileTokens.tokenHash, sha256(raw)))
    .limit(1)

  const t = rows[0]
  if (!t || t.revoked || !t.active) return null
  if (new Date(t.expiresAt).getTime() < Date.now()) return null

  await db
    .update(bfMobileTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(bfMobileTokens.id, t.tokenId))

  return buildUser(t)
}

// ─── Login / logout ──────────────────────────────────────────────────────────

export async function login(
  username: string,
  password: string,
  captchaInput: number,
  captchaCookie: string | undefined,
): Promise<{ user: User; token: string }> {
  const uname = username.trim().toLowerCase().slice(0, 50)
  if (!uname || !password) throw new LoginError('Username and password required', 400)
  if (!verifyCaptcha(captchaCookie, captchaInput)) {
    throw new LoginError('Invalid security check answer', 400)
  }

  const [u] = await db.select().from(bfUsers).where(eq(bfUsers.username, uname)).limit(1)
  if (!u || !u.active) {
    await delay(1000)
    throw new LoginError('Invalid username or password', 401)
  }

  const ok = await bcrypt.compare(password, u.passwordHash)
  if (!ok) {
    await delay(1000)
    await audit(uname, 'LOGIN_FAIL', `Failed login attempt for ${uname}`)
    throw new LoginError('Invalid username or password', 401)
  }

  await db.update(bfUsers).set({ lastLogin: new Date() }).where(eq(bfUsers.id, u.id))

  const raw = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + SESSION_TTL_S * 1000)
  await db
    .update(bfMobileTokens)
    .set({ revoked: 1 })
    .where(and(eq(bfMobileTokens.userId, u.id), eq(bfMobileTokens.deviceId, 'web')))
  await db.insert(bfMobileTokens).values({
    userId: u.id,
    tokenHash: sha256(raw),
    deviceId: 'web',
    deviceName: 'Umlilo Web Portal',
    expiresAt: expires,
  })

  await audit(uname, 'LOGIN', `${u.name} signed in as ${u.role}`)
  return { user: await buildUser(u), token: raw }
}

export async function logout(): Promise<void> {
  const raw = (await cookies()).get(AUTH_COOKIE)?.value
  const user = await getCurrentUser()
  if (raw) {
    await db.update(bfMobileTokens).set({ revoked: 1 }).where(eq(bfMobileTokens.tokenHash, sha256(raw)))
  }
  if (user) await audit(user.username, 'LOGOUT', `${user.username} signed out`)
}

// ─── Cookie option helpers (applied by route handlers on NextResponse) ───────

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    secure: IS_PROD,
    maxAge: SESSION_TTL_S,
  }
}

export function hintCookieOptions() {
  return {
    httpOnly: false,
    sameSite: 'lax' as const,
    path: '/',
    secure: IS_PROD,
    maxAge: SESSION_TTL_S,
  }
}
