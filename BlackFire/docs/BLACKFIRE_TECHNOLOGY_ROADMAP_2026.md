# BlackFire Solutions — Technology Roadmap 2026
**Classification:** Internal Strategic Document
**Author:** Jubhele Shange + Claude (Anthropic)
**Date:** 2026-05-25
**Version:** 1.0
**Branch:** ndlunkulu

---

## Executive Summary

BlackFire Solutions operates a mature PHP + MySQL web portal (Umlilo Portal) serving AECI Chempark Modderfontein as its primary client. This document outlines the full technology roadmap: migrating the portal to Next.js + TypeScript, building a cross-platform mobile application, and layering in AI capabilities that create genuine competitive differentiation in the SA security market.

The strategic premise is this: Donthok Security Technology — BlackFire's predecessor at AECI — had zero digital presence. They held the contract through relationships and price, not capability. BlackFire's portal is its most powerful retention tool. Every technology decision on this roadmap serves that thesis.

---

## 1. Current Baseline

### Infrastructure
- **Hosting:** Afrihost Silver Home Linux (cPanel) — `blackfiresolutions.co.za`
- **cPanel user:** `blackfm6w9f9`
- **Database:** MySQL (`blackfm6w9f9_portal`) — 20+ migration files, mature schema
- **Runtime:** PHP 7.4+, Apache mod_rewrite, Let's Encrypt SSL
- **No Node.js runtime** on current hosting — constraint on deploy options

### Portal Stack (Umlilo Portal)
- `portal.php` — single-file SPA shell, PHP-rendered
- `portal.css` / `portal.js` — frontend assets
- `api/*.php` — 18 REST endpoints
- `includes/` — auth, db, helpers, mailer
- `config/config.php` — AES-256-CBC encrypted secrets

### API Endpoints (18 modules)
`auth`, `dashboard`, `callouts`, `quotes`, `invoices`, `clients`, `safety`, `safety_compliance`, `safety_doc_gen`, `safety_personnel`, `safety_policy`, `files`, `payments`, `statements`, `transactions`, `approvals`, `users`, `audit`

### Auth Model
- PHP server sessions (`bf_portal` cookie, `SameSite=Lax`, `HttpOnly`)
- bcrypt password hashing (`password_verify`)
- CSRF tokens via `X-CSRF-Token` header
- CAPTCHA: server-side arithmetic challenge (`$_SESSION['bf_captcha']`)
- Session expiry: 7200 seconds (2 hours), rolling

### RBAC Roles
`sysadmin` (god mode) → `admin` → `manager` → `finance` → `safety_officer` → `viewer` → `client_support` → `junior_tech` → `senior_tech`

Permissions stored in `bf_role_permissions` table (~35 granular permissions across callout, quote, invoice, finance, safety, user, security domains).

### Dev-in-Progress
- `refactored_portal/` — partial refactor in repo, not deployed
- STREAM4 spec — defines three new portals: Secure Command, Internal Ops/Izilo Mission Control, Portal Hub
- STREAM4 already specifies React 18 + TypeScript + Tailwind + shadcn/ui

---

## 2. Next.js + TypeScript Migration

### Hosting Decision

Current Afrihost cPanel **cannot run Node.js**. Two options:

| Option | Next.js Deploy | PHP/MySQL | Monthly Cost |
|---|---|---|---|
| **A — Split (recommended)** | Vercel (free/Pro) | Stay on Afrihost | ~$20/mo |
| **B — VPS upgrade** | Afrihost Cloud Silver (PM2 + Nginx) | Same server | ~R1,639/mo |

**Decision: Option A to start.** Vercel for Next.js, Afrihost keeps PHP/MySQL backend. The PHP API endpoints become the interim data layer — zero disruption to production. CORS configuration added via `.htaccess`. Move to Option B (VPS) when consolidation makes financial sense.

### Monorepo Structure

