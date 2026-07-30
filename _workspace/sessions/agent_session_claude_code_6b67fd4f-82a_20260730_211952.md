# Session: Constitution-enforced Claude Code session
Date: 2026-07-30
Provider: Claude Code
Model: Unknown
Project: BlackFire
Project Root: c:\DevWork\BlackFire

## Project Determination
Status: resolved
Source: explicit_user_binding (user had migration_task_email_digest_20260715.sql open under BlackFire Portal; bound to parent project root c:\DevWork\BlackFire per constitution-hook direct-child-root requirement). Goal confirmed via clarifying questions on invoice reversal, combined reversal, split invoicing entry, and line-item display behavior.

## Goal
Add configurable invoice/quote reversal options plus split-invoicing support to the BlackFire Portal call billing workflow:
1. Invoice-only reversal — voids the invoice, leaves the quote as-is, allows submitting a replacement invoice (with variance) linked to the same quote.
2. Combined reversal — voids both quote and invoice together; user manually re-quotes afterward (no auto-recreate).
3. Split invoicing — one quote (100%) can have multiple invoices (e.g. 60%+40%) whose total equals the quote; user enters a %/amount per invoice at creation time, system tracks running total vs quote total and blocks over-invoicing.
4. Line item display — DB stores per-line-item % scaled amounts per invoice for reconciliation, but each invoice UI/PDF collapses them into one summary line (e.g. "Partial payment - 60% of Quote #123").

## Model Recommendation
Task tier: 3-Complex (multi-file schema + business logic design spanning call/quote/invoice billing model, financial correctness implications)
Recommended model: Opus 4.7  Trust score: 10/10
Active model: Sonnet 5  Status: acceptable per-workspace default; monitor output quality on the financial logic given Tier 3 classification

## Decisions
- Session created automatically by the SessionStart enforcement hook.
- Bound project to c:\DevWork\BlackFire (not the nested "BlackFire Portal" subfolder) because constitution-hook.ps1 requires an exact _workspace or direct-child project root.
- Clarified 4 open design questions with user before touching schema/code: invoice-only reversal keeps quote untouched; combined reversal requires manual re-quote (no auto-recreate); split invoicing captured as %/amount per invoice at creation time against running quote balance; invoice line items scaled per-% in DB but collapsed to one line on the customer-facing invoice.

## Work Done
- Constitution, memory index, and session-log schema verified at session start.
- Ran ProjectBind against constitution-hook.ps1 for c:\DevWork\BlackFire; succeeded on second attempt after correcting the root path.
- Launched background Explore agent (a3786fc47cc1e01d1) to research existing call/quote/invoice schema, reversal logic, and invoice-from-quote generation code before planning implementation.
- Wrote install/migration_split_invoicing_reversal_scope_20260730.sql: adds bf_document_reversal_requests.reversal_scope enum (invoice_only/invoice_and_quote, default invoice_and_quote), bf_quotes.status 'Partially Invoiced' value, bf_invoice_items.is_summary_line flag; takes automatic table backups first.
- api/quotes.php: request_reversal accepts reversal_scope; approve_reversal branches — invoice_only cancels invoice only and recomputes quote status (Approved/Partially Invoiced/Converted) from remaining invoiced total, invoice_and_quote unchanged; convert action now accepts invoice_percent/invoice_amount for split invoicing, validates running total vs quote total (blocks over-invoicing), generates %-scaled hidden detail line items plus one collapsed customer-facing summary line for split invoices, sets quote status to Partially Invoiced until fully billed.
- api/invoices.php: mirrored request_reversal/approve_reversal changes; attach_items() now filters displayed items to is_summary_line=1 rows, exposing full detail via a new item_detail key for reconciliation.
- Verified both files with `php -l` — no syntax errors.
- Attempted to apply migration to local dev DB (blackfm6w9f9_portal @ localhost, per BlackFire Portal/.env) via Bash; blocked by the auto-mode classifier (DB-mutating shell command). Printed the mysql command for the user to run manually instead. User confirmed: apply to dev/local only, they will handle production themselves.

## Agent Accountability

| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|
| research-billing-schema | uMakhi | Explore subagent (a3786fc47cc1e01d1) | COMPLETED | 1 | Researched quote/invoice/reversal schema and code; found existing reversal system always couples invoice+quote, no split invoicing existed |
| implement-reversal-scope-split-invoicing | uMakhi | Claude Code (Sonnet 5) | COMPLETED | 1 | Migration + api/quotes.php + api/invoices.php changes written and lint-clean; migration not yet run (user will apply to local dev) |

## Blockers / Next Steps
- User must run install/migration_split_invoicing_reversal_scope_20260730.sql against local dev DB (Claude Code was blocked from running it directly).
- Not yet functionally QA'd against real data (per workspace QA rules, php -l alone does not satisfy "done") — recommend uMvavanyi functional pass once migration is applied: invoice-only reversal + variance re-invoice, combined reversal, split invoicing over/under total, summary line rendering.
- Documented parity gap (BlackFire §9): reversal + conversion workflows exist only in the PHP portal, not in the Next.js web app or Expo mobile app. User explicitly chose PHP-only scope for this change; tri-surface build deferred as parity debt.
- User has not yet set Goal Status to ACHIEVED.

## Research Findings (Explore agent a3786fc47cc1e01d1)
- Existing mature reversal system: bf_document_reversal_requests table + request_reversal/approve_reversal/reject_reversal actions in api/invoices.php (~521-675) and api/quotes.php (~375-485). Currently always reverses invoice+quote together (invoice->Cancelled, quote->Reversed) — no invoice-only option exists yet.
- Quote->invoice conversion (api/quotes.php action=convert, lines ~488-582) is strictly 1:1, blocked by `already_converted` check; copies full quote total_amount verbatim as invoice amount; no split/partial invoicing exists anywhere in the codebase.
- No existing reconciliation logic cross-checks quote total vs sum of linked invoices — this is genuinely new territory, not an extension of an existing guard rail.
- Confirmed unrelated: migration_task_email_digest_20260715.sql only touches bf_users email digest columns.

## Design Decisions (confirmed with user)
- Reversal gets a `reversal_scope` choice: invoice_only (cancels invoice, quote untouched, quote becomes re-convertible for a variance invoice) vs invoice_and_quote (existing behavior, both reversed).
- Split invoicing: one quote (100%) can have multiple invoices (e.g. 60%+40%) whose amounts sum to the quote total; user enters %/amount per invoice at creation; system blocks over-invoicing against running total.
- Quote status gains new value 'Partially Invoiced' — shown while sum of active invoices < quote total; flips to 'Converted' only at 100%.
- Invoice line items: bf_invoice_items keeps full %-scaled detail rows per original quote line (for reconciliation) plus one synthetic summary row; a column flags which rows render on the customer-facing invoice (summary only) vs DB-only detail rows.

## Learnings
- constitution-hook.ps1 ProjectBind rejects nested subfolders like "BlackFire\BlackFire Portal" — must bind to the direct child of c:\DevWork (e.g. "BlackFire") even when the user's actual work is deeper in a subfolder.
- constitution-hook.ps1 also requires an explicit -SessionId when no provider transcript path is available; pass the harness-provided session UUID.

## Goal Status
PENDING
