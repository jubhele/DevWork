# Session: Workspace Global Installs — DevWork as Root Workspace
Date: 2026-06-08
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Update the installs documentation in the Multi-Agent Workforce Architecture doc (§4.1a) and CLAUDE.md (§7d) to reflect that c:\DevWork is the global workspace root, subfolders are projects, and all software/extensions must be installed at the machine or workspace level — not scoped to individual projects. Python specifically should use a shared workspace-level virtual environment at c:\DevWork\.venv.

## Model Recommendation
Task tier: 1-Fast
Recommended model: Haiku 4.5   Trust score: 9/10
Active model: claude-sonnet-4-6   Status: over-powered for this task

## Decisions
- Python: workspace venv at `c:\DevWork\.venv` shared across all projects (not per-project venvs)
- VS Code extensions: installed at user level (global) — clarified this explicitly since the old docs didn't make it clear
- Node.js/pnpm: system PATH install (unchanged, just made scope explicit)
- PHP: system PATH via `C:\php` (unchanged, made scope explicit)
- PowerShell 5.1: already machine-level, noted it's built into Windows
- Added `python.defaultInterpreterPath` to `.vscode/settings.json` so all projects in the workspace pick up the shared venv automatically
- Changed bash code blocks to PowerShell syntax (backtick line continuation) since this is a Windows workspace

## Work Done
- `Multi-Agent Workforce Architecture & System Prompts.md` — rewrote §4.1a with global workspace model, workspace venv for Python, PowerShell syntax for install commands, explicit scope column in runtime table
- `CLAUDE.md` — rewrote §7d with same model: workspace root framing, global extension install, machine-level runtime table, Python venv setup instructions
- `.vscode/settings.json` — added `python.defaultInterpreterPath` pointing to `c:\DevWork\.venv\Scripts\python.exe`
- `_backups\Multi-Agent Workforce Architecture & System Prompts_backup_20260608_165859.md` — backup created before changes

## Blockers / Next Steps
- The `.venv` at `c:\DevWork\.venv` does not exist yet — needs to be created on the actual machine after Python is installed
- Consider updating `AGENTS.md` and `.cursor/rules/constitution.mdc` mirrors to match §7d changes (low priority)

## Learnings
- The old docs implied per-project Python installs; global workspace venv is cleaner and avoids confusion when switching between BlackFire, Astute, and agent scripts
- VS Code's `python.defaultInterpreterPath` in `.vscode/settings.json` is the right hook for workspace-wide interpreter selection
- PowerShell backtick (`` ` ``) is the correct line-continuation character; old docs used bash `\` which would fail on Windows
_Session ended: 2026-06-08 17:01:06 (Claude Code / claude-sonnet-4-6)_
