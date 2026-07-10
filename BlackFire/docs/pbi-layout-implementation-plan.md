# PBI Layout Implementation Plan

Status: Draft
Owner: Portal design and portal implementation
Source of truth: `powerbi/UmliloPortal_Dashboard.pbip`

## Goal

Use the Power BI project as the layout and content hierarchy reference for the portal, then implement the same structure across:

- PHP portal shell
- Next.js web app
- Expo mobile app

The Power BI project does not replace these surfaces. It defines the page structure, emphasis, and visual rhythm that each surface must reproduce with native UI.

## Core Rules

1. Power BI is the design reference, not the runtime.
2. Each platform gets its own implementation.
3. The same tokens, spacing, and content order should be reused everywhere.
4. Mobile is the default constraint. Desktop is an expansion of the same layout, not a different product.
5. No fixed-width dashboard blocks on mobile.
6. Every report-like page must degrade cleanly into stacked cards and readable lists.

## Implementation Layers

### 1. Reference Layer

- Source: `powerbi/UmliloPortal_Dashboard.pbip`
- Purpose: defines page order, section hierarchy, card density, and visual intent.
- Output: page map, section map, and token guidance for the portal shells.

### 2. Shared Design Layer

- Add or align shared tokens for:
  - color
  - typography
  - spacing
  - surface elevation
  - borders
  - chart/card spacing
- Keep the same names and semantics in PHP, Next.js, and mobile where possible.

### 3. Surface Layer

- PHP portal: static shell and server-rendered pages
- Next.js: authenticated portal pages
- Mobile: tab-based screen equivalents

## Page-by-Page Map

| Power BI page | Purpose | Next.js route | PHP surface | Mobile surface | Layout pattern |
|---|---|---|---|---|---|
| Executive Dashboard | Top-level overview for leadership, fast health check, priority metrics | `/dashboard` | Dashboard landing area in `portal.php` | `DashboardScreen` | Hero KPI row, trend chart row, alerts/status cards, one primary CTA block |
| Finance Reporting | Revenue, invoices, payments, cashflow, and client finance visibility | `/finance` and finance subviews | Finance section in `portal.php` | `InvoicesScreen` or Finance tab view | KPI strip, monthly trend, client breakdown, aging/status list, table/list fallback |
| Safety & Compliance | Safety files, compliance status, regional visibility, recent records | `/safety` | Safety section in `portal.php` | New safety/compliance screen or support subview | Compliance summary cards, donut/status chart, region card, recent-file list |
| Operations Tasks | Open work, assignee load, task states, operational backlog | `/ops/tasks` plus `/tracker` | Ops section in `portal.php` | `TrackerScreen` and nested operations views | Task cards, assignee distribution, overdue state list, compact task table |
| Ledger | Detailed debit/credit activity and financial audit trail | `/finance/ledger` or finance ledger subview | Finance deep-dive panel in `portal.php` | Finance drill-down view | Ledger summary cards, transaction trend, grouped table, audit-friendly list |

## Page Map Details

### Executive Dashboard

- Keep this as the first and simplest landing view.
- Show the most important KPIs first.
- Use one strong hero block, then 2 to 3 supporting rows.
- On mobile, collapse the hero into a single summary card and stack the KPI cards in a 2-column grid only when space allows.

### Finance Reporting

- Use this page for finance confidence, not just raw totals.
- The first row should be readable at a glance.
- Charts and tables must degrade into segmented cards or grouped lists on mobile.
- Keep this view aligned with the secure Power BI embed surface on the web app.

### Safety & Compliance

- Treat this as a compliance status page with visible risk signals.
- Put compliance score, file state, and regional distribution ahead of deep tables.
- On mobile, show status cards first and move table-style detail below the fold.

### Operations Tasks

- Make the assignee load and open-task state obvious immediately.
- Prioritize tasks by urgency and due state.
- On mobile, use tappable cards and compact grouped lists instead of wide tables.

### Ledger

- This is the most detail-heavy page and should remain audit-friendly.
- Keep summary metrics on top and the ledger list beneath.
- On mobile, replace wide tables with a vertical transaction feed plus expandable rows if needed.

## Platform Execution Plan

### PHP Portal

- Align `portal.php` and `portal.css` to the same visual language.
- Rework dashboard/report sections into reusable cards and responsive sections.
- Keep public-site and portal-shell behavior separate.
- Ensure the layout collapses cleanly at phone widths.

### Next.js Web App

- Build portal pages from the shared shell already in `apps/web/src/components/PortalShell.tsx`.
- Reuse the same section order across `/dashboard`, `/finance`, `/safety`, `/ops/tasks`, and `/tracker`.
- Keep Power BI embedded views inside the matching portal routes.
- Preserve a single-column fallback for narrow screens.

### Mobile App

- Mirror the same content hierarchy in the Expo screens.
- Use bottom tabs for top-level navigation and stacked cards for page content.
- Avoid desktop-style grids that force horizontal scrolling.
- Keep the highest-value metrics visible within the first screenful.

## Implementation Phases

### Phase 1: Token and layout alignment

- Confirm the shared tokens for color, type, and spacing.
- Extract the report page patterns into a reusable layout spec.
- Align the PHP and Next.js shells to the same hierarchy.

### Phase 2: Page shell implementation

- Build the portal shells and page sections for each mapped page.
- Make the mobile layouts match the same order with a smaller density.

### Phase 3: Power BI tie-in

- Use the embedded report surfaces where the data is already secured in Power BI.
- Keep the portal UI consistent whether the content is native or embedded.

### Phase 4: Mobile verification

- Validate each page at common phone widths.
- Confirm that every page still reads cleanly without hover, large tables, or fixed-width panels.

## Acceptance Criteria

- The same page order appears in all three surfaces.
- The same visual hierarchy appears in all three surfaces.
- Mobile views stay readable and usable.
- No page depends on SVG card rendering to communicate the layout.
- The Power BI project remains the reference artifact for page structure.

## Notes

- The report project currently contains five pages:
  - Executive Dashboard
  - Finance Reporting
  - Safety & Compliance
  - Operations Tasks
  - Ledger
- The report folders live under `powerbi/` so the PBIP, report, and semantic model stay together.
