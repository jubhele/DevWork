import type { User } from '@blackfire/types'

export type PowerBISurface = 'dashboard' | 'finance'

export interface PowerBIEmbedConfig {
  title: string
  embedUrl: string
  reportId: string
  datasetId: string
  accessToken: string
  expiresOn: string | null
}

export interface PowerBIIdentity {
  username: string
  roles: string[]
  datasets: string[]
  auditableContext: string
}

interface SurfaceConfig {
  title: string
  reportId: string | undefined
}

const POWERBI_AUTHORITY_HOST = (process.env.POWERBI_AUTHORITY_HOST ?? 'https://login.microsoftonline.com').replace(/\/+$/, '')
const POWERBI_API_ROOT = 'https://api.powerbi.com/v1.0/myorg'

function getSurfaceConfig(surface: PowerBISurface): SurfaceConfig {
  if (surface === 'finance') {
    return {
      title: 'Finance Reporting',
      reportId: process.env.POWERBI_FINANCE_REPORT_ID ?? process.env.POWERBI_INVOICES_REPORT_ID,
    }
  }

  return {
    title: 'Executive Dashboard',
    reportId: process.env.POWERBI_DASHBOARD_REPORT_ID,
  }
}

export function listMissingPowerBIEnv(surface: PowerBISurface): string[] {
  const missing: string[] = []

  for (const key of ['POWERBI_TENANT_ID', 'POWERBI_CLIENT_ID', 'POWERBI_CLIENT_SECRET', 'POWERBI_WORKSPACE_ID']) {
    if (!process.env[key]) missing.push(key)
  }

  const { reportId } = getSurfaceConfig(surface)
  if (!reportId) {
    missing.push(surface === 'finance' ? 'POWERBI_FINANCE_REPORT_ID' : 'POWERBI_DASHBOARD_REPORT_ID')
  }

  return missing
}

export function getPowerBIRolesForPortalRole(role: string): string[] {
  if (role === 'sysadmin' || role === 'admin') return ['Portal_Admin']
  if (role === 'manager' || role === 'finance') return ['Portal_Manager']
  if (role === 'senior_tech' || role === 'junior_tech' || role === 'call_logger' || role === 'safety_officer' || role === 'inspector') return ['Portal_Operations']
  return ['Portal_Client']
}

export function createPowerBIRlsIdentity(params: {
  username: string
  role: string
  datasetId: string
  auditableContext?: string
}): PowerBIIdentity {
  return {
    username: params.username,
    roles: getPowerBIRolesForPortalRole(params.role),
    datasets: [params.datasetId],
    auditableContext: params.auditableContext ?? params.username,
  }
}

async function getAzureAccessToken() {
  const tenantId = process.env.POWERBI_TENANT_ID
  const clientId = process.env.POWERBI_CLIENT_ID
  const clientSecret = process.env.POWERBI_CLIENT_SECRET

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Power BI authentication env is incomplete.')
  }

  const tokenUrl = `${POWERBI_AUTHORITY_HOST}/${tenantId}/oauth2/v2.0/token`
  const form = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
    scope: 'https://analysis.windows.net/powerbi/api/.default',
  })

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  })

  if (!response.ok) {
    const details = await response.text().catch(() => '')
    throw new Error(`Failed to acquire Power BI access token (${response.status}): ${details || response.statusText}`)
  }

  const body = await response.json() as { access_token?: string }
  if (!body.access_token) throw new Error('Power BI access token response did not include access_token.')
  return body.access_token
}

async function getReportDetails(accessToken: string, workspaceId: string, reportId: string) {
  const response = await fetch(`${POWERBI_API_ROOT}/groups/${workspaceId}/reports/${reportId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    const details = await response.text().catch(() => '')
    throw new Error(`Failed to load Power BI report details (${response.status}): ${details || response.statusText}`)
  }

  const body = await response.json() as { id?: string; embedUrl?: string; datasetId?: string }
  if (!body.id || !body.embedUrl || !body.datasetId) {
    throw new Error('Power BI report details did not include id, embedUrl, and datasetId.')
  }

  return body
}

async function getEmbedToken(accessToken: string, workspaceId: string, reportId: string, identity: PowerBIIdentity) {
  const response = await fetch(`${POWERBI_API_ROOT}/groups/${workspaceId}/reports/${reportId}/GenerateToken`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      accessLevel: 'View',
      identities: [
        {
          username: identity.username,
          roles: identity.roles,
          datasets: identity.datasets,
          auditableContext: identity.auditableContext,
        },
      ],
    }),
  })

  if (!response.ok) {
    const details = await response.text().catch(() => '')
    throw new Error(`Failed to generate Power BI embed token (${response.status}): ${details || response.statusText}`)
  }

  const body = await response.json() as { token?: string; expiration?: string }
  if (!body.token) throw new Error('Power BI embed token response did not include token.')
  return body
}

export async function createPowerBIEmbedConfig(surface: PowerBISurface, user: User): Promise<PowerBIEmbedConfig> {
  const missing = listMissingPowerBIEnv(surface)
  if (missing.length > 0) {
    throw new Error(`Missing Power BI env vars: ${missing.join(', ')}`)
  }

  const workspaceId = process.env.POWERBI_WORKSPACE_ID as string
  const { title, reportId } = getSurfaceConfig(surface)

  if (!reportId) {
    throw new Error(`Missing Power BI report id for surface "${surface}".`)
  }

  const accessToken = await getAzureAccessToken()
  const report = await getReportDetails(accessToken, workspaceId, reportId)
  const resolvedReportId = report.id as string
  const resolvedEmbedUrl = report.embedUrl as string
  const resolvedDatasetId = report.datasetId as string
  const identity = createPowerBIRlsIdentity({
    username: user.email || user.username,
    role: user.role,
    datasetId: resolvedDatasetId,
    auditableContext: `${user.username}:${user.role}`,
  })
  const embedToken = await getEmbedToken(accessToken, workspaceId, resolvedReportId, identity)
  const resolvedAccessToken = embedToken.token as string

  return {
    title,
    reportId: resolvedReportId,
    datasetId: resolvedDatasetId,
    embedUrl: resolvedEmbedUrl,
    accessToken: resolvedAccessToken,
    expiresOn: embedToken.expiration ?? null,
  }
}
