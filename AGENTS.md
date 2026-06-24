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

Mlawuli fills one row when the user confirms the goal is achieved. Umlindi audits at session end — any agent assigned with no COMPLETED entry is a HIGH governance violation, flagged by name.

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

---

## Code Principles

- No speculative features beyond the task.
- No explanatory comments — only non-obvious WHY comments.
- Validate only at system boundaries.
- PowerShell 5.1: no `&&`/`||`, no ternary.

---

## Projects

- **BlackFire / AECI**: `c:\DevWork\BlackFire\` — security proposals + portal
- **Astute**: `c:\DevWork\Astute\`

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
powershell.exe -NonInteractive -File "c:\DevWork\.claude\scripts\session-log-update.ps1"
```

| Provider | Hook support | Invocation |
|----------|-------------|-----------|
| Claude Code | Auto (Stop hook in `.claude/settings.json`) | Runs automatically |
| Factory Droid | Auto (`hooks.on_session_end` in `.factory/config.yaml`) | Runs automatically |
| GitHub Copilot | None | Run manually at session end |
| OpenAI Codex | None | Run manually at session end |
| Google Antigravity | None | Run manually at session end |
| Cursor | None | Run manually, or via VS Code task |
| Kiro | None | Run manually at session end |

## Sensitive Files (never commit)

- `.env` — workspace secrets
- `chatsessions/*.jsonl`
- `BlackFire/BlackFire Portal/install/blackfire_aeci_seed.sql`
- `*.env`, `config.local.*`

## Sibali — Cost / Token Management Agent (MANDATORY)

**Zulu name:** Sibali *(The Accountant/Calculator)*. System prompt: `agents/sibali_system_prompt.md`

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

All agent system prompts live in `agents/`. Full definitions in `CLAUDE.md` §12–§13.

| Zulu Name | English Meaning | Role |
|-----------|-----------------|------|
| **Sibali** | The Accountant | Cost governance & session log indexing |
| **Mlawuli** | The Controller | Supervisor — routes tasks, manages lifecycle |
| **Nkanyezi** | Star | Content & proposals (BlackFire docs, AECI) |
| **Usiba** | Feather / Pen | Document generation (generate_docs.ps1, Word/PDF) |
| **Mhloli** | Explorer / Inspector | Research, competitive intel, security audits |
| **Umakhi** | The Builder | Code & portal development (BlackFire Portal, Umlilo) |
| **Umdwebi** | The Artist | Brand identity, UI/UX design, design system governance |
| **Mvavanyi** | The Evaluator/Tester | QA, testing, regression, functional verification |
| **Umlindi** | The Guardian/Watchman | Governance, compliance, policy enforcement, session audit |

These are **Sebenza agents** *(from ukusebenza: to work)* — full definitions in `agents/sebenza_agents.md`.

**Routing rule:** Content → Nkanyezi | Docs → Usiba | Research → Mhloli | Code → Umakhi | Design → Umdwebi | QA → Mvavanyi | Governance → Umlindi.
All payloads pass through Sibali before reaching any Sebenza agent.
Umlindi audits Umakhi pre-deploy. Mvavanyi tests Umakhi output before release.

**Hard caps (max iterations before escalating to Mlawuli):**
Nkanyezi=3 | Usiba=2 | Mhloli=5 | Umakhi=3 | Umdwebi=2 | Mvavanyi=3 | Umlindi=2

**Fault tolerance:** Mlawuli retries a failed worker agent up to 3 times before flagging a system error.
**Memory compression:** Sibali triggers summarisation when a worker's context hits 70% capacity.

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
