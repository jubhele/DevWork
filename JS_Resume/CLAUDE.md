# JS Resume — Workspace Constitution

> Mirrors the DevWork root constitution (c:\DevWork\CLAUDE.md).
> Project-specific rules below supplement and never contradict the root.

---

## 1. Project Identity

**JS Resume** — Jubhele Shange's professional resume and job application materials.
- **Principal:** Jubhele Shange
- **Contents:** CV documents, cover letters, job application tailored versions

---

## 2. Session Logging (MANDATORY)

Session logs live in `c:\DevWork\JS_Resume\sessions\`.
Format: `resume_<topic>_YYYYMMDD_HHmmss.md`
Mirror to `G:\My Drive\JS\Agentic AI\sessions\js-resume\` with `.tbl.bk` suffix.

Every session must have: Goal, Decisions, Work Done, Blockers, **Learnings** (all mandatory).
Every new log also includes `Project: js-resume` and `Project Root: C:\DevWork\JS_Resume`.
All artifacts stay project-local and are mapped by `ARTIFACT_INDEX.md`; see `docs/multi-agent-workforce-architecture.md §9.7`.

---

## 3. Agent Workforce Routing

| Task | Agent |
|------|-------|
| Resume content, cover letters, narratives | Nkanyezi |
| Document generation (.docx, .pdf) | Usiba |
| Job market research, role intel | Mhloli |
| Brand / visual layout | Umdwebi |
| Governance, PII audit | Umlindi |

---

## 4. Sensitive Data Policy

- This repo may contain PII (contact details, employment history).
- `.gitignore` must exclude any files containing phone numbers or home addresses.
- Job application tracking data goes in `sessions/` not loose files.

---

## 5. Architecture Reference

See `docs/multi-agent-workforce-architecture.md`.
