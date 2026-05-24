-- ============================================================
-- Safety File Seed — Astute Insights (Pty) Ltd (prototype)
-- APS-EHS-FRM-010 Rev 02  |  Ref: SAF-210526-0001
-- Score: 81.19%  (main A-H 76.19% + bonus I 5.00%)
-- Band: Yellow — Minor concerns
--
-- DOCUMENT NAMING CONVENTION
-- ──────────────────────────
-- Pattern : [SECTION][NN]_[doctype]_[description-in-kebab].[ext]
-- SECTION : A–I  (section letter, uppercase)
-- NN      : zero-padded item number  e.g. 01, 09, 33
-- doctype : agreement | appointment | assessment | certificate |
--           insurance | plan | policy | procedure | record |
--           register  | report | training
-- ext     : pdf | docx | xlsx | jpg | png
--
-- Examples
--   A02_agreement_37-2-contractor-signed.pdf
--   H03_appointment_she-rep-dlamini.pdf
--   I01_certificate_iso-45001-sabs.pdf
--   E01_plan_health-and-safety.pdf
--
-- Placeholder files are in:
--   BlackFire Portal/_sample_docs/safety/
-- Upload them via: portal → SAF-210526-0001 → Supporting Documents
--
-- EXECUTION ORDER
-- ───────────────
-- 1. safety_migration.sql   (tables + counter)
-- 2. safety_seed_astute.sql (this file)
--
-- IDEMPOTENCY: Uses DELETE + fresh INSERT (not ON DUPLICATE KEY).
-- Re-running resets the seed record to this baseline state.
-- ============================================================

-- ── 0. Backup — run this in your terminal BEFORE executing this file ──
-- mysqldump -u <user> -p <dbname> bf_safety_files bf_safety_items \
--   > safety_tables_bak_$(date +%Y%m%d_%H%M%S).sql

-- ── 1. Counter ─────────────────────────────────────────────────
UPDATE bf_counters
   SET current_value = GREATEST(current_value, 1)
 WHERE counter_type = 'saf';

-- ── 2. Clean delete — FK CASCADE removes all items automatically
SET @ref = 'SAF-210526-0001';
DELETE FROM bf_safety_files WHERE ref_id = @ref;

-- ── 3. Safety file header ──────────────────────────────────────
INSERT INTO bf_safety_files (
    ref_id, contractor, contractor_rep, appointee162,
    audit_date, region, audit_team, scope_of_work,
    manpower, supervisors, she_reps, first_aiders,
    auditor_name, sign_off_date,
    status, score,
    policy_email_sent, policy_email_date, policy_email_to,
    created_by, updated_by
) VALUES (
    @ref,
    'Astute Insights (Pty) Ltd',
    'Jubhele Shange',
    'Thabo Mokoena',
    '2026-05-21',
    'Johannesburg North — AECI Chempark',
    'J. van der Berg / K. Dlamini',
    'Electrical maintenance, cable routing and panel upgrades within AECI Chempark premises. Duration: 6 weeks. No hot work, fall-risk activities, excavation or subcontractors. No hazardous chemicals handled.',
    18, 2, 1, 2,
    'Johann van der Berg',
    '2026-05-21',
    'Submitted', 81.19,
    1, '2026-05-21', 'jubhele@gmail.com',
    'admin', 'admin'
);

-- ── 4. Checklist items (86 total: 76 main A-H + 10 bonus I) ───
INSERT INTO bf_safety_items (file_ref, section_key, item_no, result, appointee, comments, ap_status)
VALUES

