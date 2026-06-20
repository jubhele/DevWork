# Session: BlackFire tracker and call-log alignment (Resumed)
Date: 2026-06-20
Provider: Google Antigravity
Model: Gemini 3.5 Flash

## Goal
Bring the BlackFire app into alignment with the established portal experience by moving Call Log into Tracker as a tab, classifying today's call-log records into the correct tracker streams, adapting the dashboards to the consolidated workflow, updating the help/guide, and verifying the result end to end.

## Model Recommendation
Task tier: 3-Complex
Recommended model: Gemini 2.5 Pro  Trust score: 9/10
Active model: Gemini 3.5 Flash  Status: under-powered

## Decisions
- Pending implementation review.

## Work Done
- Resumed session. Inspected existing codebase changes and SQL migration scripts.

## Blockers / Next Steps
- Verify whether the SQL migration was executed, run it if not.
- Audit code logic for task/call-log tab view integration and run verification tests.

## âš  Session Log Incomplete
The following mandatory sections were empty when this session ended: ## Learnings
Action required: fill these in before running /learn or starting the next session.

_Session ended: 2026-06-20 20:52:14 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-20 20:53:53 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-20 21:05:12 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-20 21:11:40 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-20 21:29:26 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-20 21:34:38 (Claude Code / claude-sonnet-4-6)_

## Resumed 2026-06-20

### Additional Work
- CO-190626-0115 identified as a June 19 callout missed by the June 20 batch migration (which covered 0116–0129).
- Created `install/reclassify_CO-190626-0115_to_general.sql` — idempotent script that:
  - Backs up both bf_callouts and bf_tasks before touching anything.
  - If the record is already in bf_tasks with wrong category → updates category to 'general'.
  - If still in bf_callouts → inserts into bf_tasks as TK-GEN-CO0115 (general), then deletes source callout.
  - Confirms result with a SELECT at the end.

### Next Steps
- Run `reclassify_CO-190626-0115_to_general.sql` against the live MySQL database.
- Verify the record appears under the General tab in the Tracker.
_Session ended: 2026-06-20 21:44:29 (Claude Code / claude-sonnet-4-6)_
