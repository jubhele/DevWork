# AGENT_BRIEF_05 — Photography production (Claude design + Canva)
**Authority:** IZILO-W-001 §7. Output drops into the spec-frames in the reference/site with zero reflow.
**Global art direction:** documentary South African industrial security. Dusk/night bias. Ember-and-amber practical light against coal-blue. No stock smiles, no invented client faces, no watermarks, no US/EU-looking sites. Subjects wear black BlackFire uniform (hi-vis over it where site rules imply). Grade: lifted blacks toward #0A0E19, highlights warmed toward #F5A623. Export WEBP, quality 82, sRGB.

| ID | Placement | Ratio / min px | Subject |
|---|---|---|---|
| IMG-BRIEF-01 | Hero | 4:5 · 1400×1750 | Drone operator at an industrial perimeter at dusk; controller screens glowing amber; drone airborne against deep blue sky; plant lights as ember points behind the fence line. Low, cinematic angle. |
| IMG-BRIEF-02 | About | 4:3 · 1400×1050 | Officer on a site walk at a chemical plant — tablet in hand, pipework and tanks behind, late golden light raking across. Candid working posture, face angled away or in profile. |
| IMG-BRIEF-03 | FAQ | 3:4 · 1050×1400 | Control room at night: wall of monitors with site feeds, single operator silhouetted, amber screen-glow. Calm command, not chaos. |
| IMG-BRIEF-04 | CTA banner | 21:8 · 2400×915 | Wide dusk establishing shot: response vehicle + officer at an industrial gate, plant lit behind, sky coal-blue. Low angle, headlights/beacon as the warm accent. Leave the LEFT 40% compositionally quiet — headline overlays there. |
| IMG-BRIEF-05 | Services (set of 8, optional upgrade over existing jpgs) | 16:10 · 1200×750 each | One per discipline: armed response vehicle rolling; drone close-up with thermal gimbal; CCTV head against floodlit wall; biometric reader in use; officer at post; alarm panel install; electric fence line at dusk; assessor with safety file + the Umlilo Portal on screen. Same grade across all 8. |

## Canva execution notes
- Build at exact ratios above; do not crop-to-fit later.
- If generating: prompt with the subject line + "documentary photograph, dusk, amber practical lighting, deep blue shadows, South African industrial site, 35mm, no text, no watermark". Reject any output with garbled signage, extra limbs, or non-SA context cues.
- File names: `img-brief-01-hero.webp` … exactly. Deliver to Drive `GITHub_Repo/BlackFire Portal/images/v3/` and commit to repo same path.

## Exit gate
All frames replaced on a staging copy of the reference HTML; side-by-side review approved by Jubhele BEFORE production graft (AGENT_BRIEF_01 step 4+ consumes these).

## REV B addendum — interim photography is LIVE (2026-06-11)
The reference now ships 12 real photographs under the Unsplash License (free commercial
use). These are placement-final: the branded BlackFire shoot replaces each URL 1:1 at the
same crop. Manifest (images.unsplash.com/photo-…):
1670689334799-cdc6777db8cc Hero · 1772743227731-e16af7c8d85a About · 1557597774-9d273605dfa9 FAQ ·
1642285709726-f9eb035b034b CTA · 1485230405346-71acb9518d9c Armed Response · 1569228593208-6314ad85a2ba Drone ·
1496368077930-c1e31b4e5b44 CCTV · 1618482914248-29272d021005 Access · 1581568736305-49a04e012c13 Guard ·
1670689334024-ad61dd564fe2 Electronic · 1687274427456-ccf06e264df2 Perimeter · 1484480974693-6ca0a78fb36b Compliance.
PRODUCTION NOTE (AGENT_BRIEF_01): download these at full params, convert to WEBP q82, self-host
under images/v3/ — do NOT hotlink Unsplash from blackfiresolutions.co.za.
