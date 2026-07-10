# Memory Index

- [Remote Job Search Profile](project_remote_job_search.md) — Jubhele targets fully remote senior data engineering/data governance work at R700/hour (flexible); application PII uses private `JB_*` variables and employer-primary pages must verify every role

- [gstack Windows Build](project_gstack_windows.md) — Bun package scripts on Windows reject subshell-plus-redirection; write build version files through TypeScript and verify setup builds under Git Bash

- [BlackFire Portal QA Rules](project_blackfire_portal_qa.md) — Browser-verified single-scroll navigation, lazy-image geometry, floating control, Next.js public asset, and service-count constraints
- [BlackFire Portal Layout Strategy](project_blackfire_portal_layout_strategy.md) — Power BI is the layout reference; the same tokens and responsive hierarchy must be implemented separately in PHP, Next.js, and mobile

- [BlackFire / AECI Project](project_blackfire_aeci.md) — 7 branded .docx proposals for AECI Chempark; all completed 2026-05-16; files at BlackFire\Clients\AECI\; generator at Clients\AECI\generate_docs.ps1
- [AECI Vendor Structure](project_aeci_vendors.md) — 3 active vendors: BlackFire (monitoring), tactical reaction provider (R6k/month flat, all dispatches), separate physical guard company; ad-hoc drone fourth; physical guards' role in proposed model unconfirmed
- [Word COM Automation Fixes](feedback_word_com_automation.md) — Critical PS5.1 COM pitfalls: [char] escapes for non-ASCII, RGB formula, InlineShape resize broken (use Shapes.AddPicture), SaveAs2 syntax, A4 page size, cursor reset after header setup
- [Workspace Constitution Setup](project_workspace_constitution.md) — Git repo at c:\DevWork, gstack installed, session logging, provider-agnostic CLAUDE.md/AGENTS.md/Copilot/Cursor mirrors
- [Local AI Models](project_local_ai_models.md) - Ollama is installed system-wide; Gemma 4 compact instruction model `gemma4:e2b-it-qat` installed and smoke-tested 2026-06-28
- [Workspace Behavioral Rules](feedback_workspace_rules.md) — Backup-before-change (timestamped), artifacts in folders, temp/ for scratch files, session logs mandatory
- [Model Selection Trust Scores](feedback_model_selection.md) — Tier 1/2/3 model matrix with trust scores (0-10) across Claude/OpenAI/Google; update via /learn after sessions
- [Decision Tracking in Session Logs](feedback_decision_tracking.md) — Preserve ALL decisions chronologically, including superseded ones; use Phase labels; never delete prior entries
- [No Demo Language in Portal](feedback_no_demo_language.md) — Never use "demo" for pages, files, labels, or data in BlackFire portal; pilot phase with real-life datasets
- [Umlilo Portal — Next.js + Expo monorepo](project_umlilo_portal.md) — Now absorbed into the BlackFire repo as `c:\DevWork\umlilo-portal\` normal tracked files; former nested `.git` backed up; Vercel: umlilo-portal.vercel.app; PHP backend stays on Afrihost
- [Confirmed Users Only in Seed Data](feedback_confirmed_users_only.md) — Never infer portal users from partial refs; only add users confirmed by signed source docs; 4 confirmed AECI users: j.shange, z.myeza, sibu, penny.nzimande
- [Portal Multi-Tenancy Plan](project_portal_multitenancy.md) — Future: support multiple host companies; plan at BlackFire Portal/docs/plan_multi_tenancy.md; Phase 0 rules active now (host_company_id DEFAULT 1 on all new tables)
- [Architecture Recommendations](project_architecture_recommendations.md) — BlackFire arch recommendations doc folded into master guide §17 (v3.5.1); aspirational, not yet implemented in agent-v3.ps1
- [Multi-Agent Workforce](project_multiagent_workforce.md) — 12 agents: Sibali+Mlawuli (governance), 10 Sebenza; QA split 2026-07-08 into Mvavanyi (functional)/Umcwaningi (code)/Umbheki (UX/UI); worker-*.ps1 are disabled legacy stubs, agent-v3.ps1 is the live runtime
- [Workspace Secret Vault](project_workspace_secret_vault.md) — Root `C:\DevWork\.env` is the source of truth; app-local `.env` files are mirrors; keep cPanel, email, Git deploy, and provider-registration credentials in the root vault, with encryption flags where supported
- [Workspace Secret Sync Script](project_workspace_secret_sync.md) — `scripts/sync-workspace-secrets.ps1` copies `C:\DevWork\.env` into app mirrors; BlackFire `start-local.ps1` now syncs before launching the dev server
- [Workspace Secret Encryption](project_workspace_secret_vault.md) — `GBL_SECRET_MASTER_KEY_B64` drives portable full-vault encryption and offline recovery exports
- [Workspace Secret Master Key](project_workspace_secret_vault.md) — restore accepts a separate exported key file and preserves the offline encrypted input
- [Workspace Secret Mirrors](project_workspace_secret_sync.md) — BlackFire receives `BF_*`, Astute Insights receives `AI_*`, and `GBL_*` remains root-only
