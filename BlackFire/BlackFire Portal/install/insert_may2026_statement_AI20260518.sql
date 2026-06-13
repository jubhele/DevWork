-- ============================================================
-- BlackFire / Astute Insights — May 2026 Statement Data
-- Source: Account Statement AI20260518 (2026-06-02)
--         Chemhold Investments Pty Ltd — Due 2026-06-16
-- Chain:  Quote → Quote Items → Callout → Invoice → Cost of Sales
-- Invoices: INV-AI20260506 (CP1631), INV-AI20260427 (CP1643),
--           INV-AI27052026 (CP1630)
-- Total Outstanding: R26,037.50
-- Run AFTER: blackfire_real_finance_data.sql
-- ============================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

SET @aeci_id     = (SELECT id FROM bf_clients WHERE name = 'AECI Chempark' LIMIT 1);
SET @uid_jshange = (SELECT id FROM bf_users WHERE username = 'j.shange' LIMIT 1);
SET @uid_sibu    = (SELECT id FROM bf_users WHERE username = 'sibu'     LIMIT 1);

-- ── 1. QUOTES ────────────────────────────────────────────────
INSERT IGNORE INTO bf_quotes
  (ref_id, quote_no, client_id, client_name, client_email,
   status, valid_until, quote_date,
   submitted_by, submitted_by_user_id, source, approval_status,
   callout_ref, notes, total_amount,
   approved_at, approved_by, created_at, updated_at)
VALUES
-- CP1631: Cable clean-up labour variance (variance on CP1590 panic button job)
('Q-050526-0001','AI05052026',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
 'Approved','2026-05-20','2026-05-05',
 'j.shange',@uid_jshange,'staff','approved',
 'CO-060526-0001',
 'Labour variance for cable clean-up and routing arising from emergency panic button installation (PO CP1590). PO CP1631.',
 1495.00,'2026-05-05 14:00:00','Y. Herbst',
 '2026-05-05 09:00:00','2026-05-05 14:00:00'),
-- CP1643: Security fence repair call-out (INV ref AI20260427 = quoted Apr 27)
('Q-270426-0001','AI27042026',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
 'Approved','2026-05-27','2026-04-27',
 'j.shange',@uid_jshange,'staff','approved',
 'CO-100526-0001',
 'Call out for perimeter security fence fault diagnosis and repair. PO CP1643.',
 2012.50,'2026-04-28 10:00:00','Y. Herbst',
 '2026-04-27 09:00:00','2026-04-28 10:00:00'),
-- CP1630: Energiser recabling and vilt adjustment
('Q-200526-0001','AI20052026',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
 'Approved','2026-06-20','2026-05-20',
 'j.shange',@uid_jshange,'staff','approved',
 'CO-270526-0001',
 'Electric fence energiser recabling and vilt adjustment on perimeter. PO CP1630.',
 22530.00,'2026-05-21 11:00:00','Y. Herbst',
 '2026-05-20 09:00:00','2026-05-21 11:00:00');

-- ── 2. QUOTE ITEMS ───────────────────────────────────────────
-- CP1631 — labour only variance, single line
INSERT IGNORE INTO bf_quote_items (quote_id, description, qty, unit_price, line_total)
SELECT id, 'Labour — cable clean-up and routing (variance on CP1590)', 1.00, 1495.00, 1495.00
  FROM bf_quotes WHERE ref_id = 'Q-050526-0001' LIMIT 1;

-- CP1643 — call-out fee + labour
INSERT IGNORE INTO bf_quote_items (quote_id, description, qty, unit_price, line_total)
SELECT id, 'Call-out fee', 1.00, 575.00, 575.00
  FROM bf_quotes WHERE ref_id = 'Q-270426-0001' LIMIT 1;
INSERT IGNORE INTO bf_quote_items (quote_id, description, qty, unit_price, line_total)
SELECT id, 'Labour — perimeter fence fault diagnosis and repair', 1.00, 1437.50, 1437.50
  FROM bf_quotes WHERE ref_id = 'Q-270426-0001' LIMIT 1;

-- CP1630 — materials + labour + commissioning
INSERT IGNORE INTO bf_quote_items (quote_id, description, qty, unit_price, line_total)
SELECT id, 'Energiser cable supply (reticulation)', 1.00, 15000.00, 15000.00
  FROM bf_quotes WHERE ref_id = 'Q-200526-0001' LIMIT 1;
INSERT IGNORE INTO bf_quote_items (quote_id, description, qty, unit_price, line_total)
SELECT id, 'Labour — recabling and vilt adjustment', 1.00, 6530.00, 6530.00
  FROM bf_quotes WHERE ref_id = 'Q-200526-0001' LIMIT 1;
INSERT IGNORE INTO bf_quote_items (quote_id, description, qty, unit_price, line_total)
SELECT id, 'Consumables and sundries', 1.00, 1000.00, 1000.00
  FROM bf_quotes WHERE ref_id = 'Q-200526-0001' LIMIT 1;

-- Backfill quote callout_id FK
UPDATE bf_quotes q
  JOIN bf_callouts c ON c.ref_id = q.callout_ref
  SET q.callout_id = c.id
  WHERE q.ref_id IN ('Q-050526-0001','Q-270426-0001','Q-200526-0001');

-- ── 3. CALLOUTS ──────────────────────────────────────────────
INSERT IGNORE INTO bf_callouts
  (ref_id, client_id, client_name, client_email, service, location, tech,
   assigned_to, assigned_to_user_id, priority, status, approval_status,
   callout_date, callout_time, notes, logged_by_user_id, po,
   invoice_generated, created_at, updated_at)
