# Session: BlackFire Portal — Local Dev Server Setup
Date: 2026-05-25
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Set up a localhost server to view the BlackFire Portal PHP files at C:\DevWork\BlackFire\BlackFire Portal. PHP 8.4 is available; XAMPP and MySQL are not installed. The goal is a PHP built-in server that serves the portal UI for local inspection and editing.

## Model Recommendation
Task tier: 1-Fast
Recommended model: Haiku 4.5  Trust score: 9/10
Active model: claude-sonnet-4-6  Status: over-powered for this task

## Decisions
- Using PHP built-in server (`php -S localhost:8080`) since XAMPP is absent
- Created router.php to replicate .htaccess mod_rewrite routing
- API endpoints will return DB errors (no local MySQL) — UI shell renders fine
- No local DB setup attempted; production DB is Afrihost-hosted and not accessible locally

## Work Done
- Created BlackFire\BlackFire Portal\router.php — dev-only router for PHP built-in server

## Blockers / Next Steps
- MySQL not installed: API endpoints (auth, dashboard, invoices, etc.) will fail
- To fully run locally: install MySQL/MariaDB + import a DB snapshot
- config.php has `require_https: true` and `secure_cookies: true` — may need a local override for sessions

## Learnings
- TBD
