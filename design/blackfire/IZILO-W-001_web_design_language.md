# IZILO-W-001 — Umlilo Web Design Language v3
## "Thermal Geometry, Cinematic"

**Status:** Specification — approved reference implementation at `umlilo-web-v3-reference.html`
**Date:** 2026-06-11
**Author:** uMlawuli (design authority). Execution delegated to agents per `AGENT_BRIEFS/`.
**Scope:** Public website, Umlilo Portal shell, mobile app (Expo RN).

---

## 1. Brief

Adopt the structural and experiential DNA of boreholecentral.co.za — a premium
agency-grade marketing site — and re-express it entirely in the locked BlackFire
brand system. We borrow their *grammar* (cinematic hero, multi-step lead wizard,
trust scaffolding, motion discipline, documentary photography). We replace their
*vocabulary* wholesale with ours (Thermal Geometry palette, Big Shoulders /
Instrument Sans / IBM Plex Mono, IZILO-G-001 Zulu Geometric Ancestry).

Nothing from Borehole Central's visual identity survives the translation.
What survives is the conversion architecture.

## 2. What we observed at Borehole Central (design audit)

1. **Preloader** — percentage counter on page load.
2. **Cinematic hero** — eyebrow label → oversized display headline → supporting
   paragraph → CTA, with a large documentary photo, a floating social-proof chip
   (client avatars + "500+ boreholes drilled"), decorative pattern behind, and a
   scroll-down cue.
3. **Sticky nav** with light/dark logo swap (transparent over hero → solid on
   scroll), off-canvas contact drawer, persistent right-side CTA button.
4. **Multi-step quote wizard on the homepage** — 5 steps, numbered progress,
   "Step 1 of 5: Contact". The single highest-value pattern on the page: it turns
   the homepage itself into the lead funnel.
5. **Eyebrow + statement-heading rhythm** on every section ("Our Services" →
   "Everything You Need for a Reliable Borehole.") — headings end with a period.
6. **Floating proof badges** on photos ("15+ Years Delivering Clean Water").
7. **Service card marquee** — image-led cards in an infinite drift.
8. **Animated count-up stats band** (00+ → 500+).
9. **Testimonial slider** — anonymous-but-specific attribution (role + province).
10. **FAQ accordion** beside a photo and a "Call us" CTA.
11. **Numbered How-It-Works (01/02/03)** — a true sequence, copy-rich.
12. **Full-bleed photo CTA banner** ("Your Borehole, Done Right.").
13. **Rich footer** — brand blurb, two link columns, newsletter, patterns.
14. **WhatsApp floating action button** with a pre-filled message.
15. **Decorative pattern shapes** scattered between sections (their weakest move:
    generic template SVGs that mean nothing).

## 3. The translation table

