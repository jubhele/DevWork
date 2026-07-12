---
inclusion: always
---

# DevWork Workspace Constitution (Kiro)

This mirrors CLAUDE.md for Kiro. Full authoritative constitution in `CLAUDE.md`.

## Session Close Hook (MANDATORY)

At the end of every session, run:

```
VS Code: Ctrl+Shift+P → Tasks: Run Task → Close Session Log
```

Or in terminal:
```powershell
powershell.exe -NonInteractive -File "c:\DevWork\.claude\scripts\session-log-update.ps1" -LogPath "<exact-session-log-path>"
```

Kiro must run the native hooks in `.kiro/hooks/constitution.json`: `SessionStart`, `UserPromptSubmit`, and `Stop`. The manual close task is recovery only.

## Mandatory: Session Logging

At SessionStart, determine the owning project. If unclear, ask the user to choose an existing project, create a new named project, or explicitly select `_workspace`; block substantive work while unresolved. New projects use `scripts/governance/initialize-project.ps1` before artifact generation.

All human-facing agent proper names use lowercase `u` plus the capitalized stem (`uSibali`, `uMlawuli`, `uMakhi`, `uMlindi`, etc.).

Create or update a log in `c:\DevWork\sessions\` at session start and end.
Format: `<chat-name>_YYYYMMDD_HHmmss.md`
Sections: Goal, Provider, Model, Decisions, Work Done, **Agent Accountability**, Blockers/Next Steps, Learnings.
Mirror to: `G:\My Drive\JS\Agentic AI\sessions\<filename>.md.tbl.bk`

**Agent Accountability table** (mandatory at session end — one row per task):

| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|

uMlindi audits at close — any agent assigned with no COMPLETED entry is a HIGH governance violation.

**Goal Status field (mandatory in every session log):**
```
## Goal Status
PENDING   ← user changes to ACHIEVED when goal is done
```
Closing signature written ONLY on ACHIEVED. Exception: 30min inactivity with core sections filled → auto-sign marked `[AUTOMATED - no user confirmation after 30min]`.

## Memory

Read `C:\Users\Jughele Shange\.claude\projects\c--DevWork\memory\MEMORY.md` before working.
Write back decisions and learnings at session end.

## Sprint Workflow

Think → Plan → Build → Review → Test → Ship → Reflect

**Reflect is MANDATORY.** Add `## Learnings` to session log before closing.

## Backup Before Change (MANDATORY)

Before modifying any file, create a timestamped backup:
`<original-name>_backup_YYYYMMDD_HHmmss.<ext>` in `_backups/` next to the file.

## Code Principles

- No speculative abstractions beyond the task.
- Comments only for non-obvious WHY.
- Validate at system boundaries only.
- PowerShell 5.1 syntax (no `&&`/`||`, no ternary).
- Default encoding: UTF-8.
- Nothing hardcoded — all secrets in `.env`.

## Cost / Token Management (MANDATORY)

Classify task at conversation start. Verify active model matches the tier:

| Tier | Label | Claude | OpenAI | Google |
|------|-------|--------|--------|--------|
| 1 | Fast | Haiku 4.5 (9/10) | GPT-4o-mini (8/10) | Gemini Flash 2.0 (7/10) |
| 2 | Medium | Sonnet 4.6 (9/10) | GPT-4o (8/10) | Gemini 1.5 Pro (8/10) |
| 3 | Complex | Opus 4.7 (10/10) | o3/o1 (9/10) | Gemini 2.5 Pro (9/10) |

## Cross-Provider Handoff

Providers: Claude Code, GitHub Copilot, OpenAI Codex, Google Antigravity, Cursor, Kiro, Factory.
1. Commit WIP with `WIP:` prefix.
2. Update session log with current state and next steps.
3. Next provider reads session log before continuing.

## Agent Accountability (MANDATORY)

Every result shown to the human must name the completing agent:
```
▸ Completed by: {AgentName}  |  Task: {task_id}  |  Iterations: {n}/{cap}  |  Status: COMPLETED
```
If not completed: `▸ NOT COMPLETED — assigned to: {AgentName}  |  Task: {task_id}  |  Last status: {status}`

Closing signature written once on user ACHIEVED confirmation. Auto-signs after 30min inactivity (marked AUTOMATED). Full rules: `Multi-Agent Workforce Architecture & System Prompts.md §14`

## Project-Local Artifacts and Root Index (MANDATORY)

Store sessions, archives, generated work, QA evidence, backups, logs, and temp data below the owning
project root. Use `C:\DevWork\_workspace\` only for genuine cross-project/control-plane work. New logs
include `Project` and `Project Root`. `WORKSPACE_INDEX.md` is the only root artifact catalogue and the
session-close path updates it only when summaries change. Ambiguous legacy items go to
`_workspace\index\unresolved\`; never guess ownership, overwrite, bulk-delete, or cross nested Git
boundaries without a hash-verified migration manifest. Full rule:
`Multi-Agent Workforce Architecture & System Prompts.md §9.7`.

## Session Log Enforcement Script (MANDATORY)

The workspace uses a shared PowerShell enforcement script that must run at the end of every session:

```
c:\DevWork\.claude\scripts\session-log-update.ps1
```

**What it does:**
- Checks that Decisions, Work Done, Learnings, and Goal Status sections are filled
- Writes the closing accountability signature **once** — only when `## Goal Status` = `ACHIEVED`
- Auto-signs after 30 min inactivity with `[AUTOMATED - no user confirmation after 30min]`
- Once signed, subsequent runs just timestamp and exit

**How to run at session end:**
```powershell
powershell.exe -NonInteractive -File "c:\DevWork\.claude\scripts\session-log-update.ps1" -LogPath "<exact-session-log-path>"
```

Kiro supports native workspace hooks. The mandatory registration in `.kiro/hooks/constitution.json` calls `scripts/governance/constitution-hook.ps1` at session start and before every prompt. Verify the hooks in Kiro's Agent Hooks UI after upgrades.

## Sensitive Files (never commit)

- `.env`, `*.env`, `config.local.*`
- `chatsessions/*.jsonl`
- `BlackFire/BlackFire Portal/install/blackfire_aeci_seed.sql`
