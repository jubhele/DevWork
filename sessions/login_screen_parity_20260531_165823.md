# Session: Login Screen Parity — Next.js matches PHP Portal
Date: 2026-05-31
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Make the Next.js Umlilo Portal login screen visually match the PHP portal login screen,
while keeping "Umlilo Portal" branding on both.

## Model Recommendation
Task tier: 1-Fast
Recommended model: claude-haiku-4-5  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: over-powered (small UI change, sonnet was already in session)

## Decisions
- Keep "Umlilo Portal" subtitle instead of "SECURE ACCESS" — user preference
- Use PHP CSS variables (--bg, --surface, --accent, etc.) via inline styles so login page stays in sync with PHP theme
- Added forgot-password panel in-page (no separate route) — calls PHP auth.php?action=request_reset
- Added "Back to site" link → blackfiresolutions.co.za
- CSS variable aliases added to globals.css :root so both Tailwind tokens and PHP-style vars coexist

## Work Done
- umlilo-portal/apps/web/public/blackfire_logo_transparent.png — copied from PHP portal
- umlilo-portal/apps/web/src/app/layout.tsx — added Google Fonts link (Big Shoulders Display, Instrument Sans, IBM Plex Mono)
- umlilo-portal/apps/web/src/app/login/page.tsx — full rewrite: logo image, PHP-matching structure, square corners (2px), correct fonts, forgot-password panel, back-to-site link
- umlilo-portal/apps/web/src/app/globals.css — added --bg/--surface/--surface2/--border/--text/--muted/--accent CSS variable aliases

## Blockers / Next Steps
- Test visually in browser once dev server is running
- Extend same parity approach to other portal pages (sidebar, dashboard cards, etc.)

## Learnings
- The Next.js login was scaffolded independently — it used Tailwind tokens but never loaded the actual fonts, and used rounded-lg corners instead of the PHP's 2px square style
- PHP portal uses 3 specific Google Fonts: Big Shoulders Display (headings), Instrument Sans (body), IBM Plex Mono (labels/mono)
- Adding CSS variable aliases to globals.css :root lets login page inline styles stay in sync with PHP theme without duplicating token definitions
- Image component from next/image requires explicit width/height props even when height is controlled via style
_Session ended: 2026-05-31 16:58:30 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-31 17:05:35 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-31 17:16:51 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-31 17:19:18 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-31 17:30:25 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-31 17:59:53 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-31 18:04:02 (Claude Code / claude-sonnet-4-6)_
