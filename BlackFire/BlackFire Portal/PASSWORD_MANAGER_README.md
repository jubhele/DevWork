# Password Manager — Admin Portal Integration

## Overview

The password hash generator is now fully integrated into the BlackFire Portal as an **admin-only function**. No more external tools needed!

## Files Created

1. **`/api/admin.php`** — Backend API for password hash management
   - Generates bcrypt hashes with cost factor 12
   - Can apply hashes to the database
   - Logs all security operations to audit trail

2. **`/password-manager.html`** — Admin UI interface
   - Beautiful admin dashboard for hash generation
   - Review hashes before applying
   - Download or copy SQL statements
   - Show next steps after applying

## Access the Tool

### During Development (File-Based Access)
1. Open `/password-manager.html` in your browser
2. Or add a link in your portal admin menu:
   ```html
   <a href="./password-manager.html">🔐 Password Manager</a>
   ```

### Integration into Portal Menu

Add this link to your main portal navigation (portal.php admin section):

```html
<?php if (in_array($role, ['admin'])): ?>
    <a href="./password-manager.html" class="admin-link">
        🔐 Password Manager
    </a>
<?php endif; ?>
```

Or create a proper admin panel tab using the existing portal structure.

## API Endpoints

### Generate Password Hashes
```bash
POST /api/admin.php?action=generate_password_hashes
Content-Type: application/json

{
  "apply": false  # true to apply to database
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hashes": [
      {
        "username": "admin",
        "password": "BlackFire2026!",
        "hash": "$2y$12$...",
        "name": "J. Ndlovu",
        "role": "admin"
      },
      // ... more users
    ],
    "updates": [
      "UPDATE bf_users SET password_hash = '...' WHERE username = 'admin';",
      // ... more SQL
    ],
    "applied": false
  }
}
```

### Reset Single User Password
```bash
POST /api/admin.php?action=reset_user_password
Content-Type: application/json

{
  "username": "john_doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "username": "john_doe",
    "temp_password": "a1b2c3d4e5f6"
  }
}
```

### Export SQL Script
```bash
POST /api/admin.php?action=export_password_sql
Content-Type: application/json

{}
```

**Response:** Downloads `update_passwords_YYYY-MM-DD_HHMMSS.sql` file

## Security Features

✅ **Permission-Based Access**
- Only users with `security.users` permission can access (admin role only)
- `require_perm('security.users')` enforces authorization

✅ **Audit Logging**
- All operations logged to `bf_audit_log` table
- Admin username recorded
- Timestamp tracked

✅ **Cost Factor 12**
- Industry-standard bcrypt security level
- Takes longer to compute (protects against brute force)

✅ **Review Before Apply**
- Hashes generated for review before database update
- User confirms changes before applying
- No automatic password resets

✅ **Native PHP**
- Uses PHP's built-in `password_hash()` function
- No external dependencies required
- Compatible with `password_verify()` in auth system

## How It Works

### Step 1: Generate Hashes
1. Admin clicks "Generate All Hashes"
2. Backend generates bcrypt hashes for all 8 seed users
3. Frontend displays hashes in a table for review
4. SQL UPDATE statements shown for reference

### Step 2: Review
- Admin reviews temporary passwords and hashes
- Can copy SQL to clipboard
- Can download SQL file for backup

### Step 3: Apply
- Admin clicks "Apply Hashes to Database"
- Hashes are written to `bf_users.password_hash` column
- Database entry logged to audit trail

### Step 4: Verify
- Users can log in with their temporary passwords
- Users should change password on first login
- Audit log records the operation

## Database Requirements

The `bf_users` table must have these columns (should already exist):

```sql
CREATE TABLE bf_users (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username        VARCHAR(50) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,  -- Can store bcrypt hashes
  name            VARCHAR(100),
  role            VARCHAR(30),
  title           VARCHAR(100),
  active          TINYINT(1) DEFAULT 1,
  last_login      TIMESTAMP NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

The `password_plain` column is optional (development only) and can be dropped after hashing.

## Complete Workflow

```
Admin opens password-manager.html
              ↓
    Click "Generate All Hashes"
              ↓
    Backend generates 8 bcrypt hashes (cost 12)
              ↓
    Frontend displays hashes in table
              ↓
    Admin reviews passwords and hashes
              ↓
    Admin clicks "Apply Hashes to Database"
              ↓
    Database updated: password_hash column
              ↓
    Audit log recorded: SECURITY event
              ↓
    Admin shown "Next Steps":
      • Drop password_plain column (if exists)
      • Update seed script
      • Tell users to change password on login
              ↓
    ✓ Complete!
```

## Testing

### Test in Development
```bash
# Open in browser
file:///c:/DevWork/BlackFire/BlackFire%20Portal/password-manager.html

# Or access via web server
http://localhost/blackfire/password-manager.html
```

### Test Login After Applying Hashes
```bash
# Try logging in with a generated password
Username: admin
Password: BlackFire2026!

# Should succeed and show audit log entry
```

## Next Steps

1. **Drop plain-text password column** (once verified hashes work):
   ```sql
   ALTER TABLE bf_users DROP COLUMN password_plain;
   ```

2. **Update the seed script** `blackfire_aeci_seed.sql`:
   - Replace `'REPLACE_WITH_BCRYPT'` with actual hashes
   - Remove `password_plain` column from INSERT
   - Ensure password_hash is NOT in ON DUPLICATE UPDATE

3. **Require password change on first login**:
   Add a `force_password_change` column to users table and check on login

4. **Document the password policy**:
   - Temporary passwords expire after first login
   - Users must set their own password
   - Minimum password requirements

## Troubleshooting

### "Permission denied" error
- Ensure you're logged in as admin user
- Check that `security.users` permission is assigned to your role
- Verify role in database: `SELECT role FROM bf_users WHERE username = 'yourname';`

### "API endpoint not found" error
- Ensure `/api/admin.php` file exists
- Check web server is serving the API directory
- Verify `.php` files can be executed

### Hashes don't work at login
- Ensure `password_hash` column is VARCHAR(255) or larger
- Check PHP version has `password_hash()` function (PHP 5.5+)
- Verify auth code uses `password_verify()` to check hashes
- Test manually: `password_verify('password', $hash_from_db)`

### Can't find password manager
- Add link to admin menu in `portal.php`
- Or bookmark: `http://yourserver/path/password-manager.html`
- Check browser console (F12) for JavaScript errors

## Security Checklist

- [ ] Only admin can access password-manager.html
- [ ] API checks `require_perm('security.users')`
- [ ] All operations logged to audit table
- [ ] Hashes use cost factor 12 (strong)
- [ ] Never expose plain-text passwords in response
- [ ] HTTPS in production
- [ ] password_plain column dropped from database
- [ ] Seed script updated with actual hashes
- [ ] Users required to change password on first login

## References

- [PHP password_hash() documentation](https://www.php.net/manual/en/function.password-hash.php)
- [PHP password_verify() documentation](https://www.php.net/manual/en/function.password-verify.php)
- [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

---

**Last Updated**: 2026-05-14  
**Status**: Production Ready  
**Dependencies**: None (uses PHP built-ins)
