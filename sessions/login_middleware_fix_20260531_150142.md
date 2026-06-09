# Session: Login Middleware Fix — /api/auth/login 307 redirect
Date: 2026-05-31
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Diagnose and fix "Could not reach the server. Try again." error on the Umlilo Portal login page at umlilo-portal-web.vercel.app.

## Model Recommendation
Task tier: 2-Medium
Recommended model: claude-sonnet-4-6  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: correct

## Decisions
- Root cause confirmed via curl: POST /api/auth/login returns 307 redirect to /login?next=%2Fapi%2Fauth%2Flogin
- Cause: Next.js 16 proxy.ts middleware intercepts /api/auth/login (not in PUBLIC_PATHS, no bf_portal cookie yet)
- Fix: exclude api/ from middleware matcher's negative lookahead so API routes bypass the redirect
- API routes handle their own auth — no need for middleware redirect on /api/ paths

## Work Done
- apps/web/src/proxy.ts — added api/ to the matcher negative lookahead (fixes 307 redirect on /api/auth/login)
- apps/web/src/app/api/auth/captcha/route.ts — new Next.js captcha proxy route
  - Calls PHP auth.php?action=captcha server-side
  - Extracts PHP bf_portal session ID from Set-Cookie header
  - Stores it as php_sess (HttpOnly, Vercel domain, 10 min TTL) so login can forward it to PHP
- apps/web/src/app/api/auth/login/route.ts — reads php_sess cookie and forwards as bf_portal to PHP
- apps/web/src/app/login/page.tsx — removed direct PHP api-client call; now uses /api/auth/captcha
- Commits: 41409e7 (middleware fix), 7b31e70 (captcha proxy)
- Pushed to GitHub; Vercel redeploy triggered

## Blockers / Next Steps
- [ ] Set COOKIE_SECRET env var on Vercel (still pending from prior session) — without it cookies are unsigned but login should still work
- [ ] Verify end-to-end login after Vercel redeploy

## Learnings
- Next.js 16 proxy.ts middleware runs on ALL routes matched by config.matcher, including /api/ routes — always exclude api/ from redirect matchers
- PHP uses bf_portal as both the session cookie name AND what the Next.js app uses for auth — same name, different domains, different content (session ID vs HMAC payload)
- Cross-domain captcha sessions: PHP sets bf_portal on blackfiresolutions.co.za; browser can't send it to vercel.app; fix is to proxy the captcha through Next.js and relay the session ID as a Vercel-domain cookie (php_sess)
- "Could not reach the server" fires when res.json() throws on the 307 redirect response (Content-Type: text/plain, body: "Redirecting...")
_Session ended: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-31 16:14:26 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-31 16:44:57 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-31 16:46:12 (Claude Code / claude-sonnet-4-6)_
