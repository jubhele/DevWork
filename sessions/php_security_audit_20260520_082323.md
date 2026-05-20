# Session: PHP Security Audit — All Portal PHP Files
Date: 2026-05-20
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Perform a comprehensive bug and vulnerability analysis across all PHP files in the BlackFire Portal,
covering OWASP Top 10, STRIDE threat model, SQL injection, XSS, authentication bypass, insecure
file handling, and logic flaws. Then fix all issues found except Bhekani_Bo.php (local dev only).

## Model Recommendation
Task tier: 3-Complex
Recommended model: Opus 4.7  Trust score: 10/10
Active model: Sonnet 4.6  Status: under-powered (proceeding anyway)

## Decisions
- Scanned 22 live PHP files; fixed across 12 files
- Skipped Bhekani_Bo.php (not deployed to production)
- Skipped portal.php CSP unsafe-inline change (requires inline JS refactor — deferred)
- CSRF infrastructure added (backend token + verify_csrf()), frontend wiring deferred to avoid breaking portal

## Work Done
- includes/db.php       — Parameterized next_ref_id() SQL injection; added db_begin/commit/rollback
- includes/auth.php     — Env-aware cookie_secure (HTTPS detection); null-safe current_user(); added csrf_token() + verify_csrf()
- includes/helpers.php  — Added security headers (Referrer-Policy, XCPDP, CSP); like_escape(); password_valid(); PASSWORD_COMPLEXITY_MSG
- api/auth.php          — Password reset enforces complexity (12 chars+upper+lower+digit+special); CSRF token in login+me responses; sleep() on reset_request
- api/admin.php         — Replaced hardcoded seed usernames with DB query; raised password min to complexity rules; 16-char random temp password
- api/transactions.php  — POST now calls require_auth() instead of current_user(); date bounds (-5 years to today)
- api/callouts.php      — IDOR: techs can only update their own callouts; require_perm(callout.update); like_escape() on search
- api/invoices.php      — IDOR: require_perm(invoice.update) on general PUT; amount >= 0 on POST and PUT; like_escape() on search
- api/quotes.php        — IDOR: require_perm(quote.update) on general PUT; like_escape() on search
- api/approvals.php     — Token expiry reduced from 7 days to 24 hours; replaced SYSTEM with hashed client identifier in audit log
- api/statements.php    — Escaped user email in error message; to_options now same pool as from_options (no all-user harvest)
- api/files.php         — Implemented parent entity existence validation before upload

## Blockers / Next Steps
- portal.php: CSP still has 'unsafe-inline' — needs inline JS extraction before this can be removed
- CSRF enforcement: backend infrastructure is ready (verify_csrf()); need to wire portal.php fetch() calls to send X-CSRF-Token header
- callout.update permission: must exist in bf_role_permissions; verify DB has this entry
- invoice.update permission: same — verify DB entry exists
- quote.update permission: same — verify DB entry

## Learnings
- db_begin/commit/rollback were missing entirely — quotes.php would have thrown fatal errors on creation
- next_ref_id() was the only unparameterized query in the codebase; all others used proper PDO bindings
- session.cookie_secure was hardcoded to '0' — changing to env-aware means HTTPS deployments now get secure cookies automatically
- IDOR on write endpoints was systemic — GET had role filters but PUT/DELETE did not
- Approval tokens were 7-day URL tokens (logged by web servers) — reduced to 24h, audit log now uses hashed client name
- LIKE wildcard injection (%% slow queries) addressed via like_escape() helper
- password_valid() and like_escape() centralized in helpers.php for reuse
- Sonnet 4.6 handled this fix pass adequately; no model switch needed mid-session
_Session ended: 2026-05-20 08:38:28 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-20 08:50:32 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-20 08:57:20 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-20 09:26:16 (Claude Code / claude-sonnet-4-6)_

## Resumed 2026-05-20 (CSP unsafe-inline Removal)

### Goal
Remove `'unsafe-inline'` from the portal's Content-Security-Policy by:
1. Replacing the `<meta>` CSP tag with a PHP response header
2. Creating `portal.js` — merged JS from both `<script>` blocks with all inline handlers converted to `data-action` delegation
3. Rewriting `portal.php` — link external CSS/JS, strip 129+ static inline handlers, add data-action attributes to HTML

### Context carried in from prior session
- `portal.css` already created (525 lines, verbatim CSS extraction from portal.php)
- `portal.js` does NOT yet exist — needs to be created
- Backup exists at `_backups/portal_backup_20260520_100127.php`
- CSRF token infrastructure complete on backend (csrf_token() / verify_csrf() in includes/auth.php)
- auth.php API already returns `csrf_token` in login and `me` responses

### Work In Progress
- portal.js — full data-action conversion mapped out, not yet written
- portal.php rewrite — planned, not yet applied

### Key Design Decisions
- Use single `document.addEventListener('click', dispatcher)` for all click events
- `initEventHandlers()` wires oninput/keydown/change on static DOM elements  
- Duplicate `audit()` function (first definition, lines ~1498–1501 in original) to be removed; second (better) definition kept
- CSRF: `window.__csrf` captured on login and page-reload auth check; sent as `X-CSRF-Token` header in all `api()` calls
- `style-src 'unsafe-inline'` deferred (inline `style=""` attributes throughout — separate task)

### Pending Actions
- Write `portal.js` (~2000 lines with dispatcher + initEventHandlers)
- Rewrite `portal.php` (PHP CSP header + `<link>` CSS + `<script src>` JS + data-action HTML)
- Run `/learn` at session end
_Session ended: 2026-05-20 12:19:41 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-20 19:26:40 (Claude Code / claude-sonnet-4-6)_
