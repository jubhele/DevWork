# github_build_error

## Goal
Fix the GitHub Actions build failure shown in the screenshot.

## Decisions
- Classified as Tier 2 Medium after user requested a code/workflow fix; active model is acceptable for repo repair.
- The screenshot's Composer failure is a workflow/project mismatch: this repo has no composer.json; the active app is a pnpm monorepo in BlackFire/.
- Added a pnpm CI workflow at the repo root that runs from BlackFire/ instead of adding a fake Composer manifest.
- Kept unrelated existing working-tree changes untouched.

## Work Done
- Checked shared memory index per workspace constitution.
- Created .github/workflows/build.yml for push/PR builds using Node 20, pnpm, frozen lockfile install, typecheck, lint, and web build.
- Added missing package 	sconfig.json files for BlackFire/packages/types and BlackFire/packages/api-client so existing pnpm typecheck scripts run correctly.
- Added @types/node to @blackfire/api-client because that package reads process.env.
- Fixed Next.js /login build failure by wrapping useSearchParams() usage in a Suspense boundary.

## Blockers / Next Steps
- No blocker for the new CI path. Push the changes to GitHub and rerun the build.
- Existing unrelated working-tree changes remain present: moved/deleted portal shell scripts and earlier session logs.
- Lint passes with warnings for unused user and useCan; these warnings do not fail CI.

## Learnings
- GitHub Actions Composer validation fails before dependency install when composer.json is missing from the command's current directory.
- This workspace's BlackFire app should be validated as a pnpm monorepo rooted at BlackFire/.
- Next 16 requires useSearchParams() on /login to sit behind a Suspense boundary during prerendering.
