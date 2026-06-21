# GovTender — Operator Guide

*Maintained by Mbhali. Updated on every production delivery.*

---

## Overview

GovTender monitors South African government tender portals, scores tenders against subscriber profiles, generates proposals, and submits them automatically.

## Running Locally

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Apply DB migrations
cd shared/db && alembic upgrade head

# 3. Start Python API
cd api && uvicorn main:app --reload --port 8000

# 4. Start Celery worker
celery -A crawler.celery_app worker --loglevel=info

# 5. Start Next.js frontend
cd web && pnpm dev
```

## Triggering a Manual Crawl

```bash
# Trigger single portal crawl
celery -A crawler.celery_app call crawler.portals.etenders.crawl_etenders

# Trigger full nightly run
celery -A crawler.celery_app call crawler.scheduler.run_nightly_crawl
```

## Environment Variables

See `.env.example` for the full list. Copy to `.env` and fill real values.

| Key | Purpose |
|-----|---------|
| `ANTHROPIC_API_KEY` | Required for Haiku matching and Sonnet proposal generation |
| `DB_*` | PostgreSQL connection |
| `REDIS_URL` | Celery broker |
| `VAULT_MASTER_SECRET` | Derives per-tenant credential encryption keys — never log this |
| `RESEND_API_KEY` | Daily digest emails |
| `STRIPE_*` | Subscription billing |
| `DEBUG_MODE` | Set `true` in dev to enable Pattern 21 debug logs |

## Subscription Tiers

| Tier | Plan ID in Stripe | Features |
|------|------------------|----------|
| Scout | `STRIPE_PRICE_SCOUT` | Digest alerts only, 3 sectors |
| Respond | `STRIPE_PRICE_RESPOND` | 20 proposals/mo, 5 sectors, 3 portals auto-submit |
| Command | `STRIPE_PRICE_COMMAND` | Unlimited, all sectors + portals |

## Adding a New Portal Crawler

1. Create `crawler/portals/<portal_name>.py` inheriting `BaseCrawler`
2. Implement `crawl()` → yields raw dicts
3. Pass raw dicts through `Normaliser.normalize()` → `Tender` Pydantic model
4. Register a Celery task in `crawler/scheduler.py`
5. Add portal name to the `source_portal` enum in `shared/types/schemas.py`

## Debugging

Enable `DEBUG_MODE=true` in `.env`. Debug logs write to `sessions/debug_<TASK_ID>.log`.

Pattern 21 log levels:
- `CRAWL_*` — crawler state (page fetches, parse counts, errors)
- `DB_*` — database write operations
- `API_CALL` — LLM API calls (model, token counts)
- `VAULT_*` — credential encrypt/decrypt operations
- `SUBMIT_*` — form automation state
