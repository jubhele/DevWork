# DevWork Workspace Constitution (GitHub Copilot)

This file mirrors CLAUDE.md for GitHub Copilot.
The authoritative source is `CLAUDE.md` — defer to it for the full constitution.

---

## Session Close Hook (MANDATORY)

At the end of every session, run the session close hook:

```
VS Code: Ctrl+Shift+P → Tasks: Run Task → Close Session Log
```

Or in the terminal:
```powershell
powershell.exe -NonInteractive -File "c:\DevWork\.claude\scripts\session-log-update.ps1" -LogPath "<exact-session-log-path>"
```

Copilot CLI on local Windows runs `.github/hooks/constitution.json` at session start, every prompt, and session end. Copilot cloud runs in Linux, so this PowerShell-only pack treats cloud and Copilot VS Code chat as instruction-file soft fallbacks. Add and test a portable bash hook before claiming cloud-native enforcement.

---

## Mandatory: Session Logging

Every session must create or update a log in `c:\DevWork\sessions\`.
Format: `<chat-name>_YYYYMMDD_HHmmss.md` — one file per session, named after the chat topic with a timestamp suffix.

Log structure:
- **Goal** (fill at start of session)
- **Provider**: GitHub Copilot
- **Model**: <model name>
- **Decisions** (fill at end)
- **Work Done**: list files changed and what changed
- **Agent Accountability** (fill at end — one row per task assigned this session)
- **Blockers / Next Steps** (fill at end)
- **Learnings** (MANDATORY — fill before ending session)

**Agent Accountability table** (mandatory at session end):

| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|

Mlawuli fills one row when the user confirms the goal is achieved. Umlindi audits at session end.

**Goal Status field (mandatory in every session log):**
```
## Goal Status
PENDING   ← user changes to ACHIEVED when goal is done
```
Closing signature written ONLY on ACHIEVED. Exception: 30min inactivity with core sections filled → auto-sign marked `[AUTOMATED - no user confirmation after 30min]`.

---

## Memory

Check `C:\Users\Jughele Shange\.claude\projects\c--DevWork\memory\MEMORY.md` before starting.
All providers share this memory. Save decisions and constraints found during the session.

---

## Sprint Workflow

Think → Plan → Build → Review → Test → Ship → Reflect

**Reflect is MANDATORY.** Before ending any session:
1. Add a `## Learnings` section to the session log.
2. Update relevant memory files in `memory/` (decisions, constraints, trust score changes).
3. Claude Code users: run `/learn` — it reads the session log and updates memory automatically.
4. If the active model trust score diverged from expectation: update `memory/feedback_model_selection.md`.

---

## Cross-Provider Handoff

If handing off to another AI (Claude, Codex, Antigravity, Cursor, Kiro, Factory Droid):
1. Commit in-progress work with `WIP:` prefix.
2. Update session log with current state and exact next steps.
3. The next AI reads the session log before starting.

---

## Constitution Propagation

When the constitution or multi-agent architecture is copied into a repo or updated for a user:
1. Inspect the target workspace/repo for `CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md`, `.cursor/rules/constitution.mdc`, nested `AGENTS.md`, `agents/`, `docs/`, `sessions/`, `memory/`, `.env.example`, and `.gitignore`.
2. Apply missing mandatory rules locally.
3. Preserve stricter project-specific overrides.
4. If the inspection reveals a generic improvement, update the architecture guide so future repos receive it.
5. Re-copy the updated guide into the target repo and rerun the mirror audit.

---

## Code Principles

- No speculative features.
- Comments only for non-obvious WHY (not what).
- Security: validate at system boundaries only.
- PowerShell 5.1: no `&&`/`||`, no ternary operator.

---

## Projects

