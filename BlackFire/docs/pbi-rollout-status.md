# PBI Rollout Status

Source of truth: `powerbi/UmliloPortal_Dashboard.pbip`
Queue: `docs/pbi-task-queue.md`
Progress: `docs/pbi-progress-detail.md`
Brief pack: `docs/pbi-session-briefs/index.md`
Generator: `scripts/create-pbi-sessions.ps1`
Dashboard server: `scripts/pbi-rollout-status-server.ps1`
Dashboard page: `docs/pbi-rollout-status.html`

## Dashboard

Legend:

- `GREEN` = verified and aligned
- `YELLOW` = partially complete, still needs implementation
- `RED` = blocked or failing

| Platform | Status | What is green | What is yellow | What is red |
|---|---|---|---|---|
| Generator and docs | GREEN | Brief pack kickoff file exists, generator README exists, queue documents kickoff/rerun behavior | Remaining page rollout files still need to be executed as the work continues | None |
| Next.js web | GREEN | Shared report primitives exist, Executive Dashboard is aligned, Finance Reporting now has KPI/trend/client/status/list sections around the embed, Safety & Compliance now has KPI/regional/mobile-card sections before detail records, Operations Tasks aligns `/ops/tasks` and `/tracker`, Ledger deep-dive now has KPIs/trend/feed under Finance, `typecheck` passes, live parity passes when the backend is running | Authenticated Power BI embed screenshots still need the final production cutover session | No current blocker |
| PHP portal | GREEN | Executive Dashboard native summary, KPI, trend, status, and CTA hierarchy is aligned; finance dashboard now has client breakdown and aging/status list fallback; safety now has compliance summary and regional blocks above file cards; operations now has open-task, assignee-load, and due/overdue cards; ledger now has native summary/trend/feed above the P&L record; PHP syntax check and public responsive smoke checks passed | Authenticated in-portal screenshots should be captured with a valid session before production cutover | No current blocker |
| Mobile | GREEN | Executive Dashboard screen now mirrors the shared hierarchy; finance tab now uses summary cards, grouped breakdowns, filters, stacked invoice cards, ledger summary, and a vertical transaction feed; Safety tab now shows live compliance status cards before recent file details; Tracker now uses summary cards, assignee load, and urgent-first stacked task cards; Mobile TypeScript check passes | Device screenshots remain useful for store/release evidence, but no code blocker remains | No current blocker |
| Integration QA | GREEN | Cross-layer release QA report completed; web typecheck, mobile TypeScript, PHP syntax, Next route/API/asset parity, protected-route redirects, public responsive screenshots, and brittle SVG dependency review passed | Final authenticated Power BI embed screenshot pass remains a production cutover note | Release-ready for final implementation handoff |

## Rollout Complete When

The rollout is complete when all of these are true:

- Generator and docs are green.
- Next.js web is green.
- PHP portal is green.
- Mobile is green.
- Integration QA is green.
- PHP, Next.js, and mobile all reflect the same page hierarchy.
- The final integration QA session is complete.

## Verification Commands

- Web typecheck:

```powershell
pnpm -C C:\DevWork\BlackFire\apps\web typecheck
```

- Web portal parity:

```powershell
pnpm -C C:\DevWork\BlackFire\apps\web test:portal-parity
```

- Mobile TypeScript check:

```powershell
pnpm -C C:\DevWork\BlackFire\apps\mobile exec tsc --noEmit
```

- PHP syntax check:

```powershell
Get-ChildItem 'C:\DevWork\BlackFire\BlackFire Portal' -Recurse -Filter *.php | ForEach-Object { php -l $_.FullName }
```

## Notes

- A file is "updated" only when the corresponding page/session exists and the layer check for that platform passes.
- The queue and brief pack make the intended state visible, but the validation commands are what prove the files are actually in sync.
- Start the clickable dashboard with `.\scripts\pbi-rollout-status-server.ps1` from `C:\DevWork\BlackFire`, then open `http://localhost:8790/`.
- Use the detailed progress section on the dashboard to see the action list plus files done and files left.
- Use `Start Watch Mode` when you want the server to keep rerunning full verification on an interval while you watch the dashboard.
- Executive Dashboard was implemented across PHP, Next.js, and mobile on 2026-07-09; remaining page briefs keep the platform rows yellow.
- Finance Reporting implementation landed across PHP, Next.js, and mobile on 2026-07-09; final screenshots/embed parity remain in integration QA.
- Safety & Compliance implementation landed across PHP, Next.js, and mobile on 2026-07-09; final screenshots remain in integration QA.
- Operations Tasks implementation landed across PHP, Next.js, and mobile on 2026-07-09; final screenshots and visual parity remain in integration QA.
- Ledger implementation landed across PHP, Next.js, and mobile on 2026-07-09; final screenshots and integration parity remain in release QA.
- Integration And Release QA completed on 2026-07-09; report: `docs/pbi-integration-release-qa-report.md`.
