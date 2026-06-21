# DevWork Workspace Constitution

> This constitution governs all AI agents operating in this workspace regardless of provider
> (Claude Code, GitHub Copilot, OpenAI Codex, Cursor, Google Antigravity, Kiro, Factory Droid, etc.).
> Provider-specific instructions never override this document.

---

## 1. Session Logging (MANDATORY)

Every session **must** create or update a session log. This is non-negotiable.

**Log location**: `c:\DevWork\sessions\`
**Format**: `<chat-name>_YYYYMMDD_HHmmss.md` — one file per session, named after the chat topic with a timestamp suffix.

**Mirror**: After writing or updating a session log, copy it to `G:\My Drive\JS\Agentic AI\sessions\` with `.tbl.bk` appended to the filename.
Example: `donthok_competitive_intel_20260519_222000.md` → `G:\My Drive\JS\Agentic AI\sessions\donthok_competitive_intel_20260519_222000.md.tbl.bk`

PowerShell one-liner to mirror a file:
```powershell
Copy-Item "c:\DevWork\sessions\<filename>.md" "G:\My Drive\JS\Agentic AI\sessions\<filename>.md.tbl.bk" -Force
```

### Session log structure

```
# Session: <topic>
Date: YYYY-MM-DD
Provider: <Claude Code | GitHub Copilot | OpenAI Codex | Google Antigravity | Cursor | Kiro | Other>
Model: <model name>

## Goal
<one paragraph — what was attempted>

## Model Recommendation
Task tier: <1-Fast | 2-Medium | 3-Complex>
Recommended model: <name>  Trust score: <X>/10
Active model: <name>  Status: <correct | over-powered | under-powered>

## Decisions
- <key decision and why>

## Work Done
- <file changed> — <what changed>

## Blockers / Next Steps
- <anything left incomplete or requiring follow-up>

## Learnings
- <MANDATORY — fill before ending session>
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
├── AGENTS.md                   ← Mirror for OpenAI Codex + Google Antigravity
├── .github/
│   └── copilot-instructions.md ← Mirror for GitHub Copilot
├── .cursor/
│   └── rules/
│       └── constitution.mdc    ← Mirror for Cursor
├── .gitignore
├── .env                        ← Secrets (NOT in repo — in .gitignore)
├── .env.example                ← Template with all keys, empty values (IN repo)
├── sessions/                   ← Session logs (all providers)
├── chatsessions/               ← Legacy Copilot transcript archive
├── agents/                     ← Multi-agent workforce definitions
│   ├── sibali_system_prompt.md       ← Sibali (Accountant) — cost governance
│   ├── mlawuli_system_prompt.md      ← Mlawuli (Controller) — supervisor
│   ├── umdwebi_system_prompt.md      ← Umdwebi (Artist) — design & brand
│   ├── mvavanyi_system_prompt.md     ← Mvavanyi (Tester) — QA & testing
│   ├── umlindi_system_prompt.md      ← Umlindi (Guardian) — governance & compliance
│   └── sebenza_agents.md             ← All 8 Sebenza agent definitions
├── design/                     ← Umdwebi's domain — brand tokens, design exports
│   ├── blackfire/
│   │   ├── brand_tokens.md         ← BlackFire color, typography, logo specs
│   │   └── exports/                ← Claude.ai, Canva, Figma exports
│   ├── umlilo/                     ← Umlilo portal brand
│   └── imports/                    ← Cross-project design imports
├── .claude/
│   └── skills/gstack/          ← gstack multi-agent toolkit
├── cybersecurity-skills/       ← 754 cybersecurity skills (git submodule: mukul975/Anthropic-Cybersecurity-Skills)
│   ├── skills/                 ← individual skill directories (each with SKILL.md)
│   ├── index.json              ← full skill index with framework mappings
│   └── mappings/               ← MITRE ATT&CK, NIST CSF, D3FEND, ATLAS, AI RMF, F3 cross-refs
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

## 4a. Cybersecurity Skills Library