- **BlackFire / AECI**: `c:\DevWork\BlackFire\` — security proposals + PHP portal
- **Astute**: `c:\DevWork\Astute\`

## Sibali — Cost / Token Management Agent (MANDATORY)

**Zulu name:** Sibali *(The Accountant/Calculator)*. System prompt: `agents/sibali_system_prompt.md`

At conversation start, classify the request and check if the active model fits the tier:

| Tier | Label | Claude | GitHub Models / OpenAI |
|------|-------|--------|------------------------|
| 1 | Fast / Cheap | Haiku 4.5 (9/10) | GPT-4o-mini (8/10) |
| 2 | Medium | Sonnet 4.6 (9/10) | GPT-4o (8/10) |
| 3 | Complex | Opus 4.7 (10/10) | o3 / o1 (9/10) |

If the model is wrong for the tier, output the recommendation block (see CLAUDE.md §11.3) and log it.
If correct, log silently.

Target cost: Tier 1 < $0.05 | Tier 2 $0.05–$0.50 | Tier 3 $0.50–$5.00.

---

## Multi-Agent Workforce

All agent system prompts live in `agents/`. Full definitions in `CLAUDE.md` §12–§13.

| Zulu Name | English Meaning | Role |
|-----------|-----------------|------|
| **Sibali** | The Accountant | Cost governance & session log indexing |
| **Mlawuli** | The Controller | Supervisor — routes tasks, manages lifecycle |
| **Nkanyezi** | Star | Content & proposals |
| **Usiba** | Feather / Pen | Document generation |
| **Mhloli** | Explorer / Inspector | Research, intel, security audits |
| **Umakhi** | The Builder | Code & portal development |
| **Umdwebi** | The Artist | Brand identity, UI/UX design, design system governance |
| **Mvavanyi** | The Evaluator/Tester | Functional QA, regression, integration/E2E verification |
| **Umcwaningi** | The Auditor/Examiner | Code QA — correctness, coverage, efficiency |
| **Umbheki** | The Watcher/Observer | UX/UI QA — visual regression, accessibility |
| **Umlindi** | The Guardian/Watchman | Governance, compliance, policy enforcement |

These are **Sebenza agents** — full definitions in `agents/sebenza_agents.md`.
QA is split three ways: Mvavanyi (behavior), Umcwaningi (code quality), Umbheki (visual/UX).

Routing: Content → Nkanyezi | Docs → Usiba | Research → Mhloli | Code → Umakhi | Design → Umdwebi | Functional QA → Mvavanyi | Code QA → Umcwaningi | UX/UI QA → Umbheki | Governance → Umlindi.
All payloads pass through Sibali before reaching any Sebenza agent.
Umdwebi brand source: `design/blackfire/brand_tokens.md`

**Agent Accountability (MANDATORY):**
Closing signature written to session log ONCE when user confirms goal is achieved (Goal Status = ACHIEVED):
```
> Completed by: {AgentName}  |  Task: {task_id}  |  Status: COMPLETED  |  Confirmed: User confirmed ACHIEVED  |  {datetime}
```
Auto-confirm exception (30min inactivity, core sections filled):
```
> Completed by: {AgentName}  |  Status: COMPLETED [AUTOMATED]  |  Confirmed: AUTOMATED -- no user confirmation after 30min
```
Full rules: `Multi-Agent Workforce Architecture & System Prompts.md §14`

---

## Project-Local Artifacts and Root Index (MANDATORY)

Write project sessions and artifacts below the owning project root (`sessions/`, `artifacts/`,
`archive/`, `temp/`, `logs/`, `_backups/`). Use `C:\DevWork\_workspace\` only for genuinely
cross-project/control-plane work. New session logs include `Project` and `Project Root`.
`C:\DevWork\WORKSPACE_INDEX.md` is the only root artifact catalogue and session close updates it only
when summaries change. Ambiguous legacy items go to `_workspace\index\unresolved\`; never guess,
overwrite, flatten project mirrors, bulk-delete temp data, or cross Git boundaries without a
hash-verified manifest. Full rule: `Multi-Agent Workforce Architecture & System Prompts.md §9.7`.

---

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

GitHub Copilot CLI and cloud agent support repository lifecycle hooks in `.github/hooks/*.json`; this workspace registers start, every-prompt, and end enforcement there. The VS Code chat surface is not assumed to execute those hooks, so these instructions must be treated as the per-turn fallback and the VS Code close task remains available.

## Sensitive Files (never expose or commit)

- `chatsessions/*.jsonl` — may contain plain-text credentials
- `BlackFire/BlackFire Portal/install/blackfire_aeci_seed.sql`
- Any `*.env` or `config.local.*`
