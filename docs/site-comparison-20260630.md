# Three-Site Comparison — BlackFire PHP Portal · Umlilo Next.js Portal · BlackFire Mobile App

Date: 2026-06-30
Scope: Pages/routes, branding, data models, auth, features, tech stack.
Mode: Compare only — no edits made.

---

## TL;DR

| Dimension | PHP Portal | Next.js (umlilo-portal) | Next.js + Expo (BlackFire/apps) |
|---|---|---|---|
| Status | Production, source of truth for data | Thin SSR client over PHP API | Newer monorepo, partly redundant with umlilo-portal |
| Brand | ✅ Full thermal-geometry system | ✅ Matches PHP | ✅ Matches PHP |
| Auth | PHP session + bearer fallback | Custom HMAC cookie (`bf_portal`) | Web: session cookie · Mobile: bearer + expo-secure-store |
| Data | Direct MySQL (`bf_*` tables) | Fetches PHP `/api/*` (no ORM) | **Drizzle ORM + MySQL** (parallel data layer) |
| Roles | 7 roles | **11 roles** | **11 roles** |
| Risk | — | Drift if PHP changes contract | **Two DB layers competing** (PHP `bf_*` vs Drizzle) |

The two Next.js codebases overlap heavily. `BlackFire/apps/web` appears to be the next-generation replacement (has its own DB via Drizzle, more routes, admin pages, mobile app). `umlilo-portal` is a thinner SSR client of the PHP API.

---

## 1. Routes / Pages

| Route | PHP | umlilo-portal | BlackFire/apps/web | Mobile |
|---|:-:|:-:|:-:|:-:|
| `/` landing | ✅ portal.php | ✅ | ✅ | — |
| `/login` | ✅ (in portal) | ✅ | ✅ | ✅ |
| `/privacy` | — | ✅ | ✅ | — |
| `/dashboard` | ✅ | ✅ | ✅ | ✅ |
| `/callouts` | ✅ | ✅ list | ✅ list+new | — |
| `/callouts/[id]` | ✅ | — | ✅ | — |
| `/tracker` | ✅ (qa_tracker) | ✅ new+[id] | ✅ +TaskActions | ✅ |
| `/quotes` | ✅ | ✅ | ✅ +new | ✅ |
| `/invoices` | ✅ | ✅ | ✅ +new | ✅ |
| `/finance` | ✅ | — | ✅ | (under Finance tab) |
| `/clients` | ✅ | — | ✅ +new | — |
| `/safety` | ✅ | — | ✅ | — |
| `/hub` | — | — | ✅ | — |
| `/ops` | — | — | ✅ | — |
| `/secure` | — | — | ✅ | — |
| `/help` | — | — | ✅ | — |
| `/support` | — | — | ✅ | ✅ |
| `/call-log` | — | — | — | ✅ |
| `/consent` | — | — | — | ✅ |
| `/admin/audit` | ✅ | ✅ | ✅ | — |
| `/admin/users` | ✅ | — | ✅ | — |
| `/admin/roles` | ✅ | — | ✅ | — |
| `/admin/categories` | — | — | ✅ | — |
| `/forbidden` | — | — | ✅ | — |
| `/approve` (token) | ✅ | — | — | — |
| `/sign` (e-sig) | ✅ | — | — | — |
| `/external_upload` | ✅ | — | — | — |
| `/policy_ack` | ✅ | — | — | — |

**Gaps:**
- **umlilo-portal is the smallest** — missing finance, clients, safety, admin/users, admin/roles, and all token-gated public flows.
- **Token-gated public flows** (approve, sign, external_upload, policy_ack) exist **only in PHP**. Neither JS app has them.
- **BlackFire/apps/web** is the closest to PHP feature parity and adds `/hub`, `/ops`, `/secure`, `/help`.

---

## 2. Branding

Consistent across all three. No drift.

| Token | PHP | umlilo-portal | apps/web |
|---|---|---|---|
| Primary accent | `#E05A1A` | `#E05A1A` | `#E05A1A` |
| Coal bg | `#0A0E19` | `#0A0E19` | `#0A0E19` |
| Display font | Big Shoulders Display | ✅ | ✅ |
| Body font | Instrument Sans | ✅ | ✅ |
| Mono | IBM Plex Mono | ✅ | ✅ |
| Logo | `blackfire_logo_transparent.png` | same | same |
| Tagline | "Security Engineered to Protect" | "operational management portal" | (matches umlilo) |

**Drift:** Taglines differ between PHP marketing ("Security Engineered to Protect") and the portals ("operational management portal"). Minor.

---

## 3. Data Models

### Source of truth
- **PHP**: MySQL tables prefixed `bf_*` (canonical schema).
- **umlilo-portal**: TypeScript interfaces in `@blackfire/types`, generated from `portal.contract.json`. **No DB.**
- **BlackFire/apps/web**: **Drizzle ORM schema** — parallel MySQL data layer.

### Schema parity (entities)