```
blackfire/
  apps/
    web/            ← Next.js portal  →  blackfiresolutions.co.za
    mobile/         ← Expo React Native  →  App Store + Play Store
  packages/
    types/          ← TypeScript interfaces (shared by web + mobile)
    api-client/     ← Typed fetch wrappers (shared by web + mobile)
    ui-tokens/      ← IZILO design tokens (Tailwind for web, StyleSheet for mobile)
```

### TypeScript Types (derived from PHP/MySQL schema)

```ts
// packages/types/portal.ts
export interface Callout {
  id: number
  ref_id: string           // JOB-YYMMDD-XXXX
  client_id: number | null
  client_name: string
  service: string
  location: string
  priority: 'Normal' | 'Urgent' | 'Emergency'
  status: 'Open' | 'In Progress' | 'Completed' | 'Invoiced' | 'Cancelled'
  assigned_to: string | null
  callout_date: string
  created_at: string
}

export interface Invoice {
  id: number
  invoice_number: string
  client_id: number
  amount: number
  tax: number
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled'
  due_date: string
  paid_date: string | null
}

export interface SafetyFile {
  id: number
  ref_id: string           // SAF-YYMMDD-XXXX
  site: string
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected'
  score: number
  total_items: number
  submitted_by: string
  approved_by: string | null
}

export interface User {
  id: number
  username: string
  name: string
  role: 'sysadmin' | 'admin' | 'manager' | 'finance' | 'safety_officer'
        | 'viewer' | 'client_support' | 'junior_tech' | 'senior_tech'
  permissions: string[]
  client_id: number | null
  active: boolean
}
// ... quotes, clients, transactions, payments, audit events
```

### Tailwind IZILO Token Config

```ts
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      // Dark palette
      'coal':         '#0A0E19',
      'navy':         '#141B26',
      'charcoal':     '#1E2530',
      'steel-dark':   '#2B3340',
      'ash':          '#7A8699',
      'ember-red':    '#C0392B',
      'fire-orange':  '#E05A1A',
      'ember-amber':  '#F07820',
      'flame-gold':   '#F5A623',
      // Light palette
      'bone-paper':   '#F5F1EA',
      'ink-text':     '#1A1814',
    },
    fontFamily: {
      display: ['Big Shoulders Display', 'sans-serif'],
      body:    ['Instrument Sans', 'sans-serif'],
      mono:    ['IBM Plex Mono', 'monospace'],
      serif:   ['Instrument Serif', 'serif'],
    }
  }
}
```

### API Client Layer (Interim — calls existing PHP endpoints)

