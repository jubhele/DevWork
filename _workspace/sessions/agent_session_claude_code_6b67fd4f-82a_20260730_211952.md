# Session: Constitution-enforced Claude Code session
Date: 2026-07-30
Provider: Claude Code
Model: Unknown
Project: BlackFire
Project Root: c:\DevWork\BlackFire

## Project Determination
Status: resolved
Source: explicit_user_binding (user had migration_task_email_digest_20260715.sql open under BlackFire Portal; bound to parent project root c:\DevWork\BlackFire per constitution-hook direct-child-root requirement). Goal confirmed via clarifying questions on invoice reversal, combined reversal, split invoicing entry, and line-item display behavior. Re-affirmed 2026-07-31 during record-chain-filter and reusable-line-items follow-up work — still bound to c:\DevWork\BlackFire, no project switch requested. Re-affirmed again 2026-07-31 during global item-library/category follow-up — binding unchanged.

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
- portal.js: pillH() now maps Reversed/Cancelled/Rejected to the 'overdue' pill style and 'Partially Invoiced' to 'pending-approval' (previously fell back to a plain 'draft' style, misleading for a reversed record).
- portal.js openRecordChain rewritten (was single quote/invoice via r.quote/r.invoice) to render all quotes/invoices per callout as arrays (r.quotes/r.invoices — API already returned these, just unused), with a "Show/Hide reversed records" toggle that only renders when a Reversed/Rejected quote or Cancelled invoice actually exists on that call. Added .chain-filter CSS rule in portal.css.
- Addressed user's mid-task request: quote line items must be reusable to prevent billing mistakes (motivated by the duplicated line items visible in their screenshot). Scoped to per-call history reuse only (user's choice, not a shared catalog). Added a "Reuse Items From This Call" button on the New Quote page (portal.php) that appears only when the selected callout has prior quote line items; clicking it opens a checkbox picker (portal.js: reuseCalloutItems/confirmReuseCalloutItems) sourced from api/callouts.php's existing chain endpoint, de-duplicated by description+unit_price, and appends selected items into the line-item form rather than requiring re-typing.
- User then expanded scope: reuse must not be restricted to one call — must draw from the same items table across all calls, with a fixed classification/grouping to filter (user chose: fixed category dropdown, derived from all historical bf_quote_items, no new catalog table). Superseded the per-call picker with a global item library:
  - New migration install/migration_quote_item_category_20260731.sql: adds `category` ENUM('Hardware','Labor','Sundries','Cabling','Travel','Software/Licensing','Other') DEFAULT 'Other' to both bf_quote_items and bf_invoice_items, plus an index for the reuse-picker grouping query. Takes automatic backups first.
  - includes/helpers.php: added QUOTE_ITEM_CATEGORIES constant + clean_item_category() so quotes.php/invoices.php share one validated category list instead of duplicating the ENUM values.
  - api/quotes.php: quote-create insert now stores category; convert action's quote-item-to-invoice-item copy (both simple and split-invoice paths) now carries category through; new GET ?action=item_library endpoint returns distinct description+category+unit_price combos across every quote in the user's company/engagement scope (not just one callout), grouped/deduped, with optional ?category= filter and usage_count/last_used metadata.
  - api/invoices.php: direct invoice-creation's quote-item copy also now carries category through.
  - portal.php: New Quote line-item table gained a Category column (<select> per row); "Reuse Items From This Call" button replaced with "↺ Reuse Existing Item" (no longer conditional on callout selection, since the library is global).
  - portal.js: removed the per-call reuse plumbing (refreshReuseItemsAvailability/reuseCalloutItems/confirmReuseCalloutItems and the nq-callout-ref change-listener) and replaced with openItemLibrary/renderItemLibraryModal/filterItemLibrary/confirmItemLibrarySelection — a modal with category tab filters over the full cross-call item library. addLine()/recalcQ()/saveQuote() updated to read/write line items by CSS class (.li-desc/.li-cat/.li-qty/.li-price) instead of positional `querySelectorAll('input')` indexing, since the new Category <select> shifted column positions. Found and left alone a second, unreachable legacy `function saveQuote(){...}` at line ~5625 (proxy/offline-mode code, shadowed by the real async API-backed saveQuote later in the file) — updated its item-collection line for consistency but did not otherwise touch it, since it appears to be dead code outside this task's scope.
