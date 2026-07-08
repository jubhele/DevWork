# Power BI Portal Reporting

- The Umlilo Portal dashboard and invoice reporting surfaces are being replaced with secure in-portal Power BI embeds.
- Use backend-issued embed tokens from a service-principal flow.
- Keep portal authentication as the outer gate; let Power BI enforce report access and any future RLS on top.
- RLS is mandatory: embed tokens must include effective identity and role mapping for each portal user.
- Power BI role names in this portal are `Portal_Admin`, `Portal_Manager`, `Portal_Operations`, and `Portal_Client`.
- Env vars expected in `apps/web/.env`: `POWERBI_TENANT_ID`, `POWERBI_CLIENT_ID`, `POWERBI_CLIENT_SECRET`, `POWERBI_WORKSPACE_ID`, `POWERBI_DASHBOARD_REPORT_ID`, `POWERBI_INVOICES_REPORT_ID`, optional `POWERBI_AUTHORITY_HOST`.
