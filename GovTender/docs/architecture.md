# GovTender — Architecture Document

**Version:** 0.1  
**Date:** 2026-06-21  
**Status:** Active  

---

## 1. Purpose

GovTender is a South African government tender intelligence and proposal automation platform. It monitors all government tender portals continuously, scores tenders against a subscriber's capability profile, drafts complete proposals, and submits them automatically. It ships as a standalone multi-tenant SaaS product — with a future integration hook back into the BlackFire/Astute portal.

---

## 2. System Overview

```
┌───────────────────────────────────────────────────────────────────────┐
│                           GOVTENDER PLATFORM                         │
│                                                                       │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────────────────┐ │
│  │  CRAWLERS   │───▶│  NORMALISER  │───▶│  PostgreSQL              │ │
│  │  (Python +  │    │  (unified    │    │  tenders + subscribers   │ │
│  │  Playwright │    │   schema)    │    │  proposals + embeddings  │ │
│  │  + Scrapy)  │    └──────────────┘    │  (pg_trgm + pgvector)   │ │
│  └─────────────┘                        └───────────┬──────────────┘ │
│        │                                            │                 │
│   Celery + Redis                                    │                 │
│   (nightly schedule)                                ▼                 │
│                                          ┌──────────────────────────┐ │
│  ┌─────────────┐    ┌──────────────┐    │  MATCHER                 │ │
│  │  PROPOSAL   │◀───│  SUBSCRIBER  │    │  Claude Haiku 4.5        │ │
│  │  GENERATOR  │    │  PROFILES    │    │  scores 0-100 + reason   │ │
│  │  Claude     │    │  + RAG       │    └───────────┬──────────────┘ │
│  │  Sonnet 4.6 │    │  (pgvector)  │                │                 │
│  └──────┬──────┘    └──────────────┘                ▼                 │
│         │                                  ┌──────────────────────┐  │
│         ▼                                  │  DIGEST EMAIL        │  │
│  ┌─────────────┐                           │  (Resend)            │  │
│  │  python-docx│                           └──────────────────────┘  │
│  │  WeasyPrint │                                                       │
│  │  (.docx PDF)│                                                       │
│  └──────┬──────┘                                                       │
│         │                                                              │
│         ▼                                                              │
│  ┌─────────────┐    ┌──────────────────────────────────────────────┐  │
│  │  AUTOMATION │    │  FastAPI BACKEND (Python)                    │  │
│  │  Playwright │    │  /tenders  /proposals  /subscribers          │  │
│  │  form-fill  │    │  /webhooks (Stripe)                          │  │
│  └─────────────┘    └──────────────────┬───────────────────────────┘  │
│                                        │                               │
│                                        ▼                               │
│                      ┌─────────────────────────────────────────────┐  │
│                      │  Next.js 15 WEB APP (TypeScript/Tailwind v4)│  │
│                      │  (marketing) (auth) (dashboard)             │  │
│                      │  Vercel-hosted                              │  │
│                      └─────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 3. Components

### 3.1 Crawler Layer

**Location:** `crawler/`  
**Language:** Python 3.11+  
**Libraries:** Playwright (async), BeautifulSoup4, lxml, Scrapy, httpx  

| Portal type | Tool | Why |
|-------------|------|-----|
| JS-rendered (eTenders, Eskom) | Playwright | SPAs need a real browser |
| Static HTML | BeautifulSoup + lxml | Fast, no browser overhead |
| Structured / paginated | Scrapy | Rate limiting, retry, pipelines built-in |

**Scheduler:** Celery + Redis. Each portal has a registered Celery task running on a nightly cron. Failed tasks go to a dead-letter queue for manual review.

**Portal coverage (in build order):**
1. `etenders.py` — etenders.gov.za (national, largest volume)
2. `cidb.py` — cidb.org.za (construction + infrastructure)
3. `sita.py` — sita.co.za (ICT tenders)
4. `eskom.py` — Eskom supplier portal
5. `transnet.py` — Transnet procurement
6. `ranwater.py` — Rand Water
7. `sanral.py` — SANRAL
8. `municipal/coj.py` — City of Johannesburg
9. `municipal/ethekwini.py` — eThekwini Municipality
10. `municipal/capetown.py` — City of Cape Town
11. *(provincial portals — Phase 2)*

**Crawl frequency:** Nightly (00:00–03:00 SAST). Emergency re-crawl can be triggered via API.

---

### 3.2 Normaliser

**Location:** `crawler/normaliser.py`  

Converts raw scraped data into the unified `Tender` schema before DB insert. Handles:
- Date parsing (multiple SA government date formats)
- Currency parsing (R and ZAR prefixes, commas vs dots)
- UNSPSC / MSCM code extraction from tender descriptions
- B-BBEE level extraction from requirements text
- CIDB grading extraction
- Deduplication check (by tender number + issuing entity)

---

### 3.3 Matcher

**Location:** `matcher/`  
**Model:** Claude Haiku 4.5 (cheap + fast for high volume)  

Each nightly crawl run triggers a matching pass against all active subscriber profiles.

**Process:**
1. Load unscored tenders (new since last run)
2. For each tender × subscriber pair, build a prompt:
   - Tender: title, description, estimated value, requirements
   - Subscriber: service lines, sectors, geographic reach, B-BBEE level, CIDB grade
3. Haiku returns: `{ score: 0-100, reason: "one sentence" }`
4. Score + reason stored in `tender_matches` table
5. Scores ≥ 60 included in the next digest

**Prompt caching:** System prompt + subscriber profile cached via Anthropic API cache. Cuts token cost ~80% on repeated tender evaluations against the same profile.

---

### 3.4 Proposal Generator

**Location:** `proposal/`  
**Model:** Claude Sonnet 4.6  

**RAG retrieval (`rag.py`):**
- Subscriber's uploaded documents (company profile, CVs, certifications, past projects) chunked and embedded at upload time (text-embedding-3-small via OpenAI or Claude's embedding endpoint)
- Stored in `subscriber_documents` table with pgvector column
- At proposal time: retrieve top-K chunks by cosine similarity to tender description
- Retrieved context injected into the generation prompt

**Generation (`generator.py`):**
- Assembles full prompt: tender scope + retrieved subscriber context + template instructions
- Calls Claude Sonnet 4.6; response is structured JSON with one field per proposal section
- python-docx fills the .docx base template with generated sections
- WeasyPrint converts to PDF
- Both files saved to object storage (local `uploads/` for MVP; S3-compatible later)

**Templates (`templates/`):**
- `data_engineering.docx` — for Astute Insights BI / data pipeline tenders
- `bi_analytics.docx` — dashboards, reporting, analytics platforms
- `security_services.docx` — for BlackFire guarding / CCTV / access control
- `ehs_consulting.docx` — OHS, safety file, compliance tenders

---

### 3.5 Form Automation

**Location:** `automation/`  
**Library:** Playwright (Python async)  

Per-portal Playwright scripts that:
1. Load subscriber credentials from the encrypted vault (`vault.py`)
2. Navigate to the specific tender on the portal
3. Fill all mandatory fields using extracted tender + subscriber data
4. Attach generated documents
5. Submit; capture and store the reference number
6. Emit a `submission_completed` event (triggers notification email)

**Credential vault (`vault.py`):**
- Each subscriber's portal credentials encrypted with AES-256-GCM
- Per-tenant encryption key derived from master secret + tenant UUID
- Master secret in environment only — never stored in DB

---

### 3.6 API Backend

**Location:** `api/`  
**Framework:** FastAPI (Python)  
**Auth:** JWT (issued at login; verified on every request)  

| Route group | Endpoints |
|-------------|-----------|
| `GET /tenders` | Paginated tender list for subscriber; filter by score, sector, status |
| `GET /tenders/{id}` | Single tender detail + match reason |
| `POST /proposals/generate` | Trigger proposal generation for a tender |
| `GET /proposals/{id}` | Proposal status + download URLs |
| `GET/PUT /subscribers/profile` | Read/update subscriber profile |
| `POST /subscribers/documents` | Upload capability document (triggers embedding) |
| `POST /webhooks/stripe` | Stripe subscription lifecycle events |
| `GET /health` | Liveness + readiness probe |

**CORS:** Configured for Vercel production + preview domains + localhost:3000.

---

### 3.7 Web Frontend

**Location:** `web/`  
**Framework:** Next.js 15 (App Router), TypeScript, Tailwind v4  
**Hosting:** Vercel  

**Route groups:**

| Group | Routes | Description |
|-------|--------|-------------|
| `(marketing)` | `/`, `/pricing`, `/about` | Public landing and pricing |
| `(auth)` | `/login`, `/register`, `/onboarding` | Auth + multi-step onboarding wizard |
| `(dashboard)` | `/tenders`, `/proposals`, `/profile`, `/billing` | Authenticated subscriber views |

**Auth:** NextAuth.js with credentials provider (email + password). JWT session stored in HttpOnly cookie.

**API communication:** tRPC client calls FastAPI backend. Type-safe end-to-end via shared Pydantic → TypeScript type generation.

**Billing:** Stripe Customer Portal embedded in `/billing`.

---

### 3.8 Database

**Engine:** PostgreSQL 16  
**Extensions:** `pg_trgm` (full-text search), `pgvector` (embeddings), `uuid-ossp` (UUIDs)  
**Migrations:** Alembic  

#### Core tables

```
tenders
  id              UUID PK
  source_portal   TEXT               -- 'etenders' | 'cidb' | 'eskom' | ...
  ref_number      TEXT               -- issuing entity's reference
  title           TEXT
  description     TEXT
  issuing_entity  TEXT
  estimated_value NUMERIC(15,2)
  closing_date    TIMESTAMPTZ
  unspsc_code     TEXT
  cidb_grade      TEXT
  bbbee_level     INTEGER
  geographic_scope TEXT              -- 'national' | 'provincial:GP' | 'municipal:COJ'
  required_docs   JSONB              -- checklist of mandatory documents
  raw_html        TEXT               -- archived raw content
  crawled_at      TIMESTAMPTZ
  UNIQUE (source_portal, ref_number)

