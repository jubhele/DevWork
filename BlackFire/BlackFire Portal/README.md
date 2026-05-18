# Umlilo Portal — PHP/MySQL Installation Guide
**Version 1.0 · Built for Afrihost cPanel Linux Hosting**

---

## Requirements

| Requirement | Minimum |
|---|---|
| PHP | 7.4+ (8.0+ recommended) |
| MySQL / MariaDB | 5.7+ / 10.3+ |
| Apache | mod_rewrite enabled |
| PHP Extensions | pdo, pdo_mysql, json |

---

## Step-by-Step Installation

### 1. Create the Database

In **cPanel → MySQL Databases**:
1. Create a new database: e.g. `blackfire_portal`
2. Create a database user with a strong password
3. Add the user to the database with **All Privileges**
4. Note down: DB host (usually `localhost`), DB name, DB user, DB password

---

### 2. Upload Files

Upload the entire `blackfire-portal/` directory to your web server.

**Recommended path:**
```
public_html/portal/          ← all files go here
```

So the URL becomes: `https://blackfiresolutions.co.za/portal/`

**Upload method:**
- Use **cPanel File Manager** → Upload zip → Extract
- OR use **FTP** (FileZilla) to transfer files

---

### 3. Set Directory Permissions

In cPanel File Manager, ensure:
```
config/          → 755 (directory) / 644 (files)
install/         → 755
api/             → 755
includes/        → 755
portal.php       → 644
index.php        → 644
.htaccess        → 644
```

The `config/config.php` file will be written by the installer — ensure `config/` is **writable** (755).

---

### 4. Run the Installer

Open your browser and go to:
```
https://blackfiresolutions.co.za/portal/install/
```

The installer will:
1. ✅ Check PHP requirements
2. ✅ Test your database connection
3. ✅ Create all tables and seed sample data
4. ✅ Write `config/config.php`
5. ✅ Lock itself from running again

---

### 5. Delete the Install Directory

**IMPORTANT — Security step:**

After installation completes, delete the `/install/` directory via cPanel File Manager or FTP.

---

### 6. Access the Portal

```
https://blackfiresolutions.co.za/portal/
```

---

## Default Login Credentials

Change these immediately after first login.

| Role | Username | Default Password |
|---|---|---|
| System Administrator | `admin` | *(your chosen password)* |
| Operations Manager | `manager` | `BlackFire2026!` |
| Call Logger | `calllog` | `CallLog2026!` |
| Junior Technician | `jtech` | `JTech2026!` |
| Senior Technician | `stech` | `STech2026!` |
| Client Support | `support` | `Support2026!` |
| Admin Clerk | `clerk` | `Clerk2026!` |
| Read-Only Viewer | `viewer` | `view2026` |

---

## File Structure

```
blackfire-portal/
├── .htaccess              Apache config (mod_rewrite + security headers)
├── index.php              Entry point (checks install status)
├── portal.php             Main portal HTML + JS
├── config/
│   └── config.php         DB credentials (written by installer)
├── includes/
│   ├── db.php             PDO database connection
│   ├── auth.php           Session auth + RBAC permissions
│   └── helpers.php        JSON response helpers
├── api/
│   ├── auth.php           Login · Logout · Session check
│   ├── callouts.php       Callout CRUD
│   ├── quotes.php         Quote CRUD + line items
│   ├── invoices.php       Invoice CRUD + mark paid
│   ├── transactions.php   Bank/transaction CRUD
│   ├── users.php          User management
│   ├── audit.php          Audit log
│   └── dashboard.php      Dashboard KPI stats
└── install/
    ├── index.php          Installation wizard
    └── schema.sql         Database schema
```

---

## API Reference

All API endpoints return JSON: `{ success: bool, data: [], message: '', error: '' }`

| Endpoint | Methods | Permission |
|---|---|---|
| `api/auth.php?action=login` | POST | Public |
| `api/auth.php?action=logout` | POST | Authenticated |
| `api/auth.php?action=me` | GET | Authenticated |
| `api/callouts.php` | GET, POST, PUT, DELETE | Role-based |
| `api/quotes.php` | GET, POST, PUT, DELETE | Role-based |
| `api/invoices.php` | GET, POST, PUT, DELETE | Role-based |
| `api/transactions.php` | GET, POST | finance.transactions |
| `api/users.php` | GET, POST, PUT | admin |
| `api/audit.php` | GET | admin |
| `api/dashboard.php` | GET | Authenticated |

---

## Upgrading from v9 HTML Portal

The PHP/MySQL version is a backend upgrade of the v9 portal. All features are identical:
- ✅ Same UI and brand design
- ✅ Same 8 roles and RBAC
- ✅ Same 9 modules
- ✅ Same dark/light theme toggle
- ✅ Mobile responsive
- ✅ Now with real database persistence (replaces localStorage)
- ✅ Real session management (replaces in-memory session)
- ✅ Audit log stored in database
- ✅ Concurrent multi-user support

---

## Troubleshooting

**"Database connection failed"**
- Verify DB host, name, user, password in installer
- On Afrihost, DB host is usually `localhost`
- Ensure the DB user has ALL PRIVILEGES on the database

**"500 Internal Server Error"**
- Check `.htaccess` — ensure `mod_rewrite` is enabled on your host
- Check PHP error logs in cPanel → Error Logs

**"403 Forbidden" on /config/ or /includes/**
- This is correct — these directories are protected by `.htaccess`

**White screen / no output**
- Enable PHP error display temporarily: add `<?php ini_set('display_errors',1); error_reporting(E_ALL); ?>` to the top of index.php
- Check cPanel error logs

**Session expires too quickly**
- Session timeout is set to 2 hours
- Adjust in `includes/auth.php` — change `7200` to desired seconds

---

## Security Notes

1. **Delete `/install/` directory** after installation
2. Change all default passwords immediately
3. Ensure `config/config.php` is not publicly accessible (`.htaccess` blocks it)
4. Use HTTPS — configure SSL in cPanel → Let's Encrypt
5. The `.htaccess` sets security headers (X-Frame-Options, CSP, etc.)

---

## Support

**BlackFire Solutions — Internal IT**
Portal Version: 1.0 · Build Date: 2026
Spec: UMLILO-V-001 · BLKFR
*Fire, taught to behave.*
