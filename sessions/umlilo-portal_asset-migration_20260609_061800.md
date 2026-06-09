# Session: umlilo-portal_asset-migration
Date: 2026-06-09
Provider: GitHub Copilot
Model: GPT-5 mini

## Goal
Migrate static frontend assets (portal.css, portal.js, robots.txt, sitemap.xml, images) from the legacy BlackFire Portal into the Next.js app at C:\DevWork\umlilo-portal\apps\web. Wire the stylesheet and script into the Next.js root layout, validate visuals first (CSS + images), then enable the original runtime safely by providing API stubs and addressing CSP/runtime issues.

## Model Recommendation
Task tier: 2 â€” Medium
Recommended: Tier 2 model (strong reasoning + multi-file edits)
Active model: GPT-5 mini (current session)

## Decisions
- Use a visual-first, non-destructive approach: always create backups before editing live files.
- Inject a per-request CSP nonce server-side in `apps/web/src/app/layout.tsx` and expose it via `<meta name="csp-nonce">` so `portal.js` can safely inject styles.
- Start with a safe placeholder `portal.js` for visual validation, then replace with the original runtime after backups.
- Implement a catch-all API at `apps/web/src/app/api/[...slug]/route.ts` to provide conservative stubs for endpoints used by `portal.js`, and iteratively expand precise JSON shapes.

## Work Done
- Backups & manifest: created backup copies and a manifest prior to edits (see `apps/web/_backups/`).
- CSS/images: copied `portal.css` to `apps/web/public/portal.css` and ~66 images to `apps/web/public/images/`.
- Script: placeholder `portal.js` deployed, then original `portal.js` copied into `apps/web/public/portal.js` (placeholder backed up to `apps/web/_backups/`).
- Layout change: patched `apps/web/src/app/layout.tsx` to generate a per-render nonce and inject `<meta name="csp-nonce">`; added `<script src="/portal.js" defer nonce={nonce}></script>` (backup saved at `apps/web/src/app/_backups/layout_backup_20260609_120000.tsx`).
- API stubs: implemented `apps/web/src/app/api/[...slug]/route.ts` with conservative stubs for `auth.php`, `files.php`, `callouts.php`, `quotes.php`, `invoices.php`, `transactions.php`, `safety.php`, `clients.php`, `users.php`, and `dashboard_prefs.php` (GET/PUT support for dashboard prefs).  Files view redirects to the public image for dev testing.
- Dev server: restarted Next dev server for `apps/web` and visually confirmed the portal styles are applied at http://localhost:3000 (login page renders with `portal.css`).

## Blockers / Next Steps
- Flesh out exact JSON shapes and status code behavior for all `portal.js`-used endpoints (auth session formats, attachments structure, pagination, 401 behavior).
- Implement multipart file uploads for `apiUpload()` (POST `files.php`) to enable attachments upload flows.
- If CSP is later enforced via HTTP headers, add header-level nonce injection in server responses.
- Optionally mirror this session log to the G: drive per workspace constitution.

## Learnings
- Visual-first validation (CSS + images) is fast and low-risk; runtime activation should follow once backend expectations are met.
- `portal.js` requires specific JSON shapes and auth/session behavior â€” conservative stubs reduce runtime crashes but must be refined for full functionality.
- Next dev server and PowerShell quoting can cause operational friction; prefer absolute paths and explicit URL handling in dev routes.

## Work Done (Files Changed)
- apps/web/src/app/layout.tsx â€” injected CSP nonce + script tag (backup at apps/web/src/app/_backups/layout_backup_20260609_120000.tsx)
- apps/web/public/portal.css â€” copied from BlackFire portal
- apps/web/public/portal.js â€” original runtime copied (placeholder backed up at apps/web/_backups/portal_backup_<timestamp>.js)
- apps/web/public/images/ â€” static images copied (~66 files)
- apps/web/public/robots.txt, apps/web/public/sitemap.xml â€” added
- apps/web/_backups/public_backup_20260609_120000/manifest.txt â€” backup manifest
- apps/web/src/app/api/[...slug]/route.ts â€” implemented API stubs


