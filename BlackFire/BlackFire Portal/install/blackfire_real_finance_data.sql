-- ============================================================
-- BlackFire / Astute Insights — Real Finance Data (Full History)
-- Sources: BFS Account Statements (Nov 2024–Apr 2026)
--          AECI PO folder (CP0833–CP1592)
--          Siyasiza Group vendor invoices (A1026–A1033)
-- Replaces: fake testdata finance records from testdata_part3.sql
-- Run AFTER: all migrations + blackfire_aeci_seed.sql
-- ============================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── 0. SESSION VARIABLES ─────────────────────────────────────
SET @aeci_id     = (SELECT id FROM bf_clients WHERE name = 'AECI Chempark' LIMIT 1);
SET @uid_jshange = (SELECT id FROM bf_users WHERE username = 'j.shange' LIMIT 1);
SET @uid_sibu    = (SELECT id FROM bf_users WHERE username = 'sibu'     LIMIT 1);

-- ── 1. PURGE FAKE TESTDATA FINANCE RECORDS ───────────────────
-- Early callouts had fabricated PO numbers and fictional jobs
DELETE FROM bf_callouts WHERE ref_id IN (
  'CO-140724-0001','CO-041124-0001','CO-150125-0001','CO-150625-0001'
);
-- All testdata invoices used wrong amounts and made-up ref formats
DELETE FROM bf_invoices WHERE ref_id IN (
  'INV-210724-0001','INV-041124-0001','INV-150125-0001','INV-150625-0001',
  'INV-060326-0001','INV-060326-0002','INV-060326-0003','INV-090326-0001',
  'INV-120326-0001','INV-120326-0002','INV-120326-0003'
);
DELETE FROM bf_payments WHERE payment_ref IN (
  'PAY-100824-0001','PAY-101224-0001','PAY-200225-0001',
  'PAY-160725-0001','PAY-240426-0001'
);
-- Wipe all transactions — rebuild entirely from real BFS billing data below
DELETE FROM bf_transactions;
DELETE FROM bf_statements WHERE ref_id IN (
  'STMT-060326-0001','STMT-130326-0001'
);

-- ── 2. CALLOUTS — Historical: Nov 2024 to Feb 2026 ───────────
-- One callout per AECI PO. Tech = sibu (Sibulelo Mtolo, site inspector).
-- The 7 Feb–Mar 2026 callouts already in testdata (correct POs) are kept.
INSERT IGNORE INTO bf_callouts
  (ref_id, client_id, client_name, client_email, service, location, tech,
   assigned_to, assigned_to_user_id, priority, status, approval_status,
   callout_date, callout_time, notes, logged_by_user_id, po,
   invoice_generated, created_at, updated_at)
VALUES
-- Nov 2024
('CO-021124-0001',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Backup power batteries replacement','AECI Chempark, Modderfontein, Gauteng',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2024-11-02','07:30:00','Supply and replace backup UPS batteries across site. PO CP0833.',
 @uid_jshange,'CP0833',1,'2024-11-02 07:00:00','2024-11-29 15:00:00'),
-- Dec 2024
('CO-091224-0001',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Access control management','AECI Chempark, Modderfontein, Gauteng',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2024-12-09','08:00:00','Access control system management and database administration. PO CP0893.',
 @uid_jshange,'CP0893',1,'2024-12-09 07:00:00','2025-01-30 15:00:00'),
('CO-181224-0001',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Security fence analysis','AECI Chempark — perimeter fence full run',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2024-12-18','07:30:00','Security fence integrity analysis and fault report. PO CP0903.',
 @uid_jshange,'CP0903',1,'2024-12-18 07:00:00','2025-01-30 15:00:00'),
-- Jan 2025
('CO-060125-0001',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Electrical Fence Repairs','AECI Chempark — perimeter fence',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2025-01-06','07:30:00','Electrical fence fault diagnosis and repair. PO CP0934.',
 @uid_jshange,'CP0934',1,'2025-01-06 07:00:00','2025-01-06 17:00:00'),
-- Feb 2025
('CO-180225-0001',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Access Control Repairs','AECI Chempark — access control points',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2025-02-18','08:00:00','Access control fault repair. PO CP0975.',
 @uid_jshange,'CP0975',1,'2025-02-18 07:00:00','2025-02-18 17:00:00'),
-- Mar 2025
('CO-260325-0001',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Energizer Replacement','AECI Chempark — perimeter fence',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2025-03-26','07:30:00','Electric fence energiser supply and replacement. PO CP1028.',
 @uid_jshange,'CP1028',1,'2025-03-26 07:00:00','2025-04-25 15:00:00'),
('CO-260325-0002',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Security Monitor Repairs','AECI Chempark — control room',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2025-03-26','09:00:00','Security monitor fault diagnosis and repair. PO CP1038.',
 @uid_jshange,'CP1038',1,'2025-03-26 09:00:00','2025-04-25 15:00:00'),
('CO-310325-0001',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Access Control Licensing','AECI Chempark — all access points',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2025-03-31','08:00:00','Access control software licensing and annual support renewal. PO CP1026.',
 @uid_jshange,'CP1026',1,'2025-03-31 07:00:00','2025-04-25 15:00:00'),
-- Apr 2025
('CO-220425-0001',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Boomgate Access Control Repairs','AECI Chempark — main gate boomgate',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2025-04-22','08:00:00','Boomgate motor and access control interface repair. PO CP1082.',
 @uid_jshange,'CP1082',1,'2025-04-22 07:00:00','2025-05-29 15:00:00'),
('CO-220425-0002',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Backup Battery Servicing','AECI Chempark — all UPS/battery points',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2025-04-22','10:00:00','Backup battery health check and servicing. PO CP1063.',
 @uid_jshange,'CP1063',1,'2025-04-22 10:00:00','2025-05-29 15:00:00'),
-- May/Jun 2025 — five jobs invoiced 29 May (CP1112, CP1126, CP1196, CP1211, CP1205)
('CO-290525-0001',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'New Door Access Control — Reader supply & installation','AECI Chempark — new door access points',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2025-05-29','07:30:00','Supply and install new door access control readers (face recognition). PO CP1112.',
 @uid_jshange,'CP1112',1,'2025-05-29 07:00:00','2025-07-31 15:00:00'),
('CO-290525-0002',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'New Door Access Control — Additional requirements','AECI Chempark — new door access points',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2025-05-29','09:00:00','Additional requirements for new door access control installation. PO CP1126.',
 @uid_jshange,'CP1126',1,'2025-05-29 09:00:00','2025-07-31 15:00:00'),
