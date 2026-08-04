---
inclusion: always
---

# DevWork — Project Structure

DevWork (this repo) is the template/control-plane only — no project application code lives here.
Project repos are siblings at `c:\Projects\<name>`, each its own independent git repo. Authoritative
list: `_workspace/project-registry.json`.

```
c:\DevWork\                          ← Template / control-plane only
├── CLAUDE.md                        ← Workspace constitution (authoritative)
├── AGENTS.md                        ← Mirror for Codex / Antigravity / Kiro / Factory
├── .github/copilot-instructions.md  ← Mirror for GitHub Copilot
├── .cursor/rules/constitution.mdc   ← Mirror for Cursor
├── .kiro/steering/                  ← Mirror for Kiro (this directory)
├── .factory/config.yaml             ← Mirror for Factory Droid
├── .gitignore
├── .env                             ← Secrets (NOT in repo)
├── .env.example                     ← Key template (in repo)
├── _workspace/                      ← Control-plane: sessions, indexes, project-registry.json
├── sessions/                        ← Session logs (cross-project / control-plane work)
├── agents/                          ← Multi-agent system prompts
│   ├── sibali_system_prompt.md
│   ├── mlawuli_system_prompt.md
│   ├── sebenza_agents.md
│   └── ...
└── design/blackfire/brand_tokens.md ← Centralized here even though projects live outside DevWork

c:\Projects\                         ← Sibling root — every project repo, each its own .git
├── BlackFire\                       ← BlackFire / AECI project
│   ├── BlackFire Portal\            ← PHP portal
│   ├── Clients\AECI\                ← Proposal files
│   └── generate_docs.ps1
├── Astute\
├── GovTender\
├── ilahle-portal\
└── JS_Resume\
```

## Folder Conventions
- `_backups/` — timestamped backups of changed files (mandatory before any edit)
- `_drafts/` — work in progress
- `_archive/` — completed or superseded work
- `temp/` — scratch files (gitignored, clean up periodically)

## Session Logs
One file per session: `sessions/<topic>_YYYYMMDD_HHmmss.md`
Mirror to: `G:\My Drive\JS\Agentic AI\sessions\<filename>.md.tbl.bk`
