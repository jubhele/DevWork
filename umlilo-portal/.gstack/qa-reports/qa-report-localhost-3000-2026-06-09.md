# QA Report: Umlilo Portal (localhost:3000)

Date: 2026-06-09
Run ID: 20260609_203217
Target: http://localhost:3000
Framework: Next.js 16.2.6
Mode: Credentialed browser QA, non-mutating
Credentials: Loaded from .env; secret values redacted
Pages visited: 8
Screenshots: 16
Health score: 66/100

## Summary

| Severity | Count |
| --- | ---: |
| Critical | 1 |
| High | 4 |
| Medium | 1 |
| Low | 0 |

## Accounts Tested

| Role | Login Result | Landing URL |
| --- | --- | --- |
| admin | Pass | /dashboard |
| safety | Pass | /dashboard |
| compliance | Pass | /dashboard |
| inspector | Fail | /login?next=%2F |

## Pages Covered

| Page | HTTP | URL | Evidence |
| --- | ---: | --- | --- |
| dashboard | 200 | /dashboard | .gstack/qa-reports/screenshots/20260609_203217/dashboard-dashboard.png |
| callouts | 200 | /callouts | .gstack/qa-reports/screenshots/20260609_203217/callouts-callouts.png |
| quotes | 500 | /quotes | .gstack/qa-reports/screenshots/20260609_203217/quotes-quotes.png |
| invoices | 500 | /invoices | .gstack/qa-reports/screenshots/20260609_203217/invoices-invoices.png |
| audit | 404 | /audit | .gstack/qa-reports/screenshots/20260609_203217/audit-audit.png |
| privacy | 200 | /privacy | .gstack/qa-reports/screenshots/20260609_203217/privacy-privacy.png |
| mobile-dashboard | 200 | /dashboard | .gstack/qa-reports/screenshots/20260609_203217/mobile-dashboard-dashboard.png |
| mobile-callouts | 200 | /callouts | .gstack/qa-reports/screenshots/20260609_203217/mobile-callouts-callouts.png |

## Console / Network Health

- ERROR pageerror: Unexpected token '<'
- ERROR pageerror: Cannot set properties of null (setting 'innerHTML')
- ERROR pageerror: Cannot set properties of null (setting 'innerHTML')
- ERROR response: 500 GET http://localhost:3000/quotes
- ERROR console: Failed to load resource: the server responded with a status of 500 (Internal Server Error)
- ERROR pageerror: Cannot read properties of undefined (reading 'toLocaleString')
- ERROR response: 500 GET http://localhost:3000/invoices
- ERROR console: Failed to load resource: the server responded with a status of 500 (Internal Server Error)
- ERROR pageerror: Cannot read properties of undefined (reading 'toLocaleString')
- WARNING response: 404 GET http://localhost:3000/audit
- ERROR console: Failed to load resource: the server responded with a status of 404 (Not Found)
- ERROR pageerror: Cannot set properties of null (setting 'innerHTML')
- ERROR pageerror: Cannot set properties of null (setting 'innerHTML')
- WARNING response: 401 POST http://localhost:3000/api/auth/login
- ERROR console: Failed to load resource: the server responded with a status of 401 (Unauthorized)

## Command Checks

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm --filter web test:agent` | Pass | Captcha, login JSON, and files API smoke checks passed. |
| `pnpm --filter web lint` | Fail | 61 problems: 11 errors and 50 warnings. Notable live-file error: `src/app/login/page.tsx:44` violates `react-hooks/set-state-in-effect`; backup files are also being linted. |
| `pnpm --filter web build` | Pass | Production build completed. Generated app routes include `/dashboard`, `/callouts`, `/quotes`, `/invoices`, and `/privacy`, but no `/audit` route. |

## Issues

### ISSUE-001: inspector login did not reach an authenticated page
- Severity: Critical
- Category: Functional
- Fix Status: deferred
- Evidence: .gstack/qa-reports/screenshots/20260609_203217/inspector-login-after.png
- Repro Steps:
  Go to http://localhost:3000.
  Fill inspector credentials from .env.
  Submit the login form.
- Observed: The page remained at http://localhost:3000/login?next=%2F with a password field still present.
- Expected: A valid .env user should reach the authenticated portal shell.

### ISSUE-002: /quotes returned HTTP 500
- Severity: High
- Category: Functional
- Fix Status: deferred
- Evidence: .gstack/qa-reports/screenshots/20260609_203217/quotes-quotes.png
- Repro Steps:
  Log in with admin credentials from .env.
  Navigate to /quotes.
- Observed: The route responded with HTTP 500.
- Expected: A linked portal route should load successfully or redirect intentionally.

### ISSUE-003: /invoices returned HTTP 500
- Severity: High
- Category: Functional
- Fix Status: deferred
- Evidence: .gstack/qa-reports/screenshots/20260609_203217/invoices-invoices.png
- Repro Steps:
  Log in with admin credentials from .env.
  Navigate to /invoices.
- Observed: The route responded with HTTP 500.
- Expected: A linked portal route should load successfully or redirect intentionally.

### ISSUE-004: /audit returned HTTP 404
- Severity: Medium
- Category: Functional
- Fix Status: deferred
- Evidence: .gstack/qa-reports/screenshots/20260609_203217/audit-audit.png
- Repro Steps:
  Log in with admin credentials from .env.
  Navigate to /audit.
- Observed: The route responded with HTTP 404.
- Expected: A linked portal route should load successfully or redirect intentionally.

### ISSUE-005: /dashboard shows a data-load failure message
- Severity: High
- Category: Functional
- Fix Status: deferred
- Evidence: .gstack/qa-reports/screenshots/20260609_203217/dashboard-dashboard.png
- Repro Steps:
  Log in with admin credentials from .env.
  Navigate to /dashboard.
- Observed: BLACKFIRE Dashboard Audit Log Jubhele Shange Admin DASHBOARD Welcome back, Jubhele Shange. Could not load dashboard data.
- Expected: Authenticated portal pages should show live or fixture data instead of a failed-load message.

### ISSUE-006: 13 browser/runtime error events during QA
- Severity: High
- Category: Console
- Fix Status: deferred
- Evidence: .gstack/qa-reports/screenshots/20260609_203217/dashboard-dashboard.png
- Repro Steps:
  Run the credentialed QA flow against localhost:3000.
  Open the browser console/network log while navigating authenticated routes.
- Observed: Unexpected token '<' | Cannot set properties of null (setting 'innerHTML') | Cannot set properties of null (setting 'innerHTML') | 500 GET http://localhost:3000/quotes | Failed to load resource: the server responded with a status of 500 (Internal Server Error)
- Expected: Core portal navigation should not produce runtime errors or failed same-origin requests.

## Top 3 Things To Fix

1. ISSUE-001: inspector login did not reach an authenticated page (Critical)
2. ISSUE-002: /quotes returned HTTP 500 (High)
3. ISSUE-003: /invoices returned HTTP 500 (High)

## PR Summary

QA found 6 issues, fixed 0, health score 66 -> 66.
