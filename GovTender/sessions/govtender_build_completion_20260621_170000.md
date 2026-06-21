# Session: GovTender — Build Completion Pass
Date: 2026-06-21
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Complete all files listed as missing in the GovTender plan audit. The project had a skeleton in place (FastAPI, DB migrations, crawler base, matcher, proposal generator, vault, partial web UI) but was missing 25+ files before it could be run end-to-end. This session closed every open gap in Phases 0–6.

## Model Recommendation
Task tier: 2-Medium (multi-file build with pattern-matching)
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: Sonnet 4.6  Status: correct

## Decisions
- SQLAlchemy ORM models use mapped_column / Mapped[] (SQLAlchemy 2.0 style) to stay consistent with the async engine already in api/db.py
- pgvector embedding column intentionally omitted from models.py — pgvector ORM dep avoided; column exists in SQL migration 004 and is queried raw via rag.py
- Municipal crawlers use httpx (not Playwright) — their portals are static HTML; saves browser overhead and improves crawl speed
- taxonomy.py includes a bonus score function (0-20) to supplement Haiku AI scoring for cold-start (new subscribers with no match history)
- storage.py wraps local filesystem with URL-style methods so the swap to S3 is isolated to one file
- Automation scripts use broad CSS selectors (not portal-specific selectors) because portal UIs change frequently; the selectors are intentionally resilient over brittle
- Web pages follow the existing auth/login + dashboard/tenders pattern (no Next.js route groups) for consistency
- Onboarding uses localStorage gt_token (same as login) — no NextAuth for MVP; can be upgraded post-pilot
- Proposal detail page polls every 3 seconds while status is 'draft' to show generation progress without a websocket
- Pricing page built as a standalone /pricing route (not a section of the landing page) to support SEO
- Sibali and Mlawuli system prompts written with GovTender-specific routing rules so they can be used as LLM system prompts directly

## Work Done
- `shared/types/models.py` — SQLAlchemy 2.0 ORM models for all 7 tables + ai_usage
- `shared/db/alembic.ini` — Alembic config reading DATABASE_URL from env
- `shared/db/migrations/009_ai_usage.sql` — ai_usage table with ZAR cost column
- `matcher/profiles.py` — SubscriberProfile Pydantic model with to_prompt_text()
- `matcher/taxonomy.py` — UNSPSC/MSCM → service domain mappings + bonus scorer
- `proposal/storage.py` — local filesystem storage abstraction (S3-ready)
- `crawler/portals/eskom.py` — Playwright crawler for Eskom Supplier Zone
- `crawler/portals/municipal/__init__.py`
- `crawler/portals/municipal/coj.py` — httpx + BS4 CoJ crawler
- `crawler/portals/municipal/ethekwini.py` — httpx + BS4 eThekwini crawler
- `crawler/portals/municipal/capetown.py` — httpx + BS4 Cape Town crawler
- `automation/portals/etenders.py` — Playwright form-fill + submit for eTenders
- `automation/portals/cidb.py` — Playwright form-fill for CIDB
- `automation/portals/eskom.py` — Playwright form-fill for Eskom Supplier Zone
- `docker-compose.dev.yml` — dev overrides (hot-reload, Flower, verbose logging)
- `scripts/db-init.sh` — runs all migrations in order
- `scripts/reset-db.sh` — drop + recreate + re-migrate
- `agents/sibali_system_prompt.md` — cost governance agent (GovTender-specific)
- `agents/mlawuli_system_prompt.md` — supervisor agent with routing table
- `web/src/app/auth/register/page.tsx` — registration form
- `web/src/app/auth/onboarding/page.tsx` — 3-step wizard (details, capabilities, docs)
- `web/src/app/dashboard/tenders/[id]/page.tsx` — tender detail + generate button
- `web/src/app/dashboard/proposals/[id]/page.tsx` — proposal status + download + outcome
- `web/src/app/dashboard/profile/page.tsx` — profile edit + document vault
- `web/src/app/dashboard/billing/page.tsx` — plan info + Stripe portal link
- `web/src/app/pricing/page.tsx` — full pricing page with FAQ
- `web/src/app/page.tsx` — corrected pricing card features to match §9

## Blockers / Next Steps
- Portal selectors in automation/portals/*.py are best-guess from portal structure knowledge — MUST be verified against live portals before Command tier auto-submit goes live; run manual Playwright tests first
- Municipal crawlers need live testing — CSS selectors are educated guesses based on typical Drupal/SharePoint municipal portal structures; expect selector adjustments
- api/proposals.py needs two new endpoints: POST /{id}/submit and POST /{id}/outcome (billing/profile.tsx calls these; they don't exist yet)
- api/billing.py (POST /billing/portal — Stripe Customer Portal session) needs to be created
- No GitHub Actions CI/CD workflows yet (Phase 8 in plan.md)
- Proposal .docx templates (4 × .docx files) not created — generator.py falls back to a blank Document() if the template file is missing; this is safe but produces unstyled output
- Eskom crawler portal URL may be wrong — eskomsupplierzone.com is the assumed URL; verify before first crawl run

## Learnings
- SA municipal portals (CoJ, eThekwini, Cape Town) vary significantly in structure — use httpx not Playwright for them (faster, less fragile), but expect per-portal selector tuning after first live crawl
- Proposal polling at 3s intervals from the frontend is sufficient for MVP; switch to SSE or WebSocket post-pilot if generation latency improves
- SQLAlchemy 2.0 mapped_column style is cleaner for async engines — use it throughout; avoid the old Column() syntax

```json
{
  "session_id": "20260621_170000",
  "agent": "Umakhi",
  "model_endpoint": "claude-sonnet-4-6",
  "token_metrics": { "tokens_in": 0, "tokens_out": 0, "iteration_count": 1 },
  "outcome": { "status": "SUCCESS", "cost_category": "TIER_2_MED" },
  "optimization": { "action_taken": "None" }
}
```
