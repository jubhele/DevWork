# Theme and Navigation Contract

- Light/dark switching is permanent across the public website, login, privacy page, authenticated portal, and Expo app.
- Shared semantic palettes originate in `BlackFire/contracts/umlilo.tokens.json` and generate `packages/ui-tokens/index.ts` through `scripts/sync-umlilo-contracts.ps1`.
- Web persists the user choice as `bf-theme` in localStorage. Expo uses the same key in SecureStore. System preference is only the initial fallback.
- Light controls use accessible Fire `#BE430D`; display Fire may remain `#C94A10`. Verified normal-text contrast is at least 4.67:1 across the core light/dark canvas and surface pairs.
- `apps/web/src/proxy.ts` must allow `/`, `/login`, and `/privacy` without authentication. Never use `pathname.startsWith('/')` for a root public-path test because it matches every route.
- Sidebar and table links must only target implemented App Router pages. `pnpm --filter web test:links` checks internal route references and public proxy allowlisting.
- The Expo dashboard must retain a visible path to Callouts; authenticated headers and the unauthenticated login screen both expose the theme control.
