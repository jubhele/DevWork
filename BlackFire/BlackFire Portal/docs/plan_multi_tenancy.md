# Plan: Multi-Tenancy — Multiple Host Companies
Status: DRAFT — weekly review, do not implement ahead of schedule
Last reviewed: 2026-06-03
Next review: 2026-06-10

---

## Problem Statement

The portal is built with BlackFire Solutions as an implicit, hardcoded host company.
This works today but will create friction if a second company (e.g. a sister brand, a
partner firm, or a white-label client) needs their own branded instance of the same modules.

The goal is to make the host-company layer dynamic — one codebase, one database, multiple
tenants — without confusing existing admins or breaking any current functionality.

---

## What Is Currently Hardcoded

### config.php
| Key | Hardcoded value | Notes |
|-----|----------------|-------|
| `company_name` | `BlackFire Solutions` | Appears on all documents |
| `company_legal_name` | `Astute Insights Pty Ltd` | Entity on issued docs |
| `company_reg` | `2021/964381/07` | |
| `company_vat` | `4060310358` | |
| `company_phone/email/addr` | BlackFire-specific | |
| `session_name` | `BLKFR_SESSION` | Cookie name |
| `base_url` | `blackfiresolutions.co.za` | All links point here |
| `mail_from` / `mail_host` | BlackFire SMTP | Per-tenant email needed |
| `invoice_prefix` / `quote_prefix` / `callout_prefix` | `INV` / `QTE` / `CO` | |
| `aeci_*` keys | AECI-specific | Should live in bf_clients, not config |

### Database (implicit single-tenant)
- `bf_users` — no concept of which company a user belongs to
- `bf_clients` — implicitly AECI Chempark's clients, not scoped to a host company
- All finance tables (`bf_callouts`, `bf_quotes`, `bf_invoices`, etc.) — no tenant ID

### Branding
- Logo files: BlackFire PNG/SVG assets checked into repo
- CSS: BlackFire brand colors baked into `portal.css`
- `app_name` = `Umlilo Portal` — already generic ✅

---

## Secrets & Encryption Strategy

### What lives where

| Secret | Location | Notes |
|--------|----------|-------|
| `BF_APP_KEY` | `~/blackfire_secrets.php` (outside webroot) | Master key — never changes across tenants |
| `BF_DB_PASS_ENC` | `~/blackfire_secrets.php` | Encrypted DB password — shared by all tenants (same DB) |
| `BF_MAIL_PASS` | `~/blackfire_secrets.php` (Phase 0) → `bf_host_companies.mail_password_enc` (Phase 1+) | Per-tenant SMTP password encrypted with `BF_APP_KEY` |
| Company identity (name, VAT, reg…) | cPanel env vars (Phase 0) → `bf_host_companies` encrypted columns (Phase 1+) | `cfg_env()` checks env → defined constant → fallback |
| Logo path | `COMPANY_LOGO` env var (Phase 0) → `bf_host_companies.logo_path` (Phase 1+) | Points to `uploads/logos/{id}/logo.png` after Phase 3 |

### Key principle
**`blackfire_secrets.php` never changes for multi-tenancy.** It holds only global secrets (master key + DB creds). All per-tenant sensitive data is stored in `bf_host_companies` encrypted with the same `BF_APP_KEY`. One file, one key, everything else in the DB.

### cfg_env() lookup order
`config.php` uses `cfg_env(key, default)` which checks:
1. `getenv(key)` — cPanel env vars (production)
2. `$_ENV[key]` — populated from `.env` file (local dev)
3. `$_SERVER[key]` — some hosting environments populate this instead
4. `defined(key) ? constant(key)` — `blackfire_secrets.php` constants (fallback for hosts where putenv is disabled)
5. `$default` — hardcoded fallback until env vars are configured

### Encrypting per-tenant fields in Phase 1
The portal needs a `bf_encrypt()` companion to the existing `bf_decrypt()`:
```php
function bf_encrypt(string $plaintext): string {
    $keyHex = cfg_env('BF_APP_KEY', '');
    $iv = random_bytes(16);
    $enc = openssl_encrypt($plaintext, 'AES-256-CBC', hex2bin($keyHex), OPENSSL_RAW_DATA, $iv);
    return base64_encode($iv . $enc);
}
```
Fields to encrypt in `bf_host_companies`: `vat_number`, `reg_number`, `mail_password`, `company_email`.
Fields that can stay plain text (appear on public documents): `name`, `legal_name`, `address`, `logo_path`, `primary_color`.

---

## Architecture Decision

**Chosen approach: single database, `host_company_id` scoping**

Rejected:
- Separate DB per tenant — schema migrations would need to run N times; overkill at current scale
- Separate schema per DB — MySQL doesn't support this cleanly; PostgreSQL-only pattern

Rationale: The portal is already on MySQL/MariaDB. A `bf_host_companies` table with an FK
on every data table is the standard SaaS pattern. At expected scale (< 10 tenants) there is
no meaningful performance difference, and a single schema migration covers all tenants.

---

## Data Model (target state)

