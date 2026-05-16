# bcrypt Hash Generator — Implementation Guide

## Overview

This guide explains how to generate bcrypt password hashes for the BlackFire AECI Chempark Portal users and safely update them in the database.

---

## 🎯 Quick Start

### Option 1: Use the Browser-Based Tool (EASIEST)
1. Open `bcrypt_hash_generator.html` in any web browser
2. Click the **"Generate All Hashes"** button
3. Copy the SQL statements and execute them in your MySQL client
4. Done! No installation required.

### Option 2: Use PHP Script
1. Ensure PHP is installed on your system
2. Run: `php generate_bcrypt_hashes.php`
3. Copy the SQL UPDATE statements output

### Option 3: Use Python Script  
1. Install bcrypt: `pip install bcrypt`
2. Run: `python generate_bcrypt_hashes.py`
3. Copy the SQL UPDATE statements output

### Option 4: Manual Generation
Use an online bcrypt generator (search: "bcrypt generator"):
- Password: `BlackFire2026!` → hash
- Password: `CallLog2026!` → hash
- etc.

---

## 📋 Current User Passwords

These are the temporary passwords from the seed script:

| Username   | Password      | Role            |
|-----------|---------------|-----------------|
| admin     | BlackFire2026!| System Admin    |
| manager   | BlackFire2026!| Operations Mgr  |
| calllog   | CallLog2026! | Call Logger     |
| jtech     | JTech2026!   | Junior Tech     |
| stech     | STech2026!   | Senior Tech     |
| support   | Support2026! | Client Support  |
| clerk     | Clerk2026!   | Admin Clerk     |
| viewer    | view2026     | Read-Only Viewer|

---

## 🔐 Why bcrypt?

- **One-way hashing**: Passwords cannot be recovered from hashes
- **Salt included**: Each hash is unique, even if passwords are identical
- **Cost factor**: Can increase computational difficulty over time (adapt to faster hardware)
- **Industry standard**: Used by Laravel, WordPress, Drupal, etc.

---

## ⚙️ Cost Factor Explanation

The seed script placeholder (`REPLACE_WITH_BCRYPT`) should be replaced with actual bcrypt hashes generated with an appropriate cost factor:

- **Cost 10**: Fast, suitable for web apps (browser tool uses this)
- **Cost 12**: Slower, higher security (recommended for servers)
- **Cost 14+**: Very slow, for high-security systems

Example hash with cost 12:
```
$2y$12$dJ2K5d8vL9mK3p7nQ2r8xOqWeL5s8tN3nB9sX7zQ4mK9pR2v5tU8
```

The `$2y$12$` prefix indicates:
- `2y` = bcrypt algorithm variant
- `12` = cost factor

---

## 🚀 Implementation Steps

### Step 1: Generate Hashes
Choose one method above to generate the bcrypt hashes.

### Step 2: Review the Output
You'll get SQL UPDATE statements like:
```sql
UPDATE users SET password_hash = '$2y$10$...' WHERE username = 'admin';
UPDATE users SET password_hash = '$2y$10$...' WHERE username = 'manager';
-- ... etc for all 8 users
```

### Step 3: Execute SQL in MySQL
**Option A: Command line**
```bash
mysql -u root -p blackfire_aeci < update_passwords.sql
```

**Option B: MySQL Workbench or phpMyAdmin**
- Open MySQL Workbench/phpMyAdmin connected to `blackfire_aeci`
- Paste the UPDATE statements
- Execute

### Step 4: Verify in Database
```sql
SELECT username, password_hash FROM users WHERE username = 'admin';
```

You should see a long hash like:
```
$2y$10$jXkVrQQwk8bvnQ2r5tL3nOqK8pR9sX4zQ2mK7pL4vN5tO3tR6sU8
```

### Step 5: Remove Plain Text Password Column (IMPORTANT)
This prevents accidental exposure of plain-text passwords in future backups:
```sql
ALTER TABLE users DROP COLUMN password_plain;
```

### Step 6: Update the Seed Script
Edit `blackfire_aeci_seed.sql`:

**BEFORE:**
```sql
INSERT INTO users (username, password_hash, password_plain, full_name, role, title) VALUES
('admin', 'REPLACE_WITH_BCRYPT', 'BlackFire2026!', ...),
```

