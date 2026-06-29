import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

// Local introspection target. Values come from BlackFire Portal/.env (BF_DB_*).
// For production (PlanetScale), set DATABASE_URL and these BF_DB_* fall away.
export default defineConfig({
  dialect: 'mysql',
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dbCredentials: {
    host: process.env.BF_DB_HOST ?? 'localhost',
    port: Number(process.env.BF_DB_PORT ?? 3306),
    user: process.env.BF_DB_USER ?? '',
    password: process.env.BF_DB_PASS ?? '',
    database: process.env.BF_DB_NAME ?? 'blackfm6w9f9_portal',
  },
  casing: 'snake_case',
})
