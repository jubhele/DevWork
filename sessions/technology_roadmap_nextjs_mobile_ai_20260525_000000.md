# Session: Technology Roadmap — Next.js Migration + Mobile App + AI Features
Date: 2026-05-25
Provider: Claude (claude.ai)
Model: claude-sonnet-4-6

## Goal
Comprehensive strategic planning session covering three major technology initiatives for BlackFire Solutions: (1) migrating the Umlilo Portal from PHP to Next.js + TypeScript, (2) building a cross-platform mobile application (Expo → App Store + Play Store), and (3) identifying AI features that create genuine competitive differentiation in the SA security market. The session began with a baseline audit of the actual GitHub repo (branch: ndlunkulu) to correct prior assumptions, then produced full plans for each stream.

## Model Recommendation
Task tier: 3-Complex
Recommended model: claude-sonnet-4-6  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: correct

## Decisions

### Baseline Correction
- Prior session assumed the baseline was static HTML files (blackfire-hub.html, BlackFire_Portal_AECI_v9.html). This was wrong.
- Actual baseline is a mature PHP + MySQL portal (Umlilo Portal) with 18 REST API endpoints, full RBAC, bcrypt auth, safety compliance module, and 20+ DB migrations — already live on Afrihost.
- GitHub repo: `jubhele/BlackFire`, branch: `ndlunkulu`.

### Next.js Migration Decisions
- **Hosting:** Vercel for Next.js + Afrihost stays for PHP/MySQL (Option A — split deploy). Cheaper and zero production risk. VPS consolidation is a later decision.
- **Monorepo:** `apps/web` + `apps/mobile` + `packages/types` + `packages/api-client` + `packages/ui-tokens`.
- **Interim API strategy:** Build typed fetch wrappers over existing `api/*.php` endpoints. PHP backend continues running untouched until each section is signed off.
- **Auth strategy (Phase 1):** PHP session bridge — Next.js middleware validates `bf_portal` cookie via `api/auth.php?action=me`. No session migration risk.
- **Auth strategy (Phase 2 target):** NextAuth Credentials provider backed by MySQL. bcryptjs reads existing hashes directly.
- **Migration approach:** Section-by-section. `portal.php` stays live throughout. No hard cutover date.
- **STREAM4 portals** (Secure Command, Internal Ops, Hub) built natively in Next.js — no PHP legacy to carry.

### Mobile App Decisions
- **Framework:** Expo (React Native) — one codebase, two store binaries.
- **Not Capacitor:** WebView wrappers risk rejection under Apple Guideline 4.2. Native components only.
- **Auth for mobile:** Bearer tokens (new `mobile_login` action in `api/auth.php`, `bf_mobile_tokens` table). PHP session auth unchanged for web. Dual-path `current_user()`.
- **No CAPTCHA on mobile:** Replace with DB-level rate limiting (5 failures → 15-min lockout by IP + device_id).
- **Security:** `expo-secure-store` (Keychain/Keystore), biometric unlock via `expo-local-authentication`, certificate pinning, console.log stripping in production.
- **Store accounts:** Apple Developer Program ($99/year), Google Play Console ($25 once). Must register before writing app code — both take days to activate.
- **Android keystore:** Back up immediately after EAS generates it. Losing it = app can never be updated.
- **POPIA compliance:** Required. Privacy Policy must disclose international data transfer if Vercel US servers are used. In-app consent on first login. Account deletion path required (also Google Play policy).
- **v1 scope:** Dashboard, Callouts, Quotes, Invoices, Safety Files, Clients (view), Push notifications, Biometric unlock. Excluded: user management, audit log, document generation, finance config.
- **Total mobile timeline:** ~11 weeks to both stores live.