('CO-290525-0003',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Access Control Repairs','AECI Chempark — access control points',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2025-05-29','11:00:00','Access control fault repairs. PO CP1196.',
 @uid_jshange,'CP1196',1,'2025-05-29 11:00:00','2025-08-28 15:00:00'),
('CO-290525-0004',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Maglock relocation','AECI Chempark — access door',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2025-05-29','13:00:00','Magnetic lock removal and relocation to new door position. PO CP1211.',
 @uid_jshange,'CP1211',1,'2025-05-29 13:00:00','2025-08-28 15:00:00'),
('CO-290525-0005',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Security Camera repairs','AECI Chempark — CCTV',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2025-05-29','15:00:00','Security camera fault diagnosis and repairs. PO CP1205.',
 @uid_jshange,'CP1205',1,'2025-05-29 15:00:00','2025-08-28 15:00:00'),
-- Aug 2025
('CO-180825-0001',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'July 2025 Call Outs — access control & camera faults','AECI Chempark — multiple locations',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2025-08-18','08:00:00','Consolidated callout batch covering July 2025 AC and camera faults. PO CP1247.',
 @uid_jshange,'CP1247',1,'2025-08-18 07:00:00','2025-09-30 15:00:00'),
-- Sep 2025
('CO-090925-0001',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Access Control Repairs','AECI Chempark — access control points',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2025-09-09','08:00:00','Access control reader fault repair. PO CP1271.',
 @uid_jshange,'CP1271',1,'2025-09-09 07:00:00','2025-10-24 15:00:00'),
-- Oct 2025
('CO-011025-0001',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Electric Fence Repairs','AECI Chempark — perimeter fence',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2025-10-01','07:30:00','Electric fence fault diagnosis and repair. PO CP1294.',
 @uid_jshange,'CP1294',1,'2025-10-01 07:00:00','2025-12-05 15:00:00'),
('CO-171025-0001',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Energiser repairs','AECI Chempark — perimeter fence energiser',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2025-10-17','08:00:00','Electric fence energiser fault diagnosis and repair. PO CP0974.',
 @uid_jshange,'CP0974',1,'2025-10-17 07:00:00','2025-12-05 15:00:00'),
('CO-311025-0001',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Access Reader Installation','AECI Chempark — multiple access points',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2025-10-31','07:30:00','Supply and install new access control readers at multiple points. PO CP1301.',
 @uid_jshange,'CP1301',1,'2025-10-31 07:00:00','2025-12-05 15:00:00'),
-- Dec 2025
('CO-081225-0001',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Reception face reader repairs','AECI Chempark — reception',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2025-12-08','08:00:00','ProFace reader at reception: offline fault diagnosis and repair. PO CP1401.',
 @uid_jshange,'CP1401',1,'2025-12-08 07:00:00','2026-01-30 15:00:00'),
('CO-081225-0002',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Building 2 face reader repairs','AECI Chempark — Building 2',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2025-12-08','10:00:00','ProFace reader at Building 2: offline fault diagnosis and repair. PO CP1388.',
 @uid_jshange,'CP1388',1,'2025-12-08 10:00:00','2026-01-30 15:00:00'),
-- Jan 2026
('CO-060126-0001',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Switch replacement','AECI Chempark — network room',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2026-01-06','08:00:00','HP network switch supply and replacement. PO CP1407.',
 @uid_jshange,'CP1407',1,'2026-01-06 07:00:00','2026-02-26 15:00:00'),
('CO-210126-0001',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Tree damage electric fence repairs','AECI Chempark — perimeter fence (west boundary)',
 'Sibu Mtolo','sibu',@uid_sibu,'Urgent','Invoiced','approved',
 '2026-01-21','07:00:00','Storm/tree fall damage to perimeter electric fence. Wire replacement, insulator repair, recommission. PO CP1447.',
 @uid_jshange,'CP1447',1,'2026-01-21 07:00:00','2026-03-27 15:00:00'),
('CO-220126-0001',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Electric Fence Repairs','AECI Chempark — perimeter fence',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2026-01-22','07:30:00','Electric fence fault repair. PO CP1446.',
 @uid_jshange,'CP1446',1,'2026-01-22 07:00:00','2026-03-27 15:00:00'),
('CO-260126-0001',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Weigh bridge Camera Switch replacement','AECI Chempark — weigh bridge',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2026-01-26','08:00:00','Network switch replacement at weigh bridge camera feed. PO CP1459.',
 @uid_jshange,'CP1459',1,'2026-01-26 07:00:00','2026-02-26 15:00:00'),
('CO-300126-0001',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Variance: HP Switch installation','AECI Chempark — server room',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2026-01-30','08:00:00','HP switch variance supply and installation. PO CP1455.',
 @uid_jshange,'CP1455',1,'2026-01-30 07:00:00','2026-02-26 15:00:00'),
-- Feb 2026
('CO-090226-0001',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Fence line repairs','AECI Chempark — perimeter fence',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2026-02-09','07:30:00','Perimeter fence line damage repair. PO CP1482.',
 @uid_jshange,'CP1482',1,'2026-02-09 07:00:00','2026-03-20 15:00:00'),
('CO-090226-0002',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Camera Feed repair','AECI Chempark — CCTV',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2026-02-09','10:00:00','Camera feed fault diagnosis and repair. PO CP1483.',
 @uid_jshange,'CP1483',1,'2026-02-09 10:00:00','2026-03-20 15:00:00');

-- ── 3. CALLOUTS — New Mar–Apr 2026 (not in testdata) ─────────
INSERT IGNORE INTO bf_callouts
  (ref_id, client_id, client_name, client_email, service, location, tech,
   assigned_to, assigned_to_user_id, priority, status, approval_status,
   callout_date, callout_time, notes, logged_by_user_id, po,
   invoice_generated, created_at, updated_at)
VALUES
('CO-030326-0001',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Boomgate Repair','AECI Chempark — main gate boomgate',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2026-03-03','07:30:00','Boomgate hydraulic and control system fault repair. PO CP1532.',
 @uid_jshange,'CP1532',1,'2026-03-03 07:00:00','2026-03-03 17:00:00'),
('CO-030326-0002',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Face reader Repair','AECI Chempark — access point',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2026-03-03','09:00:00','ProFace XP reader offline fault diagnosis and repair. PO CP1485.',
 @uid_jshange,'CP1485',1,'2026-03-03 09:00:00','2026-03-03 17:00:00'),
('CO-030326-0003',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 '48-port HP switch supply and installation','AECI Chempark — server room / network',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2026-03-03','11:00:00','48-port HP network switch supply and install. PO CP1491.',
 @uid_jshange,'CP1491',1,'2026-03-03 11:00:00','2026-03-03 17:00:00'),
