# Session: Clients FK + Dropdown Selects
Date: 2026-05-21
Provider: Claude Code
Model: claude-sonnet-4-6

## Goal
Introduce a proper `bf_clients` master table with PK/FK relationships. Replace free-text client_name fields in callouts, quotes, and invoices with a foreign key `client_id`. Add dropdown `<select>` elements on all three capture forms. Add a Clients management page in the portal. Link portal users to clients for scoped data access. Support payment reconciliation by client.

## Model Recommendation
Task tier: 3-Complex
Recommended model: Opus 4.7  Trust score: 10/10
Active model: Sonnet 4.6  Status: under-powered for this task, proceeding

## Decisions
- Keep `client_name` denormalized in callouts/quotes/invoices (user chose this) — name auto-copied from bf_clients on insert
- bf_clients fields: name, email, phone, vat_number, address, contact_person, contact_details, notes, is_active
- Dropdowns keep same element IDs (nc-client, nq-client, ni-client); value becomes client_id integer
- bf_users gets client_id column to link portal users to their client (for scoped view)
- RBAC: clients.view, clients.create, clients.update — sysadmin/admin/manager/admin_clerk/client_support
- Back-fill: existing AECI Chempark rows get client_id=1 via UPDATE in migration

## Work Done
- install/clients_migration.sql — new: bf_clients table, FK columns, user link, RBAC, AECI seed + back-fill
- api/clients.php — new: full CRUD (GET list, POST create, PUT update, DELETE soft-delete)
- api/auth.php — add client_id to login SELECT and session object
- portal.php — p-clients page, client modal, nc-/nq-/ni-client changed to <select>
- portal.js — NAV entry, refreshClients(), populateClientDropdowns(), renderClients(), saveClient(), updated saveCallout/saveQuote/saveInvoice/convertToInvoice
- api/callouts.php — POST accepts client_id, GET filters by client_id for client_support role
- api/quotes.php — POST accepts client_id
- api/invoices.php — POST accepts client_id

## Blockers / Next Steps
- Run install/clients_migration.sql against database
- Add more clients beyond AECI seed via the new Clients page
- Consider adding client filter to p-log-payment for reconciliation workflow

## Learnings
- MANDATORY: fill before ending session
_Session ended: 2026-05-21 21:55:14 (Claude Code / claude-sonnet-4-6)_
