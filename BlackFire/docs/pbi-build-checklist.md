# PBI Layout Build Checklist

Status: Complete
Source of truth: `powerbi/UmliloPortal_Dashboard.pbip`
Reference plan: `docs/pbi-layout-implementation-plan.md`

## How To Run This In Parallel

Use two stages:

1. Build the shared foundation first.
2. Then split page work in parallel by page, with each page touching PHP, Next.js, and mobile in the same session if possible.

Recommended session split:

- Session A: shared tokens and layout primitives
- Session B: Executive Dashboard
- Session C: Finance Reporting
- Session D: Safety & Compliance
- Session E: Operations Tasks
- Session F: Ledger

If the team is small, keep the platform-specific work grouped by layer instead:

- PHP implementation session
- Next.js implementation session
- Mobile implementation session

The safest parallel model is page-first, because it keeps each page visually consistent across all surfaces.

## Shared Foundation Checklist

### Design Tokens

- [x] Align color tokens between Power BI theme, PHP CSS variables, Next.js theme classes, and Expo tokens
- [x] Align typography scale for heading, body, mono labels, and numeric KPI display
- [x] Align spacing scale for page padding, section gaps, card padding, and stack rhythm
- [x] Align border radius and elevation rules for cards and panels
- [x] Define mobile breakpoints and card collapse rules once

### Layout Primitives

- [x] Define a reusable page header pattern
- [x] Define a reusable KPI card pattern
- [x] Define a reusable status/alert card pattern
- [x] Define a reusable trend chart wrapper
- [x] Define a reusable list/table fallback pattern for narrow screens
- [x] Define loading, empty, and error states for every report-like page

### Navigation Rules

- [x] Keep top-level routes aligned across PHP, Next.js, and mobile
- [x] Ensure the active page order matches the Power BI page order
- [x] Keep mobile navigation tab-based and thumb-friendly
- [x] Keep the desktop layout single-column on narrow widths before adding wider grids

## Page Build Checklist

### 1. Executive Dashboard

#### Shared content

- [x] Build the hero summary block
- [x] Build the KPI strip
- [x] Build the trend row
- [x] Build the status/alert cards
- [x] Build the primary CTA block

#### PHP

- [x] Render the dashboard hero in `portal.php`
- [x] Add responsive KPI cards in `portal.css`
- [x] Collapse the dashboard to one column on phone widths
- [x] Keep the mobile CTA buttons stacked and full width

#### Next.js

- [x] Refactor `/dashboard` to use a shared dashboard section component
- [x] Keep the Power BI embed page visually aligned with the native page shell
- [x] Make KPI cards wrap to two columns on tablet and one column on phones
- [x] Keep the dashboard hero readable before the embed loads

#### Mobile

- [x] Update `DashboardScreen` to mirror the hero and KPI ordering
- [x] Add supporting status cards below the KPI row
- [x] Keep the first screenful focused on summary metrics

#### Acceptance

- [x] Page reads correctly on desktop, tablet, and phone
- [x] The same section order appears in all three surfaces

### 2. Finance Reporting

#### Shared content

- [x] Build finance KPI strip
- [x] Build monthly trend block
- [x] Build client breakdown block
- [x] Build aging/status list
- [x] Build ledger/list fallback for mobile

#### PHP

- [x] Add finance summary cards to the portal shell
- [x] Create responsive finance list/table fallback
- [x] Keep key financial totals visible above the fold

#### Next.js

- [x] Refactor `/finance` to keep the Power BI embed and the native shell aligned
- [x] Add finance summary cards around the embed area
- [x] Ensure the route remains mobile readable without horizontal scrolling

#### Mobile

- [x] Rework the finance tab to show summary first, detail second
- [x] Replace wide tables with vertical cards or grouped rows
- [x] Keep finance actions reachable with one thumb

#### Acceptance

- [x] Revenue, invoices, payments, and client breakdowns are visible without pinch-zoom
- [x] Mobile uses stacked cards instead of fixed-width financial panels

### 3. Safety & Compliance

#### Shared content

