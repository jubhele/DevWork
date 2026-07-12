# Design Projects

This folder is uMdwebi's domain — brand identity, design systems, and visual assets.

## Structure

```
design/
├── blackfire/              ← BlackFire brand (primary)
│   ├── brand_tokens.md     ← Color, typography, layout tokens (source of truth)
│   └── exports/            ← Claude.ai design exports, Canva exports, etc.
├── umlilo/                 ← Umlilo portal brand
│   └── exports/
└── imports/                ← Cross-project or unsorted design imports
```

## Source Files

- **BlackFire brand pack**: `C:\DevWork\BlackFire\BlackFire-Brand-Pack\`
  - `blackfire-portal.html` — full interactive design system
  - `BlackFire_Brand_Identity_Vol01.pdf` — brand identity guide
  - Logo PNGs (light/dark/transparent variants)
- **BlackFire logo pack**: `C:\DevWork\BlackFire\blackfire-logo-pack\`

## Adding Claude.ai Design Exports

1. Open the Claude.ai artifact and download as HTML or copy the code.
2. Save to `design/{project}/exports/{descriptive-name}_{YYYYMMDD}.html`
3. Open `brand_tokens.md` for the project and verify the export uses the correct tokens.
4. If tokens differ, flag as BRAND_DRIFT and reconcile before handing off to uMakhi.

## uMdwebi Workflow

See `agents/umdwebi_system_prompt.md` for the full design agent process.
Short version: Brief → Audit → Spec → Handoff to uMakhi → Review.
