# /portal-qa — BlackFire Portal Quality Assurance

Run a structured QA pass on the BlackFire Portal before committing or deploying.
Focus: $ARGUMENTS (if blank, run the full checklist).

## What to check

### 1. PHP safety
- Read `portal.php`, `router.php`, and any recently modified `.php` files (check `git diff --name-only` for the list).
- Flag any raw `$_GET`/`$_POST` used without sanitisation or prepared statements.
- Check for missing RBAC guards (`if (!hasRole(...))`) on new endpoints or page sections.
- Confirm no `echo $_GET`/`echo $_POST` or `eval()` anywhere in changed files.
- Verify no hardcoded credentials or API keys in changed PHP.

### 2. JavaScript & CSS
- Read `portal.js` and `portal.css` for any recently changed sections.
- Check that DOM manipulation uses safe methods (no `innerHTML` with unsanitised user data).
- Confirm no `console.log` left in production paths.
- Check that any new CSS class names follow the existing `kval--`, `callout--`, `bf-` naming conventions.

### 3. SQL
- Read any `.sql` files modified or referenced in recent PHP changes.
- Flag UPDATE/DELETE statements without a WHERE clause.
- Flag any DROP TABLE or TRUNCATE not wrapped in a transaction.
- Check that new columns have appropriate NOT NULL or default constraints.

### 4. Session log compliance
- Verify the current session log in `c:\DevWork\sessions\` has Goal, Work Done, and Decisions filled in.
- If not, remind the user to update it before closing the session.

### 5. Backup compliance
- Check git diff for modified files. For each file, confirm a timestamped backup exists in the nearest `_backups/` folder.
- List any missing backups.

## Output format

Report as a numbered snag list grouped by section:
```
## Portal QA Report — YYYY-MM-DD

### PHP Safety  [PASS / ISSUES FOUND]
1. <finding> — <file:line>

### JS/CSS  [PASS / ISSUES FOUND]
...

### SQL  [PASS / ISSUES FOUND]
...

### Session Log  [PASS / NEEDS UPDATE]
...

### Backups  [COMPLETE / MISSING]
- Missing backup: <filename>
```

End with a single line: `Ready to commit ✓` or `Block: fix issues above before committing ✗`.
Do NOT auto-fix. Only report. The user decides what to fix.
