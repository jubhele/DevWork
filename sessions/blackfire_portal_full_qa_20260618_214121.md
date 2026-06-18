# Session: BlackFire portal full QA
Date: 2026-06-18
Provider: OpenAI Codex
Model: GPT-5

## Goal
Reproduce and fix the reported public-site image overlap, dead service-image navigation, and non-functional FAQ navigation, then perform a systematic visual, interaction, responsive, accessibility, and portal smoke-test pass with browser evidence.

## Model Recommendation
Task tier: 3-Complex
Recommended model: GPT-5 reasoning  Trust score: 9/10
Active model: GPT-5  Status: correct

## Decisions
- Stopped before source edits when the initial worktree was dirty; the user committed all existing work and QA resumed on a clean branch.
- Treated `localhost:8080` as the authoritative PHP website/portal surface shown in the screenshots and also tested the running Umlilo Next.js app on `localhost:3000`.
- Repaired the single-scroll navigation path instead of restoring obsolete `pub-services` page behavior.
- Standardised the advertised service count at 50 because the eight category totals and rendered catalogue contain exactly 50 named services; no services were invented to reach 55.
- Made Umlilo service cards lead to the assessment workflow and preselect the corresponding requirement.
- Preserved strict CSP behavior; final rendered PHP checks found no inline event handlers and no console CSP violations.

## Work Done
- Browser-reproduced 10 functional, visual, content, accessibility, and routing issues with 30 screenshots.
- Fixed PHP category filtering, FAQ anchor drift, service image geometry, mobile navigation, floating-control overlap, CTA overflow, control semantics, and service-count copy.
- Fixed Umlilo public-asset proxy routing, restored the header/footer logo, linked all eight service cards to assessment, and aligned service-count copy.
- Added `umlilo-portal/apps/web/scripts/check-public-assets.mjs` regression coverage.
- Verified 48/48 PHP files, portal JavaScript syntax, 11 internal Umlilo links across 9 routes, TypeScript production build, browser console/network health, desktop/mobile layouts, theme persistence, FAQ accordion, assessment validation, and unauthenticated portal boundaries.
- QA report: `.gstack/qa-reports/qa-report-localhost-8080-2026-06-18.md`; health score improved from 70 to 98.

## Blockers / Next Steps
- No functional blocker remains.
- Credentialed role workflows and write actions were intentionally not exercised because no test account was supplied.
- Existing low-severity warning: Next.js ESLint flags the current custom-font loading approach in `apps/web/src/app/layout.tsx`; build still passes with zero errors.

## Learnings
- The public PHP site is now single-scroll, but legacy `pubNav()` still exists for old page-state flows; category controls must not call it.
- Missing reserved geometry on lazy images can make hash navigation appear dead even when the hash changes correctly.
- Next.js `public/` assets are served from root paths, so excluding only `/public/` in auth middleware does not protect them from interception.
- A route-link source scan can pass while an image URL returns HTML with status 200; browser image decoding (`naturalWidth`) is required.
