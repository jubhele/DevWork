# AGENT_BRIEF_01 — Graft Umlilo Web v3 into production
**Authority:** IZILO-W-001 + `umlilo-web-v3-reference.html` (visual source of truth)
**Target files:** `BlackFire/BlackFire Portal/portal.php`, `portal.css`, `portal.js`
**Model tier:** execution. Do not redesign. Do not improvise. Copy the reference.

## Non-negotiable preconditions
1. `_backups/` snapshot of portal.php, portal.css, portal.js BEFORE any edit (constitution §7a), filename pattern `[file]_backup_YYYYMMDD_HHMMSS`.
2. Read the reference HTML fully before writing a line.
3. portal.php stays live: graft ONE section at a time, verify, commit, next. No big-bang.

## Section graft order (each = one commit)
1. CSS tokens + IZILO band classes + spec-frame styles → append to portal.css under a `/* ═ V3 ═ */` banner. Do NOT delete existing classes yet — v2 selectors are removed only in the final cleanup commit after all sections render.
2. Ignition preloader → markup at top of `#pub-site`; JS into portal.js (sessionStorage key `bf_ign`, reduced-motion skip). NO inline `<script>` without `nonce="<?= $cspNonce ?>"` — prefer portal.js.
3. Topbar + nav (sticky/solid swap, logo on-dark variant via existing `.bf-logo-dark/.bf-logo-light` mechanism).
4. Hero — keep the PHP-templated headline exactly: `Security<br><span>engineered</span><br>to <span>protect.</span>` with `htmlspecialchars($cfg[...])` eyebrow. Spec-frame for IMG-BRIEF-01 until photography lands.
5. Assessment wizard — markup + portal.js logic from reference. Wire submit to `api/public_enquiry.php` (AGENT_BRIEF_02 must be merged first). Map fields: name, company, phone, email, service = joined requirement chips, message = site_type + province + area + notes concatenated as labelled lines.
6. About, Services (wire the 8 cards to existing `images/services/*.jpg` thumbs — glyphs in the reference become 64px image headers; keep ember underline hover), Stats, Testimonials, FAQ, How-it-works, CTA banner, Footer, WhatsApp FAB — in that order.
7. Final cleanup commit: remove orphaned v2 public CSS, run QA suite.

## Regression guards (instant FAIL if violated)
- SEO head block, JSON-LD, robots.txt, sitemap.xml: untouched.
- CSP: every inline style/script carries the nonce, or lives in .css/.js files.
- All dynamic `innerHTML` through `esc()`. The wizard review builder in the reference already does this — copy it exactly.
- Zero `console.log`. Zero `demo|TEST|sample` strings.
- Touch targets ≥44px; verify at 360px width; hamburger preserved.
- Naming: "Umlilo Portal", never "BFS".
- Existing `data-action` event-delegation pattern in portal.js is the house style — new interactions use it, not scattered listeners, except where the reference's module pattern is self-contained (preloader, wizard).

## Exit gate
Run the full morning QA suite (PHP safety / JS & CSS / SQL / brand / §7a). Verdict must be PASS. Attach report as `sessions/portal_qa_v3_graft_[date].md`. Then deploy via `bash ~/deploy.sh` and complete the browser end-to-end test (public pages → login → dashboard) before closing.
