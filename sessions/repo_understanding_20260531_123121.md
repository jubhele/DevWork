# Goal

Understand what is in `jubhele/BlackFire` and `jubhele/umlilo-portal`, using local workspace context and GitHub-facing repository structure where available.

# Decisions

- Request classified as Tier 2 / Medium; GPT-5 is suitable for repository analysis and comparison.
- Treat `jubhele/BlackFire` as the workspace/umbrella repository, not only the nested `BlackFire/` project directory.
- Treat `jubhele/umlilo-portal` as the focused deployable Next.js + Expo monorepo.
- Note the `umlilo-portal` gitlink inside `BlackFire` lacks `.gitmodules`, so it needs a repository-relationship decision before relying on submodule workflows.
- Recommended short-term workflow: commit `umlilo-portal` changes inside its own repo first, then commit parent `BlackFire` workspace changes separately; stage the parent `umlilo-portal` gitlink only when intentionally recording a new child repo commit.
- Repository strategy preference: keep `umlilo-portal` independent, but introduce generated shared contracts so PHP backend changes automatically update TypeScript types/API client artifacts.

# Work Done

- Started session log.
- Read shared memory index.
- Verified GitHub metadata via API for `jubhele/BlackFire` and `jubhele/umlilo-portal`.
- Inventoried local `C:\DevWork`, `C:\DevWork\BlackFire`, and `C:\DevWork\umlilo-portal`.
- Reviewed monorepo structure, package manifests, app routes, shared API client/types, mobile navigation, Vercel config, and PHP portal/API structure.
- Updated `project_umlilo_portal.md` memory with current repo relationship and app status.
- Rechecked worktree status: parent is dirty from session logs plus nested `umlilo-portal`; child is dirty from `.gitignore` and `_backups/`, while its HEAD still matches the parent gitlink commit `73ba4a2`.
- Captured requirement: when PHP backend shapes change, especially user/auth/RBAC data, matching TypeScript files must be generated or synchronized rather than edited manually in two places.
- Added shared contract sources in `BlackFire/contracts/`: `portal.contract.json`, `umlilo.tokens.json`, and README usage notes.
- Added `scripts/sync-umlilo-contracts.ps1` to generate TypeScript domain types and shared UI tokens into `umlilo-portal`.
- Regenerated `umlilo-portal/packages/types/index.ts` and `umlilo-portal/packages/ui-tokens/index.ts` from the new contract files.
- Added package `tsconfig.json` files for `types`, `api-client`, and `ui-tokens`, plus a `ui-tokens` typecheck script.
- Updated the API client to typecheck without requiring Node types by declaring the minimal `process.env.NEXT_PUBLIC_API_BASE` shape locally.
- Ran `pnpm -r typecheck` in `umlilo-portal`; it passes for `packages/types`, `packages/ui-tokens`, and `packages/api-client`.
- Re-ran contract sync and package typecheck before commit.
- Committed `umlilo-portal` changes as `0cf0962 chore: generate shared portal contracts`.
- Committed parent `BlackFire` workspace changes as `20e9487 chore: add umlilo contract sync workflow`.
- Pushed `umlilo-portal` `master` to GitHub: `73ba4a2..0cf0962`.
- Pushed `BlackFire` `Emzumbe` to GitHub: `c54804b..20e9487`.

# Blockers / Next Steps

- Decide whether `umlilo-portal` should be a proper submodule inside `BlackFire`, a subtree, or completely independent sibling repository.
- Confirm canonical production URL between `umlilo-portal.vercel.app` and `umlilo-portal-web.vercel.app`.
- Continue portal parity work for safety, clients, finance, admin users, and audit.
- Decide when to remove the incomplete `umlilo-portal` gitlink from the parent repo.
- Extend contract generation to API endpoint metadata/OpenAPI once backend endpoint shapes stabilize beyond current domain types.
- `pnpm install --lockfile-only` attempted a registry fetch under restricted network and timed out; no dependency change was needed after switching the API client away from Node type dependency.

## Learnings

- `jubhele/BlackFire` is public, default branch `ndlunkulu`, and currently contains the broader DevWork workspace: agent instructions, scripts, sessions, `Astute/`, `BlackFire/`, and a gitlink entry named `umlilo-portal`.
- `C:\DevWork` local branch is `Emzumbe`, tracking `origin/Emzumbe`; the GitHub default branch is `ndlunkulu`, and `origin/HEAD` still points to `origin/master`.
- `C:\DevWork\BlackFire` contains the legacy/live PHP Umlilo Portal, client docs, brand assets, and a scaffolded modern `apps/` + `packages/` monorepo.
- `jubhele/umlilo-portal` is public, default branch `master`, focused on the deployable Next.js web + Expo mobile monorepo.
- `umlilo-portal` calls the existing Afrihost PHP API at `blackfiresolutions.co.za/api` while sharing TypeScript types, API wrappers, and design tokens across web and mobile.
- First contract-sync workflow is now local and dependency-free: edit JSON contracts under `BlackFire/contracts/`, run `.\scripts\sync-umlilo-contracts.ps1`, then commit generated TypeScript changes in `umlilo-portal`.
- Commit order matters while the gitlink exists: commit and push `umlilo-portal` first, then commit/push the parent `BlackFire` gitlink and contract-source changes.