('CO-010426-0001',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Security Fence Repairs','AECI Chempark — perimeter security fence',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2026-04-01','07:30:00','Perimeter security fence fault repair. PO CP1592.',
 @uid_jshange,'CP1592',1,'2026-04-01 07:00:00','2026-04-01 17:00:00'),
('CO-200426-0001',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
 'Emergency button installation','AECI Chempark — security booth',
 'Sibu Mtolo','sibu',@uid_sibu,'Normal','Invoiced','approved',
 '2026-04-20','08:00:00','Supply and install emergency panic button at security booth. PO CP1590.',
 @uid_jshange,'CP1590',1,'2026-04-20 07:00:00','2026-04-20 17:00:00');

-- ── 4. INVOICES — 41 real invoices from BFS billing statements ─
-- Paid invoices: status='Paid', paid_date set.
-- Outstanding invoices: status='Sent', paid_date=NULL.
-- Invoice refs use the actual Astute Insights AI naming convention.
INSERT INTO bf_invoices
  (ref_id, client_id, client_name, client_email, amount, due_date, status,
   quote_ref, callout_ref, po, invoice_date, paid_date, sent_by_user_id, created_at, updated_at)
VALUES
-- Nov 2024
('INV-AI20241014',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
  81891.50,'2024-11-16','Paid','','CO-021124-0001','CP0833',
  '2024-11-02','2024-11-29',@uid_jshange,'2024-11-02 10:00:00','2024-11-29 15:00:00'),
-- Dec 2024
('INV-AI20241015',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
   7935.00,'2024-12-23','Paid','','CO-091224-0001','CP0893',
  '2024-12-09','2025-01-30',@uid_jshange,'2024-12-09 10:00:00','2025-01-30 15:00:00'),
('INV-AI20241218',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
   6709.10,'2025-01-01','Paid','','CO-181224-0001','CP0903',
  '2024-12-18','2025-01-30',@uid_jshange,'2024-12-18 10:00:00','2025-01-30 15:00:00'),
-- Jan 2025
('INV-AI20250106',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
  18666.57,'2025-01-20','Paid','','CO-060125-0001','CP0934',
  '2025-01-06','2025-01-06',@uid_jshange,'2025-01-06 10:00:00','2025-01-06 17:00:00'),
-- Feb 2025 (source ref AI20250106/CP0975 — disambiguated to date-based ref)
('INV-AI20250218',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
  12017.50,'2025-03-04','Paid','','CO-180225-0001','CP0975',
  '2025-02-18','2025-02-18',@uid_jshange,'2025-02-18 10:00:00','2025-02-18 17:00:00'),
-- Mar 2025
('INV-AI20250326',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
  22627.00,'2025-04-09','Paid','','CO-260325-0001','CP1028',
  '2025-03-26','2025-04-25',@uid_jshange,'2025-03-26 10:00:00','2025-04-25 15:00:00'),
('INV-AI20250327',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
  19751.25,'2025-04-09','Paid','','CO-260325-0002','CP1038',
  '2025-03-26','2025-04-25',@uid_jshange,'2025-03-26 10:00:00','2025-04-25 15:00:00'),
('INV-AI20250331',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
  32775.00,'2025-04-14','Paid','','CO-310325-0001','CP1026',
  '2025-03-31','2025-04-25',@uid_jshange,'2025-03-31 10:00:00','2025-04-25 15:00:00'),
-- Apr 2025
('INV-AI250422',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
   3910.00,'2025-05-06','Paid','','CO-220425-0001','CP1082',
  '2025-04-22','2025-05-29',@uid_jshange,'2025-04-22 10:00:00','2025-05-29 15:00:00'),
('INV-AI20250422',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
   5002.50,'2025-05-06','Paid','','CO-220425-0002','CP1063',
  '2025-04-22','2025-05-29',@uid_jshange,'2025-04-22 10:00:00','2025-05-29 15:00:00'),
-- May/Jun 2025 — batch invoiced 29 May, paid across Jul–Aug
('INV-AI20250611',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
  36334.25,'2025-06-12','Paid','','CO-290525-0001','CP1112',
  '2025-05-29','2025-07-31',@uid_jshange,'2025-05-29 10:00:00','2025-07-31 15:00:00'),
('INV-AI250611',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
  14165.82,'2025-06-12','Paid','','CO-290525-0002','CP1126',
  '2025-05-29','2025-07-31',@uid_jshange,'2025-05-29 10:00:00','2025-07-31 15:00:00'),
('INV-AI20250711',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
   3277.50,'2025-06-12','Paid','','CO-290525-0003','CP1196',
  '2025-05-29','2025-08-28',@uid_jshange,'2025-05-29 10:00:00','2025-08-28 15:00:00'),
('INV-AI250718',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
   2070.00,'2025-06-12','Paid','','CO-290525-0004','CP1211',
  '2025-05-29','2025-08-28',@uid_jshange,'2025-05-29 10:00:00','2025-08-28 15:00:00'),
('INV-AI20250718',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
   3277.50,'2025-06-12','Paid','','CO-290525-0005','CP1205',
  '2025-05-29','2025-08-28',@uid_jshange,'2025-05-29 10:00:00','2025-08-28 15:00:00'),
-- Aug 2025
('INV-AI20250818',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
   4542.50,'2025-09-01','Paid','','CO-180825-0001','CP1247',
  '2025-08-18','2025-09-30',@uid_jshange,'2025-08-18 10:00:00','2025-09-30 15:00:00'),
-- Sep 2025
('INV-AI20250909',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
   1265.00,'2025-09-23','Paid','','CO-090925-0001','CP1271',
  '2025-09-09','2025-10-24',@uid_jshange,'2025-09-09 10:00:00','2025-10-24 15:00:00'),
-- Oct 2025 (three outstanding in Nov stmt — paid Dec 2025 batch)
('INV-AI20251001',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
   8740.00,'2025-10-15','Paid','','CO-011025-0001','CP1294',
  '2025-10-01','2025-12-05',@uid_jshange,'2025-10-01 10:00:00','2025-12-05 15:00:00'),
('INV-AI20251017',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
  18666.57,'2025-10-31','Paid','','CO-171025-0001','CP0974',
  '2025-10-17','2025-12-05',@uid_jshange,'2025-10-17 10:00:00','2025-12-05 15:00:00'),
