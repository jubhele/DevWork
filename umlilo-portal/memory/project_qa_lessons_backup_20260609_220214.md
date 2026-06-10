# Umlilo Portal QA Lessons

Date: 2026-06-09
Source: `c:\DevWork\umlilo-portal\.gstack\qa-reports\qa-report-localhost-3000-2026-06-09.md`

## Lessons

- Browser QA must fill the login arithmetic security check. A failed credentialed pass can be an automation gap if the third challenge field is empty.
- Never judge this app by `next build` alone. `/quotes` and `/invoices` built successfully but failed at request time because page code called `total.toLocaleString(...)` when API or fixture records had no `total`.
- For finance pages, validate API contract shape before rendering money fields. Use the real response keys or normalize records before UI formatting.
- Treat sidebar links as route contract tests. The UI links to `/audit`, but the production route list does not include `/audit`, so linked navigation can 404 even when build passes.
- Auth QA must test all `.env` roles independently. Admin, safety, and compliance logged in, while inspector returned `401 Unauthorized`.
- Legacy `portal.js` still runs on Next pages. It assumes DOM nodes that are absent in the new shell and produces `buildHomeCats` null-element errors.
- Login asset paths are fragile with query-string routes. The browser requested `/login?next=%2Fportal.js`, received HTML, and raised `Unexpected token '<'`.
- Lint currently includes backup files and fails on both backup artifacts and live code. Before using lint as a release gate, exclude backup folders or move them outside the lint scope.

## Recommended QA Pattern

1. Start with a dirty-worktree check and keep QA non-mutating unless a fix pass is explicitly requested.
2. Run credentialed browser QA with admin plus each role account from `.env`; never print secret values.
3. Cover both rendered pages and linked navigation: `/dashboard`, `/callouts`, `/quotes`, `/invoices`, `/audit`, `/privacy`, and mobile dashboard/callouts.
4. Capture console, page errors, HTTP status, screenshots, `pnpm --filter web test:agent`, `pnpm --filter web lint`, and `pnpm --filter web build`.
5. Fix order from this QA run: finance data shape, dashboard data load, inspector account/auth mapping, audit route/link, legacy asset/DOM cleanup, lint scope.
