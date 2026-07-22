# Session: Constitution-enforced Claude Code session
Date: 2026-07-22
Provider: Claude Code
Model: claude-sonnet-5
Project: blackfire
Project Root: C:\DevWork\BlackFire

## Project Determination
Status: resolved
Source: cwd_project_signal — user's request referenced BlackFire Portal stat cards (Pipeline Value, Outstanding Total) and later a screenshot of the live Invoices page; bound to the BlackFire project (`c:\DevWork\BlackFire`), full detail logged in the project-native session log. Session continues to bind to BlackFire for a follow-on request: excluding the system/service account `blackfm6w9f9_izilo` from portal user stats and call/task assignment.

## Goal
Add a small per-status count+amount breakdown line below the status text on the Pipeline Value (Quotes) and Outstanding Total (Invoices) stat cards in the BlackFire Portal. Mid-task, user reported a second bug: the Invoices table's decorative column header row rendered as concatenated text ("Invoice #ClientIssuerAmountDueStatus") with no spacing between labels. Follow-on task (in progress): exclude the system/service account `blackfm6w9f9_izilo` from all user stats/dashboard aggregates and from call-out/task assignment dropdowns everywhere in the portal — confirmed by user as a service account, not a real technician, and confirmed to currently leak into both stats and assignment views. Background Explore agent dispatched to map every `proxyDB.users` usage (assignment dropdowns, leaderboard/stats aggregates) and backend `FROM users` queries in api/*.php before making changes.

## Model Recommendation
Task tier: 1-Fast (styling/data-display tweak), escalated in practice by the header-collapse bug investigation, which required tier-2 reasoning (CSS cascade tracing, live reproduction).
Recommended model: Haiku 4.5  Trust score: 9/10
Active model: Sonnet 5  Status: over-powered for the original ask, appropriately used once the investigation opened up; not switched mid-session since the two sub-tasks were tightly coupled.

## Decisions
- Per-status breakdown shows both count and amount per status (user chose "both" over count-only or amount-only when asked).
- Breakdown rendered via a new `.kbreak` CSS class inside each `.kcard`, smaller (11px) than the existing `.ksub` status line.
- Invoice header bug root cause: `.invoice-column-header` was omitted from the CSS selector list granting `display:grid` (portal.css:582) and from the `@media(max-width:1100px)` hide rule (portal.css:608), unlike its siblings `.calllog-column-header`/`.quote-column-header`. Added it to both rules to match.

## Work Done
- `BlackFire Portal/portal.css` — added `.kbreak`/`.kbreak span` rules; added `.invoice-column-header` to the grid-display selector and the sub-1100px hide rule.
- `BlackFire Portal/portal.js` — `renderQuotes()` (~line 5586) computes a per-status breakdown (Draft/Sent/Approved/Pending Approval) with count+sum for the Pipeline Value card; `renderInvoices()` (~line 5852) computes the same for Draft/Sent/Overdue on the Outstanding Total card.
- Backups: `_backups/portal_css_backup_20260722_161233.css`, `_backups/portal_backup_20260722_161233.js`.
- Verified the header fix locally: started `php -S localhost:8080`, rendered the exact `.invoice-column-header` markup against the live (fixed) portal.css at 1200px width, confirmed it now displays as separated grid columns instead of one run-on string.
- Full project session log: `BlackFire\sessions\blackfire_stat_card_breakdown_20260722_161233.md`.

## Agent Accountability

| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|
| stat-card-breakdown | uMakhi | Claude Code (as uMlawuli/uMakhi) | COMPLETED | 1 | Portal JS/CSS change, verified in isolated local render |
| invoice-header-bugfix | uMakhi | Claude Code (as uMlawuli/uMakhi) | COMPLETED | 1 | CSS selector-list omission found and fixed, reproduced before/after |

## Blockers / Next Steps
- Could not verify the stat-card breakdown against real seeded data in a live, logged-in browser session — no local MySQL instance available to authenticate as the `sibu` test admin. Recommend a manual check of the Quotes and Invoices pages next time DB access is available.
- Tri-surface parity: this change is PHP-portal-only (styling + derived display data, no new API/contract/behavior), so Next.js/Expo parity does not apply — no parity gap opened.

## Learnings
- `.invoice-column-header`, `.calllog-column-header`, and `.quote-column-header` are three near-identical decorative header rows that share layout rules via comma-selector lists in portal.css. Adding a new one of these to the HTML is easy to do while missing one of the two shared CSS rule lists (the `display:grid` rule and the `max-width:1100px` hide rule) — this exact omission caused the reported bug. Worth grepping both list occurrences whenever touching these classes again.
- Local QA of the PHP portal needs a running MySQL instance seeded with the `blackfm6w9f9_portal` schema; none is set up in this dev environment currently, so full logged-in browser QA isn't possible without that setup first.

## Goal Status
PENDING