-- ── Section A — Agreement (9 items) ──────────────────────────
(@ref,'A', 1,'To Standard',       '','NOSA Grade C Certificate current and in file.','Open'),
(@ref,'A', 2,'To Standard',       '','Signed 37.2 Agreement dated 2026-03-10 in file.','Open'),
(@ref,'A', 3,'N/A',               '','Not a principal contractor on this site — 16.2 appointment letter not required.','Open'),
(@ref,'A', 4,'To Standard',       '','COIDA Letter of Good Standing (Reg No. 8842311) and signed WCL2 in file.','Open'),
(@ref,'A', 5,'N/A',               '','Scope < 180 days; < 1800 person-days; contract value < R13M. Work permit not required.','Open'),
(@ref,'A', 6,'N/A',               '','Notification of Construction Work not required for this scope and duration.','Open'),
(@ref,'A', 7,'To Standard',       '','Public Liability Insurance R10M — certificate valid to 2027-02-28.','Open'),
(@ref,'A', 8,'To Standard',       '','EHS Policy signed by CEO dated 2025-11-01.','Open'),
(@ref,'A', 9,'Not to Standard',   '','Company organogram provided but site-specific onsite employee organogram not included.','Open'),

-- ── Section B — Risk Management (7 items) ────────────────────
(@ref,'B', 1,'To Standard',       '','Activity list aligned to scope of work — 6 main tasks listed.','Open'),
(@ref,'B', 2,'To Standard',       '','Task-specific risk assessments for all 6 activities in file.','Open'),
(@ref,'B', 3,'To Standard',       '','Baseline risk assessment signed and dated.','Open'),
(@ref,'B', 4,'Not to Standard',   '','Continuous risk assessments on file but not consistently countersigned by responsible supervisor.','Open'),
(@ref,'B', 5,'Not to Standard',   '','Risk review plan not included in safety file.','Open'),
(@ref,'B', 6,'To Standard',       '','SOPs/SWPs provided for all high-risk tasks; reviewed annually.','Open'),
(@ref,'B', 7,'N/A',               '','No hazardous chemicals in scope — SDSs not required.','Open'),

-- ── Section C — Medical Fitness (2 items) ────────────────────
(@ref,'C', 1,'To Standard',       '','Valid OFCs (Annexure 3) on file for all 18 employees.','Open'),
(@ref,'C', 2,'Not to Standard',   '','Drug & Alcohol Policy referenced in induction but written policy and random testing arrangement not in file.','Open'),

-- ── Section D — Employees, Training & Competency (6 items) ───
(@ref,'D', 1,'To Standard',       '','Company induction records signed by all 18 employees.','Open'),
(@ref,'D', 2,'To Standard',       '','Training matrix in file covering all required competencies.','Open'),
(@ref,'D', 3,'Not to Standard',   '','Training matrix not fully populated — 4 employees missing refresher records for working-at-height.','Open'),
(@ref,'D', 4,'N/A',               '','No fire extinguisher tasks in scope.','Open'),
(@ref,'D', 5,'N/A',               '','No work from fall-risk positions — fall-protection training programme not required.','Open'),
(@ref,'D', 6,'To Standard',       '','AECI site-specific induction certificates in file for all 18 employees.','Open'),

-- ── Section E — Operations (12 items) ────────────────────────
(@ref,'E', 1,'To Standard',       '','H&S Plan aligned to APS site specification and scope of work.','Open'),
(@ref,'E', 2,'Not to Standard',   '','Environmental Management Plan provided but does not adequately address waste management or chemical spill procedures.','Open'),
(@ref,'E', 3,'N/A',               '','No work from fall-risk positions — Fall Protection Plan not required.','Open'),
(@ref,'E', 4,'N/A',               '','No fall-risk work — Fall Protection Risk Assessment not required.','Open'),
(@ref,'E', 5,'N/A',               '','No subcontractors engaged on this scope.','Open'),
(@ref,'E', 6,'N/A',               '','No subcontractors — subcontractor SHE file proof not applicable.','Open'),
(@ref,'E', 7,'To Standard',       '','Documented Incident Management Procedure in file.','Open'),
(@ref,'E', 8,'Not to Standard',   '','Only 12 months of incident statistics provided; 24 months required.','Open'),
(@ref,'E', 9,'To Standard',       '','PPE Management Procedure documented, signed and distributed.','Open'),
(@ref,'E',10,'To Standard',       '','Proof of PPE training (limitations, use and care) for all employees.','Open'),
(@ref,'E',11,'To Standard',       '','PPE issuance register signed by all employees.','Open'),
(@ref,'E',12,'Not to Standard',   '','PPE inspection records incomplete — hard hats and harnesses not recorded for Oct–Apr period.','Open'),

