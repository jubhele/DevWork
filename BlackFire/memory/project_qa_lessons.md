# BlackFire Portal QA Lessons

- After restoring production-like data locally, verify every `.env` login before record-flow QA. Database password hashes can diverge from the workspace vault even when `start-local.ps1` synchronizes the expected plaintext values.
- On localhost, `dev-only/bhekani_bo.php#pw-util` can realign an existing user's password through the visible **Reset Password** button. Use the ignored `.env` value and verify the normal **Umlilo Portal → Sign In** flow afterward.
- A successful create API response is not enough. Verify the success toast, destination page, list count, and exact persisted record; a post-response JavaScript exception can leave the form open and invite duplicate submissions.
- Task flows use the global `toast(message, type)` helper and `showPortalPage(pageId, element)`. `showToast` and direct `navPage(...)` calls are undefined in the legacy PHP portal runtime.
- After task status/delete mutations, call `updateBadges()` after refreshing and rendering tasks so the Tracker badge reflects active records immediately.
- Disposable QA tasks should be cancelled through **Status** to preserve audit history. Open disposable callouts and Draft quotes may be removed through their visible Delete confirmation controls.

Verified 2026-07-16. Report: `BlackFire Portal/.gstack/qa-reports/qa-report-localhost-8080-2026-07-16.md`.
