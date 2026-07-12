# Finance Reporting Brief

Owner: uMakhi
Supporting owners: uMdwebi, uMvavanyi, uMbheki
Queue order: 3

## Objective

Implement the Finance Reporting page across PHP, Next.js, and mobile with the same layout hierarchy as the Power BI source.

## Inputs

- `powerbi/UmliloPortal_Dashboard.pbip`
- `docs/pbi-layout-implementation-plan.md`
- `docs/pbi-build-checklist.md`
- Shared foundation outputs

## Tasks

1. Review the Finance Reporting page structure from Power BI.
2. Build the PHP finance summary blocks and list/table fallback.
3. Align the Next.js `/finance` route with the native shell and embedded reporting view.
4. Rework the mobile finance view so it stays readable without horizontal scrolling.
5. Validate finance KPIs, trends, breakdowns, and aging/status views.

## Deliverables

- Finance page in PHP
- Finance page in Next.js
- Finance screen in mobile
- QA notes and screenshots

## Done When

- Finance data is readable without pinch-zoom.
- The Power BI embed and native shell feel visually consistent.
