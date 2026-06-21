# Session: GovTender — Foundation Build
Date: 2026-06-21
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Design and build the complete foundational layer of GovTender — a South African government tender
intelligence and proposal automation SaaS platform. Covers both Astute Insights (data engineering / BI)
and BlackFire Solutions (physical security) as pilot Command-tier subscribers. Goal: fully standalone
module that crawls SA government portals, scores tenders with Claude Haiku, generates proposals with
Claude Sonnet, automates form submission with Playwright, and serves a Next.js SaaS dashboard.

## Model Recommendation
Task tier: 3-Complex
Recommended model: Opus 4.7  Trust score: 10/10
Active model: Sonnet 4.6     Status: slightly under-powered for multi-file architecture design, acceptable for execution

## Decisions
- **Phase 1: Python stack choice** — FastAPI + SQLAlchemy 2.x async + Celery + Redis. Matches existing
  Astute Insights stack and enables async-first crawler design.
- **PostgreSQL 16 + pgvector** chosen over separate vector DB (Pinecone/Qdrant) — saves ~R1500/mo infra
  cost; pgvector 1536d is sufficient for RAG retrieval at this subscriber volume.
- **Claude Haiku 4.5 for scoring** — ~0.25c/1000 tokens; scores thousands of (tender, subscriber) pairs
  per night affordably. Sonnet reserved for proposal drafting where quality is critical.
- **Anthropic prompt caching** — system prompt + subscriber profile cached (ephemeral); ~80% token cost
  reduction on repeated Haiku calls for same subscriber.
- **AES-256-GCM with HKDF per-tenant key derivation** — VAULT_MASTER_SECRET never stored in DB;
  unique key per (tenant_id, portal) pair derived at runtime.
- **Playwright async** for eTenders crawler (React-rendered SPA); httpx + BeautifulSoup for CIDB/SITA
  (static HTML). Avoids Playwright overhead where unnecessary.
- **WeasyPrint + LibreOffice headless** for PDF — LibreOffice primary (reliable); WeasyPrint fallback.
- **Staggered Celery beat schedule** — crawlers at 00:00/00:30/01:00, matcher at 03:00, digest at 06:00.
  Avoids hammering portals simultaneously and ensures scoring runs after all crawls complete.
- **Astute Insights incorrectly described** in first plan as "security intelligence company" — corrected
  after reading Next.js app source: data engineering, BI dashboards, Observe·Discern·Illuminate.

## Work Done
### Documentation
- `GovTender/docs/architecture.md` — full system architecture with ASCII diagram and tech decisions
- `GovTender/docs/plan.md` — 10-phase build plan (P0-P10) with agent routing
- `GovTender/docs/system_architecture.md` — Mermaid.js diagrams (flow, ER, state machine, API table)
- `GovTender/docs/guide.md` — operator guide with local run commands and env var reference
- `GovTender/docs/sttm.md` — System Technical Test Manual (T001–T007)

### Constitution & Governance
- `GovTender/CLAUDE.md` — project-scoped constitution
- `GovTender/AGENTS.md`, `.github/copilot-instructions.md`, `.cursor/rules/constitution.mdc` — mirrors
- `GovTender/.env.example`, `.gitignore` — secrets hygiene

### Memory & Sessions
- `GovTender/memory/MEMORY.md`, `memory/project_govtender.md` — project memory seed
- `GovTender/sessions/_template.md` — session log template

### Agents
- `GovTender/agents/sebenza_agents.md` — all 8 Sebenza agents with GovTender-scoped system prompts

### Database
- `shared/db/migrations/001_extensions.sql` → `008_seed_pilot_subscribers.sql` — full schema
  (tenders, subscribers, subscriber_documents with pgvector, tender_matches, proposals, portal_credentials)
  Pilot seed: Astute Insights + BlackFire as Command-tier subscribers

### Python Backend
- `pyproject.toml` — full dependency manifest
- `api/config.py` — pydantic-settings with `database_url` property
- `api/debug.py` — Pattern 21 debug hook (log_debug; off unless DEBUG_MODE=true)
- `api/db.py` — SQLAlchemy async engine + sessionmaker + Base
- `api/main.py` — FastAPI app with CORS, health endpoint, 4 routers
- `api/auth.py` — JWT create/decode, `get_current_subscriber` dependency, `require_tier` factory
- `api/tenders.py` — GET /tenders (filtered by score), GET /tenders/{id}
- `api/proposals.py` — POST /proposals/generate (Respond tier required), GET /proposals/{id}
- `api/subscribers.py` — POST /login, GET/PUT /profile, POST /documents
- `api/webhooks.py` — Stripe subscription lifecycle handler
- `shared/types/schemas.py` — all Pydantic request/response models
- All `__init__.py` files for Python packages