754 production-grade cybersecurity skills are available at `c:\DevWork\cybersecurity-skills\skills\`.
Managed as a git submodule (`mukul975/Anthropic-Cybersecurity-Skills`, Apache 2.0).
Update with: `git submodule update --remote cybersecurity-skills`

**Each skill** is a directory containing a `SKILL.md` with:
- YAML frontmatter: name, description, domain, tags, and framework IDs
- Structured Markdown: Overview, When to Use, Prerequisites, Step-by-step execution, Verification

**Framework mappings** in frontmatter:
| Key | Framework | Example ID |
|-----|-----------|-----------|
| `mitre_attack` | MITRE ATT&CK v19.1 | `T1071.001` |
| `nist_csf` | NIST CSF 2.0 | `DE.CM-01` |
| `mitre_atlas` | MITRE ATLAS v5.4 (AI threats) | `AML.T0047` |
| `mitre_d3fend` | MITRE D3FEND v1.3 | `D3-NTA` |
| `nist_ai_rmf` | NIST AI RMF 1.0 | `MEASURE-2.6` |
| `mitre_f3` | MITRE F3 v1.1 (Financial fraud) | `F1005.006` |

**How to use a skill:**
1. Find it by keyword: `ls c:\DevWork\cybersecurity-skills\skills\ | grep <keyword>`
2. Or find by ATT&CK ID: search SKILL.md frontmatter for the technique ID
3. Read the `SKILL.md` and follow its step-by-step execution section
4. Use `/cybersec-skill <topic>` if the slash command is installed

**Security domains covered (26):** web security, pentesting, DFIR, threat intelligence, cloud security, malware analysis, network forensics, OSINT, red team, blue team, incident response, compliance (CMMC, SOC 2, ISO 27001), OT/ICS, mobile, API security, devsecops, vulnerability management, identity & access, data loss prevention, and more.

**Umlindi uses this library** when conducting governance/compliance reviews — route security task requests through Umlindi (§12.2).

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
- **Reflect** *(MANDATORY)*: Before ending the session, persist learnings to memory:
  - **Claude Code**: run `/learn` — it reads the session log and updates memory automatically.
  - **All other providers**: manually add a `## Learnings` section to the session log and update relevant memory files in `memory/`.
  - Either way, the session log **must** contain a `## Learnings` section before the session closes.
  - If the active model trust score diverged from expectation, update § 11 scores now.

---

## 6. Cross-Provider Handoff

When switching providers mid-session:

1. Commit any in-progress work with a `WIP:` prefix.
2. Update the session log with current state and next steps.
3. The receiving provider must read the session log before continuing.
4. Reference the `[gstack-context]` commit body format for structured handoffs.

### 6.1 Constitution Propagation

When the constitution or multi-agent architecture is copied into a repo or updated for a user:
1. Inspect the target workspace/repo for `CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md`, `.cursor/rules/constitution.mdc`, nested `AGENTS.md`, `agents/`, `docs/`, `sessions/`, `memory/`, `.env.example`, and `.gitignore`.
2. Apply missing mandatory rules locally.
3. Preserve stricter project-specific overrides.
4. If the inspection reveals a generic improvement, update the architecture guide so future repos receive it.
5. Re-copy the updated guide into the target repo and rerun the mirror audit.

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

## 7d. New Environment Setup — Installs

**Workspace model:** `c:\DevWork` is the global workspace root. Each subfolder is a project. All tooling is installed at the machine or workspace level — never scoped to a single project subfolder.

### VS Code Extensions — Global Install

Open `c:\DevWork` in VS Code (not a subfolder) — it will prompt *"Install recommended extensions?"* → click **Install All**.
Extensions are installed at VS Code user level (global), available across all projects.

Or install manually:

```powershell
code --install-extension anthropic.claude-code `
     --install-extension openai.chatgpt `
     --install-extension ms-vscode.powershell `
     --install-extension ms-python.python `
     --install-extension ms-python.vscode-pylance `
     --install-extension ms-python.debugpy `
     --install-extension ms-python.vscode-python-envs `
     --install-extension formulahendry.vscode-mysql `
     --install-extension ms-mssql.mssql `
     --install-extension ms-mssql.data-workspace-vscode `
     --install-extension ms-mssql.sql-database-projects-vscode `
     --install-extension ms-mssql.sql-bindings-vscode `
     --install-extension ms-dotnettools.vscode-dotnet-runtime `
     --install-extension tomoki1207.pdf
