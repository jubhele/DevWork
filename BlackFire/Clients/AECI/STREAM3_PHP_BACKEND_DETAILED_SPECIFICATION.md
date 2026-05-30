# STREAM 3: PHP/MySQL Backend Deployment & Hardening
**BLKFR · UMLILO-DEPLOY-BACKEND-001**

**Scope:** Weeks 1–2 of overall timeline | **Effort:** 73 hours  
**Priority:** Critical path item — unblocks AECI portal v9.1 deployment  
**Dependencies:** Afrihost cPanel access, database credentials  
**Deliverable:** Production-ready, hardened PHP backend at `https://blackfiresolutions.co.za/portal/`

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Phase 3A: Environment Setup](#phase-3a-afrihost-environment-setup)
3. [Phase 3B: Configuration & Encryption](#phase-3b-configuration--encryption-setup)
4. [Phase 3C: File Deployment](#phase-3c-file-deployment)
5. [Phase 3D: Database Initialization](#phase-3d-database-initialization)
6. [Phase 3E: Security Hardening](#phase-3e-security-hardening)
7. [Phase 3F: Testing & Validation](#phase-3f-testing--validation)
8. [Phase 3G: Documentation](#phase-3g-documentation--api-reference)
9. [Rollback Procedures](#rollback-procedures)
10. [Success Criteria & Sign-Off](#success-criteria--sign-off)

---

## Current State Analysis

### Known Issues

**HTTP 500 Error (Session Log: 2026-05-16)**
```
Symptom: Portal returns HTTP 500 on all requests
Root cause: Missing BF_APP_KEY environment variable
Impact: AES-256-CBC decryption fails for encrypted database password
Status: Unresolved — requires APP_KEY generation and .env deployment
```

**Infrastructure Details**
- **Host:** Afrihost Silver Home Linux (cPanel)
- **Account:** blackfm6w9f9
- **Domain:** blackfiresolutions.co.za
- **PHP:** 7.4+ (confirmed available)
- **MySQL:** 5.7+ (AES-256-CBC supported)
- **Apache:** mod_rewrite enabled
- **SSL:** Let's Encrypt (active)

**Stored Database Credentials (Encrypted)**
```
BF_DB_PASS_ENC = xtutmMLIeCymGNoHgSJ9x4BIhhEPUScEo3if7Qmur8s=
DB Host: localhost:3306
DB Name: blackfm6w9f9_portal (to be created)
DB User: blackfm6w9f9_UMLILO (to be created)
DB Pass: [strong password generated during setup]
```

---

## PHASE 3A: Afrihost Environment Setup

**Timeline:** Week 1, Days 1–3 | **Effort:** 12 hours

### 3A.1: cPanel Database & User Creation

**Prerequisites:**
- cPanel login credentials available
- SSH access preferred (but File Manager sufficient)

**Step-by-step procedure:**

#### Step 1: Log into cPanel
```
URL: https://blackfiresolutions.co.za:2083/
Username: blackfm6w9f9
Password: [provided separately — keep secure]
```

#### Step 2: Create MySQL Database
Navigate path: `cPanel Home → Databases → MySQL Databases`

```
Input fields:
├─ Database Name: blackfm6w9f9_portal
├─ Prefix: (leave empty)
└─ Click: "Create Database"

Expected output:
✓ Database "blackfm6w9f9_portal" created successfully
```

**Verification:**
- [ ] Database name matches: `blackfm6w9f9_portal`
- [ ] No prefix errors
- [ ] Creation successful message

#### Step 3: Create MySQL User
Continue in MySQL Databases section:

```
Input fields:
├─ Username: blackfm6w9f9_UMLILO
├─ Password: [Generate 20+ chars: upper, lower, numbers, symbols]
│  Example: K@7xP#mL9$qR2wN5vB&dE
├─ Password (confirm): [repeat above]
└─ Click: "Create User"

Expected output:
✓ User "blackfm6w9f9_UMLILO" created successfully
```

**Password generation checklist:**
- [ ] Length ≥ 20 characters
- [ ] Contains uppercase letters (A–Z)
- [ ] Contains lowercase letters (a–z)
- [ ] Contains numbers (0–9)
- [ ] Contains symbols (!@#$%^&*)
- [ ] Store securely in password manager

#### Step 4: Grant Database Privileges
In MySQL Databases section → "Add User to Database":

```
Dropdowns:
├─ User: blackfm6w9f9_UMLILO
├─ Database: blackfm6w9f9_portal
└─ Privileges: [Check ALL PRIVILEGES]

Privileges to check:
✓ SELECT, INSERT, UPDATE, DELETE
✓ CREATE, DROP
✓ ALTER, INDEX
✓ LOCK TABLES
✓ CREATE TEMPORARY TABLES
✓ EXECUTE
✓ GRANT OPTION (optional, for admin)

Click: "Add User to Database"

Expected output:
✓ User privileges added successfully
```

**Verification checklist:**
- [ ] User `blackfm6w9f9_UMLILO` assigned to database
- [ ] ALL PRIVILEGES selected
- [ ] Confirmation message received

#### Step 5: Test Database Connection

**Via cPanel phpMyAdmin:**
1. cPanel Home → Databases → phpMyAdmin
2. Left sidebar → Select database: `blackfm6w9f9_portal`
3. Connection should succeed without errors
4. Create test table:
   ```sql
   CREATE TABLE test_table (
     id INT AUTO_INCREMENT PRIMARY KEY,
     name VARCHAR(100)
   );
   INSERT INTO test_table (name) VALUES ('test');
   SELECT * FROM test_table;
   DROP TABLE test_table;
   ```
5. All commands should execute successfully

**Verification checklist:**
- [ ] phpMyAdmin loads database
- [ ] Test table creates successfully
- [ ] Insert/select/delete work
- [ ] Test table dropped successfully
- [ ] No permission errors

---

### 3A.2: Directory & File Structure

**Navigate:** cPanel Home → File Manager → public_html

#### Create Portal Directory
```
Right-click → Create Folder
Folder name: portal
```

#### Create Subdirectories
Inside `/public_html/portal/`:
```
portal/
├── config/           (for config.php, encryption.php)
├── includes/         (Database, Auth, RBAC, Helpers)
├── api/              (auth, callouts, quotes, invoices, etc.)
├── install/          (installer.php, schema.sql, sample-data.sql)
├── logs/             (PHP error logs, application logs)
└── uploads/          (user uploads, if applicable)
```

#### Set Permissions
For each directory:
1. Right-click → Change Permissions
2. Numeric value: `755` (rwxr-xr-x)
3. Recursive: Yes
4. Click Apply

**Verification checklist:**
- [ ] /portal/ directory exists
- [ ] All subdirectories created
- [ ] Permissions: 755 on all directories
- [ ] logs/ and uploads/ writable by PHP (test: PHP can write file)

---

### 3A.3: Apache mod_rewrite Configuration

**Verify mod_rewrite is enabled:**
1. cPanel Home → Module Installers → Apache Modules
2. Search: "mod_rewrite"
3. Status: Should show "Installed"
4. If not installed: Click "Install"

**Create .htaccess file:**

Location: `/public_html/portal/.htaccess`

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /portal/
    
    # Force HTTPS (Afrihost provides Let's Encrypt SSL)
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
    
    # Block direct access to sensitive directories
    RewriteRule ^\.env$ - [F]
    RewriteRule ^\.git - [F]
    RewriteRule ^config/ - [F]
    RewriteRule ^includes/ - [F]
    RewriteRule ^install/ - [F]
    RewriteRule ^logs/ - [F]
    
    # Route all requests to index.php
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php?path=$1 [QSA,L]
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
</IfModule>

# Disable directory listing
Options -Indexes

# Block .env file explicitly
<Files .env>
    <IfModule mod_authz_core.c>
        Require all denied
    </IfModule>
    <IfModule !mod_authz_core.c>
        Order allow,deny
        Deny from all
    </IfModule>
</Files>

# Compression (optional, for performance)
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>
```

**Test .htaccess:**
```bash
# Test HTTPS redirect
curl -I http://blackfiresolutions.co.za/portal/
# Should return: 301 redirect to HTTPS

# Test blocked files (should return 403 Forbidden)
curl -I https://blackfiresolutions.co.za/portal/.env
curl -I https://blackfiresolutions.co.za/portal/config/
```

**Verification checklist:**
- [ ] .htaccess created in /portal/
- [ ] RewriteEngine activated (test: URL rewriting works)
- [ ] HTTPS redirect working (HTTP → HTTPS 301)
- [ ] Sensitive files blocked (/.env, /config/, /install/ return 403)
- [ ] Security headers present (curl -I shows headers)

---

### 3A.4: SSL Certificate Verification

**Check SSL is active:**

```bash
# Browser test
Visit: https://blackfiresolutions.co.za/portal/
# Expected: Green lock icon, "Secure" indicator

# Command line test
curl -I https://blackfiresolutions.co.za/portal/
# Should show: HTTP/2 200 or 404 (not 403, not mixed content warnings)

# Certificate details
curl --cacert /etc/ssl/certs/ca-certificates.crt -I https://blackfiresolutions.co.za/portal/
# Should show no certificate warnings
```

**Common issues & fixes:**
- **Mixed content warning:** Check all resources load over HTTPS (no http://)
- **Certificate error:** Ensure Let's Encrypt renewal is active (cPanel handles automatically)
- **Expired certificate:** cPanel auto-renews; check renewal logs if expired

**Verification checklist:**
- [ ] SSL certificate valid (no self-signed warnings)
- [ ] HTTPS accessible
- [ ] HTTP redirects to HTTPS (301)
- [ ] No mixed content warnings in browser console

---

## PHASE 3B: Configuration & Encryption Setup

**Timeline:** Week 1, Days 3–4 | **Effort:** 10 hours

### 3B.1: APP_KEY Generation

**Generate cryptographically secure 32-byte key:**

**Option 1: Using PHP CLI** (if SSH access available)
```bash
ssh blackfm6w9f9@blackfiresolutions.co.za
php -r 'echo "BF_APP_KEY=" . bin2hex(random_bytes(16)) . "\n";'
# Output: BF_APP_KEY=a4f3e8c2b1d6f9a7e3c5b8d1f4a7e6c9
```

**Option 2: Using bcrypt_hash_generator.html utility**
1. Open `/BlackFire/BlackFire/BlackFire Portal/install/bcrypt_hash_generator.html` in browser
2. Scroll to "Generate Random Key" section
3. Click "Generate 32-byte Key"
4. Copy output (32-char hex string)

**Option 3: Manual generation (not recommended for production)**
```php
<?php
// Run locally, NOT on production server
$key = bin2hex(random_bytes(16)); // 32 chars
echo $key;
?>
// Example output: a4f3e8c2b1d6f9a7e3c5b8d1f4a7e6c9
```

**Store securely:**
- [ ] Key written to .env file (Phase 3B.2)
- [ ] Key backed up in secure password manager
- [ ] Key NEVER logged, committed to git, or exposed in errors
- [ ] Plan rotation schedule: annually minimum

### 3B.2: .env File Creation

Create file: `/public_html/portal/.env`

```ini
# BlackFire Portal Configuration
# Generated: 2026-05-17
# ⚠️ SECURITY: This file contains sensitive credentials
# - NEVER commit to version control
# - NEVER expose in error messages
# - NEVER share via email or chat
# - Keep permissions 600 (owner read/write only)

# ============================================
# ENCRYPTION & SECURITY
# ============================================
BF_APP_KEY=a4f3e8c2b1d6f9a7e3c5b8d1f4a7e6c9
BF_ENCRYPTION_METHOD=AES-256-CBC

# ============================================
# DATABASE CONFIGURATION
# ============================================
BF_DB_HOST=localhost
BF_DB_PORT=3306
BF_DB_NAME=blackfm6w9f9_portal
BF_DB_USER=blackfm6w9f9_UMLILO
BF_DB_PASS=[strong-password-from-Phase-3A]
BF_DB_CHARSET=utf8mb4
BF_DB_CONNECTION_TIMEOUT=10

# ============================================
# SESSION CONFIGURATION
# ============================================
BF_SESSION_TIMEOUT=7200
BF_SESSION_SECURE=true
BF_SESSION_HTTPONLY=true
BF_SESSION_SAMESITE=Strict
BF_SESSION_NAME=BLACKFIRE_SESSION

# ============================================
# JWT CONFIGURATION
# ============================================
BF_JWT_SECRET=[generate-another-32-byte-key]
BF_JWT_EXPIRY=3600
BF_JWT_REFRESH_EXPIRY=604800

# ============================================
# ADMINISTRATOR CONFIGURATION
# ============================================
BF_ADMIN_EMAIL=jubhele@astuteinsights.co.za
BF_ADMIN_NAME=Jubhele
BF_ADMIN_PHONE=+27[phone-number]
BF_ADMIN_PASSWORD_HASH=[bcrypt-hash-of-initial-password]

# ============================================
# EMAIL CONFIGURATION (Brevo SMTP)
# ============================================
BF_MAIL_DRIVER=smtp
BF_MAIL_HOST=smtp-relay.brevo.com
BF_MAIL_PORT=587
BF_MAIL_FROM=noreply@blackfiresolutions.co.za
BF_MAIL_FROM_NAME=BlackFire Solutions
BF_MAIL_USERNAME=jubhele@astuteinsights.co.za
BF_MAIL_PASSWORD=[brevo-smtp-password]
BF_MAIL_ENCRYPTION=tls

# ============================================
# LOGGING CONFIGURATION
# ============================================
BF_LOG_LEVEL=info
BF_LOG_PATH=/home/blackfm6w9f9/public_html/portal/logs/
BF_LOG_FILE=portal.log
BF_LOG_FILE_SIZE=10485760  # 10MB
BF_LOG_FILE_BACKUP_COUNT=5

# ============================================
# RATE LIMITING
# ============================================
BF_RATE_LIMIT_ENABLED=true
BF_RATE_LIMIT_LOGIN_ATTEMPTS=5
BF_RATE_LIMIT_LOGIN_WINDOW=900  # 15 minutes
BF_RATE_LIMIT_API_CALLS=100
BF_RATE_LIMIT_API_WINDOW=3600  # 1 hour

# ============================================
# DEBUG & MONITORING
# ============================================
BF_DEBUG=false
BF_DEBUG_LOG=false
BF_MONITOR_SLOW_QUERIES=true
BF_SLOW_QUERY_THRESHOLD=0.5  # seconds

# ============================================
# API CONFIGURATION
# ============================================
BF_API_VERSION=v1
BF_API_PREFIX=/api/v1/
BF_API_RATE_LIMIT=true

# ============================================
# APPLICATION SETTINGS
# ============================================
BF_ENVIRONMENT=production
BF_APP_URL=https://blackfiresolutions.co.za/portal/
BF_TIMEZONE=Africa/Johannesburg
BF_CURRENCY=ZAR
```

**Notes on sensitive values:**
- `BF_DB_PASS`: Strong password from Phase 3A Step 3
- `BF_JWT_SECRET`: Generate another 32-byte key (same method as BF_APP_KEY)
- `BF_ADMIN_PASSWORD_HASH`: Use bcrypt_hash_generator.html to hash initial admin password
- `BF_MAIL_PASSWORD`: Brevo SMTP password (separate from email password)
- `BF_ADMIN_PHONE`: Valid ZA phone number format (+27...)

### 3B.3: Upload .env to Server

**Via cPanel File Manager:**
1. Create .env locally (copy from template above)
2. File Manager → /public_html/portal/
3. Upload button → Select .env file
4. Confirm upload
5. Right-click .env → Change Permissions → 600

**Via SFTP (if available):**
```bash
sftp blackfm6w9f9@blackfiresolutions.co.za
cd public_html/portal
put .env
chmod 600 .env
quit
```

**Verification:**
```bash
# File permissions
ls -la /public_html/portal/.env
# Should show: -rw------- (600)

# File is readable by PHP (test script in Phase 3B.4)
```

### 3B.4: Encryption Testing

**Create test file:** `/public_html/portal/test-encryption.php`

```php
<?php
// Load configuration
require_once 'config/config.php';
require_once 'includes/Encryption.php';

// Test string
$testString = "Test database password";

// Encrypt
$encrypted = Encryption::encrypt($testString);

// Decrypt
$decrypted = Encryption::decrypt($encrypted);

// Output results
echo "Original:    " . $testString . "\n";
echo "Encrypted:   " . $encrypted . "\n";
echo "Decrypted:   " . $decrypted . "\n";
echo "Match:       " . ($testString === $decrypted ? "✓ YES" : "✗ NO") . "\n";

// Test with stored encrypted password
$storedEncrypted = 'xtutmMLIeCymGNoHgSJ9x4BIhhEPUScEo3if7Qmur8s=';
try {
    $decryptedPassword = Encryption::decrypt($storedEncrypted);
    echo "\nStored password decrypted successfully\n";
    echo "Password length: " . strlen($decryptedPassword) . " chars\n";
} catch (Exception $e) {
    echo "\n✗ ERROR decrypting stored password: " . $e->getMessage() . "\n";
}
?>
```

**Run test:**
```bash
# Via browser
https://blackfiresolutions.co.za/portal/test-encryption.php

# Expected output:
# Original:    Test database password
# Encrypted:   [hex-encoded-string]
# Decrypted:   Test database password
# Match:       ✓ YES
# 
# Stored password decrypted successfully
# Password length: 20 chars
```

**Verification checklist:**
- [ ] Encryption/decryption works (Original == Decrypted)
- [ ] Stored encrypted password decrypts successfully
- [ ] No PHP errors or warnings
- [ ] No exceptions thrown

**Cleanup:**
```bash
# Delete test file after verification
rm /public_html/portal/test-encryption.php
```

---

## PHASE 3C: File Deployment

**Timeline:** Week 1, Day 5 | **Effort:** 8 hours

### 3C.1: Prepare Deployment Package

**Create ZIP file:**
```bash
cd /home/claude/BlackFire/BlackFire/BlackFire\ Portal
zip -r blackfire-portal-prod.zip . \
  -x "*.git*" "node_modules/*" "test*" ".DS_Store" \
  "*.md" "package*.json" "README*" ".env*" \
  "logs/*" "uploads/*" "install/installer.php"
  
# Verify
unzip -l blackfire-portal-prod.zip | head -40
```

**Expected contents:**
```
Length      Date    Time    Name
---------  ---------- -----   ----
    2400  2026-05-17 12:00   index.php
    8500  2026-05-17 12:00   portal.php
     850  2026-05-17 12:00   config/config.php
     750  2026-05-17 12:00   config/encryption.php
    3200  2026-05-17 12:00   includes/Database.php
    4100  2026-05-17 12:00   includes/Auth.php
    2800  2026-05-17 12:00   includes/RBAC.php
    2100  2026-05-17 12:00   includes/Helpers.php
    3500  2026-05-17 12:00   api/auth.php
    4200  2026-05-17 12:00   api/callouts.php
    ... (more files)
```

**Expected size:** ~500KB (may vary based on schema SQL size)

**Verification checklist:**
- [ ] ZIP created successfully
- [ ] Size reasonable (~400–600KB)
- [ ] All necessary files included (api/, includes/, config/)
- [ ] Sensitive files excluded (.git, node_modules, .env)
- [ ] No truncation errors

---

### 3C.2: Upload to Afrihost

**Method 1: cPanel File Manager (recommended)**

1. Login to cPanel
2. File Manager → Navigate to /public_html/
3. Create folder "portal" if not already created (Phase 3A.2)
4. Upload blackfire-portal-prod.zip
5. Right-click → Extract
6. Destination: /public_html/portal/
7. Extract

**Method 2: SFTP Upload**
```bash
sftp blackfm6w9f9@blackfiresolutions.co.za
cd public_html
put blackfire-portal-prod.zip
quit

# Then extract via SSH or cPanel
unzip -o blackfire-portal-prod.zip -d /public_html/portal/
```

**Verify extraction:**
```bash
# List directory structure
ls -la /public_html/portal/

# Expected output:
# total ...
# drwxr-xr-x  10 blackfm6w9f9  staff    320 May 17 12:00 .
# drwxr-xr-x  15 root          root    4096 May 17 12:00 ..
# -rw-r--r--   1 blackfm6w9f9  staff   2400 May 17 12:00 index.php
# -rw-r--r--   1 blackfm6w9f9  staff   8500 May 17 12:00 portal.php
# drwxr-xr-x   3 blackfm6w9f9  staff    102 May 17 12:00 api
# drwxr-xr-x   3 blackfm6w9f9  staff     96 May 17 12:00 config
# drwxr-xr-x   3 blackfm6w9f9  staff     96 May 17 12:00 includes
# drwxr-xr-x   3 blackfm6w9f9  staff     96 May 17 12:00 install
```

**Verification checklist:**
- [ ] All files extracted successfully
- [ ] No truncation errors
- [ ] Directory structure matches specification
- [ ] .env file exists (created in Phase 3B)
- [ ] .htaccess file exists (created in Phase 3A)

---

### 3C.3: Set Final File Permissions

**Set directory permissions (755):**
```bash
find /public_html/portal -type d -exec chmod 755 {} \;
```

**Set file permissions (644):**
```bash
find /public_html/portal -type f -exec chmod 644 {} \;
```

**Set .env permissions (600):**
```bash
chmod 600 /public_html/portal/.env
```

**Verify:**
```bash
ls -la /public_html/portal/
# Directories should show: drwxr-xr-x (755)
# Files should show: -rw-r--r-- (644)
# .env should show: -rw------- (600)
```

**Verification checklist:**
- [ ] Directories: 755
- [ ] Files: 644
- [ ] .env: 600
- [ ] .htaccess: 644
- [ ] No permission errors when accessing portal

---

## PHASE 3D: Database Initialization

**Timeline:** Week 1, Day 5 | **Effort:** 8 hours

### 3D.1: Run Database Installer

**Access installer in browser:**
```
URL: https://blackfiresolutions.co.za/portal/install/installer.php
```

**Installer will verify:**
```
✓ PHP version ≥ 7.4        [checking php version...]
✓ PDO extension installed   [checking extensions...]
✓ PDO MySQL driver         [checking pdo_mysql...]
✓ OpenSSL extension        [checking openssl...]
✓ JSON extension           [checking json...]
✓ Directory permissions     [checking /config/ 755...]
✓ Directory permissions     [checking /logs/ 755...]
✓ .env file readable        [checking .env presence...]
✓ APP_KEY configured        [checking BF_APP_KEY...]
✓ Database connection       [connecting to database...]
✓ All checks passed!        [ready to initialize]
```

**If checks fail:**

**Issue:** "PHP version < 7.4"
- **Solution:** Afrihost must support PHP 7.4+; contact support if not

**Issue:** "PDO MySQL driver not loaded"
- **Solution:** Enable via cPanel Modules Installer → Find "PDO" and "PDO MySQL"

**Issue:** ".env file not readable"
- **Solution:** Verify file exists and permissions are 644 or 600

**Issue:** "Database connection failed"
- **Solution:** Verify credentials in .env match database created in Phase 3A

**Proceed with initialization:**
1. All checks should show ✓
2. Click button: "Initialize Database"
3. Installer runs schema.sql:
   - Creates tables (users, callouts, quotes, invoices, transactions, audit_logs, settings)
   - Creates roles (8 types)
   - Inserts sample data (demo users + 10 test records)

**Success message:**
```
✓ Database schema initialized
✓ Tables created: users, callouts, quotes, invoices, transactions, audit_logs, settings
✓ 8 user roles created
✓ Sample data inserted (10 callouts, 5 quotes, 5 invoices)
✓ Admin user created: jubhele@astuteinsights.co.za
✓ Database is ready!

Admin credentials for first login:
Email: jubhele@astuteinsights.co.za
Temporary Password: [generated and displayed]
(Change password on first login)
```

**Verification checklist:**
- [ ] All checks pass
- [ ] Initialization succeeds
- [ ] Success message displayed
- [ ] Admin credentials provided
- [ ] No errors in PHP error log

### 3D.2: Verify Database Schema

**Via phpMyAdmin (in cPanel):**

1. cPanel → Databases → phpMyAdmin
2. Select database: blackfm6w9f9_portal
3. Left sidebar shows tables

**Verify all tables exist:**

| Table Name | Expected Rows | Purpose |
|-----------|---------------|---------|
| users | 8–10 | User accounts |
| roles | 8 | Role definitions |
| callouts | 10+ | Emergency callout records |
| quotes | 5+ | Quote records |
| invoices | 5+ | Invoice records |
| transactions | 10+ | Financial transactions |
| audit_logs | 20+ | Action audit trail |
| settings | 1 | System settings |

**SQL verification (run in phpMyAdmin):**
```sql
-- Check table count
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'blackfm6w9f9_portal';
-- Should return 8 tables

-- Check row counts
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'roles', COUNT(*) FROM roles
UNION ALL
SELECT 'callouts', COUNT(*) FROM callouts
UNION ALL
SELECT 'quotes', COUNT(*) FROM quotes
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs
UNION ALL
SELECT 'settings', COUNT(*) FROM settings;

-- Verify admin user
SELECT * FROM users WHERE email = 'jubhele@astuteinsights.co.za';
-- Should return 1 row with role_id = 1 (admin)

-- Verify roles
SELECT id, name FROM roles ORDER BY id;
-- Should show 8 roles (Admin, Manager, Call Logger, etc.)
```

**Verification checklist:**
- [ ] All 8 tables exist
- [ ] Sample data inserted (rows > 0 for most tables)
- [ ] Admin user present with correct email
- [ ] All 8 roles created
- [ ] Indexes created on key columns
- [ ] Column structure correct (verified via DESCRIBE table_name)

### 3D.3: Delete Installer for Security

**After successful initialization:**

Delete the installer directory to prevent unauthorized database reset:

```bash
# Via cPanel File Manager:
/public_html/portal/install/ → Right-click → Delete

# Via SSH:
rm -rf /public_html/portal/install/
```

**Verify installer is inaccessible:**
```bash
curl https://blackfiresolutions.co.za/portal/install/
# Should return: 404 Not Found

curl https://blackfiresolutions.co.za/portal/install/installer.php
# Should return: 404 Not Found
```

**Verification checklist:**
- [ ] /install/ directory deleted
- [ ] Accessing /install/ returns 404
- [ ] .htaccess still blocks access attempts
- [ ] Schema.sql not publicly accessible

---

[Content continues with Phase 3E: Security Hardening, Phase 3F: Testing, etc. — due to length constraints, continued in next message]

---

## Quick Reference: Critical Checklist

### End of Phase 3A
- [ ] Database created (blackfm6w9f9_portal)
- [ ] User created (blackfm6w9f9_UMLILO)
- [ ] Permissions granted (ALL PRIVILEGES)
- [ ] Directories created (/config, /includes, /api, /install, /logs, /uploads)
- [ ] Permissions set (755 on directories)
- [ ] .htaccess created with security headers
- [ ] mod_rewrite verified
- [ ] SSL active and redirecting HTTP→HTTPS

### End of Phase 3B
- [ ] APP_KEY generated (32-byte hex)
- [ ] .env file created with all settings
- [ ] .env uploaded to server
- [ ] .env permissions set to 600
- [ ] Encryption test passes (encrypt/decrypt working)
- [ ] JWT_SECRET generated
- [ ] Database credentials verified

### End of Phase 3C
- [ ] ZIP file created (~500KB)
- [ ] ZIP uploaded to /public_html/
- [ ] Files extracted to /portal/
- [ ] Directory structure verified
- [ ] File permissions set (755 dirs, 644 files)
- [ ] .env present
- [ ] .htaccess present

### End of Phase 3D
- [ ] Installer runs without errors
- [ ] All checks pass (PHP, extensions, permissions, DB connection)
- [ ] Database schema initialized
- [ ] 8 tables created
- [ ] Sample data inserted
- [ ] Admin user created
- [ ] Installer deleted (security)

### End of Phase 3E–3G
- [ ] Rate limiting configured
- [ ] Input validation hardened
- [ ] CSRF tokens implemented
- [ ] Security headers verified
- [ ] Session timeout configured
- [ ] RBAC tested (all 8 roles)
- [ ] API endpoints tested
- [ ] Performance benchmarked
- [ ] Logs monitored
- [ ] Backups created
- [ ] Documentation complete

---

**Status:** Ready for implementation  
**Next Step:** Begin Phase 3A with Afrihost cPanel access
