# api/_archive — Refactor Archive
**Archived:** 2026-05-24  
**Reason:** These files were superseded when the monolithic `api/portal.php` was split into individual endpoint files.

## What was archived and why

| File | What it was | Why archived |
|------|-------------|--------------|
| `portal_monolith.php` | Original single-file portal (3,022 lines). Contained PHP + HTML + all JS inline. | Superseded by `../portal.php` (HTML shell) + `../portal.js` (JS) + individual endpoint files |
| `portal_refactored.php` | Intermediate refactor step — HTML shell without the external JS split complete | Superseded by `../portal.php` (authoritative HTML shell) |
| `portal.js` | Partial JS extraction (1,921 lines) from the monolith during early refactor | Superseded by `../portal.js` (6,152 lines — complete extraction) |
| `portal.css` | Partial CSS during early refactor (32 KB) | Superseded by `../portal.css` (69 KB — complete styles) |
| `refactor_portal.py` | Python script used to assist with extracting JS from the monolith | One-time migration tool, no longer needed |

## Current architecture (live)

```
BlackFire Portal/
├── index.php              ← Entry point → loads portal.php
├── portal.php             ← HTML shell (public site + login + portal pages)
├── portal.js              ← All frontend JS (fetch-based API layer)
├── portal.css             ← All styles
├── includes/              ← Shared PHP: auth, db, helpers, mailer
├── config/config.php      ← Environment config + secrets
└── api/
    ├── auth.php           ← Login, logout, session, password reset
    ├── callouts.php       ← Job tickets / field ops
    ├── clients.php        ← Client management
    ├── dashboard.php      ← Dashboard summary data
    ├── files.php          ← File upload / attachment serving
    ├── invoices.php       ← Billing and invoices
    ├── payments.php       ← Payment logging
    ├── quotes.php         ← Proposals and approvals
    ├── safety.php         ← Safety file management
    ├── safety_compliance.php
    ├── safety_doc_gen.php
    ├── safety_personnel.php
    ├── safety_policy.php
    ├── statements.php     ← Account statements
    ├── transactions.php   ← Bank ledger
    ├── users.php          ← User and role management
    ├── audit.php          ← Audit log
    ├── admin.php          ← Admin operations
    ├── approvals.php      ← Approval workflow
    └── approve.php        ← Email-based approval handler
```
