-- Patch for fix_invoice_callout_linkage_20260621.sql
-- Corrects two specific issues:
--  1. INV-090626-0125 / Q-090626-0107 were wrongly linked to CO-090626-0102 (Sasol)
--     because the intended AECI Equipment Install callout conflicted on ref_id.
--     Fix: create CO-090626-0115 for this AECI service and repoint both records.
--  2. Q-090626-0104 has no callout because CO-090626-0109 (its computed ref) was
--     already taken by the ghost callout. Fix: create CO-090626-0116 for this quote.

SET NAMES utf8mb4;

-- ── Fix 1: AECI Equipment Install callout for Q-090626-0107 / INV-090626-0125 ─
INSERT IGNORE INTO bf_callouts (
  ref_id, client_name, client_id, client_email,
  service, location, tech, assigned_to, priority,
  status, approval_status, callout_date, callout_time,
  notes, invoice_generated, logged_by_user_id, assigned_to_user_id, job_no,
  created_at, updated_at
) VALUES (
  'CO-090626-0115', 'AECI Chempark', 1, 'aeci@astuteinsights.co.za',
  'Security Services – Equipment Supply & Installation', 'AECI Chempark', 'Sibulelo Mtolo', 'admin', 'Normal',
  'Invoiced', 'not_required', '2026-06-09', '08:00:00',
  'Backfilled callout for Q-090626-0107 / INV-090626-0125. June 2026 statement batch.',
  1, 13, NULL, NULL,
  '2026-06-09 04:36:37', '2026-06-21 00:00:00'
);

-- Repoint Q-090626-0107 away from the Sasol callout
UPDATE bf_quotes
SET callout_ref = 'CO-090626-0115',
    callout_id  = (SELECT id FROM bf_callouts WHERE ref_id = 'CO-090626-0115')
WHERE ref_id = 'Q-090626-0107';

-- Repoint INV-090626-0125 away from the Sasol callout
UPDATE bf_invoices
SET callout_ref = 'CO-090626-0115',
    callout_id  = (SELECT id FROM bf_callouts WHERE ref_id = 'CO-090626-0115')
WHERE ref_id = 'INV-090626-0125';

-- ── Fix 2: Missing callout for Q-090626-0104 ─────────────────────────────────
INSERT IGNORE INTO bf_callouts (
  ref_id, client_name, client_id, client_email,
  service, location, tech, assigned_to, priority,
  status, approval_status, callout_date, callout_time,
  notes, invoice_generated, logged_by_user_id, assigned_to_user_id, job_no,
  created_at, updated_at
) VALUES (
  'CO-090626-0116', 'AECI Chempark', 1, 'aeci@astuteinsights.co.za',
  'Security Services – Equipment Supply & Installation', 'AECI Chempark', 'Sibulelo Mtolo', 'admin', 'Normal',
  'Completed', 'not_required', '2026-06-09', '08:00:00',
  'Backfilled callout for Q-090626-0104. June 2026 statement batch.',
  0, 13, NULL, NULL,
  '2026-06-09 04:36:37', '2026-06-21 00:00:00'
);

UPDATE bf_quotes
SET callout_ref = 'CO-090626-0116',
    callout_id  = (SELECT id FROM bf_callouts WHERE ref_id = 'CO-090626-0116')
WHERE ref_id = 'Q-090626-0104'
  AND (callout_ref IS NULL OR callout_ref = '');

-- ── Confirm all 14 invoices and all 7 quotes now have callout linkage ─────────
SELECT 'INVOICES' AS section, i.ref_id, i.callout_ref, c.client_name AS callout_client, c.service, i.client_name, i.amount
FROM bf_invoices i
LEFT JOIN bf_callouts c ON c.ref_id = i.callout_ref
WHERE i.ref_id LIKE 'INV-090626-%'
ORDER BY i.ref_id;

SELECT 'QUOTES' AS section, q.ref_id, q.callout_ref, c.client_name AS callout_client, c.service, q.client_name
FROM bf_quotes q
LEFT JOIN bf_callouts c ON c.ref_id = q.callout_ref
WHERE q.ref_id LIKE 'Q-090626-%'
ORDER BY q.ref_id;
