export const POWERBI_RLS_ROLES = [
  {
    name: 'Portal_Admin',
    description: 'Full access across all report data for platform admins.',
  },
  {
    name: 'Portal_Manager',
    description: 'Tenant-wide access for management users.',
  },
  {
    name: 'Portal_Operations',
    description: 'Operational access to tasks, callouts, and field activity.',
  },
  {
    name: 'Portal_Client',
    description: 'Client-scoped access restricted to their own records.',
  },
] as const

export const POWERBI_RLS_SEED = [
  {
    portal_user: 'j.shange@blackfiresolutions.co.za',
    portal_role: 'sysadmin',
    powerbi_role: 'Portal_Admin',
    tenant_scope: 'all',
    client_id: null,
    client_name: null,
  },
  {
    portal_user: 'z.myeza@aeci.example',
    portal_role: 'client_support',
    powerbi_role: 'Portal_Client',
    tenant_scope: 'client-only',
    client_id: 1,
    client_name: 'AECI Chempark',
  },
  {
    portal_user: 'sibu@aeci.example',
    portal_role: 'viewer',
    powerbi_role: 'Portal_Client',
    tenant_scope: 'client-only',
    client_id: 1,
    client_name: 'AECI Chempark',
  },
  {
    portal_user: 'penny.nzimande@aeci.example',
    portal_role: 'viewer',
    powerbi_role: 'Portal_Client',
    tenant_scope: 'client-only',
    client_id: 1,
    client_name: 'AECI Chempark',
  },
  {
    portal_user: 'field.tech@blackfiresolutions.co.za',
    portal_role: 'senior_tech',
    powerbi_role: 'Portal_Operations',
    tenant_scope: 'operations',
    client_id: null,
    client_name: null,
  },
] as const
