# DevWork Workspace Constitution (OpenAI Codex / Agents)

This file mirrors CLAUDE.md for OpenAI Codex CLI and other agents.
The authoritative source is `CLAUDE.md` — when in doubt, defer to it.

---

## Mandatory: Session Logging

Every session must create or update a log in `c:\DevWork\sessions\`.
Format: `YYYY-MM-DD_<topic-slug>.md`

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

## Sensitive Files (never commit)

- `chatsessions/*.jsonl`
- `BlackFire/BlackFire Portal/install/blackfire_aeci_seed.sql`
- `*.env`, `config.local.*`

See full constitution in `CLAUDE.md`.
