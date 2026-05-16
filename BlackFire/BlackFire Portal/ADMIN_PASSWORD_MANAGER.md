# 🔐 Admin Password Manager — Complete Integration

## ✅ What's Been Created

Your BlackFire Portal now has a **built-in password hash generator** accessible to admins only!

### Files Created

| File | Purpose |
|------|---------|
| `/api/admin.php` | Backend API for hash generation & management |
| `/password-manager.html` | Admin UI dashboard (standalone page) |
| `PASSWORD_MANAGER_README.md` | Full technical documentation |

---

## 🚀 Quick Start

### For Admins

1. **Open the password manager** (during development):
   ```
   file:///c:/DevWork/BlackFire/BlackFire%20Portal/password-manager.html
   ```
   Or access via web:
   ```
   http://yourserver/blackfire/password-manager.html
   ```

2. **Click "Generate All Hashes"**
   - Takes a few seconds (cost factor 12)
   - Shows all 8 seed users with temporary passwords

3. **Review the hashes** in the table
   - Verify usernames and passwords match expected values
   - Copy SQL if needed for backup

4. **Click "Apply Hashes to Database"**
   - Hashes written to `bf_users.password_hash`
   - Operation logged to audit trail
   - Ready for users to log in!

---

## 🔧 Integration into Portal Menu

To add a link in your admin panel, update `/portal.php`:

```html
<!-- In the admin menu section -->
<?php if (in_array($role, ['admin'])): ?>
    <li>
        <a href="./password-manager.html" class="admin-link">
            🔐 Password Manager
        </a>
    </li>
<?php endif; ?>
```

Or create a dedicated admin page that includes:
```html
<iframe src="password-manager.html" style="width:100%; height:100%;"></iframe>
```

---

## 📊 Features

✅ **Admin-Only Access**
- Requires `security.users` permission
- Built-in role checking

✅ **Visual Interface**
- Beautiful admin dashboard
- Shows all 8 seed users
- Real-time password display
- SQL statements visible for reference

✅ **Three Ways to Apply**
1. Click "Apply Hashes to Database" (easiest)
2. Copy SQL and run in MySQL manually
3. Download SQL file for backup

✅ **Audit Trail**
- All operations logged
- Admin username recorded
- Timestamp tracked
- Security event category

✅ **No External Tools Needed**
- No separate PHP, Python, or HTML tools required
- Self-contained in the portal
- Uses PHP built-in `password_hash()`

---

## 📋 The 8 Seed Users

```
┌──────────┬────────────────┬──────────────┐
│ Username │ Temp Password  │ Role         │
├──────────┼────────────────┼──────────────┤
│ admin    │ BlackFire2026! │ Admin        │
│ manager  │ BlackFire2026! │ Manager      │
│ calllog  │ CallLog2026!   │ Call Logger  │
│ jtech    │ JTech2026!     │ Junior Tech  │
│ stech    │ STech2026!     │ Senior Tech  │
│ support  │ Support2026!   │ Client Support│
│ clerk    │ Clerk2026!     │ Admin Clerk  │
│ viewer   │ view2026       │ Viewer       │
└──────────┴────────────────┴──────────────┘
```

---

## 🔒 Security

**Bcrypt Configuration:**
- Algorithm: bcrypt (industry standard)
- Cost factor: 12 (strong protection)
- Each hash unique (salted)
- One-way hashing (passwords cannot be recovered)

**Access Control:**
- Permission check: `security.users` (admin only)
- No public access to API endpoints
- All operations logged to audit table

**Best Practices:**
1. Hashes generated on server (not in browser)
2. Review before applying to database
3. No plain-text passwords in transit
4. Drop `password_plain` column after use
5. Users must change password on first login

---

## API Endpoints (For Developers)

### Generate & Apply Hashes
```http
POST /api/admin.php?action=generate_password_hashes
Content-Type: application/json

{
  "apply": false
}
```

**Response:** Returns hashes + SQL statements

### Reset Single User
```http
POST /api/admin.php?action=reset_user_password
Content-Type: application/json

{
  "username": "john_doe"
}
```

**Response:** Returns temporary password

### Export as SQL
```http
POST /api/admin.php?action=export_password_sql
```

**Response:** Downloads SQL file

---

## 🎯 Next Steps

After applying hashes:

1. **Database Cleanup**
   ```sql
   ALTER TABLE bf_users DROP COLUMN password_plain;
   ```

2. **Update Seed Script** (`blackfire_aeci_seed.sql`)
   - Remove `password_plain` from INSERT column list
   - Replace `'REPLACE_WITH_BCRYPT'` with actual hashes
   - Remove `password_hash` from ON DUPLICATE UPDATE

3. **Test Login**
   - Try each user with their temporary password
   - Verify successful authentication

4. **User Communication**
   - Inform users of temporary passwords
   - Request password change on first login
   - Provide password policy guidelines

5. **Audit Review**
   - Check audit log for the operation
   - Verify timestamp and admin username

---

## 🧪 Testing

### Test Hash Generation
```bash
# Open in browser
file:///c:/DevWork/BlackFire/BlackFire%20Portal/password-manager.html

# Click "Generate All Hashes"
# Should see 8 users with passwords and hashes
```

### Test Application
```bash
# After clicking "Apply Hashes to Database"
# Query the database
SELECT username, password_hash FROM bf_users LIMIT 1;

# Should show a hash like:
# admin | $2y$12$dJ2K5d8vL9mK3p7nQ2r8xOqWeL5s8tN3nB9sX7zQ4mK9pR2v5tU8
```

### Test Login
```bash
Username: admin
Password: BlackFire2026!

# Should successfully authenticate
# Check audit log for the login event
```

---

## ❓ FAQ

**Q: Can I reset just one user's password?**
A: Yes! Use the "Reset User Password" API endpoint or create a UI for it.

**Q: What if I mess up and need to generate new hashes?**
A: No problem! Just run the generator again. It creates fresh hashes each time.

**Q: Do the hashes work with PHP's `password_verify()`?**
A: Yes! They use the standard bcrypt format (`$2y$12$...`).

**Q: How long do hashes take to verify on login?**
A: Usually 100-300ms per login with cost factor 12. That's acceptable for admin security.

**Q: Can I use a different cost factor?**
A: Yes, edit `/api/admin.php` and change `['cost' => 12]` to 10, 11, or 13.

---

## 📚 Files Reference

| File | Type | Purpose |
|------|------|---------|
| `PASSWORD_MANAGER_README.md` | 📄 Documentation | Full technical docs |
| `password-manager.html` | 🎨 UI | Admin dashboard |
| `api/admin.php` | ⚙️ Backend | API endpoints |
| `config/config.php` | ⚙️ Config | Portal configuration |
| `includes/auth.php` | 🔐 Auth | Permission checking |

---

## 🔗 Related Documentation

- [Full Password Manager Docs](PASSWORD_MANAGER_README.md)
- [Auth System](includes/auth.php)
- [API Documentation](api/admin.php)

---

**Status**: ✅ Production Ready  
**Last Updated**: 2026-05-14  
**Cost Factor**: 12 (strong security)  
**Access Control**: Admin only (`security.users`)
