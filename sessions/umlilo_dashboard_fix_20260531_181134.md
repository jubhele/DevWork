# Session: Umlilo Dashboard "Could not load dashboard data" Fix
Date: 2026-05-31
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Diagnose and fix the "Could not load dashboard data." error shown on the Umlilo Portal dashboard (localhost:3000/dashboard). The user noticed the error after logging in successfully.

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: Sonnet 4.6  Status: correct

## Decisions
- Fixed `dashboard.php` (PHP backend) rather than papering over it in Next.js, because the PHP response structure was the root cause and the TypeScript `DashboardKPIs` type is the authoritative contract.
- Wrapped KPI data under `'data'` key to match the `ApiResponse<T>` TypeScript contract pattern.
- Added `safety_score` (AVG from `bf_safety_files.score` where `is_active=1` and `status='Approved'`) and `active_clients` (COUNT from `bf_clients` where `is_active=1`) to align with the `DashboardKPIs` type.
- Removed extra PHP-only fields (`urgent_calls`, `pending_appr`, `open_inv_count`, `net_position`) from the `data` key — they're not in the contract. `recent_callouts` and `monthly_revenue` remain alongside `data` for future use.

## Work Done
- `BlackFire/BlackFire Portal/api/dashboard.php` — fixed 3 bugs:
  1. Response now wraps KPIs under `data` key (was flat under `kpi`) to match `ApiResponse<DashboardKPIs>`
  2. Renamed `overdue_inv` → `overdue_invoices` to match `DashboardKPIs` type
  3. Added `active_clients` query (`bf_clients.is_active`) and `safety_score` query (`AVG(bf_safety_files.score)`)
- Backup created at: `BlackFire/BlackFire Portal/api/_backups/dashboard_backup_20260531_181134.php`

## Blockers / Next Steps
- **MUST DEPLOY**: Fixed `dashboard.php` is local only. Must be uploaded to Afrihost for the live `https://blackfiresolutions.co.za/api/dashboard.php` to serve correct data.
- Token auth confirmed working: web login stores a bearer token in `bf_mobile_tokens` with `device_id='web'` (lines 104-118 in auth.php) — auth flow is correct end-to-end.
- `recent_callouts` and `monthly_revenue` are fetched by PHP but ignored by the current Next.js dashboard page — consider a richer dashboard UI later.

## Learnings
- The `json_ok()` PHP helper uses `array_merge` to spread all fields flat, NOT nested under `data`. This is incompatible with the `ApiResponse<T>` TypeScript contract which expects `{ success, data: T }`. The workaround: pass `['data' => [...]]` as the argument to `json_ok()` so `data` becomes one of the merged keys.
- The web portal login generates a short-lived bearer token stored in `bf_mobile_tokens` (device_id='web'), then embeds it in the signed `bf_portal` Next.js cookie. Dashboard page reads token from cookie → passes as `Authorization: Bearer` header to PHP API (server-side fetch, no CORS).
- `bf_safety_files` uses `is_active` for soft-delete (not `deleted_at`); `bf_clients` uses `is_active` (not `active`).
_Session ended: 2026-05-31 18:14:48 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-31 18:17:13 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-31 18:23:58 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-31 18:33:21 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-31 18:39:12 (Claude Code / claude-sonnet-4-6)_
