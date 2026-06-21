-- Fix invoice → callout linkage gaps identified 2026-06-21.
--
-- Problem: 13 invoices from the June 9 batch have no path back to a callout.
--   • INV-090626-0111: callout_ref = CO-090626-0109 (deleted ghost; callout_id FK still set to 61)
--   • 7 × AECI Chempark @ R12,750 (Monthly Security Monitoring)
--   • 5 × Sasol Secunda @ R5,500  (Monthly Security Monitoring)
--   • 1 × AECI Chempark @ R21,200 via Q-090626-0107 (Security Services – Equipment & Installation)
-- Also backfills callout_ref on quotes Q-090626-0101..0107.
--
-- Safe to re-run. Skips rows whose callout already exists.

SET NAMES utf8mb4;

-- ── Backup ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bf_callouts_backup_20260621_linkage LIKE bf_callouts;
INSERT IGNORE INTO bf_callouts_backup_20260621_linkage SELECT * FROM bf_callouts;

CREATE TABLE IF NOT EXISTS bf_invoices_backup_20260621_linkage LIKE bf_invoices;
INSERT IGNORE INTO bf_invoices_backup_20260621_linkage SELECT * FROM bf_invoices;

CREATE TABLE IF NOT EXISTS bf_quotes_backup_20260621_linkage LIKE bf_quotes;
INSERT IGNORE INTO bf_quotes_backup_20260621_linkage SELECT * FROM bf_quotes;

-- ── Phase 1: Recreate ghost CO-090626-0109 (INV-090626-0111, R0) ─────────────
INSERT IGNORE INTO bf_callouts (
  ref_id, client_name, client_id, client_email,
  service, location, tech, assigned_to, priority,
  status, approval_status, callout_date, callout_time,
  notes, invoice_generated, logged_by_user_id, assigned_to_user_id, job_no,
  created_at, updated_at
) VALUES (
  'CO-090626-0109', 'AECI Chempark', 1, 'aeci@astuteinsights.co.za',
  'Security Services – Internal Coordination', 'AECI Chempark', 'Jubhele Shange', 'admin', 'Normal',
  'Invoiced', 'not_required', '2026-06-09', '08:00:00',
  'Recreated from invoice record INV-090626-0111. Original callout deleted; backfilled to restore audit trail.',
  1, 13, NULL, NULL,
  '2026-06-09 04:36:37', '2026-06-21 00:00:00'
);

-- Link INV-090626-0111 to the recreated callout
UPDATE bf_invoices i
JOIN bf_callouts c ON c.ref_id = 'CO-090626-0109'
SET i.callout_id = c.id
WHERE i.ref_id = 'INV-090626-0111'
  AND (i.callout_id IS NULL OR i.callout_id <> c.id);

-- ── Phase 2: Monthly retainer callouts for AECI Chempark (R12,750 × 7) ───────
INSERT IGNORE INTO bf_callouts (
  ref_id, client_name, client_id, client_email,
  service, location, tech, assigned_to, priority,
  status, approval_status, callout_date, callout_time,
  notes, invoice_generated, logged_by_user_id, assigned_to_user_id, job_no,
  created_at, updated_at
)
SELECT
  CONCAT('CO-090626-', LPAD(90 + ROW_NUMBER() OVER (ORDER BY i.ref_id), 4, '0')),
  'AECI Chempark', 1, 'aeci@astuteinsights.co.za',
  'Monthly Security Monitoring Services', 'AECI Chempark – All Sectors', 'Sibulelo Mtolo', 'admin', 'Normal',
  'Invoiced', 'not_required', '2026-06-09', '08:00:00',
  CONCAT('Backfilled retainer callout for ', i.ref_id, '. Imported from June 2026 statement batch.'),
  1, 13, NULL, NULL,
  '2026-06-09 04:36:37', '2026-06-21 00:00:00'
FROM bf_invoices i
WHERE i.ref_id IN ('INV-090626-0101','INV-090626-0103','INV-090626-0105',
                   'INV-090626-0108','INV-090626-0112','INV-090626-0116','INV-090626-0120')
  AND (i.callout_ref IS NULL OR i.callout_ref = '');

-- Update AECI R12,750 invoices to reference their new callouts
UPDATE bf_invoices i
JOIN bf_callouts c ON c.notes LIKE CONCAT('%', i.ref_id, '%')
  AND c.ref_id LIKE 'CO-090626-%'
  AND c.client_name = 'AECI Chempark'
  AND c.service = 'Monthly Security Monitoring Services'
SET i.callout_ref = c.ref_id,
    i.callout_id  = c.id
WHERE i.ref_id IN ('INV-090626-0101','INV-090626-0103','INV-090626-0105',
                   'INV-090626-0108','INV-090626-0112','INV-090626-0116','INV-090626-0120')
  AND (i.callout_ref IS NULL OR i.callout_ref = '');

-- ── Phase 3: Monthly retainer callouts for Sasol Secunda (R5,500 × 5) ────────
INSERT IGNORE INTO bf_callouts (
  ref_id, client_name, client_id, client_email,
  service, location, tech, assigned_to, priority,
  status, approval_status, callout_date, callout_time,
  notes, invoice_generated, logged_by_user_id, assigned_to_user_id, job_no,
  created_at, updated_at
)
SELECT
  CONCAT('CO-090626-', LPAD(97 + ROW_NUMBER() OVER (ORDER BY i.ref_id), 4, '0')),
  'Sasol Secunda', 3, '',
  'Monthly Security Monitoring Services', 'Sasol Secunda – Site', 'Sibulelo Mtolo', 'admin', 'Normal',
  'Invoiced', 'not_required', '2026-06-09', '08:00:00',
  CONCAT('Backfilled retainer callout for ', i.ref_id, '. Imported from June 2026 statement batch.'),
  1, 13, NULL, NULL,
  '2026-06-09 04:36:37', '2026-06-21 00:00:00'
