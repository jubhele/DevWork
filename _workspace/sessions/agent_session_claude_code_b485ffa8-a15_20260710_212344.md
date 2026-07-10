# Session: Constitution-enforced Claude Code session
Date: 2026-07-10
Provider: Claude Code
Model: Unknown
Project: _workspace
Project Root: C:\DevWork\_workspace

## Goal
Populate the OHS Act Annexure 2 "Notification of Construction Work" template (BlackFire\Notification of Construction Work.pdf) with real company/site details and produce two separate filled PDFs: one for Astute Insights (Pty) Ltd and one for BlackFire Solutions, sourced from Safety File SAF-120326-0001, the BlackFire Portal DB seed scripts, the AECI Letter of Good Standing, and a web lookup for AECI Chempark's physical address.

## Model Recommendation
Task tier: 2-Medium (multi-file research across SQL seed/config files + PDF/document generation, no complex architecture or security reasoning)
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: Sonnet 5  Status: correct — tier-2 medium research+generation task matched appropriately, no downgrade/upgrade needed.

## Decisions
- Session created automatically by the SessionStart enforcement hook.
- Sourced Compensation Fund registration number (990001546133) from the official Dept. of Labour Letter of Good Standing PDF the user supplied, rather than a seed/test COID number (8842311) found in SQL test data — flagged the test value explicitly instead of using it.
- Sourced client (AECI Chempark) contact/address from `bf_clients` table seed (`clients_migration.sql`) plus a live web search, since the DB record only had a partial address ("Modderfontein, Gauteng") — corrected to the verified street address (200 Bergrivier Drive, Chloorkop Ext. 24, Kempton Park, 1619) via WebSearch.
- Used Safety File SAF-120326-0001 seed/migration SQL (`blackfire_testdata_part2.sql`, `fix_saf_120326_0001_personnel.sql`) as the source of truth for site personnel (Sibulelo Mtolo — Construction Supervisor) and scope of work, since these install scripts are what actually populate the live DB tables (confirmed schema has no additional undisclosed columns).
- Per explicit user instruction, made the BlackFire Solutions document stand fully on its own: removed the "(trading name of Astute Insights (Pty) Ltd, Reg No. 2021/964381/07)" disclosure from field 1.a and updated fields 12/13 to name BlackFire Solutions (not Astute Insights) as the contractor of record on that copy.
- Left fields with no verifiable source (commencement/completion dates, male/female headcount split, Construction Supervisor's phone number, Designer fields) explicitly marked rather than fabricated.

## Work Done
- Read `BlackFire\Notification of Construction Work.pdf` (Annexure 2 template) to capture the exact field structure.
- Created `BlackFire\Clients\OHS Notifications\Notification_of_Construction_Work_Astute_Insights.md` and `...BlackFire_Solutions.md` — markdown mirrors of the form, populated per company.
- Generated `Notification_of_Construction_Work_Astute_Insights.pdf` and `Notification_of_Construction_Work_BlackFire_Solutions.pdf` via the make-pdf skill/binary (`~/.claude/skills/gstack/make-pdf/dist/pdf`), iterated several times as new source data (COID number, AECI address, wording cleanup, BlackFire-standalone edit) came in.
- Backed up the prior BlackFire Solutions `.md`/`.pdf` to `BlackFire\Clients\OHS Notifications\_backups\..._backup_20260710_212419.*` before the final entity-name/reg-number edit (constitution §7a).
- Discovered and worked around a make-pdf/browse sandbox limitation: output paths containing a space in the directory name (`OHS Notifications`) are rejected ("Path must be within: ..."); workaround is to render to the session scratchpad first, then copy into the spaced destination path.

## Agent Accountability

| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|
| OHS-NOTIF-001 | Usiba (document generation) | Claude Code (acting as Mlawuli) | COMPLETED | 5 | Two filled Annexure 2 PDFs produced and iteratively corrected per user feedback (COID no., AECI address, wording trims, BlackFire-standalone identity) |

## Blockers / Next Steps
- Still missing and left blank in both PDFs: expected commencement date, expected completion date, and male/female headcount split (Total: 5 known, gender split not on file).
- Construction Supervisor (Sibulelo Mtolo)'s phone number not on file.
- Designer fields marked "Not applicable" (electronic-security scope, no professional Designer appointed) — confirm with user if this framing is acceptable for DoL submission.
- User to supply the outstanding values so the forms can be finalized before submission to the Department of Labour.

## Learnings
- make-pdf's underlying `browse pdf` sandbox check rejects destination paths containing a space in a directory component even when the path is under an allowed root (`c:\DevWork\...\OHS Notifications\...` failed; the same file rendered fine to the session scratchpad). Workaround: generate to scratchpad, then `cp` into the spaced final path. Worth remembering for any future BlackFire deliverable folder with spaces in its name.
- For BlackFire/Astute company registration facts (COID/CF reg no., legal vs. trading name, registered address), the authoritative source is the actual Dept. of Labour Letter of Good Standing document, not the SQL seed/test data or `config.php` — the config.php address was close but not exactly what the government certificate shows; prefer the certificate when the two disagree.
- When a document must represent BlackFire Solutions as its own contractor of record (e.g., client-facing legal/compliance forms), don't leak the "trading name of Astute Insights (Pty) Ltd, Reg No. ..." parenthetical or attribute contractor fields to Astute Insights — keep the two entities' paperwork fully separate unless the user asks otherwise.

## Goal Status
PENDING
