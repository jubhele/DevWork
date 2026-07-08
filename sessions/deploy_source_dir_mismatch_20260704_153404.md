# Session: deploy source dir mismatch
Date: 2026-07-04
Provider: OpenAI Codex
Model: GPT-4o

## Goal
Fix the BlackFire Portal deploy script so the cPanel deploy run can find the portal source directory inside the cloned repo.

## Model Recommendation
Task tier: 1-Fast
Recommended model: GPT-4o-mini  Trust score: 8/10
Active model: GPT-4o  Status: correct

## Decisions
- Treated the failure as a repo-layout mismatch rather than a clone failure.
- Made the deploy scripts accept both the current `BlackFire Portal/` layout and the older nested `BlackFire/BlackFire Portal/` layout.
- Kept the file-sync logic unchanged once the source directory is resolved.

## Work Done
- Backed up `BlackFire/BlackFire Portal/install/deploy.sh` to `BlackFire/BlackFire Portal/install/_backups/deploy_backup_20260704_153333.sh`.
- Backed up `BlackFire/BlackFire Portal/install/deploy_PHP.sh` to `BlackFire/BlackFire Portal/install/_backups/deploy_PHP_backup_20260704_153333.sh`.
- Updated both deploy scripts to probe several candidate source directories before failing.
- Added an explicit log line showing which source directory was selected.

## Blockers / Next Steps
- I cannot run the cPanel shell command from here.
- Replace the `deploy.sh` copy on cPanel with the updated script, then rerun:
  - `bash deploy.sh`
- If you’re using the older PHP variant on the server, replace that copy too before rerunning.

## Learnings
- The repo has drifted across two source-directory layouts, so deployment scripts need compatibility probing instead of one fixed path.
- Logging the resolved source dir will make the next deployment failure much easier to diagnose.

## Goal Status
PENDING

## Warning: Session Log Incomplete
Incomplete at this stop: ## Goal Status (still PENDING -- user must set to ACHIEVED)

_Session ended: 2026-07-04 15:34:30 (Claude Code / claude-sonnet-4-6)_
