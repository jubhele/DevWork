# PBI Task Queue

Status: Complete
Source of truth: `powerbi/UmliloPortal_Dashboard.pbip`
Reference plan: `docs/pbi-layout-implementation-plan.md`
Checklist: `docs/pbi-build-checklist.md`
Briefs: `docs/pbi-session-briefs/index.md`
Generator: `scripts/create-pbi-sessions.ps1`
Progress tracker: `docs/pbi-progress-detail.md`

## Recommended Session Model

- Run the shared foundation first.
- Then run one session per page.
- Keep each page session cross-layer so PHP, Next.js, and mobile stay visually aligned.
- Use a final integration session for parity checks, mobile QA, and cleanup.

## Queue

### Traffic-Light View

Legend:

- `GREEN` = fully established for that rollout step
- `YELLOW` = partially complete or implemented in some layers
- `RED` = not yet started or not yet ready

| Order | Session | Status | Why |
|---|---|---|---|
| 0 | Brief Pack Kickoff | GREEN | The kickoff file is generated first and the batch already uses it |
| 1 | Shared Foundation | GREEN | Shared hierarchy, responsive card/list language, status tracking, and verification commands are now established across the rollout |
| 2 | Executive Dashboard | GREEN | PHP, Next.js, and mobile now share the Power BI executive hero, KPI, trend, status, and CTA order |
| 3 | Finance Reporting | GREEN | Cross-layer implementation landed across PHP, Next.js, and mobile; integration QA passed with authenticated embed screenshots noted for production cutover |
| 4 | Safety & Compliance | GREEN | Cross-layer implementation landed across PHP, Next.js, and mobile; integration QA passed |
| 5 | Operations Tasks | GREEN | Cross-layer implementation landed across PHP, Next.js, and mobile; integration QA passed |
| 6 | Ledger | GREEN | Dedicated rollout pass landed across PHP, Next.js, and mobile; integration QA passed with authenticated embed screenshots noted for production cutover |
| 7 | Integration And Release QA | GREEN | Cross-layer release QA report, final issues list, and signoff notes are complete |

| Order | Session | Primary owner | Supporting owners | Suggested execution order inside the session | Main outputs |
|---|---|---|---|---|---|
| 1 | Shared Foundation | uMdwebi | uMakhi, uMbheki, uMvavanyi, uSibali | 1. Audit Power BI tokens and current UI primitives. 2. Define shared color, typography, spacing, and elevation tokens. 3. Build reusable header, KPI card, chart wrapper, and list fallback patterns. 4. Define mobile collapse rules. 5. Run UX and functional QA. | Shared design tokens and reusable layout primitives for all three surfaces |
| 2 | Executive Dashboard | uMakhi | uMdwebi, uMvavanyi, uMbheki | 1. Review the Power BI Executive Dashboard page. 2. Build the page shell in PHP, then Next.js, then mobile. 3. Add hero summary, KPI strip, trend row, and alerts/status cards. 4. Align embed/native shell behavior. 5. QA at phone, tablet, and desktop widths. | Dashboard page parity across PHP, Next.js, and mobile |
| 3 | Finance Reporting | uMakhi | uMdwebi, uMvavanyi, uMbheki | 1. Review the Power BI Finance page. 2. Build finance shell sections in PHP, then Next.js, then mobile. 3. Add finance KPIs, trend block, client breakdown, and aging/status list. 4. Confirm the Power BI embed view matches the native shell. 5. QA mobile list/table fallbacks. | Finance page parity and responsive reporting layout |
| 4 | Safety & Compliance | uMakhi | uMdwebi, uMvavanyi, uMbheki | 1. Review the Safety & Compliance page. 2. Build compliance summary cards and regional blocks in PHP, then Next.js, then mobile. 3. Add status donut or equivalent summary. 4. Add recent-file list and small-screen fallback. 5. QA that compliance state is visible immediately on phones. | Safety/compliance page parity and mobile-first status layout |
| 5 | Operations Tasks | uMakhi | uMdwebi, uMvavanyi, uMbheki | 1. Review the Operations Tasks page. 2. Build open-task, assignee-load, and due/overdue sections in PHP, then Next.js, then mobile. 3. Reuse tracker components where practical. 4. Convert wide tables into compact grouped lists on phones. 5. QA task readability and tap targets. | Operations/task page parity across all surfaces |
| 6 | Ledger | uMakhi | uMdwebi, uMcwaningi, uMvavanyi, uMbheki | 1. Review the Ledger page. 2. Build summary cards and transaction trend in PHP, then Next.js, then mobile. 3. Add grouped transaction list or audit table. 4. Add expandable row behavior if required for phones. 5. Run code QA and UX QA because this page is the most detail-heavy. | Ledger deep-dive page with audit-friendly and mobile-safe presentation |
| 7 | Integration And Release QA | uMvavanyi | uMbheki, uMcwaningi, uMlindi | 1. Run end-to-end checks across all pages. 2. Verify route order and content hierarchy. 3. Check desktop, tablet, and phone layouts. 4. Confirm no page depends on brittle SVG card rendering. 5. Perform governance and compliance review before release. | Cross-layer parity signoff and release readiness |

## Suggested Queue Order If Capacity Is Limited

1. Shared Foundation
2. Executive Dashboard
3. Finance Reporting
4. Safety & Compliance
5. Operations Tasks
6. Ledger
7. Integration And Release QA

## Parallelization Notes

- Once the shared foundation is complete, the page sessions can run in parallel if enough owners are available.
- The safest parallel split is two page sessions at a time.
- Do not let the PHP, Next.js, and mobile implementations for the same page drift into separate uncoordinated sessions.
- If only one implementation lane is available, keep the same session order above but execute the layers in the order listed inside each session.

## Handoff Rules

- The generator starts with a brief-pack kickoff file before writing the shared foundation session.
- Each session should end with the page state documented in its session log.
- Each page session should name the next dependency before closing.
- The integration session should be the last session before ship.
- Use `scripts/create-pbi-sessions.ps1` to generate the matching session logs when you start the rollout.
- The generator accepts `-Target Root`, `-Target PortalSessions`, or `-Target MirrorOnly` depending on where you want the files written.
- The generator also accepts `-StartTimestamp` so every file in a batch can share the same handoff stamp.
- The generator also accepts `-BatchName` to embed a friendly batch label in each session title, and `-DryRun` to print the would-be file list without writing anything.
- If you rerun the same timestamp, the generator appends a run suffix so you can create multiple passes of the same batch safely.
- The detailed progress tracker shows the action list, files done, and files left in one place.

## Brief Pack

- Shared Foundation: `docs/pbi-session-briefs/shared-foundation.md`
- Executive Dashboard: `docs/pbi-session-briefs/executive-dashboard.md`
- Finance Reporting: `docs/pbi-session-briefs/finance-reporting.md`
- Safety & Compliance: `docs/pbi-session-briefs/safety-compliance.md`
- Operations Tasks: `docs/pbi-session-briefs/operations-tasks.md`
- Ledger: `docs/pbi-session-briefs/ledger.md`
- Integration And Release QA: `docs/pbi-session-briefs/integration-release-qa.md`
