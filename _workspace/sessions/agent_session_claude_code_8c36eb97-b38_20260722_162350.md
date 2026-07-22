# Session: Constitution-enforced Claude Code session
Date: 2026-07-22
Provider: Claude Code
Model: Claude Sonnet 5
Project: blackfire
Project Root: C:\DevWork\BlackFire

## Project Determination
Status: resolved
Source: explicit_user_binding — client seed data request is BlackFire portal client-management data; `constitution-hook.ps1 -Event ProjectBind` could not run (no stable session ID/transcript path supplied to the hook from this provider surface), so binding is recorded manually in this log instead.

## Goal
Create a seed template record for BlackFire (source company) with client CyberPro Consulting (Pty) Ltd — 2nd Floor, Building 13, The Woodlands Office Park, Woodmead, Johannesburg, 2192; 011 656 3394; VAT 4070196185.

## Model Recommendation
Task tier: 1-Fast
Recommended model: Claude Haiku 4.5   Trust score: 9/10
Active model: Claude Sonnet 5   Status: over-powered (single-file SQL seed authored from an existing pattern; low complexity, no cross-file architecture decisions)

## Decisions
- Followed the existing `bf_clients` + `bf_client_contacts` seed pattern (as used for AECI Chempark in `clients_migration.sql` / `migration_client_contacts.sql` / `migration_client_legal_name.sql`) rather than inventing a new schema.
- No contact person name or email was supplied by the user, so the contact row was seeded as an explicit placeholder (`Primary Contact (TBC)`) rather than inferred — consistent with [[feedback_confirmed_users_only]] (never infer users/contacts from partial info).
- Seed made idempotent: `ON DUPLICATE KEY UPDATE` on the client row, `NOT EXISTS` guard on the contact row, matching the codebase's existing re-run-safe convention.
- Did not run the SQL against a live database — file was authored only; execution/backup-before-execution is left to the user per §7a (mysqldump backup command included in the file header).

## Work Done
- Created `BlackFire\BlackFire Portal\install\seed_client_cyberpro.sql` — seeds `bf_clients` (name, legal_name, phone, vat_number, address, notes) and `bf_client_contacts` (placeholder primary contact) for CyberPro Consulting (Pty) Ltd.

## Agent Accountability

| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|
| seed-client-cyberpro-001 | uMakhi | uMakhi (Claude Code, Sonnet 5) | COMPLETED | 1 | SQL seed file authored, not executed against DB |

## Blockers / Next Steps
- `constitution-hook.ps1 -Event ProjectBind` failed with "No stable session ID or transcript path was supplied" — this provider surface does not currently pass a correlatable session ID to the hook. Needs investigation/fix in the Claude Code hook adapter so future sessions bind automatically instead of requiring manual log annotation.
- User (or uMlindi) should confirm the real primary contact name/email for CyberPro Consulting before the placeholder row is used in production.
- Seed file has not been executed; run after taking the mysqldump backup noted in the file header.

## Learnings
- The Claude Code SessionStart/UserPromptSubmit hook can leave a session in `PROJECT UNRESOLVED` state indefinitely if `-Event ProjectBind` errors out (missing session ID) — the Stop hook is what actually catches this, not the earlier prompt hooks. Binding then has to be reconstructed manually in the log from conversation context.
- Model trust score for Tier-1 SQL-seed-from-pattern tasks confirmed: Sonnet 5 handled it correctly but Haiku 4.5 (trust 9/10) would have been the cost-appropriate choice — no divergence in output quality observed, so no trust score change needed.

## Goal Status
PENDING
