# BlackFire / Umlilo Shared Contracts

These files are the source of truth for values shared between the PHP portal and the TypeScript web/mobile apps.

## Files

- `portal.contract.json` defines shared domain types, enums, and response shapes.
- `umlilo.tokens.json` defines shared design tokens for colors, fonts, spacing, and Tailwind names.

## Sync

Run this from `C:\DevWork` after changing a backend shape or shared visual token:

```powershell
.\scripts\sync-umlilo-contracts.ps1
```

The script regenerates:

- `umlilo-portal\packages\types\index.ts`
- `umlilo-portal\packages\ui-tokens\index.ts`