```sql
-- New table: one row per host company
CREATE TABLE bf_host_companies (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(100) NOT NULL,       -- trading name, shown in portal
  legal_name       VARCHAR(150) NOT NULL,       -- entity on issued documents
  reg_number       VARCHAR(50)  NOT NULL DEFAULT '',
  vat_number       VARCHAR(30)  NOT NULL DEFAULT '',
  phone            VARCHAR(30)  NOT NULL DEFAULT '',
  email            VARCHAR(150) NOT NULL DEFAULT '',
  address          TEXT         NOT NULL DEFAULT '',
  logo_path        VARCHAR(255) NOT NULL DEFAULT '',  -- relative to portal root
  primary_color    CHAR(7)      NOT NULL DEFAULT '#d62b2b',
  accent_color     CHAR(7)      NOT NULL DEFAULT '#1a1a2e',
  invoice_prefix   VARCHAR(10)  NOT NULL DEFAULT 'INV',
  quote_prefix     VARCHAR(10)  NOT NULL DEFAULT 'QTE',
  callout_prefix   VARCHAR(10)  NOT NULL DEFAULT 'CO',
  base_url         VARCHAR(255) NOT NULL DEFAULT '',
  mail_from        VARCHAR(150) NOT NULL DEFAULT '',
  mail_from_name   VARCHAR(100) NOT NULL DEFAULT '',
  mail_host        VARCHAR(150) NOT NULL DEFAULT '',
  mail_port        SMALLINT     NOT NULL DEFAULT 587,
  mail_username    VARCHAR(150) NOT NULL DEFAULT '',
  -- mail_password stored in secrets file or env, keyed by host_company_id
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_active        TINYINT(1)   NOT NULL DEFAULT 1
);

-- Seed: BlackFire Solutions = host_company_id 1 (never changes — all existing data uses this)
```

Tables that need `host_company_id INT NOT NULL DEFAULT 1` added:
- `bf_users`
- `bf_clients`
- `bf_callouts`
- `bf_quotes`
- `bf_invoices`
- `bf_payments`
- `bf_bank_transactions`
- `bf_safety_files`
- `bf_safety_checkpoints`
- `bf_services`
- `bf_personnel`

---

## Implementation Phases

### Phase 0 — Mindset (NOW, no DB changes)
*Do not block current work. Apply these rules to all new code going forward.*

- [ ] Never hardcode `'BlackFire'` or `'Astute Insights'` in new PHP — always read from `$cfg['company_name']`
- [ ] When creating any new table, include `host_company_id INT NOT NULL DEFAULT 1 COMMENT 'FK bf_host_companies.id'` as a column from day one
- [ ] Move `aeci_*` config keys out of config.php into `bf_clients` table (already partially done via `migration_client_legal_name.sql`)
- [ ] Do not build any new admin UI that assumes a single company

### Phase 1 — bf_host_companies table
*Prerequisite: system is stable and schema changes are low-risk.*

- [ ] Create `bf_host_companies` table (schema above)
- [ ] Seed BlackFire Solutions as `id=1` — all existing data remains valid (DEFAULT 1)
- [ ] Add `host_company_id` FK to `bf_users` — each user belongs to one host company
- [ ] Session sets `$_SESSION['host_company_id']` on login
- [ ] Config loader: if DB is available, merge `bf_host_companies` row over config.php values
- [ ] Remove `company_*` and `aeci_*` keys from config.php after migration

### Phase 2 — Data scoping
*Prerequisite: Phase 1 complete and tested.*

- [ ] Add `host_company_id` FK to all tables listed above via migration
- [ ] All API queries: add `AND host_company_id = :hcid` to every SELECT/INSERT/UPDATE
- [ ] Middleware helper: `getHostCompanyId()` reads from session — single source of truth
- [ ] Sysadmin can pass `?host_company_id=N` to see any tenant (superuser override)

### Phase 3 — Branding per tenant
*Prerequisite: Phase 2 complete.*

**Branding upload flow (per tenant):**
1. Sysadmin/admin uploads a logo PNG/SVG via a portal settings page.
2. The upload API (`api/admin.php?action=upload_logo`) validates the file (type: PNG/SVG/JPG, max 2 MB), stores it at `uploads/logos/{host_company_id}/logo.{ext}`, and updates `bf_host_companies.logo_path`.
3. `portal.php` reads `company_logo` from config (env var → DB row in Phase 1+). All `<img src>` and OG/JSON-LD URL references are already wired to `$cfg['company_logo']` and `$companyLogoUrl` (Phase 0 complete).
4. CSS colour overrides are injected into `<head>` as inline CSS variables from the `bf_host_companies` row (already safe under the CSP nonce).

