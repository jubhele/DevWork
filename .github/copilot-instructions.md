# DevWork Workspace Constitution (GitHub Copilot)

This file mirrors CLAUDE.md for GitHub Copilot.
The authoritative source is `CLAUDE.md` — defer to it for the full constitution.

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
- **Blockers / Next Steps** (fill at end)

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
| **Mvavanyi** | The Evaluator/Tester | QA, testing, regression, functional verification |
| **Umlindi** | The Guardian/Watchman | Governance, compliance, policy enforcement |

These are **Sebenza agents** — full definitions in `agents/sebenza_agents.md`.

Routing: Content → Nkanyezi | Docs → Usiba | Research → Mhloli | Code → Umakhi | Design → Umdwebi | QA → Mvavanyi | Governance → Umlindi.
All payloads pass through Sibali before reaching any Sebenza agent.
Umdwebi brand source: `design/blackfire/brand_tokens.md`

---

## Sensitive Files (never expose or commit)

- `chatsessions/*.jsonl` — may contain plain-text credentials
- `BlackFire/BlackFire Portal/install/blackfire_aeci_seed.sql`
- Any `*.env` or `config.local.*`
