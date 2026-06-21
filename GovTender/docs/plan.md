# GovTender — Master Build Plan

**Version:** 0.1  
**Date:** 2026-06-21  
**Owner:** Astute Insights / BlackFire Solutions  
**Agent routing:** Umakhi (build) → Mvavanyi (QA) → Umlindi (audit) → Mbhali (docs)

---

## Agent Workforce Routing (per task)

All tasks follow the Mlawuli protocol from the Multi-Agent Workforce Architecture:

```
Human → Mlawuli → Sibali (cost clearance) → Worker Agent → Mlawuli → Sibali (index) → Human
```

| Task type | Agent |
|-----------|-------|
| Writing code, DB schema, API | Umakhi |
| Research (portals, procurement taxonomy) | Mhloli |
| Proposal templates, content | Nkanyezi |
| Document generation scripts | Usiba |
| UI/UX design specs | Umdwebi |
| QA, functional verification | Mvavanyi |
| Governance, secret audits | Umlindi |
| Docs, architecture, release notes | Mbhali |

---

## Phase 0 — Foundation (Week 0, current)

Everything below must exist before a single line of product code is written.

### P0.1 — Workspace Constitution
- [x] `docs/architecture.md` — full system architecture document
- [x] `docs/plan.md` — this file
- [ ] `CLAUDE.md` — GovTender-specific constitution (mirrors workspace rules, adds project-specific overrides)
- [ ] `AGENTS.md` — provider-neutral canonical rules
- [ ] `.github/copilot-instructions.md` — Copilot mirror
- [ ] `.cursor/rules/constitution.mdc` — Cursor mirror
- [ ] `.gitignore` — covers `.env`, `node_modules`, `__pycache__`, `*.pyc`, `sessions/debug_*`, `temp/`
- [ ] `.env.example` — all keys with empty values
- [ ] `sessions/` — session log directory with `_template.md`
- [ ] `memory/MEMORY.md` — memory index
- [ ] `memory/project_govtender.md` — GovTender project memory seed

### P0.2 — Agent System Prompts
- [ ] `agents/sibali_system_prompt.md`
- [ ] `agents/mlawuli_system_prompt.md`
- [ ] `agents/sebenza_agents.md` — all 8 Sebenza agents

### P0.3 — Docs Foundation
- [ ] `docs/guide.md` — operator guide (stub; Mbhali fills on each production delivery)
- [ ] `docs/sttm.md` — system test manual (stub; Mvavanyi fills per feature)
- [ ] `docs/system_architecture.md` — Mermaid.js diagrams (generated from architecture.md)

### P0.4 — Docker Compose Dev Environment
- [ ] `docker-compose.yml` — PostgreSQL 16 + Redis + pgAdmin
- [ ] `docker-compose.dev.yml` — overrides for local development
- [ ] `scripts/db-init.sh` — enables pgvector + pg_trgm extensions on first run
- [ ] `scripts/reset-db.sh` — drops + recreates for clean dev state

---

## Phase 1 — Backend Scaffold (Week 1)

### P1.1 — Python Project Setup
- [ ] `pyproject.toml` — project metadata, dependencies (FastAPI, SQLAlchemy, Alembic, Celery, Redis, Playwright, BeautifulSoup4, Scrapy, python-docx, WeasyPrint, anthropic, pgvector, pydantic, python-dotenv, passlib, PyJWT)
- [ ] `requirements.txt` — generated lockfile
- [ ] `api/__init__.py` + `api/main.py` — FastAPI app entry point
- [ ] `api/config.py` — loads `.env`, exposes typed settings object
- [ ] `api/db.py` — SQLAlchemy async engine + session factory
- [ ] `api/auth.py` — JWT issue + verify
- [ ] `api/debug.py` — **Pattern 21 debug hook** (log_debug function, session-scoped log files)
- [ ] `api/health.py` — `/health` liveness probe