| Borehole Central element | BlackFire translation | Why it is ours, not theirs |
|---|---|---|
| % preloader | **IGNITION preloader** — Ignition triangle (▲, Ember Red) fills bottom-up while an IBM Plex Mono counter runs 0→100%. ≤1.2 s, skipped entirely under `prefers-reduced-motion`. | The brand's first principle staged as a moment: fire, ignited, then taught to behave. |
| Generic pattern SVGs | **IZILO band grammar** — section transitions are marked by the three named tessellation bands from IZILO-G-001, each with a fixed semantic role: **Diamond Chain (isishunka)** = lineage/trust sections (about, testimonials, footer). **Chevron Field** = process/progress (wizard, how-it-works). **Triangle Tessellation** = capability/force (services, stats). | Structure encodes meaning. The ubuhlalu foundation moves from the brand book into the interface itself. |
| Hero headline (sentence case, friendly) | **SECURITY ENGINEERED TO PROTECT.** in Big Shoulders Display, uppercase, tight leading; "ENGINEERED" in Fire Orange, "PROTECT." in Ember Red. | Locked positioning line — already the OG title. We stage it, we don't replace it. |
| Avatar cluster + drilled count | **Proof chip:** mono count-up `500+` + `ACTIVE CLIENTS NATIONWIDE`, ember pulse dot. No stock avatars — we don't fake faces. | Honesty rule: no invented people. |
| 5-step quote wizard | **4-step Security Assessment wizard:** 01 Contact → 02 Site → 03 Requirements → 04 Review. Chevron Field segments fill Fire Orange as steps complete. Mono counter `01 / 04`. Posts to a **new public endpoint** (see AGENT_BRIEF_02 — the existing `api/enquiries.php` is auth-locked and stays that way). | Same funnel mechanics; our process, our disciplines, our compliance posture (POPIA consent line at step 04). |
| "15+ Years" photo badge | Floating mono badge `10+ / YEARS PROTECTING` on the About photo; `PSIRA REGISTERED` tab on its frame. | Claims that are true and verifiable. |
| Star ratings | Omitted on dark sections; one ratings row in About only. We are an industrial security firm, not an e-commerce listing — proof is PSIRA, AECI-grade sites, response times. | Restraint is the brand. |
| Testimonials | Instrument Serif pull-quotes (the serif's only appearance), attributed by role + sector + region: "Facilities Manager — Chemical Manufacturing, Kempton Park". | Specific, anonymous, credible. Mirrors the AECI relationship without naming the client. |
| 01/02/03 How-It-Works | Kept verbatim as a device — it is a true sequence: **01 Assessment → 02 Proposal → 03 Deployment.** Numbers in IBM Plex Mono. | Numbering is justified only because order carries information. |
| Photo CTA banner | Full-bleed photograph under a Coal #0A0E19 85%→40% gradient: **"Your site. Secured properly."** | Their sign-off cadence, our voice. |
| WhatsApp FAB | Kept. Pre-filled: "Hi BlackFire Solutions — I'd like to request a security assessment." Wired to +27 68 912 6581. | It demonstrably converts in the SA market. |

## 4. Tokens (locked — no deviation permitted)

**Dark (default, cinematic register):** Coal #0A0E19 ground · Navy #141B26 surface ·
Charcoal #1E2530 elevated · Steel Dark #2B3340 borders · Ash #7A8699 muted ·
Steel #A8B2BE secondary text · Bone #E0E4EA text.
**Light ("the evidence" register):** Bone paper #F5F1EA · warm paper #EDE8DE ·
cream #E4DED2 · graphite #C8C1B3 dividers · ink #1A1814 text.
**Embers dark:** #C0392B / #E05A1A / #F07820 / #F5A623.
**Embers light (deepened):** #A82A1E / #C94A10 / #E06A1A / #D48A15.

**Type:** Big Shoulders Display (display, 700–900, uppercase, tracking −0.5 to +1%) ·
Instrument Sans (body/UI) · IBM Plex Mono (data: stats, step counters, eyebrows,
badges, PSIRA reg) · Instrument Serif (testimonial pull-quotes ONLY).

**Section register rule (the structural thesis — Rev D, set by Jubhele):**
the page OPENS in the light register and alternates strictly: Hero (L) →
Wizard (D, white card glowing on coal) → About (L) → Services (D) → Stats (L) →
Testimonials (D, serif on coal) → FAQ (L) → How-it-works (D) → CTA (photograph)
→ Footer (D). Calm first; fire when it counts. The Ignition preloader still
opens on coal and resolves into the calm paper hero — fire, taught to behave.
*"The light system is the dark system's evidence"* — the evidence now leads.

## 5. Motion budget

- Ignition preloader: once per session (sessionStorage flag), ≤1.2 s.
- Scroll reveals: 12 px rise + fade, 500 ms, 60 ms stagger, IntersectionObserver.
- Count-up stats: 1.4 s ease-out, triggered at 40% visibility, runs once.
- IZILO band drift: 60 s linear loop, pauses on hover.
- Ember underline on cards/links: scaleX 0→1 left-to-right, 280 ms.
- Nav: transparent → Coal at 64 px scroll; logo swaps to on-dark variant.
- ALL motion gated behind `@media (prefers-reduced-motion: reduce)` → disabled.

## 6. Signature

One signature, spent in one place: **the IZILO band grammar.** Everything else
stays quiet and disciplined. No parallax, no tilt cards, no gradient meshes,
no glassmorphism.

## 7. Photography system (→ AGENT_BRIEF_05 for Canva production)

All photography is documentary, dusk-or-night biased, ember-lit, South African
industrial. No stock-smile imagery, no faces of invented clients, no watermark
stock. Frames carry a 2 px Steel Dark border and a corner band in the section's
IZILO pattern. Until photography is produced, the reference implementation
renders **spec-frames**: correctly sized placeholder frames that display the
image brief in situ (ID, subject, ratio) so the layout is reviewable today and
Canva output drops in without reflow.

## 8. Hard constraints (regression guards — non-negotiable)

These have all been fixed before. Any agent that regresses one fails QA:

1. CSP with nonces stays intact in `portal.php` — all new inline `<style>`/`<script>` grafts MUST carry `nonce="<?= $cspNonce ?>"`, or live in portal.css/portal.js.
2. All dynamic `innerHTML` passes through `esc()`. Zero exceptions.
3. Zero `console.log` in shipped JS.
4. Touch targets ≥ 44 px; responsive to 360 px; hamburger drawer preserved.
5. The SEO head block (meta, OG, Twitter, JSON-LD), `robots.txt`, `sitemap.xml` are preserved byte-for-byte unless the change is additive.
6. No secrets, tokens, or credentials in any committed file; `db_user` stays env/secrets-driven (no hardcoded fallback).
7. `api/enquiries.php` keeps `require_auth()`. Public submissions go ONLY through the new rate-limited public endpoint (AGENT_BRIEF_02).
8. `_backups/` snapshot of every existing file BEFORE modification (constitution §7a).
9. Naming: "Umlilo Portal", "BlackFire Solutions", "BLKFR". Never "BFS". No "demo"/"TEST"/"sample" strings in UI.
10. `portal.php` stays live throughout — section-by-section grafts, no big-bang rewrite.

## 9. Rollout order

1. **Website** (AGENT_BRIEF_01 + 02) — graft v3 sections into portal.php/css/js; ship public enquiry endpoint.
2. **Portal shell** (AGENT_BRIEF_03) — reskin login + app chrome to v3; zero behavioural change.
3. **App** (AGENT_BRIEF_04) — Expo RN theme module; blocked on Bearer-token auth backend work as previously decided.
4. **Photography** (AGENT_BRIEF_05) — Canva production from spec-frames; drop-in replacement.

Every brief ends with the same exit gate: the morning QA suite
(PHP safety / JS & CSS / SQL / brand compliance / §7a backups) must return PASS.
