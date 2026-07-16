# BlackFire Portal QA Lessons

- After restoring production-like data locally, verify every `.env` login before record-flow QA. Database password hashes can diverge from the workspace vault even when `start-local.ps1` synchronizes the expected plaintext values.
- On localhost, `dev-only/bhekani_bo.php#pw-util` can realign an existing user's password through the visible **Reset Password** button. Use the ignored `.env` value and verify the normal **Umlilo Portal → Sign In** flow afterward.
- A successful create API response is not enough. Verify the success toast, destination page, list count, and exact persisted record; a post-response JavaScript exception can leave the form open and invite duplicate submissions.
- Task flows use the global `toast(message, type)` helper and `showPortalPage(pageId, element)`. `showToast` and direct `navPage(...)` calls are undefined in the legacy PHP portal runtime.
- After task status/delete mutations, call `updateBadges()` after refreshing and rendering tasks so the Tracker badge reflects active records immediately.
- Disposable QA tasks should be cancelled through **Status** to preserve audit history. Open disposable callouts and Draft quotes may be removed through their visible Delete confirmation controls.
- Tracker "Beginning of time" views must paginate the task and callout APIs past their 500-row page cap; removing only a client-side date predicate is incomplete.
- When moving dashboard panels, verify their final DOM sibling order. Finance renders its KPI grid separately from `fin-dash-body`, so Quick Actions must be inserted ahead of that grid.
- Finance period controls must share one persisted date range across Dashboard, Transactions, P&L Ledger, Income Statement, and Reconciliation. Filter each domain by its accounting date, and compare reconciliation net movement when the selected range excludes an opening balance.
- Main Dashboard finance cards and charts are separate from the Finance Dashboard renderer; reporting-period changes must cover both render paths and their executive-summary duplicates.
- Finance reporting now has four shared definitions: rolling six calendar months, calendar YTD, unbounded All Time, and March-to-February financial YTD. Keep button explanations dynamic rather than hard-coding year or month names.
- Attachment authorization must cover POST separately from list/view/download. For non-tracker entities, gate uploads with the entity's create/update permission before reading `$_FILES`.
- Never capture an accessibility snapshot while login or password-utility fields contain credentials. Wait for the signed-in shell or clear the fields first; rotate the vault and local hash immediately if a value is echoed.
- Initial portal refreshes must be permission-scoped. Calling every API and relying on 403 responses creates false console failures for valid restricted-role sessions.

Verified 2026-07-16. Report: `BlackFire Portal/.gstack/qa-reports/qa-report-localhost-8080-2026-07-16.md`.
