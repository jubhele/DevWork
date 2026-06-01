-- ============================================================
-- BlackFire / Astute Insights — Safety Digitisation Test Data
-- Test Data PART 1: Users + Safety Files 1 & 2
--   SAF-150125-0001  Jan 2025 — 2025 Base Assessment  26.53% RED
--   SAF-120625-0001  Jun 2025 — Mid-year Review       53.06% ORANGE
-- Seeded user password: BlackFire@2026!
-- Run AFTER blackfire_aeci_seed.sql
-- ============================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── 1. USERS ─────────────────────────────────────────────────
-- Seeded user password: BlackFire@2026!
INSERT IGNORE INTO bf_users
  (username,password_hash,name,email,role,title,active,created_at)
VALUES
('kitso.marupi',
 '$2y$12$hw21i39xr1aS0SDiiLwhfuF.uAJjwX2z/8FwQJxhucctMY8Q5lApe',
 'Kitso Marupi','kitso.marupi@astuteinsights.co.za',
 'safety_officer','SHE Representative & Risk Assessor',1,'2025-01-06 08:00:00'),
('j.mthembu',
 '$2y$12$hw21i39xr1aS0SDiiLwhfuF.uAJjwX2z/8FwQJxhucctMY8Q5lApe',
 'James Mthembu','j.mthembu@astuteinsights.co.za',
 'junior_tech','Junior Technician',1,'2025-01-06 08:00:00'),
('r.khumalo',
 '$2y$12$hw21i39xr1aS0SDiiLwhfuF.uAJjwX2z/8FwQJxhucctMY8Q5lApe',
 'Refilwe Khumalo','r.khumalo@astuteinsights.co.za',
 'senior_tech','Senior Technician',1,'2025-01-06 08:00:00'),
('l.sithole',
 '$2y$12$hw21i39xr1aS0SDiiLwhfuF.uAJjwX2z/8FwQJxhucctMY8Q5lApe',
 'Lelo Sithole','l.sithole@astuteinsights.co.za',
 'admin_clerk','Admin & Finance Clerk',1,'2025-01-06 08:00:00'),
('n.sithole',
 '$2y$12$hw21i39xr1aS0SDiiLwhfuF.uAJjwX2z/8FwQJxhucctMY8Q5lApe',
 'Nomvula Sithole','n.sithole@astuteinsights.co.za',
 'call_logger','Call Logger',1,'2025-01-06 08:00:00'),
-- Zanele Myeza — Safety & Compliance Officer (appointed 29/05/2026)
-- OHS appointments: Safety Officer, Incident Investigator, Risk Assessor, Fall Protection Plan Developer
-- Multi-role: safety_officer + manager (see bf_user_roles block below)
('z.myeza',
 '$2y$12$hw21i39xr1aS0SDiiLwhfuF.uAJjwX2z/8FwQJxhucctMY8Q5lApe',
 'Zanele Myeza','z.myeza@astuteinsights.co.za',
 'safety_officer','Safety & Compliance Officer',1,'2026-05-29 08:00:00');

-- ── 1b. MULTI-ROLE ASSIGNMENTS ────────────────────────────────
-- Run migration_user_roles.sql first to create bf_user_roles table.
-- Single-role users are backfilled by that migration automatically.
-- Entries below add ADDITIONAL roles beyond the primary bf_users.role.

-- Zanele Myeza: primary safety_officer + management oversight
INSERT IGNORE INTO bf_user_roles (user_id, role)
SELECT id, 'safety_officer' FROM bf_users WHERE username = 'z.myeza'
UNION ALL
SELECT id, 'manager'        FROM bf_users WHERE username = 'z.myeza';

-- Sibulelo Mtolo (sibu): primary admin + site safety inspection roles
INSERT IGNORE INTO bf_user_roles (user_id, role)
SELECT id, 'admin'          FROM bf_users WHERE username = 'sibu'
UNION ALL
SELECT id, 'safety_officer' FROM bf_users WHERE username = 'sibu';