('INV-AI20251031',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
  33919.35,'2025-11-14','Paid','','CO-311025-0001','CP1301',
  '2025-10-31','2025-12-05',@uid_jshange,'2025-10-31 10:00:00','2025-12-05 15:00:00'),
-- Dec 2025
('INV-AI081225',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
   1265.00,'2025-12-22','Paid','','CO-081225-0001','CP1401',
  '2025-12-08','2026-01-30',@uid_jshange,'2025-12-08 10:00:00','2026-01-30 15:00:00'),
('INV-AI20251208',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
   2012.50,'2025-12-22','Paid','','CO-081225-0002','CP1388',
  '2025-12-08','2026-01-30',@uid_jshange,'2025-12-08 10:00:00','2026-01-30 15:00:00'),
-- Jan–Feb 2026 batch (invoiced 2026-02-02, varied payment dates)
('INV-AI06012026',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
  10666.83,'2026-02-16','Paid','','CO-060126-0001','CP1407',
  '2026-02-02','2026-02-26',@uid_jshange,'2026-02-02 10:00:00','2026-02-26 15:00:00'),
('INV-AI20260121',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
  33752.50,'2026-02-16','Paid','','CO-210126-0001','CP1447',
  '2026-02-02','2026-03-27',@uid_jshange,'2026-02-02 10:00:00','2026-03-27 15:00:00'),
('INV-AI20260122',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
   1265.00,'2026-02-16','Paid','','CO-220126-0001','CP1446',
  '2026-02-02','2026-03-27',@uid_jshange,'2026-02-02 10:00:00','2026-03-27 15:00:00'),
('INV-AI20260126',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
   8476.14,'2026-02-16','Paid','','CO-260126-0001','CP1459',
  '2026-02-02','2026-02-26',@uid_jshange,'2026-02-02 10:00:00','2026-02-26 15:00:00'),
('INV-AI20260130',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
   9050.50,'2026-02-16','Paid','','CO-300126-0001','CP1455',
  '2026-02-02','2026-02-26',@uid_jshange,'2026-02-02 10:00:00','2026-02-26 15:00:00'),
-- Feb 2026
('INV-AI090226',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
   2300.00,'2026-02-23','Paid','','CO-090226-0001','CP1482',
  '2026-02-09','2026-03-20',@uid_jshange,'2026-02-09 10:00:00','2026-03-20 15:00:00'),
('INV-AI20260209',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
   3700.00,'2026-02-23','Paid','','CO-090226-0002','CP1483',
  '2026-02-09','2026-03-20',@uid_jshange,'2026-02-09 10:00:00','2026-03-20 15:00:00'),
-- Mar 2026 — outstanding per Apr 20 2026 statement
-- Existing testdata callout refs kept; amounts corrected to match real billing
('INV-AI090326',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
  16509.80,'2026-03-17','Sent','','CO-040226-0001','CP1492',
  '2026-03-03',NULL,@uid_jshange,'2026-03-03 10:00:00','2026-03-03 10:00:00'),
('INV-AI260039',@aeci_id,'AECI Chempark','simphiwe.ndevu@aeciworld.com',
   8650.00,'2026-03-17','Sent','','CO-120326-0001','CP1535',
  '2026-03-03',NULL,@uid_jshange,'2026-03-03 10:00:00','2026-03-03 10:00:00'),
('INV-AI260309',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
  20525.00,'2026-03-17','Sent','','CO-030326-0003','CP1491',
  '2026-03-03',NULL,@uid_jshange,'2026-03-03 10:00:00','2026-03-03 10:00:00'),
('INV-AI263009',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
   1750.00,'2026-03-17','Sent','','CO-180326-0001','CP1536',
  '2026-03-03',NULL,@uid_jshange,'2026-03-03 10:00:00','2026-03-03 10:00:00'),
('INV-AI02090326',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
  36790.35,'2026-03-17','Sent','','CO-230226-0001','CP1527',
  '2026-03-03',NULL,@uid_jshange,'2026-03-03 10:00:00','2026-03-03 10:00:00'),
('INV-AI03032026',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
  10100.00,'2026-03-17','Sent','','CO-030326-0001','CP1532',
  '2026-03-03',NULL,@uid_jshange,'2026-03-03 10:00:00','2026-03-03 10:00:00'),
('INV-AI220260302',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
   9550.00,'2026-03-17','Sent','','CO-030326-0002','CP1485',
  '2026-03-03',NULL,@uid_jshange,'2026-03-03 10:00:00','2026-03-03 10:00:00'),
('INV-AI120326',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
  10600.00,'2026-03-26','Sent','','CO-100226-0001','CP1550',
  '2026-03-12',NULL,@uid_jshange,'2026-03-12 10:00:00','2026-03-12 10:00:00'),
('INV-AI12032026',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
  23790.00,'2026-03-26','Sent','','CO-040326-0001','CP1551',
  '2026-03-12',NULL,@uid_jshange,'2026-03-12 10:00:00','2026-03-12 10:00:00'),
('INV-AI23032026',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
  28163.16,'2026-04-06','Sent','','CO-050226-0001','CP1469',
  '2026-03-23',NULL,@uid_jshange,'2026-03-23 10:00:00','2026-03-23 10:00:00'),
-- Apr 2026
('INV-AI01042026',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
  22402.00,'2026-04-15','Sent','','CO-010426-0001','CP1592',
  '2026-04-01',NULL,@uid_jshange,'2026-04-01 10:00:00','2026-04-01 10:00:00'),
('INV-AI20042026',@aeci_id,'AECI Chempark','yolanda.herbst@aeciworld.com',
   4025.00,'2026-05-04','Sent','','CO-200426-0001','CP1590',
  '2026-04-20',NULL,@uid_jshange,'2026-04-20 10:00:00','2026-04-20 10:00:00')
ON DUPLICATE KEY UPDATE
  amount          = VALUES(amount),
  status          = VALUES(status),
  paid_date       = VALUES(paid_date),
  due_date        = VALUES(due_date),
  callout_ref     = VALUES(callout_ref),
  po              = VALUES(po),
  sent_by_user_id = VALUES(sent_by_user_id),
  updated_at      = VALUES(updated_at);

-- Backfill callout_id FK — runs for all rows (new inserts AND corrected existing records)
UPDATE bf_invoices i
  JOIN bf_callouts c ON c.ref_id = i.callout_ref
  SET i.callout_id = c.id
  WHERE i.callout_ref != '';

