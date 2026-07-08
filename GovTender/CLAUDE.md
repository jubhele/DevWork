# GovTender — Workspace Constitution

> Mirrors the DevWork root constitution (c:\DevWork\CLAUDE.md).
> Project-specific rules below supplement and never contradict the root.

---

## 1. Project Identity

**GovTender** — South African government tender intelligence and proposal automation platform.
- **Operator:** Astute Insights + BlackFire Solutions (pilot subscribers)
- **Principal:** Jubhele Shange
- **Stack:** Python (crawler/API/Celery) + Next.js 15 (web) + PostgreSQL 16 + pgvector + Redis

---

## 2. Session Logging (MANDATORY)

Session logs live in `c:\DevWork\GovTender\sessions\`.
Format: `govtender_<topic>_YYYYMMDD_HHmmss.md`
Mirror to `G:\My Drive\JS\Agentic AI\sessions\` with `.tbl.bk` suffix.

Every session must have: Goal, Decisions, Work Done, Blockers, **Learnings** (all mandatory).

---

## 3. Agent Workforce Routing

This project uses the full multi-agent workforce from `agents/`.

| Task | Agent |
|------|-------|
| Code, DB, API, infrastructure | Umakhi |
| Research (portal schemas, procurement taxonomy) | Mhloli |
| Proposal templates, marketing copy | Nkanyezi |
| Document generation, Word/PDF automation | Usiba |
| UI/UX design specs | Umdwebi |
| Functional QA, regression, integration testing | Mvavanyi |
| Code QA, static review, test coverage | Umcwaningi |
| UX/UI QA, visual regression, accessibility | Umbheki |
| Governance, secrets audit, pre-deploy | Umlindi |
| Docs, architecture maps, release notes | Mbhali |

All tasks route through Sibali (cost clearance) before reaching any worker.

**Hard caps** (max iterations before escalating to Mlawuli):

| Agent | Cap |
|-------|-----|
| Nkanyezi | 3 |
| Usiba | 2 |
| Mhloli | 5 |
| Umakhi | 3 |
| Umdwebi | 2 |
| Mvavanyi | 3 |
| Umcwaningi | 3 |
| Umbheki | 2 |
| Umlindi | 2 |
| Mbhali | 2 |

---

## 4. Code Principles

### 4.1 Modular & Dynamic (from Multi-Agent Architecture §3.6)
- Every module must be parameterised. No hardcoded portal URLs, tenant IDs, model names, or file paths.
- Crawler modules accept a config object. Proposal templates accept a template_path param.
- Workers accept task payloads — they do not read global state.

### 4.2 Observability — Pattern 21 (MANDATORY in every module)
```python
from api.debug import log_debug

# Log every critical state transition:
log_debug('CRAWL_START', {'portal': 'etenders', 'page': 1})
log_debug('DB_WRITE', {'table': 'tenders', 'ref': ref_number})
log_debug('API_CALL', {'model': 'claude-haiku-4-5', 'tokens_in': n})
```

Pattern 21 debug hook activates when `DEBUG_MODE=true` in `.env`.
`DEBUG_MODE` must be `false` in production. `true` in `.env.example` is a POLICY_BLOCK.

### 4.3 No Hardcoded Secrets
- All secrets in `.env` only. Never in source files, comments, logs, or session logs.
- `.env` is in `.gitignore`. `.env.example` is committed with empty values.

### 4.4 Backup Before Change
- Before modifying any file, create: `_backups/<filename>_backup_YYYYMMDD_HHmmss.<ext>`
- Backups are gitignored.

### 4.5 No Comments Explaining What Code Does
- Comments only for hidden constraints, workarounds, non-obvious invariants.

---

## 5. Python-Specific Rules

- Target Python 3.11+
- Use `async`/`await` throughout (FastAPI + Playwright async mode)
- SQLAlchemy 2.x async ORM
- All DB queries parameterised (never raw string interpolation into SQL)
- Pydantic models for all request/response shapes and inter-module data exchange
- `ruff` for linting + formatting; `mypy` for type checking

---

## 6. Next.js / TypeScript Rules

- Next.js 15 App Router only — no Pages Router patterns
- Tailwind v4 with CSS `@theme` — no `tailwind.config.ts` needed
- NextAuth.js for auth — JWT in HttpOnly cookie
- tRPC for all API calls from frontend to Python backend
- No `dangerouslySetInnerHTML`
- No inline `style=` in JSX — use className + Tailwind

---

## 7. Database Rules

- All schema changes via Alembic migration files — never ALTER TABLE directly in dev DB
- UUIDs as primary keys (uuid-ossp)
- Timestamps always `TIMESTAMPTZ` (not plain `TIMESTAMP`)
- Foreign keys enforced at DB level
- pgvector columns: `vector(1536)` for text-embedding-3-small
- Never store plaintext credentials — only AES-256-GCM ciphertext

---

## 8. Sensitive Data (extends root §8)

Additional GovTender-sensitive paths (never commit):
- `uploads/` — generated proposal documents (may contain subscriber commercial data)
- `sessions/debug_*.log` — debug logs (may contain tender data)
- `automation/vault_test_creds.json` — if created for testing, stays in `temp/`

---

## 9. Definition of Done

A feature is done when:
1. Code merged to `main`
2. Mvavanyi (functional), Umcwaningi (code), Umbheki (UX) QA → all `"status": "PASS"` (golden path + edge cases)
3. Umlindi audit → `"verdict": "COMPLIANT"`
4. Mbhali updates `docs/guide.md`, `docs/sttm.md`, `docs/system_architecture.md`
5. Session log complete — Goal + Decisions + Work Done + Learnings all filled
6. No `⚠ Session Log Incomplete` warnings

---

## 10. Skill Routing

| Trigger | Skill |
|---------|-------|
| Bugs / root cause | `/investigate` |
| Code review | `/review` |
| QA testing | `/qa` |
| Security audit | `/cso` |
| Ship / PR | `/ship` |
| Save progress | `/context-save` |
