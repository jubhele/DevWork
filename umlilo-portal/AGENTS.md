# Umlilo Portal Constitution

This repository follows the DevWork Workspace Constitution and the Multi-Agent Workforce Architecture.

Authoritative local references:
- `docs/multi-agent-workforce-architecture.md` — full architecture, system prompts, protocol, provider map, and setup checklist.
- `agents/sibali_system_prompt.md` — Sibali cost governance and session indexing.
- `agents/mlawuli_system_prompt.md` — Mlawuli orchestration and routing.
- `agents/sebenza_agents.md` — Sebenza worker roster and domain rules.

---

## Mandatory Session Logging

Every session must create or update a log in `sessions/`.
Format: `<chat-name>_YYYYMMDD_HHmmss.md`.

Required sections:
- `## Goal`
- `## Decisions`
- `## Work Done`
- `## Blockers / Next Steps`
- `## Learnings`

Fill `Goal` at the start. Fill the rest before ending the session.

---

## Memory

Repo-local memory index: `memory/MEMORY.md`.
Workspace memory index, when available: `C:\Users\Jughele Shange\.claude\projects\c--DevWork\memory\MEMORY.md`.

Read memory before meaningful work. Update relevant memory before ending when decisions, constraints, trust scores, or durable project facts change.

---

## Sprint Workflow

Think → Plan → Build → Review → Test → Ship → Reflect

Reflect is mandatory before ending a session:
1. Add `## Learnings` to the session log.
2. Update relevant memory files.
3. If model trust diverged from expectation, update model-selection feedback memory.

---

## Sibali — Cost / Token Governance

At conversation start, classify the request tier and check model fit.

| Tier | Label | Recommended Claude | Recommended OpenAI | Recommended Google |
|------|-------|--------------------|--------------------|--------------------|
| 1 | Fast / Cheap | Haiku 4.5 | GPT-4o-mini | Gemini Flash 2.0 |
| 2 | Medium | Sonnet 4.6 | GPT-4o | Gemini 1.5 Pro |
| 3 | Complex | Opus 4.7 | o3 / o1 | Gemini 2.5 Pro |

If the active model is not appropriate for the tier, output a recommendation block and log it. If it is appropriate, log silently.

---

## Multi-Agent Workforce

This repo uses the DevWork named workforce:

| Zulu Name | Role |
|-----------|------|
| Sibali | Cost governance and session log indexing |
| Mlawuli | Supervisor, routing, lifecycle management |
| Nkanyezi | Content, narrative, proposals |
| Usiba | Document generation and Word/PDF automation |
| Mhloli | Research, intelligence, audits |
| Umakhi | Code and portal development |
| Umdwebi | Brand, design, UI/UX governance |
| Mvavanyi | Functional QA, regression, integration/E2E verification |
| Umcwaningi | Code QA — correctness, coverage, efficiency |
| Umbheki | UX/UI QA — visual regression, accessibility |
| Umlindi | Governance, compliance, security posture |
| Mbhali | Technical documentation |

QA is split three ways: Mvavanyi (behavior), Umcwaningi (code quality), Umbheki (visual/UX).

Routing rule: Content → Nkanyezi; Docs → Usiba or Mbhali; Research → Mhloli; Code → Umakhi; Design → Umdwebi; Functional QA → Mvavanyi; Code QA → Umcwaningi; UX/UI QA → Umbheki; Governance/security → Umlindi.

All payloads pass through Sibali before reaching a worker. The active provider acts as Mlawuli when it is the sole active agent.

---

## Provider Mirrors

Keep these provider entrypoints in sync after constitution changes:
- Platform-specific mirror: `CLAUDE.md`
- Provider-neutral agent instructions: `AGENTS.md`
- Hosted assistant mirror: `.github/copilot-instructions.md`
- Editor-native agent mirror: `.cursor/rules/constitution.mdc`

After changing one mirror, update the others in the same session.

---

## Code Principles

- No speculative features beyond the task.
- No explanatory comments; only non-obvious WHY comments.
- Validate only at system boundaries.
- PowerShell 5.1: no `&&`, no `||`, no ternary.
- Nothing secret is hardcoded. Secrets live only in ignored `.env` files.
- `.env.example` may be committed with empty values only.

---

## Sensitive Files

Never commit:
- `.env`, `.env.*`, `*.env`
- `config.local.*`
- `chatsessions/*.jsonl`
- raw seed files or exports containing live credentials or customer secrets

---

## Repo-Specific Notes

- This is the Umlilo / BlackFire monorepo: Next.js web app, Expo mobile app, and shared packages.
- `apps/web/AGENTS.md` has additional Next.js version-specific instructions.
- `apps/mobile/AGENTS.md` has additional Expo version-specific instructions.
- More deeply nested `AGENTS.md` files supplement this root constitution for their subtree.
