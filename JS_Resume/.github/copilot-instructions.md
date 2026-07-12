# JS Resume â€” GitHub Copilot Instructions

Mirror of AGENTS.md. All rules apply equally here.

## Project
JS Resume â€” SA government tender intelligence + proposal automation SaaS.
Python 3.11+ backend (FastAPI, Celery, Playwright) + Next.js 15 frontend + PostgreSQL 16 + pgvector.

## Non-Negotiable Rules
- Create session log before starting any session: `sessions/JS Resume_<topic>_YYYYMMDD_HHmmss.md`
- Backup any file before editing: `_backups/<name>_backup_YYYYMMDD_HHmmss.<ext>`
- No hardcoded secrets â€” `.env` only; never in source or comments
- All Python modules import and use `log_debug()` from `api/debug.py` (Pattern 21)
- All modules are modular and parameterised â€” no hardcoded values
- `DEBUG_MODE=false` in production `.env`; never `true` in `.env.example`

## Definition of Done
Code â†’ uMvavanyi/uMcwaningi/uMbheki (functional/code/UX QA PASS) â†’ uMlindi (COMPLIANT) â†’ uMbhali (docs updated) â†’ session log complete.

