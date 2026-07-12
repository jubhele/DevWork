# PBI Integration And Release QA Report

Date: 2026-07-09
Owner: uMvavanyi
Supporting owners: uMbheki, uMcwaningi, uMlindi
Source brief: `docs/pbi-session-briefs/integration-release-qa.md`

## Scope

Verified the Power BI-inspired rollout across PHP, Next.js, and mobile for:

- Executive Dashboard
- Finance Reporting
- Safety & Compliance
- Operations Tasks
- Ledger

## Verification Results

| Check | Result | Evidence |
|---|---|---|
| Next.js typecheck | PASS | `pnpm -C C:\DevWork\BlackFire\apps\web typecheck` |
| Mobile TypeScript | PASS | `pnpm -C C:\DevWork\BlackFire\apps\mobile exec tsc --noEmit` |
| PHP syntax | PASS | Full recursive `php -l` pass under `BlackFire Portal` |
| Next route/API/asset parity | PASS | `node apps\web\scripts\check-portal-parity.mjs` returned 36 routes, 7 assets, 4 API checks |
| Browser smoke - Next public/login | PASS | Screenshots in `tmp\pbi-next-*` |
| Browser smoke - PHP public portal | PASS | Screenshots in `tmp\pbi-php-*` |
| Protected route behavior | PASS | Next protected portal routes redirect to login during parity check |
| Brittle SVG card dependency | PASS | Page rollout uses native cards, lists, tables, and responsive feeds; SVG use is decorative/icons only |

## Route And Hierarchy Review

| Surface | Observed route/order | Result |
|---|---|---|
| Next.js | Dashboard, Operations, Finance, Support with Finance secondary nav exposing `Ledger` at `/finance#ledger`; Safety and Ops task routes are present | PASS |
| PHP portal | Dashboard, transactions/finance, tracker/operations, P&L Ledger, Safety Files, Operations, Finance surfaces remain in one authenticated shell | PASS |
| Mobile | Bottom tabs: Dashboard, Operations, Finance, Safety; Finance includes ledger summary/categories/feed | PASS |

## Final Issues List

| Severity | Issue | Status |
|---|---|---|
| Low | Next.js logs a logo image aspect-ratio warning because width or height is modified without the opposite auto dimension. | Non-blocking follow-up |
| Low | Next homepage ignition loader can be captured mid-animation if the screenshot is taken too early; after an 8 second wait it reaches 100% and renders the page. | Non-blocking QA note |
| Medium | Authenticated dashboard screenshots and live Power BI embed screenshots were not captured in this pass because no authenticated portal session was provided. | Follow-up before production cutover |

## Signoff

The cross-layer rollout is release-ready for final implementation handoff. Code-level verification, route/API parity, PHP syntax, mobile TypeScript, and public responsive smoke checks passed.

Production ship should include one final authenticated screenshot pass for the embedded Power BI reports once service-principal/RLS credentials and a valid portal session are available.
