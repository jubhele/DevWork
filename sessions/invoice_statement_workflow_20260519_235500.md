# Session: Invoice & Statement Email Workflow
Date: 2026-05-19
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Build the full invoice-on-callout-close and weekly statement approval workflow for the Umlilo Portal.

Features:
1. **Invoice on callout close** — if client closes → auto-generate Draft invoice + email notification. If non-client closes → manager must confirm with written notes + uploaded document, then invoice is generated.
2. **Weekly statement (Mon 09:00)** — outstanding invoices trigger a pending statement. admin_clerk / manager / admin can release it. FROM and TO emails are editable dropdowns drawn from bf_users; FROM options restricted by logged-in role.
3. **All other system emails** — From: noreply@blackfiresolutions.co.za, Reply-To: info@blackfiresolutions.co.za.

## Model Recommendation
Task tier: 3-Complex
Recommended model: Opus 4.7  Trust score: 10/10
Active model: Sonnet 4.6  Status: under-powered for this tier (used due to availability)

## Decisions
- Auto-generated invoices start as Draft with amount=0; admin sets amount before sending
- Closure confirmation requires: written notes (manager) + at least one uploaded attachment
- Statement FROM email: admin_clerk → own only; manager → own + admin_clerk emails; admin → own + manager + admin_clerk emails
- Statement scheduling: cron endpoint POST /api/statements.php?action=cron protected by BF_CRON_SECRET env var
- Reply-To on all non-statement emails = info@blackfiresolutions.co.za

## Work Done
- sessions/invoice_statement_workflow_20260519_235500.md — created this log
- install/migrate_v4_statement.sql — new migration (callout closure cols, invoice email cols, bf_statements table, new permissions)
- includes/mailer.php — added Reply-To header, send_invoice_notification_email(), send_statement_email() with from_override
- api/callouts.php — added closure detection (client auto-invoice) + confirm_closure action
- api/invoices.php — added client_email field + send_invoice action
- api/statements.php — new file: list/generate/release statements + email_options endpoint
- portal.php — updated PERMS map, rewrote renderStatement(), added closure confirmation modal + button

## Blockers / Next Steps
- Cron job must be configured in cPanel: `curl -s -X POST "https://blackfiresolutions.co.za/api/statements.php?action=cron&secret=<BF_CRON_SECRET>" every Monday at 09:00`
- BF_CRON_SECRET must be set as environment variable in cPanel
- Invoice amounts for auto-generated invoices are R0 — admin must set amount before sending

## Learnings
- PHP `match()` expression requires PHP 8.0+ — already in use on this project (PHP 8.4), so `match` in api/statements.php is safe
- VS Code SQL extension uses T-SQL dialect by default; MySQL-specific syntax (backticks, multi-row INSERT with comments, FOREIGN_KEY_CHECKS) shows as errors but is valid MySQL — these are linter false positives, not real errors
- The portal.php normalizeCallout/normalizeInvoice functions must be updated whenever new DB columns are added, otherwise new fields are invisible to the JS layer
- renderStatement() was already stubbed in NAV_CONFIG — upgrading to async+API-driven just required replacing the function body and wiring up the new API endpoint
- statement.release role-based FROM email restriction is enforced server-side in api/statements.php (PHP `match`); the client-side dropdown is filtered by api/statements.php?action=email_options
- Cron setup needed in cPanel: POST /api/statements.php?action=cron&secret=<BF_CRON_SECRET> every Monday 09:00 SAST
- Model trust score update: Sonnet 4.6 performed adequately on this Tier 3 task — no reasoning failures observed, though Opus 4.7 would likely produce more robust edge-case handling
