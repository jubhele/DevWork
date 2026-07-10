# BlackFire — Workspace Constitution

> Mirrors the DevWork root constitution (c:\DevWork\CLAUDE.md).
> Project-specific rules below supplement and never contradict the root.

---

## 1. Project Identity

**BlackFire Solutions** — Security operations portal, client management, and mobile app.
- **Principal:** Jubhele Shange
- **Stack:** PHP 7.3+ (portal/API) + Next.js 15 (web) + Expo SDK 56 (mobile) + MySQL

---

## 2. Session Logging (MANDATORY)

Session logs live in `sessions/` within this repo.
Format: `blackfire_<topic>_YYYYMMDD_HHmmss.md`
Mirror to `G:\My Drive\JS\Agentic AI\sessions\blackfire\` with `.tbl.bk` suffix.

Every session must have: Goal, Decisions, Work Done, Blockers, **Learnings** (all mandatory).
Every new log also includes `Project: blackfire` and `Project Root: C:\DevWork\BlackFire`.
All artifacts stay project-local and are mapped by `ARTIFACT_INDEX.md`; see `docs/multi-agent-workforce-architecture.md §9.7`.

---

## 3. Agent Workforce Routing

This project uses the full multi-agent workforce from `agents/`.

| Task | Agent |
|------|-------|
| PHP portal, Next.js web, Expo mobile, DB, API | Umakhi |
| Security audit, threat modelling | Mhloli |
| Client proposals, security narratives | Nkanyezi |
| Word/PDF document generation, reporting scripts | Usiba |
| Brand identity, UI/UX (BlackFire brand) | Umdwebi |
| Functional QA, regression, integration/E2E verification | Mvavanyi |
| Code QA, static review, test coverage | Umcwaningi |
| UX/UI QA, visual regression, accessibility | Umbheki |
| Governance, RBAC audit, pre-deploy compliance | Umlindi |
| Docs, architecture maps, release notes | Mbhali |

---

## 4. Code Principles

See `docs/multi-agent-workforce-architecture.md` §11. Key project-specific additions:
- PHP: target PHP 7.3+ — no str_starts_with(), no match expressions.
- PHP: `api_headers()` must be called BEFORE `require_auth()` on every endpoint.
- PHP: never call `session_write_close()` before a `$_SESSION` write is complete.
- CSP: no inline `onclick`/`onkeydown` handlers — use `data-action` delegation.
- CSS: always set explicit `background-size` on large PNGs — never `auto`.
- JS: use boolean flags for empty-state logic, not string truthiness.
- DB: always seed counter rows before incrementing (INSERT IF NOT EXISTS).

---

## 5. Sensitive Data Policy

- `.env` is gitignored — never commit it.
- `.env.example` committed with empty values only (use `BF_` prefix for BlackFire vars).
- `BlackFire Portal/_backups/` may contain `.env` backups — confirm gitignored.
- No hardcoded credentials in PHP, JS, or SQL files.
- Umlindi audits Umakhi changes pre-deploy.

---

## 6. Multi-Tenancy Rule

All new database tables must include `host_company_id DEFAULT 1`.
See `docs/plan_multi_tenancy.md` for the full Phase 0 rules.

---

## 7. No Demo Language

Never use "demo" for pages, files, labels, or data. This is a pilot with real-life datasets.

---

## 8. Architecture Reference

See `docs/architecture_portal_app.md`, `docs/system_architecture.md`,
and `docs/multi-agent-workforce-architecture.md`.
