# Session: Constitution-enforced Claude Code session
Date: 2026-07-28
Provider: Claude Code
Model: Claude Sonnet 5
Project: blackfire
Project Root: C:\DevWork\BlackFire

## Project Determination
Status: resolved
Source: explicit_user_binding ("blackFire:" prefix stated by user in first substantive prompt this session). `constitution-hook.ps1 -Event ProjectBind -RequestedProjectRoot C:\DevWork\BlackFire -SessionId 5bc9da39-2a35-4d0a-bd63-bec185f36267` run multiple times through the session, exit 0 each time. This exact log file was found missing partway through the session (likely rotated/consolidated externally) despite the Stop hook continuing to reference it by this exact filename; recreated here with the full session record rather than leaving the gate permanently blocked.

## Goal
Add Cc/Bcc support to outbound client emails (quotes, invoices, statements). Scope grew during the session to: (1) per-document-type send-from routing addresses per client engagement (Quotes/Invoices/Statements can each have a different address); (2) persistent company-level and engagement-level Cc/Bcc recipient lists (not just a one-off per-send field); (3) a real-data request to update the Chemhold Investments/AECI Chempark billing address and email routing; (4) a bug fix — the Send Invoice/Send Quote modals were defaulting "Send to" to the client's generic contact email instead of the new per-engagement routing address.

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6/5   Trust score: 9/10
Active model: Claude Sonnet 5   Status: correct

## Decisions
- Default Cc = issuing company profile's own `email` field (`bf_company_profiles.email`), not a hardcoded address — confirmed via AskUserQuestion.
- Applied uniformly to quotes, invoices, and statements.
- Cc is a real RFC `Cc:` header (visible to all recipients); Bcc is envelope-only (`RCPT TO`, no header).
- Per-document-type routing address is scoped per client + company-profile engagement (`bf_company_clients` row), not per client alone — the same client can be billed by two different issuing companies with two different addresses per document type.
- Cc/Bcc persistence is two-tier: company-side defaults (`bf_company_profiles.cc_emails/bcc_emails`) merged with per-engagement client-side additions (`bf_company_clients.cc_emails/bcc_emails`), de-duplicated server-side on every send; still further editable per individual send.
- Column convention: plain `VARCHAR(500)` comma-separated strings, matching the existing `bf_statements.to_emails` pattern — no JSON columns.
- Routing address changes Reply-To (and is available as a From override); the SMTP-authenticated mailbox itself is unchanged — a full "send as" identity per document type is a mail-server config concern, out of scope.
- Chemhold Investments Pty Ltd = the existing "AECI Chempark" client record (confirmed via `install/migration_client_legal_name.sql`, which already set `legal_name`/`vat_number` to match) — not a new client. New postal address replaces the address on file rather than being appended alongside it.
- No invoice was generated or sent for Chemhold/AECI Chempark — the user's phrase "on completion of the works" named no specific completed job/callout, so only the client record and routing were prepared, not an actual invoice.

## Work Done
- `includes/mailer.php` — `smtp_send()` gained `cc`/`bcc` options (RCPT TO for both, Cc header for cc only); added `split_email_list()` and `document_routing_settings()` resolver; `send_templated_document_email`/`send_quote_email`/`send_invoice_email`/`send_statement_email` all accept optional `$cc`/`$bcc`/`$routeEmail`.
- `includes/helpers.php` — added `validate_email_list()` shared helper.
- `api/quotes.php`, `api/invoices.php`, `api/statements.php` — send/release actions resolve the document's `bf_company_clients` engagement row, merge company+engagement Cc/Bcc, apply the resolved routing address.
- `api/template_store.php` — `entity=profile` accepts `cc_emails`/`bcc_emails`; GET now also returns `company_clients`; new `entity=company_client` PUT saves per-engagement routing addresses and Cc/Bcc, scoped through `allowed_engagement_ids`.
- `portal.js` — Company Profile editor gained Default Cc/Bcc fields; new "4. Email Routing" tab in Template Store listing every in-scope engagement with an editor modal; Send Quote/Invoice/Release Statement modals gained Cc/Bcc fields with explanatory hint text.
- `portal.php` — added the 4th Template Store section markup.
- `portal.css` — grid-column templates for the new routing card/header.
- `install/email_routing_cc_bcc_20260728.sql` — new additive migration (company profile + company_clients columns). **Not yet run** against any environment.
- `install/chemhold_billing_routing_20260728.sql` — targeted update for the Chemhold/AECI Chempark client (new postal address) and its Astute engagement routing emails (quote_email/invoice_email/statement_email). **Not yet run**; depends on the migration above running first.
- Bug fix: `normalizeInvoice()`/`normalizeQuote()` in `portal.js` were dropping `company_client_id` from the API response, so the Send Invoice/Send Quote modals had no way to look up engagement routing and always fell back to the client's generic contact email. Added `companyClientId` to both normalizers; `openSendInvoiceModal`/`openSendQuoteModal` now default "Send to" from `engagement.invoice_email`/`engagement.quote_email` when set, with a hint line showing when the default came from engagement routing.
- All touched PHP files verified `php -l` clean; `portal.js` verified `node -c` clean throughout.