subscribers
  id              UUID PK
  email           TEXT UNIQUE
  company_name    TEXT
  csd_number      TEXT
  bbbee_level     INTEGER
  bbbee_expiry    DATE
  cidb_grade      TEXT
  geographic_reach TEXT[]            -- ['national'] or ['GP','KZN']
  service_lines   TEXT[]
  sectors         TEXT[]
  stripe_customer_id TEXT
  plan_tier       TEXT              -- 'scout' | 'respond' | 'command'
  plan_active     BOOLEAN
  created_at      TIMESTAMPTZ

subscriber_documents
  id              UUID PK
  subscriber_id   UUID FK → subscribers
  filename        TEXT
  doc_type        TEXT              -- 'company_profile' | 'cv' | 'certificate' | 'rate_card'
  content_chunk   TEXT              -- one chunk per row
  embedding       vector(1536)
  created_at      TIMESTAMPTZ

tender_matches
  id              UUID PK
  tender_id       UUID FK → tenders
  subscriber_id   UUID FK → subscribers
  score           INTEGER           -- 0-100
  reason          TEXT
  included_in_digest BOOLEAN
  scored_at       TIMESTAMPTZ
  UNIQUE (tender_id, subscriber_id)

proposals
  id              UUID PK
  tender_id       UUID FK → tenders
  subscriber_id   UUID FK → subscribers
  status          TEXT              -- 'draft' | 'ready' | 'submitted' | 'awarded' | 'not_awarded'
  docx_path       TEXT
  pdf_path        TEXT
  submission_ref  TEXT              -- reference number from portal
  submitted_at    TIMESTAMPTZ
  created_at      TIMESTAMPTZ

