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

---

## Revision A — 2026-06-11 (same session, Jubhele review feedback)

**Feedback:** logo not rendering in the standalone review copy; page reads too text-led — needs elegant imagery now, not at Canva delivery. Direction approved.

**Changes (umlilo-web-v3-reference.html only; §7a snapshot taken to `_backups/`):**
1. **Logo fixed** — root cause: relative PNG path breaks outside the repo. Lockup re-encoded to 16.5 KB WebP and embedded as a single base64 data-URI behind a `.bf-logo` class (nav + footer, `role="img"` + aria-label). Production grafts still use the PNG asset per AGENT_BRIEF_01; the embed is reference-file self-containment only.
2. **Spec-frames → scene-frames** — all four photography placeholders replaced with original inline SVG scene art in the locked palette: 01 drone overwatch with amber scan beam over a plant-silhouette perimeter at dusk, isishunka diamond ground band; 02 manned gate at golden hour — lit guard house, raised boom, light-mast cone (presence without drawn faces); 03 control room — monitor wall with Ignition-triangle and yield-line feeds, operator silhouette from behind, amber screen glow; 04 wide dusk gate with geometric response vehicle (ember/gold light bar, headlight throw), left 40% kept compositionally quiet for the headline.
3. Each scene carries a corner `brief-chip` (IMG-BRIEF-01…04) so the Canva production mapping (AGENT_BRIEF_05) survives — photography replaces the inner `<svg>` 1:1 at identical ratios.

**Validation:** all 5 inline SVGs parse as valid XML, unique gradient ids (s1–s4 prefixes), zero residual PNG references, console.log still 0, esc()-guarded innerHTML unchanged, reduced-motion + touch-target rules untouched. QA PASS verdict stands.

---

## Revision B — 2026-06-11 (Jubhele: "real life images")

SVG scene art rejected — real photography required. Sourced 12 real photographs under the
Unsplash License (free commercial use — the same sourcing model Borehole Central itself uses),
each verified to a direct images.unsplash.com CDN URL via page-level harvesting:
hero (mos design — plant lit at night), about (Etienne Girardet — hi-vis officer on patrol walk,
back to camera), FAQ (Lianhao Qu — surveillance camera wall), CTA (Chris LeBoutillier — wide
industrial night), plus all 8 service cards (Collin, Bruno Kelzer, Scott Webb, Milan Malkomes,
Obi, mos design, Jamie Taylor, Glenn Carstens-Peters). Service cards rebuilt image-led with the
IZILO glyph as a corner badge; a coal-grade gradient overlay unifies every photo into the brand
atmosphere; lazy-loading + alt text on all 12. Brief-chips retained — the branded BlackFire/Canva
shoot (AGENT_BRIEF_05 Rev B manifest) replaces each URL 1:1, and AGENT_BRIEF_01 must self-host
WEBP copies in production (no hotlinking from the live domain). §7a snapshot taken pre-change.
Invariants re-verified: 0 console.log, 12/12 lazy+alt, no forbidden strings. QA PASS stands.

---

## Revision C — 2026-06-11 (in-app preview shows no photos)

**Diagnosis from Jubhele's screenshot:** the embedded logo renders but all 12 photos show as
broken — the Claude in-app preview sandboxes the page and blocks external network images
entirely. The file is correct: in any real browser (Chrome) the photography loads. Two fixes:
1. **Resilient fallback (shipped):** image error listeners (no inline handlers) swap any
   blocked/offline photo for a branded frame — Ignition mark, the subject line, and a mono note
   "Photo loads in browser · blocked in this preview". No more broken-icon states anywhere,
   which also hardens production for slow connections.
2. **Permanent fix (ready to run):** `scripts/fetch_v3_images.sh` — server-side one-shot that
   downloads all 12 photos as production-resolution WEBP into `images/v3/`, commits and pushes.
   Once run, the reference gets rebuilt with repo-local/embedded images (in-app preview then
   shows real photography), and production never hotlinks a third-party CDN — which AGENT_BRIEF_01
   already mandates. §7a snapshot taken pre-change.

---

## Revision D — 2026-06-11 (Jubhele: open light, alternate — "calmer, peaceful energy")

Register order inverted per Jubhele's direction. New canonical sequence (IZILO-W-001 §4 updated):
Hero LIGHT (paper gradient, ink display type, light embers, white proof chip) → Wizard DARK
(white card glowing on coal) → About LIGHT → Services DARK → Stats LIGHT (white stat cards,
gold-l values) → Testimonials DARK (Instrument Serif in bone on coal, amber attribution) →
FAQ LIGHT → How-it-works DARK → CTA photograph → Footer DARK. Strict L/D alternation; calm
first, fire when it counts. Nav made light-aware (paper solid state, ink links, paper mobile
drawer); Ignition preloader still opens on coal and resolves into the calm paper hero. §7a
snapshot taken. Invariants hold: 0 console.log, 0 inline handlers, fallback system intact.
