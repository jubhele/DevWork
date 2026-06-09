# Session: BlackFire Services Page — Service Card Images
Date: 2026-06-08
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Add category-representative images to the 55 service cards on the BlackFire public Services page (and the portal-interior Services view). Cards currently show only a bullet dot, service name, and category label. Adding a photo header to each card will make the services catalogue more visual and compelling.

## Model Recommendation
Task tier: 2-Medium
Recommended model: Sonnet 4.6  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: correct

## Decisions

### Phase 1 — Picsum Placeholders (superseded)
- Used Picsum Photos with fixed seeds for deterministic placeholder images (8 seeds, one per category)
- Applied a BlackFire brand scrim over each photo to unify look with brand palette
- Image height: 140px; card layout changed from flex-row to flex-column
- **Rejected by user**: "the images you provided do not speak to the text that is currently existing"

### Phase 2 — Custom SVG Illustrations (superseded)
- Replaced Picsum with 8 bespoke SVG illustrations unique to BlackFire
- SVGs used brand palette throughout: `#E05A1A` fire orange, `#0A0E19` ground, `#141B26` surface, `#F07820` amber
- Removed desaturation filter and scrim (would crush SVG brand colours); increased card height to 160px
- **Rejected by user**: "make the images to be real line... the images must be real life"

### Phase 3 — Real Unsplash Photographs (current / final)
- Downloaded 8 real Unsplash photos locally to `images/services/*.jpg` — no external CDN dependency
- Restored photo CSS treatment with softer values: `brightness(0.82) saturate(0.8)` + bottom-only scrim
- Hover: `scale(1.04)` + brightness/saturation lift; preserves photo realism on hover
- Both public `/services` and portal-interior services grid get images automatically (same `buildSvcGrid()`)
- SVG files remain on disk as `*.svg` but are no longer referenced

### Infrastructure Fixes (blocking — resolved before image work could complete)
- PHP 8.4 WinGet install had no `php.ini` — created from `php.ini-development` template; set absolute `extension_dir`; enabled `openssl`, `mysqli`, `pdo_mysql`, `mbstring`, `fileinfo`
- `.env` had `> ` prefix artifact on all 8 secret key values (PowerShell redirect corruption) — stripped via regex replace
- CSP `<meta>` was placed after a JSON-LD `<script>` in `<head>` — browsers require CSP meta before any scripts; moved to 3rd tag in `<head>`

## Work Done

| File | Change |
|------|--------|
| `portal.js` | Added `CAT_IMAGES` map (8 category → local `.jpg` path); updated `buildSvcGrid()` card template to include `<div class="svc-img-wrap"><img ...></div>` header |
| `portal.css` | `.svc-card` → flex-column; added `.svc-img-wrap` (160px height), `.svc-img` (cover + filter), `.svc-img-scrim` (bottom fade), `.svc-card-body` (text area) |
| `portal.php` | Moved CSP meta to 3rd tag in `<head>`, before JSON-LD `<script>` block |
| `.env` | Fixed `> ` prefix on 8 secret keys (BF_APP_KEY, DB_PASS, SMTP_*, etc.) — backed up to `_backups/.env_backup_20260608_231443` |
| `php.ini` (WinGet path) | Created from template; absolute `extension_dir`; enabled 5 PHP extensions |
| `images/services/` | New folder — 8 real Unsplash `.jpg` photos + 8 `.svg` brand illustrations (SVGs superseded, not deleted) |

### Final `CAT_IMAGES` map in `portal.js`:
```js
const CAT_IMAGES={
  'Armed Response':       './images/services/armed-response.jpg',
  'CCTV & Surveillance':  './images/services/cctv-surveillance.jpg',
  'Access Control':       './images/services/access-control.jpg',
  'Guard Services':       './images/services/guard-services.jpg',
  'Electronic Security':  './images/services/electronic-security.jpg',
  'Investigations':       './images/services/investigations.jpg',
  'Risk Management':      './images/services/risk-management.jpg',
  'Event Security':       './images/services/event-security.jpg',
};
```

### Image inventory (`images/services/`):
| File | Size | Subject |
|------|------|---------|
| `armed-response.jpg` | 84 KB | Security response vehicle at night |
| `cctv-surveillance.jpg` | 56 KB | CCTV camera on building exterior |
| `access-control.jpg` | 40 KB | Biometric/keypad access panel |
| `guard-services.jpg` | 46 KB | Uniformed security officer |
| `electronic-security.jpg` | 25 KB | Smart home / alarm device |
| `investigations.jpg` | 29 KB | Investigative / forensic work |
| `risk-management.jpg` | 34 KB | Business risk analysis / boardroom |
| `event-security.jpg` | 79 KB | Crowd at event under blue lights |

