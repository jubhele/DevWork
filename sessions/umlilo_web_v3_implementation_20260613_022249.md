# Session: Umlilo Web v3 Implementation (IZILO-W-001)
Date: 2026-06-13
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Implement the complete IZILO-W-001 "Thermal Geometry, Cinematic" v3 design from `design/blackfire/umlilo-web-v3-reference.html` into both the BlackFire PHP portal (`BlackFire/BlackFire Portal/`) and the Umlilo Next.js portal (`umlilo-portal/`). This replaces the old 3-page SPA pub-site with a single-scroll v3 public landing page in the PHP portal, and creates a new public landing page (replacing the `/dashboard` redirect) in the Next.js portal.

## Model Recommendation
Task tier: 3-Complex
Recommended model: claude-opus-4-7  Trust score: 10/10
Active model: claude-sonnet-4-6  Status: slightly under-powered but functional for implementation

## Decisions
- **SPA → single scroll**: Old pub-site had 3 pages (`#pub-home`, `#pub-services`, `#pub-contact`) toggled by JS. V3 is single-scroll. Decision: keep single `#pub-home.pub-page.active` wrapper, put all v3 content inside it, remove other pages. `pubNav('home')` from `doLogout()` still works.
- **CSS scoping**: All v3 pub-site component styles scoped under `#pub-home` selector in portal.css to avoid conflicts with portal shell's `.svc-card`, `.stat`, etc.
- **CSP compliance**: V3 reference has inline `<script>`. Portal uses nonce-based CSP. Decision: append v3 JS to `portal.js` (external, loaded via `'self'`), wrapped in IIFE with `window.__v3PubInit` guard.
- **Legacy mobile nav**: `toggleMobileMenu()` in portal.js references `#pub-mob-nav` with null checks. Kept empty div to satisfy null checks.
- **Nav class naming**: portal.css uses `.v3-solid` (sticky scroll) and `.v3-open` (mobile menu) — not plain `.solid`/`.open` — to avoid colliding with older portal classes.
- **Next.js landing page**: Made `page.tsx` a `'use client'` component with React hooks for all interactive behaviours (ignition, sticky nav, scroll reveals, count-up, wizard, testimonials). CSS in separate `landing.css` scoped under `.v3-landing`.
- **Logo path**: Next.js uses `/blackfire_logo_transparent.png` from `public/` folder.
- **Font upgrade**: Added Instrument Serif (for testimonials/footer tagline) and Big Shoulders Display weight 800; Instrument Sans italic variants.

## Work Done
- `BlackFire/BlackFire Portal/portal.css` — Replaced §PUBLIC SITE CSS (lines 79–292) with complete v3 CSS: IZILO tokens, bands, ignition, nav, hero, wizard, about, services, stats, testimonials, FAQ, how-it-works, CTA, footer, WhatsApp FAB, responsive breakpoints; all scoped under `#pub-home`
- `BlackFire/BlackFire Portal/portal.php` — Updated font link (added Instrument Serif, wt 800, italic variants); replaced nav section with v3 anchor-link nav; replaced entire pub-site content with single-scroll v3 HTML (ignition preloader, v3 topbar, hero, wizard, about, services ×8, stats, testimonials, FAQ, how-it-works, CTA banner, footer, WhatsApp FAB)
- `BlackFire/BlackFire Portal/portal.js` — Appended `v3PubSite()` IIFE: ignition preloader, sticky nav (v3-solid), mobile hamburger (v3-open), scroll reveals (IntersectionObserver), count-up animation, assessment wizard 4-step logic (validate, review, submit), testimonials rotator (3 testimonials, 7s interval), photo fallback handler, newsletter subscribe stub, WhatsApp FAB state sync
- `umlilo-portal/apps/web/src/app/layout.tsx` — Added `preconnect` hints; updated font link to include Instrument Serif + italic Instrument Sans + Big Shoulders Display wt 800
- `umlilo-portal/apps/web/src/app/globals.css` — Expanded `@theme` block with full v3 token set: dark register, light register (paper/cream/ink), all fire palette variants (both dark and light register), `--max-w`
- `umlilo-portal/apps/web/src/app/landing.css` — New file: complete v3 landing page CSS scoped under `.v3-landing`
- `umlilo-portal/apps/web/src/app/page.tsx` — Replaced `redirect('/dashboard')` with full React v3 landing page: client component with ignition, sticky nav, mobile menu, scroll reveals, count-up, wizard (4-step + done state), testimonials, FAQ accordions, how-it-works, CTA, footer with newsletter, WhatsApp FAB

## Blockers / Next Steps
- **Wizard submission**: No backend endpoint yet. Step 5 (submission) is a UX stub — shows success state without posting data. Wire to API when form handler is ready.
- **Newsletter subscribe**: Portal.js and Next.js both have UI-only newsletter subscribe (no API call). Wire when backend ready.
- **Photography**: All images are Unsplash CDN URLs (free commercial license, no attribution required). To be replaced with the branded BlackFire shoot per AGENT_BRIEF_05 when available.
- **CSP nonce audit**: Verify the portal.js IIFE doesn't conflict with existing `pubNav()` function scope (both reference `#pub-home`).
- **Umlilo portal build check**: Run `pnpm build` in `umlilo-portal/` to verify no TypeScript errors in the new `page.tsx`.

## Learnings
- The v3 design introduces a "dual register" (dark coal/navy + light paper/cream) that requires careful CSS variable aliasing — the Tailwind 4 `@theme` tokens use `--color-*` prefix while the reference HTML uses short names like `--coal`.
- CSS class name conflicts between the v3 pub-site components and the portal shell components (`.svc-card`, `.stat`, `.section-title`) are a real problem — always scope pub-site CSS under `#pub-home` or a wrapping class.
- `IntersectionObserver` in a portal.js IIFE must disconnect on state change — otherwise observers accumulate on repeated public/portal transitions. The `window.__v3PubInit` guard prevents the IIFE from re-running, but a future refactor should disconnect observers when the public site is hidden.
- The assessment wizard logic is simpler in vanilla JS than in React because React re-renders clear the form — the `useRef` / `useState` split I used (ref for values, state for display) avoids unnecessary re-renders while keeping the validation logic sharp.

## JSON Metadata
```json
{
  "session_id": "20260613_022249",
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
    "action_taken": "Summarised context"
  }
}
```
_Session ended: 2026-06-13 02:42:09 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-13 02:46:24 (Claude Code / claude-sonnet-4-6)_