-- ── 5. PAYMENTS ───────────────────────────────────────────────
DELETE FROM bf_payments WHERE payment_ref IN (
  'PAY-291124-0001','PAY-300125-0001','PAY-060125-0001','PAY-180225-0001',
  'PAY-250425-0001','PAY-290525-0001','PAY-310725-0001','PAY-280825-0001',
  'PAY-300925-0001','PAY-241025-0001','PAY-051225-0001',
  'PAY-300126-0001','PAY-260226-0001','PAY-200326-0001','PAY-270326-0001'
);
INSERT INTO bf_payments
  (payment_ref, invoice_ref, invoice_id, client_id, client_name, amount,
   payment_date, notes, logged_by_user_id, created_at)
VALUES
-- 2024-11-29 (CP0833)
('PAY-291124-0001','INV-AI20241014',(SELECT id FROM bf_invoices WHERE ref_id='INV-AI20241014' LIMIT 1),@aeci_id,'AECI Chempark',81891.50,'2024-11-29','EFT — AECI Chempark. CP0833.',@uid_jshange,'2024-11-29 15:00:00'),
-- 2025-01-30 (CP0893 + CP0903)
('PAY-300125-0001','INV-AI20241015',(SELECT id FROM bf_invoices WHERE ref_id='INV-AI20241015' LIMIT 1),@aeci_id,'AECI Chempark', 7935.00,'2025-01-30','EFT — AECI Chempark. CP0893.',@uid_jshange,'2025-01-30 15:00:00'),
('PAY-300125-0001','INV-AI20241218',(SELECT id FROM bf_invoices WHERE ref_id='INV-AI20241218' LIMIT 1),@aeci_id,'AECI Chempark', 6709.10,'2025-01-30','EFT — AECI Chempark. CP0903.',@uid_jshange,'2025-01-30 15:00:00'),
-- 2025-01-06 (CP0934 same-day)
('PAY-060125-0001','INV-AI20250106',(SELECT id FROM bf_invoices WHERE ref_id='INV-AI20250106' LIMIT 1),@aeci_id,'AECI Chempark',18666.57,'2025-01-06','EFT — AECI Chempark. CP0934.',@uid_jshange,'2025-01-06 17:00:00'),
-- 2025-02-18 (CP0975)
('PAY-180225-0001','INV-AI20250218',(SELECT id FROM bf_invoices WHERE ref_id='INV-AI20250218' LIMIT 1),@aeci_id,'AECI Chempark',12017.50,'2025-02-18','EFT — AECI Chempark. CP0975.',@uid_jshange,'2025-02-18 17:00:00'),
-- 2025-04-25 (CP1028 + CP1038 + CP1026)
('PAY-250425-0001','INV-AI20250326',(SELECT id FROM bf_invoices WHERE ref_id='INV-AI20250326' LIMIT 1),@aeci_id,'AECI Chempark',22627.00,'2025-04-25','EFT — AECI Chempark. CP1028.',@uid_jshange,'2025-04-25 15:00:00'),
('PAY-250425-0001','INV-AI20250327',(SELECT id FROM bf_invoices WHERE ref_id='INV-AI20250327' LIMIT 1),@aeci_id,'AECI Chempark',19751.25,'2025-04-25','EFT — AECI Chempark. CP1038.',@uid_jshange,'2025-04-25 15:00:00'),
('PAY-250425-0001','INV-AI20250331',(SELECT id FROM bf_invoices WHERE ref_id='INV-AI20250331' LIMIT 1),@aeci_id,'AECI Chempark',32775.00,'2025-04-25','EFT — AECI Chempark. CP1026.',@uid_jshange,'2025-04-25 15:00:00'),
-- 2025-05-29 (CP1082 + CP1063)
('PAY-290525-0001','INV-AI250422',  (SELECT id FROM bf_invoices WHERE ref_id='INV-AI250422'   LIMIT 1),@aeci_id,'AECI Chempark', 3910.00,'2025-05-29','EFT — AECI Chempark. CP1082.',@uid_jshange,'2025-05-29 15:00:00'),
('PAY-290525-0001','INV-AI20250422',(SELECT id FROM bf_invoices WHERE ref_id='INV-AI20250422' LIMIT 1),@aeci_id,'AECI Chempark', 5002.50,'2025-05-29','EFT — AECI Chempark. CP1063.',@uid_jshange,'2025-05-29 15:00:00'),
-- 2025-07-31 (CP1112 + CP1126)
('PAY-310725-0001','INV-AI20250611',(SELECT id FROM bf_invoices WHERE ref_id='INV-AI20250611' LIMIT 1),@aeci_id,'AECI Chempark',36334.25,'2025-07-31','EFT — AECI Chempark. CP1112.',@uid_jshange,'2025-07-31 15:00:00'),
('PAY-310725-0001','INV-AI250611',  (SELECT id FROM bf_invoices WHERE ref_id='INV-AI250611'   LIMIT 1),@aeci_id,'AECI Chempark',14165.82,'2025-07-31','EFT — AECI Chempark. CP1126.',@uid_jshange,'2025-07-31 15:00:00'),
-- 2025-08-28 (CP1196 + CP1211 + CP1205)
('PAY-280825-0001','INV-AI20250711',(SELECT id FROM bf_invoices WHERE ref_id='INV-AI20250711' LIMIT 1),@aeci_id,'AECI Chempark', 3277.50,'2025-08-28','EFT — AECI Chempark. CP1196.',@uid_jshange,'2025-08-28 15:00:00'),
('PAY-280825-0001','INV-AI250718',  (SELECT id FROM bf_invoices WHERE ref_id='INV-AI250718'   LIMIT 1),@aeci_id,'AECI Chempark', 2070.00,'2025-08-28','EFT — AECI Chempark. CP1211.',@uid_jshange,'2025-08-28 15:00:00'),
('PAY-280825-0001','INV-AI20250718',(SELECT id FROM bf_invoices WHERE ref_id='INV-AI20250718' LIMIT 1),@aeci_id,'AECI Chempark', 3277.50,'2025-08-28','EFT — AECI Chempark. CP1205.',@uid_jshange,'2025-08-28 15:00:00'),
-- 2025-09-30 (CP1247)
('PAY-300925-0001','INV-AI20250818',(SELECT id FROM bf_invoices WHERE ref_id='INV-AI20250818' LIMIT 1),@aeci_id,'AECI Chempark', 4542.50,'2025-09-30','EFT — AECI Chempark. CP1247.',@uid_jshange,'2025-09-30 15:00:00'),
-- 2025-10-24 (CP1271)
('PAY-241025-0001','INV-AI20250909',(SELECT id FROM bf_invoices WHERE ref_id='INV-AI20250909' LIMIT 1),@aeci_id,'AECI Chempark', 1265.00,'2025-10-24','EFT — AECI Chempark. CP1271.',@uid_jshange,'2025-10-24 15:00:00'),
-- 2025-12-05 (CP1294 + CP0974 + CP1301 — Dec batch clearing Oct/Nov outstanding)
('PAY-051225-0001','INV-AI20251001',(SELECT id FROM bf_invoices WHERE ref_id='INV-AI20251001' LIMIT 1),@aeci_id,'AECI Chempark', 8740.00,'2025-12-05','EFT — AECI Chempark. Dec batch. CP1294.',@uid_jshange,'2025-12-05 15:00:00'),
('PAY-051225-0001','INV-AI20251017',(SELECT id FROM bf_invoices WHERE ref_id='INV-AI20251017' LIMIT 1),@aeci_id,'AECI Chempark',18666.57,'2025-12-05','EFT — AECI Chempark. Dec batch. CP0974.',@uid_jshange,'2025-12-05 15:00:00'),
('PAY-051225-0001','INV-AI20251031',(SELECT id FROM bf_invoices WHERE ref_id='INV-AI20251031' LIMIT 1),@aeci_id,'AECI Chempark',33919.35,'2025-12-05','EFT — AECI Chempark. Dec batch. CP1301.',@uid_jshange,'2025-12-05 15:00:00'),
-- 2026-01-30 (CP1401 + CP1388)
('PAY-300126-0001','INV-AI081225',  (SELECT id FROM bf_invoices WHERE ref_id='INV-AI081225'   LIMIT 1),@aeci_id,'AECI Chempark', 1265.00,'2026-01-30','EFT — AECI Chempark. CP1401.',@uid_jshange,'2026-01-30 15:00:00'),
('PAY-300126-0001','INV-AI20251208',(SELECT id FROM bf_invoices WHERE ref_id='INV-AI20251208' LIMIT 1),@aeci_id,'AECI Chempark', 2012.50,'2026-01-30','EFT — AECI Chempark. CP1388.',@uid_jshange,'2026-01-30 15:00:00'),
-- 2026-02-26 (CP1455 + CP1459 + CP1407)
('PAY-260226-0001','INV-AI20260130',(SELECT id FROM bf_invoices WHERE ref_id='INV-AI20260130' LIMIT 1),@aeci_id,'AECI Chempark', 9050.50,'2026-02-26','EFT — AECI Chempark. CP1455.',@uid_jshange,'2026-02-26 15:00:00'),
('PAY-260226-0001','INV-AI20260126',(SELECT id FROM bf_invoices WHERE ref_id='INV-AI20260126' LIMIT 1),@aeci_id,'AECI Chempark', 8476.14,'2026-02-26','EFT — AECI Chempark. CP1459.',@uid_jshange,'2026-02-26 15:00:00'),
('PAY-260226-0001','INV-AI06012026',(SELECT id FROM bf_invoices WHERE ref_id='INV-AI06012026' LIMIT 1),@aeci_id,'AECI Chempark',10666.83,'2026-02-26','EFT — AECI Chempark. CP1407.',@uid_jshange,'2026-02-26 15:00:00'),
-- 2026-03-20 (CP1482 + CP1483)
('PAY-200326-0001','INV-AI090226',  (SELECT id FROM bf_invoices WHERE ref_id='INV-AI090226'   LIMIT 1),@aeci_id,'AECI Chempark', 2300.00,'2026-03-20','EFT — AECI Chempark. CP1482.',@uid_jshange,'2026-03-20 15:00:00'),
('PAY-200326-0001','INV-AI20260209',(SELECT id FROM bf_invoices WHERE ref_id='INV-AI20260209' LIMIT 1),@aeci_id,'AECI Chempark', 3700.00,'2026-03-20','EFT — AECI Chempark. CP1483.',@uid_jshange,'2026-03-20 15:00:00'),
-- 2026-03-27 (CP1447 + CP1446)
('PAY-270326-0001','INV-AI20260121',(SELECT id FROM bf_invoices WHERE ref_id='INV-AI20260121' LIMIT 1),@aeci_id,'AECI Chempark',33752.50,'2026-03-27','EFT — AECI Chempark. CP1447.',@uid_jshange,'2026-03-27 15:00:00'),
('PAY-270326-0001','INV-AI20260122',(SELECT id FROM bf_invoices WHERE ref_id='INV-AI20260122' LIMIT 1),@aeci_id,'AECI Chempark', 1265.00,'2026-03-27','EFT — AECI Chempark. CP1446.',@uid_jshange,'2026-03-27 15:00:00');

