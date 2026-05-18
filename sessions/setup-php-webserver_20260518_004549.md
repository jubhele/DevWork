# Session: Setup PHP Webserver
Date: 2026-05-18
Provider: OpenAI Codex
Model: GPT-5 (Codex)

## Goal
Set up a local web server on this laptop so PHP files in C:\DevWork\BlackFire\BlackFire Portal can be run in a browser.

## Model Recommendation
Task tier: 1-Fast
Recommended model: GPT-4o-mini  Trust score: 8/10
Active model: GPT-5 (Codex)  Status: over-powered

## Decisions
- Installed PHP 8.4 via winget and used PHP's built-in server instead of a heavier stack (XAMPP/WAMP) for quickest local run.
- Added a reusable launcher script (start-php-server.ps1) in the portal folder so the server can be started on demand.
- Used host 127.0.0.1 and port 8080 to avoid common port conflicts.

## Work Done
- Created BlackFire/BlackFire Portal/start-php-server.ps1 to auto-locate PHP and start the local server.
- Verified PHP install (PHP 8.4.21) via direct executable path.
- Started server process and validated app responds with HTTP 200 at http://127.0.0.1:8080/.

## Blockers / Next Steps
- php is not on PATH in this shell context; script uses the winget package path fallback.
- If PATH access is needed everywhere, add PHP install folder to user/system PATH and open a new terminal.
- Stop running server with: Stop-Process -Id 13760.

## Learnings
- On this machine, winget-installed PHP is available under LocalAppData and executable by path, but command alias/PATH is not immediately available in this environment.
- For this project, built-in PHP server is enough for local run checks; no Apache stack was required.
- Model trust scores were not updated; no divergence evidence beyond this simple setup task.

## Resumed 2026-05-18

### Decisions
- Enabled required PHP modules via project-local php.local.ini (openssl, pdo_mysql) because the winget PHP runtime had no loaded php.ini by default.
- Kept fix local to this project runtime and added a function guard in config/config.php to prevent duplicate declaration when config is loaded multiple times.

### Work Done
- Updated BlackFire/BlackFire Portal/start-php-server.ps1 to generate and use php.local.ini on launch.
- Added BlackFire/BlackFire Portal/php.local.ini with extension settings.
- Patched BlackFire/BlackFire Portal/config/config.php with if (!function_exists('bf_decrypt')) wrapper.
- Verified openssl + pdo_mysql are loaded and homepage returns valid HTML (HTTP 200).

### Blockers / Next Steps
- For local dev DB access, set BF_DB_PASS in .env if BF_APP_KEY/BF_DB_PASS_ENC are not available.
- Current running local server PID: 24936.

### Learnings
- Winget-installed PHP can run without any default php.ini in this environment, which causes extension-related fatals unless explicitly configured.
