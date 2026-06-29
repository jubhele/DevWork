# Session: start-dev script fix
Date: 2026-06-28
Provider: OpenAI Codex
Model: GPT-5

## Goal
Fix the BlackFire `start-dev.ps1` parser failure so the dev launcher runs cleanly again under Windows PowerShell.

## Goal Status
PENDING

## Model Recommendation
Task tier: 1-Fast
Recommended model: GPT-4o-mini  Trust score: 8/10
Active model: GPT-5  Status: correct

## Decisions
- Replace the corrupted Unicode-heavy launcher text with plain ASCII output so PowerShell 5.1 parsing is stable.
- Keep the existing behavior: validate `BlackFire Portal\.env`, create `apps\web\.env.local` when missing, launch PHP and Next.js, and optionally launch Expo.
- Verify the file with a PowerShell parse check before closing the task.

## Work Done
- Rewrote `C:\DevWork\BlackFire\start-dev.ps1` to remove mangled glyphs and preserve the launcher flow.
- Added safer literal-path checks in the launcher and kept the background job streaming behavior.
- Created a timestamped backup of the original script in `C:\DevWork\BlackFire\_backups\`.
- Confirmed the updated script parses successfully with `[scriptblock]::Create(...)`.

## Blockers / Next Steps
- No blockers remain for the parser issue.
- If you want, we can do a live smoke test of the launcher next.

## Learnings
- Windows PowerShell 5.1 is happier when launcher scripts stay ASCII-only unless Unicode is truly required.
- Parse-checking a `.ps1` file with `[scriptblock]::Create((Get-Content -Raw ...))` is a fast way to catch syntax issues without launching the whole app stack.

## Warning: Session Log Incomplete
Incomplete at this stop: ## Goal Status (still PENDING -- user must set to ACHIEVED)

_Session ended: 2026-06-28 17:05:14 (Claude Code / claude-sonnet-4-6)_
