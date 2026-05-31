# Session: Next.js Monorepo Scaffold — Phase 0 + 1
Date: 2026-05-30
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Pick up the BlackFire technology roadmap from the May 25 session. Rename IZILO → UMLILO across all docs/specs. Scaffold the Next.js + TypeScript monorepo (Phase 0: hosting/scaffold + Phase 1: types + Umlilo tokens).

## Model Recommendation
Task tier: 2-Medium
Recommended model: claude-sonnet-4-6  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: correct

## Decisions
- IZILO renamed to UMLILO (49 replacements across 8 files) — user correction; UMLILO is the portal name
- Monorepo lives at `c:\DevWork\BlackFire\` with apps/web, apps/mobile, packages/types, packages/api-client, packages/ui-tokens
- Used pnpm workspaces (installed globally, v11.5.0)
- Next.js 16.2.6 scaffolded with TypeScript + Tailwind v4 + App Router + src/ directory
- Tailwind v4 uses CSS-based config (@theme), not tailwind.config.ts — tokens live in globals.css
- Auth Phase 1: middleware checks bf_portal cookie client-side; server components call auth.php?action=me
- Portal shell: (portal) route group with server layout, sidebar, RBAC context via React Context
- Login page is a client component (form interaction)
- Dashboard page is a server component (fetches KPIs server-side)
- TypeScript types derived from 20+ migration SQL files, covering all 18 API modules
- Typed API client wraps all PHP endpoints; token param is optional (undefined on web, string on mobile)

## Work Done
- 8 docs backed up and IZILO → UMLILO replaced (49 replacements)
- `c:\DevWork\BlackFire\package.json` — monorepo root
- `c:\DevWork\BlackFire\pnpm-workspace.yaml` — workspace config (apps/*, packages/*)
- `c:\DevWork\BlackFire\apps\web\` — Next.js 16 scaffold (TypeScript, Tailwind v4, App Router)
- `c:\DevWork\BlackFire\packages\types\index.ts` — full TypeScript interfaces (User, Callout, Quote, Invoice, Client, SafetyFile, Statement, DashboardKPIs, AuditEvent, ApiResponse, PaginatedResponse)
- `c:\DevWork\BlackFire\packages\api-client\index.ts` — typed fetch wrappers for all 18 PHP endpoints
- `c:\DevWork\BlackFire\packages\ui-tokens\index.ts` — Umlilo design tokens (colors, fonts, spacing, Tailwind map)
- `c:\DevWork\BlackFire\apps\web\src\app\globals.css` — Tailwind v4 @theme with full Umlilo palette + fonts
- `c:\DevWork\BlackFire\apps\web\src\middleware.ts` — auth guard (redirects to /login if no bf_portal cookie)
- `c:\DevWork\BlackFire\apps\web\src\lib\auth.ts` — getServerUser(), can(), hasRole()
- `c:\DevWork\BlackFire\apps\web\src\context\UserContext.tsx` — UserProvider, useUser(), useCan()
- `c:\DevWork\BlackFire\apps\web\src\app\(portal)\layout.tsx` — portal shell (server, auth gate, UserProvider, Sidebar)
- `c:\DevWork\BlackFire\apps\web\src\components\Sidebar.tsx` — RBAC-filtered nav sidebar
- `c:\DevWork\BlackFire\apps\web\src\app\login\page.tsx` — login page with fire-orange branding
- `c:\DevWork\BlackFire\apps\web\src\app\(portal)\dashboard\page.tsx` — KPI grid (server component)
- `c:\DevWork\BlackFire\apps\web\src\app\page.tsx` — root redirect to /dashboard
- `c:\DevWork\BlackFire\apps\web\src\app\layout.tsx` — root layout (Umlilo Portal title, no Geist font)
- `c:\DevWork\BlackFire\apps\web\.env.local.example` — env var template
- `tsc --noEmit` passed clean

## Blockers / Next Steps
- [x] Copy .env.local.example → .env.local — done
- [x] Configure CORS on Afrihost .htaccess for Vercel domain — done
- [x] Scaffold Expo app in apps/mobile — done
- [x] Build callouts list page — done
- [x] Register Apple Developer Program ($99/year) — paid 2026-05-30, processing (up to 2 business days)
- [x] Register Google Play Console ($25) — active 2026-05-30
- [x] Create separate GitHub repo github.com/jubhele/umlilo-portal — done
- [x] Vercel project umlilo-portal created — needs root dir + branch fix then redeploy
- [ ] Vercel: set Root Directory = apps/web, Production Branch = master, redeploy
- [ ] Callout detail page /callouts/[id]
- [ ] Quotes and invoices pages
- [ ] React Navigation stack in mobile
- [ ] Draft POPIA Privacy Policy
- [ ] EAS Build setup (after Apple account activates)

## Learnings
- Tailwind v4 no longer uses tailwind.config.ts — all token customisation is done via @theme {} in CSS. The roadmap doc's tailwind.config.ts snippet is now a reference only.
- pnpm workspace:* protocol links internal packages without publishing — @blackfire/types and @blackfire/api-client are available immediately in apps/web.
- Next.js 16 App Router: cookies() is async (must await). Route groups like (portal) allow shared layouts without affecting URL paths.
- Bearer token auth was already implemented in PHP (May 28 session) — the API client's optional `token` param correctly supports both web (cookie) and mobile (Bearer) paths from the same typed interface.
_Session ended: 2026-05-30 09:33:28 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 15:48:43 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 18:56:55 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 19:02:12 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 19:04:39 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 19:06:53 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 19:08:18 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 19:09:45 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 19:13:45 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 19:23:13 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 19:28:35 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 19:33:23 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 19:34:42 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 19:37:56 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 19:39:46 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 20:02:45 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 20:04:13 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 20:15:18 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 20:25:39 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 20:27:25 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 20:37:12 (Claude Code / claude-sonnet-4-6)_

## Resumed 2026-05-30 (Evening — Vercel + Login debug)

### Goal
Get the Umlilo Portal live on Vercel and working locally (login → dashboard).

### Work Done
**Vercel deployment fixes (umlilo-portal repo):**
- `package.json` (root) — added `next: 16.2.6` to devDependencies so Vercel framework detection finds it
- `pnpm-lock.yaml` — updated after root devDependency change
- `apps/web/src/app/login/page.tsx` — wrapped `useSearchParams()` in `<Suspense>` (required for static rendering)
- `apps/web/src/middleware.ts` → renamed to `proxy.ts`; export renamed from `middleware` to `proxy` (Next.js 16 breaking change)
- `vercel.json` (root) — `framework: nextjs`, `buildCommand: pnpm --filter web build`, `outputDirectory: apps/web/.next`
- Vercel project settings updated via API: framework preset set to `nextjs`, Root Directory = blank (repo root)

**CORS fixes (BlackFire repo, Emzumbe branch):**
- `api/.htaccess` — switched from `%{HTTP_ORIGIN}e` → `SetEnvIf` capture groups (`CORS_ORIGIN=$1`) for reliable `Access-Control-Allow-Origin` echo
- Added `umlilo-portal-web.vercel.app` and `umlilo-portal-*.vercel.app` to CORS allowlist
- `includes/helpers.php` — added OPTIONS preflight handler inside `api_headers()` (returns 204, applies to all 21 API endpoints)

**Login flow fixes (umlilo-portal repo):**
- `packages/api-client/index.ts` — added `captcha()` method; fixed `login()` captcha param type to `number`
- `apps/web/src/app/login/page.tsx` — added math captcha fetch + field (PHP requires it); fixed response shape (`res.question` not `res.data.question`)
- `apps/web/src/lib/auth.ts` — replaced `getServerUser()` (PHP session forwarding, cross-domain broken) with `getUserFromPortalCookie()` (decodes base64 JSON from Next.js-domain cookie)
- `apps/web/src/app/(portal)/layout.tsx` — reads user from `bf_portal` cookie directly
- `apps/web/src/app/(portal)/dashboard/page.tsx` — updated import from `getServerUser` → `getUserFromPortalCookie`
- `apps/web/src/components/Sidebar.tsx` — guarded `user.permissions` with `?? []` (PHP user object has no permissions field)

**Afrihost deploy script:**
- `BlackFire/BlackFire Portal/install/deploy_PHP.sh` — branch updated from `ndlunkulu` to `Emzumbe`
- `BlackFire/scripts/deploy.sh` — rewrote to clone into `~/blackfire-staging/` then rsync to `public_html` (git never runs in web root)

### Blockers / Next Steps (all cleared 2026-05-31)
- [x] Phase 2 auth: HMAC-sign `bf_portal` cookie — Next.js API route `/api/auth/login` proxies PHP, signs payload with `HMAC-SHA256(COOKIE_SECRET)`, sets `HttpOnly` cookie server-side
- [x] Dashboard KPI data — Bearer token extracted from signed cookie; server components use `Authorization: Bearer <token>` for all PHP API calls
- [x] Callout detail page `/callouts/[id]`
- [x] Quotes page `/quotes`
- [x] Invoices page `/invoices`
- [x] React Navigation native-stack (Dashboard → Callouts → CalloutDetail)
- [x] POPIA Privacy Policy at `/privacy`
- [x] EAS Build setup — `eas.json` + `eas-cli` 20.0.0 installed

### Still to do
- [ ] Vercel: add `COOKIE_SECRET` env var (generate: `openssl rand -hex 32`)
- [ ] EAS: `eas login` then first Android preview build (`eas build --profile preview --platform android`)
- [ ] EAS iOS: after Apple Developer account activates (was processing 2026-05-30, up to 2 business days)
- [ ] Fill `ascAppId` + `appleTeamId` in `eas.json` after creating App Store Connect app record

## Resumed 2026-05-31

### Work Done
**Phase 2 auth:**
- `BlackFire Portal/api/auth.php` — web `action=login` now generates a 2-hour Bearer token (in `bf_mobile_tokens` with `device_id='web'`) alongside the session; returned in `data.token`
- `apps/web/src/app/api/auth/login/route.ts` — new Next.js API route: proxies PHP login (forwards `PHPSESSID` for captcha), HMAC-signs `{user, token}` payload, sets `bf_portal` as `HttpOnly; Secure; SameSite=Lax`
- `apps/web/src/lib/auth.ts` — rewrote with `encodeCookie()` / `decodeCookie()` using `crypto.createHmac`; backward-compat unsigned fallback; exports `getTokenFromPortalCookie()`
- `apps/web/src/app/login/page.tsx` — login form now calls `/api/auth/login` instead of PHP directly; no longer sets cookie via `document.cookie`
- `apps/web/.env.local.example` — added `COOKIE_SECRET` field

**Feature pages:**
- `apps/web/src/app/(portal)/dashboard/page.tsx` — uses `Bearer <token>` instead of forwarded session cookie
- `apps/web/src/app/(portal)/callouts/page.tsx` — same Bearer pattern
- `apps/web/src/app/(portal)/callouts/[id]/page.tsx` — new callout detail page
- `apps/web/src/app/(portal)/quotes/page.tsx` — quotes list page
- `apps/web/src/app/(portal)/invoices/page.tsx` — invoices list page
- `apps/web/src/app/privacy/page.tsx` — POPIA-compliant Privacy Policy (standalone, no auth required)

**Mobile:**
- `apps/mobile/App.tsx` — replaced TODO placeholder with React Navigation `NativeStackNavigator`; `RootStackParamList` exported for screen typing
- `apps/mobile/src/screens/DashboardScreen.tsx` — KPI grid with pull-to-refresh; logout button
- `apps/mobile/src/screens/CalloutsScreen.tsx` — FlatList with pull-to-refresh; navigates to CalloutDetail
- `apps/mobile/src/screens/CalloutDetailScreen.tsx` — full callout detail view
- `apps/mobile/package.json` — added `@react-navigation/native`, `@react-navigation/native-stack`, `react-native-screens`, `react-native-safe-area-context`

**EAS Build:**
- `apps/mobile/eas.json` — development / preview / production profiles configured
- `eas-cli` 20.0.0 installed globally

### Learnings
- **Next.js 16 breaking changes**: `middleware.ts` → `proxy.ts`, export `middleware` → `proxy`; `useSearchParams()` must be in `<Suspense>`.
- **Vercel monorepo**: Root Directory must be blank (repo root) for pnpm workspaces to work. `vercel.json` at root with explicit `framework: nextjs` bypasses package.json detection.
- **Cross-domain cookie problem**: PHP session cookie lives on `blackfiresolutions.co.za`. Next.js server components on `localhost:3000` or `vercel.app` can never forward it. Solution: encode PHP login response user object as base64 in a `bf_portal` cookie on the Next.js domain after login.
- **Apache CORS on shared hosting**: `%{HTTP_ORIGIN}e` and `%{Origin}i` both failed on Afrihost Apache. Only `SetEnvIf Origin "^(pattern)$" VAR=$1` + `%{VAR}e` works reliably.
- **OPTIONS preflight**: Apache `[R=200,L]` rewrite for OPTIONS does not reliably return CORS headers on shared hosting. Handle it in PHP `api_headers()` instead.
- **PHP captcha is mandatory**: The `auth.php?action=login` endpoint requires a valid captcha answer from a prior `/captcha` call. Next.js login form must fetch and display the math question.
- **pnpm frozen-lockfile in CI**: Adding a dependency to `package.json` without running `pnpm install` locally causes Vercel CI to fail with `ERR_PNPM_OUTDATED_LOCKFILE`. Always run `pnpm install` and commit the updated lockfile.
_Session ended: 2026-05-30 22:50:00 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 20:50:22 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 20:57:48 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 21:02:30 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 21:07:17 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 21:15:57 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 21:19:47 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 21:21:37 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 22:15:54 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 22:20:35 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 22:22:08 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 22:24:19 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 22:31:43 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 22:37:51 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 22:40:07 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 22:43:54 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 22:52:51 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 23:22:44 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 23:26:08 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 23:30:32 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 23:33:28 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 23:50:50 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 23:54:38 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 23:56:57 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-30 23:59:05 (Claude Code / claude-sonnet-4-6)
_Session ended: 2026-05-31 00:30:00 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-31 01:01:11 (Claude Code / claude-sonnet-4-6)_
