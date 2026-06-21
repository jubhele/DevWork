# Session: App / Portal Parity QA
Date: 2026-06-21
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
QA the BlackFire web app (Next.js `apps/web`) and mobile app (Expo `apps/mobile`) for full feature parity with the PHP portal. Fix small UI details (theme toggle, favicon, images, help guide), create stub pages for all missing portal sections so no nav link 404s, add a dedicated Support page, and produce a comprehensive architecture .md that maps how every portal/app route links to every other.

## Model Recommendation
Task tier: 3-Complex
Recommended model: Opus 4.7  Trust score: 10/10
Active model: claude-sonnet-4-6  Status: slightly under-powered for deep multi-file analysis but sufficient for structured implementation

## Decisions
- Phase 1: Fix all small UI issues (theme button, favicon, images, help guide) and create stub pages for missing sections — this gives immediate parity at the navigation level.
- Phase 2 (future): Full implementations of Quotes, Invoices, Finance, Safety, Clients, Admin pages.
- Theme toggle: implement with localStorage + data-theme attribute on html element; full dark-mode CSS theming is a Phase 2 item.
- Support page: add under /support route with a dedicated secondary nav entry in the Support group.
- Architecture doc: lives at `BlackFire/docs/architecture_portal_app.md`.

## Work Done
- `apps/web/src/app/layout.tsx` — Added full favicon metadata (16, 32, 512px PNGs + apple-touch-icon + shortcut)
- `apps/web/public/` — Added: `favicon-16x16.png`, `favicon-32x32.png`, `favicon-512x512.png`, `apple-touch-icon.png`, `blackfire_icon_transparent.png`, `favicon.ico` (copied from PHP portal)
- `apps/web/src/components/PortalShell.tsx` — Fixed theme button: `<span>` → functional `<button>` with `useState`, `useEffect`, localStorage persistence, `document.documentElement.dataset.theme` toggle, ☾/☀ icon swap. Added Support to primary nav, added `/support`, `/safety`, `/admin/users`, `/admin/audit` to support secondary nav.
- `apps/web/src/app/(portal)/help/page.tsx` — Full rewrite: 9 sections (Getting Started, Dashboard, Tracker, Call Log, Quotes, Invoices, Finance, Safety, Support & Admin) each with purpose, how-to steps, tips, FAQs. Added section anchor nav and emergency contacts block.
- `apps/web/src/app/(portal)/quotes/page.tsx` — Created: live Quote Log table using `quotes.php` API with correct `Quote` type fields (`quote_number`, `status`, `total`, `valid_until`).
- `apps/web/src/app/(portal)/invoices/page.tsx` — Created: live Invoice Log table using `invoices.php` API with correct `Invoice` type fields.
- `apps/web/src/app/(portal)/finance/page.tsx` — Created: Finance Overview page with KPI cards (MTD Invoiced, Collected, Outstanding, Overdue) and Invoice Aging progress bars.
- `apps/web/src/app/(portal)/safety/page.tsx` — Created: Safety Files table with All/Compliant/Expiring/Expired filter tabs, using correct `SafetyFile` type fields (`client_name`, `site`, `approved_at`).
- `apps/web/src/app/(portal)/clients/page.tsx` — Created: Clients table using `@blackfire/types` `Client` type (`contact_person`, `email`, `phone`, `active`).
- `apps/web/src/app/(portal)/admin/users/page.tsx` — Created: Users & Roles table (admin/sysadmin only), role label mapping, `last_login` display.
- `apps/web/src/app/(portal)/admin/audit/page.tsx` — Created: Paginated Audit Log (admin/sysadmin only), 100 per page with prev/next pagination.
- `apps/web/src/app/(portal)/support/page.tsx` — Created: Support Overview page: current user account info, quick-link cards (admin-gated), emergency/ops/finance contacts, platform info.
- `BlackFire/docs/architecture_portal_app.md` — Created: complete architecture doc covering system overview, auth flow, route mapping table (all 3 surfaces), web app directory tree, navigation structure, mobile app structure, shared packages, cross-device workflow examples, public assets, permission model, design tokens, implementation status matrix, and local dev setup.

## Blockers / Next Steps
- **Web app mutation pages** (Phase 2): `/quotes/new`, `/invoices/new`, `/invoices/log-payment`, `/safety/new`, `/clients/new`, `/admin/users/new`, `/tracker/call-log/new` — forms need implementation
- **Mobile app** (Phase 2): All screens except LoginScreen are unimplemented — Dashboard, Tracker, Call Log, Quotes, Invoices, Support, Help
- **Dark mode CSS** (Phase 2): Theme button toggles `data-theme` attribute but Tailwind CSS dark mode styles not yet applied to components
- **Quotes/Invoices detail pages** — individual record view (`/quotes/[id]`, `/invoices/[id]`) need implementation for full portal parity

## Learnings
- The theme toggle in PortalShell was a static `<span>` with no handler — always verify interactive elements are actually wired up, not just visually present
- The web app's public directory was missing all branded favicons that the PHP portal had — always cross-check public assets between surfaces
- `@blackfire/types` is the ground truth for field names — always import from there rather than declaring local interfaces that may drift from the PHP API contract
- The mobile app has only one implemented screen (LoginScreen) — the architecture is scaffolded but the app is not yet production-usable beyond login
- The Help page was Tracker/Dashboard-only — a production portal needs a help entry for every section so users are never stuck
_Session ended: 2026-06-21 10:08:15 (Claude Code / claude-sonnet-4-6)_