-- ── 2. SAFETY FILES ───────────────────────────────────────────
INSERT IGNORE INTO bf_safety_files
  (ref_id,contractor,contractor_rep,appointee162,audit_date,region,audit_team,
   scope_of_work,manpower,supervisors,she_reps,first_aiders,
   auditor_name,sign_off_date,status,score,band,is_active,created_by,created_at)
VALUES
-- 2025 Base Assessment — opening audit for the year
('SAF-150125-0001',
 'Astute Insights (Pty) Ltd','Jubhele Shange','Jubhele Shange',
 '2025-01-15','Johannesburg North — AECI Chempark',
 'K. Marupi; J. van der Berg',
 'Electronic security: perimeter fence monitoring, CCTV, access control, alarm NOC, site patrols.',
 3,1,1,1,'Johann van der Berg','2025-01-15',
 'Approved',26.53,'RED',1,'kitso.marupi','2025-01-15 10:00:00'),

-- Mid-year 2025 Review
('SAF-120625-0001',
 'Astute Insights (Pty) Ltd','Jubhele Shange','Jubhele Shange',
 '2025-06-12','Johannesburg North — AECI Chempark',
 'K. Marupi; J. van der Berg',
 'Electronic security: perimeter fence monitoring, CCTV, access control, alarm NOC, site patrols.',
 4,1,1,1,'Johann van der Berg','2025-06-12',
 'Approved',53.06,'ORANGE',1,'kitso.marupi','2025-06-12 10:00:00');

-- ── 3a. ITEMS — SAF-150125-0001 (26.53% RED) ─────────────────
-- 13 To Standard / 36 Not to Standard / 37 N/A = 13/49 = 26.53%
DELETE FROM bf_safety_items WHERE file_ref='SAF-150125-0001';
INSERT INTO bf_safety_items
  (file_ref,section_key,item_no,result,appointee,comments,ap_status,updated_at)