portal_credentials
  id              UUID PK
  subscriber_id   UUID FK → subscribers
  portal          TEXT              -- 'etenders' | 'cidb' | 'eskom' | ...
  username_enc    TEXT              -- AES-256-GCM encrypted
  password_enc    TEXT              -- AES-256-GCM encrypted
  nonce           TEXT
```

---

## 4. Data Flow: Full Tender Lifecycle

```
1. CRAWL          Celery task runs nightly → Playwright fetches portal page
                  → BeautifulSoup parses → Normaliser maps to Tender schema
                  → INSERT INTO tenders (ON CONFLICT DO NOTHING for dedup)

2. MATCH          Celery triggers matching pass after crawl completes
                  → For each new tender × each active subscriber:
                     → Build prompt (tender + profile)
                     → Claude Haiku scores 0-100 + one-line reason
                     → INSERT INTO tender_matches
                  → Collect matches ≥ 60 for each subscriber → send digest

3. ALERT          Resend email: "N new tenders matched your profile"
                  Subscriber opens dashboard → /tenders filtered by today

4. GENERATE       Subscriber clicks "Generate Proposal" on a tender
                  → POST /proposals/generate
                  → rag.py retrieves top-K subscriber doc chunks (pgvector cosine sim)
                  → generator.py: prompt = tender + retrieved context + template instructions
                  → Claude Sonnet 4.6 returns structured JSON (one field per section)
                  → python-docx fills template → WeasyPrint exports PDF
                  → Proposal record created with status='ready'
                  → Subscriber notified: "Your proposal is ready to download or submit"

5. SUBMIT         Subscriber clicks "Submit" (or auto-submit if Command tier)
                  → automation/portals/<portal>.py loads credentials from vault
                  → Playwright navigates to tender → fills form → attaches docs
                  → Captures reference number → updates proposal.submission_ref
                  → Status set to 'submitted' → confirmation email sent

