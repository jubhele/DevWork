# PBI Progress Detail

Source of truth: `docs/pbi-task-queue.md`
Dashboard: `docs/pbi-rollout-status.html`

## Action List

| Order | Action | Status | Done | Left |
|---|---|---|---|---|
| 0 | Brief Pack Kickoff | GREEN | Kickoff file generated and the batch is wired up | None |
| 1 | Shared Foundation | GREEN | Queue, status, rollout server, generator docs, shared hierarchy, responsive card/list language, and verification commands are in place | None |
| 2 | Executive Dashboard | GREEN | Native executive page hierarchy now lands across PHP, Next.js, and mobile | Final screenshot capture can be added during integration QA |
| 3 | Finance Reporting | GREEN | Native finance reporting sections now landed across PHP, Next.js, and mobile; type checks, PHP syntax, route parity, and integration QA pass | Authenticated Power BI embed screenshot remains a production cutover note |
| 4 | Safety & Compliance | GREEN | Native safety/compliance sections now landed across PHP, Next.js, and mobile; type checks, PHP syntax, route parity, and integration QA pass | None |
| 5 | Operations Tasks | GREEN | Native operations task sections now landed across PHP, Next.js, and mobile; type checks, PHP syntax, route parity, and integration QA pass | None |
| 6 | Ledger | GREEN | Ledger summary cards, credits/debits trend, category exposure, and transaction feeds now land across PHP, Next.js, and mobile; type checks, PHP syntax, route parity, and integration QA pass | Authenticated ledger embed screenshot remains a production cutover note |
| 7 | Integration And Release QA | GREEN | Cross-layer QA report, final issues list, and release-ready signoff notes are complete | Final authenticated embed screenshots should be captured before production cutover |

## Files in Progress by Layer

| Layer | File | Status | Why |
|---|---|---|---|
| PHP | `BlackFire Portal/portal.php` | GREEN | Dashboard surface is driven by `portal.js`; PHP shell hierarchy and release QA are complete |
| PHP | `BlackFire Portal/portal.css` | GREEN | Executive, finance, safety, operations, and ledger responsive cards/lists are aligned; public responsive smoke QA passed |
| Next.js | `apps/web/src/app/(portal)/dashboard/page.tsx` | GREEN | Executive dashboard now mirrors the Power BI hero, KPI, trend, status, and CTA order |
| Next.js | `apps/web/src/app/(portal)/finance/page.tsx` | GREEN | Finance KPI strip, trend, client breakdown, aging/status, ledger deep-dive, list fallback, and embed shell are implemented |
| Next.js | `apps/web/src/app/(portal)/safety/page.tsx` | GREEN | Safety & Compliance now mirrors the Power BI order with KPI cards, regional status, mobile cards, and detail records |
| Next.js | `apps/web/src/app/(portal)/tracker/page.tsx` | GREEN | Tracker now uses summary cards, assignee load, due/overdue ordering, and stacked task cards |
| Next.js | `apps/web/src/app/(portal)/tracker/[id]/page.tsx` | GREEN | Detail route is covered by the protected-route parity pass and inherits the shared portal shell |
| Next.js | `apps/web/src/app/(portal)/tracker/call-log/[id]/page.tsx` | GREEN | Call-log detail route is covered by the protected-route parity pass and inherits the shared portal shell |
| Mobile | `apps/mobile/App.tsx` | GREEN | Dashboard, finance, safety, and tracker tab routing are aligned; mobile TypeScript check passed |
| Mobile | `apps/mobile/src/screens/DashboardScreen.tsx` | GREEN | Executive dashboard first-screen hierarchy now mirrors the web and PHP surfaces |
| Shared web | `apps/web/src/components/PortalShell.tsx` | GREEN | Shared shell route order and finance ledger secondary navigation are aligned |

## Files Done

