# /sql-safety — SQL Safety Review

Review the SQL in $ARGUMENTS before execution. If no argument given, review the most recently
modified `.sql` file in the workspace, or ask the user to paste the SQL.

## Review criteria

### Destructive operations
- Any `DELETE` without a `WHERE` clause → BLOCK
- Any `UPDATE` without a `WHERE` clause → BLOCK
- Any `DROP TABLE`, `DROP DATABASE`, `TRUNCATE` → WARN and require explicit confirmation note in the session log
- Any `ALTER TABLE DROP COLUMN` → WARN (irreversible data loss)

### Transaction safety
- Multi-statement migrations that change data must be wrapped in `BEGIN`/`COMMIT`
- If not wrapped, flag as MISSING TRANSACTION

### Referential integrity
- Check for FK constraints likely to fail (e.g. inserting a child row before its parent, or deleting a parent with children)
- Look for CASCADE DELETE that might propagate unexpectedly

### Seed vs migration
- Determine if this is seed data (INSERT only, idempotent) or a migration (structural DDL)
- For migrations: confirm there is a rollback path or note that there is none

### BlackFire-specific rules
- Table names must match the schema conventions: `bf_clients`, `bf_users`, `bf_safety_files`, etc.
- User IDs referenced must exist in `bf_users` — flag any hardcoded numeric IDs not in the seed
- Never use `DEMO`, `TEST`, or `SAMPLE` as data values — these are production datasets

## Output format

```
## SQL Safety Report — YYYY-MM-DD
File / source: <filename or "pasted">

### Destructive Operations  [NONE / BLOCKED / WARNED]
- <statement snippet> at line <N>: <reason>

### Transaction Safety  [OK / MISSING TRANSACTION]
...

### Referential Integrity  [OK / RISKS FOUND]
...

### Classification
Type: [seed | migration | query | mixed]
Rollback path: [yes — <description> | no — manual recovery required]

### Verdict
[SAFE TO RUN | FIX BEFORE RUNNING | REQUIRES MANUAL BACKUP FIRST]
```
