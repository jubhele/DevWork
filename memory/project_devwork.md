---
name: project-devwork
description: DevWork's role as the template/control-plane repo, not an application repo
metadata:
  type: project
---

DevWork (`c:\DevWork`) is the workspace root that carries the multi-agent workforce constitution, provider mirrors (CLAUDE.md/AGENTS.md/copilot/cursor), shared agent system prompts (`agents/`), shared tooling/scripts, and cross-project control-plane material (`_workspace/`). It holds no project application source code and no project-specific CI/CD (see `Multi-Agent Workforce Architecture & System Prompts.md` §1.1, §9.8).

Actual project repos live as sibling roots under `c:\Projects\` (Astute, BlackFire, GovTender, Homolemo In Europe, ilahle-portal, JS_Resume), each with its own independent `.git`. `_workspace/project-registry.json` (if present) is the source of truth mapping project names to their real root paths.

**Why:** loose application files (BlackFire dashboard/task/schema/portal source) were previously found sitting directly in the DevWork root, violating this separation — they were archived to `_workspace/temp/root-cleanup-2026-08-05/` on 2026-08-05 after confirming each had a canonical, differing counterpart already in `C:\Projects\BlackFire`.

**How to apply:** any new file at the DevWork root that is project-specific application code (not shared tooling/config/docs) is a violation — it belongs in the owning project's repo under `c:\Projects\<name>`, not here.
