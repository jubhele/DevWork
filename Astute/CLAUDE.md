# Astute Insights — Workspace Constitution

> Mirrors the DevWork root constitution (c:\DevWork\CLAUDE.md).
> Project-specific rules below supplement and never contradict the root.

---

## 1. Project Identity

**Astute Insights** — Business intelligence and data analytics platform.
- **Principal:** Jubhele Shange
- **Stack:** Next.js 15 (web) + Expo (mobile) + TypeScript

---

## 2. Session Logging (MANDATORY)

Session logs live in `c:\DevWork\Astute\sessions\`.
Format: `astute_<topic>_YYYYMMDD_HHmmss.md`
Mirror to `G:\My Drive\JS\Agentic AI\sessions\astute\` with `.tbl.bk` suffix.

Every session must have: Goal, Decisions, Work Done, Blockers, **Learnings** (all mandatory).
Every new log also includes `Project: astute` and `Project Root: C:\DevWork\Astute`.
All artifacts stay project-local and are mapped by `ARTIFACT_INDEX.md`; see `docs/multi-agent-workforce-architecture.md §9.7`.

---

## 3. Agent Workforce Routing

This project uses the full multi-agent workforce from `agents/`.

| Task | Agent |
|------|-------|
| Code, DB, API, infrastructure | Umakhi |
| Research, competitive intelligence | Mhloli |
| Content, proposals, copy | Nkanyezi |
| Document generation, automation | Usiba |
| UI/UX design specs, brand | Umdwebi |
| Functional QA, regression, integration testing | Mvavanyi |
| Code QA, static review, test coverage | Umcwaningi |
| UX/UI QA, visual regression, accessibility | Umbheki |
| Governance, secrets audit, pre-deploy | Umlindi |
| Docs, architecture maps, release notes | Mbhali |

---

## 4. Code Principles

See root CLAUDE.md §7. Key project-specific additions:
- TypeScript strict mode always on.
- No hardcoded API URLs — use `.env` vars.
- Brand tokens live in `design/astute/brand_tokens.md`.

---

## 5. Sensitive Data Policy

- `.env` is gitignored — never commit it.
- `.env.example` is committed with empty values only.
- All API keys use `AI_` prefix (Astute Insights namespace).

---

## 6. Architecture Reference

See `docs/system_architecture.md` and `docs/multi-agent-workforce-architecture.md`.