---

## Continuation — 2026-06-09 11:20 SAST

## Decisions
- Replaced the broad conservative catch-all with a contract-shaped in-memory Route Handler that matches `portal.js` normalizers for callouts, quotes, invoices, transactions, safety files, clients, users, attachments, statements, audit, dashboard prefs, and signature endpoints.
- Removed the prior forbidden placeholder/demo-style API identity language from the active route and used confirmed/pilot AECI/BlackFire records instead.
- Kept multipart uploads local to `apps/web/public/uploads/` for development validation only; backend persistence remains a later migration step.
- Updated `scripts/test-agent.js` to use `process.exitCode` instead of immediate `process.exit()` so Windows/Node fetch handles close cleanly after passing assertions.

## Work Done
- Rebuilt `apps/web/src/app/api/[...slug]/route.ts` as a Node dynamic catch-all API with realistic response shapes and mutable in-memory state.
- Added upload/list/view/download support for `files.php`, including `data.attachments`, top-level `attachments`, and saved public upload URLs.
- Added create/update/delete handling for callouts, quotes, invoices, clients, users, safety files, statements, signatures, and common safety submodules.
- Moved route backup out of `src` into `apps/web/_backups/` to avoid linting stale backup code.
- Backed up `scripts/test-agent.js` before patching its shutdown behavior.

## Validation
- `npm run build` — PASS.
- `npx eslint 'src/app/api/[...slug]/route.ts' scripts/test-agent.js` — PASS.
- `npm run test:agent` — PASS.
- Full `npm run lint` still reports pre-existing/unrelated issues in `public/portal.js`, `src/app/login/page.tsx`, and existing backup files.

## Blockers / Next Steps
- Runtime is now suitable for safer browser validation of authenticated portal flows, but it is still in-memory and not a real backend replacement.
- Next step: run the Next dev server, log in as `j.shange`, and manually exercise dashboard, callouts, quote approval, invoice send/paid, attachments, clients, users, statements, and safety pages.
- After visual/runtime validation, migrate endpoint contracts into generated/shared types rather than keeping large ad-hoc route data in this catch-all.

## Learnings
- `portal.js` depends mainly on snake_case API payloads that are normalized immediately; stubs should target those normalizer inputs, not rendered camelCase shapes.
- Keeping backups inside `src` can pollute ESLint/TypeScript checks; migration backups belong under non-source backup folders.
- On Windows, immediate `process.exit()` after fetch-based smoke tests can crash during handle shutdown even when assertions pass; setting `process.exitCode` is safer.

---

## Credentialed Validation — 2026-06-09 11:35 SAST

## Decisions
- Used `DEV_ADMIN_USER` and `DEV_ADMIN_PASS` from `BlackFire/BlackFire Portal/.env` for validation without printing secret values.
- Treated the credentialed checks as API/runtime smoke validation only; no persistent backend migration was attempted.

## Work Done
- Confirmed Next dev server was already responding on `http://localhost:3000`.
- Logged in successfully through `POST /api/auth.php?action=login` with the dev admin credentials; returned `role=sysadmin`.
- Verified migrated runtime endpoints: callouts, quotes, invoices, transactions, safety, clients, users, dashboard prefs, files, statements, and audit.
- Verified mutations: dashboard prefs update, audit insert, quote approval, invoice send action, and multipart file upload.
- Removed the temporary upload file and deleted its in-memory attachment record after validation.

## Validation
- Credentialed login — PASS.
- Read endpoint smoke — PASS for 11 endpoint checks.
- Mutation smoke — PASS for dashboard prefs, audit, quote approval, invoice send, and file upload.

## Blockers / Next Steps
- Browser-level UI clickthrough is still needed to confirm DOM/runtime behavior across portal pages.
- The API remains in-memory development scaffolding; real persistence/session parity still needs backend integration or typed generated handlers.

## Learnings
- The legacy `.env` dev credentials are enough to validate the migrated Next catch-all API without hardcoding credentials in the app or scripts.
- Multipart upload shape works against `portal.js` expectations when returning both top-level attachment data and list-compatible attachment records.
