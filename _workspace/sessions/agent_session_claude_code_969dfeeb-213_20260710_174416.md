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

## Blockers / Next Steps
- **Unresolved**: PayFast passphrase status unconfirmed by client (Settings → Integration on payfast.co.za). `PAYFAST_PASSPHRASE` left blank — if one exists on the live account, every real transaction will fail signature validation until it's added.
- Site not yet deployed — needs the actual cPanel/FTP password for `ncube@ilahle.co.za` (only the username was shared).
- Client has not yet shared the public Artifact link (needs to click Share on their end).

## Learnings
- When a client sends a photographed spreadsheet/rate card mid-project, treat every number as a real financial constraint, not a placeholder — confirm ambiguous formulas with concrete worked examples before wiring them into a live payment gateway, since a wrong guess means charging real customers the wrong amount. This paid off directly this session (caught the R800 "dip" and the open-ended Very Tall range before they became live bugs).
- When a client provides an actual brand-profile file, extract its real tokens (grep for hex colors/font-family names in bundled HTML export) rather than inventing a palette — and read whether the profile commits to one fixed visual identity vs. an adaptive light/dark scheme before building. Got this wrong once (built adaptive) and corrected after user feedback; worth checking usage notes/section structure up front next time.
- Real credentials pasted into chat mid-conversation go straight to a gitignored `.env` and get verified absent from `git status` immediately — this worked cleanly here and should stay the default reflex.
- Windows path case-insensitivity caused two friction points this session (folder collision between differently-cased names, and a lingering process locking a folder against deletion) — killing the specific PID rather than all node processes resolved it without side effects.
- `end(SOME_CONST)` fails in PHP 8+ (can't pass a constant by reference); caught via `php -r` unit testing before it reached production code.
- Model trust score for Sonnet 5 on this kind of multi-pivot, real-stakes small-business build: confirmed at 9/10 — no updates needed to the trust matrix.

## Goal Status
PENDING
