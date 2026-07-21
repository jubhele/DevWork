# BlackFire cPanel Production Deployment

- `BlackFire Portal/install/deploy.sh` builds an explicit production allowlist before syncing to `public_html`; `.gitignore` is preventive hygiene, not a deployment manifest.
- The required company-profile logos are `assets/brand/astute-insights-wordmark.svg` and `assets/brand/blackfire-logo.png`. Keep these exact files in the allowlist; do not include backup variants or the duplicate `assets/brands/` tree.
- Public approval links use root `approve.php`. The unreferenced duplicate `api/approve.php` has an invalid config include and is explicitly excluded from production deployment.
- Production deployment preserves existing `uploads/`, `.well-known/`, and `cgi-bin/` content. Other files absent from the release are deleted so stale QA, documentation, installation, backup, log, and secret artifacts do not remain publicly reachable.
- Existing customer uploads are preserved, but files whose names begin with `qa_` are known test artifacts and are removed from `uploads/` during deployment.
- Runtime secrets live at `~/blackfire_secrets.php`, outside `public_html`. The deploy script must never copy a secret file or secret template into the web root.
- The real-named `BlackFire Portal/blackfire_secrets.php` was already tracked in Git as of 2026-07-20. Ignoring it prevents future untracked additions but does not remove it from the index or history; repository cleanup and credential rotation remain separate security work.
