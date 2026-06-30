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

## Portal Surface Split

The AI dashboard widgets ("AI Intelligence" and "Client Intelligence Report") are rendered in the authenticated Next.js dashboard at `apps/web/src/app/(portal)/dashboard/page.tsx`. The public PHP site at `BlackFire Portal/portal.php` is a separate surface and does not render those widgets on `http://localhost:8080/`.

## Dark Mode Surfaces

The Next.js portal theme relies on `html[data-theme='dark']` overrides for hardcoded utility classes. When a new light surface appears in dark mode, check for fixed classes like `bg-white/95` or hex-coded accent backgrounds and add a shared override in `apps/web/src/app/globals.css` instead of patching each page ad hoc.