**Checklist:**
- [ ] Logo: serve from `uploads/logos/{host_company_id}/logo.png` — path written to `bf_host_companies.logo_path` and read into `COMPANY_LOGO` env var (or DB row after Phase 1)
- [ ] Logo upload endpoint: `api/admin.php?action=upload_logo` — validate type/size, store, update DB row
- [ ] CSS colour injection: read `primary_color`/`accent_color` from `bf_host_companies`, emit `<style nonce="...">:root{--color-primary:#...;--color-accent:#...}</style>` in `<head>`
- [ ] Remove hardcoded hex values from portal.css (replace with CSS variables already declared)
- [ ] Portal title and favicon: dynamic per tenant (favicon stored as `uploads/logos/{id}/favicon.ico`)
- [ ] Document PDF headers: read `company_name`, `legal_name`, `vat_number` from `bf_host_companies`
- [ ] Email sender: per-tenant SMTP config (mail_host/mail_from keyed by host_company_id)

### Phase 4 — Provisioning UI + Tenant Onboarding
*Prerequisite: Phase 3 complete. This is the last gate before the system is truly multi-tenant.*

**Access**: Only `sysadmin` role can create or manage tenants. Tenant admins can edit their own company settings (Steps 1–3) but cannot create new tenants or change feature flags.

**Tenant onboarding flow** (sysadmin creates a new tenant):

Step 1 — Company identity
- Trading name, legal/registered name, reg number, VAT number
- Phone, email, address, tagline

Step 2 — Branding
- Logo upload (PNG/SVG, max 2 MB) → stored at `uploads/logos/{id}/logo.png`
- Primary colour (hex picker) — used for buttons, accents
- Accent colour (hex picker) — used for sidebar, headers

Step 3 — Email / SMTP
- Option A: use shared portal mailer (zero config for tenant)
- Option B: custom SMTP (mail_host, mail_port, mail_from, mail_username, mail_password)

Step 4 — First admin user
- Full name, email address, initial password (forced change on first login)
- Role: `admin` scoped to this host_company_id

Step 5 — Document config
- Invoice prefix, quote prefix, callout prefix (e.g. INV / QTE / CO)
- Default hourly rate, currency

Step 6 — Module selection
- Toggle feature flags: invoices, quotes, callouts, reports, safety, digital signatures, external uploads
- Any flag disabled at tenant level = hidden from that tenant's portal entirely

Step 7 — Review & activate
- Summary of all settings
- "Activate Tenant" button — writes `bf_host_companies` row, creates admin user, sets env vars (or DB row)
- Sends welcome email to the new admin with login link

**Post-onboarding:**
- Tenant admin can edit their own company details via a "Company Settings" page (subset of the above, no step 4/6)
- Sysadmin can revisit any step at any time from the tenant management list

**Checklist:**
- [ ] Sysadmin page: create / edit / deactivate host companies
- [ ] Multi-step onboarding wizard (7 steps above)
- [ ] Tenant settings page for admin (identity + branding + SMTP only)
- [ ] Assign admin users to a host company on user-create
- [ ] Cross-tenant dashboard for sysadmin (aggregate view)
- [ ] Welcome email sent to new tenant admin on activation
- [ ] Subdomain routing (optional): `blackfire.portal.example.com` vs `astute.portal.example.com` resolves to `host_company_id` via `$_SERVER['HTTP_HOST']` lookup

---

## Open Questions (resolve during weekly reviews)

1. **Deployment model**: True multi-tenant (one live instance, multiple companies sharing it) or white-label (separate cPanel deployments per client, same codebase)? White-label is simpler to operate; multi-tenant is cheaper to maintain.
2. **Subdomain routing**: If white-label, this is not needed. If multi-tenant, do we want `blackfire.umlilo.app` vs `astute.umlilo.app` or a single URL with a company picker on login?
3. **Cross-tenant sysadmin**: Does the sysadmin seat span all tenants or is each company fully isolated?
4. **Shared services list**: Are services (callout categories, safety checklist templates) shared across tenants or per-tenant?
5. **Billing between tenants**: Does the portal track which host company issued a document to which client? (Currently implicit — all documents belong to BlackFire.)
6. **Client portals**: Clients (AECI) log in as `viewer` today. In a multi-tenant world, which host company's data do they see?

---

## What to Keep in Mind for Every PR / Fix

Until Phase 2 is complete, follow Phase 0 rules strictly:

1. **New tables**: always add `host_company_id INT NOT NULL DEFAULT 1`
2. **New config values**: if it's company-specific, put it in `bf_host_companies` (future) not `config.php`
3. **Hardcoded strings**: grep your diff for `BlackFire`, `Astute`, `BLKFR` — if any appear outside config or comments, replace with a config read
4. **New API endpoints**: design the WHERE clause to include a `host_company_id` filter even if it's always `= 1` right now
5. **UI labels**: "Host company" not "BlackFire" when referring to the service provider in admin screens

---

## Review Log

| Date | Reviewer | Status | Notes |
|------|----------|--------|-------|
| 2026-06-03 | J. Shange | Draft created | Idea captured; no implementation yet |
| 2026-06-03 | J. Shange | Phase 0 implemented | Env vars for all company_* config; logo path dynamic; migration_dashboard_layout.sql tenant-aware; onboarding flow and sysadmin-only access clarified in Phase 4 |
| 2026-06-10 | — | — | Scheduled weekly review |
