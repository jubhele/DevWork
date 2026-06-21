-- Q-120626-0109 is a Draft CCTV camera installation quote (4 cameras, R22,266, AECI Chempark)
-- created 2026-06-12 without a preceding callout. Backfill the originating callout.
-- Q-140125-0001 (Rejected competitor benchmark) intentionally left without callout —
-- it is a reference record, not an operational workflow entry.

SET NAMES utf8mb4;

INSERT IGNORE INTO bf_callouts (
  ref_id, client_name, client_id, client_email,
  service, location, tech, assigned_to, priority,
  status, approval_status, callout_date, callout_time,
  notes, invoice_generated, logged_by_user_id, assigned_to_user_id, job_no,
  created_at, updated_at
) VALUES (
  'CO-120626-0108', 'AECI Chempark', 1, 'aeci@astuteinsights.co.za',
  'CCTV Camera Installation – 4 Cameras', 'AECI Chempark', 'Sibulelo Mtolo', 'admin', 'Normal',
  'Completed', 'not_required', '2026-06-12', '08:00:00',
  'Camera installation: 4 × IP camera, cabling, 8mm suspensor mounts, sundry. Quote Q-120626-0109 raised from this callout.',
  0, 13, NULL, NULL,
  '2026-06-12 08:00:00', '2026-06-21 00:00:00'
);

UPDATE bf_quotes
SET callout_ref = 'CO-120626-0108',
    callout_id  = (SELECT id FROM bf_callouts WHERE ref_id = 'CO-120626-0108')
WHERE ref_id = 'Q-120626-0109'
  AND (callout_ref IS NULL OR callout_ref = '');

-- Confirm
SELECT q.ref_id, q.callout_ref, c.service, c.status AS co_status, q.status AS q_status, q.total_amount
FROM bf_quotes q
LEFT JOIN bf_callouts c ON c.ref_id = q.callout_ref
WHERE q.ref_id = 'Q-120626-0109';
