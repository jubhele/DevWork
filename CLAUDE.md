# DevWork Workspace Constitution

> This constitution governs all AI agents operating in this workspace regardless of provider
> (Claude Code, GitHub Copilot, OpenAI Codex, Cursor, Kiro, etc.).
> Provider-specific instructions never override this document.

---

## 1. Session Logging (MANDATORY)

Every session **must** create or update a session log. This is non-negotiable.

**Log location**: `c:\DevWork\sessions\`
**Format**: `YYYY-MM-DD_<topic-slug>.md`

### Session log structure

```
# Session: <topic>
Date: YYYY-MM-DD
Provider: <Claude Code | GitHub Copilot | OpenAI Codex | Cursor | Kiro | Other>
Model: <model name>

## Goal
<one paragraph — what was attempted>

## Decisions
- <key decision and why>

## Work Done
- <file changed> — <what changed>

## Blockers / Next Steps
- <anything left incomplete or requiring follow-up>
```

At session **start**: create the log file with Goal filled in.
At session **end**: complete Decisions, Work Done, and Blockers sections.
If resuming an existing session: append a `## Resumed YYYY-MM-DD` section.

---

## 2. Memory System

Memory lives in `c:\Users\Jughele Shange\.claude\projects\c--DevWork\memory\`.
The index is `MEMORY.md`. Memory is provider-agnostic — all agents read and write it.

**Types**: user, feedback, project, reference (see memory file headers).

Rules:
- Check memory before starting work on any known project area.
- Save decisions, constraints, and preferences discovered during a session.
- Never save ephemeral task state — use the session log for that.

---

## 3. Workspace Structure

```
c:\DevWork\
├── CLAUDE.md                   ← This constitution (Claude Code)
├── AGENTS.md                   ← Mirror for OpenAI Codex
├── .github/
│   └── copilot-instructions.md ← Mirror for GitHub Copilot
├── .cursor/
│   └── rules/
│       └── constitution.mdc    ← Mirror for Cursor
├── .gitignore
├── sessions/                   ← Session logs (all providers)
├── chatsessions/               ← Legacy Copilot transcript archive
├── .claude/
│   └── skills/gstack/          ← gstack multi-agent toolkit
├── BlackFire/                  ← BlackFire / AECI project
└── Astute/                     ← Astute project
```

---

## 4. gstack Skills

gstack is installed at `.claude/skills/gstack/`. Use these skills when available:

| Skill | Purpose |
|-------|---------|
| `/office-hours` | Sprint planning and requirements |
| `/plan-ceo-review` | Executive review of plans |
| `/plan-eng-review` | Engineering review |
| `/design-consultation` | Design direction |
| `/qa` | Quality assurance |
| `/review` | Code review |
| `/investigate` | Root cause analysis |
| `/ship` | Release preparation |
| `/learn` | Persist learnings to memory |
| `/codex` | Second opinion from another AI |
| `/pair-agent` | Multi-AI coordination |
| `/cso` | Security review (OWASP + STRIDE) |

For web browsing use `/browse`. Do not use mcp__claude-in-chrome__* tools.

---

## 5. Sprint Workflow

All significant work follows this sequence:

```
Think → Plan → Build → Review → Test → Ship → Reflect
```

- **Think**: Understand the problem. Read memory. Check session logs.
- **Plan**: Create a plan. Use `/plan-eng-review` for non-trivial work.
- **Build**: Implement. One task at a time. Commit checkpoints.
- **Review**: Use `/review` or `/cso` for security-sensitive changes.
- **Test**: Verify the feature works end-to-end, not just unit tests.
- **Ship**: Clean commits, update session log.
- **Reflect**: Update memory with decisions and learnings.

---

## 6. Cross-Provider Handoff

When switching providers mid-session:

1. Commit any in-progress work with a `WIP:` prefix.
2. Update the session log with current state and next steps.
3. The receiving provider must read the session log before continuing.
4. Reference the `[gstack-context]` commit body format for structured handoffs.

---

## 7. Code Principles

- No speculative features or abstractions beyond the task.
- No comments explaining what code does — only why (hidden constraints, workarounds).
- No error handling for impossible scenarios.
- Security: validate at system boundaries only (user input, external APIs).
- Default encoding for PowerShell file writes: `-Encoding utf8`.
- PowerShell 5.1 syntax: no `&&`/`||` pipeline chains, no ternary `?:`.

---

## 7a. Backup Before Change (MANDATORY)

**Before modifying any file, always create a timestamped backup.**

Format: `<original-name>_backup_YYYYMMDD_HHmmss.<ext>`

Examples:
- `portal.php` → `portal_backup_20260516_143022.php`
- `generate_docs.ps1` → `generate_docs_backup_20260516_143022.ps1`
- `users.json` → `users_backup_20260516_143022.json`

Backups live in a `_backups/` folder next to the file being changed:
- `BlackFire/BlackFire Portal/_backups/portal_backup_20260516_143022.php`
- `BlackFire/_backups/generate_docs_backup_20260516_143022.ps1`

In PowerShell:
```powershell
$ts = Get-Date -Format 'yyyyMMdd_HHmmss'
$backup = "path\to\_backups\filename_backup_$ts.ext"
New-Item -ItemType Directory -Force "path\to\_backups" | Out-Null
Copy-Item "path\to\filename.ext" $backup
```

This applies to: all source files, config files, scripts (.ps1, .py, .php, .js, .sql), 
and any data objects before transformation.

---

## 7b. Temp Files

Any file generated to investigate, test, or experiment goes in `c:\DevWork\temp\`.
This includes:
- Test scripts, scratch files, debug output
- Downloaded samples, one-off data extracts
- Generated files not yet promoted to a project folder

`temp/` is gitignored. Clean it up periodically.

---

## 7c. Work Artifact Organization

All work artifacts belong in named folders, not loose at the repo root.

Structure principle:
```
<project>/
├── _backups/          ← timestamped backups of changed files
├── _drafts/           ← work-in-progress before it's ready
├── _archive/          ← completed or superseded work
├── docs/              ← documentation and proposals
└── <feature>/         ← named feature folder
```

Never create loose files at the repo root (except CLAUDE.md, AGENTS.md, .gitignore, README.md).

---

## 8. Sensitive Data Policy

Files containing credentials, passwords, or API keys must be listed in `.gitignore`.
Known sensitive paths in this workspace:
- `chatsessions/*.jsonl` — may contain plain-text passwords
- `BlackFire/BlackFire Portal/install/blackfire_aeci_seed.sql`
- Any `*.env` or `config.local.*` files

---

## 9. Projects in This Workspace

### BlackFire / AECI
Security company proposals and portal. See `memory/project_blackfire_aeci.md`.
Generator: `c:\DevWork\BlackFire\generate_docs.ps1`

### Astute
Separate project. See `Astute/` directory.

---

## 10. Active AI Providers

This workspace is configured for use with:
- **Claude Code** (primary) — reads `CLAUDE.md`
- **GitHub Copilot** — reads `.github/copilot-instructions.md`
- **OpenAI Codex CLI** — reads `AGENTS.md`
- **Cursor** — reads `.cursor/rules/constitution.mdc`
- **Kiro / Factory Droid / Others** — read `AGENTS.md` as fallback

All providers follow the same constitution. Divergence is a bug.
