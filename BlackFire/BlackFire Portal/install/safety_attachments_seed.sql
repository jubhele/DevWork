-- ============================================================
-- Safety File Attachments Seed
-- Ref     : SAF-210526-0001
-- Source  : C:\DevWork\BlackFire\BlackFire Portal\_sample_docs\safety
-- Files   : 30
-- Generated: 2026-05-21 19:01:48
--
-- Run AFTER: safety_seed_astute.sql
-- Then FTP uploads/attachments/ files to Afrihost before running.
--
-- RESTORE BACKUP IF NEEDED:
-- DELETE FROM bf_attachments WHERE entity_type = 'safety_file' AND entity_ref = 'SAF-210526-0001';
-- ============================================================

-- Clean existing attachments for this safety file before re-seeding
DELETE FROM bf_attachments
 WHERE entity_type = 'safety_file'
   AND entity_ref  = 'SAF-210526-0001';

-- Insert attachment records
INSERT INTO bf_attachments
    (entity_type, entity_ref, original_name, stored_name, file_size, mime_type, uploaded_by, created_at)
VALUES
(
    'safety_file',
    'SAF-210526-0001',
    'A01_certificate_nosa-grade-c.pdf',
    '51887a2c03c23ca006fc24837acf0f31.pdf',
    397,
    'application/pdf',
    'admin',
    '2026-05-21 19:01:48'
),(
    'safety_file',
    'SAF-210526-0001',
    'A02_agreement_37-2-contractor-signed.pdf',
    '90a8e1972e519fa4df74839edeca485d.pdf',
    410,
    'application/pdf',
    'admin',
    '2026-05-21 19:01:48'
),(
    'safety_file',
    'SAF-210526-0001',
    'A04_certificate_coida-good-standing.pdf',
    '18a9d5570c551bbeaa5c6425386857cb.pdf',
    398,
    'application/pdf',
    'admin',
    '2026-05-21 19:01:48'
),(
    'safety_file',
    'SAF-210526-0001',
    'A07_insurance_public-liability-r10m.pdf',
    '85a41f09c33ecad919ccfbdbff9328b7.pdf',
    405,
    'application/pdf',
    'admin',
    '2026-05-21 19:01:48'
),(
    'safety_file',
    'SAF-210526-0001',
    'A08_policy_ehs-signed.pdf',
    '7b06a1acd4c1dd48b5479c1d8221b7e4.pdf',
    408,
    'application/pdf',
    'admin',
    '2026-05-21 19:01:48'
),(
    'safety_file',
    'SAF-210526-0001',
    'B02_assessment_task-specific-ra.pdf',
    'b0430fad3ff66a7dede447936bd98660.pdf',
    404,
    'application/pdf',
    'admin',
    '2026-05-21 19:01:48'
),(
    'safety_file',
    'SAF-210526-0001',
    'B03_assessment_baseline-risk.pdf',
    '27d3c5862dad240e86d9550b358c2a4a.pdf',
    396,
    'application/pdf',
    'admin',
    '2026-05-21 19:01:48'
),(
    'safety_file',
    'SAF-210526-0001',
    'B06_procedure_safe-work-swp-list.pdf',
    'c33df9a9ed5d3977d07df37357dbedf1.pdf',
    404,
    'application/pdf',
    'admin',
    '2026-05-21 19:01:48'
),(
    'safety_file',
    'SAF-210526-0001',
    'C01_certificates_medical-ofc-all-employees.pdf',
    'ca36b9c6ca30fdaa27fa744868aeed46.pdf',
    420,
    'application/pdf',
    'admin',
    '2026-05-21 19:01:48'
),(
    'safety_file',
    'SAF-210526-0001',
    'D01_register_company-induction-signed.pdf',
    'c5b51c170b4bd9266c89d11e23cc7a3f.pdf',
    405,
    'application/pdf',
    'admin',
    '2026-05-21 19:01:48'
),(
    'safety_file',
    'SAF-210526-0001',
    'D06_certificates_aeci-site-induction.pdf',
    '2c6c0de2710afe850f2d4578a82a39cb.pdf',
    410,
    'application/pdf',
    'admin',
    '2026-05-21 19:01:48'
),(
    'safety_file',
    'SAF-210526-0001',
    'E01_plan_health-and-safety.pdf',
    '18573615515a4b8dc38cf7992e42f61a.pdf',
    409,
    'application/pdf',
    'admin',
    '2026-05-21 19:01:48'
),(
    'safety_file',
    'SAF-210526-0001',
    'E07_procedure_incident-management.pdf',
    '28d73aeaf44e585a53c9ea83521a6dce.pdf',
    393,
    'application/pdf',
    'admin',
    '2026-05-21 19:01:48'
),(
    'safety_file',
    'SAF-210526-0001',
    'E09_procedure_ppe-management.pdf',
    '016324e240eaadb04847041a600ca0d6.pdf',
    402,
    'application/pdf',
    'admin',
    '2026-05-21 19:01:48'
),(
    'safety_file',
    'SAF-210526-0001',
    'E11_register_ppe-issuance-signed.pdf',
    'e26fc729d3c4f1c3f8caddaa8c84e478.pdf',
    400,
    'application/pdf',
    'admin',
    '2026-05-21 19:01:48'
),(
    'safety_file',
    'SAF-210526-0001',
    'F01_register_equipment-list.pdf',
    'bed52108025d97122a17e16f9269c802.pdf',
    412,
    'application/pdf',
    'admin',
    '2026-05-21 19:01:48'
),(
    'safety_file',
    'SAF-210526-0001',
    'F02_record_vehicle-cof-current.pdf',
    '4d8b0e6813d60cf4825d4accde16534d.pdf',
    409,
    'application/pdf',
    'admin',
    '2026-05-21 19:01:48'
),(
    'safety_file',
    'SAF-210526-0001',
    'G01_procedure_emergency-preparedness.pdf',
    'ef588afb21350be59244774eab62a6fb.pdf',
    406,
    'application/pdf',
    'admin',
    '2026-05-21 19:01:48'
),(
    'safety_file',
    'SAF-210526-0001',
    'G02_register_emergency-drill-schedule.pdf',
    '269337a7cbfa780468d04b2053332f3d.pdf',
    414,
    'application/pdf',
    'admin',
    '2026-05-21 19:01:48'
),(
    'safety_file',
    'SAF-210526-0001',
    'G03_register_fire-extinguisher-inspection.pdf',
    '63fad710d4adf12698424dba82e7bf56.pdf',
    406,
    'application/pdf',
    'admin',
    '2026-05-21 19:01:48'
),(
    'safety_file',
    'SAF-210526-0001',
    'H01_appointment_sec162-mokoena.pdf',
    '5712d7227921a8201e28181758eebdb8.pdf',
    413,
    'application/pdf',
    'admin',
    '2026-05-21 19:01:48'
),(
    'safety_file',
    'SAF-210526-0001',
    'H02_appointment_general-supervision-vdberg.pdf',
    'b3ae870f3ef94473ef3b75beca440fce.pdf',
    405,
    'application/pdf',
    'admin',
    '2026-05-21 19:01:48'
),(
    'safety_file',
    'SAF-210526-0001',
    'H03_appointment_she-rep-dlamini.pdf',
    '615437badcefb423c9b67744019d44ec.pdf',
    412,
    'application/pdf',
    'admin',
    '2026-05-21 19:01:48'
),(
    'safety_file',
    'SAF-210526-0001',
    'H07_appointment_construction-manager-ndlovu.pdf',
    '8027a02aef4189e9a0e981de422198dc.pdf',
    407,
    'application/pdf',
    'admin',
    '2026-05-21 19:01:48'
),(
    'safety_file',
    'SAF-210526-0001',
    'H09_appointment_construction-supervisor-mthembu.pdf',
    'c9207476cab2ffbef6c22ab0b14c2eb5.pdf',
    406,
    'application/pdf',
    'admin',
    '2026-05-21 19:01:48'
),(
    'safety_file',
    'SAF-210526-0001',
    'H11_appointment_risk-assessor-ahmed.pdf',
    '6829915a2dbef46477ad38a632d2ca47.pdf',
    412,
    'application/pdf',
    'admin',
    '2026-05-21 19:01:48'
),(
    'safety_file',
    'SAF-210526-0001',
    'H31_appointment_fire-equipment-inspector-zulu.pdf',
    '52dafcbc0d1c4151c68907861582e163.pdf',
    417,
    'application/pdf',
    'admin',
    '2026-05-21 19:01:48'
),(
    'safety_file',
    'SAF-210526-0001',
    'H33_certificates_first-aider-coetzee.pdf',
    '17c942db133823d622e2fb4cc6a571cb.pdf',
    413,
    'application/pdf',
    'admin',
    '2026-05-21 19:01:48'
),(
    'safety_file',
    'SAF-210526-0001',
    'I01_certificate_iso-45001-sabs.pdf',
    'fa92b4cbd027a13d0f97dcf718da450f.pdf',
    416,
    'application/pdf',
    'admin',
    '2026-05-21 19:01:48'
),(
    'safety_file',
    'SAF-210526-0001',
    'I02_register_toolbox-talk-weekly.pdf',
    '19aded8a340b08fd6c57f3c837d2e8d5.pdf',
    418,
    'application/pdf',
    'admin',
    '2026-05-21 19:01:48'
);

-- Verify
SELECT id, original_name, ROUND(file_size/1024,1) AS kb, uploaded_by, created_at
  FROM bf_attachments
 WHERE entity_type = 'safety_file' AND entity_ref = 'SAF-210526-0001'
 ORDER BY original_name;
