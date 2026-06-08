# BlackFire Brand Tokens

Source of truth extracted from `BlackFire/BlackFire-Brand-Pack/blackfire-portal.html`.
Full brand identity PDFs: `BlackFire/BlackFire-Brand-Pack/BlackFire_Brand_Identity_Vol01.pdf`

---

## Color Palette

### Dark Theme (primary)
| Token | Value | Role |
|-------|-------|------|
| `--color-ground` | `#0A0E19` | Page background |
| `--color-surface` | `#141B26` | Card / panel background |
| `--color-surface-alt` | `#1E2530` | Elevated surface |
| `--color-divider` | `#2B3340` | Borders, separators |
| `--color-ember` | `#C0392B` | Danger / error |
| `--color-fire` | `#E05A1A` | **Primary accent** |
| `--color-amber` | `#F07820` | Warning / secondary accent |
| `--color-gold` | `#F5A623` | Highlight |
| `--color-muted` | `#7A8699` | Placeholder, disabled text |
| `--color-secondary` | `#A8B2BE` | Secondary text |
| `--color-primary` | `#E0E4EA` | Primary text |
| `--color-grid-line` | `rgba(224,90,26,0.08)` | Background grid overlay |
| `--shadow-strong` | `0 20px 60px rgba(0,0,0,0.6)` | Elevated cards |

### Light Theme
| Token | Value | Role |
|-------|-------|------|
| `--color-ground` | `#F5F1EA` | Page background |
| `--color-surface` | `#EDE8DE` | Card / panel background |
| `--color-surface-alt` | `#E4DED2` | Elevated surface |
| `--color-divider` | `#C8C1B3` | Borders, separators |
| `--color-ember` | `#A82A1E` | Danger / error |
| `--color-fire` | `#C94A10` | **Primary accent** |
| `--color-amber` | `#E06A1A` | Warning / secondary accent |
| `--color-gold` | `#D48A15` | Highlight |
| `--color-muted` | `#7A7566` | Placeholder, disabled text |
| `--color-secondary` | `#4A4638` | Secondary text |
| `--color-primary` | `#1A1814` | Primary text |
| `--color-grid-line` | `rgba(168,42,30,0.08)` | Background grid overlay |
| `--shadow-strong` | `0 20px 60px rgba(26,24,20,0.12)` | Elevated cards |

---

## Typography

| Role | Font | Weight | Size | Letter-spacing | Line-height |
|------|------|--------|------|----------------|-------------|
| Hero title | Big Shoulders | 900 | `clamp(80px, 14vw, 180px)` | — | 0.85 |
| Section title | Big Shoulders | 900 | `clamp(48px, 7vw, 96px)` | — | 0.9 |
| Wordmark | Big Shoulders | 900 | 17px | 0.04em | — |
| Body | Instrument Sans | 400 | base | — | 1.6 |
| Body bold | Instrument Sans | 700 | base | — | 1.6 |
| Accent / quote | Instrument Serif | italic | — | — | — |
| UI label / mono | IBM Plex Mono | 400 | 11px | 0.18em (UPPERCASE) | — |
| Sub-wordmark | IBM Plex Mono | 400 | 8.5px | 0.3em (UPPERCASE) | — |
| Code | IBM Plex Mono | 400/700 | — | — | — |

**Google Fonts import:**
```
Big Shoulders Display:wght@400;700;900
Instrument Sans:ital,wght@0,400;0,700;1,400
Instrument Serif:ital@1
IBM Plex Mono:wght@400;700
```

---

## Logo Assets

| File | Use case |
|------|---------|
| `blackfire-logo.png` | Light backgrounds, documents |
| `blackfire-logo-on-dark.png` | Dark backgrounds, portal nav |
| `blackfire-icon.png` | Favicon source, small spaces (light bg) |
| `blackfire-icon-on-dark.png` | Favicon source, small spaces (dark bg) |
| `blackfire_logo_transparent.png` | Overlays, watermarks |
| `blackfire_icon_transparent.png` | App icons, overlays |
| `blackfire_icon_transparent_2x.png` | Retina/HiDPI |

All assets live in: `BlackFire/BlackFire-Brand-Pack/` and `BlackFire/blackfire-logo-pack/`

### Logo Size Guidelines

| Surface | Max height |
|---------|-----------|
| Navigation bar | 60–80px |
| Footer | 62–80px |
| Login / auth panel | 74px |
| Sidebar (collapsed) | 30–34px |
| Mobile top bar | 28–32px |
| Hero / large display | Up to 120px (icon variant) |
| Background watermark | `background-size: 280px auto` |

---

## Layout System

- Max content width: **1180px**
- Section padding: **100px 40px** (desktop) → responsive via clamp/media query
- Background grid: 60×60px, `--color-grid-line` at 8% opacity
- Navigation: sticky, `backdrop-filter: blur(14px)`
- Hero grid: `1fr 300px`, gap 48px
- Shadow: use `--shadow-strong` for elevated cards

---

## Claude.ai Design Exports

Paste Claude.ai exported HTML/CSS design artifacts into:
`design/blackfire/exports/` or `design/imports/` (if cross-project)

These need to be reconciled against the brand tokens above before handoff to Umakhi.