### P1.2 — Database Schema (Alembic migrations)
- [ ] `shared/db/migrations/001_extensions.sql` — CREATE EXTENSION pgvector, pg_trgm, uuid-ossp
- [ ] `shared/db/migrations/002_tenders.sql` — tenders table
- [ ] `shared/db/migrations/003_subscribers.sql` — subscribers table
- [ ] `shared/db/migrations/004_subscriber_documents.sql` — subscriber_documents with vector column
- [ ] `shared/db/migrations/005_tender_matches.sql` — tender_matches table
- [ ] `shared/db/migrations/006_proposals.sql` — proposals table
- [ ] `shared/db/migrations/007_portal_credentials.sql` — portal_credentials table (encrypted)
- [ ] `shared/db/migrations/008_seed_subscribers.sql` — seed Astute Insights + BlackFire pilot accounts
- [ ] `shared/db/alembic.ini` — Alembic config pointing to database URL from env

### P1.3 — SQLAlchemy ORM Models
- [ ] `shared/types/models.py` — Python dataclasses / Pydantic models matching all tables
- [ ] `shared/types/schemas.py` — Pydantic request/response schemas for API

### P1.4 — API Endpoints (stubs — logic added per phase)
- [ ] `api/tenders.py` — GET /tenders, GET /tenders/{id}
- [ ] `api/proposals.py` — POST /proposals/generate, GET /proposals/{id}
- [ ] `api/subscribers.py` — GET/PUT /subscribers/profile, POST /subscribers/documents
- [ ] `api/webhooks.py` — POST /webhooks/stripe

### P1.5 — Celery Task Queue
- [ ] `crawler/celery_app.py` — Celery app init (broker=Redis, backend=Redis)
- [ ] `crawler/scheduler.py` — beat schedule (nightly crawl per portal, post-crawl match trigger)

---

## Phase 2 — Crawler Layer (Week 1–2)

### P2.1 — Shared Crawler Utilities
- [ ] `crawler/base.py` — BaseCrawler abstract class (init Playwright, rate-limit, retry logic, debug hook integration)
- [ ] `crawler/normaliser.py` — raw dict → validated Tender Pydantic model; date/currency/UNSPSC parsing

### P2.2 — eTenders Crawler (etenders.gov.za) — First priority
- [ ] `crawler/portals/etenders.py` — Playwright-based crawler
  - Navigate to active tenders listing
  - Paginate through all results
  - Extract: ref_number, title, description, issuing_entity, closing_date, estimated_value, required_docs
  - Handle JS-rendered page (wait for selector before scrape)
  - Rate limit: 3s between pages
  - Debug hook: log every page fetch, parse count, error

### P2.3 — CIDB Crawler
- [ ] `crawler/portals/cidb.py`

### P2.4 — SITA Crawler
- [ ] `crawler/portals/sita.py`

### P2.5 — Eskom Crawler
- [ ] `crawler/portals/eskom.py`

### P2.6 — Municipal Crawlers (Phase 2+)
- [ ] `crawler/portals/municipal/coj.py` — City of Johannesburg
- [ ] `crawler/portals/municipal/ethekwini.py`
- [ ] `crawler/portals/municipal/capetown.py`

---

## Phase 3 — Matcher (Week 2)

### P3.1 — Subscriber Profile Schema
- [ ] `matcher/profiles.py` — SubscriberProfile Pydantic model (service_lines, sectors, geographic_reach, bbbee_level, cidb_grade)

### P3.2 — SA Government Procurement Taxonomy
- [ ] `matcher/taxonomy.py` — UNSPSC codes + MSCM categories mapped to human-readable service domains; lookup functions

### P3.3 — Claude Haiku Scorer
- [ ] `matcher/score.py` — build_match_prompt(), call_haiku(), parse_score()
  - Uses Anthropic API with prompt caching (system prompt + profile cached)
  - Input: Tender + SubscriberProfile
  - Output: { score: 0-100, reason: "one sentence" }
  - Batch scores all (new_tender, active_subscriber) pairs after each crawl

### P3.4 — Digest Builder
- [ ] `matcher/digest.py` — collect matches ≥ 60 per subscriber → format email digest
- [ ] `matcher/email.py` — Resend API integration; sends daily digest

---

## Phase 4 — Proposal Generator (Week 3)

### P4.1 — RAG Retrieval
- [ ] `proposal/rag.py`
  - embed_document(text) → vector using text-embedding model
  - retrieve_context(tender_description, subscriber_id, top_k=5) → list of relevant chunks
  - Uses pgvector cosine similarity query

