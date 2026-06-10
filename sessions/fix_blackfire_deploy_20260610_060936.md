# Session: fix blackfire deploy
Date: 2026-06-10
Provider: OpenAI Codex
Model: GPT-5 Codex

## Goal
Fix the BlackFire Portal Afrihost deploy script after it failed to clone the configured branch and could not find the portal source directory.

## Model Recommendation
Task tier: 1-Fast / Cheap
Recommended model: GPT-4o-mini  Trust score: 8/10
Active model: GPT-5 Codex  Status: over-powered

## Decisions
- Use `master` as the BlackFire deploy branch because the local repo is on `master` and `origin/HEAD` points to `origin/master`.
- Use `BlackFire Portal` as the deploy source path inside the repo; the previous `BlackFire/BlackFire Portal` path does not match the actual repository layout.
- Make `git clone` failure fatal instead of piping through `grep ... || true`, because the old script printed "Clone complete" after branch clone failures.

## Work Done
- Updated `BlackFire/BlackFire Portal/install/deploy.sh` to deploy from `master`.
- Updated `REPO_SUBDIR` to `BlackFire Portal`.
- Added fallback support for `~/.bf_pat`, matching the existing error message.
- Added clone logging and fatal cleanup when `git clone` fails.
- Created timestamped backup: `BlackFire/BlackFire Portal/install/_backups/deploy_backup_20260610_060936.sh`.

## Blockers / Next Steps
- Could not run `bash -n` locally because `bash` is not installed on the Windows PATH.
- The script is LF-only at session end, which is suitable for Linux hosting.

## Learnings
- BlackFire's active deploy branch is `master`; stale references to `ndlunkulu` should not be used for portal deployment.
- The deployable PHP portal source path inside the BlackFire repo is `BlackFire Portal/`.
- Model trust scores unchanged; GPT-5 Codex was over-powered but reliable for this Tier 1 fix.
