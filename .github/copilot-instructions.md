# DevWork Workspace Constitution (GitHub Copilot)

This file mirrors CLAUDE.md for GitHub Copilot.
The authoritative source is `CLAUDE.md` — defer to it for the full constitution.

---

## Mandatory: Session Logging

Every session must create or update a log in `c:\DevWork\sessions\`.
Format: `YYYY-MM-DD_<topic-slug>.md`

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

---

## Cross-Provider Handoff

If handing off to another AI (Claude, Codex, Cursor):
1. Commit in-progress work with `WIP:` prefix.
2. Update session log with current state and exact next steps.
3. The next AI reads the session log before starting.

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

## Sensitive Files (never expose or commit)

- `chatsessions/*.jsonl` — may contain plain-text credentials
- `BlackFire/BlackFire Portal/install/blackfire_aeci_seed.sql`
- Any `*.env` or `config.local.*`
