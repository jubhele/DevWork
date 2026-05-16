# Session: Constitution Cost-Token Management Agent
Date: 2026-05-16
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Add a mandatory Cost/Token Management Agent rule to the workspace constitution (Section 11).
The agent classifies each conversation by task tier (Fast/Medium/Complex), maps tiers to
recommended models across Claude/OpenAI/Google providers with trust scores, and outputs a
recommendation block when the active model is not optimal for the tier.

## Decisions
- Section numbered 11 to follow existing numbering (10 = Active AI Providers).
- Trust scores (0-10) reflect reasoning depth, instruction-following, tool-use reliability.
- Recommendation block only displayed when model is wrong tier; silent log when correct.
- Cost targets set per tier to give budget guardrails.
- All four mirrors updated: CLAUDE.md, AGENTS.md, copilot-instructions.md, constitution.mdc.
- Backups created with timestamp 20260516_084745.

## Work Done
- CLAUDE.md — added Section 11 (Cost / Token Management Agent) with full tier table, trust matrix, agent behaviour spec, cost guidance, and trust-update protocol
- AGENTS.md — added condensed Section 11 summary with tier/model table
- .github/copilot-instructions.md — added condensed Section 11 summary
- .cursor/rules/constitution.mdc — added condensed Section 11 summary
- _backups/ — created backups of all four files before modification

## Blockers / Next Steps
- Trust scores are initial estimates; update via /learn after sessions where model quality diverges from expectation.
- Session log model recommendation sub-section not yet templated into session log format — consider adding in a future constitution revision.

## Resumed 2026-05-16

### Changes
- CLAUDE.md § 5 Reflect step made mandatory — requires ## Learnings in session log before close
- CLAUDE.md § 11.5 trust-score updates now tied to mandatory Reflect step, not optional
- AGENTS.md, copilot-instructions.md, constitution.mdc — Reflect rule propagated in provider-agnostic language (Claude Code uses /learn; others write memory files manually)
- session-log-update.ps1 updated — Stop hook now checks for ## Learnings section; warns if missing
- Backups created: timestamp 20260516_085856

## Learnings
- /learn cannot be auto-triggered from a Stop hook (hook fires after Claude stops); closest equivalent is making Reflect mandatory in the workflow + hook warning if skipped
- Provider-agnostic wording needed: Claude Code = /learn, all others = manual memory file update
- The ## Learnings section in the session log is the checkable artefact the hook looks for
_Session ended: 2026-05-16 09:00:09 (Claude Code / claude-sonnet-4-6)_

---

## Resumed 2026-05-16 (continuation — /learn automation + session log review)

### Additional Decisions
- /learn CANNOT be auto-triggered from a Stop hook — hook fires after Claude stops, Claude is no longer active. Closest equivalent: make Reflect mandatory in the workflow so Claude runs /learn before stopping, and the hook warns if it was skipped.
- Provider-agnostic wording is required throughout the constitution — Claude Code uses /learn; Copilot/Codex/Cursor write memory/ files manually. The same outcome, different mechanism.
- The checkable artefact for the hook is the presence of a `## Learnings` section in the session log — easy to detect in PowerShell without parsing content.
- Session log model recommendation should be logged under a `## Model Recommendation` sub-section (noted as future constitution revision in Blockers below).

### Additional Work Done
- CLAUDE.md § 5 — Reflect step rewritten as MANDATORY; specifies /learn for Claude Code, manual memory update for all other providers; requires `## Learnings` section in session log before close
- CLAUDE.md § 11.5 — trust-score update rule tightened; now tied to the Reflect step, not optional; same provider-agnostic split
- AGENTS.md — Reflect mandatory block added after Sprint Workflow
- .github/copilot-instructions.md — Reflect mandatory block added after Sprint Workflow
- .cursor/rules/constitution.mdc — Reflect mandatory block added after Sprint Workflow
- .claude/scripts/session-log-update.ps1 — Stop hook now checks for `## Learnings` section; injects a warning block if missing so the next session sees it at the top of the log
- All five files backed up before modification (timestamp 20260516_085856)
- This session log updated to reflect full conversation history

### Updated Blockers / Next Steps
- Session log template (_template.md) does not yet include a `## Model Recommendation` sub-section or `## Learnings` section — update the template to match the mandatory fields
- Trust scores remain initial estimates; run /learn or update memory/feedback_model_selection.md after any session where a model's output diverges from its score

## Learnings
- The Stop hook fires AFTER Claude stops — it cannot invoke a skill or trigger /learn in the same session. Mandatory workflow steps are the only reliable enforcement mechanism while Claude is active.
- Provider-agnostic rules work best when the outcome is specified (`## Learnings` in session log, memory/ files updated) rather than the tool (/learn), so any provider can comply.
- Session logs are the single artefact all providers can write to and the hook can check — anchor all mandatory checks here.

_Session ended: 2026-05-16 10:57:22 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-16 10:57:56 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-16 11:03:45 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-16 11:20:33 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-16 11:46:09 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-16 16:40:23 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-16 16:42:20 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-16 16:53:41 (Claude Code / claude-sonnet-4-6)_
