---
inclusion: always
---

# DevWork — Project Structure

```
c:\DevWork\
├── CLAUDE.md                        ← Workspace constitution (authoritative)
├── AGENTS.md                        ← Mirror for Codex / Antigravity / Kiro / Factory
├── .github/copilot-instructions.md  ← Mirror for GitHub Copilot
├── .cursor/rules/constitution.mdc   ← Mirror for Cursor
├── .kiro/steering/                  ← Mirror for Kiro (this directory)
├── .factory/config.yaml             ← Mirror for Factory Droid
├── .gitignore
├── .env                             ← Secrets (NOT in repo)
├── .env.example                     ← Key template (in repo)
├── sessions/                        ← Session logs (all providers)
├── agents/                          ← Multi-agent system prompts
│   ├── sibali_system_prompt.md
│   ├── mlawuli_system_prompt.md
│   ├── sebenza_agents.md
│   └── ...
├── design/blackfire/brand_tokens.md
├── BlackFire/                       ← BlackFire / AECI project
│   ├── BlackFire Portal/            ← PHP portal
│   ├── Clients/AECI/                ← Proposal files
│   └── generate_docs.ps1
├── umlilo-portal/                   ← Next.js + Expo monorepo (submodule)
└── Astute/                          ← Astute project
```

## Folder Conventions
- `_backups/` — timestamped backups of changed files (mandatory before any edit)
- `_drafts/` — work in progress
- `_archive/` — completed or superseded work
- `temp/` — scratch files (gitignored, clean up periodically)

## Session Logs
One file per session: `sessions/<topic>_YYYYMMDD_HHmmss.md`
Mirror to: `G:\My Drive\JS\Agentic AI\sessions\<filename>.md.tbl.bk`
