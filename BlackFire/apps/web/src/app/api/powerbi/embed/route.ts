import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { can, getServerUser } from '@/lib/auth'
import { createPowerBIEmbedConfig, listMissingPowerBIEnv, type PowerBISurface } from '@/lib/powerbi'
import { POWERBI_RLS_ROLES, POWERBI_RLS_SEED } from '@/lib/powerbi-rls'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function parseSurface(value: string | null): PowerBISurface {
  return value === 'finance' || value === 'invoices' ? 'finance' : 'dashboard'
}

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const user = await getServerUser(cookieStore.toString())
  if (!user) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const surface = parseSurface(searchParams.get('surface'))
  if (surface === 'finance' && !can(user, 'finance.view')) {
    return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 })
  }
  const missing = listMissingPowerBIEnv(surface)

  if (missing.length > 0) {
    return NextResponse.json({
      success: false,
      error: 'Power BI is not configured for this portal yet.',
      missing,
    }, { status: 503 })
  }

  try {
    const data = await createPowerBIEmbedConfig(surface, user)
    return NextResponse.json({
      success: true,
      data,
      rls: {
        roles: POWERBI_RLS_ROLES,
        seed: POWERBI_RLS_SEED,
      },
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown Power BI error',
    }, { status: 502 })
  }
}
