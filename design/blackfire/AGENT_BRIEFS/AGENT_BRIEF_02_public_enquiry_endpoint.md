# AGENT_BRIEF_02 — Public enquiry endpoint
**Target:** NEW file `BlackFire/BlackFire Portal/api/public_enquiry.php` + one SQL migration
**Why:** `api/enquiries.php` is auth-locked (`require_auth()`) and MUST stay that way.
The v3 homepage wizard needs an unauthenticated path. This is the only new attack
surface in the redesign — build it paranoid.

## Endpoint contract
- `POST /api/public_enquiry.php` only. Any other method → 405 JSON.
- Body (JSON): `name` (≤255, required), `company` (≤255), `phone` (≤50, required),
  `email` (≤255, required, FILTER_VALIDATE_EMAIL), `service` (≤100, required),
  `message` (≤2000), `consent` (must be truthy), `website` (honeypot — MUST be empty).
- All inputs through the existing `clean()` helper. Prepared statements via `db_exec()` only.
- Insert into existing `bf_portal_enquiries` with `submitted_by = 'public_web'`.
- Success: `json_ok([], 'Assessment request received — a BlackFire assessor will be in touch within one business day.')`

## Abuse controls (all mandatory)
1. **Honeypot:** hidden `website` field in the form; non-empty → return generic success, insert nothing, log nothing identifying.
2. **Rate limit:** ≤3 submissions per IP per hour. New table via migration `install/migration_public_enquiry_ratelimit.sql`:
   `bf_public_rate (ip VARBINARY(16), bucket CHAR(13), hits INT, PRIMARY KEY(ip,bucket))` — bucket = `Y-m-d-H`. Use `INET6_ATON()`. Over limit → 429 JSON, generic message. The migration must be idempotent (`CREATE TABLE IF NOT EXISTS`) and contain NO bare DELETE — any cleanup statement is wrapped `START TRANSACTION; ... COMMIT;` (QA 2026-06-10 rule).
3. **Min-time check:** form includes `ts` (epoch ms set by JS on load); reject < 4000 ms as bot, return generic success, insert nothing.
4. **Length hard-caps before clean():** reject bodies > 8 KB raw.
5. **No CORS headers.** Same-origin only. Reuse `api_headers()`.
6. **Audit:** `audit('public_web','CREATE',"Public enquiry from {name} ({email}) — {service}")` on real inserts only.
7. **POPIA:** store nothing if consent !== true; the consent line shown to users is in the reference wizard step 04 — reuse verbatim.

## Regression guards
- Do not touch `api/enquiries.php` auth. Do not weaken `.htaccess`. No new config keys with hardcoded fallbacks.
- §7a backups for any existing file modified (expected: none — this is additive).

## Exit gate
QA suite PASS, including: confirm `require_auth()` still present in enquiries.php, confirm rate-limit table migration is transactional/idempotent, confirm honeypot + min-time paths insert nothing. Session log + deploy + curl test of all four abuse paths from production.