| Done File | Area | Notes |
|---|---|---|
| `docs/pbi-layout-implementation-plan.md` | Planning | Page map and cross-layer rollout reference is in place |
| `docs/pbi-build-checklist.md` | Planning | Shared foundation and page checklists are captured |
| `docs/pbi-task-queue.md` | Planning | Traffic-light queue and execution order are documented |
| `docs/pbi-rollout-status.md` | Status | Platform health dashboard is in place |
| `docs/pbi-rollout-status.html` | Dashboard | Clickable rollout view with auto-refresh exists |
| `docs/pbi-progress-detail.md` | Dashboard | Detailed progress tracker is now available |
| `scripts/create-pbi-sessions.ps1` | Generator | Session generator exists with target modes, batch name, dry run, and timestamp support |
| `scripts/README.md` | Generator | Run steps and examples are documented |
| `scripts/pbi-rollout-status-server.ps1` | Dashboard | Local server can run commands and refresh state |
| `docs/multi-agent-workforce-architecture.md` | Guidance | Shared architecture guide now includes the dashboard pattern |
| `BlackFire/docs/multi-agent-workforce-architecture.md` | Guidance | BlackFire mirror includes the dashboard pattern |
| `JS_Resume/docs/multi-agent-workforce-architecture.md` | Guidance | JS_Resume mirror includes the dashboard pattern |
| `BlackFire Portal/portal.js` | PHP finance | Finance dashboard now includes client breakdown and aging/status list fallback |
| `BlackFire Portal/portal.css` | PHP finance | Responsive finance breakdown/list styles added |
| `apps/web/src/lib/data/finance.ts` | Next.js finance | Finance summary now returns trend, client, status, and recent invoice datasets |
| `apps/web/src/app/(portal)/finance/page.tsx` | Next.js finance | Native Finance Reporting hierarchy implemented around the Power BI embed |
| `apps/mobile/src/screens/InvoicesScreen.tsx` | Mobile finance | Finance tab reworked into summary cards, client/status groups, filters, and stacked invoice cards |
| `packages/api-client/index.ts` | Shared client | Finance summary response type updated for the richer reporting payload |
| `BlackFire Portal/portal.php` | PHP safety | Safety compliance summary and regional block containers added ahead of the file grid |
| `BlackFire Portal/portal.js` | PHP safety | Safety summary and regional compliance cards now derive from existing safety file data |
| `apps/web/src/app/(portal)/safety/page.tsx` | Next.js safety | Native Safety & Compliance hierarchy implemented with mobile detail fallback |
| `apps/mobile/src/screens/SafetyScreen.tsx` | Mobile safety | Live safety screen added with status cards first and recent file detail second |
| `BlackFire Portal/portal.php` | PHP ledger | Ledger summary container added above the existing P&L tabbed record |
| `BlackFire Portal/portal.js` | PHP ledger | Ledger KPIs, credits/debits trend, category exposure, and transaction feed now render from posted transactions |
| `BlackFire Portal/portal.css` | PHP ledger | Responsive ledger trend/feed styles added so narrow screens avoid wide-table lock-in |
| `apps/web/src/lib/data/finance.ts` | Next.js ledger | Finance summary now returns ledger summary, trend, category, and transaction feed datasets |
| `apps/web/src/app/(portal)/finance/page.tsx` | Next.js ledger | Ledger deep-dive section added under Finance with audit-friendly transaction cards |
| `apps/web/src/components/PortalShell.tsx` | Next.js ledger | Finance secondary navigation now exposes the Ledger section |
| `apps/mobile/src/screens/InvoicesScreen.tsx` | Mobile ledger | Finance tab now fetches transactions and shows ledger summary, categories, and vertical transaction feed |
| `BlackFire Portal/portal.js` | PHP operations | Operations dashboard and tracker now show open-task, assignee-load, and due/overdue task sections |
| `BlackFire Portal/portal.css` | PHP operations | Responsive operations task card, assignee-load, and mobile tap-target styles added |
| `apps/web/src/app/(portal)/ops/tasks/page.tsx` | Next.js operations | Native Operations Tasks hierarchy implemented with summary cards, assignee load, and due/overdue task cards |
| `apps/web/src/app/(portal)/tracker/page.tsx` | Next.js tracker | Tracker route now mirrors the operations hierarchy for task streams while preserving the call-log table |
| `apps/mobile/src/screens/TrackerScreen.tsx` | Mobile operations | Tracker screen now uses summary cards, assignee load, and urgent-first stacked task cards |
| `docs/pbi-integration-release-qa-report.md` | Release QA | Cross-layer QA report, final issues list, and signoff notes completed |

## Notes

- “Done” means the file or artifact is already in place and visible to the rollout.
- “In progress” means the file still needs implementation work before the rollout can be called complete.
- The dashboard shows both the high-level traffic light and this detailed progress view so you can track the rollout at two speeds.
