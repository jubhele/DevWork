# DevWork Workspace Constitution (OpenAI Codex / Google Antigravity / Kiro / Factory / Agents)

This file mirrors CLAUDE.md for OpenAI Codex CLI, Google Antigravity (Jules), Kiro, Factory Droid, and other agents that read AGENTS.md.
The authoritative source is `CLAUDE.md` — when in doubt, defer to it.

**Provider config files:**
- Kiro: `.kiro/steering/` (4 steering markdown files)
- Factory: `.factory/config.yaml`
- Cursor: `.cursor/rules/constitution.mdc`
- GitHub Copilot: `.github/copilot-instructions.md`
- Claude Code: `CLAUDE.md`

---

## Session Close Hook (MANDATORY — all providers)

At the end of every session, run the session close hook:

```
VS Code: Ctrl+Shift+P → Tasks: Run Task → Close Session Log
```

Or directly in any terminal:
```powershell
powershell.exe -NonInteractive -File "c:\DevWork\.claude\scripts\session-log-update.ps1" -LogPath "<exact-session-log-path>"
```

This script:
- Checks mandatory sections (Decisions, Work Done, Learnings, Goal Status)
- Writes the one-time accountability signature when Goal Status = ACHIEVED (user confirmed)
- Auto-signs after 30min inactivity with `[AUTOMATED]` flag
- Never repeats the signature if already written

**Claude Code** uses native lifecycle hooks in `.claude/settings.json`; the compatibility close command above is manual recovery and always requires the exact log path.
The close task remains a recovery path. Native provider hooks must also run `scripts/governance/constitution-hook.ps1` at SessionStart and before every user prompt/model invocation; registrations and the provider capability matrix are in `Multi-Agent Workforce Architecture & System Prompts.md §6.3`.

GitHub Copilot VS Code chat and Google Jules are soft-fallback surfaces: their always-loaded instruction files must restate the same start/per-prompt obligations because a repository-controlled per-prompt shell hook is not assumed there. Do not describe that fallback as hard enforcement.

---

## Mandatory: Session Logging

Every session must create or update a log in `c:\DevWork\sessions\`.
Format: `<chat-name>_YYYYMMDD_HHmmss.md` — one file per session, named after the chat topic with a timestamp suffix.

Log structure:
- **Goal** (fill at start)
- **Decisions** (fill at end)
- **Work Done** (fill at end)
- **Agent Accountability** (fill at end — see below)
- **Blockers / Next Steps** (fill at end)
- **Learnings** (MANDATORY — fill before ending session)

**Agent Accountability table** (mandatory at session end):

| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|
| ...     | ...           | ...          | COMPLETED/FAILED | n/cap | brief note |

uMlawuli fills one row when the user confirms the goal is achieved. uMlindi audits at session end — any agent assigned with no COMPLETED entry is a HIGH governance violation, flagged by name.

**Goal Status field (mandatory in every session log):**
```
## Goal Status
PENDING   ← user changes to ACHIEVED when goal is done
```
- The closing signature is written ONLY when Goal Status = ACHIEVED (user confirmed).
- Exception: if the session log has been inactive for 30+ minutes with Decisions + Work Done filled, the hook auto-signs and marks `[AUTOMATED - no user confirmation after 30min]`.

---

## Memory

Memory index: `C:\Users\Jughele Shange\.claude\projects\c--DevWork\memory\MEMORY.md`
All agents read and write this memory. Check it before starting work.

---

## Sprint Workflow

Think → Plan → Build → Review → Test → Ship → Reflect

**Reflect is MANDATORY.** Before ending any session:
1. Add a `## Learnings` section to the session log.
2. Update any relevant memory files in `memory/` (decisions, trust score changes, constraints).
3. If using Claude Code: run `/learn` — it reads the session log and writes memory automatically.
4. If model trust score diverged from expectation: update `memory/feedback_model_selection.md`.

---

## Cross-Provider Handoff

1. Commit in-progress work with `WIP:` prefix.
2. Update session log with current state and blockers.
3. Next provider reads session log before continuing.

## Constitution Propagation

When the constitution or multi-agent architecture is copied into a repo or updated for a user:
1. Inspect the target workspace/repo for `CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md`, `.cursor/rules/constitution.mdc`, nested `AGENTS.md`, `agents/`, `docs/`, `sessions/`, `memory/`, `.env.example`, and `.gitignore`.
2. Apply missing mandatory rules locally.
3. Preserve stricter project-specific overrides.
4. If the inspection reveals a generic improvement, update the architecture guide so future repos receive it.
5. Re-copy the updated guide into the target repo and rerun the mirror audit.

## Project-Local Artifacts and Root Index (MANDATORY)

