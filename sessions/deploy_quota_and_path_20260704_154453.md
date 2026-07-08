# Session: deploy quota and path
Date: 2026-07-04
Provider: OpenAI Codex
Model: GPT-4o

## Goal
Fix the cPanel deploy failure caused by temp clone disk quota exhaustion and stale deploy-script path assumptions.

## Model Recommendation
Task tier: 1-Fast
Recommended model: GPT-4o-mini  Trust score: 8/10
Active model: GPT-4o  Status: correct

## Decisions
- Treat the first failure as a quota issue in the temp clone location, not as a Git authentication issue.
- Keep the source-dir probing fix from the previous pass.
- Move the temp clone directory off the home quota by using the system temp area.
- Trim the clone flags to `--depth=1 --single-branch --no-tags` for a smaller checkout.

## Work Done
- Backed up the modified deploy scripts to `BlackFire/BlackFire Portal/install/_backups/`.
- Updated `BlackFire/BlackFire Portal/install/deploy.sh` to create its temp dir under `${TMPDIR:-/tmp}` and to use lighter clone flags.
- Updated `BlackFire/BlackFire Portal/install/deploy_PHP.sh` with the same temp-dir and clone-flag changes.

## Blockers / Next Steps
- I cannot run the cPanel shell from here.
- Make sure the updated `deploy.sh` copy is uploaded to the server before rerunning `bash deploy.sh`.
- If the server still uses an older copy, it will keep failing on the stale source-path assumption.

## Learnings
- On shared hosting, a temp clone under `$HOME` can fail before the deploy logic even runs if the home quota is tight.
- Lowering the clone footprint is worthwhile even when the real deploy payload is much smaller than the repository.

## Goal Status
PENDING

## Warning: Session Log Incomplete
Incomplete at this stop: ## Goal Status (still PENDING -- user must set to ACHIEVED)

_Session ended: 2026-07-04 15:45:11 (Claude Code / claude-sonnet-4-6)_