VALUES
-- SECTION A
('SAF-150125-0001','A',1,'To Standard','Jubhele Shange','NOSA grading cert valid. ISO 9001 scope covers security services.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','A',2,'Not to Standard',NULL,'No signed SLA or S37.2 agreement in file. Draft exists — must be signed before next audit.','Open','2025-01-15 09:00:00'),
('SAF-150125-0001','A',3,'Not to Standard',NULL,'APS representative appointment letter not in file.','Open','2025-01-15 09:00:00'),
('SAF-150125-0001','A',4,'To Standard','Jubhele Shange','Letter of Good Standing + WCL2. Valid.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','A',5,'N/A',NULL,'Construction work permit — N/A: electronic security scope, thresholds not triggered.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','A',6,'Not to Standard',NULL,'CR3 Notification of Construction Work not submitted. Requires AECI and DoL signatures.','Open','2025-01-15 09:00:00'),
('SAF-150125-0001','A',7,'To Standard','Jubhele Shange','Public Liability Insurance — R10M cover, valid to 2025-06-30.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','A',8,'To Standard','Jubhele Shange','H&S Policy (Doc 5.01) present. Proof of staff communication outstanding — action raised.','In Progress','2025-01-15 09:00:00'),
('SAF-150125-0001','A',9,'To Standard','Jubhele Shange','Company and onsite organogram submitted and current.','Resolved','2025-01-15 09:00:00'),
-- SECTION B
('SAF-150125-0001','B',1,'To Standard','Refilwe Khumalo','Activity list covers perimeter monitoring, CCTV, access control, alarm response, patrols.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','B',2,'Not to Standard',NULL,'Task-specific risk register blank — template issued to Kitso.','Open','2025-01-15 09:00:00'),
('SAF-150125-0001','B',3,'Not to Standard',NULL,'Baseline Risk Assessment not completed. CRITICAL — complete before any on-site work resumes.','Open','2025-01-15 09:00:00'),
('SAF-150125-0001','B',4,'Not to Standard',NULL,'Continuous risk assessments not being performed or documented.','Open','2025-01-15 09:00:00'),
('SAF-150125-0001','B',5,'Not to Standard',NULL,'No Risk Review Plan submitted.','Open','2025-01-15 09:00:00'),
('SAF-150125-0001','B',6,'Not to Standard',NULL,'Only manual handling policy submitted. Full SOP list required.','Open','2025-01-15 09:00:00'),
('SAF-150125-0001','B',7,'To Standard','Jubhele Shange','SDS for all site materials (cleaning agents, lubricants) on file.','Resolved','2025-01-15 09:00:00'),
-- SECTION C
('SAF-150125-0001','C',1,'To Standard','Dr. A. Petersen','Medical certificates of fitness (Annexure 3) valid for all 3 site staff.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','C',2,'Not to Standard',NULL,'D&A Policy exists but no proof of communication, no signed testing procedure.','Open','2025-01-15 09:00:00'),
-- SECTION D
('SAF-150125-0001','D',1,'Not to Standard',NULL,'Company induction register blank. Kitso Marupi missing from site register.','Open','2025-01-15 09:00:00'),
('SAF-150125-0001','D',2,'Not to Standard',NULL,'Training matrix blank — template provided, must be completed for all 3 employees.','Open','2025-01-15 09:00:00'),
('SAF-150125-0001','D',3,'Not to Standard',NULL,'No competency records or certificates. Matrix must be done first.','Open','2025-01-15 09:00:00'),
('SAF-150125-0001','D',4,'Not to Standard',NULL,'List of fire extinguisher-trained workers not submitted.','Open','2025-01-15 09:00:00'),
('SAF-150125-0001','D',5,'Not to Standard',NULL,'Camera mounting involves work at height — no training programme or records submitted.','Open','2025-01-15 09:00:00'),
('SAF-150125-0001','D',6,'Not to Standard',NULL,'AECI site-specific induction not done. Must precede any site entry.','Open','2025-01-15 09:00:00'),
-- SECTION E
('SAF-150125-0001','E',1,'Not to Standard',NULL,'H&S Plan incomplete — SHE budget signatures missing, no proof of communication.','Open','2025-01-15 09:00:00'),
('SAF-150125-0001','E',2,'Not to Standard',NULL,'Environmental Management Plan not drafted.','Open','2025-01-15 09:00:00'),
('SAF-150125-0001','E',3,'Not to Standard',NULL,'Fall Protection Plan absent. Camera work at height — trained planner required.','Open','2025-01-15 09:00:00'),
('SAF-150125-0001','E',4,'Not to Standard',NULL,'Fall Protection Risk Assessment blank — location-specific assessment required.','Open','2025-01-15 09:00:00'),
('SAF-150125-0001','E',5,'Not to Standard',NULL,'No contractor management procedure for sub-contractor oversight.','Open','2025-01-15 09:00:00'),
('SAF-150125-0001','E',6,'Not to Standard',NULL,'No documented sub-contractor SHE file requirements.','Open','2025-01-15 09:00:00'),
('SAF-150125-0001','E',7,'Not to Standard',NULL,'Incident Management Procedure not approved by Director. No proof of communication.','Open','2025-01-15 09:00:00'),
('SAF-150125-0001','E',8,'To Standard','Kitso Marupi','24-month incident stats — zero reportable incidents prior period. Confirmed by AECI.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','E',9,'Not to Standard',NULL,'PPE Management Procedure (Doc 5.04) exists but no proof of communication.','Open','2025-01-15 09:00:00'),
('SAF-150125-0001','E',10,'Not to Standard',NULL,'No training records for PPE use, limitations, or care.','Open','2025-01-15 09:00:00'),
('SAF-150125-0001','E',11,'To Standard','James Mthembu','PPE issue records (hard hats, high-vis, safety boots, gloves) for all 3 employees.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','E',12,'Not to Standard',NULL,'PPE inspection checklist blank. No evidence of 6-monthly inspections.','Open','2025-01-15 09:00:00'),
-- SECTION F
('SAF-150125-0001','F',1,'Not to Standard',NULL,'Equipment register blank — must list all vehicles, LDVs, ladders, test equipment.','Open','2025-01-15 09:00:00'),
('SAF-150125-0001','F',2,'Not to Standard',NULL,'Inspection schedule present but no completed records or vehicle certificates.','Open','2025-01-15 09:00:00'),
('SAF-150125-0001','F',3,'Not to Standard',NULL,'No maintenance records for any equipment.','Open','2025-01-15 09:00:00'),
-- SECTION G
('SAF-150125-0001','G',1,'Not to Standard',NULL,'Emergency Preparedness Procedure not approved. No proof of staff communication.','Open','2025-01-15 09:00:00'),
('SAF-150125-0001','G',2,'Not to Standard',NULL,'Emergency drill schedule absent. No drills conducted.','Open','2025-01-15 09:00:00'),
('SAF-150125-0001','G',3,'Not to Standard',NULL,'Fire extinguisher service quote in file but no inspection cert or service report.','Open','2025-01-15 09:00:00'),
-- SECTION H (7 applicable, 27 N/A)
('SAF-150125-0001','H',1,'To Standard','Jubhele Shange','S16.2 appointment letter signed and filed.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','H',2,'N/A',NULL,'Construction Manager — N/A: electronic security scope.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','H',3,'Not to Standard','Kitso Marupi','SHE Rep appointment letter present. No competency certificate. SAMTRAC course enrolled Mar 2025.','Open','2025-01-15 09:00:00'),
('SAF-150125-0001','H',4,'N/A',NULL,'Construction H&S Officer — N/A.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','H',5,'N/A',NULL,'Construction Supervisor — N/A.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','H',6,'N/A',NULL,'Asst Construction Supervisor — N/A.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','H',7,'N/A',NULL,'Excavation Supervisor — N/A.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','H',8,'N/A',NULL,'Demolition Supervisor — N/A.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','H',9,'N/A',NULL,'Scaffolding Supervisor — N/A.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','H',10,'N/A',NULL,'Suspended Platform Supervisor — N/A.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','H',11,'Not to Standard','Kitso Marupi','Risk Assessor appointed. No IRCA/formal qualification certificate yet.','Open','2025-01-15 09:00:00'),
('SAF-150125-0001','H',12,'Not to Standard',NULL,'Fall Protection Planner not appointed. Training booked for Q2 2025.','Open','2025-01-15 09:00:00'),
('SAF-150125-0001','H',13,'N/A',NULL,'Structure Inspector — N/A.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','H',14,'N/A',NULL,'Temp Works Designer — N/A.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','H',15,'N/A',NULL,'Temp Works Supervisor — N/A.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','H',16,'N/A',NULL,'Material Hoist Operator — N/A.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','H',17,'N/A',NULL,'Material Hoist Inspector — N/A.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','H',18,'N/A',NULL,'Bulk Mixing Plant Supervisor — N/A.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','H',19,'N/A',NULL,'Bulk Mixing Plant Operator — N/A.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','H',20,'N/A',NULL,'Explosive Actuated Tool Trainer — N/A.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','H',21,'N/A',NULL,'Explosive Actuated Tool Operator — N/A.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','H',22,'N/A',NULL,'Construction Vehicle Inspector — N/A.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','H',23,'N/A',NULL,'Construction Vehicle Operator — N/A.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','H',24,'N/A',NULL,'Stacking and Piling Supervisor — N/A.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','H',25,'N/A',NULL,'Cranes Inspector — N/A.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','H',26,'N/A',NULL,'Cranes Operator — N/A.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','H',27,'N/A',NULL,'Rope Access Supervisor — N/A.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','H',28,'N/A',NULL,'Rope Access Worker — N/A.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','H',29,'N/A',NULL,'Blasting & Explosives Supervisor — N/A.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','H',30,'N/A',NULL,'Fire Protection Installation Supervisor — N/A.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','H',31,'Not to Standard',NULL,'Fire Equipment Inspector not appointed. No competency certificate.','Open','2025-01-15 09:00:00'),
('SAF-150125-0001','H',32,'Not to Standard',NULL,'Incident Investigator not formally appointed or trained.','Open','2025-01-15 09:00:00'),
('SAF-150125-0001','H',33,'To Standard','Maria Coetzee','First Aider — Maria Coetzee. Level 1 cert valid to 2026-01-10.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','H',34,'N/A',NULL,'Radiation Protection Officer — N/A.','Resolved','2025-01-15 09:00:00'),
-- SECTION I bonus
('SAF-150125-0001','I',1,'To Standard','Jubhele Shange','PSIRA registration confirmed for all security-grade personnel.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','I',2,'N/A',NULL,'ISO 45001 SANAS audit — earmarked Year 2.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','I',3,'N/A',NULL,'Behavioural-based safety programme — N/A current maturity.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','I',4,'N/A',NULL,'Near-miss reporting culture — N/A.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','I',5,'N/A',NULL,'Safety leadership coaching — N/A.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','I',6,'N/A',NULL,'Wellness programme — N/A.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','I',7,'N/A',NULL,'Environmental sustainability — N/A.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','I',8,'N/A',NULL,'Community development — N/A.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','I',9,'N/A',NULL,'Technology innovation in safety — N/A.','Resolved','2025-01-15 09:00:00'),
('SAF-150125-0001','I',10,'N/A',NULL,'Advanced emergency response — N/A.','Resolved','2025-01-15 09:00:00');