-- ── Section F — Equipment (3 items) ──────────────────────────
(@ref,'F', 1,'To Standard',       '','Equipment register: 2 LDVs, 1 cable drum trailer, 1 cable jointing kit.','Open'),
(@ref,'F', 2,'To Standard',       '','COFs current for both vehicles; next renewal due 2027-01-15.','Open'),
(@ref,'F', 3,'Not to Standard',   '','Maintenance records for cable jointing kit and trailer not current — last entry September 2025.','Open'),

-- ── Section G — Emergency Preparedness (3 items) ─────────────
(@ref,'G', 1,'To Standard',       '','Emergency Preparedness Procedure in file; toolbox talk proof of training on file.','Open'),
(@ref,'G', 2,'To Standard',       '','Emergency drill schedule in file; last drill conducted 2026-03-18 with sign-in sheet.','Open'),
(@ref,'G', 3,'To Standard',       '','4× 2.5 kg DCP fire extinguishers; inspection tags current; service record on file.','Open'),

-- ── Section H — Legal Appointments (34 items) ────────────────
(@ref,'H', 1,'To Standard',       'Thabo Mokoena',    'Sec 16.2 appointment letter signed 2026-01-10.','Open'),
(@ref,'H', 2,'To Standard',       'Sarah van der Berg','General supervision appointment letter in file.','Open'),
(@ref,'H', 3,'To Standard',       'Kgomotso Dlamini', 'SHE Rep appointed; SAMTRAC Level 1 certificate on file. >20 employees on site.','Open'),
(@ref,'H', 4,'N/A',               '','Only 1 SHE Rep — SHE Committee Chairman not required.','Open'),
(@ref,'H', 5,'N/A',               '','Only 1 SHE Rep — SHE Committee Member not required.','Open'),
(@ref,'H', 6,'N/A',               '','CHSO not required — electrical maintenance; no construction work permit.','Open'),
(@ref,'H', 7,'To Standard',       'Lungelo Ndlovu',   'Construction Manager appointment and CV in file.','Open'),
(@ref,'H', 8,'N/A',               '','No absence of Construction Manager anticipated — assistant not required.','Open'),
(@ref,'H', 9,'To Standard',       'Patrick Mthembu',  'Construction Supervisor appointment letter in file.','Open'),
(@ref,'H',10,'N/A',               '','No assistant supervisor required for this scope.','Open'),
(@ref,'H',11,'To Standard',       'Faisal Ahmed',     'Risk Assessor appointment and IRCA RA competency certificate on file.','Open'),
(@ref,'H',12,'N/A',               '','No fall-risk work — Fall Protection Planner not required.','Open'),
(@ref,'H',13,'N/A',               '','No structural work.','Open'),
(@ref,'H',14,'N/A',               '','No temporary works design.','Open'),
(@ref,'H',15,'N/A',               '','No temporary works supervision.','Open'),
(@ref,'H',16,'N/A',               '','No excavation work.','Open'),
(@ref,'H',17,'N/A',               '','No demolition work.','Open'),
(@ref,'H',18,'N/A',               '','No scaffolding work.','Open'),
(@ref,'H',19,'N/A',               '','No suspended platforms.','Open'),
(@ref,'H',20,'N/A',               '','No suspended platform operations.','Open'),
(@ref,'H',21,'N/A',               '','No rope access work.','Open'),
(@ref,'H',22,'N/A',               '','No material hoist.','Open'),
(@ref,'H',23,'N/A',               '','No material hoist.','Open'),
(@ref,'H',24,'N/A',               '','No bulk mixing plant.','Open'),
(@ref,'H',25,'N/A',               '','No bulk mixing plant.','Open'),
(@ref,'H',26,'N/A',               '','No explosive actuated tools.','Open'),
(@ref,'H',27,'N/A',               '','No explosive actuated tools.','Open'),
(@ref,'H',28,'N/A',               '','No explosive actuated tools.','Open'),
(@ref,'H',29,'Not to Standard',   '','Construction vehicle operator appointment present but CV and valid driver licence copy not in file.','Open'),
(@ref,'H',30,'N/A',               '','No stacking and storage work.','Open'),
(@ref,'H',31,'To Standard',       'Bongani Zulu',     'Fire Equipment Inspector appointment and SAQCC Gas certificate on file.','Open'),
(@ref,'H',32,'To Standard',       'Thabo Mokoena',    'Incident Investigator appointment in file.','Open'),
(@ref,'H',33,'To Standard',       'Maria Coetzee',    '2× First Aiders; Level 1 FA certificates valid to 2027-09.','Open'),
(@ref,'H',34,'N/A',               '','No radiation sources on site.','Open'),

