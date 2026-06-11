# BlackFire Portal — Production Deployment Checklist
**BLKFR · UMLILO-DEPLOY-001 · 2026-05-24**

---

## Pre-flight: What you need

- cPanel login for `blackfiresolutions.co.za` (user: `blackfm6w9f9`)
- FileZilla or cPanel File Manager
- The portal files from GitHub (`ndlunkulu` branch)

---

## Step 1 — Create the MySQL database

In cPanel → **MySQL Databases**:

1. Create database: `blackfm6w9f9_portal`
2. Create user: `blackfm6w9f9_umlilo_admin` with a strong password (save this)
3. Add user to database — grant **ALL PRIVILEGES**

---

## Step 2 — Generate secrets

1. Upload `encrypt_secrets.php` to `public_html/` temporarily (as `gen.php`)
2. Open `https://blackfiresolutions.co.za/gen.php` in browser
3. Enter your DB password (from Step 1) and optionally your mail password
4. Click **Generate blackfire_secrets.php**
5. Copy the entire output

---

## Step 3 — Deploy blackfire_secrets.php

The secrets file must go **one level above public_html** — NOT inside it.

```
/home/blackfm6w9f9/          ← home directory
├── public_html/             ← web root (portal files go here)
│   └── ...
└── blackfire_secrets.php    ← PUT IT HERE ← never web-accessible
```

In FileZilla:
- Navigate to `/home/blackfm6w9f9/` (not `public_html`)
- Create new file `blackfire_secrets.php`
- Paste the generated content
- Save

---

## Step 4 — Upload portal files

Upload the contents of `BlackFire/BlackFire Portal/` to `public_html/`:

```
public_html/
├── .htaccess
├── index.php
├── portal.php
├── portal.js
├── portal.css
├── favicon*.png + favicon.ico + apple-touch-icon.png
├── blackfire_logo_transparent.png
├── blackfire_icon_transparent.png
├── api/
│   ├── .htaccess
│   ├── auth.php, callouts.php, invoices.php ...  (all endpoint files)
│   └── index.php
├── includes/
│   ├── auth.php, db.php, helpers.php, mailer.php
│   └── .htaccess
├── config/
│   ├── config.php
│   └── .htaccess
└── install/
    └── (SQL migration files)
```

**Do NOT upload:**
- `.env` files
- `_archive/` folder
- `_backups/` folder
- `dev-only/` folder — testing scripts, seed data, scratch files; never served
- `qa/` folder — QA validation scripts; developer tooling only, never served
- `encrypt_secrets.php` / `gen.php` — delete after use
- `bhekani_bo.php` — dev tool only, skip for production

---

## Step 5 — Run database migrations

In cPanel → **phpMyAdmin** → select `blackfm6w9f9_portal`:

Run these SQL files **in order**:

```
1. install/rbac_full_migration.sql       ← Main schema (tables + admin user)
2. install/clients_migration.sql
3. install/relationships_migration.sql
4. install/safety_migration.sql
5. install/safety_officer_migration.sql
6. install/personnel_compliance_migration.sql
7. install/personnel_email_migration.sql
8. install/safety_attachments_seed.sql   ← Optional: seed safety data
9. install/policy_ack_migration.sql
10. install/link_users_migration.sql
11. install/attachments_migration.sql
12. install/add_pay_counter.sql
```

---

## Step 6 — Create uploads directory

In cPanel File Manager:

```
public_html/
└── uploads/
    └── attachments/    ← Create this, set permissions to 755
```

---

## Step 7 — Verify

Open `https://blackfiresolutions.co.za` — should show the BlackFire public site.

Click **Umlilo Portal** — should show the login screen.

Login with admin credentials (set in `rbac_full_migration.sql`).

---

## Troubleshooting HTTP 500

Check cPanel → **Error Logs** for the specific PHP error.

Common causes:
| Error | Fix |
|-------|-----|
| `BF_APP_KEY is not set` | `blackfire_secrets.php` missing or in wrong location |
| `Access denied for user` | DB credentials wrong in `blackfire_secrets.php` |
| `Unknown database` | Database not created yet (Step 1) |
| `Table not found` | Migrations not run (Step 5) |
| `headers already sent` | PHP parse error in a file — check error log |

---

## Default admin credentials

Set during `rbac_full_migration.sql`. Change immediately after first login.

Check the SQL file for the default username/password hash.

---

*BlackFire Solutions · BLKFR · Jubhele + Claude · 2026-05-24*
