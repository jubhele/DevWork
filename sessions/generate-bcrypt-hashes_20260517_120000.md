# Session: generate-bcrypt-hashes
Date: 2026-05-17
Provider: GitHub Copilot
Model: GPT-5 mini

## Goal
Generate bcrypt hashes for the 8 plain-text portal user passwords found in `BlackFire_Portal_AECI_v9.html` and record the results and next steps.

## Model Recommendation
Task tier: 1 - Fast / Cheap
Recommended: GPT-4o-mini (OpenAI) — Trust score: 8/10
Active: GPT-5 mini (over-powered for this task)

## Decisions
- Used bcrypt with cost (rounds) = 12 for secure password hashing.
- Did not overwrite existing seed placeholders automatically; left update of seed SQL as an explicit next step.
- Generated distinct bcrypt hashes even for identical plain-text passwords (bcrypt salt differs per hash).

## Work Done
- Ran a local Python snippet (venv) and installed the `bcrypt` package in the workspace environment.
- Generated bcrypt hashes for these accounts:
  - admin / manager (`BlackFire2026!`): two distinct hashes produced
  - calllog (`CallLog2026!`)
  - jtech (`JTech2026!`)
  - stech (`STech2026!`)
  - support (`Support2026!`)
  - clerk (`Clerk2026!`)
  - viewer (`view2026`)
- Created this session log at `c:\DevWork\sessions\generate-bcrypt-hashes_20260517_120000.md`.

Hashes (bcrypt, cost=12):
- admin -> $2b$12$GObkAoM6PutMH/rMXM2w/e6FKwHRxGFNT4Q2JAqeGMspw0/0dHj2y
- manager -> $2b$12$ORYd/iX/9pY7aJ4YkSidJuGHUpmAb34UcSu30oIVzhPdLwmOmZzEW
- calllog -> $2b$12$/dJc/XSc8klm3lh9q/9DDeuI.QnFqxz/VjjixS6ENRB81SgNP4jgy
- jtech -> $2b$12$4HlZgBnEmAjCf1NT7B6Ptu9qmRpBS37l8eCCWPpCzS8HwDJzY5bn6
- stech -> $2b$12$S8lM.nbPKl7zuLLntraFm.4cEwkqRd/ZxRk/ubbnoWaNKXuS8V1RC
- support -> $2b$12$1To3GwE/QYFWJxAQ.U1S4eZiUkcQPlAq7k5dWSTrXqkcbySLZKSke
- clerk -> $2b$12$xIywBsD3Hz.0gybgfyqXp.PvMd5z61d5lrjVH9SzyO4qiPyRAMygq
- viewer -> $2b$12$e9MjGuEddLoMjGDZAhX/6uJWAPTffI.WYYZUudb8beGcMdY5gl1gO

## Blockers / Next Steps
- Option A: Replace the `REPLACE_WITH_BCRYPT` placeholder values in `install/blackfire_aeci_seed.sql` with these hashes. (I can do this now if you want.)
- Option B: Update `install/schema.sql` / `blackfire_aeci_seed.sql` to insert password hashes using a safe deploy process; ensure production secrets are regenerated and not seeded with plain-text values.

## Learnings
- The HTML had plain-text passwords in the `USERS` array; the repository also includes `install/blackfire_aeci_seed.sql` which used `REPLACE_WITH_BCRYPT` placeholders. Generating bcrypt hashes locally and storing them in the seed makes offline installs easier, but be careful not to commit real secrets for production.


-- End of session log
_Session ended: 2026-05-17 10:57:14 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-05-17 11:04:19 (Claude Code / claude-sonnet-4-6)_
