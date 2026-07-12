# Session: Ilahle two-service website (Palm Care Solutions + Ilahle Transportation)
Date: 2026-07-10
Provider: Claude Code
Model: claude-sonnet-5
Project: ilahle-portal
Project Root: c:\DevWork\ilahle-portal

## Goal
Build a two-page website for Sdala's business (Palm Care Solutions palm tree pruning + Ilahle Transportation) on his existing `www.ilahle.co.za` domain (Mweb-hosted), able to take payment, per his WhatsApp brief relayed via Astute Insights. Scope grew mid-session to include: matching the client's actual brand profile, and replacing placeholder flat pricing with his real per-height and per-distance rate cards once he supplied them.

## Model Recommendation
Task tier: 3-Complex (multi-file site build, live payment-gateway integration, real financial/pricing logic, brand-asset extraction)
Recommended model: Sonnet 5 / Opus 4.8  Trust score: 9/10
Active model: Sonnet 5  Status: correct — handled scaffold pivots, brand-token extraction from a bundled HTML file, and pricing-formula implementation without under- or over-shooting the task.

## Decisions
- Started scaffolding in Next.js; discovered (via live browse of mweb.co.za) that Mweb hosting is cPanel-only shared PHP, no Node.js. User chose to rebuild entirely in plain PHP to match the existing cPanel/PHP stack (consistent with the BlackFire portal precedent) rather than switch hosting providers.
- Payment gateway: PayFast — standard for SA SMEs, settles to ABSA business accounts, low complaint history vs. alternatives.
- Extracted the real brand palette/fonts (forest green #14261b, gold #f0b429, cream #faf6ea, Baloo 2 + Inter) from the client's own `Ilahle Brand Profile - Standalone.html` rather than inventing a palette. Initially built the preview as an adaptive light/dark theme; corrected after the user flagged it — the brand profile is a **fixed single identity** (dark hero/footer bookends, cream page body throughout, gold reserved strictly for accents/CTAs/prices), not a light/dark toggle.
- Real PayFast merchant credentials (Merchant ID 25120268 + Merchant Key) arrived via photo mid-session — stored immediately in local `.env` only (confirmed absent from `git status`), never echoed into any committed file. `PAYFAST_MODE` set to `live` since these are real production credentials.
- Client supplied a real per-height pricing spreadsheet (photo) and a distance-based transport formula via WhatsApp shorthand. Rather than guess, confirmed via AskUserQuestion: (a) charge model — chose live height/distance calculators with server-side recomputation over flat deposit or quote-only; (b) the Medium band's R800 floor being lower than Small's R1,500 ceiling is intentional, not a typo; (c) Very Tall (20m+, open-ended) caps interpolation at 30m = R15,000; (d) transport formula is R450 flat ≤5km, else R450 + (11 × km-over-5 × 2). All four confirmed against the client's own words before implementation, since a wrong guess here means mis-charging real customers through a live gateway.
- `payfast/checkout.php` always recomputes price server-side from the submitted height/km — never trusts a client-supplied amount — closing an obvious tampering vector (editing the URL to pay less).

## Work Done
- `c:\DevWork\ilahle-portal\` — new standalone git repo (local only, no remote/push)
- Two-page PHP site: `index.php`, `palm-tree-pruning.php` (height input + live price calculator + rate-card table), `transportation.php` (distance input + live calculator), `thank-you.php`
- `includes/pricing.php` — height-band interpolation + distance formula, unit-tested via `php -r` against confirmed values (e.g. 12km → R604, 8m tree → R1,820) before wiring into checkout
- `includes/payfast.php`, `payfast/checkout.php`, `payfast/notify.php` — signed checkout + ITN webhook, signature verified both directions with `hash_equals`
- `.env` (local, gitignored, confirmed untracked) — real live PayFast credentials
- `.env.example`, `.htaccess`, `README.md` (incl. cPanel upload steps, pricing-logic docs, and a prominent passphrase warning)
- `Ilahle Website Preview - Standalone.html` — self-contained static preview (fonts embedded as base64 woff2, no external requests), rebuilt to match the brand profile's real fixed identity after user correction
- Published as a private Claude Artifact (user must use the page's own Share button for a public link — not something this agent can do programmatically)
- Project-level session log at `c:\DevWork\ilahle-portal\sessions\ilahle_website_build_20260709_103500.md`, mirrored to `G:\My Drive\JS\Agentic AI\sessions\ilahle-portal\`
- Two commits made: initial site build, then the dynamic-pricing/credentials rebuild

## Agent Accountability

| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|
| ilahle-site-build | Umakhi (code/portal) | Claude Code (Sonnet 5) | COMPLETED | 1 | Two-service PHP site, PayFast checkout/webhook, brand-matched preview |
| ilahle-pricing-logic | Umakhi (code/portal) | Claude Code (Sonnet 5) | COMPLETED | 1 | Height/distance pricing formulas confirmed with client, server-side recomputed at checkout |
| ilahle-debris-addon | uMakhi (code/portal) | Claude Code (Sonnet 5) | COMPLETED | 2 | R300 debris add-on: first applied to both services per "with every order"; revised to palm-only per client quotation, scoped server-side in onsite.php + checkout.php |

## Blockers / Next Steps
- ~~PayFast passphrase unconfirmed~~ **Resolved 2026-07-12**: passphrase supplied by client and stored in local `.env` (`PAYFAST_PASSPHRASE`), `PAYFAST_MODE=live`.
- Site not yet deployed — needs the actual cPanel/FTP password for `ncube@ilahle.co.za` (only the username was shared).
- Client has not yet shared the public Artifact link (needs to click Share on their end).
- Standalone preview HTML still shows the earlier gold-accent branding — regenerate if the client requests an updated static preview.
- PayFast Onsite modal cannot be tested end-to-end locally (requires HTTPS) — verify after cPanel deploy.

## Resumed 2026-07-12

### Decisions (chronological — earlier entries preserved above, per decision-tracking rule)
- **Phase: Debris add-on (initial)** — Client asked for R300 "Debris removal & disposal" as a default-checked checkbox "with every order". Read literally: applied to both Palm Pruning and Transportation, server default treats missing `debris` param as checked.
- **Phase: Debris add-on (revised — supersedes above)** — Client's own quotation screenshot showed the R300 line item only against palm work. Flagged the mismatch; user confirmed via AskUserQuestion: **"Palm only"**. Checkbox removed from transportation.php; fee scoped server-side to `$service === 'palm-tree-pruning'` in both `payfast/onsite.php` and `payfast/checkout.php` so transport orders can never carry it even if a stray `debris=1` is submitted.
- **Phase: Pricing bands (revised — supersedes the R800 band-dip decision above)** — Client's updated 2026-07-12 rate card made bands contiguous (Small R850–1,500 / Medium R1,500–2,500 / Large R2,500–7,500 / Very Tall R7,500–15,000); the earlier "intentional dip" answer no longer applies.
- Switched checkout UX to **PayFast Onsite Payments** (on-page modal via engine.js + server-fetched uuid) with `checkout.php` retained as a redirect fallback. Key constraint discovered: `email_address` must precede transaction fields in the signed payload or PayFast returns a misleading "signature does not match".

### Work Done
- `transportation.php` — removed debris checkbox markup, removed `DEBRIS_FEE`/checkbox handling from the live-price JS, removed `&debris=` from the onsite fetch body
- `payfast/onsite.php` — debris fee now applied only when `$service === 'palm-tree-pruning' && $debris`
- `payfast/checkout.php` — same palm-only scoping on the GET fallback
- `README.md` — debris bullet rewritten from "offered on both" to palm-only scope
- Timestamped backups of all four files under `_backups/` / `payfast/_backups/` (20260712_102642)
- Verification: `php -l` clean on all three PHP files; local server test — transport page renders with zero debris references; checkout amounts confirmed: transport 15km = R780.00 (even with forced `debris=1`), palm 7.5m = R2,300.00 default / R2,000.00 with `debris=0`
- Earlier in session: full zero-warning scan under `E_ALL` (clean), full pricing verification pass incl. 35m cap at R15,000

### Learnings (resumed)
- A default-on server-side fee (`$_POST['debris'] ?? '1'`) becomes a silent overbilling bug the moment a client page stops sending the parameter — when scoping a fee to one service, enforce the scope server-side on the service name, not on parameter presence.

## Learnings
- When a client sends a photographed spreadsheet/rate card mid-project, treat every number as a real financial constraint, not a placeholder — confirm ambiguous formulas with concrete worked examples before wiring them into a live payment gateway, since a wrong guess means charging real customers the wrong amount. This paid off directly this session (caught the R800 "dip" and the open-ended Very Tall range before they became live bugs).
- When a client provides an actual brand-profile file, extract its real tokens (grep for hex colors/font-family names in bundled HTML export) rather than inventing a palette — and read whether the profile commits to one fixed visual identity vs. an adaptive light/dark scheme before building. Got this wrong once (built adaptive) and corrected after user feedback; worth checking usage notes/section structure up front next time.
- Real credentials pasted into chat mid-conversation go straight to a gitignored `.env` and get verified absent from `git status` immediately — this worked cleanly here and should stay the default reflex.
- Windows path case-insensitivity caused two friction points this session (folder collision between differently-cased names, and a lingering process locking a folder against deletion) — killing the specific PID rather than all node processes resolved it without side effects.
- `end(SOME_CONST)` fails in PHP 8+ (can't pass a constant by reference); caught via `php -r` unit testing before it reached production code.
- Model trust score for Sonnet 5 on this kind of multi-pivot, real-stakes small-business build: confirmed at 9/10 — no updates needed to the trust matrix.

## Goal Status
PENDING