```ts
// packages/api-client/index.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE
  // → https://blackfiresolutions.co.za/api (web)
  // → same URL with Bearer token header (mobile)

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/${endpoint}`, {
    credentials: 'include',
    headers: { 'X-Requested-With': 'XMLHttpRequest', ...options?.headers },
    ...options,
  })
  if (res.status === 401) throw new AuthError()
  return res.json()
}
```

### Auth Strategy (Two-Phase)

**Phase 1 (interim):** PHP session bridge. Next.js middleware validates the `bf_portal` cookie by calling `api/auth.php?action=me`. Web portal unchanged. Mobile uses Bearer tokens (see §3).

**Phase 2 (target):** NextAuth with Credentials provider backed by MySQL. bcrypt hashes from `bf_users` are directly compatible with `bcryptjs`. PHP session auth retired.

```ts
// middleware.ts
export async function middleware(request: NextRequest) {
  const session = request.cookies.get('bf_portal')
  if (!session && isProtectedRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}
```

### App Router Structure

```
app/
  (public)/
    page.tsx                ← public website
    contact/page.tsx
  (portal)/
    layout.tsx              ← sidebar nav, auth gate, RBAC context
    dashboard/page.tsx
    callouts/
      page.tsx
      [id]/page.tsx
    quotes/page.tsx
    invoices/
      page.tsx
      [id]/page.tsx
    clients/page.tsx
    safety/
      page.tsx
      [id]/page.tsx
    finance/
      page.tsx
      statements/page.tsx
    admin/
      users/page.tsx
      audit/page.tsx
    secure/                 ← Secure Command (STREAM4)
      layout.tsx
      incidents/page.tsx
      vault/page.tsx
    ops/                    ← Internal Ops / Izilo Mission Control (STREAM4)
      schedule/page.tsx
      tasks/page.tsx
    hub/page.tsx            ← Portal Hub (STREAM4)
```

### Migration Approach

Keep `portal.php` live throughout. Migrate one section at a time. Sign off each section before cutover. No hard migration date — sections go live as they're ready.

### Phase Timeline

| Phase | Duration | Deliverable |
|---|---|---|
| 0 — Hosting + scaffold | Week 1 | Vercel project, env vars, monorepo |
| 1 — Types + IZILO tokens | Weeks 1–2 | Full TypeScript interfaces, Tailwind config |
| 2 — API client | Week 2 | Typed wrappers for all 18 PHP endpoints |
| 3 — Auth bridge | Weeks 2–3 | Login + session working against PHP auth |
| 4 — Portal pages | Weeks 3–8 | One page per 2–3 days, sign-off per section |
| 5 — New portals (STREAM4) | Weeks 6–10 | Secure Command, Ops Hub — native Next.js |
| 6 — PHP API migration | Weeks 10–16 | Replace endpoints one at a time with Route Handlers |

**Total to full parity + new portals: ~16 weeks.**

---

## 3. Mobile Application

### Core Principle

**One codebase → two store submissions.** Expo React Native compiles one TypeScript project into:
- `.ipa` for Apple App Store (iOS)
- `.aab` for Google Play Store (Android)

No Capacitor (webview wrappers fail Apple's Guideline 4.2 for thin-wrapper rejection). Native React Native components only.

### Why Expo

- Shares `packages/types` and `packages/api-client` with the Next.js web app
- EAS Build handles signing certificates (iOS) and keystore (Android) automatically
- `eas submit` pushes to TestFlight and Play Console from the same command
- `eas update` (OTA updates) pushes JS bundle changes without store review — for non-binary changes

### Critical Pre-Work: Bearer Token Auth (PHP)

Mobile apps cannot use PHP session cookies. A new token-based auth path must be added to `api/auth.php` alongside (not replacing) the existing session auth.

```php
// api/auth.php — new action: mobile_login
// Returns a signed Bearer token stored in bf_mobile_tokens table
// Schema: id, user_id, token_hash (SHA-256), device_id, expires_at (7 days)
```

```php
// includes/auth.php — current_user() dual-path addition
// Path 1: bf_portal session cookie (web, unchanged)
// Path 2: Authorization: Bearer <token> header (mobile)
```

No CAPTCHA on mobile login — replaced with DB-level rate limiting (5 failures → 15-minute lockout by IP + device_id).

### v1 Feature Scope

| Feature | Roles | Notes |
|---|---|---|
| Dashboard KPIs | All | Open callouts, overdue invoices, MTD revenue |
| Callouts | sysadmin, admin, manager | List, detail, update status |
| Quotes | sysadmin, admin, manager | View, approve/reject |
| Invoices | sysadmin, admin, finance | View, mark paid |
| Safety Files | sysadmin, admin, safety_officer | View list, view detail, submit |
| Clients | sysadmin, admin | View only |
| Push notifications | All | Urgent callout, approval needed, overdue invoice |
| Biometric unlock | All | Face ID / fingerprint post-login |

**Excluded from v1** (web-only): user management, audit log, document generation, finance statement generation, transaction capture, safety compliance configuration.

### Security Requirements

```ts
// Token storage — iOS Keychain / Android Keystore
import * as SecureStore from 'expo-secure-store'
await SecureStore.setItemAsync('bf_auth_token', token)
// NEVER use AsyncStorage for auth tokens

// Biometric unlock
import * as LocalAuthentication from 'expo-local-authentication'
await LocalAuthentication.authenticateAsync({ promptMessage: 'Verify your identity' })

// Certificate pinning — accept only blackfiresolutions.co.za certs
// Configured via expo-modules-core / OkHttp (Android) / NSURLSession (iOS)

// No console.log in production
// babel-plugin-transform-remove-console strips all logs at build time

// Auto-logout after 15 minutes inactivity
// AppState listener handles foreground/background transitions
```

### EAS Build & Submission

```bash
eas build --platform all --profile production
eas submit --platform ios      # → TestFlight
eas submit --platform android  # → Play Internal Testing
eas update                     # → OTA JS update (no review needed)
```

**Critical:** Download and back up the Android keystore. Losing it means the app can never be updated on Play Store.

### App Store Developer Accounts

| Store | Account | Cost | Activation |
|---|---|---|---|
| Apple App Store | Apple Developer Program | $99 USD/year (~R1,850) | 1–3 business days |
| Google Play | Google Play Console | $25 USD once (~R465) | Same day |

### Apple App Store Compliance

| Guideline | Requirement | Status |
|---|---|---|
| 2.1 App Completeness | All v1 features fully functional — no placeholders | Must verify |
| 4.2 Minimum Functionality | Native value: biometric auth, push notifications, voice capture, offline caching | Documented in review notes |
| 5.1.1 Privacy Policy | URL in app Settings + App Store listing | Must create |
| 5.1.2 Privacy Nutrition Label | Accurate data collection declaration in App Store Connect | Must complete |
| Location permissions | Do NOT request in v1 — add only when feature uses it | Clean |
| Sign In with Apple | Not required (username/password only, no social login) | Clean |
| Encryption export | Declare TLS/standard encryption as EAR 740.17(b)(3) exempt | Checkbox only |
| Age rating | 4+ (business management, no user content) | Clean |

**Privacy Nutrition Label Declarations:**
- Name — App Functionality, Linked to User
- Email Address — App Functionality, Linked to User
- User ID — App Functionality, Linked to User
- Financial Info — NOT collected on-device (server-side only)
- Location — NOT collected
- Contacts — NOT accessed

### Google Play Compliance

| Requirement | Details |
|---|---|
| Target SDK | API level 35 (Android 15) — Expo SDK 52+ handles automatically |
| Data Safety section | Must accurately match privacy nutrition label |
| Content rating | Everyone (IARC questionnaire) |
| Account deletion | Required — in-app Settings → "Delete my data" → `DELETE /api/users.php?action=self_delete` |
| Sensitive permissions | `android.permission.CAMERA` (document upload) — justify in permission rationale dialog |

### POPIA Compliance (South Africa)

The app processes personal information of identifiable SA individuals. POPIA compliance is mandatory.

**Required:**
- Privacy Policy document covering: responsible party identity, data types processed, purpose, data subject rights (access, correct, object, delete), complaints contact (Information Regulator: `inforeg.org.za`)
- International transfer disclosure if hosted on Vercel US servers
- In-app consent screen on first login
- Account deletion path (also required by Google Play)

**Data residency:** If MySQL stays on Afrihost SA servers, personal data stays in SA. If migrated to Vercel Postgres on US infrastructure, this must be disclosed in the Privacy Policy.

### Mobile Timeline

| Phase | Duration | Deliverable |
|---|---|---|
| 0 — Register developer accounts | Week 1 | Apple + Google accounts active |
| 1 — Bearer token auth (PHP) | Week 1 | `mobile_login` endpoint, `bf_mobile_tokens` table |
| 2 — Expo scaffold + monorepo | Weeks 1–2 | `apps/mobile` wired to shared packages |
| 3 — Auth + biometrics + SecureStore | Weeks 2–3 | Login, biometric unlock, session management |
| 4 — Core screens | Weeks 3–5 | Dashboard, Callouts, Quotes |
| 5 — Remaining modules + push | Weeks 5–7 | Safety, Invoices, Clients, FCM/APNs |
| 6 — Compliance work | Weeks 7–8 | Privacy policy, consent screen, account deletion |
| 7 — Security hardening | Week 8 | Cert pinning, log stripping, SecureStore audit |
| 8 — TestFlight + Internal Testing | Weeks 8–10 | Real device testing, crash fixes |
| 9 — Store submission | Weeks 10–11 | Both stores submitted, review period |

**Total: ~11 weeks to public release on both stores.**

---

## 4. AI Features

### Strategic Context

Most SA security companies run on WhatsApp and Excel. Donthok Security Technology — BlackFire's predecessor at AECI — had no digital presence whatsoever. The competitive intelligence confirms: BlackFire won the contract because of technology capability. AI features extend that lead from "has software" to "generates intelligence." The goal is to make switching away from BlackFire feel like losing a senior analyst.

### Feature 1 — AI Client Security Intelligence Reports (Priority: Critical)

**What it does:** Automatically generates a monthly PDF report for each client — AECI first — that reads like it was produced by a senior security analyst. Quantified, narrative, forward-looking.

**Report contents:**
- Executive summary (AI narrative, 2 paragraphs)
- Callout volume trend: this month vs prior 3 months
- Response time analysis: average, best, worst, trend
- Incident breakdown by type, time of day, day of week
- Safety compliance score trajectory
- Risk rating: Stable / Elevated / Critical with rationale
- Recommended action items for the client

**Architecture:**
```
MySQL (bf_callouts, bf_safety_files, bf_invoices)
  → Next.js API route aggregates + anonymises data
  → Claude API (claude-sonnet-4-20250514) writes narrative
  → WeasyPrint / Puppeteer renders PDF
  → Brevo delivers to client email + portal download
```

**Why it wins:** AECI's procurement team receives a document that looks like it cost R5,000 to produce. It takes 30 seconds. Twelve months of these reports at contract renewal is switching cost no competitor can match.

**Estimated cost:** < R90/month at current client scale.

---

### Feature 2 — Voice-to-Callout Report (Mobile)

**What it does:** Field officer presses record, speaks the incident report. AI transcribes and structures it into a pre-filled callout form. Review, confirm, submit in under 30 seconds.

**Architecture:**
```
Expo Audio → OpenAI Whisper API (transcription)
  → Claude API extracts structured fields:
     { service, location, priority, description, actions_taken }
  → Form pre-fills in the mobile app
  → Officer reviews → submits to bf_callouts
```

**Claude extraction prompt:**
```
Parse this spoken incident report into structured JSON.
Fields: service (incident type), location (where on site),
priority (Normal/Urgent/Emergency), description (1-2 factual sentences),
actions_taken (1 sentence). Return null for unclear fields.
```

**Why it wins:** No other SA security company has this. Field staff adoption increases. Reports get submitted faster and more accurately. It is a genuine wow moment in a client demo.

---

### Feature 3 — Safety File AI Co-pilot

**What it does:** Transforms the 86+ item safety compliance checklist from a form-filling exercise into an intelligent assistant. Three capabilities:

**3a. Smart pre-fill from history**
New files for a known site pre-populate from previous submissions. Items that consistently pass remain "Pass." Items previously "Not to Standard" are flagged: *"Watch: failed previously — verify before marking Pass."*

**3b. Narrative comment generation**
For every "Not to Standard" item, AI generates a specific, regulation-referenced remediation comment based on item type, attachments, and any notes. No generic filler — precise, AECI-standard language.

**3c. Compliance risk prediction**
Before submission, AI reviews the completed file and flags forward risks: *"Section C: 2 medical certificates expire within 30 days. Submit renewal requests before the next audit cycle."*

**Architecture:**
```
bf_safety_files + bf_safety_items (MySQL)
  → Claude API with section context + OHS Act / AECI reference library
  → Pre-fill suggestions, comment generation, risk flags
  → Displayed in safety file UI as AI annotations (reviewable, editable)
```

**Why it wins:** AECI's safety officers have high expectations. Compliance files with AI-generated, regulation-precise notes signal operational excellence. Cuts compliance administration time significantly.

---

### Feature 4 — Callout Anomaly Detection

**What it does:** Analyzes `bf_callouts` history to surface patterns that human review would miss. Appears as an **AI Intelligence** widget on the dashboard.

**Flags it generates:**
- Unusual callout frequency: *"AECI Chempark: 340% increase in perimeter alerts Tuesday–Thursday nights over the past 3 weeks. Pattern is atypical — consider increased patrol coverage during those windows."*
- Recurring incident clusters: *"Suspicious vehicle reports at Gate 2 account for 68% of urgent callouts this month, up from 22% in prior months."*
- Response time drift: *"Average response to Urgent callouts has increased from 8 to 14 minutes over 6 weeks. Review shift coverage."*

**Architecture:**
```
bf_callouts aggregated by time window, type, location, priority
  → Claude API interprets statistical patterns
  → Dashboard widget: "AI Intelligence" — flagged items with dismiss/acknowledge toggle
```

**Why it wins:** Turns operational data into proactive security management. BlackFire is no longer just responding to incidents — it is predicting and preventing them.

---

### AI Implementation Stack

| Component | Tool |
|---|---|
| AI text generation | Claude API (`claude-sonnet-4-20250514`) |
| Voice transcription | OpenAI Whisper |
| PDF rendering | WeasyPrint (Python) or Puppeteer (Node) |
| Report scheduling | Vercel Cron (monthly trigger) |
| API integration | Next.js API routes (`/api/ai/*`) |
| Monthly cost (current scale) | < R180/month total |

### AI Build Order

| Month | Feature | Business Rationale |
|---|---|---|
| 1 | Client Intelligence Reports | Directly protects AECI contract renewal |
| 2 | Voice-to-Callout (ships with mobile app) | Field differentiation + app store wow factor |
| 3 | Safety File Co-pilot | Reduces compliance labour, elevates AECI file quality |
| 4 | Callout Anomaly Detection | Forward-looking intelligence layer (needs 6+ months of data) |

---

## 5. Full Timeline Summary

| Stream | Period | Deliverable |
|---|---|---|
| Next.js scaffold + types | Weeks 1–2 | Monorepo, IZILO tokens, TypeScript interfaces |
| API client + auth bridge | Weeks 2–3 | Next.js calls PHP API, login works |
| Portal pages migration | Weeks 3–8 | Section-by-section, sign-off before cutover |
| Bearer token auth (PHP) | Week 1 | Mobile unblocked |
| Expo scaffold + auth | Weeks 2–3 | Mobile login, biometrics, SecureStore |
| Mobile core screens | Weeks 3–7 | All v1 portal features on mobile |
| Mobile compliance + hardening | Weeks 7–8 | Privacy policy, cert pinning, data safety forms |
| Store submission | Weeks 10–11 | Both stores live |
| STREAM4 new portals | Weeks 6–10 | Secure Command, Ops, Hub — native Next.js |
| PHP API migration | Weeks 10–16 | Replace endpoints with Route Handlers |
| AI Report (v1) | Month 1 | Client Intelligence Reports live |
| AI Voice | Month 2 | Ships with mobile app |
| AI Safety Co-pilot | Month 3 | Safety module enhanced |
| AI Anomaly Detection | Month 4 | Dashboard intelligence layer |

---

## 6. Immediate Next Steps

1. **Register developer accounts** — Apple Developer Program ($99/year) and Google Play Console ($25 once). Both need days to activate. Do this before writing app code.

2. **Add Bearer token auth to PHP** — `bf_mobile_tokens` table + `api/auth.php?action=mobile_login` + dual-path `current_user()`. This unblocks the entire mobile build.

3. **Draft Privacy Policy** — needed for both store listings on day one. Must be POPIA-compliant and accessible via URL from within the app.

4. **Vercel project setup** — connect GitHub repo (`ndlunkulu` branch), configure env vars, confirm Afrihost CORS headers.

---

## 7. Naming Conventions

| Context | Convention |
|---|---|
| Portal internal name | Umlilo Portal |
| Brand editorial imprint | BLKFR |
| Internal spec codes | IZILO-[domain]-[seq] |
| Never use | BFS (explicitly rejected) |
| Session log naming | `[topic]_YYYYMMDD_HHmmss.md` |
| Portal HTML versions | `BlackFire_Portal_AECI_v[N].html` |
| Documents folder in repo | `BlackFire/docs/` |

---

*BLKFR — Fire, taught to behave.*