6. OUTCOME        Subscriber manually marks 'awarded' or 'not_awarded'
                  (Phase 2: automatic outcome scraping from portals)
                  → Win-rate metric updated on dashboard
```

---

## 5. Infrastructure

### 5.1 Production

| Service | Provider | Spec | Cost/mo |
|---------|----------|------|---------|
| API + Celery workers | Hetzner Cloud (JHB) | CX21 (2 vCPU, 4 GB RAM) | ~R350 |
| Redis (Celery broker) | Hetzner Cloud (JHB) | CX11 (1 vCPU, 2 GB RAM) | ~R200 |
| PostgreSQL | Self-hosted on CX21 or Neon free tier | — | R0–R200 |
| Next.js frontend | Vercel | Hobby → Pro as needed | R0–R400 |
| Object storage (proposals) | Hetzner Object Storage (S3-compatible) | 100 GB | ~R50 |
| Email | Resend | 3 000 emails/mo free | R0 |
| **Total at MVP** | | | **~R600–R1 200/mo** |

### 5.2 Development

- Local Docker Compose: PostgreSQL + Redis + pgAdmin
- Python: workspace venv at `c:\DevWork\.venv`
- Node: pnpm workspaces
- `.env` at project root; mirrored from `c:\DevWork\.env` via sync script

### 5.3 CI/CD

GitHub Actions:
- `ci.yml` — on PR: `pytest`, `mypy`, `ruff`, `pnpm lint`, `pnpm typecheck`
- `deploy-api.yml` — on push to `main`: SSH deploy to Hetzner, restart Gunicorn + Celery
- `deploy-web.yml` — on push to `main`: Vercel build + deploy (automatic via Vercel GitHub integration)

---

## 6. Security

| Concern | Mitigation |
|---------|-----------|
| Subscriber portal credentials | AES-256-GCM, per-tenant key, master secret in env only |
| API authentication | JWT (HS256), 24h expiry, refresh token in HttpOnly cookie |
| SQL injection | SQLAlchemy ORM parameterised queries throughout |
| XSS | Next.js escapes by default; no `dangerouslySetInnerHTML` |
| POPIA compliance | All subscriber data on Hetzner Johannesburg (SA data residency) |
| Secrets in code | All secrets in `.env`; `.env` in `.gitignore`; `.env.example` committed |
| Crawling ethics | Respect `robots.txt`; 2–5s delay between requests; User-Agent identifies GovTender |

---

## 7. Future Integrations

### 7.1 BlackFire / Astute Portal Integration (Phase 4)

When GovTender connects back:

```
GovTender event: proposal.status = 'awarded'
  → POST BlackFire portal /api/webhooks.php
  → Portal creates bf_quotes record
  → Portal creates bf_clients record (government department)
  → Recurring bf_callouts attached to contract
  → Proposal documents stored in bf_attachments
```

### 7.2 Astute Insights App — Tenders Module

The Astute mobile app (Expo) gains a "Tenders" tab:
- Pipeline value (sum of estimated values in active pursuit)
- Active tenders count, proposals submitted count, win rate
- Push notification: "New tender matched — closes in 3 days"

### 7.3 Outcome Intelligence (Phase 3+)

After 12 months of submissions:
- Train a secondary scorer on won vs lost tenders (fine-tune or few-shot)
- Score tenders not just for relevance but for win probability
- Flag tenders where the subscriber has an unfair advantage (prior relationship, niche capability)

---

## 8. Technology Decisions Log

| Decision | Choice | Alternative considered | Reason |
|----------|--------|----------------------|--------|
| Crawler browser | Playwright (Python) | Selenium, Puppeteer | Async, faster, better element selectors |
| AI matching | Claude Haiku 4.5 | GPT-4o-mini | Cost; already in workspace; prompt caching |
| AI proposal | Claude Sonnet 4.6 | GPT-4o | Instruction-following quality; workspace consistency |
| Vector DB | pgvector in PostgreSQL | Pinecone, Weaviate | One less service; sufficient for < 10M vectors |
| Backend framework | FastAPI | Django, Flask | Async-first; auto OpenAPI; Pydantic native |
| Frontend | Next.js 15 | Remix, SvelteKit | Matches existing Astute stack; Vercel deployment |
| Task queue | Celery + Redis | RQ, Dramatiq | Mature; Playwright workers need async; Redis cheap |
| Billing | Stripe | Payfast, Peach Payments | ZAR support; best DX; webhook reliability |
| Email | Resend | SendGrid, Mailgun | Better DX; React Email templates; generous free tier |
| Hosting | Hetzner JHB | AWS, DigitalOcean | SA data residency (POPIA); lowest cost per vCPU |
