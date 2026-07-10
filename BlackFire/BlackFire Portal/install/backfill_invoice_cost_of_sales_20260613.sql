-- Backfill invoices that do not yet have generated cost ledger entries.
-- Default rule: generate Cost of Sales at 30%, Admin Costs at 15%, and Finance Costs at 15%.
-- Existing category-specific cost entries are preserved, including manually entered true costs.

INSERT INTO bf_transactions
  (trans_date, description, category, reference, callout_ref, credit, debit, created_at)
SELECT
  i.invoice_date,
  CONCAT(cost_type.label, ' - ', i.client_name, ' (',
         CASE WHEN COALESCE(i.callout_ref, '') <> '' THEN i.callout_ref ELSE i.ref_id END,
         ')'),
  cost_type.category,
  CONCAT(cost_type.prefix, CASE WHEN COALESCE(i.callout_ref, '') <> '' THEN i.callout_ref ELSE i.ref_id END),
  COALESCE(i.callout_ref, ''),
  0.00,
  ROUND(i.amount * cost_type.rate, 2),
  NOW()
FROM bf_invoices i
CROSS JOIN (
    SELECT 'Cost of Sales' AS category, 'COST-' AS prefix, 'Cost of services' AS label, 0.30 AS rate
    UNION ALL SELECT 'Admin Costs', 'ADMIN-', 'Admin costs', 0.15
    UNION ALL SELECT 'Finance Costs', 'FIN-', 'Finance costs', 0.15
) cost_type
WHERE i.amount > 0
  AND NOT EXISTS (
    SELECT 1
    FROM bf_transactions t
    WHERE t.category = cost_type.category
      AND t.reference IN (
        CONCAT(cost_type.prefix, CASE WHEN COALESCE(i.callout_ref, '') <> '' THEN i.callout_ref ELSE i.ref_id END),
        CASE WHEN COALESCE(i.callout_ref, '') <> '' THEN i.callout_ref ELSE i.ref_id END,
        i.ref_id
      )
  );
