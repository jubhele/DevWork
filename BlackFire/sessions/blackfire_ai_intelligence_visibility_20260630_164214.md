# Goal
Explain why the "AI Intelligence" / "Client Intelligence Report" section is not visible on the normal portal at `http://localhost:8080/`.

## Decisions
- Determined the section belongs to the authenticated Next.js dashboard, not the public PHP site.
- No code changes were made because the behavior matches the current route split.
- Later clarified that the requested issue was the dark theme still showing light surfaces in the Next.js portal, so I applied shared dark-mode overrides rather than per-component fixes.
- Follow-up pass moved the portal shell and dashboard cards toward theme tokens so the dark mode no longer depends entirely on CSS overrides.

## Work Done
- Located `AnomalyWidget` and `ReportTrigger` in `apps/web/src/components/`.
- Traced their usage to `apps/web/src/app/(portal)/dashboard/page.tsx`.
- Verified the Next.js dashboard route is protected by portal auth.
- Confirmed `http://localhost:8080/` serves the public PHP site shell from `BlackFire Portal/portal.php`.
- Recorded the surface split in project memory.
- Added dark-mode overrides for `bg-white/95`, `bg-[#fff3e8]`, and `bg-[#eef5ff]` in `apps/web/src/app/globals.css`.
- Verified `pnpm --dir apps/web lint` and `typecheck` still run; both surfaced pre-existing repo issues unrelated to this change.
- Switched the portal shell theme bootstrap to a lazy initializer and removed the lint-triggering state update from the effect.
- Updated the dashboard KPI and summary cards to use `bg-bone-paper` so they inherit the dark theme variables cleanly.
- Ran focused lint on `PortalShell.tsx` and `dashboard/page.tsx`; both passed.

## Blockers / Next Steps
- If more light surfaces appear in dark mode, add them to the shared `html[data-theme='dark']` override layer.
- If the goal is to surface those cards on the public site, that would be a product decision rather than a bug fix.

## Learnings
- BlackFire has two distinct web surfaces in local dev: the public PHP site on `:8080` and the authenticated Next.js portal on `:3000`.
- The AI widgets are only present on the Next.js dashboard and require a valid portal session.
- Dark theme gaps in this portal are usually caused by fixed utility classes or hex-coded accent backgrounds rather than missing theme state.

## Goal Status
ACHIEVED