- Project work belongs under its owning project root: `sessions/`, `artifacts/`, `archive/`, `temp/`, `logs/`, and `_backups/`.
- New session logs include `Project` and `Project Root` and are written to `<project>\sessions\`; only genuine cross-project/control-plane sessions use `C:\DevWork\_workspace\sessions\`.
- The workspace root is a control plane and discovery surface. `C:\DevWork\WORKSPACE_INDEX.md` is the only root artifact catalogue; it links to canonical project locations and contains no artifact contents or secrets.
- Every session-close path runs `scripts/governance/update-workspace-index.ps1` after updating the exact session log and records `NO_CHANGE`, `UPDATED`, or `FAILED`.
- Ambiguous legacy material goes to `_workspace\index\unresolved\` with candidate owners. Never guess ownership, flatten project mirrors, overwrite collisions, bulk-delete temp data, or move files across nested repositories without manifest and hash verification.
- Full taxonomy, migration procedure, privacy rules, concurrency contract, and DevWork audit baseline: `Multi-Agent Workforce Architecture & System Prompts.md §9.7`.

## Project Determination at Session Start (MANDATORY)

- Before substantive work, bind the session to one existing project, one newly created project, or explicit `_workspace` control-plane scope.
- A root/control-plane working directory is ambiguous; it is not automatic permission to use `_workspace`.
- When ambiguous, ask the user which existing project applies, whether to create a new named project, or whether the request is genuinely cross-project/control-plane work.
- Keep `Project: UNRESOLVED`, block mutations/completion, and do not generate artifacts until the user or a clear project working directory resolves ownership.
- Bind existing projects through `constitution-hook.ps1 -Event ProjectBind -RequestedProjectRoot <path>`.
- Create new projects through `constitution-hook.ps1 -Event ProjectCreate -ProjectName <name>`. The initializer creates the folder, standalone Git repository, project-local artifact taxonomy, README, `.gitignore`, and index entry.
- Never silently switch a resolved session to another project.

---

## Code Principles

- No speculative features beyond the task.
- No explanatory comments — only non-obvious WHY comments.
- Validate only at system boundaries.
- PowerShell 5.1: no `&&`/`||`, no ternary.

---

## Projects

DevWork (this repo) is the template/control-plane only — no project application code lives here.
Project repos are siblings at `c:\Projects\<name>`, each its own independent git repo. Authoritative
list: `_workspace/project-registry.json`.

- **BlackFire / AECI**: `c:\Projects\BlackFire\` — security proposals + portal
- **Astute**: `c:\Projects\Astute\`
- **GovTender**: `c:\Projects\GovTender\`
- **ilahle-portal**: `c:\Projects\ilahle-portal\`
- **JS_Resume**: `c:\Projects\JS_Resume\`

## Secrets & Environment Variables

Nothing is ever hardcoded. All secrets live in `.env` (NOT in repo).
- `.env` → in `.gitignore`, contains real values
- `.env.example` → committed, all keys with empty values — copy to `.env` on setup
- Full policy in `CLAUDE.md §8`

## Session Log Enforcement Script (MANDATORY)

The workspace uses a shared PowerShell enforcement script that must run at the end of every session:

```
c:\DevWork\.claude\scripts\session-log-update.ps1
```

**What it does:**
- Checks Decisions, Work Done, Learnings, and Goal Status
- Writes the closing accountability signature **once** — only when `## Goal Status` = `ACHIEVED`
- Auto-signs after 30 min inactivity with `[AUTOMATED - no user confirmation after 30min]`
- Once signed, subsequent runs just timestamp and exit

**How to run:**
```powershell
powershell.exe -NonInteractive -File "c:\DevWork\.claude\scripts\session-log-update.ps1" -LogPath "<exact-session-log-path>"
```

| Provider | Hook support | Invocation |
|----------|-------------|-----------|
| Claude Code | Native | `.claude/settings.json` |
| Factory Droid | Native | `.factory/hooks.json` |
| GitHub Copilot CLI (local Windows) | Native | `.github/hooks/constitution.json` |
| GitHub Copilot cloud | Soft fallback in this pack | `AGENTS.md`; add a portable bash hook before claiming native enforcement |
| OpenAI Codex | Native | `.codex/hooks.json` |
| Google Antigravity | Soft start/prompt fallback | `.agents/CONTEXT.md`; verified tool gate in `.agents/hooks.json` |
| Cursor | Native | `.cursor/hooks.json` |
| Kiro | Native | `.kiro/hooks/constitution.json` |

## Sensitive Files (never commit)

- `.env` — workspace secrets
- `chatsessions/*.jsonl`
- `BlackFire/BlackFire Portal/install/blackfire_aeci_seed.sql`
- `*.env`, `config.local.*`

## uSibali — Cost / Token Management Agent (MANDATORY)

