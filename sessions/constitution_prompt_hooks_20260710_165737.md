# Session: Cross-provider constitution prompt hooks
Date: 2026-07-10
Provider: OpenAI Codex
Model: GPT-5

## Goal
Design, implement, document, and verify provider-aware enforcement hooks so the DevWork constitution is loaded and checked at session start and on every subsequent prompt across all supported AI providers, using native hooks where available and explicit fallbacks where unavailable.

## Model Recommendation
Task tier: 3-Complex
Recommended model: o3 / o1  Trust score: 9/10
Active model: GPT-5  Status: capable but unlisted in the current trust matrix; proceed and record the discrepancy

## Decisions
- Phase 1: Use a new Codex session log rather than append this governance task to the prior Claude/Homolemo due-diligence session.
- Phase 1: Preserve truthful provider capability boundaries: use native lifecycle and prompt hooks where supported, and explicit instruction or wrapper fallbacks where native hooks are absent.
- Phase 1: Keep `CLAUDE.md` authoritative and propagate generic improvements into provider mirrors after updating the architecture guide.
- Phase 1: Back up every existing file before modification and validate PowerShell 5.1 compatibility.

## Work Done
- `scripts/governance/constitution-hook.ps1` added as the shared, provider/session-ID-aware enforcement core.
- Native hook registrations added for Claude, Codex, Cursor, Kiro, Factory Droid, GitHub Copilot CLI/cloud, and Google Antigravity.
- Architecture guide advanced to v3.6.0 with the mandatory hook contract, installation procedure, truthful capability matrix, and conformance tests.
- Authoritative constitution, OpenAI/Cursor/Kiro/Copilot/Factory mirrors, VS Code recovery task, and session template updated; stale manual-only claims removed.
- Architecture guide recopied byte-identically into Astute, BlackFire, GovTender, JS_Resume, and umlilo-portal after backups.
- Shared memory updated with the durable lifecycle-enforcement decision.
- PowerShell parsing, eight JSON parses, Factory duplicate-key check, Codex stable hook feature, prompt-redaction test, same-session reuse, prompt counting, same-second parallel isolation, mandatory schema, stale-claim scan, and SHA-256 mirror parity all passed.
- Umlindi's final audit returned FAIL/HIGH on the first implementation. Mlawuli remediated the material findings: unsafe newest-log discovery removed; exact `-LogPath` made mandatory; `agent-v3` heartbeat made state-mapped; Stop blocking/signing restored; PreToolUse/PostToolUse gates registered; backup evidence checked when target paths are exposed; Codex command fields corrected; Antigravity/Copilot cloud claims narrowed to soft fallbacks; stale architecture/checklist/runtime claims replaced.
- Additional negative/positive tests passed: incomplete Stop blocks exactly once; loop guard prevents recurrence; PreChange exits 2 for missing clearance; existing target without backup blocks; timestamped backup allows; complete ACHIEVED fixture signs once using its accountability row; PENDING exact close does not mutate; missing `-LogPath` is rejected.
- Final integration with the concurrently strengthened v3.7 project-artifact constitution: generated hook logs now include Project/Project Root and route project-locally; close utilities accept project-local session logs; mirrors preserve project ownership; closing paths invoke the workspace-index updater; backup gates reject backups older than the current target; repeated closing is idempotent.
- Final static gate passed for four PowerShell scripts and eight JSON configs. Workspace index update returned `UPDATED` for 8 projects with 0 unresolved items.

## Agent Accountability

| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|
| constitution_hooks_cost_clearance | Sibali | OpenAI Codex sub-agent `/root/sibali_log` | COMPLETED | 1 | Tier/model fit, prior-log audit, and logging requirements supplied. |
| constitution_hooks_implementation | Umakhi | OpenAI Codex (Mlawuli applying Umakhi audit) | COMPLETED | 3 | Shared hook, provider registrations, exact-log hardening, docs, propagation, and acceptance tests completed at cap 3. |
| constitution_hooks_governance_audit | Umlindi | OpenAI Codex sub-agent `/root/umlindi_audit` | COMPLETED | 2 | Audit task completed at cap 2 with FAIL/HIGH findings; Mlawuli remediated the material hook findings afterward. |
| constitution_hooks_code_qa | Umcwaningi | OpenAI Codex sub-agent `/root/umcwaningi_final` | COMPLETED | 1 | Static review completed with FAIL findings against a concurrent intermediate v3.7 state; project routing/mirror/index/idempotence/backup findings were integrated or remediated afterward. |

## Blockers / Next Steps
- Provider-native registrations require a fresh live session/restart and trust approval where the provider requires it; static schema and core smoke tests cannot prove each vendor UI loaded the file.
- Copilot VS Code chat and Google Jules remain explicitly documented soft fallbacks; their repository instruction files cannot be represented as guaranteed per-prompt shell execution.
- Cursor is intentionally not fail-closed until a live Hooks-panel test verifies its stdout contract on the installed version.
- Live activation remains: restart/open each installed provider, approve/trust project hooks where prompted, and capture a real start → second prompt → mutation → Stop trace. Static validation cannot prove a vendor UI loaded its hook file.
- Copilot cloud, Copilot VS Code chat, Antigravity start/every-prompt behavior, and Jules remain explicitly labeled soft fallbacks in this Windows pack until portable or verified native prompt hooks are installed.
- Goal Status remains PENDING until the user confirms the delivered enforcement design meets the goal.

## Learnings
- The old constitution was stale: current Claude, Codex, Cursor, Kiro, Factory, Copilot CLI/cloud, and Antigravity releases expose native lifecycle hooks.
- A start/prompt hook without provider session-ID correlation can automate the wrong log more reliably; concurrency isolation is a first-class governance requirement.
- A hook proves execution and observable artifact state, not that a model reasoned correctly. Model clearance, routing, backups, accountability, and log/mirror evidence are the enforceable boundary.
- Model trust score is unchanged. GPT-5 handled the Tier 3 cross-provider architecture task capably, but the OpenAI trust matrix should be reviewed separately because GPT-5 is currently unlisted.

## Goal Status
PENDING

_Workspace index: UPDATED — C:\DevWork\WORKSPACE_INDEX.md_

```json
{
  "session_id": "20260710_165737",
  "agent": "Umakhi",
  "model_endpoint": "GPT-5",
  "token_metrics": { "tokens_in": 0, "tokens_out": 0, "iteration_count": 1 },
  "outcome": { "status": "SUCCESS", "cost_category": "TIER_3_HIGH" },
  "optimization": { "action_taken": "Trimmed payload" }
}
```