- [x] Build compliance summary cards
- [x] Build status donut or equivalent summary
- [x] Build regional distribution block
- [x] Build recent file list

#### PHP

- [x] Add safety summary cards to the portal shell
- [x] Convert compliance detail into compact responsive cards
- [x] Keep file status visible without table scrolling

#### Next.js

- [x] Create a safety page section that mirrors the Power BI structure
- [x] Keep the summary cards above the detail rows
- [x] Preserve a clean fallback for small screens

#### Mobile

- [x] Create or update the safety/compliance screen
- [x] Put status cards first and details below
- [x] Use lists instead of tables for file review

#### Acceptance

- [x] Compliance state is obvious in the first screenful
- [x] Mobile can scan the page without horizontal overflow

### 4. Operations Tasks

#### Shared content

- [x] Build open task summary cards
- [x] Build assignee load block
- [x] Build due/overdue block
- [x] Build compact task table or grouped list

#### PHP

- [x] Add task cards to the portal shell
- [x] Keep task states readable in a narrow viewport
- [x] Avoid wide data grids on mobile

#### Next.js

- [x] Align `/ops/tasks` and `/tracker` with the Power BI ordering
- [x] Reuse task summary components across tracker pages
- [x] Keep task routes usable on phones with stacked cards

#### Mobile

- [x] Update `TrackerScreen` and the nested operations tabs
- [x] Show urgent tasks first
- [x] Keep assignee load and due dates visible without side scrolling

#### Acceptance

- [x] The open-work picture is clear at a glance
- [x] Mobile task cards are tappable and readable

### 5. Ledger

#### Shared content

- [x] Build ledger summary cards
- [x] Build transaction trend block
- [x] Build grouped transaction list or audit table
- [x] Build expandable row behavior for mobile if needed

#### PHP

- [x] Add ledger summary detail to the finance area
- [x] Keep audit data scannable on narrow screens
- [x] Replace wide ledger tables with stacked transaction rows on phone widths

#### Next.js

- [x] Add a ledger deep-dive section under finance
- [x] Keep the summary cards above the transaction list
- [x] Ensure the embed shell and native shell use the same density

#### Mobile

- [x] Add a drill-down ledger view or finance detail view
- [x] Keep totals visible at the top
- [x] Use a vertical transaction feed and expandable details

#### Acceptance

- [x] Ledger remains audit-friendly and mobile readable
- [x] No mandatory information is hidden behind wide tables

## Layer Checklist

### PHP Layer

- [x] Align `portal.php` with the new page hierarchy
- [x] Update `portal.css` for responsive card layouts
- [x] Keep portal navigation compact on mobile
- [x] Ensure public site styles do not leak into portal layouts
- [x] Verify the shell at phone, tablet, and desktop widths

### Next.js Layer

- [x] Keep `PortalShell` as the shared frame
- [x] Extract reusable page sections for dashboard, finance, safety, ops, and ledger
- [x] Keep embedded Power BI pages visually consistent with native pages
- [x] Ensure every route has a mobile-safe fallback layout
- [x] Verify the route order matches the Power BI page order

### Mobile Layer

- [x] Keep the bottom tabs aligned with portal priorities
- [x] Rework each screen to use stacked cards and short lists
- [x] Keep the first screenful focused on the most important metrics
- [x] Avoid desktop-style charts that do not fit a phone
- [x] Verify navigation stays usable with one hand

## Parallel Execution Rules

- Shared foundation must land first.
- Page work can then be split in parallel.
- Do not let one surface get far ahead of the others for the same page.
- Finish one page end-to-end before moving to the next if the design is still changing.
- Use a single integration session at the end to check cross-layer parity.

## Suggested Delivery Order

1. Shared foundation
2. Executive Dashboard
3. Finance Reporting
4. Safety & Compliance
5. Operations Tasks
6. Ledger
7. Cross-layer QA and mobile verification

## Definition Of Done

- [x] Power BI remains the reference layout only
- [x] PHP, Next.js, and mobile all implement the same page hierarchy
- [x] Each page is readable on mobile
- [x] Each page keeps the same visual language across layers
- [x] No page depends on a brittle SVG card hack to communicate the layout