## Blockers / Next Steps
- `install/email_routing_cc_bcc_20260728.sql` has not been run against any environment — confirmed live via a user-reported `#1054 - Unknown column 'cc.quote_email'` error when they tried the Chemhold pre-flight SELECT before running it. Must run this migration first, then `install/chemhold_billing_routing_20260728.sql`.
- Feature not yet tested against live SMTP end-to-end — recommend uMvavanyi functional QA pass (send a real test quote/invoice with Cc populated/cleared and a routing-address override) once the migrations are applied.
- No invoice raised yet for Chemhold/AECI Chempark — remains a future action once a specific completed job is named.
- Next.js web and Expo mobile surfaces do not expose quote/invoice/statement sending at all (PHP-only today) — no tri-surface parity gap introduced by this work, but flag if/when those surfaces gain send actions.
- This exact bootstrap log file was found missing mid-session (see Project Determination) — worth investigating why `_workspace\sessions\` logs can disappear/rotate while the Stop hook still references them by exact filename; a durability gap in whatever process manages these files.
- User pushed back (2026-07-28, this session): reporting a feature "done" after only `php -l`/`node -c` is not acceptable — a QA pass should have caught the routing-default bug before the user ever saw it. Added a regression test (`tests/send-modal-engagement-routing-regression.ps1`, verified to actually fail on the original bug) and a standing memory rule (`feedback_qa_before_done_blackfire.md`) requiring functional QA against real data before any BlackFire feature is reported complete going forward.

## Learnings
- `bf_statements` GET `action=download` streams a raw PDF (not JSON) — cannot be used from `api()` for row lookups; used the already-cached `statementPreviewRecords` list from `renderStatement()` instead to source `company_profile_id` for a UI default.
- Existing `change`-event delegation in `portal.js` checks `t.id` directly for many fields rather than `data-action`; followed that convention for the new company-profile-change handler.
- `bf_company_clients` (the RLS engagement table) is the correct scoping key for "per client + per issuing company" settings — it already carries the RLS/scope enforcement (`allowed_engagement_ids`) used elsewhere, so new routing/Cc/Bcc columns were added there rather than inventing a parallel settings table.
- Real client/billing data changes (Chemhold address, VAT, email routing) were treated as requiring explicit user confirmation before writing SQL, even though the request came as a direct instruction — clarified whether the client already existed, how the two different addresses (site vs. postal) should reconcile, and the exact quote/invoice/statement email mapping, before producing a migration. This was the right call: the address discrepancy and the two-email split were genuinely ambiguous without asking.
- Initially assumed defaulting "Send to" from the resolved routing address required an extra API round trip and skipped it, documenting the gap via UI hint text instead of fixing it. This was wrong — `company_client_id` was already present in the API response; the real gap was that `normalizeInvoice()`/`normalizeQuote()` silently dropped it before it ever reached the UI layer. Should have traced the full data path (API response → JS normalizer → UI) before concluding a field couldn't be defaulted without more server calls, rather than assuming a client-side gap implied a server-side limitation.

## Agent Accountability

| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|
| cc-bcc-client-email | uMakhi | uMakhi (Claude Code, sole active agent) | COMPLETED | 2 | Cc/Bcc default+edit and per-engagement routing implemented; migration not yet run, not yet SMTP-tested |
| chemhold-billing-routing | uMakhi | uMakhi (Claude Code, sole active agent) | COMPLETED | 1 | Confirmed existing client identity; wrote targeted migration (not executed); no invoice raised |
| send-modal-routing-default-bugfix | uMakhi | uMakhi (Claude Code, sole active agent) | COMPLETED | 1 | Fixed normalizeInvoice/normalizeQuote dropping company_client_id; Send Invoice/Quote modals now default to engagement routing address when set |
| qa-process-gap-remediation | uMvavanyi (functional QA) | uMakhi (Claude Code, sole active agent) | COMPLETED | 1 | Added tests/send-modal-engagement-routing-regression.ps1 (verified to fail on the reverted bug and pass on the fix); saved feedback_qa_before_done_blackfire.md mandating functional QA before reporting BlackFire features done |

## Goal Status
PENDING