-- ── 6. TRANSACTIONS ───────────────────────────────────────────
-- Credits  = income (AECI paying Astute Insights)
-- Debits   = vendor expenses (Siyasiza Group callout services)
-- Source: BFS account statements + Siyasiza_Statement_2[1].xlsx

INSERT INTO bf_transactions
  (trans_date, description, category, reference, credit, debit, created_at)
VALUES
-- ── INCOME: AECI Chempark payments (29 credit entries) ───────
('2024-11-29','Payment received — AECI Chempark (CP0833)','Invoice Payment','INV-AI20241014', 81891.50,0.00,'2024-11-29 15:00:00'),
('2025-01-30','Payment received — AECI Chempark (CP0893)','Invoice Payment','INV-AI20241015',  7935.00,0.00,'2025-01-30 15:00:00'),
('2025-01-30','Payment received — AECI Chempark (CP0903)','Invoice Payment','INV-AI20241218',  6709.10,0.00,'2025-01-30 15:00:00'),
('2025-01-06','Payment received — AECI Chempark (CP0934)','Invoice Payment','INV-AI20250106', 18666.57,0.00,'2025-01-06 17:00:00'),
('2025-02-18','Payment received — AECI Chempark (CP0975)','Invoice Payment','INV-AI20250218', 12017.50,0.00,'2025-02-18 17:00:00'),
('2025-04-25','Payment received — AECI Chempark (CP1028)','Invoice Payment','INV-AI20250326', 22627.00,0.00,'2025-04-25 15:00:00'),
('2025-04-25','Payment received — AECI Chempark (CP1038)','Invoice Payment','INV-AI20250327', 19751.25,0.00,'2025-04-25 15:00:00'),
('2025-04-25','Payment received — AECI Chempark (CP1026)','Invoice Payment','INV-AI20250331', 32775.00,0.00,'2025-04-25 15:00:00'),
('2025-05-29','Payment received — AECI Chempark (CP1082)','Invoice Payment','INV-AI250422',   3910.00,0.00,'2025-05-29 15:00:00'),
('2025-05-29','Payment received — AECI Chempark (CP1063)','Invoice Payment','INV-AI20250422', 5002.50,0.00,'2025-05-29 15:00:00'),
('2025-07-31','Payment received — AECI Chempark (CP1112)','Invoice Payment','INV-AI20250611', 36334.25,0.00,'2025-07-31 15:00:00'),
('2025-07-31','Payment received — AECI Chempark (CP1126)','Invoice Payment','INV-AI250611',  14165.82,0.00,'2025-07-31 15:00:00'),
('2025-08-28','Payment received — AECI Chempark (CP1196)','Invoice Payment','INV-AI20250711', 3277.50,0.00,'2025-08-28 15:00:00'),
('2025-08-28','Payment received — AECI Chempark (CP1211)','Invoice Payment','INV-AI250718',   2070.00,0.00,'2025-08-28 15:00:00'),
('2025-08-28','Payment received — AECI Chempark (CP1205)','Invoice Payment','INV-AI20250718', 3277.50,0.00,'2025-08-28 15:00:00'),
('2025-09-30','Payment received — AECI Chempark (CP1247)','Invoice Payment','INV-AI20250818', 4542.50,0.00,'2025-09-30 15:00:00'),
('2025-10-24','Payment received — AECI Chempark (CP1271)','Invoice Payment','INV-AI20250909', 1265.00,0.00,'2025-10-24 15:00:00'),
('2025-12-05','Payment received — AECI Chempark (CP1294)','Invoice Payment','INV-AI20251001', 8740.00,0.00,'2025-12-05 15:00:00'),
('2025-12-05','Payment received — AECI Chempark (CP0974)','Invoice Payment','INV-AI20251017',18666.57,0.00,'2025-12-05 15:00:00'),
('2025-12-05','Payment received — AECI Chempark (CP1301)','Invoice Payment','INV-AI20251031',33919.35,0.00,'2025-12-05 15:00:00'),
('2026-01-30','Payment received — AECI Chempark (CP1401)','Invoice Payment','INV-AI081225',   1265.00,0.00,'2026-01-30 15:00:00'),
('2026-01-30','Payment received — AECI Chempark (CP1388)','Invoice Payment','INV-AI20251208', 2012.50,0.00,'2026-01-30 15:00:00'),
('2026-02-26','Payment received — AECI Chempark (CP1455)','Invoice Payment','INV-AI20260130', 9050.50,0.00,'2026-02-26 15:00:00'),
('2026-02-26','Payment received — AECI Chempark (CP1459)','Invoice Payment','INV-AI20260126', 8476.14,0.00,'2026-02-26 15:00:00'),
('2026-02-26','Payment received — AECI Chempark (CP1407)','Invoice Payment','INV-AI06012026',10666.83,0.00,'2026-02-26 15:00:00'),
('2026-03-20','Payment received — AECI Chempark (CP1482)','Invoice Payment','INV-AI090226',   2300.00,0.00,'2026-03-20 15:00:00'),
('2026-03-20','Payment received — AECI Chempark (CP1483)','Invoice Payment','INV-AI20260209', 3700.00,0.00,'2026-03-20 15:00:00'),
('2026-03-27','Payment received — AECI Chempark (CP1447)','Invoice Payment','INV-AI20260121',33752.50,0.00,'2026-03-27 15:00:00'),
('2026-03-27','Payment received — AECI Chempark (CP1446)','Invoice Payment','INV-AI20260122', 1265.00,0.00,'2026-03-27 15:00:00'),
-- ── EXPENSES: Siyasiza Group (vendor callout services) ────────
-- Source: Siyasiza_Statement_2[1].xlsx (account to Sep 30 2025)
-- Aug 29 2025: Astute paid R2,550 for Siyasiza callouts A1026/A1027/A1028
-- Nov 30 2025: Astute cleared remaining Sep balance R6,620 (A1029–A1033)
-- Remaining Siyasiza invoices A1034–A1041 (Oct 2025–Apr 2026): amounts TBC from PDF invoices
('2025-08-29','Vendor payment — Siyasiza Group (A1026/A1027/A1028)','Vendor Payment','A1026-A1028',0.00,2550.00,'2025-08-29 12:00:00'),
('2025-11-30','Vendor payment — Siyasiza Group (A1029–A1033)','Vendor Payment','A1029-A1033', 0.00,6620.00,'2025-11-30 12:00:00');