**AFTER:**
```sql
INSERT INTO users (username, password_hash, full_name, role, title) VALUES
('admin', '$2y$12$...actual hash here...', 'J. Ndlovu', 'admin', 'System Administrator'),
```

Also update the ON DUPLICATE KEY UPDATE clause to NOT include password_hash:
```sql
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  role      = VALUES(role),
  title     = VALUES(title);
  -- password_hash REMOVED — never auto-overwrite hashes on re-seed
```

---

## 🔒 Security Checklist

- [ ] Hashes generated with bcrypt (not MD5, SHA1, or salted hashes)
- [ ] Cost factor is at least 10 (12 recommended)
- [ ] All 8 users have been updated with actual hashes
- [ ] `password_plain` column removed from database
- [ ] `password_plain` removed from seed script
- [ ] Seed script does NOT include password_hash in ON DUPLICATE UPDATE
- [ ] Updated seed script re-tested
- [ ] Plain-text passwords documented somewhere secure (password manager)
- [ ] Initial passwords should be changed by users on first login

---

## 🧪 Testing Hash Generation

### Verify Hash Correctness
Use this PHP code to test:
```php
<?php
$password = 'BlackFire2026!';
$hash = '$2y$12$...paste your hash here...';

if (password_verify($password, $hash)) {
    echo "✓ Hash is VALID for this password";
} else {
    echo "✗ Hash does NOT match this password";
}
?>
```

Or use the browser tool's built-in verification after generation.

### Common Issues

**"Supplied string is not a valid hash"**
- Hash is corrupted or incomplete
- Hash uses wrong algorithm (not bcrypt)
- Copy/paste error

**"Hash generated but login fails"**
- Database column `password_hash` is too short (needs VARCHAR(255))
- Application code not using `password_verify()`
- Hash wasn't actually updated in database

---

## 📞 Production Deployment Checklist

- [ ] Hashes generated on secure, isolated machine
- [ ] Hashes transmitted securely (not in plain email)
- [ ] Test hashes in staging environment first
- [ ] Verify login works with new hashes before going live
- [ ] Users notified of temporary passwords
- [ ] Users encouraged to change password on first login
- [ ] Admin should not share plain-text passwords via Slack/email
- [ ] Backup database before making changes
- [ ] Document hash generation method for auditing

---

## 📚 Files in this Directory

| File | Purpose |
|------|---------|
| `bcrypt_hash_generator.html` | Browser-based generator (EASIEST) |
| `generate_bcrypt_hashes.php` | PHP CLI tool |
| `generate_bcrypt_hashes.py` | Python CLI tool |
| `HASH_GENERATION.md` | This file |
| `blackfire_aeci_seed.sql` | Database seed script (to be updated) |

---

## 🆘 Troubleshooting

### "HTML tool doesn't work"
- Use a modern browser (Chrome, Firefox, Edge, Safari)
- Check browser console for JavaScript errors (F12)
- Ensure bcryptjs library loads (check Network tab)
- If offline, download bcryptjs and reference locally

### "PHP script errors"
- Install bcrypt: `composer require paragonie/bcrypt_compat`
- Ensure PHP 5.3+ is installed
- Check for syntax errors: `php -l generate_bcrypt_hashes.php`

### "Python script errors"  
- Install bcrypt: `pip install bcrypt`
- Use Python 3.6+
- Check file encoding is UTF-8

### "Hashes don't work in MySQL"
- Verify `password_hash` column is VARCHAR(255) or larger
- Ensure your application code uses `password_verify()` function
- Test manually: `SELECT password_verify('password', hash_from_db')`
- Check for trailing/leading whitespace in hash

---

## 📖 References

- [PHP password_hash() documentation](https://www.php.net/manual/en/function.password-hash.php)
- [bcrypt Wikipedia](https://en.wikipedia.org/wiki/Bcrypt)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [bcryptjs npm package](https://www.npmjs.com/package/bcryptjs)

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-05-14 | Initial implementation - HTML, PHP, Python tools |

---

**Last Updated**: 2026-05-14  
**Author**: BlackFire Solutions  
**Status**: DRAFT — For Development Environment Only
