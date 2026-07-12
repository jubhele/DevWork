# Session: Project resolution and Zulu agent naming
Date: 2026-07-11
Provider: OpenAI Codex
Model: GPT-5
Project: _workspace
Project Root: C:\DevWork\_workspace

## Project Determination
Status: resolved
Source: explicit user request for workspace-wide constitution and agent architecture changes

## Goal
Make project ownership an explicit session-start gate across providers, require user direction when the project is unresolved, scaffold new projects with repository and artifact custody, and correct every human-facing agent proper name to the Zulu lowercase-u plus capitalized-stem form.

## Model Recommendation
Task tier: 3-Complex
Recommended model: o3 / o1  Trust score: 9/10
Active model: GPT-5  Status: capable but not rated in the current trust matrix

## Decisions
- Phase 1: Classify this request as `_workspace` control-plane governance work.
- Phase 1: Preserve lowercase technical filenames and stable machine identifiers unless they are displayed as proper names; correct human-facing names, routing values, prompts, signatures, and documented JSON enums.
- Phase 1: A lifecycle shell hook cannot conduct a reliable interactive dialogue itself; unresolved project state must inject/block with a directive requiring the active agent to ask the user before substantive work.
- Phase 2: Require a stable provider session ID, persist its project binding under a mutex, and fail closed before mutation when the binding or target is absent, invalid, or crosses project boundaries.
- Phase 2: Treat `_workspace` as an explicit control-plane project, not as the default owner for ambiguous work.
- Phase 2: Create new projects through a staged initializer that establishes artifact directories, README, `.gitignore`, and a Git repository before binding the session.

## Work Done
- Added the project-resolution lifecycle gate, `ProjectBind` and `ProjectCreate` events, persistent session binding, drift detection, mutation guards, and unresolved-session logging.
- Added an atomic new-project initializer with the standard `sessions`, `artifacts`, `archive`, `temp`, `logs`, `_backups`, and `docs` custody structure plus Git initialization.
- Added the canonical 12-agent display-name map and migrated active human-facing governance, provider, agent, memory, and project-mirror content to the lowercase-`u` convention.
- Updated the workspace constitution, architecture guide, provider fallbacks/hooks, session template, close enforcement, workspace index concurrency handling, and six architecture mirrors.
- Added and passed seven durable project-gate tests covering unresolved starts, blocked mutation, invalid/valid binding, log relocation, new-project scaffolding/Git, and cross-project blocking.
- Parsed the changed PowerShell enforcement files, validated the name map, verified six byte-identical architecture mirrors, and ran `git diff --check` successfully (line-ending warnings only).
- Workspace index update: `UPDATED` (8 projects indexed; 0 unresolved artifacts).

## Agent Accountability

| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|
| project_name_cost_clearance | uSibali | OpenAI Codex sub-agent `/root/usibali_scope` | COMPLETED | 1 | Tier, project ownership, log location, and canonical 12-agent name map supplied. |
| project_resolution_gate | uMakhi | OpenAI Codex root with sub-agent `/root/umakhi_project_gate` | COMPLETED | 2/3 | Implemented the lifecycle gate and remediated review findings on session identity, path validation, concurrency, staging, and fail-closed mutation handling. |
| agent_name_governance_audit | uMlindi | OpenAI Codex root with sub-agent `/root/umlindi_name_audit` | COMPLETED | 2/2 | The audit found hidden-provider and test gaps; both were remediated. Stable technical identifiers remain documented compatibility exceptions. |
| project_gate_functional_qa | uMvavanyi | OpenAI Codex root | COMPLETED | 1/3 | Seven project-resolution and artifact-custody scenarios passed. |
| constitution_propagation | uMlawuli | OpenAI Codex root | COMPLETED | 1 | Coordinated provider rules, architecture mirrors, session enforcement, backups, and final verification. |

## Blockers / Next Steps
- No implementation blocker. Native behavior still depends on each provider actually loading its registered hook; soft-fallback providers enforce the same requirement through their always-loaded instructions and mutation gates.
- Goal remains PENDING until the user confirms the outcome.

## Learnings
- Project identity must be durable session state, not a guess derived independently on every prompt.
- A prompt hook can direct an interactive clarification, while mutation and close hooks provide the reliable hard boundary.
- Human-facing Zulu grammar and machine compatibility identifiers need an explicit map so cultural correctness does not break established automation.
- Concurrency controls are necessary for both project-binding state and the shared workspace index.

## Goal Status
PENDING

```json
{
  "session_id": "20260711_083510",
  "agent": "uMakhi",
  "model_endpoint": "GPT-5",
  "token_metrics": { "tokens_in": 0, "tokens_out": 0, "iteration_count": 1 },
  "outcome": { "status": "SUCCESS", "cost_category": "TIER_3_HIGH" },
  "optimization": { "action_taken": "Trimmed payload" }
}
```
