# JS Resume â€” Agent Constitution (Provider-Neutral)

All AI providers operating in this repository follow this constitution.
Provider-specific files (CLAUDE.md, .github/copilot-instructions.md, .cursor/rules/constitution.mdc) mirror this document.

## Project

JS Resume â€” South African government tender intelligence and proposal automation platform.
Stack: Python 3.11+ (FastAPI, Celery, Playwright, SQLAlchemy) + Next.js 15 + PostgreSQL 16 + pgvector + Redis.

## Mandatory Rules

1. **Session log** â€” every session creates `sessions/JS Resume_<topic>_YYYYMMDD_HHmmss.md`. Sections: Goal, Decisions, Work Done, Blockers, Learnings. All mandatory.
2. **Backup before change** â€” `_backups/<filename>_backup_YYYYMMDD_HHmmss.<ext>` before every file modification.
3. **No hardcoded secrets** â€” all secrets in `.env` only. Never in source, comments, or logs.
4. **Pattern 21 debug hook** â€” every Python module imports `from api.debug import log_debug` and logs all critical state transitions. `DEBUG_MODE=false` in production.
5. **Modular & dynamic** â€” no hardcoded values. All modules accept config objects or parameters.
6. **Agent routing** â€” see CLAUDE.md Â§3 for the full workforce routing table.
7. **Definition of done** â€” Umakhi builds â†’ Mvavanyi tests â†’ Umlindi audits â†’ Mbhali documents. All four must pass.

## Key Files

- `docs/architecture.md` â€” full system architecture
- `docs/plan.md` â€” master build plan with all tasks
- `docs/guide.md` â€” operator guide (Mbhali maintains)
- `docs/system_architecture.md` â€” Mermaid.js diagrams
- `shared/db/migrations/` â€” all schema migrations
- `crawler/portals/` â€” one file per government tender portal
- `matcher/score.py` â€” Claude Haiku relevance scorer
- `proposal/generator.py` â€” Claude Sonnet proposal drafter
- `automation/vault.py` â€” AES-256-GCM credential vault
- `api/debug.py` â€” Pattern 21 debug hook

## Do Not Commit

- `.env` (any environment file with real values)
- `uploads/` (generated proposals)
- `sessions/debug_*.log`
- `_backups/`
- `temp/`
- `node_modules/`
- `__pycache__/`

