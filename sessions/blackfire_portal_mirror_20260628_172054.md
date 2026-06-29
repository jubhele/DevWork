# Session: BlackFire Portal Mirror
Date: 2026-06-28
Provider: OpenAI Codex
Model: OpenAI Codex

## Goal
Make `http://localhost:3000` match `http://localhost:8080` for BlackFire branding, assets, pages, and data by identifying the drift and fixing the local dev surface.

## Model Recommendation
Task tier: 2-Medium
Recommended model: GPT-4o  Trust score: 8/10
Active model: OpenAI Codex  Status: acceptable

## Decisions
- Treat the PHP portal on `:8080` as the source of truth and mirror it from the Next.js app on `:3000`.
- Use the app-level proxy hook instead of porting the public site, so pages, assets, and API calls stay aligned with the live PHP implementation.
- Target `http://[::1]:8080` because the PHP dev server is listening on IPv6 loopback, not `127.0.0.1`.
- Add a dedicated parity smoke test so QA checks the mirrored routes and assets instead of relying on a manual browser pass.

## Work Done
- Backed up `BlackFire/apps/web/next.config.ts` to `_backups/next.config_backup_20260628_172054.ts`.
- Updated `BlackFire/apps/web/src/proxy.ts` to forward all non-Next asset requests to the PHP portal on `:8080`.
- Removed the temporary rewrite detour from `next.config.ts`.
- Verified `http://localhost:3000/` now serves the PHP portal HTML, `http://localhost:3000/favicon.ico` returns `200`, and service images proxy correctly.
- Backed up `BlackFire/apps/web/package.json` to `_backups/package_backup_20260628_191835.json`.
- Added `BlackFire/apps/web/scripts/check-portal-parity.mjs` and wired it to `npm/pnpm` as `test:portal-parity`.
- Ran the parity smoke test successfully against both `localhost:3000` and `localhost:8080`.

## Blockers / Next Steps
- None currently; the mirror is working for the checked routes.
- If additional Next-only routes need to stay live later, we can scope the proxy matcher more narrowly.
- The configured `G:` mirror drive is not mounted in this environment, so the session log could not be copied to the shared-drive backup path.

## Learnings
- The repo already had a proxy hook in `src/proxy.ts`, so that was the correct integration point.
- The PHP server in this workspace is bound to `::1`, which matters when proxying from the Next app.
- `:3000` can mirror `:8080` cleanly without copying the whole public site when the proxy is placed at the request boundary.
- A good QA check here is route identity plus asset availability, not just “the page loads.”
- Comparing only the full HTML body was too brittle; route markers and required assets gave a better parity signal.

## Goal Status
PENDING

## Warning: Session Log Incomplete
Incomplete at this stop: ## Goal Status (still PENDING -- user must set to ACHIEVED)

_Session ended: 2026-06-28 17:21:59 (Claude Code / claude-sonnet-4-6)_

## Agent Accountability
| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|
| blackfire_portal_mirror_20260628_172054 | Mlawuli | Claude Code (Mlawuli) | COMPLETED [AUTOMATED] | - | AUTOMATED -- no user confirmation after 2h -- 2026-06-28 19:20:01 |

> Completed by: Claude Code (Mlawuli)  |  Task: blackfire_portal_mirror_20260628_172054  |  Status: COMPLETED [AUTOMATED]  |  Confirmed: AUTOMATED -- no user confirmation after 2h  |  2026-06-28 19:20:01
_Session ended: 2026-06-28 19:20:01 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-28 19:20:20 (Claude Code / claude-sonnet-4-6)_

## Resumed 2026-06-28

## Goal
Keep `http://localhost:3000` on the Next.js stack, remove the PHP mirror behavior, and restore the branding and static asset parity the app still lacked.

## Decisions
- Do not proxy `:3000` to the PHP site; that made the Next app look like PHP instead of fixing parity.
- Treat the PHP portal as the source for missing static assets only, then let Next serve them directly from `public/`.
- Keep the parity smoke test focused on the Next app and explicit asset checks so regressions are caught without reintroducing the mirror.

## Work Done
- Removed the proxy mirror file from `BlackFire/apps/web/src/proxy.ts`.
- Copied the PHP portal service-image catalog into `BlackFire/apps/web/public/images/services/`.
- Kept `BlackFire/apps/web/scripts/check-portal-parity.mjs` aligned to the Next app and verified it passes on `http://localhost:3000`.
- Updated `BlackFire/apps/web/src/app/login/page.tsx` so the Next login screen uses the PHP login wording, logo, and visual hierarchy.
- Re-verified `http://localhost:3000/login` exposes `BLACKFIRE SOLUTIONS`, `SECURE ACCESS`, and the shared logo asset.

## Blockers / Next Steps
- The remaining scope, if any, is page-level content parity beyond the static assets already copied.
- `start-dev.ps1` has unrelated formatting drift in the working tree and was not touched in this pass.

## Learnings
- A Next app that fronts a PHP backend should not inherit PHP HTML through a proxy unless that is the explicit product goal.
- Missing public assets are a better parity fix than routing the entire app through the PHP server.
- Small branding mismatches on the login page are best fixed in the Next shell itself so the PHP and Next entry screens stay visually aligned.

## Goal Status
PENDING

## Resumed 2026-06-29

## Goal
Replace the remaining visible `BlackFire Solutions` text on the Next `/login` screen with `Umlilo Portal` so the login copy matches the requested wording.

## Decisions
- Keep the BlackFire logo asset in place and change only the visible text labels on the login screen.
- Leave the shared auth flow untouched; this is a branding copy update, not a functional login change.

## Work Done
- Updated `BlackFire/apps/web/src/app/login/page.tsx` so the large title now reads `Umlilo Portal`.
- Updated the footer line on `/login` to `Umlilo Portal`.
- Verified `http://localhost:3000/login` no longer contains visible `BlackFire Solutions` text in the rendered HTML.

## Blockers / Next Steps
- None for this request.

## Learnings
- On the login page, the logo image and the visible text are separate concerns; the user request here only needed the text copy changed.

## Goal Status
PENDING
_Session ended: 2026-06-28 19:30:26 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-28 19:32:06 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-28 19:46:37 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-28 19:46:51 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-28 20:06:43 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-28 20:06:57 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-28 20:26:48 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-28 20:27:03 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-28 20:46:54 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-28 20:47:09 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-28 21:07:00 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-28 21:07:14 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-28 21:27:06 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-28 21:27:20 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-28 21:47:12 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-28 21:47:26 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-28 22:07:18 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-28 22:07:31 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-28 22:27:24 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-28 22:27:37 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-28 22:47:30 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-28 22:47:42 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-28 23:07:36 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-28 23:07:48 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-28 23:27:41 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-28 23:27:54 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-28 23:47:47 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-28 23:47:59 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-29 06:03:38 (Claude Code / claude-sonnet-4-6)_
