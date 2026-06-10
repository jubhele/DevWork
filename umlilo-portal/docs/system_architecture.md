# System Architecture — Umlilo Portal

## Repository Shape

- `apps/web` — Next.js web portal.
- `apps/mobile` — Expo mobile app.
- `packages/api-client` — shared API client package.
- `packages/types` — shared TypeScript types.
- `packages/ui-tokens` — shared UI token package.
- `agents` — repo-local multi-agent workforce prompts.
- `docs` — architecture, operator, and testing documentation.
- `memory` — repo-local memory index.
- `sessions` — session logs and template.

## Governance Shape

`AGENTS.md` is the canonical repo constitution. Provider-specific mirrors point back to it so Claude Code, Codex, GitHub Copilot, Cursor, Google Antigravity, and fallback agents share the same operating rules.
