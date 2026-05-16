# 🚀 START HERE: How to Use the Hash Generator

## The Quick Way (Recommended)

1. **Open `bcrypt_hash_generator.html` in your web browser**
   - Windows: Double-click the file or right-click → Open with → Your browser
   - Mac/Linux: Double-click the file
   
2. **Click the "Generate All Hashes" button**

3. **Copy the SQL statements** using the "Copy SQL to Clipboard" button

4. **Execute the SQL** in your MySQL client:
   ```sql
   -- Paste the copied SQL here and run it
   UPDATE users SET password_hash = '...' WHERE username = 'admin';
   UPDATE users SET password_hash = '...' WHERE username = 'manager';
   -- ... etc
   ```

5. **Drop the plain-text password column** (security):
   ```sql
   ALTER TABLE users DROP COLUMN password_plain;
   ```

Done! ✓

---

## Need More Help?

- **Full Instructions**: Read [HASH_GENERATION.md](HASH_GENERATION.md)
- **Alternative Tools**: 
  - PHP: `php generate_bcrypt_hashes.php`
  - Python: `python generate_bcrypt_hashes.py`

---

## ⚠️ Important Security Notes

1. **Plain-text password column** (`password_plain`) is a security risk
   - It MUST be deleted after hashing: `ALTER TABLE users DROP COLUMN password_plain;`
   - Update the seed script to not include it in future imports

2. **These are temporary passwords**
   - Users should change them on first login
   - Don't share plain-text passwords via email/Slack

3. **Test in development first**
   - Before production deployment, test the hash update in a dev database
   - Verify login still works

4. **Backup before updating**
   ```sql
   -- Optional: backup before making changes
   CREATE TABLE users_backup AS SELECT * FROM users;
   ```

---

## 📋 User Credentials (Temporary)

| Username   | Password      |
|-----------|---------------|
| admin     | BlackFire2026!|
| manager   | BlackFire2026!|
| calllog   | CallLog2026! |
| jtech     | JTech2026!   |
| stech     | STech2026!   |
| support   | Support2026! |
| clerk     | Clerk2026!   |
| viewer    | view2026     |

---

## Next Steps

After updating hashes in the database:

1. ✓ Run the SQL UPDATE statements
2. ✓ Drop the `password_plain` column
3. ⏭️ **Update `blackfire_aeci_seed.sql`**:
   - Remove `password_plain` from the INSERT column list
   - Replace `'REPLACE_WITH_BCRYPT'` with actual hashes
   - Remove `password_hash` from the ON DUPLICATE UPDATE clause
4. ⏭️ Test login with the new hashes
5. ⏭️ Deploy to production

---

Questions? See [HASH_GENERATION.md](HASH_GENERATION.md) for detailed documentation.
