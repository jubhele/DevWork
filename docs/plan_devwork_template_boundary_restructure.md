# Plan: DevWork Template Boundary Restructure

**Status:** Draft — not started
**Owner:** Jubhele Shange
**Created:** 2026-08-04

## Problem

`DevWork` is meant to be the empty-container template repo: one common place holding workspace
architecture (constitution, provider mirrors, agent prompts, hooks, shared scripts) that every
project starts from and stays synchronized with. In practice, project repos (BlackFire, Astute,
umlilo-portal, GovTender, JS_Resume) live as nested git repos physically inside `c:\DevWork\` on
disk. This let DevWork's own `.github/workflows/build.yml` accidentally reference BlackFire's app
(`working-directory: BlackFire`) — already fixed by removing that workflow (2026-08-04) — but the
deeper structural cause remains: nothing prevents this class of mistake while the repos are nested.

## Goal

Move BlackFire, Astute, umlilo-portal, GovTender, and JS_Resume to sibling folders outside
`c:\DevWork\` (e.g. `c:\Projects\<name>` or similar — final path TBD with user), so that DevWork's
own working tree contains only template/config content: this architecture guide, constitution
mirrors, `agents/`, `scripts/`, `.env.example`, `_workspace/` control-plane, and design tokens.

## Scope — what has to change

1. **Filesystem move** — relocate each nested repo's working tree without breaking its own git
   history or remote tracking (`git` doesn't care where a repo lives on disk; this is a plain move +
   re-verify `git status`/`git remote -v` per repo).
2. **`scripts/governance/constitution-hook.ps1`** — currently assumes projects are direct children of
   `$WorkspaceRoot` (`isDirectProject = (Split-Path $bindingRoot -Parent).Equals($workspace, ...)`,
   see line ~263). This check must generalize to a registered/known project-roots list instead of a
   parent-directory assumption, or accept project roots living anywhere.
3. **`scripts/governance/initialize-project.ps1`** — likely also assumes new projects are created as
   DevWork subdirectories; needs the same generalization.
4. **`scripts/governance/update-workspace-index.ps1`** — `WORKSPACE_INDEX.md` generation logic that
   scans for project folders under DevWork root.
5. **`commit-all-repos-dynamic.ps1`** — `Get-RepositoryPaths -SearchRoot $Root` currently scans
   *under* `$Root` (defaults to `C:\DevWork`) for nested `.git` folders. After the move this script
   needs a registered list of sibling repo roots instead of (or in addition to) a recursive scan.
6. **Provider mirrors** (`CLAUDE.md` §3 Workspace Structure, `AGENTS.md`, `.github/copilot-instructions.md`,
   `.cursor/rules/constitution.mdc`, `.kiro/steering/*`, `.factory/config.yaml`) — the ASCII tree
   showing `BlackFire/` and `Astute/` as children of `c:\DevWork\` must be corrected to show them as
   siblings, with an explicit "project roots" list/registry.
7. **Memory files** — `memory/project_*.md` entries reference paths like
   `c:\DevWork\BlackFire\...`; each must be checked and updated (grep confirmed matches across CLAUDE.md,
   AGENTS.md, Copilot/Cursor mirrors and their backups — memory files not yet audited).
8. **VS Code workspace settings** — `.vscode/settings.json` / `extensions.json` recommendations and
   any multi-root workspace file, if one exists, that assumes the nested layout.
9. **`.env` sync script** (`scripts/sync-workspace-secrets.ps1`) — per memory, this copies
   `C:\DevWork\.env` into app-local mirrors; verify it uses a relative or registered path, not a
   hardcoded nested assumption.
10. **Design folder** — `design/blackfire/`, `design/umlilo/` currently live under DevWork root per
    §10 of the architecture guide; decide whether design tokens stay centralized in DevWork (they are
    arguably template/shared content, not app code) or move with their project.
11. **Session/artifact history** — existing session logs and `_backups/` under each project already
    reference `c:\DevWork\BlackFire\...`-style paths; these are historical records and should NOT be
    rewritten, but new logs after the move must use the new path.
12. **`.git` root cleanliness** — after moving the nested repos out, confirm DevWork's own
    `.gitignore` / tracked file list no longer needs the exclusions that existed to keep nested repos
    out of DevWork's own git tracking (check current `.gitignore` for `BlackFire/`-style entries).

## Open questions for the user

- Target location: `c:\Projects\<name>`, `c:\DevWork-Projects\<name>`, or something else?
- Should `design/` (brand tokens) stay centralized in DevWork, or move per-project?
- Do this as one atomic session, or incrementally (one project repo at a time, verifying hooks/scripts
  still work before moving the next)?
- Should the "registered project roots" list live in a new config file (e.g.
  `_workspace/project-registry.json`) that `constitution-hook.ps1`, `initialize-project.ps1`, and
  `commit-all-repos-dynamic.ps1` all read from, so there's one place to add/remove a project root
  instead of updating three scripts every time?

## Suggested approach (once confirmed)

1. Introduce `_workspace/project-registry.json` listing each known project's root path — this becomes
   the single source of truth the governance scripts read, replacing the parent-directory / recursive-
   scan assumptions.
2. Update `constitution-hook.ps1`, `initialize-project.ps1`, `update-workspace-index.ps1`, and
   `commit-all-repos-dynamic.ps1` to read the registry instead of assuming nesting.
3. Test the updated scripts against the *current* nested layout first (registry entries point at
   today's nested paths) to prove the generalization works without moving anything yet.
4. Move one project repo (start with the smallest/lowest-risk, e.g. JS_Resume or GovTender) to its new
   location, update its registry entry, and verify `ProjectBind`, session logging, and
   `commit-all-repos-dynamic.ps1` all still work end to end.
5. Repeat for the remaining project repos.
6. Update all provider mirrors' Workspace Structure sections and the architecture guide §4.2 (File
   System Layout) to reflect the new sibling layout.
7. Run the §9.4 workspace inspection / mirror audit to confirm consistency.
8. Update `WORKSPACE_INDEX.md` and re-run indexing.

## Non-goals

- This plan does not change any project's internal structure, git history, or remote.
- This plan does not change the constitution's rules themselves — only where projects physically live
  relative to DevWork and how the tooling discovers them.