FROM bf_invoices i
WHERE i.ref_id IN ('INV-090626-0107','INV-090626-0110','INV-090626-0114',
                   'INV-090626-0118','INV-090626-0122')
  AND (i.callout_ref IS NULL OR i.callout_ref = '');

-- Update Sasol invoices
UPDATE bf_invoices i
JOIN bf_callouts c ON c.notes LIKE CONCAT('%', i.ref_id, '%')
  AND c.ref_id LIKE 'CO-090626-%'
  AND c.client_name = 'Sasol Secunda'
  AND c.service = 'Monthly Security Monitoring Services'
SET i.callout_ref = c.ref_id,
    i.callout_id  = c.id
WHERE i.ref_id IN ('INV-090626-0107','INV-090626-0110','INV-090626-0114',
                   'INV-090626-0118','INV-090626-0122')
  AND (i.callout_ref IS NULL OR i.callout_ref = '');

-- ── Phase 4: Callout for the R21,200 quote (Q-090626-0107 → INV-090626-0125) ─
INSERT IGNORE INTO bf_callouts (
  ref_id, client_name, client_id, client_email,
  service, location, tech, assigned_to, priority,
  status, approval_status, callout_date, callout_time,
  notes, invoice_generated, logged_by_user_id, assigned_to_user_id, job_no,
  created_at, updated_at
) VALUES (
  'CO-090626-0102', 'AECI Chempark', 1, 'aeci@astuteinsights.co.za',
  'Security Services – Equipment Supply & Installation', 'AECI Chempark', 'Sibulelo Mtolo', 'admin', 'Normal',
  'Invoiced', 'not_required', '2026-06-09', '08:00:00',
  'Backfilled callout for Q-090626-0107 / INV-090626-0125. June 2026 statement batch.',
  1, 13, NULL, NULL,
  '2026-06-09 04:36:37', '2026-06-21 00:00:00'
);

-- Link quote Q-090626-0107 and invoice INV-090626-0125 to CO-090626-0102
UPDATE bf_quotes SET callout_ref = 'CO-090626-0102',
  callout_id = (SELECT id FROM bf_callouts WHERE ref_id = 'CO-090626-0102')
WHERE ref_id = 'Q-090626-0107' AND (callout_ref IS NULL OR callout_ref = '');

UPDATE bf_invoices
SET callout_ref = 'CO-090626-0102',
    callout_id  = (SELECT id FROM bf_callouts WHERE ref_id = 'CO-090626-0102')
WHERE ref_id = 'INV-090626-0125'
  AND (callout_ref IS NULL OR callout_ref = '');

-- ── Phase 5: Backfill callout_ref on Q-090626-0101..0106 (same service pattern) ─
-- These 6 approved quotes have the same structure (2x R8,500 + 1x R4,200).
-- Create individual callouts for each so each quote has a proper originating event.
INSERT IGNORE INTO bf_callouts (
  ref_id, client_name, client_id, client_email,
  service, location, tech, assigned_to, priority,
  status, approval_status, callout_date, callout_time,
  notes, invoice_generated, logged_by_user_id, assigned_to_user_id, job_no,
  created_at, updated_at
)
SELECT
  CONCAT('CO-090626-0', 103 + (ROW_NUMBER() OVER (ORDER BY q.ref_id) * 2) - 2),
  'AECI Chempark', 1, 'aeci@astuteinsights.co.za',
  'Security Services – Equipment Supply & Installation', 'AECI Chempark', 'Sibulelo Mtolo', 'admin', 'Normal',
  'Completed', 'not_required', '2026-06-09', '08:00:00',
  CONCAT('Backfilled callout for quote ', q.ref_id, '. June 2026 statement batch.'),
  0, 13, NULL, NULL,
  '2026-06-09 04:36:37', '2026-06-21 00:00:00'
FROM bf_quotes q
WHERE q.ref_id IN ('Q-090626-0101','Q-090626-0102','Q-090626-0103',
                   'Q-090626-0104','Q-090626-0105','Q-090626-0106')
  AND (q.callout_ref IS NULL OR q.callout_ref = '');

-- Link the quotes back to their new callouts
UPDATE bf_quotes q
JOIN bf_callouts c ON c.notes LIKE CONCAT('%', q.ref_id, '%')
  AND c.ref_id LIKE 'CO-090626-%'
SET q.callout_ref = c.ref_id,
    q.callout_id  = c.id
WHERE q.ref_id IN ('Q-090626-0101','Q-090626-0102','Q-090626-0103',
                   'Q-090626-0104','Q-090626-0105','Q-090626-0106')
  AND (q.callout_ref IS NULL OR q.callout_ref = '');

-- ── Confirm ───────────────────────────────────────────────────────────────────
SELECT
  i.ref_id              AS invoice,
  i.callout_ref         AS direct_co,
  q.callout_ref         AS via_quote_co,
  CASE
    WHEN i.callout_ref <> ''   THEN 'direct'
    WHEN q.callout_ref <> ''   THEN 'via_quote'
    ELSE 'STILL_MISSING'
  END                   AS link_type,
  i.client_name,
  i.amount
FROM bf_invoices i
LEFT JOIN bf_quotes q ON q.ref_id = i.quote_ref
WHERE i.ref_id IN (
  'INV-090626-0101','INV-090626-0103','INV-090626-0105','INV-090626-0107',
  'INV-090626-0108','INV-090626-0110','INV-090626-0111','INV-090626-0112',
  'INV-090626-0114','INV-090626-0116','INV-090626-0118','INV-090626-0120',
  'INV-090626-0122','INV-090626-0125'
)
ORDER BY i.ref_id;