-- ── Section I — Advanced & Best Practice (Bonus +10%) ────────
(@ref,'I', 1,'To Standard',       '','ISO 45001:2018 Certificate (SABS-CB cert SHE-77341) valid to 2027-04-30.','Open'),
(@ref,'I', 2,'To Standard',       '','Weekly Toolbox Talk register on file; signed attendance for all 18 employees, topics recorded.','Open'),
(@ref,'I', 3,'Not to Standard',   '','Near Miss Register maintained but no trend analysis report or formal investigation close-out records on file.','Open'),
(@ref,'I', 4,'N/A',               '','No formal Behavioral-Based Safety programme in place for this contractor.','Open'),
(@ref,'I', 5,'To Standard',       '','EAP service provider details communicated to all employees via notice board and site induction.','Open'),
(@ref,'I', 6,'Not to Standard',   '','Environmental Legal Register not in file; contractor confirmed it exists but was not included.','Open'),
(@ref,'I', 7,'N/A',               '','No hazardous waste generated in this scope — disposal records not required.','Open'),
(@ref,'I', 8,'To Standard',       '','Digital safety management system (SafetyFile Pro) in active use; access credentials shared with APS auditor.','Open'),
(@ref,'I', 9,'Not to Standard',   '','OHS Surveillance Programme active but periodic medicals for 3 employees are 2 months overdue.','Open'),
(@ref,'I',10,'Not to Standard',   '','No monthly safety performance report (LTIFR, TRIR, near misses, training hours) issued to management.','Open');

-- ── 5. Documents to upload (after seed) ───────────────────────
-- Files are in: BlackFire Portal/_sample_docs/safety/
-- Upload via portal UI: SAF-210526-0001 → Supporting Documents → Upload Document
--
-- Naming convention: [SECTION][NN]_[doctype]_[description-kebab].[ext]
--
-- A01_certificate_nosa-grade-c.pdf
-- A02_agreement_37-2-contractor-signed.pdf
-- A04_certificate_coida-good-standing.pdf
-- A07_insurance_public-liability-r10m.pdf
-- A08_policy_ehs-signed.pdf
-- B02_assessment_task-specific-ra.pdf
-- B03_assessment_baseline-risk.pdf
-- C01_certificates_medical-ofc-all-employees.pdf
-- D01_register_company-induction-signed.pdf
-- D06_certificates_aeci-site-induction.pdf
-- E01_plan_health-and-safety.pdf
-- E07_procedure_incident-management.pdf
-- G02_register_emergency-drill-schedule.pdf
-- G03_register_fire-extinguisher-inspection.pdf
-- H01_appointment_sec162-mokoena.pdf
-- H02_appointment_general-supervision-vdberg.pdf
-- H03_appointment_she-rep-dlamini.pdf
-- H07_appointment_construction-manager-ndlovu.pdf
-- H09_appointment_construction-supervisor-mthembu.pdf
-- H11_appointment_risk-assessor-ahmed.pdf
-- H31_appointment_fire-equipment-inspector-zulu.pdf
-- H33_certificates_first-aider-coetzee.pdf
-- I01_certificate_iso-45001-sabs.pdf
-- I02_register_toolbox-talk-weekly.pdf
-- ─────────────────────────────────────────────────────────────

-- End of seed
