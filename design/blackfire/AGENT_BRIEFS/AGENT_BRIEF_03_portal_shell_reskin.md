# AGENT_BRIEF_03 — Umlilo Portal shell reskin (v3)
**Target:** `portal.css` (portal-state sections), `portal.php` (login screen + app chrome markup only)
**Rule zero:** ZERO behavioural change. Same DOM ids, same data-actions, same API calls. This is paint, not surgery.

## Scope
1. **Login screen:** restage as a v3 moment — Coal ground with faint Triangle Tessellation backdrop (reuse `.izilo-triangle-bg`), card on Navy with Steel Dark border + 3px Ember left rule, Big Shoulders "UMLILO PORTAL" title, mono eyebrow `BLACKFIRE SOLUTIONS · SECURE ACCESS`, button = `.btn-fire`. Keep bcrypt/session flow untouched.
2. **App chrome:** sidebar/nav adopts v3 tokens (already same palette — this is mostly border, type and spacing alignment to the reference: mono section labels, ember active-state underline, 3px radius everywhere, no pill radii). Tables keep the existing pill status system unchanged.
3. **Dashboard cards:** ember-underline hover from `.svc-card::after`; mono stat values (`--f-mono`).
4. **Loading states:** replace any spinner with the small Ignition triangle fill (reuse preloader CSS at 22px scale).
5. Keep dark/light theme toggle fully working — every new rule must have both `[data-theme]` values or use existing tokens.

## Guards
- §7a backups first. Mobile drawer + 44px targets + responsive tables (v2.1) untouched.
- No new fonts beyond the four brand families. No console.log. esc() rule applies to any touched JS (expected: none).

## Exit gate
QA PASS + full role-matrix smoke test (login as admin, safety, inspector, compliance — screenshots before/after per existing QA screenshot convention) + session log.