### P4.2 — Proposal Generator
- [ ] `proposal/generator.py`
  - assemble_prompt(tender, subscriber, retrieved_context) → full prompt string
  - generate_sections(prompt) → Claude Sonnet 4.6 call → structured JSON (one key per proposal section)
  - fill_template(sections, template_path) → python-docx document object
  - export_pdf(docx_path) → WeasyPrint PDF

### P4.3 — Proposal Templates
- [ ] `proposal/templates/data_engineering.docx` — for Astute Insights BI/data tenders
- [ ] `proposal/templates/bi_analytics.docx`
- [ ] `proposal/templates/security_services.docx` — for BlackFire
- [ ] `proposal/templates/ehs_consulting.docx`

### P4.4 — Document Storage
- [ ] `proposal/storage.py` — save_proposal(subscriber_id, tender_id, docx, pdf) → paths; local `uploads/` for dev, S3-compatible for prod

---

## Phase 5 — Form Automation (Week 4)

### P5.1 — Credential Vault
- [ ] `automation/vault.py`
  - encrypt_credential(portal, username, password, subscriber_id) → (ciphertext, nonce)
  - decrypt_credential(portal, subscriber_id) → (username, password)
  - AES-256-GCM; per-tenant key derived from MASTER_SECRET + tenant_uuid

### P5.2 — eTenders Form Filler
- [ ] `automation/portals/etenders.py`
  - login(subscriber_id) → Playwright page with authenticated session
  - navigate_to_tender(tender_ref) → tender submission page
  - fill_form(tender, subscriber_profile) → fills all mandatory fields
  - attach_documents(docx_path, pdf_path)
  - submit() → captures and returns reference number

### P5.3 — Additional Portal Fillers
- [ ] `automation/portals/cidb.py`
- [ ] `automation/portals/eskom.py`

---

## Phase 6 — Web Frontend (Week 3–4)

### P6.1 — Next.js Setup
- [ ] `web/package.json` — Next.js 15, TypeScript, Tailwind v4, NextAuth.js, tRPC client, Stripe.js
- [ ] `web/tsconfig.json`
- [ ] `web/tailwind.config.ts` — (v4 uses CSS @theme — minimal config)
- [ ] `web/src/app/globals.css` — CSS @theme with GovTender design tokens
- [ ] `web/src/app/layout.tsx` — root layout

### P6.2 — Auth
- [ ] `web/src/app/(auth)/login/page.tsx` — email + password login form
- [ ] `web/src/app/(auth)/register/page.tsx` — subscriber registration
- [ ] `web/src/app/(auth)/onboarding/page.tsx` — multi-step wizard (company details, service lines, docs upload)
- [ ] `web/src/lib/auth.ts` — NextAuth config (credentials provider → FastAPI /auth endpoint)

### P6.3 — Dashboard
- [ ] `web/src/app/(dashboard)/layout.tsx` — sidebar nav + auth guard
- [ ] `web/src/app/(dashboard)/tenders/page.tsx` — matched tender list (score, title, entity, closing)
- [ ] `web/src/app/(dashboard)/tenders/[id]/page.tsx` — tender detail + "Generate Proposal" button
- [ ] `web/src/app/(dashboard)/proposals/page.tsx` — proposal list (draft/ready/submitted/awarded/lost)
- [ ] `web/src/app/(dashboard)/proposals/[id]/page.tsx` — proposal detail + download links
- [ ] `web/src/app/(dashboard)/profile/page.tsx` — subscriber profile + document vault
- [ ] `web/src/app/(dashboard)/billing/page.tsx` — Stripe portal embed

### P6.4 — Marketing
- [ ] `web/src/app/(marketing)/page.tsx` — landing page
- [ ] `web/src/app/(marketing)/pricing/page.tsx` — Scout / Respond / Command tiers

---

## Phase 7 — QA & Governance (continuous, per feature)