**Zulu name:** uSibali *(The Accountant/Calculator)*. System prompt: `agents/sibali_system_prompt.md`

At conversation start, classify the request into a tier and check the active model:

| Tier | Label | Recommended (Claude) | Recommended (OpenAI) | Recommended (Google) |
|------|-------|---------------------|---------------------|---------------------|
| 1 | Fast / Cheap | Haiku 4.5 (9/10) | GPT-4o-mini (8/10) | Gemini Flash 2.0 (7/10) |
| 2 | Medium | Sonnet 4.6 (9/10) | GPT-4o (8/10) | Gemini 1.5 Pro (8/10) |
| 3 | Complex | Opus 4.7 (10/10) | o3 / o1 (9/10) | Gemini 2.5 Pro (9/10) |

If the active model is not appropriate for the tier, output a recommendation block and log it in the session log.
If the model is correct, log silently.

Target cost: Tier 1 < $0.05 | Tier 2 $0.05–$0.50 | Tier 3 $0.50–$5.00.

See full constitution in `CLAUDE.md` §11 for the complete rule and recommendation block format.

---

## Multi-Agent Workforce

**Zulu proper-name rule:** every human-facing agent name uses lowercase `u` plus the capitalized name stem: `uSibali`, `uMlawuli`, `uNkanyezi`, `uSiba`, `uMhloli`, `uMakhi`, `uMdwebi`, `uMvavanyi`, `uMcwaningi`, `uMbheki`, `uMlindi`, and `uMbhali`. Do not write the legacy unprefixed/capital-U forms as proper names. Stable lowercase filenames and technical identifiers such as `Invoke-Umakhi` remain compatibility exceptions.

All agent system prompts live in `agents/`. Full definitions in `CLAUDE.md` §12–§13.

| Zulu Name | English Meaning | Role |
|-----------|-----------------|------|
| **uSibali** | The Accountant | Cost governance & session log indexing |
| **uMlawuli** | The Controller | Supervisor — routes tasks, manages lifecycle |
| **uNkanyezi** | Star | Content & proposals (BlackFire docs, AECI) |
| **uSiba** | Feather / Pen | Document generation (generate_docs.ps1, Word/PDF) |
| **uMhloli** | Explorer / Inspector | Research, competitive intel, security audits |
| **uMakhi** | The Builder | Code & portal development (BlackFire Portal, Umlilo) |
| **uMdwebi** | The Artist | Brand identity, UI/UX design, design system governance |
| **uMvavanyi** | The Evaluator/Tester | Functional QA, regression, integration/E2E verification |
| **uMcwaningi** | The Auditor/Examiner | Code QA — correctness, coverage, efficiency, modularity |
| **uMbheki** | The Watcher/Observer | UX/UI QA — visual regression, accessibility, brand compliance |
| **uMlindi** | The Guardian/Watchman | Governance, compliance, policy enforcement, session audit |

These are **Sebenza agents** *(from ukusebenza: to work)* — full definitions in `agents/sebenza_agents.md`.
QA is split three ways: uMvavanyi (behavior), uMcwaningi (code quality), uMbheki (visual/UX) —
a single tester previously conflated all three, letting visual and code-quality issues slide
through under a functional pass/fail label.

**Routing rule:** Content → uNkanyezi | Docs → uSiba | Research → uMhloli | Code → uMakhi | Design → uMdwebi | Functional QA → uMvavanyi | Code QA → uMcwaningi | UX/UI QA → uMbheki | Governance → uMlindi.
All payloads pass through uSibali before reaching any Sebenza agent.
uMlindi audits uMakhi pre-deploy. uMvavanyi, uMcwaningi, and uMbheki each test a different slice
of uMakhi's output before release.

**Hard caps (max iterations before escalating to uMlawuli):**
uNkanyezi=3 | uSiba=2 | uMhloli=5 | uMakhi=3 | uMdwebi=2 | uMvavanyi=3 | uMcwaningi=3 | uMbheki=2 | uMlindi=2

**Fault tolerance:** uMlawuli retries a failed worker agent up to 3 times before flagging a system error.
**Memory compression:** uSibali triggers summarisation when a worker's context hits 70% capacity.

**Agent Accountability (MANDATORY):**
The closing signature is written to the session log ONCE when the user confirms the goal is achieved (Goal Status = ACHIEVED). Format:
```
> Completed by: {AgentName}  |  Task: {task_id}  |  Status: COMPLETED  |  Confirmed: User confirmed ACHIEVED  |  {datetime}
```
If not confirmed within 30 minutes and core sections are filled, auto-sign with:
```
> Completed by: {AgentName}  |  Status: COMPLETED [AUTOMATED]  |  Confirmed: AUTOMATED -- no user confirmation after 30min
```
Full accountability rules: `Multi-Agent Workforce Architecture & System Prompts.md §14`
