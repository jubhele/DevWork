# Session: deploy sparse checkout portal only
Date: 2026-07-04
Provider: OpenAI Codex
Model: GPT-4o

## Goal
Make the BlackFire deploy script fetch only the portal payload the PHP website actually uses, without depending on the deleted `install/` folder.

## Model Recommendation
Task tier: 1-Fast
Recommended model: GPT-4o-mini  Trust score: 8/10
Active model: GPT-4o  Status: correct

## Decisions
- Treat the deploy problem as a staging-footprint issue, not just a source-path issue.
- Use the canonical `BlackFire/scripts/deploy.sh` as the deploy entrypoint going forward.
- Keep the deploy sync allowlist focused on live portal assets and exclude installer/dev material by default.

## Work Done
- Backed up `BlackFire/scripts/deploy.sh` to `BlackFire/scripts/_backups/deploy_backup_20260704_155158.sh`.
- Updated `BlackFire/scripts/deploy.sh` to use a sparse checkout and smaller clone (`--filter=blob:none --sparse --single-branch --no-tags`).
- Added portal source probing for both `BlackFire Portal/` and `BlackFire/BlackFire Portal/`.
- Expanded the sync allowlist slightly for live-site asset types while keeping the exclude-by-default posture.

## Blockers / Next Steps
- I cannot run the cPanel shell from here.
- Upload the updated `~/scripts/deploy.sh` to the server, then rerun:
  - `bash ~/scripts/deploy.sh`
- Stop using the older ad hoc `bash deploy.sh` copy if it still points at the deleted `install/` workflow.

## Learnings
- On this workspace, the repo has drifted enough that deploy scripts need path probing plus sparse checkout to stay reliable.
- The live portal does not need the installer tree during deployment, so that tree should remain out of the staging payload.

## Goal Status
PENDING
