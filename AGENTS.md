# DevWork Workspace Constitution (OpenAI Codex / Google Antigravity / Agents)

This file mirrors CLAUDE.md for OpenAI Codex CLI, Google Antigravity, and other agents that read AGENTS.md.
The authoritative source is `CLAUDE.md` — when in doubt, defer to it.

---

## Mandatory: Session Logging

Every session must create or update a log in `c:\DevWork\sessions\`.
Format: `<chat-name>_YYYYMMDD_HHmmss.md` — one file per session, named after the chat topic with a timestamp suffix.

Log structure:
- **Goal** (fill at start)
- **Decisions** (fill at end)
- **Work Done** (fill at end)
- **Blockers / Next Steps** (fill at end)

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
