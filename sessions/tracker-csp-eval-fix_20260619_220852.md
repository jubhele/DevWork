# Session: tracker-csp-eval-fix
Date: 2026-06-19
Provider: OpenAI Codex
Model: GPT-5

## Goal
Investigate why the BlackFire portal tracker button fails with a CSP-related validation error, then patch the real source so tracker generation works without tripping the browser policy.

## Model Recommendation
Task tier: 2-Medium
Recommended model: GPT-4o  Trust score: 8/10
Active model: GPT-5  Status: over-powered

## Decisions

* Removed the browser-side `new Function(script)` probe from `BlackFire Portal/portal.js` because the portal CSP blocks eval-like constructs and the validation itself was causing the failure.
* Kept validation in place, but downgraded it to a non-executing check that flags `eval` / `Function` constructors instead of trying to parse by execution.
* Left the offline Node QA script as the place where a real syntax parse can happen safely.

## Work Done

* Backed up `BlackFire/BlackFire Portal/portal.js` and `BlackFire/BlackFire Portal/qa/qa_tracker_html.js` into `_backups/`.
* Patched `BlackFire/BlackFire Portal/portal.js` so tracker generation no longer invokes `new Function(script)` in the browser.
* Fixed the tracker preview flow to delay blob URL revocation after `window.open()`, preventing the browser from racing the HTML load.
* Reworked tracker delivery so preview and download use the in-memory generated HTML directly instead of a shared precomputed blob URL.
* Forced the standalone tracker to initialize both filters to `All` on load so stale browser state does not reopen the file filtered to `Fixed`.
* Added a data-URI favicon to the safety file report so the browser does not try to resolve a `file://` icon when the downloaded HTML opens locally.
* Converted the audit log rows to a grid layout in `portal.css` so timestamp, user, action, and level no longer overlap on long entries.
* Fixed `reports.php` CSV export so PHP deprecation warnings are not written into the downloaded file and `fputcsv()` uses an explicit escape argument.
* Added a memory note in `project_blackfire_portal_qa.md` about avoiding eval-like tracker validation in the CSP-restricted portal path.

## Blockers / Next Steps

* Reload the portal and click `Tracker` again to confirm the download modal opens without the CSP error.
* Open the preview tab once more and verify the standalone tracker is rendered with its CSS and layout intact.
* Confirm the download button saves the `.html` file with the expected filename and opens as a styled standalone document when launched.
* Confirm the tracker opens with `All Sections` and `All Statuses` selected by default.
* Re-open the safety file report from Downloads and confirm the console no longer reports the unsafe file-origin URL load.
* Check the Audit Log and any other dense table-like screens after a hard refresh to confirm the row text now wraps cleanly.
* Re-run the CSV export from `reports.php` and confirm Excel opens a clean comma-separated file instead of warning text.
* If a later QA pass still needs syntax parsing in-browser, move that check fully into the offline QA harness instead of restoring eval-like behavior.

## Learnings

* A browser CSP failure can come from validation code itself, not just the generated artifact.
* For CSP-restricted pages, syntax checks that depend on execution belong in offline tooling, not the live UI.
* Revoking a blob URL immediately after `window.open()` can race the browser render and break preview output.
* Preview/download are more robust when they each create their own delivery path from the generated HTML rather than sharing a single blob URL.
* Browser form-state persistence can make a standalone generated file look “wrong” unless the initial filter values are explicitly reset.
* Local HTML files should embed their own favicon if we want to avoid the browser probing `file://` for a default icon.
* Grid layouts are safer than flex for multi-field log rows when one field can become unexpectedly long.
* CSV downloads must suppress PHP warnings and use explicit `fputcsv` parameters or the output becomes malformed for spreadsheet apps.
