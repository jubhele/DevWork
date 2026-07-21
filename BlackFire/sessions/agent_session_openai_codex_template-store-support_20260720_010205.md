# Session: Template Store Support Navigation and Record Layout
Date: 2026-07-20
Provider: OpenAI Codex
Model: GPT-5
Project: BlackFire
Project Root: C:\DevWork\BlackFire

## Project Determination
Status: resolved
Source: explicit user continuation in the bound BlackFire project

## Goal
Move Template Store into Support and redesign its issuer, customer, and template records using the Call Log expandable-card pattern with actions below each record.

## Model Recommendation
Task tier: 2-Medium
Active model: GPT-5
Status: suitable for the requested portal UI refactor.

## Decisions
- Reuse the established Call Log card, detail expander, and action-footer interaction rather than introduce a separate table pattern.
- Treat reflow as a portal-wide requirement: desktop tables remain tables, while narrower layouts convert every `.tw > table` into labelled record cards.
- Use one MutationObserver-based header labelling function so dynamically rendered rows receive responsive labels without duplicating mobile markup per module.
- Treat statements as a first-class templated document with a selected issuing company, branded PDF, branded email, in-app preview modal, and separate PDF download.

## Work Done
- Session log created and current portal files backed up.
- Moved Template Store from Finance to Support navigation.
- Replaced all three Template Store tables with Call Log-style record cards: compact five-field summary, expandable details, and actions below each record.
- Added responsive Template Store layouts for desktop, tablet, small tablet, and phone widths.
- Added a shared portal-wide responsive table system: two-column cards below 900px and one-column cards below 560px, including full-width mobile action buttons.
- Added `template-store-layout-regression.ps1` covering navigation placement, card structure, action placement, and global responsive-table behaviour.
- Passed JavaScript syntax, PHP lint, Template Store data regression, Template Store layout regression, invoice decimal regression, and diff whitespace checks.
- Refreshed the root workspace index; result: `UPDATED`.
- Added `statement_document` and `statement_email` templates for Astute Insights and BlackFire Solutions and applied the local incremental migration.
- Added `company_profile_id` to statements so generation, PDF rendering, and email delivery preserve the selected issuer.
- Replaced generic HTML statement downloads with branded PDF streaming, including inline View and attachment Download PDF modes.
- Converted pending and released statement records to responsive Call Log-style cards with expandable details and actions below.
- Rendered and visually inspected an A4 Astute statement PDF; no clipping, overlap, or illegible content was found.
- Upgraded the statement PDF to the quote/invoice visual system with a branded masthead, metadata strip, bordered panels, dark invoice table, alternating rows, balance summary, banking panel, accent rules, and classified footer; rerendered and visually verified the result.
- Replaced the approximate Astute PDF mark with the supplied no-frame Astute lockup (chevron mark, centre signal point, `stute`, and tracked `INSIGHTS`) through a shared PDF wordmark renderer used by quotes, invoices, and statements; added the canonical SVG asset and visually reverified the statement.
- Corrected that interim lockup against `Astute Insights Brand System (standalone).html`: the final renderer now includes the official lowercase `stute`, tracked `INSIGHTS`, vertical divider, and `DATA INTELLIGENCE` signature, using the gold-mark/ivory-word reversal on dark PDF mastheads and the official on-paper SVG colourway on light surfaces.
- Corrected the Astute symbol geometry after user review: it uses two separate asymmetric strokes with a short left leg, open apex, longer right leg, rounded terminals, and the signal dot between them. Replaced the erroneous full inverted-V geometry in both SVG assets and the shared quote/invoice/statement PDF renderer, then regenerated and visually checked the lockup and statement preview.
- Removed the redundant `Astute Insights (Pty) Ltd` line beneath the Astute masthead lockup in quotes, invoices, and statements. The legal name remains in the issuer/details panel; REG and VAT remain in the masthead.
- Added pending scheduled statements to the dashboard Attention notifications and to subscribed scheduled task/dashboard digests.
- Made the statement cron process every active company profile under a database lock, skip same-day duplicates before allocating a reference, and generate Astute and BlackFire statements independently.
- Extended statement parity to Next.js and Expo: responsive Statement Log cards, company labels, separate View and Download PDF actions, Finance navigation, and scheduler-created pending-statement dashboard alerts.
- Changed Statement View across PHP, Next.js, and Expo to open a branded in-app popup preview; only Download PDF now requests, caches, or opens the generated PDF.
- Updated the layout regression to require the Statement preview modal and reject the former inline-PDF View behaviour.
- Added authenticated native PDF caching/sharing for Expo so protected quote, invoice, and statement PDFs keep the bearer token instead of failing in an external browser.
- Extended Template Store parity to Next.js Support and Mobile Support using the live `template_store.php` data for Astute, BlackFire, AECI, VAT, addresses, banking details, and active quote/invoice/statement/email templates.
- Added shared TypeScript types and API-client operations for scheduled statements, company profiles, customer document profiles, and document templates.
- Passed PHP document/scheduler/layout regressions, mobile and web TypeScript checks, live Next.js route parity including `/statements`, and the Next.js production build. The build retains the pre-existing non-blocking Big Shoulders fallback warning.

## Agent Accountability

| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|
| BF-TEMPLATE-STORE-UX-002 | uMakhi | uMakhi (OpenAI Codex) | COMPLETED | 2/3 | Template Store moved to Support and portal-wide record/table reflow implemented; awaiting user acceptance. |
| BF-STATEMENT-TEMPLATES-003 | uMakhi | uMakhi (OpenAI Codex) | COMPLETED | 1/3 | Company-specific statement templates, branded PDF view/download, email attachment, and Call Log card layout implemented; awaiting user acceptance. |
| BF-CROSS-PLATFORM-PARITY-004 | uMakhi | uMakhi (OpenAI Codex) | COMPLETED | 1/3 | Template Store, statements, authenticated PDFs, and scheduled dashboard alerts applied to PHP, Next.js, and Expo surfaces; awaiting user acceptance. |

## Blockers / Next Steps
- No implementation blocker. The gstack browser skill could not run because Bash is unavailable in this Windows session; the supplied logo SVG was visually checked with the installed Playwright runtime instead.

## Learnings
- A responsive exception on one page is insufficient when the same wide-table pattern exists across modules.
- Automatic header-to-cell labelling provides one maintainable responsive treatment for dynamic server-backed tables.
- The Call Log pattern scales well because record identity, optional detail, and actions remain visually separate at every width.
- Statements must persist the issuing company just like quotes and invoices; otherwise a later download or resend cannot reproduce the correct brand reliably.
- A scheduler-created record can serve as the durable dashboard notification source; counts and digests should derive from pending records instead of creating a second notification table that can drift.
- A protected PDF URL cannot simply be opened from a native mobile browser because the bearer token is lost; download it with the authenticated app request, cache it locally, and hand the file to the platform viewer/share sheet.
- Brand-system screenshots are not enough for reconstruction when the supplied standalone guide contains exact SVG geometry, colourways, descriptor spacing, and signature structure; use the source markup as the specification.
- For the Astute symbol, the `lens-mini` line geometry is authoritative for the asymmetric legs; do not substitute the contiguous `chev` path because it creates an incorrect full left leg.
- Document actions need distinct semantics across every client: View stays inside the application as a responsive preview modal, while Download PDF is the explicit file-delivery action.

## Goal Status
PENDING