```

Full list with descriptions: `.vscode/extensions.json` and architecture doc §4.1a.

### Runtime Tooling — Machine-Level

All runtimes on system PATH. No project-scoped installs.

| Tool | Version | Scope | Used by |
|------|---------|-------|--------|
| Node.js LTS + pnpm | latest LTS | System PATH | Umlilo portal (Next.js/Expo) |
| PHP | 8.x | System PATH (`C:\php`) | BlackFire Portal (PHP/MySQL) |
| Python | 3.10+ | System PATH + workspace venv at `c:\DevWork\.venv` | All agent scripts |
| PowerShell | **5.1 only** | Built into Windows | Usiba document generation (COM automation) |
| Git | latest | System PATH | All version control |

**Python workspace venv** — create once, shared by all projects:
```powershell
python -m venv C:\DevWork\.venv
C:\DevWork\.venv\Scripts\Activate.ps1
pip install anthropic python-dotenv requests
```

VS Code picks up the shared interpreter automatically via `.vscode/settings.json` (`python.defaultInterpreterPath`).

After installing: copy `.env.example` → `.env` and fill in real values (see §8).

---

## 8. Sensitive Data Policy

**Nothing is ever hardcoded. All secrets, API keys, passwords, and environment-specific values live in `.env` only.**

### 8.1 The Two-File Rule

| File | In repo? | Purpose |
|------|---------|---------|
| `.env` | **NO** — in `.gitignore` | Real values for the active environment |
| `.env.example` | **YES** — committed | Template: all keys with empty values |

Copy `.env.example` → `.env` on first setup. Never commit `.env`.

### 8.2 Reading Environment Variables

- **PHP:** `getenv('KEY')` or `$_ENV['KEY']`
- **Python:** `os.getenv('KEY')` after `load_dotenv()`
- **Node.js/Next.js:** `process.env.KEY` after `dotenv.config()`
- **PowerShell:** parse `.env` manually — see `agents/sebenza_agents.md` (Usiba patterns)

### 8.3 Known Sensitive Paths (never commit)

- `.env` — root workspace secrets
- `chatsessions/*.jsonl` — may contain plain-text passwords
- `BlackFire/BlackFire Portal/install/blackfire_aeci_seed.sql`
- `BlackFire/BlackFire Portal/.env`
- Any `*.env`, `config.local.*`, `*.env.local` files

### 8.4 Hardcoded Credential Detection

Umlindi runs this check pre-deploy. Any agent can run it on demand:

```bash
grep -rn --include="*.php" --include="*.js" --include="*.ts" --include="*.py" \
  -E "(password|api_key|secret|token)\s*=\s*['\"][^'\"]{8,}" . \
  --exclude-dir=node_modules
```

Any hit is a CRITICAL governance violation. Move the value to `.env` immediately.

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
- **Google Antigravity (Jules)** — reads `AGENTS.md`
- **Cursor** — reads `.cursor/rules/constitution.mdc`
- **Kiro** — reads `.kiro/steering/*.md` (4 steering files)
- **Factory Droid** — reads `.factory/config.yaml` + `AGENTS.md`
- **Others** — read `AGENTS.md` as fallback

All providers follow the same constitution. Divergence is a bug.

---

## 11. Sibali — Cost / Token Management Agent (MANDATORY)

**Zulu name:** Sibali *(The Accountant/Calculator)*
**System prompt:** `agents/sibali_system_prompt.md`

Every session **must** assess whether the current model is the right one for the task.
This is not optional — running an over-powered model on trivial work wastes budget;
running an under-powered model on complex work wastes time and produces poor output.

### 11.1 Task Tiers

| Tier | Label | Signal words | Examples |
|------|-------|-------------|---------|
| 1 | **Fast / Cheap** | quick, lookup, format, rename, fix typo, summarise short text | Single-file edits, Q&A, grep/search, formatting, simple rewrites |
| 2 | **Medium** | plan, review, multi-file, analyse, debug, draft, explain | Code review, multi-file refactor, document drafts, planning sessions |
| 3 | **Complex** | architect, security, reasoning, research, design, multi-step, generate | System design, security audits, long-form generation, cross-repo reasoning |

### 11.2 Model Trust Matrix

Higher trust score = more reliable for that tier. Scores are 0–10.

| Provider | Tier 1 – Fast | Score | Tier 2 – Medium | Score | Tier 3 – Complex | Score |
|----------|--------------|-------|----------------|-------|-----------------|-------|
| **Claude** | Haiku 4.5 | 9 | Sonnet 4.6 | 9 | Opus 4.7 | 10 |
| **OpenAI** | GPT-4o-mini | 8 | GPT-4o | 8 | o3 / o1 | 9 |
| **Google** | Gemini Flash 2.0 | 7 | Gemini 1.5 Pro | 8 | Gemini 2.5 Pro | 9 |
| **Codex CLI** | — | — | codex (default) | 7 | codex + reasoning | 8 |

Trust scores reflect: reasoning depth, instruction-following, tool-use reliability,
and observed output quality in this workspace. Update via `/learn` when experience diverges.

### 11.3 Agent Behaviour

At **conversation start** the agent must:

1. Read the user's first message and classify it into Tier 1 / 2 / 3.
2. Identify the model currently in use (from session context or environment).
3. If the active model is **not** the recommended tier model, output a recommendation block:

```
┌─ Model Advisor ──────────────────────────────────────────────────────┐
│ Task tier:   <1-Fast | 2-Medium | 3-Complex>                        │
│ Recommended: <model name>   Trust score: <X>/10                     │
│ Active:      <current model>  (over/under-powered for this task)    │
│ Switch with: /model <recommended> — or proceed with current model   │
└──────────────────────────────────────────────────────────────────────┘
```

4. Log the recommendation in the session log under a `## Model Recommendation` sub-section.
5. If the model is already correct, log it silently — no output block needed.

### 11.4 Cost Guidance

| Tier | Target cost per session |
|------|------------------------|
| 1 – Fast | < $0.05 |
| 2 – Medium | $0.05 – $0.50 |
| 3 – Complex | $0.50 – $5.00 |

If a session is trending over budget for its tier, the agent should flag it inline:
`⚠ Cost alert: ~$X used so far — consider switching to a lower tier or batching remaining work.`

### 11.5 Updating the Trust Matrix

This happens during the mandatory **Reflect** step (§ 5) at session end — not optionally later.

If a model performed notably better or worse than its trust score predicted:
- **Claude Code**: run `/learn` — it will update `memory/feedback_model_selection.md` automatically.
- **All other providers**: manually edit `memory/feedback_model_selection.md` and add an entry:

```
Model: <name>  Tier: <1|2|3>  Observed score: <X>/10
Why: <what happened — good or bad>
```

The `## Learnings` section in the session log must record whether scores were updated or confirmed unchanged.

---

## 12. Multi-Agent Workforce

This workspace runs a named, role-separated agent workforce. All agent system prompts live in `agents/`.

### 12.1 Full Agent Roster

**Governance tier** (always active):

| Zulu Name | English Meaning | Role | System Prompt |
|-----------|-----------------|------|---------------|
| **Sibali** | The Accountant/Calculator | Cost governance & session log indexing | `agents/sibali_system_prompt.md` |
| **Mlawuli** | The Controller/Administrator | Supervisor — routes tasks, manages lifecycle | `agents/mlawuli_system_prompt.md` |

**Sebenza agents** *(from ukusebenza: to work)* — specialized executors:

| Zulu Name | English Meaning | Role | Hard Cap |
|-----------|-----------------|------|----------|
| **Nkanyezi** | Star — illumination, new ideas | Content & proposals | 3 |
| **Usiba** | Feather / Pen | Document generation | 2 |
| **Mhloli** | Explorer / Inspector | Research, competitive intel, threat modelling | 5 |
| **Umakhi** | The Builder | Code & portal development | 3 |
| **Umdwebi** | The Artist / Draughtsperson | Brand identity, UI/UX design | 2 |
| **Mvavanyi** | The Evaluator / Tester | QA, testing, regression | 3 |
| **Umlindi** | The Guardian / Watchman | Governance, compliance, policy enforcement | 2 |

Full definitions: `agents/sebenza_agents.md`
Individual system prompts: `agents/{name}_system_prompt.md`

### 12.2 Routing Logic

When Claude Code is acting as the sole active agent, it fulfils Mlawuli's role internally.
When multiple AI providers are active simultaneously, Mlawuli is the designated supervisor:

| Task domain | Sebenza agent |
|-------------|--------------|
| Content / narrative / proposals | Nkanyezi |
| Document generation / scripting | Usiba |
| Research / competitive intel / threat modelling | Mhloli |
| Code / portal / database / API | Umakhi |
| Brand / design / UI / UX | Umdwebi |
| QA / testing / regression / functional verification | Mvavanyi |
| Policy compliance / governance / security posture | Umlindi |

All payloads pass through Sibali (cost clearance) before reaching any Sebenza agent.
Umlindi audits Umakhi's changes pre-deploy. Mvavanyi tests Umakhi's output before release.

### 12.3 Claude Code as Mlawuli

When operating as the primary agent (default mode), Claude Code:
1. Classifies the incoming task and maps it to the correct Sebenza domain (§12.2 routing table).
2. Routes the conceptual payload through Sibali's tier logic (§11.1) before proceeding.
3. Executes the task under the Sebenza agent's constraints (see `agents/sebenza_agents.md`).
4. Logs the session with the JSON metadata block (§13.2) if the task involved inter-agent coordination.

---

## 13. JSON Communication Protocol

When multiple agents are active, all inter-agent messages use strict JSON. No conversational text.

### 13.1 Hard Cap Rule

Each Sebenza agent has a maximum iteration budget before it must escalate to Mlawuli:

| Sebenza Agent | Max iterations |
|---------------|---------------|
| Nkanyezi | 3 |
| Usiba | 2 |
| Mhloli | 5 |
| Umakhi | 3 |
| Umdwebi | 2 |
| Mvavanyi | 3 |
| Umlindi | 2 |

If an agent loop exceeds its cap, Mlawuli terminates the loop and logs `LOOP_TERMINATED`.

### 13.2 Session JSON Metadata Block

Append this block to any session log that involved multi-agent coordination or Sibali routing:

```json
{
  "session_id": "<YYYYMMDD_HHmmss>",
  "agent": "<Nkanyezi | Usiba | Mhloli | Umakhi | Umdwebi | Mvavanyi | Umlindi>",
  "model_endpoint": "<claude-sonnet-4-6 | gpt-4o | etc>",
  "token_metrics": {
    "tokens_in": 0,
    "tokens_out": 0,
    "iteration_count": 0
  },
  "outcome": {
    "status": "SUCCESS | TRUNCATED | BUDGET_EXCEEDED | LOOP_TERMINATED",
    "cost_category": "TIER_1_LOW | TIER_2_MED | TIER_3_HIGH"
  },
  "optimization": {
    "action_taken": "<Summarised context | Trimmed payload | Enforced hard cap | None>"
  }
}
```

### 13.3 Fault Tolerance

If a worker agent crashes, times out, or returns a corrupted payload:
- Mlawuli automatically restarts the agent and retries up to **3 times**.
- After 3 failed attempts, Mlawuli flags a system error and halts the task.
- Each retry is logged with `retry_count` incremented in the JSON metadata block.

### 13.4 Memory Compression Trigger

When a worker agent's context window reaches **70% capacity**:
- Sibali triggers a summarisation routine: drop stale facts, merge duplicates.
- The compressed context is returned as the new payload before the agent continues.
- Log `action_taken: "Summarised context"` in the JSON metadata block.