- Verified portal.js with `node --check`, and portal.php/api/quotes.php/api/invoices.php/includes/helpers.php with `php -l` after all changes — no syntax errors.
- Final status as of this stop: implementation complete for reversal-scope, split-invoicing, record-chain reversed filter, and the global category-filterable item library. Two migrations (migration_split_invoicing_reversal_scope_20260730.sql, migration_quote_item_category_20260731.sql) remain unapplied, pending the user running them locally; no browser-based functional QA has been performed yet.

## Agent Accountability

| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|
| research-billing-schema | uMakhi | Explore subagent (a3786fc47cc1e01d1) | COMPLETED | 1 | Researched quote/invoice/reversal schema and code; found existing reversal system always couples invoice+quote, no split invoicing existed |
| implement-reversal-scope-split-invoicing | uMakhi | Claude Code (Sonnet 5) | COMPLETED | 1 | Migration + api/quotes.php + api/invoices.php changes written and lint-clean; migration not yet run (user will apply to local dev) |
| record-chain-reversed-filter | uMakhi | Claude Code (Sonnet 5) | COMPLETED | 1 | openRecordChain now lists all quotes/invoices per call with a conditional reversed-records toggle |
| reusable-quote-line-items | uMakhi | Claude Code (Sonnet 5) | COMPLETED | 1 | Per-call quote-item reuse picker added, then superseded same session by a cross-call global item library per user's follow-up ask |
| global-item-library-categories | uMakhi | Claude Code (Sonnet 5) | COMPLETED | 1 | Added category classification (fixed ENUM) to quote/invoice items and a cross-call, category-filterable reuse picker (api/quotes.php ?action=item_library) |

## Blockers / Next Steps
- User must run install/migration_split_invoicing_reversal_scope_20260730.sql AND install/migration_quote_item_category_20260731.sql against local dev DB, in that order (Claude Code was blocked from running migrations directly).
- Not yet functionally QA'd against real data in a browser (per workspace QA rules, php -l/node --check alone does not satisfy "done") — recommend uMvavanyi functional pass once both migrations are applied: invoice-only reversal + variance re-invoice, combined reversal, split invoicing over/under total, summary line rendering, record-chain reversed toggle visibility, and the item library picker (category filter tabs, cross-call dedup/usage_count, category persisting correctly through quote→invoice conversion and split invoicing).
- Documented parity gap (BlackFire §9): reversal + conversion workflows, the record-chain reversed filter, and the item library/category picker all exist only in the PHP portal, not in the Next.js web app or Expo mobile app. User explicitly chose PHP-only scope for the reversal/split-invoicing work; tri-surface build deferred as parity debt for all of these.
- The duplicated-line-items pattern visible in the user's screenshot (each item appearing twice on quote Q-150726-0111) has not been root-caused — worth checking whether that's stale/legacy data or a live bug in quote item entry, separate from the reuse features added here.
- Legacy unreachable `saveQuote` function (portal.js ~line 5625, proxy/offline-mode code shadowed by the real API-backed saveQuote) still exists; flagged but not removed since deleting dead code wasn't part of this task's scope — worth a cleanup pass later.
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
- User showed a screenshot of callout CO-150726-0134 (created 2026-07-15, predates this change) still showing old-style Add Quote/Invoice buttons with no visible reversal-scope or split-invoice UI. Confirmed this is expected: (1) that callout predates the new logic, (2) the migration has not been applied to any DB yet (user deferred applying it themselves), so none of the new columns/behavior exist yet anywhere, and (3) the reversal-scope/split-invoice controls live on the Quote/Invoice detail screens, not the callout job-card actions row, so this card was never expected to change appearance.

## Goal Status
PENDING
