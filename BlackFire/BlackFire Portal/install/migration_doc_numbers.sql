-- Migration: add user-editable document number fields to workflow tables
-- Each table keeps its immutable system ref_id for internal FK linking.
-- The new *_no column is the user-visible number printed on physical documents.
-- Defaults to ref_id value so existing records are unchanged visually.
-- Safe to run multiple times (ADD COLUMN IF NOT EXISTS).

SET NAMES utf8mb4;

-- ── bf_quotes: quote_no ───────────────────────────────────────────────────────
ALTER TABLE bf_quotes
  ADD COLUMN IF NOT EXISTS quote_no VARCHAR(50) NULL
    COMMENT 'User-visible quote number; defaults to ref_id. Editable to match external doc (e.g. AI20042026).';

UPDATE bf_quotes SET quote_no = ref_id WHERE quote_no IS NULL OR quote_no = '';

-- ── bf_invoices: invoice_no ───────────────────────────────────────────────────
ALTER TABLE bf_invoices
  ADD COLUMN IF NOT EXISTS invoice_no VARCHAR(50) NULL
    COMMENT 'User-visible invoice number; defaults to ref_id.';

UPDATE bf_invoices SET invoice_no = ref_id WHERE invoice_no IS NULL OR invoice_no = '';

-- ── bf_callouts: job_no ───────────────────────────────────────────────────────
ALTER TABLE bf_callouts
  ADD COLUMN IF NOT EXISTS job_no VARCHAR(50) NULL
    COMMENT 'User-visible job/work-order number; defaults to ref_id.';

UPDATE bf_callouts SET job_no = ref_id WHERE job_no IS NULL OR job_no = '';

-- ── Data fix: missing quote for CO-200426-0001 (CP1590 panic button) ──────────
-- Quote_AI20042026.xlsx shows Quote No. AI20042026; PO CP1590 from AECI Property Services.
-- Amount: R3,500 ex-VAT (× 1.15 = R4,025.00 = INV-AI20042026 amount).

INSERT IGNORE INTO bf_quotes
  (ref_id, quote_no, client_id, client_name, client_email,
   status, valid_until, quote_date,
   submitted_by, submitted_by_user_id, source, approval_status,
   callout_ref, notes, total_amount,
   approved_at, approved_by, created_at, updated_at)
SELECT
  'Q-200426-0001', 'AI20042026',
  c.id, 'AECI Chempark', 'yolanda.herbst@aeciworld.com',
  'Approved', '2026-05-20', '2026-04-20',
  'j.shange', u.id, 'staff', 'approved',
  'CO-200426-0001',
  'Supply and install emergency panic button at security booth. Linked to PO CP1590.',
  3500.00,
  '2026-04-21 09:00:00', 'Y. Herbst',
  '2026-04-20 10:00:00', '2026-04-21 09:00:00'
FROM bf_clients c, bf_users u
WHERE c.name = 'AECI Chempark'
  AND u.username = 'j.shange'
LIMIT 1;

INSERT IGNORE INTO bf_quote_items (quote_id, description, qty, unit_price)
SELECT id, 'Emergency panic button supply (Texecom FP-W)', 1.00, 2800.00
  FROM bf_quotes WHERE ref_id = 'Q-200426-0001' LIMIT 1;

INSERT IGNORE INTO bf_quote_items (quote_id, description, qty, unit_price)
SELECT id, 'Installation, cabling & commissioning', 1.00, 700.00
  FROM bf_quotes WHERE ref_id = 'Q-200426-0001' LIMIT 1;

-- Set quote_no on the new row (in case INSERT above ran before backfill above)
UPDATE bf_quotes SET quote_no = 'AI20042026' WHERE ref_id = 'Q-200426-0001' AND (quote_no IS NULL OR quote_no = '');

-- Link callout FK
UPDATE bf_quotes q
  JOIN bf_callouts c ON c.ref_id = q.callout_ref
  SET q.callout_id = c.id
  WHERE q.ref_id = 'Q-200426-0001';

-- ── Data fix: link INV-AI20042026 to its quote ────────────────────────────────
UPDATE bf_invoices
  SET quote_ref = 'Q-200426-0001'
  WHERE ref_id = 'INV-AI20042026'
    AND (quote_ref IS NULL OR quote_ref = '');

UPDATE bf_invoices i
  JOIN bf_quotes q ON q.ref_id = i.quote_ref
  SET i.quote_id = q.id
  WHERE i.ref_id = 'INV-AI20042026';
