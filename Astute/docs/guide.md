# Astute Insights — Operator & User Guide

> Maintained by Mbhali. Updated automatically when Umakhi ships a production feature and Mvavanyi returns PASS.

## Overview

Astute Insights is a business intelligence platform with a Next.js web app (`apps/web/`) and Expo mobile app (`apps/mobile/`).

## Development

```powershell
# Web
pnpm --filter web dev

# Mobile
pnpm --filter mobile start
```

## Agent Workforce

Submit tasks via Mlawuli. See `agents/mlawuli_system_prompt.md` for routing rules.

## Session Logging

All sessions logged to `sessions/`. Use template at `sessions/_template.md`.
