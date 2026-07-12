# Astute Insights — System Architecture

> Maintained by uMbhali. Uses Mermaid.js for all diagrams.

## Stack Overview

```mermaid
graph TD
    Web["Next.js 15 (apps/web)"] --> API["Backend API"]
    Mobile["Expo Mobile (apps/mobile)"] --> API
    API --> DB["Database"]
```

## Monorepo Structure

```
apps/
  web/      — Next.js 15 web application
  mobile/   — Expo mobile application
packages/
  types/    — Shared TypeScript types
  ui-tokens/ — Shared design tokens
```

_Update this file when new routes, schemas, or services are added._
