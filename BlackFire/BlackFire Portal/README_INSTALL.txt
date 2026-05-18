╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   BLACKFIRE SOLUTIONS PORTAL — PHP v1.1 (FIXED)                          ║
║   Installation Ready · Database Credentials Pre-Configured               ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

WHAT'S INCLUDED

✅ config.php — CORRECTED with Afrihost database credentials
✅ All PHP files (api, includes, install, portal.php, index.php)
✅ Database schema (install/schema.sql)
✅ .htaccess security rules

DATABASE CREDENTIALS

Host: localhost (Afrihost)
Database: blackfm6w9f9_portal
User: blackfm6w9f9_umlilo
Password: stored encrypted — see install/encrypt_config.php to generate/rotate

QUICK DEPLOYMENT

1. Delete old /portal/ folder on server
2. Upload this entire blackfire-portal/ folder to /public_html/portal/
3. Set BF_APP_KEY in cPanel Environment Variables (generate via install/encrypt_config.php)
4. Upload .env with BF_DB_PASS_ENC set (generate via install/encrypt_config.php)
5. Navigate to: https://blackfiresolutions.co.za/portal/install/
6. Click "Install & Create Tables" — create admin user
7. Delete install/encrypt_config.php from the server

DEPLOYMENT TIME: ~10 minutes

FILE STRUCTURE

blackfire-portal/
├── config/
│   ├── config.php                    ✅ FIXED (credentials included)
│   └── .htaccess
├── api/
│   ├── auth.php
│   ├── callouts.php
│   ├── dashboard.php
│   ├── invoices.php
│   ├── quotes.php
│   ├── transactions.php
│   ├── users.php
│   └── audit.php
├── includes/
│   ├── db.php
│   ├── auth.php
│   ├── helpers.php
│   └── .htaccess
├── install/
│   ├── index.php
│   └── schema.sql
├── portal.php
├── index.php
├── .htaccess
└── README_INSTALL.txt (this file)

WHAT WAS FIXED

BEFORE (broken):
  'db_name' => 'blackfire_portal'    ❌
  'db_user' => 'YOUR_DB_USER'        ❌
  'db_pass' => 'YOUR_DB_PASS'        ❌

AFTER (fixed + encrypted):
  'db_name' => 'blackfm6w9f9_portal'         ✅
  'db_user' => 'blackfm6w9f9_umlilo'          ✅
  'db_pass' => bf_decrypt(getenv('...'))     ✅ (AES-256-CBC, key in cPanel)

RESULT: All buttons now work — contact form submits, login validates, 
callouts/invoices/quotes save to database.

STEPS TO DEPLOY

Step 1: Backup & Delete
  - ssh blackfm6w9f9@blackfiresolutions.co.za
  - cd ~/public_html
  - mkdir portal.backup-2026-05-14
  - cp -r portal/* portal.backup-2026-05-14/
  - rm -rf portal/*

Step 2: Upload New Files
  - Upload entire blackfire-portal/ folder to ~/public_html/portal/
  - Or: unzip blackfire-portal-php-v1_1-FIXED.zip -d ~/public_html/
  - Then: mv ~/public_html/blackfire-portal/* ~/public_html/portal/

Step 3: Set Permissions
  - cd ~/public_html/portal
  - chmod 755 .
  - chmod 755 config/ api/ includes/ install/
  - chmod 644 *.php config/*.php api/*.php includes/*.php install/*.sql

Step 4: Initialize Database
  - Navigate to: https://blackfiresolutions.co.za/portal/install/
  - Follow wizard → Create tables
  - OR via SSH: mysql -u blackfm6w9f9_umlilo -p blackfm6w9f9_portal < install/schema.sql

Step 5: Create Admin User
  - Via installer (Step 4) OR via SSH (replace YOUR_PORTAL_PASSWORD with your chosen password):
    php << 'EOFPHP'
    require 'includes/db.php';
    $cfg = require 'config/config.php';
    $pdo = new PDO("mysql:host={$cfg['db_host']};dbname={$cfg['db_name']}",$cfg['db_user'],$cfg['db_pass']);
    $pwd = password_hash('YOUR_PORTAL_PASSWORD', PASSWORD_BCRYPT);
    $pdo->prepare('INSERT INTO users (username,name,email,password_hash,role,active) VALUES(?,?,?,?,?,1) ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash)')->execute(['jubhele','Jubhele','jubhele@astuteinsights.co.za',$pwd,'admin']);
    echo "✓ Admin created\n";
    EOFPHP

Step 6: Test
  - Go to: https://blackfiresolutions.co.za/portal/
  - Click "Staff Portal" → login with the credentials you created in Step 5
  - Test buttons: + New Callout, + New Invoice, etc.
  - All should work without errors

TROUBLESHOOTING

Issue: "Database connection failed"
  → Check config.php has correct credentials
  → Verify database exists in cPanel

Issue: "Cannot POST /api/..."
  → Check .htaccess isn't blocking requests
  → Verify file permissions (chmod 644)

Issue: "Tables don't exist"
  → Run installer at /install/
  → Or manually: mysql ... < install/schema.sql

Issue: "Login doesn't work"
  → Create admin user (Step 5)
  → Verify users table was created

For more help, see the detailed guide files included in deployment package.

SUPPORT FILES

Download from /outputs/:
  - README.md (overview)
  - BUTTON_FIX_SUMMARY.txt (quick reference)
  - DEPLOYMENT_CHECKLIST.md (step-by-step)
  - BLACKFIRE_PHP_INSTALL_v1.1_FIX.md (comprehensive)

VERSION INFO

Release: v1.1 (FIXED)
Date: 2026-05-14
Status: Production Ready
Credentials: Pre-configured for Afrihost

╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║  This version includes corrected database credentials.                   ║
║  Delete old /portal/ and extract this package to replace it.             ║
║  All buttons will work immediately after database initialization.        ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