VALUES
('CO-060526-0001',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Cable clean-up — Labour variance','AECI Chempark, Modderfontein, Gauteng',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2026-05-06','07:30:00',
 'Cable clean-up labour variance linked to emergency panic button installation (PO CP1590). PO CP1631.',
 @uid_jshange,'CP1631',1,'2026-05-06 07:00:00','2026-06-02 10:00:00'),
('CO-100526-0001',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Security fence repair','AECI Chempark — perimeter fence',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2026-05-10','07:30:00',
 'Call out for security fence fault diagnosis and repair. PO CP1643.',
 @uid_jshange,'CP1643',1,'2026-05-10 07:00:00','2026-06-02 10:00:00'),
('CO-270526-0001',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Energiser recabling and vilt adjustment','AECI Chempark — perimeter fence energiser',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2026-05-27','07:30:00',
 'Energiser recabling and vilt adjustment on electric fence perimeter. PO CP1630.',
 @uid_jshange,'CP1630',1,'2026-05-27 07:00:00','2026-06-02 10:00:00');

-- ── 4. INVOICES ──────────────────────────────────────────────
INSERT INTO bf_invoices
  (ref_id, client_id, client_name, client_email, amount, due_date, status,
   quote_ref, callout_ref, po, invoice_date, paid_date, sent_by_user_id, created_at, updated_at)
VALUES
('INV-AI20260506',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
  1495.00,'2026-06-16','Sent','Q-050526-0001','CO-060526-0001','CP1631',
  '2026-05-06',NULL,@uid_jshange,'2026-05-06 10:00:00','2026-06-02 10:00:00'),
('INV-AI20260427',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
  2012.50,'2026-06-16','Sent','Q-270426-0001','CO-100526-0001','CP1643',
  '2026-05-10',NULL,@uid_jshange,'2026-05-10 10:00:00','2026-06-02 10:00:00'),
('INV-AI27052026',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
  22530.00,'2026-06-16','Sent','Q-200526-0001','CO-270526-0001','CP1630',
  '2026-05-27',NULL,@uid_jshange,'2026-05-27 10:00:00','2026-06-02 10:00:00')
ON DUPLICATE KEY UPDATE
  quote_ref       = VALUES(quote_ref),
  amount          = VALUES(amount),
  status          = VALUES(status),
  paid_date       = VALUES(paid_date),
  due_date        = VALUES(due_date),
  callout_ref     = VALUES(callout_ref),
  po              = VALUES(po),
  sent_by_user_id = VALUES(sent_by_user_id),
  updated_at      = VALUES(updated_at);

-- Backfill callout_id and quote_id FKs on invoices
UPDATE bf_invoices i
  JOIN bf_callouts c ON c.ref_id = i.callout_ref
  SET i.callout_id = c.id
  WHERE i.ref_id IN ('INV-AI20260506','INV-AI20260427','INV-AI27052026');

UPDATE bf_invoices i
  JOIN bf_quotes q ON q.ref_id = i.quote_ref
  SET i.quote_id = q.id
  WHERE i.ref_id IN ('INV-AI20260506','INV-AI20260427','INV-AI27052026');

-- ── 5. STATEMENT RECORD ───────────────────────────────────────
INSERT IGNORE INTO bf_statements
  (ref_id, scheduled_for, status, invoice_refs, total_outstanding,
   released_by_user_id, released_at, from_email, to_emails, created_at)
VALUES
('STMT-AI20260518','2026-06-02','released',
 'INV-AI20260506,INV-AI20260427,INV-AI27052026',
 26037.50,
 @uid_jshange,'2026-06-02 10:00:00',
 'accounts@astuteinsights.co.za',
 'yolanda.herbst@aeciworld.com',
 '2026-06-02 10:00:00');

-- ── 6. COST OF SALES (30% margin rule: cost = amount / 1.30) ─
INSERT INTO bf_transactions
  (trans_date, description, category, reference, credit, debit, created_at)
VALUES
('2026-05-06','Cost of services — AECI Chempark (CP1631)','Cost of Sales','COST-CP1631',0.00, 1150.00,'2026-05-06 10:00:00'),
('2026-05-10','Cost of services — AECI Chempark (CP1643)','Cost of Sales','COST-CP1643',0.00, 1548.08,'2026-05-10 10:00:00'),
('2026-05-27','Cost of services — AECI Chempark (CP1630)','Cost of Sales','COST-CP1630',0.00,17330.77,'2026-05-27 10:00:00');

SET FOREIGN_KEY_CHECKS = 1;

-- ── Summary ──────────────────────────────────────────────────
-- Chain per job: Quote → Quote Items → Callout → Invoice → Cost of Sales
--
-- CP1631  Q-050526-0001  CO-060526-0001  INV-AI20260506   R 1,495.00
--         Items: Labour cable clean-up R1,495.00
-- CP1643  Q-270426-0001  CO-100526-0001  INV-AI20260427   R 2,012.50
--         Items: Call-out fee R575.00 | Labour R1,437.50
-- CP1630  Q-200526-0001  CO-270526-0001  INV-AI27052026   R22,530.00
--         Items: Cable supply R15,000 | Labour R6,530 | Sundries R1,000
--                                              ─────────────────────────
--                                              Total due:   R26,037.50
-- Cost of sales: CP1631 R1,150.00 | CP1643 R1,548.08 | CP1630 R17,330.77
-- Note: INV-AI20260427 ref aligns with quote date Apr 27; callout/invoice May 10.
