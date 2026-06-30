# BlackFire — Operator & User Guide

> Maintained by Mbhali. Updated when Umakhi ships a production feature and Mvavanyi returns PASS.

## System Overview

BlackFire is a tri-surface security operations platform:

| Surface | Tech | URL |
|---------|------|-----|
| PHP Portal | PHP 7.3+ / MySQL | blackfiresolutions.co.za/portal.php |
| Next.js Web App | Next.js 15 / Vercel | apps/web/ |
| Expo Mobile App | Expo SDK 56 | apps/mobile/ |

All surfaces share the same PHP/MySQL backend via the API at `BlackFire Portal/api/`.

## Development

```powershell
# Start local dev (PHP + Next.js)
.\start-dev.ps1

# Next.js only
pnpm --filter web dev

# Mobile
pnpm --filter mobile start
```

## Agent Workforce

Submit tasks via Mlawuli. See `agents/mlawuli_system_prompt.md` for routing.
Umlindi audits all Umakhi changes before production deploy.

## Role Surface

The current portal user-management surface accepts the following roles:

| Role |
|------|
| sysadmin |
| admin |
| manager |
| admin_clerk |
| call_logger |
| junior_tech |
| senior_tech |
| client_support |
| viewer |
| client |
| finance |
| safety_officer |
| inspector |

When adding or updating RBAC behavior, keep `api/users.php`, `bf_users.role`, and the shared contract/types in sync.

## Session Logging

All sessions logged to `sessions/`. Use template at `sessions/_template.md`.
Mirror to `G:\My Drive\JS\Agentic AI\sessions\` with `.tbl.bk` suffix.