### Crawler Layer
- `crawler/celery_app.py` — Celery app config
- `crawler/scheduler.py` — beat schedule + run_nightly_crawl task
- `crawler/base.py` — BaseCrawler (Playwright async, rate limiting, retries)
- `crawler/normaliser.py` — raw dict → Tender Pydantic model (SA dates, currency, UNSPSC, CIDB, B-BBEE)
- `crawler/portals/etenders.py` — full eTenders crawler (React SPA → Playwright + BeautifulSoup)
- `crawler/portals/cidb.py` — CIDB static HTML crawler (httpx + BeautifulSoup)
- `crawler/portals/sita.py` — SITA static HTML crawler

### Matcher Layer
- `matcher/score.py` — Claude Haiku 4.5 scorer with prompt caching + regex fallback parser
- `matcher/digest.py` — daily digest builder (unscored matches per subscriber)
- `matcher/email.py` — Resend HTML digest email with branded template

### Proposal Layer
- `proposal/rag.py` — embed_and_store (chunk + pgvector INSERT) + retrieve_context (cosine similarity)
- `proposal/generator.py` — Claude Sonnet 4.6 proposal generation with RAG context injection;
  renders .docx (python-docx) + PDF (LibreOffice/WeasyPrint fallback)

### Automation Layer
- `automation/vault.py` — AES-256-GCM per-tenant credential vault with HKDF key derivation

### Infrastructure
- `Dockerfile` — Python 3.11-slim with Playwright Chromium + system deps
- `docker-compose.yml` — PostgreSQL 16 (pgvector), Redis 7, pgAdmin (dev profile), API, worker, beat

### Web Frontend (Next.js 15)
- `web/package.json`, `web/tsconfig.json`, `web/next.config.ts`
- `web/src/app/layout.tsx`, `globals.css` (Tailwind v4 @theme)
- `web/src/app/page.tsx` — marketing landing page with pricing tiers
- `web/src/app/auth/login/page.tsx` — login form
- `web/src/app/dashboard/layout.tsx` — sidebar navigation
- `web/src/app/dashboard/page.tsx` — overview with stat cards
- `web/src/app/dashboard/tenders/page.tsx` — tender list with score filter
- `web/src/app/dashboard/proposals/page.tsx` — proposal tracker

## Blockers / Next Steps
- [ ] `web/src/app/auth/register/page.tsx` — onboarding wizard (5 steps)
- [ ] `web/src/app/dashboard/profile/page.tsx` — profile + document upload
- [ ] `web/src/app/dashboard/billing/page.tsx` — Stripe Customer Portal embed
- [ ] `automation/portals/etenders.py` — Playwright form-fill automation
- [ ] `matcher/profiles.py` — SubscriberProfile Pydantic (clean separation from DB model)
- [ ] `matcher/taxonomy.py` — SA government UNSPSC/MSCM procurement taxonomy
- [ ] `proposal/storage.py` — file storage abstraction (local dev → S3-compatible prod)
- [ ] GitHub Actions CI/CD workflows
- [ ] `shared/db/migrations/009_portal_submission_log.sql` — track submission attempts
- [ ] Playwright install on Dockerfile (already scripted; verify on Linux build)
- [ ] Install and test: `pnpm install` in `web/` and verify Next.js builds

## Learnings
- Astute Insights is a data engineering + BI company — NOT a security company. The BlackFire portal is
  a product they built. Always read the source files (`page.tsx`, `data.ts`) rather than guessing from
  a company name or LinkedIn URL that hit an auth wall.
- pgvector IVFFlat index should be built AFTER bulk insert (not in migration); commented the index
  creation in migration 004 with a note to run post-seed.
- Stagger Celery beat tasks by 30 minutes per portal to reduce concurrent portal load and avoid rate
  limiting. Total crawl window: 3 hours before matcher runs.
- LibreOffice headless is the most reliable docx→PDF converter on Linux; WeasyPrint is a lighter
  fallback when LO is not available.
- Pattern 21 debug hook must be the first import in every module that does meaningful work — even if
  not called yet, having it present makes adding debug calls trivial without restructuring imports.

```json
{
  "session_id": "20260621_080000",
  "agent": "Umakhi",
  "model_endpoint": "claude-sonnet-4-6",
  "token_metrics": {
    "tokens_in": 0,
    "tokens_out": 0,
    "iteration_count": 3
  },
  "outcome": {
    "status": "SUCCESS",
    "cost_category": "TIER_3_HIGH"
  },
  "optimization": {
    "action_taken": "Summarised context mid-session; continued from compaction"
  }
}
```
_Session ended: 2026-06-21 13:03:23 (Claude Code / claude-sonnet-4-6)_