-- ── 3b. ITEMS — SAF-120625-0001 (53.06% ORANGE) ──────────────
-- 26 To Standard / 23 Not to Standard / 37 N/A = 26/49 = 53.06%
-- New passes: A2,A3,A6,B3,B6,C2,D1,D2,D3,D5,E9,E10,G3
DELETE FROM bf_safety_items WHERE file_ref='SAF-120625-0001';
INSERT INTO bf_safety_items
  (file_ref,section_key,item_no,result,appointee,comments,ap_status,updated_at)
VALUES
('SAF-120625-0001','A',1,'To Standard','Jubhele Shange','NOSA cert renewed May 2025. ISO 9001 audit passed Feb 2025.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','A',2,'To Standard','Jubhele Shange','SLA and S37.2 signed 2025-02-01. Hard copy and digital copies filed.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','A',3,'To Standard','Jubhele Shange','APS principal contractor appointment letter signed 2025-02-01.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','A',4,'To Standard','Jubhele Shange','Letter of Good Standing renewed Feb 2025. WCL2 updated.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','A',5,'N/A',NULL,'Construction work permit — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','A',6,'To Standard','Jubhele Shange','CR3 form signed by AECI (Yolanda Herbst) and DoL stamp obtained 2025-03-10.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','A',7,'To Standard','Jubhele Shange','PLI renewed — R15M cover, valid to 2026-06-30.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','A',8,'To Standard','Kitso Marupi','H&S Policy toolbox 2025-03-15. Signed attendance register filed. Policy poster on site.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','A',9,'To Standard','Jubhele Shange','Organogram updated to include N. Sithole (Call Logger).','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','B',1,'To Standard','Refilwe Khumalo','Activity list reviewed and approved. 8 categories listed.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','B',2,'Not to Standard',NULL,'Task-specific risk register: CCTV and access control RAs done; fence patrol and aerial survey still missing.','In Progress','2025-06-12 09:00:00'),
('SAF-120625-0001','B',3,'To Standard','Kitso Marupi','Baseline Risk Assessment completed, signed, filed. Reviewed against AECI hazard register.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','B',4,'Not to Standard',NULL,'Continuous risk assessments done but not consistently documented on site.','In Progress','2025-06-12 09:00:00'),
('SAF-120625-0001','B',5,'Not to Standard',NULL,'Risk Review Plan drafted — awaiting formal sign-off by manager.','In Progress','2025-06-12 09:00:00'),
('SAF-120625-0001','B',6,'To Standard','Refilwe Khumalo','SOPs completed: CCTV install, access control, fence patrol, ladder safety, working at heights (5 total).','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','B',7,'To Standard','Jubhele Shange','SDS library current. All chemical substances covered.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','C',1,'To Standard','Dr. A. Petersen','Medicals renewed. 4 employees — certs valid to Mar 2026.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','C',2,'To Standard','Kitso Marupi','D&A Policy communicated and signed acknowledgments on file for all 4 staff.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','D',1,'To Standard','James Mthembu','Induction register complete for all 4 staff. Signed and witnessed.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','D',2,'To Standard','Kitso Marupi','Training matrix fully populated — all gaps identified and scheduled.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','D',3,'To Standard','Kitso Marupi','PSIRA certs, first aid cert, fire training certs attached. WaH still outstanding.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','D',4,'Not to Standard',NULL,'Fire extinguisher training: J. Mthembu and R. Khumalo attended Apr 2025 — certs not yet in file.','In Progress','2025-06-12 09:00:00'),
('SAF-120625-0001','D',5,'To Standard','Refilwe Khumalo','Working-at-heights training completed May 2025 (J. Mthembu, R. Khumalo). Certs filed.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','D',6,'Not to Standard',NULL,'AECI site induction: 3 staff done, Nomvula Sithole pending. Scheduled July 2025.','In Progress','2025-06-12 09:00:00'),
('SAF-120625-0001','E',1,'Not to Standard',NULL,'H&S Plan draft reviewed — communication proof obtained but SHE budget section still incomplete.','In Progress','2025-06-12 09:00:00'),
('SAF-120625-0001','E',2,'Not to Standard',NULL,'Environmental Management Plan: scoping in progress. Target sign-off Sep 2025.','In Progress','2025-06-12 09:00:00'),
('SAF-120625-0001','E',3,'Not to Standard',NULL,'Fall Protection Plan being drafted by Kitso. Awaiting Fall Protection Planner qualification.','In Progress','2025-06-12 09:00:00'),
('SAF-120625-0001','E',4,'Not to Standard',NULL,'Fall Protection RA draft in progress, linked to E3.','In Progress','2025-06-12 09:00:00'),
('SAF-120625-0001','E',5,'Not to Standard',NULL,'Contractor management procedure draft reviewed. Sign-off Jul 2025.','In Progress','2025-06-12 09:00:00'),
('SAF-120625-0001','E',6,'Not to Standard',NULL,'Sub-contractor SHE requirements document drafted — not yet approved.','In Progress','2025-06-12 09:00:00'),
('SAF-120625-0001','E',7,'Not to Standard',NULL,'Incident Mgmt Procedure revised and Director approval pending.','In Progress','2025-06-12 09:00:00'),
('SAF-120625-0001','E',8,'To Standard','Kitso Marupi','Zero incidents Jan–Jun 2025. Stats current.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','E',9,'To Standard','Refilwe Khumalo','PPE Procedure toolbox talk Apr 2025. Signed attendance register filed.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','E',10,'To Standard','Refilwe Khumalo','PPE training records: all 4 staff trained on limitations, use, and inspection.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','E',11,'To Standard','James Mthembu','PPE issue register updated — N. Sithole issued Jan 2025.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','E',12,'Not to Standard',NULL,'6-monthly PPE inspection overdue by 2 months. Scheduled for July 2025.','Open','2025-06-12 09:00:00'),
('SAF-120625-0001','F',1,'Not to Standard',NULL,'Equipment register partially completed (2 LDVs, 4 ladders). Test equipment still missing.','In Progress','2025-06-12 09:00:00'),
('SAF-120625-0001','F',2,'Not to Standard',NULL,'LDV roadworthy certs due. Vehicle inspection records not maintained consistently.','Open','2025-06-12 09:00:00'),
('SAF-120625-0001','F',3,'Not to Standard',NULL,'Maintenance log started but entries sporadic. Not suitable for audit.','In Progress','2025-06-12 09:00:00'),
('SAF-120625-0001','G',1,'Not to Standard',NULL,'Emergency Preparedness Procedure approved Apr 2025. Staff training scheduled Sep 2025.','In Progress','2025-06-12 09:00:00'),
('SAF-120625-0001','G',2,'Not to Standard',NULL,'First emergency drill scheduled Sep 2025. None done yet.','Open','2025-06-12 09:00:00'),
('SAF-120625-0001','G',3,'To Standard','Bongani Zulu','Fire extinguisher annual service done Apr 2025. Certificate and service report filed.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','H',1,'To Standard','Jubhele Shange','S16.2 appointment in place.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','H',2,'N/A',NULL,'Construction Manager — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','H',3,'Not to Standard','Kitso Marupi','SAMTRAC course in progress (Mar–Jun 2025). Certificate expected Jul 2025.','In Progress','2025-06-12 09:00:00'),
('SAF-120625-0001','H',4,'N/A',NULL,'Construction H&S Officer — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','H',5,'N/A',NULL,'Construction Supervisor — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','H',6,'N/A',NULL,'Asst Construction Supervisor — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','H',7,'N/A',NULL,'Excavation Supervisor — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','H',8,'N/A',NULL,'Demolition Supervisor — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','H',9,'N/A',NULL,'Scaffolding Supervisor — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','H',10,'N/A',NULL,'Suspended Platform Supervisor — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','H',11,'Not to Standard','Kitso Marupi','Risk Assessor appointment in place. IRCA qualification still pending — enrolled Aug 2025.','Open','2025-06-12 09:00:00'),
('SAF-120625-0001','H',12,'Not to Standard',NULL,'Fall Protection Planner not yet qualified. Training course booked Aug 2025.','Open','2025-06-12 09:00:00'),
('SAF-120625-0001','H',13,'N/A',NULL,'Structure Inspector — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','H',14,'N/A',NULL,'Temp Works Designer — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','H',15,'N/A',NULL,'Temp Works Supervisor — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','H',16,'N/A',NULL,'Material Hoist Operator — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','H',17,'N/A',NULL,'Material Hoist Inspector — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','H',18,'N/A',NULL,'Bulk Mixing Plant Supervisor — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','H',19,'N/A',NULL,'Bulk Mixing Plant Operator — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','H',20,'N/A',NULL,'Explosive Actuated Tool Trainer — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','H',21,'N/A',NULL,'Explosive Actuated Tool Operator — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','H',22,'N/A',NULL,'Construction Vehicle Inspector — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','H',23,'N/A',NULL,'Construction Vehicle Operator — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','H',24,'N/A',NULL,'Stacking and Piling Supervisor — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','H',25,'N/A',NULL,'Cranes Inspector — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','H',26,'N/A',NULL,'Cranes Operator — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','H',27,'N/A',NULL,'Rope Access Supervisor — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','H',28,'N/A',NULL,'Rope Access Worker — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','H',29,'N/A',NULL,'Blasting & Explosives Supervisor — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','H',30,'N/A',NULL,'Fire Protection Installation Supervisor — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','H',31,'Not to Standard',NULL,'Fire Equipment Inspector: appointment drafted, training booked Sep 2025.','In Progress','2025-06-12 09:00:00'),
('SAF-120625-0001','H',32,'Not to Standard',NULL,'Incident Investigator: appointment in place but no formal NOSA cert yet.','In Progress','2025-06-12 09:00:00'),
('SAF-120625-0001','H',33,'To Standard','Maria Coetzee','First Aider cert valid.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','H',34,'N/A',NULL,'Radiation Protection Officer — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','I',1,'To Standard','Jubhele Shange','PSIRA current for all security-grade staff.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','I',2,'N/A',NULL,'ISO 45001 — Year 2 plan.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','I',3,'N/A',NULL,'Behavioural safety — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','I',4,'N/A',NULL,'Near-miss culture — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','I',5,'N/A',NULL,'Safety leadership — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','I',6,'N/A',NULL,'Wellness programme — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','I',7,'N/A',NULL,'Environmental sustainability — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','I',8,'N/A',NULL,'Community development — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','I',9,'N/A',NULL,'Tech innovation — N/A.','Resolved','2025-06-12 09:00:00'),
('SAF-120625-0001','I',10,'N/A',NULL,'Advanced emergency response — N/A.','Resolved','2025-06-12 09:00:00');

SET FOREIGN_KEY_CHECKS = 1;
-- End Part 1
