# Session: Umlilo Login Auth Continue

## Goal
Continue debugging the Next.js Umlilo login failure after visual parity work; identify the real auth/captcha issue and ship a focused fix if needed.

## Decisions
- Started with investigate workflow because this is a reported login/auth bug.
- Tier 2 / Medium: active GPT-5 is appropriate for debugging with code changes.
- Treat `DEV_ADMIN_USER` and `DEV_ADMIN_PASS` from `c:\DevWork\umlilo-portal\.env` as local test credentials only; never print secret values.
- Preserve PHP's regenerated `bf_portal` session id after login and store it inside the signed Next auth cookie as a fallback until Bearer tokens are consistently available.
- Use a shared `getApiAuthHeaders()` helper so server pages can authenticate PHP API calls with either Bearer token or PHP session cookie.

## Work Done
- Verified the live PHP captcha endpoint sets `bf_portal`, not `PHPSESSID`.
- Verified the deployed Next captcha route relays that session as `php_sess`.
- Verified `DEV_ADMIN_USER` / `DEV_ADMIN_PASS` succeed through the deployed Next login route without exposing credentials.
- Added root `.env` loading in `apps/web/next.config.ts` so local web dev can see monorepo-level dev env vars.
- Updated login route to capture PHP's post-login regenerated session id.
- Updated dashboard, callouts, callout detail, quotes, and invoices pages to use Bearer-or-PHP-session auth headers.
- Fixed forgot-password endpoint typo from `request_reset` to PHP's real `reset_request`.
- Ran `tsc --noEmit` and `npm run build`; both passed.
- Committed and pushed `af06306 fix: preserve PHP session for portal API fallback`.

## Blockers / Next Steps
- After Vercel finishes deploying `af06306`, hard-refresh the browser and log in again with the dev admin credentials.
- If login succeeds but data pages still show empty/failure states, check whether Vercel has `COOKIE_SECRET` set and whether the live PHP APIs accept session-cookie auth from server-side fetch.

## Learnings
- The message `Invalid username or password` appears only after captcha/session forwarding succeeds; it means PHP reached the user lookup or `password_verify()` path.
- PHP login calls `session_regenerate_id(true)`, so the captcha session id can become stale after successful login unless the Next bridge captures the new `Set-Cookie`.
- `json_err()` returns an `error` field while `json_ok()` returns `message`, so Next API routes must normalize both shapes.
- The Next web app runs under `apps/web`, but shared dev credentials live at the monorepo root `.env`; local config must account for that.
