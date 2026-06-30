# BlackFire — System Technical Test Manual (STTM)

> Maintained by Mbhali + Mvavanyi. Updated when QA suite expands.

## Pre-Deploy Security Checklist (Umlindi)

- [ ] No hardcoded credentials in PHP/JS/SQL files
- [ ] `.env` not committed; `.env.example` has empty values only
- [ ] `api_headers()` called before `require_auth()` on every endpoint
- [ ] CSP: no inline onclick/onkeydown handlers
- [ ] RBAC: roles match confirmed user permissions
- [ ] RBAC migration applied and `api/users.php` role whitelist matches shared contract/types
- [ ] DEBUG_MODE=false in production `.env`
- [ ] All new tables have `host_company_id DEFAULT 1`

## Baseline Security Checklist (Mhloli / OWASP)

- [ ] SQL injection: parameterized queries on all user inputs
- [ ] XSS: all output escaped with htmlspecialchars()
- [ ] Auth bypass: session validated on every protected endpoint
- [ ] File upload: mime type validated, stored outside webroot

## Regression Paths

_Document regression test cases here as features ship._

## Known Good States

_Document confirmed-working states per sprint here._
