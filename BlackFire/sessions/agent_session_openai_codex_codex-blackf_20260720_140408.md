# Session: Constitution-enforced OpenAI Codex session
Date: 2026-07-20
Provider: OpenAI Codex
Model: GPT-5.6
Project: BlackFire
Project Root: C:\DevWork\BlackFire

## Project Determination
Status: resolved
Source: explicit_user_binding

## Goal
Harden `BlackFire Portal/install/deploy.sh` so cPanel deployment excludes secrets, development-only files, backups, logs, and other non-runtime artifacts, using `BlackFire/.gitignore` and the portal runtime as evidence.

## Model Recommendation
Task tier: 2-Medium
Recommended model: GPT-4o  Trust score: 8/10
Active model: GPT-5.6  Status: suitable

## Decisions
- Session created automatically by the SessionStart enforcement hook.
- uMlawuli routed implementation to uMakhi and security/pre-deploy review to uMlindi; functional and static verification will be recorded under the same task.
- Use an explicit runtime allowlist instead of treating `.gitignore` as a deployment manifest, because ignored files may remain tracked or exist in older commits.
- Synchronize with deletion so stale non-production files are removed from `public_html`, while protecting operational `uploads/`, `.well-known/`, and `cgi-bin/` content.
- Require `rsync`; the prior broad `cp` fallback was removed because it could expose the entire portal source tree.
- Keep live secrets at `~/blackfire_secrets.php` outside the web root and use a temporary `GIT_ASKPASS` helper so the PAT is not embedded in the repository URL.

## Work Done
- Constitution, memory index, and session-log schema verified at session start.
- `BlackFire Portal/install/deploy.sh` now builds and validates a production-only release containing the live root PHP/static files, direct API/config/include runtime files, and service images.
- The deploy sync now deletes stale QA, docs, install tools, backups, logs, secret files/templates, test scripts, SQL/PDF data, and other files absent from the allowlist.
- Existing uploaded documents and cPanel-managed directories are protected; uploaded files receive non-executable permissions.
- `.gitignore` now prevents new portal secret files, extensionless error logs, runtime uploads, and timestamped backups from being added accidentally.
- Verified Bash syntax, Git diff integrity, all 50 production PHP files, ignore-rule matches, and a modeled 131-file release with a forbidden-artifact scan.
- Added `memory/project_cpanel_deployment.md` and indexed the durable deployment/security contract.

## Agent Accountability

| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|
| BF-DEPLOY-001 | uMakhi | uMakhi | COMPLETED | 1/3 | Implemented production allowlist, secure sync, cleanup, and permissions. |
| BF-DEPLOY-SEC-001 | uMlindi | uMlindi | COMPLETED | 1/2 | Confirmed secrets and non-runtime artifacts cannot enter the release; tracked-secret follow-up recorded. |
| BF-DEPLOY-QA-001 | uMvavanyi | uMvavanyi | COMPLETED | 1/3 | Bash syntax and production PHP lint passed; release model excludes screenshot artifacts. |
| BF-DEPLOY-CODE-001 | uMcwaningi | uMcwaningi | COMPLETED | 1/3 | Diff, allowlist, deletion protection, and ignore patterns reviewed. |

## Blockers / Next Steps
- The hardened script has not been run on cPanel in this session; run `bash deploy.sh` from the account home to back up and clean `public_html`.
- `BlackFire Portal/blackfire_secrets.php` remains tracked in the Git index/history. Remove it from tracking/history and rotate any exposed credentials in a separately authorized security cleanup.

## Learnings
- A denylist was insufficient for this repository because test uploads, backups, logs, SQL/PDF data, docs, and a real-named secret file are tracked; deployment must be built from a positive runtime allowlist.
- `rsync --delete` needs explicit protection for operational upload data and cPanel-managed directories.
- Model trust score confirmed unchanged; no model-selection memory update was needed.

```json
{
  "session_id": "20260720_140408",
  "agent": "uMakhi",
  "model_endpoint": "gpt-5.6",
  "token_metrics": {
    "tokens_in": 0,
    "tokens_out": 0,
    "iteration_count": 1
  },
  "outcome": {
    "status": "SUCCESS",
    "cost_category": "TIER_2_MED"
  },
  "optimization": {
    "action_taken": "Trimmed payload"
  }
}
```

## Goal Status
PENDING


_Session ended: 2026-07-20 14:17:00 (OpenAI Codex / GPT-5.6)_

_Workspace index: UPDATED - C:\DevWork\WORKSPACE_INDEX.md_