| Entity | PHP table | TS type (umlilo) | Drizzle (apps) |
|---|---|---|---|
| User | `bf_users` + `bf_user_roles` | `User` | ✅ |
| Client | `bf_clients` | `Client` | ✅ |
| Callout | `bf_callouts` | `Callout` | ✅ |
| Quote | `bf_quotes` | `Quote` (+QuoteItem) | ✅ |
| Invoice | `bf_invoices` | `Invoice` | ✅ |
| Task | (qa_tracker) | `Task` | ✅ |
| SafetyFile | `bf_safety_files` + personnel + compliance | `SafetyFile` | ✅ |
| Audit | (logs) | `AuditEvent` | ✅ |
| Statement | `bf_statements` | — | `Statement` + transactions |
| Mobile token | `bf_mobile_tokens` | — | (Drizzle equivalent) |
| Attachments | `bf_attachments` (generic) | — | ? |
| Policy ack | `bf_policy_acks` | — | — |
| Digital sig | `bf_digital_signatures` | — | — |

**Critical drift:**
1. **Two writable databases**: PHP writes to `bf_*`. `apps/web` writes via Drizzle. Unclear if they target the **same MySQL DB** or two separate ones. If separate, data is forking. **This is the highest-risk finding.**
2. **Attachments, policy_acks, digital_signatures**: only modelled in PHP. Lost if migrating off PHP without porting.

---

## 4. Auth

| Aspect | PHP | umlilo-portal | apps/web | Mobile |
|---|---|---|---|---|
| Mechanism | PHP `$_SESSION` | HMAC-signed cookie | Session cookie | Bearer JWT |
| Cookie name | `bf_portal` | `bf_portal` | `bf_portal` | — |
| Token storage | session table | cookie payload | cookie payload | expo-secure-store + biometric |
| User shape | `bf_users` row | `{ user, token, phpSessionId? }` | same as umlilo | bearer with device_id |
| CAPTCHA | ? | — | ✅ on login | — |
| Roles | 7 | **11** | **11** | 11 |

**Drift:**
- Role count mismatch: PHP defines 7 roles; both JS portals reference 11 (adds `finance`, `client_support`, `junior_tech`, `senior_tech`, `call_logger`, `admin_clerk`, drops some). PHP `bf_role_permissions` table needs the extra roles seeded, or JS `can()` checks will fail against real users.
- `phpSessionId` in cookie payload suggests JS portals can **bridge** to a PHP session — confirm this is wired, or remove the field.

---

## 5. Features

| Feature | PHP | umlilo | apps/web | Mobile |
|---|:-:|:-:|:-:|:-:|
| Callouts CRUD | ✅ | read-only | ✅ | read |
| Quotes pipeline | ✅ | read | ✅ | read |
| Invoices + aging | ✅ | read | ✅ | read |
| Safety compliance | ✅ | — | ✅ | — |
| Audit trail | ✅ | read (admin) | ✅ | — |
| Client CRUD | ✅ | — | ✅ | — |
| Finance / statements | ✅ | — | ✅ | — |
| Policy acknowledgement | ✅ | — | — | — |
| Digital signatures | ✅ | — | — | — |
| External upload (token) | ✅ | — | — | — |
| Approve flow (token link) | ✅ | — | — | — |
| Device enrolment | — | — | — | ✅ |
| Biometric unlock | — | — | — | ✅ |
| CAPTCHA login | ? | — | ✅ | — |
| Dashboard KPIs | ✅ | ✅ | ✅ | ✅ |
| Theme toggle | ? | ✅ | ✅ | dark only |

**Features only in PHP** (not yet ported anywhere): policy_acks, digital_signatures, external_upload, token-gated approve.
**Features only in JS**: CAPTCHA login (apps/web), device enrolment + biometric (mobile).

---

## 6. Tech stack

| Stack | PHP | umlilo-portal | BlackFire/apps |
|---|---|---|---|
| Backend | PHP 8.x | (uses PHP API) | Next.js API + Drizzle |
| Frontend | Vanilla JS SPA | Next.js 16.2 / React 19 | Next.js 16.2 / React 19 + Expo 56 RN 0.85 |
| Styling | CSS vars | Tailwind 4 `@theme` | Tailwind 4 |
| DB | MySQL 8 (utf8mb4) | none | MySQL 8 via Drizzle ORM |
| Auth | PHP session | HMAC cookie | session cookie + bearer |
| Language | PHP + JS | TS 5 | TS 5/6 |
| Build | — | pnpm monorepo | pnpm monorepo |

---

## 7. Recommended sync direction (for a follow-up session)

**If PHP remains source of truth (lowest risk):**
1. Port 4 missing token-gated flows (`approve`, `sign`, `external_upload`, `policy_ack`) into `apps/web` as public routes.
2. Reconcile role list: extend PHP `bf_role_permissions` seed to include the 11-role set, or shrink JS `can()` matrix to 7.
3. Confirm `apps/web` Drizzle points at the **same MySQL schema** as PHP (use `bf_*` table names) — or document the migration boundary.
4. Decide fate of `umlilo-portal`: deprecate (apps/web supersedes it) or scope it as the client-facing slim portal.

**If Next.js (apps/web) is the target:**
1. Generate Drizzle schema from `bf_*` tables to guarantee parity.
2. Port the 4 token flows + attachments + digital signatures.
3. Migrate writes one entity at a time; PHP becomes read-only fallback.
4. Sunset umlilo-portal.

---

## Files inspected (not exhaustive)

- `BlackFire/BlackFire Portal/` — portal.php, index.php, approve.php, install/*.sql
- `umlilo-portal/apps/*`, `packages/types`, `packages/ui-tokens`, `packages/api-client`
- `BlackFire/apps/web` (Next.js), `BlackFire/apps/mobile` (Expo), `BlackFire/packages/*`
