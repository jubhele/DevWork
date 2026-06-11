# Session Log — Umlilo Web v3 Design Language (IZILO-W-001)

**Date:** 2026-06-11 · **Branch:** ndlunkulu
**Trigger:** Adopt the look-and-feel of boreholecentral.co.za across website, portal and app, re-expressed entirely in the locked BlackFire brand system. uMlawuli (this session) produces the thinking + detailed agent briefs; cheaper execution agents implement.

## Decisions
- Borehole Central contributes *grammar* only (conversion architecture, motion discipline, trust scaffolding); 100% of visual vocabulary is BlackFire's locked system.
- Signature element: the IZILO band grammar — Diamond Chain = lineage/trust, Chevron Field = process, Triangle Tessellation = capability — replacing their meaningless template pattern SVGs.
- Their 5-step quote wizard → our 4-step Security Assessment wizard with POPIA consent gate. Public submissions require a NEW hardened endpoint (api/enquiries.php stays auth-locked) — specced, not improvised.
- No big-bang: production grafts are section-by-section per brief, portal.php stays live throughout.
- Photography by Claude+Canva from in-situ spec-frames (the placeholders ARE the briefs); no invented faces, no stock smiles.

## Delivered (all new files, design/blackfire/)
1. `IZILO-W-001_web_design_language.md` — master spec: design audit of Borehole Central, full translation table, locked tokens, section register law ("the light system is the dark system's evidence" as layout law), motion budget, 10 hard regression guards, rollout order.
2. `umlilo-web-v3-reference.html` — complete standalone reference implementation: Ignition preloader, sticky nav, cinematic hero, 4-step wizard (validated, esc()-safe), about, 8-discipline services, count-up stats, testimonials, FAQ, 01/02/03 process, CTA banner, footer, WhatsApp FAB. Fully responsive to 360px, reduced-motion compliant, zero console.log, zero inline handlers.
3. `AGENT_BRIEFS/01..05` — website graft (section order + regression guards), public enquiry endpoint (honeypot, IP rate limit w/ transactional idempotent migration, min-time check, consent), portal shell reskin (paint-only), Expo theme module (blocked on Bearer auth as previously decided), Canva photography production (5 briefs, exact ratios/grades/filenames).
4. Logo assets copied into design/ for the standalone reference.

## QA
`sessions/portal_qa_v3_design_20260611_1742.md` — **PASS**, full suite. Regression-guard verification confirms all previously-fixed items intact (SEO head, CSP nonces, rbac transaction, db_user fix, mobile v2.1, enquiries auth). One hygiene note: rotate the PAT shared this session.

## Next
1. Jubhele opens the reference HTML → approve / correct the look.
2. On approval: dispatch AGENT_BRIEF_02 then 01 (endpoint before wizard wiring), then 03; 05 runs in parallel in Canva; 04 stays blocked on Bearer auth.
