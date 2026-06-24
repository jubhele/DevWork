---
name: project-blackfire
description: BlackFire Solutions — security operations portal, client portal, Next.js web app, Expo mobile
metadata:
  type: project
---

BlackFire Solutions is a security company portal managing callouts, invoices, clients, and field operations.

- **Stack:** PHP 7.3+ (portal/API at `BlackFire Portal/`) + Next.js 15 (`apps/web/`) + Expo SDK 56 (`apps/mobile/`) + MySQL
- **Live:** blackfiresolutions.co.za
- **Principal:** Jubhele Shange
- **Pilot client:** AECI Chempark

**Why:** All three surfaces (PHP portal, Next.js web, Expo mobile) share the same PHP/MySQL backend.
**How to apply:** Any code change must consider impact on all three surfaces.
