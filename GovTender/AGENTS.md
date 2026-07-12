# GovTender — Agent Constitution (Provider-Neutral)

All AI providers operating in this repository follow this constitution.
Provider-specific files (CLAUDE.md, .github/copilot-instructions.md, .cursor/rules/constitution.mdc) mirror this document.

## Project

GovTender — South African government tender intelligence and proposal automation platform.
Stack: Python 3.11+ (FastAPI, Celery, Playwright, SQLAlchemy) + Next.js 15 + PostgreSQL 16 + pgvector + Redis.

## Mandatory Rules

1. **Session log** — every session creates `sessions/govtender_<topic>_YYYYMMDD_HHmmss.md`. Sections: Goal, Decisions, Work Done, Blockers, Learnings. All mandatory.
2. **Backup before change** — `_backups/<filename>_backup_YYYYMMDD_HHmmss.<ext>` before every file modification.
3. **No hardcoded secrets** — all secrets in `.env` only. Never in source, comments, or logs.
4. **Pattern 21 debug hook** — every Python module imports `from api.debug import log_debug` and logs all critical state transitions. `DEBUG_MODE=false` in production.
5. **Modular & dynamic** — no hardcoded values. All modules accept config objects or parameters.
6. **Agent routing** — see CLAUDE.md §3 for the full workforce routing table.
7. **Definition of done** — uMakhi builds → uMvavanyi/uMcwaningi/uMbheki test (functional/code/UX) → uMlindi audits → uMbhali documents. All must pass.

## Project-Local Artifacts (MANDATORY)

Sessions, generated work, archives, temp files, logs, and backups stay below this repository and are
mapped by `ARTIFACT_INDEX.md`. Every new log includes `Project: govtender` and this project's absolute
`Project Root`. Full rule: `docs/multi-agent-workforce-architecture.md §9.7`.

## Key Files

- `docs/architecture.md` — full system architecture
- `docs/plan.md` — master build plan with all tasks
- `docs/guide.md` — operator guide (uMbhali maintains)
- `docs/system_architecture.md` — Mermaid.js diagrams
- `shared/db/migrations/` — all schema migrations
- `crawler/portals/` — one file per government tender portal
- `matcher/score.py` — Claude Haiku relevance scorer
- `proposal/generator.py` — Claude Sonnet proposal drafter
- `automation/vault.py` — AES-256-GCM credential vault
- `api/debug.py` — Pattern 21 debug hook

## Do Not Commit

- `.env` (any environment file with real values)
- `uploads/` (generated proposals)
- `sessions/debug_*.log`
- `_backups/`
- `temp/`
- `node_modules/`
- `__pycache__/`
