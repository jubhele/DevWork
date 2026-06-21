---
name: project-govtender
description: GovTender — SA government tender intelligence and proposal automation SaaS platform
metadata:
  type: project
---

GovTender crawls all South African government tender portals, scores matches against subscriber capability profiles (Claude Haiku), generates full proposals (Claude Sonnet + RAG), and auto-submits via Playwright.

**Pilot subscribers:** Astute Insights (data engineering / BI tenders) + BlackFire Solutions (security services tenders). Both get Command tier free for pilot validation.

**Why:** SA government is the largest buyer of security and data/BI services. Most SMEs miss tenders because of portal fragmentation and manual proposal overhead.

**Stack:** Python 3.11+ (FastAPI, Celery, Playwright, SQLAlchemy) · PostgreSQL 16 + pgvector + pg_trgm · Redis · Next.js 15 + TypeScript + Tailwind v4 · Hetzner Johannesburg (SA data residency, POPIA)

**Key paths:**
- Architecture: `docs/architecture.md`
- Build plan: `docs/plan.md`
- DB migrations: `shared/db/migrations/`
- Crawlers: `crawler/portals/`
- Matcher: `matcher/score.py` (Claude Haiku 4.5)
- Proposal generator: `proposal/generator.py` (Claude Sonnet 4.6)
- Credential vault: `automation/vault.py` (AES-256-GCM per-tenant)
- Pattern 21 debug hook: `api/debug.py`

**Why:** Standalone module first; integrates with BlackFire portal (bf_quotes, bf_clients, bf_attachments) post-launch via webhook.

**How to apply:** All new code must be modular, use Pattern 21 debug hook, follow Umlindi governance rules, and be QA'd by Mvavanyi before merge.
