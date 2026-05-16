# Session: Session Log Naming Convention Update
Date: 2026-05-16
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Update the session log filename format across all provider constitution files from `YYYY-MM-DD_<topic-slug>.md` to `<chat-name>_YYYYMMDD_HHmmss.md` so each session log is uniquely identified by chat name and timestamp.

## Decisions
- New format: `<chat-name>_YYYYMMDD_HHmmss.md` — separates chat identity from timestamp, allows multiple sessions on the same day without collision.
- Applied to all four provider files (CLAUDE.md, AGENTS.md, copilot-instructions.md, constitution.mdc) to keep them in sync.

## Work Done
- `CLAUDE.md` — updated Format line in Section 1
- `AGENTS.md` — updated Format line in Session Logging section
- `.github/copilot-instructions.md` — updated Format line in Session Logging section
- `.cursor/rules/constitution.mdc` — updated Format line in Session Logging section
- Backup created: `_backups/CLAUDE_backup_20260516_083624.md`

## Blockers / Next Steps
- None.
