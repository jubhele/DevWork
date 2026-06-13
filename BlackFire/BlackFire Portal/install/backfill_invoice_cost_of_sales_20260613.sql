-- Backfill invoices that do not yet have a cost-of-sales ledger entry.
-- Default rule: selling price = internal cost x 1.30, so cost = amount / 1.30.
-- Existing cost entries are preserved, including manually entered true costs.

INSERT INTO bf_transactions
  (trans_date, description, category, reference, credit, debit, created_at)
SELECT
  i.invoice_date,
  CONCAT('Cost of services - ', i.client_name, ' (',
         CASE WHEN COALESCE(i.callout_ref, '') <> '' THEN i.callout_ref ELSE i.ref_id END,
         ')'),
  'Cost of Sales',
  CONCAT('COST-', CASE WHEN COALESCE(i.callout_ref, '') <> '' THEN i.callout_ref ELSE i.ref_id END),
  0.00,
  ROUND(i.amount / 1.30, 2),
  NOW()
FROM bf_invoices i
WHERE i.amount > 0
  AND NOT EXISTS (
    SELECT 1
    FROM bf_transactions t
    WHERE t.category = 'Cost of Sales'
      AND t.reference IN (
        CONCAT('COST-', CASE WHEN COALESCE(i.callout_ref, '') <> '' THEN i.callout_ref ELSE i.ref_id END),
        CASE WHEN COALESCE(i.callout_ref, '') <> '' THEN i.callout_ref ELSE i.ref_id END,
        i.ref_id
      )
  );
