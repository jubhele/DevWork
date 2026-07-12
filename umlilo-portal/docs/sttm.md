# System Technical Test Manual — Umlilo Portal

This STTM is maintained by uMbhali after production-stage QA passes.

## Baseline Checks

- Install dependencies with `pnpm install`.
- Typecheck with `pnpm typecheck`.
- Lint with `pnpm lint`.
- Build web with `pnpm build:web`.

## Agent Compliance Checks

- Confirm provider mirrors exist and reference the same constitution.
- Confirm `agents/` prompt files are present.
- Confirm session logs include `Goal`, `Decisions`, `Work Done`, `Blockers / Next Steps`, and `Learnings`.