### P7.1 — Mvavanyi QA Checklist (per shipped feature)
- [ ] Functional test against the golden path
- [ ] Edge cases: empty results, closed tenders, duplicate tenders, failed portal login
- [ ] Auth: unauthenticated request → 401; wrong tier → 403
- [ ] Security: no secrets in responses, SQL injection check on filter params
- [ ] Regression: verify adjacent features still work after each change
- [ ] Debug hook present in all new modules

### P7.2 — Umlindi Governance (pre-deploy)
- [ ] `.env` not in git
- [ ] `.env.example` has all keys (empty values)
- [ ] No hardcoded credentials anywhere
- [ ] `DEBUG_MODE=false` in production
- [ ] Session log complete (Goal + Decisions + Work Done + Learnings)
- [ ] Backup-before-change followed for all modified files
- [ ] All new modules are modular and parameterised (no hardcoded portal URLs, tenants, values)

### P7.3 — Mbhali Documentation (post-production, auto-triggered)
- [ ] `docs/guide.md` updated with any new user-facing feature
- [ ] `docs/sttm.md` updated with new test cases
- [ ] `docs/system_architecture.md` updated with schema/API changes

---

## Phase 8 — CI/CD (Week 5)

- [ ] `.github/workflows/ci.yml` — pytest + mypy + ruff + pnpm lint + pnpm typecheck on every PR
- [ ] `.github/workflows/deploy-api.yml` — SSH to Hetzner, pull, restart Gunicorn + Celery on push to main
- [ ] `.github/workflows/deploy-web.yml` — Vercel auto-deploy via GitHub integration

---

## Phase 9 — Pilot Onboarding (Week 6)

- [ ] Seed Astute Insights subscriber profile (service lines, B-BBEE level, sectors)
- [ ] Seed BlackFire subscriber profile (PSIRA grade, CIDB grade, service lines)
- [ ] Upload capability documents for both (company profiles, CVs, certifications)
- [ ] Run first live crawl → verify tenders ingested
- [ ] Run first match pass → verify Astute and BlackFire receive relevant matches
- [ ] Generate first proposal → review quality
- [ ] Fix, tune, repeat

---

## Phase 10 — Public Launch (Week 11–14)

- [ ] Marketing landing page finalized
- [ ] Self-serve onboarding tested with a fresh subscriber account
- [ ] Stripe subscriptions active in production
- [ ] All 3 subscription tiers working end-to-end
- [ ] Referral programme built (unique referral codes, tracked conversions)
- [ ] Monitoring: Hetzner uptime + Celery queue depth alerts

---

## Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Crawl freshness | All portals crawled within 24 hours |
| Match latency | Matches scored within 2 hours of new tenders ingested |
| Proposal generation | < 3 minutes per proposal |
| API response time | < 500ms p95 for dashboard queries |
| Uptime | 99.5% (Hetzner SLA) |
| Data residency | All subscriber data on Hetzner Johannesburg |
| POPIA compliance | No PII shared with third parties; data processed in SA |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Government portal schema changes break crawlers | HIGH | HIGH | Dead-letter queue + alerting; per-portal schema version in config |
| eTenders blocks headless browser | MEDIUM | HIGH | Rotate User-Agent; add randomised delays; fallback to direct HTTP where possible |
| Claude API cost exceeds budget | LOW | MEDIUM | Haiku for classification (cheap); Sonnet only for proposals; prompt caching |
| Stripe ZAR settlement issues | LOW | LOW | Stripe officially supports ZAR; test in test mode before go-live |
| Subscriber portal credential breach | LOW | CRITICAL | AES-256-GCM + per-tenant key; master secret never in DB; Umlindi audit pre-deploy |
| Proposal quality too low to win | MEDIUM | HIGH | RAG retrieval of real company documents; human review before submission; iterate |

---

## Definition of Done (per feature)

A feature is DONE when:
1. Umakhi's code is merged to `main`
2. Mvavanyi's QA returns `"status": "PASS"` (golden path + edge cases)
3. Umlindi's governance audit returns `"verdict": "COMPLIANT"`
4. Mbhali has updated `docs/guide.md`, `docs/sttm.md`, `docs/system_architecture.md`
5. Session log is complete (Goal + Decisions + Work Done + Learnings all filled)
6. No `## ⚠ Session Log Incomplete` warnings in the session log
