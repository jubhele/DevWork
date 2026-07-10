# Session: blackfire power bi shared_foundation
Date: 2026-07-09
Provider: OpenAI Codex
Model: GPT-5

## Goal
Run the shared_foundation session from the PBI queue using docs/pbi-session-briefs/shared-foundation.md and deliver the page or foundation work in a cross-layer pass.

## Goal Status
PENDING

## Decisions
- Use Power BI as the layout reference only.
- Keep this session aligned with the shared queue order and the source brief.
- Treat the relevant Next.js, PHP, and mobile surfaces as the execution targets for this session.

## Work Done

## Blockers / Next Steps
- Next dependency: None; this is the first session.

## Learnings

## Session Brief
- Owner: Umdwebi
- Supporting owners: Umakhi, Umbheki, Mvavanyi, Sibali

## Tasks
- Audit the Power BI tokens and current UI primitives.
- Define shared color, typography, spacing, elevation, and border tokens.
- Build reusable header, KPI card, chart wrapper, and list fallback patterns.
- Define the mobile collapse rules and narrow-width behavior.
- Review the foundation with UX and functional QA.

## Deliverables
- Shared design token spec
- Shared layout primitive spec
- Mobile collapse rules
- QA notes for the foundation

## Done When
- PHP, Next.js, and mobile can all reuse the same visual language.
- The shared primitives are ready for the page sessions.