### AI Feature Decisions
- **Strategic premise:** Donthok Security Technology (BlackFire's predecessor at AECI) had zero digital presence. Won and held the contract through relationships and price. BlackFire's portal is its most powerful retention tool. AI turns operational data into switching cost.
- **Feature 1 (Priority: Critical):** AI Client Security Intelligence Reports — monthly auto-generated PDF per client with narrative executive summary, callout trends, safety compliance trajectory, risk rating. Claude API generates narrative, WeasyPrint renders PDF, Brevo delivers.
- **Feature 2:** Voice-to-Callout Report (mobile) — field officer speaks, Whisper transcribes, Claude structures into callout form fields. Pre-fills 80% of the form. Ships with mobile app.
- **Feature 3:** Safety File AI Co-pilot — smart pre-fill from history, AI narrative comment generation for NTS items, compliance risk prediction before submission.
- **Feature 4:** Callout Anomaly Detection — pattern analysis on `bf_callouts` history, AI interprets anomalies, surfaces as "AI Intelligence" dashboard widget.
- **Build order:** Reports (Month 1) → Voice (Month 2, with mobile) → Safety Co-pilot (Month 3) → Anomaly Detection (Month 4).
- **Cost:** < R180/month total at current client scale.

## Work Done
- `BlackFire/docs/BLACKFIRE_TECHNOLOGY_ROADMAP_2026.md` — Created. Full strategic document covering baseline, Next.js migration plan, mobile app plan, AI features, compliance requirements, timelines.
- `sessions/technology_roadmap_nextjs_mobile_ai_20260525_000000.md` — This session log.

## Blockers / Next Steps
- [ ] Register Apple Developer Program account ($99/year) — do before any app code
- [ ] Register Google Play Console account ($25 once)
- [ ] Add Bearer token auth to PHP: `bf_mobile_tokens` table migration + `api/auth.php?action=mobile_login` + dual-path `current_user()` in `includes/auth.php`
- [ ] Draft POPIA-compliant Privacy Policy for BlackFire Solutions
- [ ] Set up Vercel project connected to `ndlunkulu` branch
- [ ] Configure CORS on Afrihost `.htaccess` for Vercel domain
- [ ] Scaffold Next.js monorepo (`pnpm create next-app`)
- [ ] Scaffold Expo app (`npx create-expo-app`)
- [ ] Port IZILO design tokens into `tailwind.config.ts`
- [ ] Generate TypeScript interfaces from MySQL schema (20+ migration files)
- [ ] Ship AI Client Intelligence Reports to AECI (Month 1 priority)

## Learnings
- The actual repo baseline was completely different from prior session memory — always read the repo before planning. Static HTML assumptions were stale.
- PHP session cookies (`SameSite=Lax`, `HttpOnly`) are incompatible with native mobile apps. Bearer token auth must be added to the PHP backend before mobile development begins. This is the true unblocking dependency.
- Capacitor (webview wrapper) risks Apple App Review rejection under Guideline 4.2. React Native via Expo is the correct approach for a portal-class app.
- Android keystore loss = permanent inability to update the Play Store app. Back it up the moment EAS generates it.
- POPIA (SA) requires disclosure of international data transfers. If Next.js moves to Vercel US Postgres, this must be in the Privacy Policy.
- AI Client Intelligence Reports are the highest-priority AI feature — not because they are technically impressive, but because they directly address the AECI contract retention risk identified in the Donthok competitive intelligence session.
- The Donthok competitive intel finding is the strategic lens for all technology decisions: BlackFire's portal is its most powerful retention tool. AI amplifies that advantage.
- Account deletion must be in-app (Google Play policy, December 2023 update) and also satisfies POPIA data subject rights.
- EAS manages iOS signing certificates and Android keystore — you never need to open Xcode or Android Studio for routine builds.

_Session ended: 2026-05-25_
_Session provider: Claude (claude.ai / claude-sonnet-4-6)_
_Session ended: 2026-05-28 03:44:10 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-28 04:07:52 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-28 04:10:51 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-28 04:15:58 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-28 04:17:40 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-28 04:24:27 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-28 04:26:18 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-28 04:28:54 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-28 04:47:29 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-28 04:50:56 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-28 04:53:41 (Claude Code / claude-sonnet-4-6)_
