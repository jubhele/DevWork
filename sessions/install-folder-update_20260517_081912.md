# Session: Install folder update and docs alignment
Date: 2026-05-17
Provider: GitHub Copilot
Model: Raptor mini (Preview)

## Goal
Update the BlackFire Portal install folder so install assets, helper scripts, and docs consistently use the current `bf_users` schema instead of legacy `users` references.

## Model Recommendation
Task tier: 1-Fast
Recommended model: GPT-4o-mini  Trust score: 8/10
Active model: Raptor mini (Preview)  Status: correct

## Decisions
- Used the current workspace install schema and portal table naming as the source of truth.
- Kept `bf_users` as the canonical user table and updated docs/scripts to match it.

## Work Done
- `BlackFire/BlackFire Portal/install/README_HASHES.md` — replaced legacy `users` SQL examples with `bf_users` and updated the backup command.
- `BlackFire/BlackFire Portal/install/HASH_GENERATION.md` — replaced stale `users` references, updated seed script guidance to `bf_users`, and aligned the UPDATE/SELECT examples.
- `BlackFire/BlackFire Portal/install/generate_bcrypt_hashes.php` — updated instructions to reference `bf_users` and `password_plain` removal guidance.
- `BlackFire/BlackFire Portal/install/generate_bcrypt_hashes.py` — updated instructions to reference `bf_users` and validated Python syntax.
- `BlackFire/BlackFire Portal/install/blackfire_aeci_seed.sql` — converted the legacy `users` table definition and insert data to `bf_users`, updated foreign key refs, and fixed verification comments.

## Blockers / Next Steps
- [ ] Confirm whether `install/blackfire_aeci_seed.sql` should remain in the repo as a legacy compatibility script or be removed/renamed.
- [ ] Optionally run a database install test against `install/schema.sql` and the updated seed file to verify schema/seed compatibility.

## Learnings
- The install folder contained mixed legacy and current schema references; documentation needed to be updated to avoid accidental `users` table misuse.
- The current portal runtime uses `bf_users`, so all install helper tools must follow that naming to stay consistent.
