# Hosted Assistant Instructions — Umlilo Portal

Follow the repository constitution in `AGENTS.md` and the full multi-agent architecture in `docs/multi-agent-workforce-architecture.md`.

Mandatory rules:
- Create/update a session log in `sessions/` for substantive work.
- Read/update memory through `memory/MEMORY.md` and the DevWork workspace memory when available.
- Route work through the named workforce: Sibali for cost governance, Mlawuli for orchestration, and the correct Sebenza worker domain.
- Keep provider entrypoints synchronized: `CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md`, `.cursor/rules/constitution.mdc`.
- Do not hardcode secrets. Never commit `.env`, `.env.*`, `*.env`, `config.local.*`, or sensitive customer data.
- Follow subtree rules in nested `AGENTS.md` files, especially `apps/web/AGENTS.md` and `apps/mobile/AGENTS.md`.

Code style:
- No speculative features beyond the task.
- No explanatory comments except non-obvious WHY comments.
- Validate at system boundaries.
- PowerShell 5.1 commands must not use `&&`, `||`, or ternary syntax.
