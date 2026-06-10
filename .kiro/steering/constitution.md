---
inclusion: always
---

# DevWork Workspace Constitution (Kiro)

This mirrors CLAUDE.md for Kiro. Full authoritative constitution in `CLAUDE.md`.

## Mandatory: Session Logging

Create or update a log in `c:\DevWork\sessions\` at session start and end.
Format: `<chat-name>_YYYYMMDD_HHmmss.md`
Sections: Goal, Provider, Model, Decisions, Work Done, Blockers/Next Steps, Learnings.
Mirror to: `G:\My Drive\JS\Agentic AI\sessions\<filename>.md.tbl.bk`

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

## Sensitive Files (never commit)

- `.env`, `*.env`, `config.local.*`
- `chatsessions/*.jsonl`
- `BlackFire/BlackFire Portal/install/blackfire_aeci_seed.sql`
