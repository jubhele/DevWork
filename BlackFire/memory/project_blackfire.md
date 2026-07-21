---
name: project-blackfire
description: BlackFire Solutions — security operations portal, client portal, Next.js web app, Expo mobile
metadata:
  type: project
---

BlackFire Solutions is a security company portal managing callouts, invoices, clients, and field operations.

- **Stack:** PHP 7.3+ (portal/API at `BlackFire Portal/`) + Next.js 15 (`apps/web/`) + Expo SDK 56 (`apps/mobile/`) + MySQL
- **Live:** blackfiresolutions.co.za
- **Principal:** Jubhele Shange
- **Pilot client:** AECI Chempark

**Why:** All three surfaces (PHP portal, Next.js web, Expo mobile) share the same PHP/MySQL backend.
**How to apply:** Any code change must consider impact on all three surfaces.

## Portal Surface Split

The AI dashboard widgets ("AI Intelligence" and "Client Intelligence Report") are rendered in the authenticated Next.js dashboard at `apps/web/src/app/(portal)/dashboard/page.tsx`. The public PHP site at `BlackFire Portal/portal.php` is a separate surface and does not render those widgets on `http://localhost:8080/`.

## Portal Deployment Surface

The live PHP portal is the root `public_html` surface: `index.php -> portal.php`. `dev-only/` and `_backups/` contain historical or refactor copies and must not be treated as the deployed page set.

## Dark Mode Surfaces

The Next.js portal theme relies on `html[data-theme='dark']` overrides for hardcoded utility classes. When a new light surface appears in dark mode, check for fixed classes like `bg-white/95` or hex-coded accent backgrounds and add a shared override in `apps/web/src/app/globals.css` instead of patching each page ad hoc.

## Local DB Quirk

On the Windows local PHP server, `PDO` can throw `SQLSTATE[HY000] [2019] Unknown character set` when `utf8mb4` is placed directly in the MySQL DSN. The working pattern is to connect without the charset parameter and then run `SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci` after the connection succeeds.

## Secret Loading Quirk

If `blackfire_secrets.php` exists only as a placeholder with empty values, it must not block `.env` fallback. Local dev should keep `.env` authoritative unless a real production secret file is present one level above `public_html`.

## Finance Document Profiles

Quotes and invoices use selectable issuer profiles in `bf_company_profiles` and reusable content in `bf_document_templates`. AECI must not be represented by one display name alone: quotes use the AECI Chem Park service address, while tax invoices use Chemhold Investments (Pty) Ltd, VAT `4200104349`, and its Gallo Manor billing address from `bf_client_document_profiles`. Generated PDFs must use the selected issuer's palette, wordmark treatment, legal/VAT details, banking block, document rules, and footer.

## Responsive Portal Records

Portal pages must reflow rather than depend on horizontal table scrolling. The shared `.tw > table` responsive system assigns `data-label` values from table headers at runtime, renders two-column record cards below 900px, and collapses to single-column cards with full-width actions below 560px. New record-heavy pages should prefer the Call Log pattern: compact summary, expandable details, and a dedicated action footer.

## Statement Templates

Statements persist `company_profile_id` and use `statement_document` plus `statement_email` templates for both Astute Insights and BlackFire Solutions. Their PDFs follow the quote/invoice visual system: branded masthead, metadata strip, information panels, invoice table, balance summary, banking block, accent rules, and classified footer. Portal records use Call Log-style cards with View, Download PDF, and release/resend actions below.

The statement cron runs once across every active company profile under the `bf_statement_cron` database lock. Pending statements drive dashboard Attention notifications in PHP, Next.js, and Expo plus the `w-alerts` scheduled email digest metric. All clients expose responsive statement cards with View and Download PDF actions; native Expo downloads protected PDFs with its bearer token before opening the platform viewer/share sheet.

Statement cron authentication must read `BF_CRON_SECRET` through `cfg_env()`, not `getenv()` alone, because production secrets are PHP constants and shared hosts may disable `putenv()`. Prefer the `X-Cron-Secret` request header; query-string secrets remain supported only for existing cPanel jobs. The live crontab and production secret still require an external cPanel check after deployment.

The authoritative Astute identity source is `C:\DevWork\Astute\Astute Insights Brand System (standalone).html`. PDF dark mastheads use its gold-mark/ivory-word reversal: two separate asymmetric mark strokes (short left leg, open apex, long right leg) with signal point, lowercase `stute`, tracked `INSIGHTS`, vertical divider, and `DATA INTELLIGENCE` signature. Light surfaces use the corresponding on-paper colourway. Use the `lens-mini` line geometry, not the contiguous `chev` path or the older framed lens/Cormorant approximation.

Do not repeat `Astute Insights (Pty) Ltd` beneath the full Astute masthead lockup. Keep the legal name in the issuer/details panel and retain the REG/VAT line in the masthead.

Template Store is a Support-owned surface on PHP, Next.js, and Expo. The non-PHP clients consume `template_store.php` so Astute/BlackFire legal, VAT, banking and address fields plus AECI quote/billing profiles and document/email template metadata remain one shared source of truth.
