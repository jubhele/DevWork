# BlackFire / Umlilo — Portal & App Architecture

> Governing document for how the PHP portal, the Next.js web app, and the Expo mobile app relate to each other, how routes are mapped, and how data flows between surfaces.

---

## 1. System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                     SHARED PHP/MySQL BACKEND                        │
│          blackfiresolutions.co.za/api/*.php                         │
│                                                                      │
│  auth.php  tasks.php  callouts.php  quotes.php  invoices.php        │
│  clients.php  safety.php  users.php  audit.php  files.php           │
│  dashboard.php  finance.php                                          │
└──────────────────────────────────────────────────────────────────────┘
         ▲                   ▲                      ▲
         │ same-origin       │ CORS/cookie           │ CORS/cookie
         │ cookies           │ credentials           │ credentials
         │                   │                      │
┌────────┴───────┐   ┌───────┴──────────┐   ┌──────┴────────────────┐
│  PHP PORTAL    │   │  NEXT.JS WEB APP │   │  EXPO MOBILE APP      │
│  portal.php    │   │  apps/web/       │   │  apps/mobile/         │
│  portal.js     │   │  (Next.js 15)    │   │  (Expo SDK 56)        │
│  portal.css    │   │  Vercel          │   │  Android / iOS        │
│                │   │                  │   │                        │
│ localhost:8080 │   │ localhost:3000    │   │ Expo Go / EAS Build   │
│ (PHP dev)      │   │ (Next.js dev)    │   │                        │
└────────────────┘   └──────────────────┘   └────────────────────────┘
```

All three surfaces authenticate through the same PHP session cookie (`bf_portal`) and call the same API endpoints. Work started on any surface is immediately visible on all others — there is no sync step.

---

## 2. Authentication Flow

```
User enters username + password
        │
        ▼
POST /api/auth.php?action=login
        │
        ├── success → Set-Cookie: bf_portal (httpOnly, SameSite=Lax)
        │             Redirect to /dashboard  (web/app)
        │             Show portal home         (PHP portal)
        │
        └── failure → Show error in current login form

Session validation on every protected page:
  GET /api/auth.php?action=me → { success, user: { id, username, name, role, permissions } }

Logout:
  POST /api/auth.php?action=logout → Clear cookie → Redirect to /login
```

The Next.js web app performs session validation **server-side** in the portal layout (`apps/web/src/app/(portal)/layout.tsx`) before rendering any protected page. An invalid or missing cookie redirects immediately to `/login`.

The PHP portal performs session validation in PHP at the top of `portal.php` using the same session cookie.

The mobile app stores the session token in secure device storage (`apps/mobile/src/lib/token.ts`) and attaches it as a cookie header to every API request.

---

## 3. Route Mapping — Portal ↔ Web App ↔ Mobile App

| PHP Portal Page  | Web App Route             | Mobile App Screen        | API Endpoint(s)                          |
|------------------|---------------------------|--------------------------|------------------------------------------|
| `p-dashboard`    | `/dashboard`              | `DashboardScreen` (TBD) | `dashboard.php`                          |
| `p-ops-dashboard`| `/dashboard` (combined)   | —                        | `dashboard.php`                          |
| `p-tracker`      | `/tracker?stream=admin`   | `TrackerScreen` (TBD)   | `tasks.php`                              |
| `p-tracker`      | `/tracker?stream=sales`   | `TrackerScreen` (TBD)   | `tasks.php`                              |
| `p-tracker`      | `/tracker?stream=general` | `TrackerScreen` (TBD)   | `tasks.php`                              |
| `p-callouts`     | `/tracker?stream=call-log`| `CallLogScreen` (TBD)   | `callouts.php`                           |
| `p-new-callout`  | `/tracker/call-log/new`   | `NewCalloutScreen` (TBD)| `callouts.php` (POST)                    |
| `p-new-task`     | `/tracker/new`            | —                        | `tasks.php` (POST)                       |
| Task detail      | `/tracker/[ref_id]`       | `TaskDetailScreen` (TBD)| `tasks.php?id=`, `files.php`, `audit.php`|
| Call-log detail  | `/tracker/call-log/[id]`  | `CallDetailScreen` (TBD)| `callouts.php?action=chain&ref=`         |
| `p-quotes`       | `/quotes`                 | `QuotesScreen` (TBD)    | `quotes.php`                             |
| `p-new-quote`    | `/quotes/new`             | —                        | `quotes.php` (POST)                      |
| `p-invoices`     | `/invoices`               | `InvoicesScreen` (TBD)  | `invoices.php`                           |
| `p-new-invoice`  | `/invoices/new`           | —                        | `invoices.php` (POST)                    |
| `p-log-payment`  | `/invoices/log-payment`   | —                        | `invoices.php?action=payment`            |
| `p-finance-dashboard` | `/finance`           | —                        | `finance.php?action=summary`             |
| `p-statement`    | `/finance/statements`     | —                        | `finance.php?action=statement`           |
| `p-clients`      | `/clients`                | —                        | `clients.php`                            |
| `p-safety`       | `/safety`                 | —                        | `safety.php`                             |
| `p-safety-audit` | `/safety/new`             | —                        | `safety.php` (POST)                      |
| `p-safety-detail`| `/safety/[id]`            | —                        | `safety.php?id=`                         |
| Support overview | `/support`                | `SupportScreen` (TBD)   | `auth.php?action=me`                     |
| `p-users`        | `/admin/users`            | —                        | `users.php`                              |
| `p-audit`        | `/admin/audit`            | —                        | `audit.php`                              |
| Login            | `/login`                  | `LoginScreen`            | `auth.php?action=login`                  |
| Help / Guide     | `/help`                   | `HelpScreen` (TBD)      | (static)                                  |

> **TBD**: Mobile app screens are scaffolded but not yet implemented. Only `LoginScreen` is complete.

---

## 4. Web App Route Structure

```
apps/web/src/app/
├── page.tsx                          → redirects / → /dashboard
├── layout.tsx                        → root HTML, fonts, favicons, metadata
├── globals.css                       → Tailwind base styles + design tokens
├── favicon.ico                       → 16px shortcut icon
├── login/
│   └── page.tsx                      → Login form (unauthenticated)
└── (portal)/                         → Protected route group
    ├── layout.tsx                    → Auth guard + UserProvider + PortalShell
    ├── dashboard/
    │   └── page.tsx                  → KPIs, recent activity, stream counts
    ├── tracker/
    │   ├── page.tsx                  → Multi-stream table (Admin/Sales/General/Call Log)
    │   ├── new/
    │   │   └── page.tsx              → New task form
    │   ├── [id]/
    │   │   ├── page.tsx              → Task detail: metadata, updates, files, schedule
    │   │   └── TaskActions.tsx       → Client-side status + delete actions
    │   └── call-log/
    │       └── [id]/
    │           └── page.tsx          → Callout detail: metadata, updates, files, schedule
    ├── callouts/
    │   └── page.tsx                  → redirects → /tracker?stream=call-log
    ├── quotes/
    │   └── page.tsx                  → Quote log table
    ├── invoices/
    │   └── page.tsx                  → Invoice log table
    ├── finance/
    │   └── page.tsx                  → Finance KPIs + aging chart
    ├── clients/
    │   └── page.tsx                  → Client accounts table
    ├── safety/
    │   └── page.tsx                  → Safety files table with filter tabs
    ├── support/
    │   └── page.tsx                  → Support overview: account info, contacts, links
    ├── admin/
    │   ├── users/
    │   │   └── page.tsx              → Users & roles table (Admin/Sysadmin only)
    │   └── audit/
    │       └── page.tsx              → Paginated audit log (Admin/Sysadmin only)
    └── help/
        └── page.tsx                  → Full user guide: all sections + FAQs
```

---

## 5. Navigation Structure (Web App)

### Primary tabs (always visible)

| Tab        | href         | Activation match                            |
|------------|--------------|---------------------------------------------|
| Dashboard  | `/dashboard` | `/dashboard`                                |
| Operations | `/tracker`   | `/tracker`, `/callouts`, `/quotes`, `/clients` |
| Finance    | `/finance`   | `/finance`, `/invoices`                     |
| Support    | `/support`   | `/support`, `/safety`, `/admin`             |

### Secondary bars (context-sensitive, permission-filtered)

**Dashboard**
- Overview → `/dashboard`
- Users & Roles → `/admin/users` _(admin/sysadmin)_
- Safety Files → `/safety` _(safety.view)_
- Audit Log → `/admin/audit` _(admin/sysadmin)_

**Operations**
- Tracker → `/tracker` _(task.view)_
- Quotes → `/quotes` _(quote.view)_
- Clients → `/clients` _(client.view)_

**Finance**
- Invoices → `/invoices` _(invoice.view)_
- Finance Overview → `/finance` _(finance.view)_

**Support**
- Overview → `/support`
- Safety Files → `/safety` _(safety.view)_
- Users & Roles → `/admin/users` _(admin/sysadmin)_
- Audit Log → `/admin/audit` _(admin/sysadmin)_

---

## 6. Mobile App Structure (Expo SDK 56)

```
apps/mobile/
├── App.tsx                           → Root — AuthContext provider + navigator
├── index.ts                          → Entry point
├── app.json                          → Expo config (name, slug, icons, splash)
├── assets/
│   ├── icon.png                      → App icon (1024×1024)
│   ├── splash-icon.png               → Splash screen icon
│   ├── android-icon-background.png   → Adaptive icon background
│   ├── android-icon-foreground.png   → Adaptive icon foreground
│   └── favicon.png                   → Web PWA favicon
└── src/
    ├── context/
    │   └── AuthContext.tsx            → Session state, login/logout
    ├── lib/
    │   ├── token.ts                   → Secure token storage
    │   └── device.ts                  → Device info helpers
    └── screens/
        └── LoginScreen.tsx            → Login form — only complete screen
```

> All other screens (Dashboard, Tracker, Call Log, Quotes, Invoices, Support, Help) are **pending implementation**.

---

## 7. Shared Packages

```
BlackFire/packages/
├── types/           → @blackfire/types — shared TypeScript contracts for all API responses
├── ui-tokens/       → @blackfire/ui-tokens — design tokens (colors, fonts) shared between web & mobile
└── api-client/      → @blackfire/api-client — (planned) shared API call helpers
```

**ui-tokens** exports:
- `colors` — coal, navy, charcoal, steelDark, flameGold, fireOrange, ash, bonePaper, etc.
- `fonts` — display (Big Shoulders), body (Instrument Sans), mono (IBM Plex Mono)

Mobile `LoginScreen.tsx` imports `colors` and `fonts` from `@blackfire/ui-tokens` — this ensures the mobile app matches the web app's visual design exactly.

---

## 8. Cross-Device Workflow — Start in Portal, Finish in App

The same `bf_portal` session cookie authenticated against the same PHP backend is used on all surfaces. Any record created or modified on one surface is immediately visible on another.

### Typical cross-device flow examples

**Field job logged in PHP portal → updated in mobile app**
1. Call logger opens PHP portal → logs a callout in Call Log (`callouts.php` POST)
2. Technician opens mobile app → sees the callout in their Call Log stream
3. Technician updates the status to In Progress from the mobile app (`callouts.php` PATCH)
4. Manager sees the update live in the web app's Tracker → Call Log tab

**Task created in web app → file uploaded in mobile app**
1. Admin creates a task in `/tracker/new` (web app)
2. Tech opens the task detail in mobile app
3. Tech uploads a photo from mobile to the task's Files section (`files.php` POST)
4. Admin sees the file immediately in web app → `/tracker/[ref_id]` Files tab

**Quote approved in PHP portal → invoice created in web app**
1. Senior tech submits a quote in PHP portal (`quotes.php` POST)
2. Manager approves the quote in PHP portal
3. Admin navigates to `/quotes` in web app → clicks Convert to Invoice
4. Invoice is created (`invoices.php` POST) and appears in `/invoices`
5. Payment is logged in web app when received

---

## 9. Public Assets (Web App)

All files in `apps/web/public/` are served from the root URL:

| File                              | Purpose                               |
|-----------------------------------|---------------------------------------|
| `blackfire_logo_transparent.png`  | Header logo (150×50 display)         |
| `blackfire_icon_transparent.png`  | Small icon for badges/thumbnails      |
| `favicon.ico`                     | Browser tab shortcut icon             |
| `favicon-16x16.png`               | 16px PNG favicon                      |
| `favicon-32x32.png`               | 32px PNG favicon                      |
| `favicon-512x512.png`             | 512px PNG for PWA manifest            |
| `apple-touch-icon.png`            | iOS home screen icon                  |

These match the favicon set used by the PHP portal (`BlackFire Portal/favicon*.png`).

---

## 10. Permission Model

Permissions are returned by `auth.php?action=me` as a `permissions[]` string array. Roles grant a default permission set; individual permissions can be added or removed per user.

| Role            | Key default permissions                                              |
|-----------------|----------------------------------------------------------------------|
| `sysadmin`      | All permissions                                                      |
| `admin`         | All except system-level settings                                     |
| `manager`       | task.*, callout.*, quote.*, invoice.view, client.view, safety.view   |
| `admin_clerk`   | task.view, task.create, callout.view                                 |
| `call_logger`   | callout.view, callout.create, capture.new_callout                    |
| `senior_tech`   | callout.*, task.view, quote.view, capture.new_quote                  |
| `junior_tech`   | callout.view, task.view                                              |
| `client_support`| callout.view, callout.create, task.view                             |
| `safety_officer`| safety.*, task.view                                                  |
| `viewer`        | *.view (read-only across all modules)                                |

The web app enforces permissions in two places:
1. **Server-side**: page components call `getServerUser()` and `can(user, 'perm')` to gate render
2. **Client-side**: `PortalShell.tsx` filters secondary nav items by `user.role` and `user.permissions`

---

## 11. Design System Tokens

| Token          | Value                  | Usage                                      |
|----------------|------------------------|--------------------------------------------|
| `coal`         | `#0D0D0D`              | Primary background (dark surfaces)         |
| `navy`         | `#0F1B2D`              | Sidebar, header backgrounds                |
| `charcoal`     | `#1A2535`              | Table headers, secondary surfaces          |
| `steelDark`    | `#2E3F55`              | Borders, dividers                          |
| `flameGold`    | `#F5A623`              | Brand accent (wordmark, highlights)        |
| `fireOrange`   | `#E84B1B`              | Primary CTA, active nav indicators         |
| `ash`          | `#8E9BAE`              | Secondary text, labels                     |
| `bonePaper`    | `#F7F5F0`              | Light-theme body background                |
| `inkText`      | `#1A1A1A`              | Primary text on light backgrounds          |

All tokens are shared between the web app (via Tailwind CSS config) and the mobile app (via `@blackfire/ui-tokens`).

---

## 12. Implementation Status

| Surface          | Login | Dashboard | Tracker | Call Log | Quotes | Invoices | Finance | Safety | Admin |
|------------------|-------|-----------|---------|----------|--------|----------|---------|--------|-------|
| PHP Portal       | ✅    | ✅        | ✅      | ✅       | ✅     | ✅       | ✅      | ✅     | ✅    |
| Web App (Next.js)| ✅    | ✅        | ✅      | ✅       | ✅*    | ✅*      | ✅*     | ✅*    | ✅*   |
| Mobile (Expo)    | ✅    | ⬜        | ⬜      | ⬜       | ⬜     | ⬜       | ⬜      | ⬜     | ⬜    |

> `✅*` = Page exists and renders live data from the API, but create/edit/delete actions are not yet wired up in the web app.  
> `⬜` = Not yet implemented.

### Web App — Next Phase (create/edit actions)

These views exist but have no mutation paths yet:
- `/quotes/new` — new quote form
- `/invoices/new` — new invoice form
- `/invoices/log-payment` — log a payment
- `/safety/new` — new safety audit
- `/clients/new` — new client
- `/admin/users/new` — new portal user
- Call-log new callout form (`/tracker/call-log/new`)

---

## 13. Local Development

### PHP portal

```powershell
cd "c:\DevWork\BlackFire\BlackFire Portal"
.\start-local.ps1   # syncs .env then starts PHP dev server on :8080
```

### Next.js web app

```powershell
cd "c:\DevWork\BlackFire\apps\web"
pnpm dev            # starts Next.js on :3000
```

### Expo mobile app

```powershell
cd "c:\DevWork\BlackFire\apps\mobile"
npx expo start      # opens Expo DevTools — scan QR with Expo Go
```

### API base override

Set `NEXT_PUBLIC_API_BASE` in `apps/web/.env.local` to point at a local PHP server:
```
NEXT_PUBLIC_API_BASE=http://localhost:8080/api
```
This allows the web app to read from the same local database as the PHP portal for end-to-end cross-surface testing.

---

_Last updated: 2026-06-21 — generated from QA session `app_portal_parity_qa_20260621_100000.md`_
