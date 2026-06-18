# QA Report: BlackFire Website and Portal

| Field | Value |
|-------|-------|
| **Date** | 2026-06-18 |
| **URL** | http://localhost:8080/ |
| **Branch** | chore/workspace-sync-20260618 |
| **Commit** | f63808e |
| **Tier** | Standard |
| **Scope** | PHP public site and unauthenticated portal boundary; Umlilo Next.js web app |
| **Duration** | 72 minutes |
| **Pages/routes visited** | 9 |
| **Screenshots** | 30 |
| **Framework** | PHP with client-side JavaScript; Next.js 16 |

## Baseline Health Score: 70/100

| Category | Score |
|----------|-------|
| Console | 70 |
| Links | 70 |
| Visual | 69 |
| Functional | 55 |
| UX | 62 |
| Performance | 92 |
| Content | 92 |
| Accessibility | 77 |

## Final Health Score: 98/100

| Category | Score |
|----------|-------|
| Console | 100 |
| Links | 100 |
| Visual | 100 |
| Functional | 100 |
| UX | 97 |
| Performance | 97 |
| Content | 100 |
| Accessibility | 97 |

## Issues

### ISSUE-001: FAQ navigation lands inside Services

| Field | Value |
|-------|-------|
| **Severity** | high |
| **Category** | functional / ux |
| **URL** | http://localhost:8080/#faq |

**Description:** Clicking FAQ changes the hash, but the browser remains inside the service gallery. Fifty lazy-loaded service images expand after anchor positioning and move the FAQ section thousands of pixels below the viewport.

**Evidence:** [FAQ result](screenshots/issue-001-faq-result.png)

### ISSUE-002: Service category cards crash the public page

| Field | Value |
|-------|-------|
| **Severity** | high |
| **Category** | functional / console |
| **URL** | http://localhost:8080/#services |

**Description:** A category card calls the retired multi-page `pubNav('services')` flow. It removes the active public page and throws `Cannot read properties of null (reading 'classList')` because `#pub-services` no longer exists. No category filter is applied.

**Evidence:** [Before](screenshots/issue-002-services-before.png) · [Result](screenshots/issue-002-services-after-click.png)

### ISSUE-003: Mobile navigation control is hidden

| Field | Value |
|-------|-------|
| **Severity** | high |
| **Category** | functional / accessibility |
| **URL** | http://localhost:8080/ |

**Description:** A later `.pub-ham-btn { display:none }` rule overrides the responsive rule. Mobile users receive no primary navigation menu.

**Evidence:** [Mobile home](screenshots/mobile-home.png)

### ISSUE-004: Service images cause severe layout shifts

| Field | Value |
|-------|-------|
| **Severity** | medium |
| **Category** | visual / performance |
| **URL** | http://localhost:8080/#services |

**Description:** Rendered markup uses `.svc-img-wrap`, but the stylesheet still treats `.svc-img` as the wrapper. No dimensions are reserved. Desktop document height grows from 9,412px to 16,379px; mobile grew from 18,078px beyond 44,885px while scrolling.

**Evidence:** [Gallery](screenshots/issue-004-service-image-result.png)

### ISSUE-005: Back-to-top overlaps WhatsApp

| Field | Value |
|-------|-------|
| **Severity** | medium |
| **Category** | visual / ux |
| **URL** | http://localhost:8080/ |

**Description:** Both floating controls occupy the lower-right corner, producing the orange-on-green overlap reported by the user.

**Evidence:** [Overlap](screenshots/issue-004-service-image-before.png)

### ISSUE-006: CTA image overflows narrow screens

| Field | Value |
|-------|-------|
| **Severity** | medium |
| **Category** | visual / accessibility |
| **URL** | http://localhost:8080/ |

**Description:** `aspect-ratio:21/8` combined with `min-height:380px` forces the CTA frame to about 998px wide on a narrow viewport. The image brief label is placed off-screen.

**Evidence:** [Narrow viewport](screenshots/issue-003-overlap-small-before.png)

### ISSUE-007: Service count and interaction semantics disagree

| Field | Value |
|-------|-------|
| **Severity** | medium |
| **Category** | content / accessibility |
| **URL** | http://localhost:8080/#services |

**Description:** The site claims 55 services while the eight category totals and rendered catalogue contain 50. Category cards and filter chips are clickable `div` elements without keyboard semantics.

### ISSUE-008: Umlilo header logo returns HTML instead of an image

| Field | Value |
|-------|-------|
| **Severity** | medium |
| **Category** | visual / functional |
| **URL** | http://localhost:3000/ |

**Description:** The authentication proxy intercepted `/blackfire_logo_transparent.png` and returned the login page with HTTP 200 and `text/html`. The browser displayed a broken-image icon in the header and footer.

**Evidence:** [Before](screenshots/umlilo-home-ready.png) · [After](screenshots/issue-008-after.png)

### ISSUE-009: Umlilo service cards are visually clickable but inert

| Field | Value |
|-------|-------|
| **Severity** | high |
| **Category** | functional / ux |
| **URL** | http://localhost:3000/#services |

**Description:** Eight image-led service cards were non-interactive `div` elements. They now link to the assessment workflow and preselect the matching requirement.

**Evidence:** [After](screenshots/issue-009-after.png)

### ISSUE-010: Umlilo service count disagrees with the catalogue

| Field | Value |
|-------|-------|
| **Severity** | medium |
| **Category** | content |
| **URL** | http://localhost:3000/#services |

**Description:** The landing page claimed 55 services while the authoritative eight-category catalogue contains 50. Copy, statistics, and calls to action now agree across both web surfaces.

## Console Health

| Error | Count | First seen |
|-------|-------|------------|
| Cannot read properties of null (reading `classList`) | 1 | #services category click |

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 4 |
| Medium | 6 |
| Low | 0 |
| **Total** | **10** |

## Fixes Applied

| Issue | Status | Commit | Files |
|-------|--------|--------|-------|
| ISSUE-001 / ISSUE-004 | verified | `b5c57ea` | `portal.css` |
| ISSUE-002 | verified | `e6c0910` | `portal.js` |
| ISSUE-003 | verified | `0b2bffc` | `portal.css` |
| ISSUE-005 | verified | `72639fc` | `portal.css` |
| ISSUE-006 | verified | `279a645` | `portal.css` |
| ISSUE-007 | verified | `54778ac` | `portal.php`, `portal.js`, `portal.css` |
| ISSUE-008 | verified | `b27b285` | `proxy.ts` |
| ISSUE-008 regression | verified | `445f1aa` | `check-public-assets.mjs` |
| ISSUE-009 | verified | `2b25455` | `page.tsx` |
| ISSUE-010 | verified | `001f592` | `page.tsx` |

## Verification

- PHP syntax: 48/48 files passed.
- Portal JavaScript syntax passed.
- PHP public site: desktop and mobile navigation, category filtering, FAQ, theme persistence, wizard validation, responsive layout, CSP-rendered inline handler scan, console, and failed requests passed.
- Umlilo: 11 internal links across 9 routes passed, public asset regression passed, production build passed, TypeScript passed, and ESLint reported zero errors with one existing font-loading warning.
- Authenticated portal records were not mutated; credentialed role workflows remain outside this unauthenticated test scope.

## Ship Readiness

| Metric | Value |
|--------|-------|
| Health score | 70 → 98 (+28) |
| Issues found | 10 |
| Fixes applied | 10 verified |
| Deferred | 0 functional defects; 1 existing lint warning |

**PR Summary:** “QA found 10 issues, fixed 10, health score 70 → 98.”
