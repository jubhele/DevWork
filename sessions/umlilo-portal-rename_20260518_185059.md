# Session: Umlilo Portal Rename & Encoding Fix
Date: 2026-05-18
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Rename the BlackFire portal to "Umlilo", replace all "izilo" references with "umlilo" everywhere, fix extensive Unicode mojibake (triple-encoded UTF-8 via cp1252) across portal.php, remove the install folder, update the company phone number to +27 68 912 6581, and update the DB username to blackfm6w9f9_umlilo_admin.

## Model Recommendation
Task tier: 2-Medium (multi-file edit + encoding fix)
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: Sonnet 4.6  Status: correct

## Decisions
- **Encoding fix approach**: portal.php had triple-encoded UTF-8 (UTF-8 bytes read as cp1252 twice, each time re-encoded as UTF-8). Simple decode-chain reversal failed due to undefined cp1252 bytes (e.g. 0x90). Used direct byte-pattern replacement: calculated exact garbled byte sequences for each target character (═, →, ↗, ✕, ✓, 🔒, 🔥, −, …, ⚠, ■) and replaced them.
- **config.php**: Had double-encoded UTF-8. Single cp1252 decode round fixed the text; decorative comment dividers that became replacement chars were replaced with clean ═ chars.
- **DB username**: blackfm6w9f9_izilo → blackfm6w9f9_umlilo_admin (user confirmed the full name).
- **Company phone**: +27 (0) 11 000 0000 → +27 68 912 6581 (updated in all locations: footer, contact page, PHP config, document templates).
- **install folder**: Removed entirely; deployment via GitHub going forward.

## Work Done
- `portal.php` — fixed triple-encoded Unicode (3581 ═, 7 →, 6 ■, 23 ✓, 3 ✕, 1 🔒, 1 🔥, 1 −, 3 …, 1 ⚠); renamed to Umlilo Portal; updated all phone numbers
- `config\config.php` — fixed double-encoded Unicode; db_user → blackfm6w9f9_umlilo_admin; company_phone → +27 68 912 6581; app_name → Umlilo Portal
- `api\*.php`, `includes\*.php`, `index.php` — izilo → umlilo name replacement
- `install\` folder — removed

## Blockers / Next Steps
- The install/schema.sql and seed SQL data should be loaded to the hosting DB manually (or via GitHub Actions) before first deployment.
- The .env file still needs BF_DB_USER set to the actual cPanel DB username for production.

## Learnings
- Triple cp1252 encoding (UTF-8 bytes → cp1252 → UTF-8 → cp1252 → UTF-8) is best fixed with direct byte-pattern replacement rather than algorithmic decode reversal, because undefined cp1252 positions (0x90, 0x9D) break the encode→decode chain.
- config.php had only double encoding (one round of cp1252 fix sufficed).
- Files written by PowerShell 5.1 with a UTF-8 BOM prepended but cp1252 body bytes are the source of this class of corruption.
_Session ended: 2026-05-18 20:46:29 (Claude Code / claude-sonnet-4-6)_
