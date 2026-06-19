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
* Added a memory note in `project_blackfire_portal_qa.md` about avoiding eval-like tracker validation in the CSP-restricted portal path.

## Blockers / Next Steps

* Reload the portal and click `Tracker` again to confirm the download modal opens without the CSP error.
* Open the preview tab once more and verify the standalone tracker is rendered with its CSS and layout intact.
* Confirm the download button saves the `.html` file with the expected filename and opens as a styled standalone document when launched.
* If a later QA pass still needs syntax parsing in-browser, move that check fully into the offline QA harness instead of restoring eval-like behavior.

## Learnings

* A browser CSP failure can come from validation code itself, not just the generated artifact.
* For CSP-restricted pages, syntax checks that depend on execution belong in offline tooling, not the live UI.
* Revoking a blob URL immediately after `window.open()` can race the browser render and break preview output.
* Preview/download are more robust when they each create their own delivery path from the generated HTML rather than sharing a single blob URL.
