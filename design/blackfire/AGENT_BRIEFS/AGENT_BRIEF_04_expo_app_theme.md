# AGENT_BRIEF_04 — Expo RN app theme module (v3)
**Status:** BLOCKED until Bearer-token auth lands on the PHP backend (bf_mobile_tokens table, dual-path current_user()) per the standing mobile decision. Build the theme module now; ship nothing user-facing until unblocked.

## Deliverable
`packages/theme/` in the future monorepo:
- `tokens.ts` — export the locked palettes (dark + light registers), spacing scale (4/8/12/16/24/32/48), radius 3, the four font families (load via expo-font: BigShouldersDisplay 700/900, InstrumentSans 400/500/600, IBMPlexMono 400/600, InstrumentSerif italic).
- `izilo.tsx` — `<IziloBand variant="diamond|chevron|triangle">` as react-native-svg components reproducing the three bands (geometry in the reference HTML's data-URIs — port exactly).
- `components/` — Button (fire/ghost), Field, Chip, StatCard, SpecFrame (image placeholder carrying brief id), StepCounter (`01 / 04` mono).
- `Preloader.tsx` — Ignition triangle fill, ≤1.2s, respects `AccessibilityInfo.isReduceMotionEnabled`.

## Guards
- Expo React Native only — Capacitor remains rejected (Apple 4.2).
- No secrets in the app bundle; API base URL via app config.
- Dark register is the app default; light register for document/evidence screens.

## Exit gate
Storybook (or Expo preview) screen showing every component in both registers + session log. No store submission in this brief.