-- ── 7. COST OF SALES — reverse-engineered from 30% margin rule ─
-- Rule: where no supplier invoice exists, AECI invoice = internal cost × 1.30
-- → cost = invoice_amount / 1.30  (rounded to 2 dp)
-- Covers all 41 invoices (29 paid + 12 outstanding) on the invoice date.
-- Siyasiza actual cash costs (§6 above) are additional outflows for those jobs.
-- Megahertz Invoice_1308/1310/1313 amounts still TBC — add when PDFs extracted.
INSERT INTO bf_transactions
  (trans_date, description, category, reference, credit, debit, created_at)
VALUES
-- ── Paid invoices (29) ────────────────────────────────────────
('2024-11-02','Cost of services — AECI Chempark (CP0833)','Cost of Sales','COST-CP0833', 0.00, 62993.46,'2024-11-02 10:00:00'),
('2024-12-09','Cost of services — AECI Chempark (CP0893)','Cost of Sales','COST-CP0893', 0.00,  6103.85,'2024-12-09 10:00:00'),
('2024-12-18','Cost of services — AECI Chempark (CP0903)','Cost of Sales','COST-CP0903', 0.00,  5160.85,'2024-12-18 10:00:00'),
('2025-01-06','Cost of services — AECI Chempark (CP0934)','Cost of Sales','COST-CP0934', 0.00, 14358.90,'2025-01-06 10:00:00'),
('2025-02-18','Cost of services — AECI Chempark (CP0975)','Cost of Sales','COST-CP0975', 0.00,  9244.23,'2025-02-18 10:00:00'),
('2025-03-26','Cost of services — AECI Chempark (CP1028)','Cost of Sales','COST-CP1028', 0.00, 17405.38,'2025-03-26 10:00:00'),
('2025-03-26','Cost of services — AECI Chempark (CP1038)','Cost of Sales','COST-CP1038', 0.00, 15193.27,'2025-03-26 10:00:00'),
('2025-03-31','Cost of services — AECI Chempark (CP1026)','Cost of Sales','COST-CP1026', 0.00, 25211.54,'2025-03-31 10:00:00'),
('2025-04-22','Cost of services — AECI Chempark (CP1082)','Cost of Sales','COST-CP1082', 0.00,  3007.69,'2025-04-22 10:00:00'),
('2025-04-22','Cost of services — AECI Chempark (CP1063)','Cost of Sales','COST-CP1063', 0.00,  3848.08,'2025-04-22 10:00:00'),
('2025-05-29','Cost of services — AECI Chempark (CP1112)','Cost of Sales','COST-CP1112', 0.00, 27949.42,'2025-05-29 10:00:00'),
('2025-05-29','Cost of services — AECI Chempark (CP1126)','Cost of Sales','COST-CP1126', 0.00, 10896.78,'2025-05-29 10:00:00'),
('2025-05-29','Cost of services — AECI Chempark (CP1196)','Cost of Sales','COST-CP1196', 0.00,  2521.15,'2025-05-29 10:00:00'),
('2025-05-29','Cost of services — AECI Chempark (CP1211)','Cost of Sales','COST-CP1211', 0.00,  1592.31,'2025-05-29 10:00:00'),
('2025-05-29','Cost of services — AECI Chempark (CP1205)','Cost of Sales','COST-CP1205', 0.00,  2521.15,'2025-05-29 10:00:00'),
('2025-08-18','Cost of services — AECI Chempark (CP1247)','Cost of Sales','COST-CP1247', 0.00,  3494.23,'2025-08-18 10:00:00'),
('2025-09-09','Cost of services — AECI Chempark (CP1271)','Cost of Sales','COST-CP1271', 0.00,   973.08,'2025-09-09 10:00:00'),
('2025-10-01','Cost of services — AECI Chempark (CP1294)','Cost of Sales','COST-CP1294', 0.00,  6723.08,'2025-10-01 10:00:00'),
('2025-10-17','Cost of services — AECI Chempark (CP0974)','Cost of Sales','COST-CP0974', 0.00, 14358.90,'2025-10-17 10:00:00'),
('2025-10-31','Cost of services — AECI Chempark (CP1301)','Cost of Sales','COST-CP1301', 0.00, 26091.81,'2025-10-31 10:00:00'),
('2025-12-08','Cost of services — AECI Chempark (CP1401)','Cost of Sales','COST-CP1401', 0.00,   973.08,'2025-12-08 10:00:00'),
('2025-12-08','Cost of services — AECI Chempark (CP1388)','Cost of Sales','COST-CP1388', 0.00,  1548.08,'2025-12-08 10:00:00'),
('2026-01-06','Cost of services — AECI Chempark (CP1407)','Cost of Sales','COST-CP1407', 0.00,  8205.25,'2026-01-06 10:00:00'),
('2026-01-21','Cost of services — AECI Chempark (CP1447)','Cost of Sales','COST-CP1447', 0.00, 25963.46,'2026-01-21 10:00:00'),
('2026-01-22','Cost of services — AECI Chempark (CP1446)','Cost of Sales','COST-CP1446', 0.00,   973.08,'2026-01-22 10:00:00'),
('2026-01-26','Cost of services — AECI Chempark (CP1459)','Cost of Sales','COST-CP1459', 0.00,  6520.11,'2026-01-26 10:00:00'),
('2026-01-30','Cost of services — AECI Chempark (CP1455)','Cost of Sales','COST-CP1455', 0.00,  6961.92,'2026-01-30 10:00:00'),
('2026-02-09','Cost of services — AECI Chempark (CP1482)','Cost of Sales','COST-CP1482', 0.00,  1769.23,'2026-02-09 10:00:00'),
('2026-02-09','Cost of services — AECI Chempark (CP1483)','Cost of Sales','COST-CP1483', 0.00,  2846.15,'2026-02-09 10:00:00'),
-- ── Outstanding invoices (12) — cost incurred, revenue not yet received ──
('2026-03-03','Cost of services — AECI Chempark (CP1492)','Cost of Sales','COST-CP1492', 0.00, 12699.85,'2026-03-03 10:00:00'),
('2026-03-03','Cost of services — AECI Chempark (CP1535)','Cost of Sales','COST-CP1535', 0.00,  6653.85,'2026-03-03 10:00:00'),
('2026-03-03','Cost of services — AECI Chempark (CP1491)','Cost of Sales','COST-CP1491', 0.00, 15788.46,'2026-03-03 10:00:00'),
('2026-03-03','Cost of services — AECI Chempark (CP1536)','Cost of Sales','COST-CP1536', 0.00,  1346.15,'2026-03-03 10:00:00'),
('2026-03-03','Cost of services — AECI Chempark (CP1527)','Cost of Sales','COST-CP1527', 0.00, 28300.27,'2026-03-03 10:00:00'),
('2026-03-03','Cost of services — AECI Chempark (CP1532)','Cost of Sales','COST-CP1532', 0.00,  7769.23,'2026-03-03 10:00:00'),
('2026-03-03','Cost of services — AECI Chempark (CP1485)','Cost of Sales','COST-CP1485', 0.00,  7346.15,'2026-03-03 10:00:00'),
('2026-03-12','Cost of services — AECI Chempark (CP1550)','Cost of Sales','COST-CP1550', 0.00,  8153.85,'2026-03-12 10:00:00'),
('2026-03-12','Cost of services — AECI Chempark (CP1551)','Cost of Sales','COST-CP1551', 0.00, 18300.00,'2026-03-12 10:00:00'),
('2026-03-23','Cost of services — AECI Chempark (CP1469)','Cost of Sales','COST-CP1469', 0.00, 21664.74,'2026-03-23 10:00:00'),
('2026-04-01','Cost of services — AECI Chempark (CP1592)','Cost of Sales','COST-CP1592', 0.00, 17232.31,'2026-04-01 10:00:00'),
('2026-04-20','Cost of services — AECI Chempark (CP1590)','Cost of Sales','COST-CP1590', 0.00,  3096.15,'2026-04-20 10:00:00');

SET FOREIGN_KEY_CHECKS = 1;
-- ── Summary ──────────────────────────────────────────────────
-- Callouts inserted:  34 new (historical + Mar–Apr 2026)
--                      7 existing testdata refs kept (CO-040226-0001 etc.)
-- Invoices inserted:  41 (all using real INV-AI naming from BFS statements)
-- Payments inserted:  31 rows across 15 batch payment events
-- Transactions:       29 income credits + 2 Siyasiza vendor debits + 41 cost-of-sales = 72 total
-- Cost of sales:      invoice_amount / 1.30 per job (30% margin rule, no supplier invoice)
-- Outstanding:        12 invoices as of 2026-04-20 = R192,855.31 (costs already recorded)
-- Megahertz invoices: Invoice_1308/1310/1313 (Feb–Mar 2026) — amounts TBC from PDFs
