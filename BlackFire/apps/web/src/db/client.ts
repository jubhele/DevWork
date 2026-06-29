import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'
import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'

// Single pooled connection per server runtime. Prefer DATABASE_URL (PlanetScale,
// production); fall back to discrete BF_DB_* vars for local development.
declare global {
  // eslint-disable-next-line no-var
  var __bfPool: mysql.Pool | undefined
}

function applyLocalDbEnvOverrides() {
  if (process.env.NODE_ENV === 'production') return

  const envPath = path.join(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) return

  const parsed = dotenv.parse(fs.readFileSync(envPath))
  for (const key of ['BF_DB_HOST', 'BF_DB_PORT', 'BF_DB_NAME', 'BF_DB_USER', 'BF_DB_PASS']) {
    const value = parsed[key]
    if (value) process.env[key] = value
  }
}

applyLocalDbEnvOverrides()

function makePool(): mysql.Pool {
  const hasDiscreteConfig = Boolean(process.env.BF_DB_USER && process.env.BF_DB_PASS)
  const url = process.env.DATABASE_URL
  if (url && !hasDiscreteConfig) {
    return mysql.createPool(url)
  }

  const host = process.env.BF_DB_HOST === 'localhost' ? '127.0.0.1' : process.env.BF_DB_HOST
  return mysql.createPool({
    host: host ?? '127.0.0.1',
    port: Number(process.env.BF_DB_PORT ?? 3306),
    user: process.env.BF_DB_USER,
    password: process.env.BF_DB_PASS,
    database: process.env.BF_DB_NAME ?? 'blackfm6w9f9_portal',
    connectionLimit: 5,
    charset: 'utf8mb4',
  })
}

const pool = global.__bfPool ?? makePool()
if (process.env.NODE_ENV !== 'production') global.__bfPool = pool

export const db = drizzle(pool, { schema, mode: 'default' })
export { schema }
