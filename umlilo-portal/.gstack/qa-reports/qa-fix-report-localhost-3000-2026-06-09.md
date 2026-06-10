# Umlilo Portal QA Fix Report

Date: 2026-06-09
Target: http://localhost:3000
Run id: 20260609_220214

## Scope

- Used credentialed accounts from `.env` without printing passwords.
- Tested admin, safety, compliance, and inspector login paths.
- Exercised desktop routes: `/dashboard`, `/callouts`, `/quotes`, `/invoices`, `/admin/audit`, `/privacy`.
- Exercised mobile routes: `/dashboard`, `/callouts`.
- Captured console errors, page errors, failed network responses, screenshots, lint, build, and agent tests.

## Baseline Findings

- Dashboard displayed a data load error.
- `/quotes` returned a runtime 500.
- `/invoices` returned a runtime 500.
- `/admin/audit` returned 404.
- Legacy `portal.js` produced client-side console errors on Next pages.
- Lint reported 61 problems, mostly from backup artifacts plus live lint issues.
- The inspector account from `.env` failed backend authentication.

Baseline screenshots:
`C:\DevWork\umlilo-portal\.gstack\qa-reports\screenshots\fix-baseline-20260609_220214`

## Fixes Applied

- Normalized dashboard KPI, quote, and invoice API responses before rendering money/date fields.
- Added a local `dashboard.php` bridge response for the Next API compatibility layer.
- Added the missing `/admin/audit` route.
- Removed the global legacy `portal.js` include from the Next app shell.
- Fixed live lint errors in login and sidebar code.
- Excluded backup folders and legacy public `portal.js` from the web lint scope.

## Final Results

- Admin login: pass.
- Safety login: pass.
- Compliance login: pass.
- Inspector login: fail, rejected by backend auth using the `.env` account.
- `/dashboard`: pass, KPI cards render.
- `/callouts`: pass.
- `/quotes`: pass.
- `/invoices`: pass.
- `/admin/audit`: pass.
- `/privacy`: pass.
- Mobile `/dashboard`: pass.
- Mobile `/callouts`: pass.
- Console/network/page errors during final run: none.

Final screenshots:
`C:\DevWork\umlilo-portal\.gstack\qa-reports\screenshots\fix-final-20260609_220214`

## Verification

- `pnpm --filter web lint`: pass with one existing Next font warning.
- `pnpm --filter web build`: pass.
- `pnpm --filter web test:agent`: pass.
- Browser QA runner: pass except inspector backend authentication.

## Remaining Item

The inspector `.env` credentials are still rejected by the live backend auth service. The app now surfaces the failed login cleanly, and audit logs record the backend `LOGIN_FAIL`. This needs a credential/account reset or backend auth mapping check, not another frontend route fix.
