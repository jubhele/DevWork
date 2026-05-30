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