## Blockers / Next Steps
- **Event Security photo**: User requested "event security managing the crowd in a professional way" — current photo shows concert crowd under blue lights without visible security staff prominently. Consider replacing with a photo showing uniformed security personnel actively managing a crowd.
- **Electronic Security photo**: Current image (25KB) is a consumer smart home device — may not clearly represent alarm panels, professional sensors, or perimeter electronics. Candidate for a more professional image.
- **Access Control photo**: Circular biometric scanner — adequate but could show a more recognisable access gate or turnstile scenario.
- All three above are content quality issues, not bugs — portal is fully functional with current images.
- SVG files in `images/services/` are orphaned — can be deleted or archived when photos are confirmed final.

## Learnings
- Real photographs beat illustrations for a "real life" feel, but the CSS filter pipeline (desaturation + scrim) can neutralise even distinct photos into a uniform dark look — keep `brightness` >= 0.80 and `saturate` >= 0.80 for photos to stay recognisable.
- PHP WinGet installs ship without `php.ini` — always copy `php.ini-development` to `php.ini` and set an absolute `extension_dir` path on first setup.
- PowerShell `>` redirect can corrupt `.env` files silently — all secret key values had a `> ` prefix; check `.env` integrity after any PowerShell-generated writes.
- CSP `<meta http-equiv="Content-Security-Policy">` must appear before any `<script>` in `<head>` — browsers silently ignore it otherwise. Move it to the very top of `<head>`.
- Unsplash free tier: many top search results are now premium (`plus.unsplash.com` domain) — iterate through several result IDs to find non-premium alternatives.
- Three design iterations (Picsum → SVG → real photos) consumed significant session time — clarify realism/illustration preference with user before starting image work.

_Session ended: 2026-06-08 23:04:57 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-08 23:09:28 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-08 23:12:01 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-08 23:16:15 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-08 23:24:55 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-08 23:34:38 (Claude Code / claude-sonnet-4-6)_
_Session resumed and log completed: 2026-06-08 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-08 23:40:51 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-08 23:41:18 (Claude Code / claude-sonnet-4-6)_

---

## Resumed 2026-06-09

### User Feedback on Current Phase 3 (Unsplash stock photos)

1. **Same image per service is wrong** — `CAT_IMAGES` maps one photo per category, so all 7 Armed Response services show the same car image. Each service card should have its own unique image.
2. **Non-SA context** — stock photos show UK/international security vehicles (wrong licence plate format, foreign livery). All imagery must represent South African context.
3. **Clarification on SVGs** — user asked whether images were AI-generated or hand-crafted. Claude confirmed: the 8 `.svg` files were coded from scratch by Claude Code; the `.jpg` files used in the portal are Unsplash stock photos. SVGs are referenced nowhere in the current portal (portal.js still uses `.jpg` paths).

### Decisions

- **Per-service images required**: switch from `CAT_IMAGES[s.cat]` to a `SVC_IMAGES[s.name]` lookup — 50 entries, one per service.
- **South African context mandatory**: all images must show SA licence plates (GP/CA/KZN/EC formats), SA-branded vehicles, Highveld / urban SA backgrounds. No international security livery.
- **Image format — pending confirmation**: options are (a) 50 bespoke SA-contextual SVG illustrations coded by Claude Code, or (b) use Canva MCP to generate designed images. Claude Code cannot generate photographic images natively.
- **Note on session log discipline**: user flagged that session logs were not being updated consistently at session end. Must be completed before ending every session.

### Phase 4 — Brand Pack Per-Service Images (current)

- User provided `C:\DevWork\BlackFire\BlackFire-Brand-Pack\` — 50 PNG files, one named per service, all SA-contextual (GP-branded vehicles, SA officers, SA residential/industrial settings).
- `1.png` maps to "Armed Response 24/7" (the only file not named after a service).
- Python script (`temp/compress_service_images.py`) batch-compressed all 50 PNGs from 7–15 MB to 36–111 KB JPEG at 900px max width, quality 82, using Pillow in the workspace venv.
- `portal.js` updated: `CAT_IMAGES` (8 category entries) replaced with `SVC_IMAGES` (50 service entries keyed by exact service name).
- `buildSvcGrid()` updated: `CAT_IMAGES[s.cat]` → `SVC_IMAGES[s.name]`; also fixed `alt=""` → `alt="${esc(s.name)}"` for accessibility.
- 50 compressed JPEGs written to `BlackFire Portal/images/services/` alongside the old 8 Unsplash JPGs and 8 SVGs (not deleted — orphaned).

### Blockers / Next Steps

- Old 8 Unsplash JPGs and 8 SVGs in `images/services/` are orphaned — safe to delete when confirmed.
- Verify in browser that all 50 cards show distinct images.
- Session log discipline flagged by user — must complete log before ending every session.

_Session resumed: 2026-06-09 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-09 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-08 23:49:09 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-09 02:11:51 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-09 02:18:35 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-09 02:27:23 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-09 02:31:16 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-09 02:37:29 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-09 02:42:35 (Claude Code / claude-sonnet-4-6)_
_Session ended: 2026-06-09 02:55:16 (Claude Code / claude-sonnet-4-6)_
