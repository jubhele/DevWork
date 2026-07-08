# Goal
Replace the localhost app URL with the live website URL, then make the public-site metadata and related portal URLs derive from the same base so all three links stay consistent.

## Model Recommendation
Task tier: 1-Fast
Recommended model: GPT-4o-mini  Trust score: 8/10
Active model: GPT-5  Status: correct

## Decisions
- Updated `BF_APP_URL` in the workspace vault to the live website domain instead of `http://localhost:8080`.
- Kept the portal shell aligned with that same base URL by deriving `base_url`, `api_base`, and `portal_base_url` from `BF_APP_URL`.
- Switched the public site canonical, Open Graph URL, and JSON-LD URL to use the same computed base URL rather than hardcoded strings.

## Work Done
- Updated [`.env`](C:/DevWork/.env) to set `BF_APP_URL=https://blackfiresolutions.co.za`.
- Updated [`.env.example`](C:/DevWork/.env.example) to show the live website URL and matching API base.
- Updated [`BlackFire Portal/config/config.php`](C:/DevWork/BlackFire/BlackFire%20Portal/config/config.php) so the portal reads `BF_APP_URL` and derives the three shared URL values from it.
- Updated [`BlackFire Portal/portal.php`](C:/DevWork/BlackFire/BlackFire%20Portal/portal.php) so canonical, Open Graph, and JSON-LD metadata all use the computed base URL.
- Verified PHP syntax with `php -l` on the changed PHP files.

## Blockers / Next Steps
- If the mirrored app-local `.env` files are regenerated from the workspace vault, they should pick up the updated website/API URLs automatically.
- The unrelated untracked database backup in `BlackFire Portal/_backups/database/` was left untouched.

## Learnings
- `BF_APP_URL` should represent the live website base, not the local PHP dev server, when the portal metadata and generated links are meant for production.
- Deriving the portal's public-facing URLs from one config source prevents drift between canonical, social preview, and structured-data links.

## Goal Status
PENDING
