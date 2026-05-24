<?php
ob_start();
/**
 * Umlilo Portal — Safety Remediation Document Pack Generator
 *
 * GET /api/safety_doc_gen.php?file_ref=SAF-001
 *
 * Returns a self-contained, print-ready HTML document containing:
 *  - Template documents for every "Not to Standard" item that can be self-generated
 *    (policies, procedures, registers, appointment letters, etc.)
 *  - "How to Obtain" guidance pages for items issued by external bodies
 *    (government permits, compensation fund letters, insurance certificates, etc.)
 *
 * No POST/PUT/DELETE — read-only output endpoint.
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$cfg = require __DIR__ . '/../config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');

$user   = require_auth();
require_perm('safety.view');
$ref_id = clean($_GET['file_ref'] ?? '', 30);

if (!$ref_id) {
    api_headers();
    json_err('file_ref required');
}

$file = db_row("SELECT * FROM bf_safety_files WHERE ref_id = ?", [$ref_id]);
if (!$file) {
    api_headers();
    json_err('Safety file not found', 404);
}

$nts_items = db_select(
    "SELECT section_key, item_no, appointee, comments
       FROM bf_safety_items
      WHERE file_ref = ? AND result = 'Not to Standard'
      ORDER BY section_key, item_no",
    [$ref_id]
);

if (!$nts_items) {
    api_headers();
    json_ok(['message' => 'No items marked Not to Standard — no documents to generate.']);
}

// Build lookup: "A.1" => {appointee, comments}
$nts = [];
foreach ($nts_items as $row) {
    $nts[$row['section_key'] . '.' . (int)$row['item_no']] = $row;
}

/* ── Item catalogue: mirrors SAFETY_SECTIONS in portal.js ── */
$ITEMS = [
    'A' => ['title' => 'Section A — Agreement', 'items' => [
        1  => ['ref' => 'Optional',               'label' => 'SHE Management System Certification'],
        2  => ['ref' => 'Sec 37.2',               'label' => 'Written Contract / 37.2 Agreement'],
        3  => ['ref' => 'CR5',                    'label' => 'Principal Contractor Appointment Letter'],
        4  => ['ref' => 'COIDA Sec.89 / CR5(1)j', 'label' => 'Letter of Good Standing (Compensation Fund)'],
        5  => ['ref' => 'Construction Reg 3(1)',  'label' => 'Construction Work Permit'],
        6  => ['ref' => 'CR 4(1)',                'label' => 'Notification of Construction Work'],
        7  => ['ref' => 'AECI',                   'label' => 'Public Liability Insurance Certificate'],
        8  => ['ref' => 'Section 7 OHS Act',      'label' => 'Health & Safety / EHS Policy'],
        9  => ['ref' => 'AECI — Accountability',  'label' => 'Company Organogram & Onsite Organogram'],
    ]],
    'B' => ['title' => 'Section B — Risk Management', 'items' => [
        1 => ['ref' => 'CR 9(1)',    'label' => 'List of Main Activities (Scope of Work)'],
        2 => ['ref' => 'CR 9(1)',    'label' => 'Risk Register — Task Specific Risk Assessments'],
        3 => ['ref' => 'CR 5(1)',    'label' => 'Baseline Risk Assessment'],
        4 => ['ref' => 'AECI',       'label' => 'Continuous Risk Assessments'],
        5 => ['ref' => 'CR 9(1)e',   'label' => 'Risk Review Plan'],
        6 => ['ref' => 'CR 9(1)c',   'label' => 'Safe Work / Operating Procedures (SOPs)'],
        7 => ['ref' => 'Haz. Chem.', 'label' => 'Safety Data Sheets (SDS)'],
    ]],
    'C' => ['title' => 'Section C — Medical Fitness', 'items' => [
        1 => ['ref' => 'CR 7(1)(g)', 'label' => 'Medical Certificates of Fitness (Annexure 3)'],
        2 => ['ref' => '',           'label' => 'Drug & Alcohol Policy'],
    ]],
    'D' => ['title' => 'Section D — Employees, Training, Competency & Induction', 'items' => [
        1 => ['ref' => '',           'label' => 'Company Induction Register'],
        2 => ['ref' => '',           'label' => 'Training Matrix'],
        3 => ['ref' => '',           'label' => 'Competency Records'],
        4 => ['ref' => 'CR 29(j)',   'label' => 'Fire Extinguisher Training Register'],
        5 => ['ref' => 'CR 10(2)c',  'label' => 'Fall Protection Training Records'],
        6 => ['ref' => '',           'label' => 'AECI / Site-Specific Induction Records'],
    ]],
    'E' => ['title' => 'Section E — Operations (SHE Plan, FPP, Environmental, Incident & PPE)', 'items' => [
        1  => ['ref' => 'CR 7(1)(a)', 'label' => 'Health & Safety Plan'],
        2  => ['ref' => '',           'label' => 'Environmental Management Plan'],
        3  => ['ref' => 'CR 10(1)a',  'label' => 'Fall Protection Plan'],
        4  => ['ref' => 'CR 10(1)b',  'label' => 'Fall Protection Risk Assessment'],
        5  => ['ref' => '',           'label' => 'Contractor Management Procedure'],
        6  => ['ref' => '',           'label' => 'Subcontractor SHE File Requirements Proof'],
        7  => ['ref' => '',           'label' => 'Incident Management Procedure'],
        8  => ['ref' => '',           'label' => '24-Month Incident Statistics'],
        9  => ['ref' => '',           'label' => 'PPE Management Procedure'],
        10 => ['ref' => '',           'label' => 'PPE Training Records'],
        11 => ['ref' => '',           'label' => 'PPE Issuance Register'],
        12 => ['ref' => '',           'label' => 'PPE Inspection Register'],
    ]],
    'F' => ['title' => 'Section F — Control & Maintenance of Equipment', 'items' => [
        1 => ['ref' => '', 'label' => 'Equipment Register'],
        2 => ['ref' => '', 'label' => 'Statutory & Mandatory Inspection Schedule'],
        3 => ['ref' => '', 'label' => 'Maintenance Records'],
    ]],
    'G' => ['title' => 'Section G — Emergency Preparedness', 'items' => [
        1 => ['ref' => 'CR 29(i)(i-iii)', 'label' => 'Emergency Preparedness Procedure'],
        2 => ['ref' => 'GSR 3',           'label' => 'Emergency Drill Schedule'],
        3 => ['ref' => '',                'label' => 'Fire Equipment Inspection Log'],
    ]],
    'H' => ['title' => 'Section H — Legal Appointments', 'items' => [
        1  => ['ref' => 'Sec 16.2',    'label' => 'Manager'],
        2  => ['ref' => 'Sec 8',       'label' => 'General Supervision'],
        3  => ['ref' => 'Sec 17',      'label' => 'SHE Representative'],
        4  => ['ref' => 'Sec 19',      'label' => 'SHE Committee Chairman'],
        5  => ['ref' => 'Sec 19.3',    'label' => 'SHE Committee Member'],
        6  => ['ref' => 'CR8(6)',      'label' => 'Construction Health & Safety Officer'],
        7  => ['ref' => 'CR8(1)',      'label' => 'Construction Manager'],
        8  => ['ref' => 'CR8(2)',      'label' => 'Assistant Construction Manager'],
        9  => ['ref' => 'CR8(7)',      'label' => 'Construction Supervisor'],
        10 => ['ref' => 'CR8(8)',      'label' => 'Assistant Construction Supervisor'],
        11 => ['ref' => 'CR9(1)',      'label' => 'Risk Assessor'],
        12 => ['ref' => 'CR10(1)',     'label' => 'Fall Protection Planner'],
        13 => ['ref' => 'CR11(1)',     'label' => 'Structure Inspector'],
        14 => ['ref' => 'CR12(1)',     'label' => 'Temporary Works Designer'],
        15 => ['ref' => 'CR12(2)',     'label' => 'Temporary Works Supervisor'],
        16 => ['ref' => 'CR13(1)a',   'label' => 'Excavation Supervisor'],
        17 => ['ref' => 'CR14(1)',     'label' => 'Demolition Supervisor'],
        18 => ['ref' => 'CR16(1)',     'label' => 'Scaffolding Supervisor'],
        19 => ['ref' => 'CR17(1)',     'label' => 'Suspended Platform Supervisor'],
        20 => ['ref' => 'CR17(2)(ii)','label' => 'Suspended Platform Erector / Operator / Inspector'],
        21 => ['ref' => 'CR18(1)',     'label' => 'Rope Access Supervisor'],
        22 => ['ref' => 'CR19(6)',     'label' => 'Material Hoist Operator'],
        23 => ['ref' => 'CR19(8)(a)', 'label' => 'Material Hoist Inspector'],
        24 => ['ref' => 'CR20(1)',     'label' => 'Bulk Mixing Plant Supervisor'],
        25 => ['ref' => 'CR20(2)',     'label' => 'Bulk Mixing Plant Operator'],
        26 => ['ref' => 'CR21(1)(b)', 'label' => 'Explosive Actuated Tool Operator'],
        27 => ['ref' => 'CR21(2)(b)', 'label' => 'Explosive Actuated Tool Inspector'],
        28 => ['ref' => 'CR21(2)(i)', 'label' => 'Explosive Actuated Tool Controller'],
        29 => ['ref' => 'CR23(K)',     'label' => 'Construction Vehicle Operator / Inspector'],
        30 => ['ref' => 'CR28(a)',     'label' => 'Stacking and Storage Supervisor'],
        31 => ['ref' => 'CR29(h)',     'label' => 'Fire Equipment Inspector'],
        32 => ['ref' => 'GAR9(2)',     'label' => 'Incident Investigator'],
        33 => ['ref' => 'GSR3(1)&(4)','label' => 'First Aider'],
        34 => ['ref' => '',            'label' => 'Radiation Protection Officer'],
    ]],
    'I' => ['title' => 'Section I — Advanced & Best Practice (Bonus)', 'items' => [
        1  => ['ref' => 'ISO 45001:2018', 'label' => 'ISO 45001 / OHSAS 18001 / NOSA Grade A Certification'],
        2  => ['ref' => 'OHS Act Sec 17', 'label' => 'Weekly Toolbox Talk Register'],
        3  => ['ref' => 'GAR 9',          'label' => 'Near Miss Reporting Register'],
        4  => ['ref' => 'Best Practice',  'label' => 'Behavioural-Based Safety Observation Programme'],
        5  => ['ref' => 'Best Practice',  'label' => 'Employee Assistance Programme (EAP)'],
        6  => ['ref' => 'NEMA',           'label' => 'Environmental Legal Register'],
        7  => ['ref' => 'NEMA / NEMWA',   'label' => 'Hazardous Waste Disposal Records'],
        8  => ['ref' => 'Best Practice',  'label' => 'Digital / Electronic Safety Record-Keeping System'],
        9  => ['ref' => 'OMP Reg.',       'label' => 'Occupational Health Surveillance Programme'],
        10 => ['ref' => 'Best Practice',  'label' => 'Monthly Safety Performance Report'],
    ]],
];

/* ── Template classification per item key ── */
// 'gen' = template document can be generated
// 'ext' = must be obtained from an external body (guidance provided instead)
function item_type(string $key): string {
    $ext = [
        'A.1','A.3','A.4','A.5','A.7',  // certs / govt / insurance / AST-issued
        'B.7',                           // SDS from chemical supplier
        'C.1',                           // medical certs from OHP
        'D.3','D.5','D.6',               // competency from trainer / AECI site induction
        'E.6',                           // subcontractor SHE files — sub provides
        'I.1',                           // ISO/NOSA cert — certifying body
        'I.5',                           // EAP — external provider
        'I.8',                           // digital system — vendor/software
        'I.9',                           // OHP medical surveillance records
    ];
    return in_array($key, $ext, true) ? 'ext' : 'gen';
}

function ext_guidance(string $key): string {
    $map = [
        'A.1' => 'Obtain from an accredited certification body (NOSA, BSI, SABS, SGS, etc.) or your industry association. NOSA Grading requires an on-site audit. ISO 45001 requires a SANAS-accredited auditor.',
        'A.3' => 'This appointment letter must be issued by <strong>Astute</strong> as the principal employer. Request it directly from your AST site contact or contract manager before work commences.',
        'A.4' => 'Obtain a current <strong>Letter of Good Standing</strong> from the <strong>Compensation Fund (DoEL)</strong> or your approved COIDA insurer. Register at <em>cf.labour.gov.za</em> or call 0800 030 007. Ensure your employer registration and annual assessments are up to date. The WCL2 form must be completed and signed.',
        'A.5' => 'A <strong>Construction Work Permit</strong> is issued by the <strong>Department of Employment and Labour</strong>. Required when: work exceeds 180 days, involves >1 800 person-days, or contract value ≥ R13 million. Submit the application (Form 18) to the nearest DoEL office at least 30 days before work starts.',
        'A.7' => 'Obtain a <strong>Public Liability Insurance</strong> certificate from your short-term insurer. AECI requires a minimum indemnity limit — confirm the amount with your AST contract manager. The certificate must name AECI / AST as additional insured.',
        'B.7' => 'Safety Data Sheets (SDS) must be obtained from <strong>each chemical / material supplier</strong> for every hazardous substance to be used on site. Request them directly from the supplier or download from their product portal. Ensure SDS version is current (within 5 years) and compliant with GHS/SANS 11014.',
        'C.1' => 'Medical Certificates of Fitness (Annexure 3 — OHS Act Construction Regulations) must be issued by an <strong>Occupational Medicine Practitioner (OMP)</strong> or Occupational Health Nurse Practitioner (OHNP). Use an accredited occupational health clinic. Certificates must be site/task-specific and renewed annually or when roles change.',
        'D.3' => 'Competency records must be issued by accredited <strong>training providers or professional bodies</strong> (CETA, TETA, MERSETA, etc.) aligned to your Training Matrix. Collect and file original certificates or certified copies. Ensure qualifications are registered on the NQF where applicable.',
        'D.5' => 'Fall Protection training records must be issued by a <strong>Fall Protection Planner registered with an accredited body</strong> (IOPSA, ASIB, CETA). Ensure training covers rescue procedures and is site-specific. Records must include attendee signatures, trainer credentials, and assessment results.',
        'D.6' => 'The <strong>AECI / site-specific induction</strong> is conducted by AECI or AST at the site. Contact your AST site representative to arrange induction sessions before any worker commences work. Retain signed attendance registers as evidence.',
        'E.6' => 'Proof that subcontractors meet SHE file requirements must be sourced <strong>directly from each subcontractor</strong>. Issue them with your SHE Specification (Section E.5 template) and require them to submit their own SHE file or compliance declaration before commencing work.',
        'I.1' => 'ISO 45001 / OHSAS 18001 certification requires a full audit by a <strong>SANAS-accredited certification body</strong>. NOSA Grade A requires an on-site NOSA evaluation. Both processes take 3–6 months. Contact NOSA (nosa.co.za), BSI (bsigroup.com), or SGS (sgs.com) for a quotation.',
        'I.5' => 'An <strong>Employee Assistance Programme (EAP)</strong> is typically provided by a specialist EAP provider (e.g. ICAS, CRS Group, Psy-Fi) or through your medical scheme. Arrange a contract with an EAP provider and issue a communication to all workers about the service (hotline number, services available, confidentiality).',
        'I.8' => 'A <strong>Digital Safety Record-Keeping System</strong> requires procurement of appropriate software (e.g. Donesafe, ecoOnline, Cority, or a custom solution). Alternatively, a structured SharePoint/Google Drive/OneDrive environment with controlled folders and version control may satisfy this criterion.',
        'I.9' => 'An <strong>Occupational Health Surveillance Programme</strong> must be established with a registered OMP or OHNP. This includes baseline and periodic medical surveillance aligned to SANS/OHSAS exposure profiles. Contact an accredited occupational health clinic to set up your programme.',
    ];
    return $map[$key] ?? 'Obtain this document from the relevant issuing authority or professional body.';
}

/* ── HTML helpers ── */
function h(string $s): string { return htmlspecialchars($s, ENT_QUOTES | ENT_HTML5, 'UTF-8'); }

function doc_header(string $title, string $doc_no, string $contractor, string $date_str): string {
    return '<div class="doc-hdr">
      <div class="doc-hdr-left">
        <div class="doc-title">' . h($title) . '</div>
        <div class="doc-meta">Doc No: ' . h($doc_no) . ' &nbsp;|&nbsp; Prepared for: <strong>' . h($contractor) . '</strong></div>
        <div class="doc-meta">Issue Date: ' . h($date_str) . ' &nbsp;|&nbsp; Review Date: ' . h(date('Y') + 1) . '-' . date('m-d', strtotime($date_str ?: 'today')) . '</div>
      </div>
      <div class="doc-hdr-stamp">TEMPLATE<br>Complete &amp; Sign</div>
    </div>';
}

function sig_block(string $role1 = 'Employer / Director', string $role2 = 'Employee / Appointee'): string {
    return '<table class="sig-tbl">
      <tr>
        <td><div class="sig-line"></div><div class="sig-lbl">' . h($role1) . '</div><div class="sig-lbl">Name: ___________________________</div><div class="sig-lbl">Date: ___________________________</div></td>
        <td><div class="sig-line"></div><div class="sig-lbl">' . h($role2) . '</div><div class="sig-lbl">Name: ___________________________</div><div class="sig-lbl">Date: ___________________________</div></td>
      </tr>
    </table>';
}

function empty_rows(int $n, int $cols): string {
    $out = '';
    for ($i = 0; $i < $n; $i++) {
        $out .= '<tr>' . str_repeat('<td>&nbsp;</td>', $cols) . '</tr>';
    }
    return $out;
}

/* ── Document template functions ── */

function tpl_policy_hs(string $contractor, string $date): string {
    return doc_header('Health, Safety & Environment (HSE) Policy', 'HSE-POL-001', $contractor, $date)
    . '<h3>1. Policy Statement</h3>
    <p><strong>' . h($contractor) . '</strong> is committed to providing and maintaining a safe and healthy working environment for all employees, contractors, visitors, and persons who may be affected by our operations. We recognise that the prevention of accidents, injuries, occupational diseases, and damage to property and the environment is both a legal obligation and a moral duty.</p>
    <h3>2. Commitments</h3>
    <p>Management commits to:</p>
    <ul>
      <li>Comply with all applicable health, safety, and environmental legislation, including the Occupational Health and Safety Act (Act 85 of 1993) and its Regulations.</li>
      <li>Identify, assess, and control all hazards and risks arising from our operations through documented risk assessments.</li>
      <li>Provide adequate resources — financial, human, and technical — to support the HSE programme.</li>
      <li>Consult and communicate with employees and their representatives on HSE matters.</li>
      <li>Provide appropriate training, instruction, and supervision to all employees.</li>
      <li>Investigate all incidents, near misses, and hazardous conditions, and implement corrective actions.</li>
      <li>Set and monitor HSE objectives and targets on an annual basis.</li>
      <li>Continuously review and improve the HSE Management System.</li>
    </ul>
    <h3>3. Employee Responsibilities</h3>
    <p>Every employee is responsible for:</p>
    <ul>
      <li>Complying with this policy, procedures, and safe work instructions.</li>
      <li>Reporting all incidents, near misses, and unsafe conditions without delay.</li>
      <li>Using and maintaining personal protective equipment (PPE) as required.</li>
      <li>Participating in HSE training, toolbox talks, and inductions.</li>
      <li>Refusing to perform any work they reasonably believe poses an imminent risk to themselves or others.</li>
    </ul>
    <h3>4. Review</h3>
    <p>This policy is reviewed annually or when significant changes occur to operations, legislation, or the organisation.</p>'
    . sig_block('Managing Director / Employer', 'SHE Representative');
}

function tpl_policy_drug_alcohol(string $contractor, string $date): string {
    return doc_header('Drug & Alcohol Policy', 'HR-POL-002', $contractor, $date)
    . '<h3>1. Purpose</h3>
    <p>This policy establishes ' . h($contractor) . '\'s commitment to a drug- and alcohol-free workplace to protect the health, safety, and wellbeing of all employees and persons affected by our operations.</p>
    <h3>2. Scope</h3>
    <p>This policy applies to all employees, contractors, and visitors while on company premises, client sites, or operating company/client vehicles or equipment.</p>
    <h3>3. Policy Provisions</h3>
    <ul>
      <li>No employee may report for duty, or remain on duty, while under the influence of alcohol or any prohibited substance.</li>
      <li>The possession, use, distribution, or sale of alcohol or illegal drugs on any company or client premises is prohibited.</li>
      <li>Employees taking prescribed medication that may impair performance must inform their supervisor before commencing work.</li>
    </ul>
    <h3>4. Testing</h3>
    <p>Random breath and substance testing will be conducted. All employees are required to cooperate. Refusal to be tested will be treated as a positive result. Testing may also be conducted after an incident, on reasonable suspicion, or as a condition of return-to-work after rehabilitation.</p>
    <h3>5. Consequences</h3>
    <p>An employee found to be in violation of this policy will be removed from the workplace and subjected to disciplinary proceedings, which may include dismissal in accordance with the company disciplinary code.</p>
    <h3>6. Rehabilitation</h3>
    <p>The company supports employees who voluntarily seek help for substance abuse. Employees are encouraged to approach the SHE Representative or HR in confidence. Voluntary disclosure prior to testing will be treated with discretion and support rather than discipline.</p>
    <h3>7. Return to Work</h3>
    <p>Any employee returning to work after rehabilitation must undergo a fitness-for-duty assessment before resuming work duties.</p>'
    . sig_block('Managing Director / Employer', 'SHE Representative');
}

function tpl_organogram(string $contractor, string $date): string {
    return doc_header('Company Organogram & Onsite Organogram', 'ORG-001', $contractor, $date)
    . '<h3>Instructions</h3>
    <p>Complete the organogram below showing the management structure and reporting lines for <strong>' . h($contractor) . '</strong>. A separate onsite organogram showing only personnel deployed to this site must also be completed.</p>
    <div style="border:1px solid #ccc;min-height:180px;padding:16px;text-align:center;background:#fafafa;">
      <p style="color:#999;font-size:10pt;margin:0 0 8px 0">[Insert Company Organogram here — showing MD/CEO → Management → Supervisors → Workers]</p>
      <table style="width:100%;border-collapse:collapse;font-size:9.5pt;">
        <tr><th colspan="3" style="border:1px solid #bbb;padding:6px;background:#e8e8e8">Company Organogram</th></tr>
        <tr><td style="border:1px solid #bbb;padding:6px;width:33%"><strong>Position:</strong><br>Managing Director / CEO<br><br>Name: _________________</td>
            <td style="border:1px solid #bbb;padding:6px;width:33%"><strong>Position:</strong><br>Operations Manager<br><br>Name: _________________</td>
            <td style="border:1px solid #bbb;padding:6px;width:33%"><strong>Position:</strong><br>SHE Manager / Representative<br><br>Name: _________________</td></tr>
        <tr><td style="border:1px solid #bbb;padding:6px"><strong>Position:</strong><br>Site Supervisor<br><br>Name: _________________</td>
            <td style="border:1px solid #bbb;padding:6px"><strong>Position:</strong><br>_________________<br><br>Name: _________________</td>
            <td style="border:1px solid #bbb;padding:6px"><strong>Position:</strong><br>_________________<br><br>Name: _________________</td></tr>
      </table>
    </div>
    <p style="margin-top:12px"><em>Note: Attach a separate organogram for onsite personnel showing only those deployed to this project.</em></p>'
    . sig_block('Managing Director', 'SHE Representative');
}

function tpl_activity_list(string $contractor, string $date): string {
    return doc_header('List of Main Activities — Scope of Work', 'RM-001', $contractor, $date)
    . '<h3>Instructions</h3>
    <p>List all main activities to be performed by ' . h($contractor) . ' according to the scope of work. Each activity will form the basis for Task Specific Risk Assessments.</p>
    <table class="reg-tbl">
      <thead><tr><th>#</th><th>Activity / Task</th><th>Location / Area</th><th>Frequency</th><th>Main Hazards Identified</th><th>RA Reference</th></tr></thead>
      <tbody>' . empty_rows(12, 6) . '</tbody>
    </table>'
    . sig_block('Responsible Person', 'SHE Representative');
}

function tpl_risk_register(string $contractor, string $date): string {
    return doc_header('Risk Register — Task Specific Risk Assessments', 'RM-002', $contractor, $date)
    . '<h3>Risk Rating Matrix</h3>
    <table style="width:auto;margin-bottom:10px;" class="reg-tbl">
      <thead><tr><th>Severity</th><th>Likelihood</th><th>Risk Rating = S × L</th></tr></thead>
      <tbody>
        <tr><td>1 = Insignificant  2 = Minor  3 = Moderate  4 = Major  5 = Catastrophic</td>
            <td>1 = Rare  2 = Unlikely  3 = Possible  4 = Likely  5 = Almost Certain</td>
            <td>1–4 = Low (Green)  5–9 = Medium (Amber)  10–16 = High (Red)  17–25 = Critical (Purple)</td></tr>
      </tbody>
    </table>
    <table class="reg-tbl" style="font-size:8.5pt;">
      <thead><tr><th>#</th><th>Task / Activity</th><th>Hazard</th><th>Risk / Consequence</th><th>Who is at Risk</th><th>Existing Controls</th><th>S</th><th>L</th><th>Rating</th><th>Additional Controls</th><th>Responsible</th><th>Due Date</th><th>Residual S</th><th>Residual L</th><th>Residual Rating</th></tr></thead>
      <tbody>' . empty_rows(10, 15) . '</tbody>
    </table>'
    . sig_block('Risk Assessor', 'SHE Representative');
}

function tpl_baseline_ra(string $contractor, string $date): string {
    return doc_header('Baseline Risk Assessment', 'RM-003', $contractor, $date)
    . '<h3>1. Scope & Purpose</h3>
    <p>This Baseline Risk Assessment identifies all significant hazards associated with the activities of <strong>' . h($contractor) . '</strong> at the project site. It forms the foundation for all subsequent task-specific and continuous risk assessments.</p>
    <h3>2. Assessment Team</h3>
    <table class="reg-tbl" style="width:60%">
      <thead><tr><th>Name</th><th>Designation</th><th>Signature</th></tr></thead>
      <tbody>' . empty_rows(4, 3) . '</tbody>
    </table>
    <h3>3. Hazard Identification & Risk Assessment</h3>
    <table class="reg-tbl" style="font-size:8.5pt;">
      <thead><tr><th>#</th><th>Hazard Category</th><th>Specific Hazard</th><th>Potential Consequence</th><th>Existing Controls</th><th>Risk Rating (Before)</th><th>Additional Controls Required</th><th>Risk Rating (After)</th><th>Responsible Person</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>Physical</td><td>Falls from height</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
        <tr><td>2</td><td>Physical</td><td>Struck by objects</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
        <tr><td>3</td><td>Electrical</td><td>Live electrical contact</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
        <tr><td>4</td><td>Mechanical</td><td>Caught in/between machinery</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
        <tr><td>5</td><td>Chemical</td><td>Hazardous substance exposure</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
        <tr><td>6</td><td>Ergonomic</td><td>Manual handling / repetitive motion</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
        <tr><td>7</td><td>Fire</td><td>Fire / explosion</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
        <tr><td>8</td><td>Environmental</td><td>Spills / contamination</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
        ' . empty_rows(4, 9) . '
      </tbody>
    </table>
    <h3>4. Review Frequency</h3>
    <p>This Baseline Risk Assessment will be reviewed annually, after a significant incident, when there are changes to the scope of work, or when new hazards are identified.</p>'
    . sig_block('Risk Assessor', 'SHE Representative / Manager');
}

function tpl_continuous_ra(string $contractor, string $date): string {
    return doc_header('Continuous / Daily Risk Assessment', 'RM-004', $contractor, $date)
    . '<p style="font-size:9pt;color:#555">Complete this form at the start of each shift / work session before commencing work.</p>
    <table class="reg-tbl">
      <tr><td><strong>Date:</strong></td><td>________________</td><td><strong>Site / Location:</strong></td><td>________________</td><td><strong>Weather:</strong></td><td>________________</td></tr>
      <tr><td><strong>Supervisor:</strong></td><td>________________</td><td><strong>Team Size:</strong></td><td>________________</td><td><strong>Scope Today:</strong></td><td>________________</td></tr>
    </table>
    <table class="reg-tbl" style="margin-top:10px;font-size:9pt;">
      <thead><tr><th>#</th><th>Hazard Identified</th><th>Risk Level (H/M/L)</th><th>Control Measure Applied</th><th>PPE Required</th><th>Safe to Proceed?</th></tr></thead>
      <tbody>' . empty_rows(8, 6) . '</tbody>
    </table>
    <h3>Team Attendance & Acknowledgement</h3>
    <p style="font-size:9pt">I confirm I have been made aware of the hazards and controls for today\'s work and will comply with all safety requirements.</p>
    <table class="reg-tbl">
      <thead><tr><th>#</th><th>Full Name</th><th>Designation</th><th>Signature</th><th>Time</th></tr></thead>
      <tbody>' . empty_rows(10, 5) . '</tbody>
    </table>'
    . sig_block('Supervisor', 'SHE Representative');
}

function tpl_risk_review_plan(string $contractor, string $date): string {
    return doc_header('Risk Review Plan', 'RM-005', $contractor, $date)
    . '<h3>Purpose</h3>
    <p>This plan sets out the schedule and triggers for reviewing risk assessments for ' . h($contractor) . '\'s operations to ensure they remain current, accurate, and effective.</p>
    <h3>Scheduled Reviews</h3>
    <table class="reg-tbl">
      <thead><tr><th>RA Reference</th><th>RA Title</th><th>Review Frequency</th><th>Next Review Date</th><th>Responsible Person</th><th>Status</th><th>Sign-off</th></tr></thead>
      <tbody>
        <tr><td>RM-002</td><td>Task Specific Risk Assessments</td><td>Annually / on scope change</td><td>________________</td><td>________________</td><td>________________</td><td>________________</td></tr>
        <tr><td>RM-003</td><td>Baseline Risk Assessment</td><td>Annually</td><td>________________</td><td>________________</td><td>________________</td><td>________________</td></tr>
        <tr><td>RM-004</td><td>Continuous Risk Assessment</td><td>Daily (each shift)</td><td>Ongoing</td><td>Site Supervisor</td><td>Ongoing</td><td>________________</td></tr>
        ' . empty_rows(5, 7) . '
      </tbody>
    </table>
    <h3>Trigger-Based Reviews</h3>
    <p>In addition to scheduled reviews, all risk assessments must be reviewed when any of the following occur:</p>
    <ul>
      <li>A fatality, serious injury, or near-miss incident</li>
      <li>A significant change in scope, methods, or materials</li>
      <li>Introduction of new equipment, chemicals, or processes</li>
      <li>A change in legislation or regulatory requirements</li>
      <li>Feedback from a SHE inspection or audit</li>
    </ul>'
    . sig_block('Risk Assessor / SHE Manager', 'Director');
}

function tpl_sop(string $contractor, string $date): string {
    return doc_header('Safe Work / Operating Procedure (SOP) — Template', 'SOP-XXX', $contractor, $date)
    . '<p style="color:#d35;font-size:9pt;"><em>Copy this template for each task/activity and complete all sections. File in the SOP register.</em></p>
    <table class="reg-tbl" style="width:70%">
      <tr><td><strong>Task / Activity:</strong></td><td>________________________________</td></tr>
      <tr><td><strong>SOP Number:</strong></td><td>SOP-_____</td></tr>
      <tr><td><strong>Location / Equipment:</strong></td><td>________________________________</td></tr>
      <tr><td><strong>Applicable RA:</strong></td><td>RM-______</td></tr>
      <tr><td><strong>PPE Required:</strong></td><td>________________________________</td></tr>
      <tr><td><strong>Prepared by:</strong></td><td>________________  Date: ____________</td></tr>
      <tr><td><strong>Approved by:</strong></td><td>________________  Date: ____________</td></tr>
    </table>
    <h3>Step-by-Step Instructions</h3>
    <table class="reg-tbl">
      <thead><tr><th>#</th><th>Step Description</th><th>Hazard at this Step</th><th>Control Measure</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>Pre-task briefing &amp; tool/equipment check</td><td></td><td></td></tr>
        <tr><td>2</td><td>PPE donned and inspected</td><td></td><td></td></tr>
        <tr><td>3</td><td>Work area barricaded / permits obtained</td><td></td><td></td></tr>
        ' . empty_rows(7, 4) . '
        <tr><td></td><td>Post-task housekeeping &amp; debrief</td><td></td><td></td></tr>
      </tbody>
    </table>
    <h3>Emergency Contacts</h3>
    <table class="reg-tbl" style="width:60%">
      <tr><td>Site Emergency Number:</td><td>________________</td></tr>
      <tr><td>First Aider on Duty:</td><td>________________</td></tr>
      <tr><td>Nearest Medical Facility:</td><td>________________</td></tr>
    </table>'
    . sig_block('SHE Representative', 'Supervisor');
}

function tpl_induction_register(string $contractor, string $date): string {
    return doc_header('Company Induction Register', 'TR-001', $contractor, $date)
    . '<table class="reg-tbl" style="width:70%">
      <tr><td><strong>Induction Date:</strong></td><td>________________</td></tr>
      <tr><td><strong>Presenter / Trainer:</strong></td><td>________________</td></tr>
      <tr><td><strong>Site / Location:</strong></td><td>________________</td></tr>
    </table>
    <h3>Topics Covered</h3>
    <div style="column-count:2;column-gap:20px;font-size:9.5pt;">
      <p>&#9744; Company HSE Policy<br>&#9744; Emergency procedures<br>&#9744; Fire extinguisher locations<br>&#9744; First aid facilities<br>&#9744; Incident reporting procedure<br>&#9744; Housekeeping standards</p>
      <p>&#9744; PPE requirements<br>&#9744; Drug &amp; Alcohol Policy<br>&#9744; Hazardous substances on site<br>&#9744; No-go areas / exclusion zones<br>&#9744; Disciplinary consequences<br>&#9744; Rights and obligations (OHS Act)</p>
    </div>
    <h3>Attendance Register</h3>
    <table class="reg-tbl">
      <thead><tr><th>#</th><th>Full Name</th><th>ID Number</th><th>Designation</th><th>Department</th><th>Signature</th><th>Date</th></tr></thead>
      <tbody>' . empty_rows(15, 7) . '</tbody>
    </table>'
    . sig_block('Trainer / Presenter', 'Supervisor / Manager');
}

function tpl_training_matrix(string $contractor, string $date): string {
    return doc_header('Training Matrix', 'TR-002', $contractor, $date)
    . '<p style="font-size:9pt;color:#555">List all roles and required training/certifications. Use ✓ for completed, "dd/mm/yy" for expiry dates, and ✗ for outstanding.</p>
    <table class="reg-tbl" style="font-size:8.5pt;">
      <thead>
        <tr>
          <th rowspan="2">Employee Name</th>
          <th rowspan="2">Designation</th>
          <th colspan="8">Required Training / Certifications</th>
        </tr>
        <tr>
          <th>Induction</th><th>First Aid</th><th>Fire Fighting</th><th>Working at Heights</th><th>Forklift / Crane</th><th>Risk Assessment</th><th>PPE Use</th><th>Other</th>
        </tr>
      </thead>
      <tbody>' . empty_rows(15, 10) . '</tbody>
    </table>'
    . sig_block('Training Coordinator / SHE Rep', 'Manager');
}

function tpl_hs_plan(string $contractor, string $date): string {
    return doc_header('Health & Safety Plan', 'HSE-PLAN-001', $contractor, $date)
    . '<h3>1. Project Information</h3>
    <table class="reg-tbl" style="width:80%">
      <tr><td><strong>Project Name:</strong></td><td>________________</td></tr>
      <tr><td><strong>Client / Principal Contractor:</strong></td><td>Astute</td></tr>
      <tr><td><strong>Contractor:</strong></td><td>' . h($contractor) . '</td></tr>
      <tr><td><strong>Site Address:</strong></td><td>________________</td></tr>
      <tr><td><strong>Start Date:</strong></td><td>________________</td></tr>
      <tr><td><strong>Planned End Date:</strong></td><td>________________</td></tr>
      <tr><td><strong>Project Manager:</strong></td><td>________________</td></tr>
      <tr><td><strong>SHE Representative:</strong></td><td>________________</td></tr>
    </table>
    <h3>2. Scope of Work Summary</h3>
    <p style="border:1px solid #ccc;min-height:60px;padding:8px;">___________________________________________________________________</p>
    <h3>3. Risk Profile</h3>
    <p>The following significant risks have been identified for this project (refer to Baseline RA and Task Specific RAs):</p>
    <table class="reg-tbl">
      <thead><tr><th>#</th><th>Risk</th><th>Control Measure</th><th>Responsible</th></tr></thead>
      <tbody>' . empty_rows(6, 4) . '</tbody>
    </table>
    <h3>4. Key SHE Requirements</h3>
    <ul>
      <li>All workers must have a valid site induction before commencing work.</li>
      <li>Daily Continuous Risk Assessments must be conducted at the start of each shift.</li>
      <li>All incidents must be reported to the Site Supervisor within 1 hour.</li>
      <li>PPE is mandatory in all designated areas — non-compliance will result in removal from site.</li>
      <li>Weekly toolbox talks are compulsory. Attendance registers must be filed.</li>
      <li>No alcohol or drugs on site at any time.</li>
    </ul>
    <h3>5. Emergency Contacts</h3>
    <table class="reg-tbl" style="width:60%">
      <tr><td>Emergency Services:</td><td>10177 / 112</td></tr>
      <tr><td>Site Emergency Number:</td><td>________________</td></tr>
      <tr><td>Nearest Hospital:</td><td>________________</td></tr>
      <tr><td>AST Site Contact:</td><td>________________</td></tr>
    </table>
    <h3>6. SHE Plan Review</h3>
    <p>This plan will be reviewed monthly and updated as scope or risk profile changes.</p>'
    . sig_block('Contractor Managing Director', 'AST Site Representative');
}

function tpl_env_plan(string $contractor, string $date): string {
    return doc_header('Environmental Management Plan (EMP)', 'ENV-PLAN-001', $contractor, $date)
    . '<h3>1. Purpose & Scope</h3>
    <p>This EMP outlines the environmental management measures to be implemented by <strong>' . h($contractor) . '</strong> during operations at the project site, in compliance with NEMA (Act 107 of 1998) and applicable environmental regulations.</p>
    <h3>2. Key Environmental Aspects & Controls</h3>
    <table class="reg-tbl">
      <thead><tr><th>#</th><th>Environmental Aspect</th><th>Potential Impact</th><th>Control Measure</th><th>Responsible Person</th><th>Monitoring Frequency</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>Waste generation</td><td>Soil / water contamination</td><td>Segregated waste skips, licensed disposal contractor</td><td></td><td>Daily</td></tr>
        <tr><td>2</td><td>Hazardous chemical storage</td><td>Spill / contamination</td><td>Bunded storage, spill kits on site, SDS available</td><td></td><td>Daily</td></tr>
        <tr><td>3</td><td>Dust generation</td><td>Air quality, nuisance</td><td>Water suppression, wind screens, restrict cut/grind outdoors in wind</td><td></td><td>As required</td></tr>
        <tr><td>4</td><td>Noise</td><td>Community / worker hearing</td><td>Restrict noisy operations to agreed hours, hearing PPE</td><td></td><td>As required</td></tr>
        <tr><td>5</td><td>Stormwater runoff</td><td>Waterway contamination</td><td>Berms, sumps, no cement/chemical near drains</td><td></td><td>After rainfall</td></tr>
        ' . empty_rows(4, 6) . '
      </tbody>
    </table>
    <h3>3. Spill Response</h3>
    <p>In the event of a chemical spill: (1) Isolate the source; (2) Deploy spill kit; (3) Prevent entry to drains; (4) Notify supervisor immediately; (5) Record in incident register.</p>
    <h3>4. Waste Management</h3>
    <p>All waste streams must be segregated (general, recyclable, hazardous). Hazardous waste must be disposed of via a licensed contractor with manifests/consignment notes retained.</p>'
    . sig_block('Environmental Officer / SHE Rep', 'Project Manager');
}

function tpl_fall_protection_plan(string $contractor, string $date): string {
    return doc_header('Fall Protection Plan (FPP)', 'FPP-001', $contractor, $date)
    . '<p style="background:#fff3cd;border:1px solid #ffc107;padding:8px;border-radius:4px;font-size:9.5pt;"><strong>Note:</strong> This plan must be prepared by a registered Fall Protection Planner (CR10(1)a). Complete all sections before any work at height commences.</p>
    <h3>1. Work at Height Locations</h3>
    <table class="reg-tbl">
      <thead><tr><th>#</th><th>Location / Area</th><th>Height (m)</th><th>Access Method</th><th>FPE Required</th><th>Rescue Plan Ref</th></tr></thead>
      <tbody>' . empty_rows(6, 6) . '</tbody>
    </table>
    <h3>2. Fall Prevention Methods</h3>
    <ul>
      <li>Preferred hierarchy: elimination → passive (barriers/guardrails) → fall restraint → fall arrest → rescue.</li>
      <li>Guardrails: top rail 1.0 m, mid-rail 0.5 m, toe board 0.15 m minimum.</li>
      <li>Harnesses: full-body harness, double lanyard, shock absorber — checked before each use.</li>
      <li>Anchor points: load rated ≥ 15 kN — confirmed by competent person in writing.</li>
    </ul>
    <h3>3. Fall Protection Equipment (FPE) Register</h3>
    <table class="reg-tbl">
      <thead><tr><th>#</th><th>Equipment Type</th><th>Serial No.</th><th>Inspection Date</th><th>Inspector</th><th>Condition</th><th>Next Inspection</th></tr></thead>
      <tbody>' . empty_rows(8, 7) . '</tbody>
    </table>
    <h3>4. Rescue Plan Summary</h3>
    <p>In the event of a fall / suspension: (1) Do not leave the suspended person; (2) Call site emergency number (________________); (3) Implement rescue procedure [attach rescue plan]; (4) Administer first aid; (5) Report incident.</p>
    <h3>5. Training Records</h3>
    <p>All persons working at height must have valid training records. Refer to Training Matrix TR-002.</p>'
    . sig_block('Fall Protection Planner (Reg. No.: ____)', 'Project Manager');
}

function tpl_contractor_mgmt(string $contractor, string $date): string {
    return doc_header('Contractor Management Procedure', 'CMR-001', $contractor, $date)
    . '<h3>1. Purpose</h3>
    <p>This procedure governs how <strong>' . h($contractor) . '</strong> manages subcontractors to ensure compliance with the OHS Act, Construction Regulations, and site-specific HSE requirements.</p>
    <h3>2. Subcontractor Pre-qualification</h3>
    <p>Before engaging any subcontractor, the following must be verified and filed:</p>
    <ul>
      <li>Valid Letter of Good Standing (COIDA)</li>
      <li>Public Liability Insurance certificate</li>
      <li>CIDB grading appropriate to the work scope</li>
      <li>Current SHE Management System evidence (policy, risk assessments)</li>
    </ul>
    <h3>3. Subcontractor SHE File Requirements</h3>
    <p>All subcontractors must submit a SHE file aligned to the BF-SHE-FRM-010 checklist before commencing work on site. Principal contractor must issue the HSE Specification to every subcontractor.</p>
    <h3>4. Subcontractor Register</h3>
    <table class="reg-tbl">
      <thead><tr><th>#</th><th>Subcontractor Name</th><th>Scope</th><th>SHE File Submitted?</th><th>LoGS Expiry</th><th>Approved By</th><th>Date</th></tr></thead>
      <tbody>' . empty_rows(8, 7) . '</tbody>
    </table>
    <h3>5. Ongoing Monitoring</h3>
    <p>Subcontractor compliance will be monitored through weekly site inspections, incident reporting obligations, and monthly SHE file reviews.</p>'
    . sig_block('Site Manager', 'SHE Representative');
}

function tpl_incident_procedure(string $contractor, string $date): string {
    return doc_header('Incident Management Procedure', 'IMS-001', $contractor, $date)
    . '<h3>1. Purpose</h3>
    <p>To ensure all incidents, near misses, first-aid cases, and dangerous occurrences are reported, investigated, and corrective actions implemented in a timely manner.</p>
    <h3>2. Classification</h3>
    <table class="reg-tbl" style="width:80%">
      <thead><tr><th>Type</th><th>Definition</th><th>Report Within</th><th>Who Notified</th></tr></thead>
      <tbody>
        <tr><td>Fatality</td><td>Death resulting from work-related incident</td><td>Immediately</td><td>DoEL + AST + Regulator</td></tr>
        <tr><td>Serious Injury</td><td>Hospitalisation &gt; 14 days or permanent disability</td><td>24 hours</td><td>DoEL + AST Manager</td></tr>
        <tr><td>Lost-Time Injury</td><td>Injury resulting in absence from work &gt; 1 shift</td><td>24 hours</td><td>Site Manager + SHE Rep</td></tr>
        <tr><td>Medical Treatment</td><td>Requires medical treatment beyond first aid</td><td>24 hours</td><td>Site Manager</td></tr>
        <tr><td>First Aid</td><td>Minor injury treated on site</td><td>24 hours</td><td>SHE Rep</td></tr>
        <tr><td>Near Miss</td><td>Incident with potential for harm but no injury</td><td>24 hours</td><td>Supervisor + SHE Rep</td></tr>
      </tbody>
    </table>
    <h3>3. Reporting Steps</h3>
    <ol>
      <li>Secure the scene and render first aid / emergency response.</li>
      <li>Notify supervisor immediately (verbally, then in writing within time limit above).</li>
      <li>Complete the Incident Report Form (IRF-001) — do not alter the scene until investigation is complete.</li>
      <li>Conduct investigation using the 5-Why or Cause-and-Effect method.</li>
      <li>Implement corrective actions and record in the Corrective Action Register.</li>
      <li>Close out corrective actions and verify effectiveness within 30 days.</li>
      <li>Report statutory incidents (fatalities / serious injuries) to the DoEL within 7 days using WCL form.</li>
    </ol>'
    . sig_block('SHE Manager / Representative', 'Managing Director');
}

function tpl_incident_stats(string $contractor, string $date): string {
    return doc_header('24-Month Incident Statistics', 'IMS-002', $contractor, $date)
    . '<p style="font-size:9pt;color:#555">Record all workplace incidents by month for the past 24 months. Calculate LTIFR = (LTIs × 200 000) ÷ Hours Worked.</p>
    <table class="reg-tbl" style="font-size:8.5pt;">
      <thead>
        <tr><th>Month / Year</th><th>Hours Worked</th><th>Fatalities</th><th>Serious Injuries</th><th>LTIs</th><th>MTIs</th><th>FAIs</th><th>Near Misses</th><th>Dangerous Occurrences</th><th>LTIFR</th><th>Notes</th></tr>
      </thead>
      <tbody>' . empty_rows(24, 11) . '
        <tr style="font-weight:bold"><td>TOTAL</td>' . str_repeat('<td></td>', 10) . '</tr>
      </tbody>
    </table>
    <p style="font-size:9pt">LTI = Lost Time Injury &nbsp;|&nbsp; MTI = Medical Treatment Injury &nbsp;|&nbsp; FAI = First Aid Injury &nbsp;|&nbsp; LTIFR = Lost Time Injury Frequency Rate</p>'
    . sig_block('SHE Representative', 'Operations Manager');
}

function tpl_ppe_procedure(string $contractor, string $date): string {
    return doc_header('PPE Management Procedure', 'PPE-PROC-001', $contractor, $date)
    . '<h3>1. Purpose & Scope</h3>
    <p>This procedure ensures that appropriate Personal Protective Equipment (PPE) is identified, issued, maintained, and inspected for all workers of <strong>' . h($contractor) . '</strong>.</p>
    <h3>2. PPE Selection</h3>
    <p>PPE is selected based on the Baseline and Task Specific Risk Assessments. The following minimum PPE is required on site at all times:</p>
    <table class="reg-tbl" style="width:70%">
      <thead><tr><th>PPE Item</th><th>Standard</th><th>Required For</th></tr></thead>
      <tbody>
        <tr><td>Safety Helmet</td><td>SANS 1397</td><td>All workers</td></tr>
        <tr><td>Safety Boots</td><td>SANS 20345</td><td>All workers</td></tr>
        <tr><td>High-Visibility Vest</td><td>SANS 1703</td><td>All workers</td></tr>
        <tr><td>Safety Glasses</td><td>SANS 1404</td><td>As per RA</td></tr>
        <tr><td>Hearing Protection</td><td>SANS 13822</td><td>As per RA</td></tr>
        <tr><td>Gloves</td><td>As specified per task</td><td>As per RA</td></tr>
        <tr><td>Dust Mask / Respirator</td><td>SANS 1411</td><td>As per RA</td></tr>
        <tr><td>Fall Arrest Harness</td><td>SANS 50361</td><td>Work at height &gt; 2m</td></tr>
      </tbody>
    </table>
    <h3>3. Issue, Inspection & Replacement</h3>
    <ul>
      <li>PPE is issued at induction and recorded on the PPE Issuance Register (PPE-REG-001).</li>
      <li>Workers are trained on correct use, limitations, and care of PPE at induction and during toolbox talks.</li>
      <li>PPE is inspected before each use. Damaged or worn PPE must be replaced immediately at no cost to the worker.</li>
      <li>Monthly inspections are recorded on the PPE Inspection Register (PPE-REG-002).</li>
    </ul>'
    . sig_block('SHE Representative', 'Supervisor');
}

function tpl_ppe_training_register(string $contractor, string $date): string {
    return doc_header('PPE Training Register', 'PPE-REG-003', $contractor, $date)
    . '<table class="reg-tbl" style="width:70%">
      <tr><td><strong>Training Date:</strong></td><td>________________</td><td><strong>Trainer:</strong></td><td>________________</td></tr>
      <tr><td><strong>PPE Types Covered:</strong></td><td colspan="3">________________</td></tr>
    </table>
    <h3>Attendance Register</h3>
    <table class="reg-tbl">
      <thead><tr><th>#</th><th>Full Name</th><th>Designation</th><th>PPE Assigned</th><th>Understands Use</th><th>Signature</th><th>Date</th></tr></thead>
      <tbody>' . empty_rows(15, 7) . '</tbody>
    </table>'
    . sig_block('Trainer', 'SHE Representative');
}

function tpl_ppe_issue_register(string $contractor, string $date): string {
    return doc_header('PPE Issuance Register', 'PPE-REG-001', $contractor, $date)
    . '<table class="reg-tbl" style="font-size:8.5pt;">
      <thead><tr><th>#</th><th>Employee Name</th><th>ID / Emp No.</th><th>Designation</th><th>Helmet</th><th>Boots</th><th>Hi-Vis Vest</th><th>Glasses</th><th>Gloves</th><th>Hearing Prot.</th><th>Harness</th><th>Other</th><th>Issue Date</th><th>Employee Signature</th><th>Supervisor Signature</th></tr></thead>
      <tbody>' . empty_rows(15, 15) . '</tbody>
    </table>'
    . sig_block('Store / SHE Representative', 'Supervisor');
}

function tpl_ppe_inspection(string $contractor, string $date): string {
    return doc_header('PPE Inspection Register', 'PPE-REG-002', $contractor, $date)
    . '<p style="font-size:9pt;color:#555">Inspect all PPE monthly. Use: G = Good, R = Replacement Required, D = Destroyed/Disposed</p>
    <table class="reg-tbl" style="font-size:8.5pt;">
      <thead><tr><th>Month</th><th>Employee Name</th><th>Helmet</th><th>Boots</th><th>Hi-Vis</th><th>Glasses</th><th>Gloves</th><th>Hearing</th><th>Harness</th><th>Other</th><th>Defects Noted</th><th>Action Taken</th><th>Inspector</th><th>Signature</th></tr></thead>
      <tbody>' . empty_rows(15, 14) . '</tbody>
    </table>'
    . sig_block('Inspector', 'SHE Representative');
}

function tpl_equipment_register(string $contractor, string $date): string {
    return doc_header('Equipment Register', 'EQP-REG-001', $contractor, $date)
    . '<table class="reg-tbl" style="font-size:8.5pt;">
      <thead><tr><th>#</th><th>Equipment Type</th><th>Make / Model</th><th>Serial No.</th><th>Registration No.</th><th>Owned / Hired</th><th>Date On Site</th><th>Last Statutory Inspection</th><th>Next Inspection Due</th><th>Operator / Driver</th><th>Operator Licence No.</th><th>Status (Active/Off-site)</th></tr></thead>
      <tbody>' . empty_rows(15, 12) . '</tbody>
    </table>'
    . sig_block('Plant Manager / SHE Rep', 'Site Manager');
}

function tpl_inspection_schedule(string $contractor, string $date): string {
    return doc_header('Statutory & Mandatory Inspection Schedule', 'EQP-INSP-001', $contractor, $date)
    . '<p style="font-size:9pt;color:#555">List all equipment requiring statutory inspections and schedule them to ensure legal compliance.</p>
    <table class="reg-tbl" style="font-size:8.5pt;">
      <thead><tr><th>#</th><th>Equipment</th><th>Regulation / Standard</th><th>Inspection Type</th><th>Frequency</th><th>Inspecting Body / Person</th><th>Last Done</th><th>Next Due</th><th>Certificate No.</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>Scaffold</td><td>CR16</td><td>Before use &amp; weekly</td><td>Weekly</td><td>Competent person</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>2</td><td>Lifting Equipment</td><td>MHSA / GMR 18</td><td>Annual statutory</td><td>Annual</td><td>Approved Inspection Authority</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>3</td><td>Pressure Vessels</td><td>OHSA Reg.</td><td>Annual statutory</td><td>Annual</td><td>Approved Inspection Authority</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>4</td><td>Fire Extinguishers</td><td>SANS 1475</td><td>Annual service</td><td>Annual</td><td>Registered service provider</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>5</td><td>Company Vehicles</td><td>NRTA</td><td>Roadworthy certificate</td><td>Annual</td><td>Roadworthy testing station</td><td></td><td></td><td></td><td></td></tr>
        ' . empty_rows(8, 10) . '
      </tbody>
    </table>'
    . sig_block('Plant / Equipment Manager', 'SHE Representative');
}

function tpl_maintenance_records(string $contractor, string $date): string {
    return doc_header('Maintenance Records', 'EQP-MAINT-001', $contractor, $date)
    . '<table class="reg-tbl" style="font-size:8.5pt;">
      <thead><tr><th>#</th><th>Equipment / Asset</th><th>Serial No.</th><th>Date of Maintenance</th><th>Type (Scheduled/Breakdown)</th><th>Work Performed</th><th>Parts Replaced</th><th>Service Provider</th><th>Cost (R)</th><th>Performed By</th><th>Next Service Due</th><th>Sign-off</th></tr></thead>
      <tbody>' . empty_rows(15, 12) . '</tbody>
    </table>'
    . sig_block('Maintenance Supervisor', 'Plant Manager');
}

function tpl_emergency_procedure(string $contractor, string $date): string {
    return doc_header('Emergency Preparedness Procedure', 'ERP-001', $contractor, $date)
    . '<h3>1. Purpose</h3>
    <p>To ensure <strong>' . h($contractor) . '</strong> is prepared to respond effectively to emergency situations that may arise at the project site.</p>
    <h3>2. Emergency Contacts</h3>
    <table class="reg-tbl" style="width:70%">
      <tr><td>Emergency Services (Fire / Medical):</td><td>10177 / 112</td></tr>
      <tr><td>Police:</td><td>10111</td></tr>
      <tr><td>Site Emergency Number:</td><td>________________</td></tr>
      <tr><td>First Aider on Site:</td><td>________________ — Cell: ________________</td></tr>
      <tr><td>Nearest Hospital / Clinic:</td><td>________________</td></tr>
      <tr><td>Ambulance:</td><td>________________</td></tr>
      <tr><td>AST Site Contact:</td><td>________________</td></tr>
      <tr><td>Site Manager:</td><td>________________ — Cell: ________________</td></tr>
    </table>
    <h3>3. Emergency Assembly Points</h3>
    <p>Assembly Point 1: ________________ &nbsp;&nbsp; Assembly Point 2: ________________</p>
    <h3>4. Emergency Scenarios & Response</h3>
    <table class="reg-tbl">
      <thead><tr><th>Scenario</th><th>Immediate Actions</th><th>Notify</th></tr></thead>
      <tbody>
        <tr><td><strong>Fire</strong></td><td>1. Raise alarm. 2. Evacuate to assembly point. 3. Call 10177. 4. Only fight fire if safe and trained. 5. Do not re-enter until declared safe.</td><td>Emergency Services + AST</td></tr>
        <tr><td><strong>Medical Emergency</strong></td><td>1. Call first aider. 2. Call 10177 or transport to hospital. 3. Do not move if spinal injury suspected. 4. Complete incident form.</td><td>Site Manager + AST</td></tr>
        <tr><td><strong>Chemical Spill</strong></td><td>1. Evacuate downwind. 2. Contain spill. 3. Refer to SDS. 4. Notify environmental officer.</td><td>Site Manager + AST + DoE</td></tr>
        <tr><td><strong>Structural Collapse</strong></td><td>1. Evacuate area. 2. Call 10177. 3. Secure perimeter. 4. Do not enter until engineer clears.</td><td>Emergency Services + AST + DoEL</td></tr>
        <tr><td><strong>Bomb Threat</strong></td><td>1. Do not touch suspicious objects. 2. Evacuate. 3. Call SAPS (10111). 4. Do not re-enter.</td><td>SAPS + AST</td></tr>
      </tbody>
    </table>
    <h3>5. Training</h3>
    <p>All workers must be trained on emergency procedures at induction and during the annual emergency drill. Training attendance must be recorded.</p>'
    . sig_block('SHE Manager / Representative', 'Managing Director');
}

function tpl_drill_schedule(string $contractor, string $date): string {
    return doc_header('Emergency Drill Schedule & Records', 'ERP-002', $contractor, $date)
    . '<h3>Annual Drill Schedule</h3>
    <table class="reg-tbl">
      <thead><tr><th>#</th><th>Drill Type</th><th>Planned Date</th><th>Actual Date</th><th>Time (Start/End)</th><th>Participants</th><th>Drill Coordinator</th><th>Outcome / Deficiencies</th><th>Corrective Action</th><th>Sign-off</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>Fire Evacuation</td><td>Q1 ________</td>' . str_repeat('<td></td>', 7) . '</tr>
        <tr><td>2</td><td>Medical Emergency</td><td>Q2 ________</td>' . str_repeat('<td></td>', 7) . '</tr>
        <tr><td>3</td><td>Chemical Spill</td><td>Q3 ________</td>' . str_repeat('<td></td>', 7) . '</tr>
        <tr><td>4</td><td>Full Emergency</td><td>Q4 ________</td>' . str_repeat('<td></td>', 7) . '</tr>
      </tbody>
    </table>
    <h3>Drill Attendance Register</h3>
    <p style="font-size:9pt;color:#555">Complete one register per drill conducted.</p>
    <table class="reg-tbl">
      <tr><td><strong>Drill Type:</strong></td><td>________________</td><td><strong>Date:</strong></td><td>________________</td><td><strong>Duration:</strong></td><td>________________</td></tr>
    </table>
    <table class="reg-tbl" style="margin-top:8px">
      <thead><tr><th>#</th><th>Full Name</th><th>Designation</th><th>Signature</th><th>Comments</th></tr></thead>
      <tbody>' . empty_rows(12, 5) . '</tbody>
    </table>'
    . sig_block('Drill Coordinator', 'SHE Representative');
}

function tpl_fire_equipment_log(string $contractor, string $date): string {
    return doc_header('Fire Equipment Inspection & Maintenance Log', 'FEQ-LOG-001', $contractor, $date)
    . '<table class="reg-tbl" style="font-size:8.5pt;">
      <thead><tr><th>#</th><th>Equipment Type</th><th>Location</th><th>Serial / ID No.</th><th>Capacity / Type</th><th>Date Installed</th><th>Last Service Date</th><th>Service Provider</th><th>Next Service Due</th><th>Monthly Inspection Date</th><th>Inspector</th><th>Condition (G/F/P)</th><th>Corrective Action</th><th>Sign-off</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>Fire Extinguisher (DCP)</td><td></td><td></td><td>4.5kg</td>' . str_repeat('<td></td>', 9) . '</tr>
        <tr><td>2</td><td>Fire Extinguisher (CO2)</td><td></td><td></td><td>2.5kg</td>' . str_repeat('<td></td>', 9) . '</tr>
        <tr><td>3</td><td>Fire Hose Reel</td><td></td><td></td><td>—</td>' . str_repeat('<td></td>', 9) . '</tr>
        ' . empty_rows(5, 14) . '
      </tbody>
    </table>
    <p style="font-size:9pt">G = Good &nbsp;|&nbsp; F = Fair (monitor) &nbsp;|&nbsp; P = Poor (replace immediately)</p>'
    . sig_block('Fire Equipment Inspector', 'SHE Representative');
}

function tpl_appointment_letter(string $contractor, string $date, string $role, string $ref, string $appointee): string {
    $appointee_display = $appointee ?: '[APPOINTEE FULL NAME]';
    $ref_clause = $ref ? "in terms of <strong>$ref</strong> of the Occupational Health and Safety Act (Act 85 of 1993) and its Regulations" : 'in terms of the Occupational Health and Safety Act (Act 85 of 1993) and its applicable Regulations';
    return doc_header("Legal Appointment: $role", "APT-" . strtoupper(str_replace(' ', '-', preg_replace('/[^A-Za-z ]/', '', $role))), $contractor, $date)
    . '<p>Date: ' . h($date) . '</p>
    <p>To: <strong>' . h($appointee_display) . '</strong></p>
    <h3>Appointment as ' . h($role) . '</h3>
    <p>I/We, <strong>' . h($contractor) . '</strong>, hereby appoint you, ' . h($appointee_display) . ', as <strong>' . h($role) . '</strong> ' . $ref_clause . '.</p>
    <h3>Duties and Responsibilities</h3>
    <p>In this capacity, you are required to:</p>
    <ul>
      <li>Perform all duties as required by the relevant provisions of the Occupational Health and Safety Act (Act 85 of 1993) and its Regulations pertaining to the role of ' . h($role) . '.</li>
      <li>Ensure that all work under your supervision is conducted safely and in accordance with applicable legislation, company policies, and site-specific procedures.</li>
      <li>Report any unsafe conditions, incidents, near misses, or non-compliances to your line manager and SHE Representative without delay.</li>
      <li>Participate in SHE meetings, audits, and investigations as required.</li>
      <li>Ensure that all persons under your supervision are trained, competent, and aware of the hazards and risks relevant to their work.</li>
      <li>Maintain all required records, registers, and documentation associated with this appointment.</li>
    </ul>
    <h3>Authority</h3>
    <p>You have the authority to stop any unsafe work activity under your area of responsibility. You are empowered to issue instructions to any person under your supervision where necessary to ensure compliance with safety requirements.</p>
    <h3>Acceptance</h3>
    <p>I, ' . h($appointee_display) . ', confirm that I have read and understood the responsibilities associated with this appointment, that I accept this appointment, and that I am competent to perform the duties required.</p>'
    . sig_block('Employer / Managing Director', 'Appointee: ' . h($appointee_display));
}

function tpl_toolbox_register(string $contractor, string $date): string {
    return doc_header('Weekly Toolbox Talk Register', 'TTT-REG-001', $contractor, $date)
    . '<table class="reg-tbl" style="width:70%">
      <tr><td><strong>Date:</strong></td><td>________________</td><td><strong>Time:</strong></td><td>________________</td></tr>
      <tr><td><strong>Presenter:</strong></td><td>________________</td><td><strong>Location:</strong></td><td>________________</td></tr>
      <tr><td><strong>Topic:</strong></td><td colspan="3">________________</td></tr>
    </table>
    <h3>Attendance Register</h3>
    <table class="reg-tbl">
      <thead><tr><th>#</th><th>Full Name</th><th>Designation</th><th>Signature</th></tr></thead>
      <tbody>' . empty_rows(15, 4) . '</tbody>
    </table>
    <h3>Talk Summary (key points covered)</h3>
    <div style="border:1px solid #ccc;min-height:80px;padding:8px;"></div>'
    . sig_block('Presenter / Supervisor', 'SHE Representative');
}

function tpl_near_miss_register(string $contractor, string $date): string {
    return doc_header('Near Miss Reporting Register', 'NM-REG-001', $contractor, $date)
    . '<p style="font-size:9pt;color:#555">A near miss is any unplanned event that did not result in injury/damage but had the potential to do so. Report immediately to supervisor.</p>
    <table class="reg-tbl" style="font-size:8.5pt;">
      <thead><tr><th>#</th><th>Date</th><th>Time</th><th>Location</th><th>Reported By</th><th>Description of Near Miss</th><th>Potential Consequence</th><th>Root Cause</th><th>Corrective Action</th><th>Responsible</th><th>Due Date</th><th>Closed Out?</th><th>Sign-off</th></tr></thead>
      <tbody>' . empty_rows(15, 13) . '</tbody>
    </table>'
    . sig_block('SHE Representative', 'Manager');
}

function tpl_env_legal_register(string $contractor, string $date): string {
    return doc_header('Environmental Legal Register', 'ENV-LEG-001', $contractor, $date)
    . '<p style="font-size:9pt;color:#555">List all applicable environmental legislation and assess compliance status. Review annually or when legislation changes.</p>
    <table class="reg-tbl" style="font-size:8.5pt;">
      <thead><tr><th>#</th><th>Legislation / Regulation</th><th>Act / Section</th><th>Requirement</th><th>Applicable? (Y/N)</th><th>Compliance Status</th><th>Evidence / Document Reference</th><th>Responsible Person</th><th>Last Reviewed</th><th>Action Required</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>National Environmental Management Act</td><td>NEMA — Act 107/1998</td><td>Environmental duty of care</td><td>Y</td><td></td><td>EMP ENV-PLAN-001</td><td></td><td></td><td></td></tr>
        <tr><td>2</td><td>National Waste Management Strategy</td><td>NEMWA — Act 59/2008</td><td>Waste classification &amp; disposal</td><td>Y</td><td></td><td>Waste disposal contracts</td><td></td><td></td><td></td></tr>
        <tr><td>3</td><td>National Water Act</td><td>NWA — Act 36/1998</td><td>No unlicensed water use / discharge</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
        <tr><td>4</td><td>Air Quality Act</td><td>NEMAQA — Act 39/2004</td><td>Control of atmospheric emissions</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
        ' . empty_rows(6, 10) . '
      </tbody>
    </table>'
    . sig_block('Environmental Officer / SHE Rep', 'Manager');
}

function tpl_haz_waste_records(string $contractor, string $date): string {
    return doc_header('Hazardous Waste Disposal Records', 'ENV-HW-001', $contractor, $date)
    . '<p style="font-size:9pt;color:#555">Record all hazardous waste disposals. Consignment notes / manifests from licensed disposal contractors must be attached to this register.</p>
    <table class="reg-tbl" style="font-size:8.5pt;">
      <thead><tr><th>#</th><th>Date</th><th>Waste Type</th><th>Hazard Class</th><th>Quantity (kg/L)</th><th>Container Type</th><th>Disposal Contractor</th><th>Licence No.</th><th>Consignment Note No.</th><th>Disposal Facility</th><th>Cost (R)</th><th>Approved By</th></tr></thead>
      <tbody>' . empty_rows(15, 12) . '</tbody>
    </table>'
    . sig_block('Environmental Officer', 'SHE Representative');
}

function tpl_bbs_programme(string $contractor, string $date): string {
    return doc_header('Behavioural-Based Safety (BBS) Observation Programme', 'BBS-001', $contractor, $date)
    . '<h3>Purpose</h3>
    <p>To observe, record, and reinforce safe behaviours while identifying and addressing at-risk behaviours through a systematic, non-punitive observation process.</p>
    <h3>Observation Record</h3>
    <table class="reg-tbl" style="font-size:8.5pt;">
      <thead><tr><th>Date</th><th>Observer</th><th>Task Observed</th><th>Location</th><th>Safe Behaviour Observed</th><th>At-Risk Behaviour Observed</th><th>Feedback Given</th><th>Worker Response</th><th>Follow-up Required</th><th>Closed?</th></tr></thead>
      <tbody>' . empty_rows(15, 10) . '</tbody>
    </table>
    <h3>Monthly Summary</h3>
    <table class="reg-tbl" style="width:60%">
      <thead><tr><th>Month</th><th>Total Observations</th><th>Safe %</th><th>At-Risk %</th><th>Top At-Risk Behaviour</th><th>Trend</th></tr></thead>
      <tbody>' . empty_rows(12, 6) . '</tbody>
    </table>'
    . sig_block('SHE Representative', 'Manager');
}

function tpl_monthly_report(string $contractor, string $date): string {
    return doc_header('Monthly Safety Performance Report', 'SAF-RPT-001', $contractor, $date)
    . '<table class="reg-tbl" style="width:60%">
      <tr><td><strong>Reporting Month:</strong></td><td>________________</td><td><strong>Prepared By:</strong></td><td>________________</td></tr>
      <tr><td><strong>Project / Site:</strong></td><td>________________</td><td><strong>Date:</strong></td><td>________________</td></tr>
    </table>
    <h3>1. Incident Statistics</h3>
    <table class="reg-tbl" style="width:80%">
      <thead><tr><th>Metric</th><th>This Month</th><th>YTD</th><th>Target</th><th>Trend</th></tr></thead>
      <tbody>
        <tr><td>Man Hours Worked</td>' . str_repeat('<td></td>', 4) . '</tr>
        <tr><td>Fatalities</td>' . str_repeat('<td></td>', 4) . '</tr>
        <tr><td>Lost Time Injuries (LTI)</td>' . str_repeat('<td></td>', 4) . '</tr>
        <tr><td>Medical Treatment Injuries (MTI)</td>' . str_repeat('<td></td>', 4) . '</tr>
        <tr><td>First Aid Injuries (FAI)</td>' . str_repeat('<td></td>', 4) . '</tr>
        <tr><td>Near Misses Reported</td>' . str_repeat('<td></td>', 4) . '</tr>
        <tr><td>LTI Frequency Rate (LTIFR)</td>' . str_repeat('<td></td>', 4) . '</tr>
        <tr><td>Total Recordable Incident Rate (TRIR)</td>' . str_repeat('<td></td>', 4) . '</tr>
      </tbody>
    </table>
    <h3>2. Training Hours</h3>
    <table class="reg-tbl" style="width:60%">
      <tr><td>Total Training Hours This Month:</td><td>________________</td></tr>
      <tr><td>Number of Toolbox Talks Conducted:</td><td>________________</td></tr>
      <tr><td>Inductions Completed:</td><td>________________</td></tr>
    </table>
    <h3>3. Inspections & Audits</h3>
    <table class="reg-tbl">
      <thead><tr><th>Date</th><th>Type</th><th>Conducted By</th><th>Findings</th><th>Corrective Actions</th><th>Status</th></tr></thead>
      <tbody>' . empty_rows(4, 6) . '</tbody>
    </table>
    <h3>4. Key Safety Concerns / Focus Areas Next Month</h3>
    <div style="border:1px solid #ccc;min-height:60px;padding:8px;"></div>'
    . sig_block('SHE Representative', 'Operations Manager');
}

/* ── Main template dispatcher ── */
function generate_template(string $key, string $contractor, string $date, string $appointee): string {
    if ($key === 'A.8') return tpl_policy_hs($contractor, $date);
    if ($key === 'A.2') return tpl_appointment_letter($contractor, $date, '37.2 Representative / Site Agent', 'Section 37(2)', $appointee);
    if ($key === 'A.6') return '<div class="ext-box"><h3>Notification of Construction Work (CR 4(1))</h3><p>Complete <strong>Form 18</strong> (Notice of Construction Work) and submit to the <strong>Department of Employment and Labour</strong> at least 7 days before construction commences. The form is available at <em>doel.gov.za</em> or from your nearest DoEL regional office. Retain the acknowledgement of receipt.</p></div>';
    if ($key === 'A.9') return tpl_organogram($contractor, $date);
    if ($key === 'B.1') return tpl_activity_list($contractor, $date);
    if ($key === 'B.2') return tpl_risk_register($contractor, $date);
    if ($key === 'B.3') return tpl_baseline_ra($contractor, $date);
    if ($key === 'B.4') return tpl_continuous_ra($contractor, $date);
    if ($key === 'B.5') return tpl_risk_review_plan($contractor, $date);
    if ($key === 'B.6') return tpl_sop($contractor, $date);
    if ($key === 'C.2') return tpl_policy_drug_alcohol($contractor, $date);
    if ($key === 'D.1') return tpl_induction_register($contractor, $date);
    if ($key === 'D.2') return tpl_training_matrix($contractor, $date);
    if ($key === 'D.4') return tpl_induction_register($contractor, $date);  // reuse induction register as training register
    if ($key === 'E.1') return tpl_hs_plan($contractor, $date);
    if ($key === 'E.2') return tpl_env_plan($contractor, $date);
    if (in_array($key, ['E.3','E.4'], true)) return tpl_fall_protection_plan($contractor, $date);
    if ($key === 'E.5') return tpl_contractor_mgmt($contractor, $date);
    if ($key === 'E.7') return tpl_incident_procedure($contractor, $date);
    if ($key === 'E.8') return tpl_incident_stats($contractor, $date);
    if ($key === 'E.9') return tpl_ppe_procedure($contractor, $date);
    if ($key === 'E.10') return tpl_ppe_training_register($contractor, $date);
    if ($key === 'E.11') return tpl_ppe_issue_register($contractor, $date);
    if ($key === 'E.12') return tpl_ppe_inspection($contractor, $date);
    if ($key === 'F.1') return tpl_equipment_register($contractor, $date);
    if ($key === 'F.2') return tpl_inspection_schedule($contractor, $date);
    if ($key === 'F.3') return tpl_maintenance_records($contractor, $date);
    if ($key === 'G.1') return tpl_emergency_procedure($contractor, $date);
    if ($key === 'G.2') return tpl_drill_schedule($contractor, $date);
    if ($key === 'G.3') return tpl_fire_equipment_log($contractor, $date);
    if ($key === 'I.2') return tpl_toolbox_register($contractor, $date);
    if ($key === 'I.3') return tpl_near_miss_register($contractor, $date);
    if ($key === 'I.4') return tpl_bbs_programme($contractor, $date);
    if ($key === 'I.6') return tpl_env_legal_register($contractor, $date);
    if ($key === 'I.7') return tpl_haz_waste_records($contractor, $date);
    if ($key === 'I.10') return tpl_monthly_report($contractor, $date);
    // Section H: appointment letters
    if (substr($key, 0, 2) === 'H.') {
        $no = (int)substr($key, 2);
        // Label map for Section H
        static $H = [
            1=>'Manager',2=>'General Supervision',3=>'SHE Representative',
            4=>'SHE Committee Chairman',5=>'SHE Committee Member',
            6=>'Construction Health & Safety Officer',7=>'Construction Manager',
            8=>'Assistant Construction Manager',9=>'Construction Supervisor',
            10=>'Assistant Construction Supervisor',11=>'Risk Assessor',
            12=>'Fall Protection Planner',13=>'Structure Inspector',
            14=>'Temporary Works Designer',15=>'Temporary Works Supervisor',
            16=>'Excavation Supervisor',17=>'Demolition Supervisor',
            18=>'Scaffolding Supervisor',19=>'Suspended Platform Supervisor',
            20=>'Suspended Platform Erector / Operator / Inspector',
            21=>'Rope Access Supervisor',22=>'Material Hoist Operator',
            23=>'Material Hoist Inspector',24=>'Bulk Mixing Plant Supervisor',
            25=>'Bulk Mixing Plant Operator',26=>'Explosive Actuated Tool Operator',
            27=>'Explosive Actuated Tool Inspector',28=>'Explosive Actuated Tool Controller',
            29=>'Construction Vehicle Operator / Inspector',
            30=>'Stacking and Storage Supervisor',31=>'Fire Equipment Inspector',
            32=>'Incident Investigator',33=>'First Aider',34=>'Radiation Protection Officer',
        ];
        static $HREFS = [
            1=>'Section 16.2',2=>'Section 8',3=>'Section 17',4=>'Section 19',5=>'Section 19.3',
            6=>'CR 8(6)',7=>'CR 8(1)',8=>'CR 8(2)',9=>'CR 8(7)',10=>'CR 8(8)',
            11=>'CR 9(1)',12=>'CR 10(1)',13=>'CR 11(1)',14=>'CR 12(1)',15=>'CR 12(2)',
            16=>'CR 13(1)a',17=>'CR 14(1)',18=>'CR 16(1)',19=>'CR 17(1)',20=>'CR 17(2)(ii)',
            21=>'CR 18(1)',22=>'CR 19(6)',23=>'CR 19(8)(a)',24=>'CR 20(1)',25=>'CR 20(2)',
            26=>'CR 21(1)(b)',27=>'CR 21(2)(b)',28=>'CR 21(2)(i)',29=>'CR 23(K)',
            30=>'CR 28(a)',31=>'CR 29(h)',32=>'GAR 9(2)',33=>'GSR 3(1) & (4)',34=>'',
        ];
        $role = $H[$no] ?? "H.$no Role";
        $ref  = $HREFS[$no] ?? '';
        return tpl_appointment_letter($contractor, $date, $role, $ref, $appointee);
    }
    return '';
}

/* ── Prepare data for output ── */
$contractor  = $file['contractor'] ?? 'Contractor';
$audit_date  = $file['audit_date'] ?? date('Y-m-d');
$date_fmt    = date('d F Y', strtotime($audit_date));
$gen_date    = date('d F Y');

// Collect gen items and ext items, group for deduplication
$gen_docs   = [];  // key => {key, label, ref, appointee}
$ext_items  = [];  // key => {key, label, ref, guidance}
$gen_keys_done = [];  // avoid duplicate templates (e.g. E.3 and E.4 both → FPP)

foreach ($nts as $key => $row) {
    [$sec, $no_str] = explode('.', $key);
    $no = (int)$no_str;
    $item_data = $ITEMS[$sec]['items'][$no] ?? ['label' => $key, 'ref' => ''];
    $type = item_type($key);

    if ($type === 'ext') {
        $ext_items[$key] = [
            'key'      => $key,
            'label'    => $item_data['label'],
            'ref'      => $item_data['ref'],
            'guidance' => ext_guidance($key),
            'comments' => $row['comments'] ?? '',
        ];
    } else {
        // Map duplicate templates to a canonical key
        $canon_key = $key;
        if ($key === 'E.4') $canon_key = 'E.3';
        if ($key === 'D.4') $canon_key = 'D.1';

        if (!isset($gen_keys_done[$canon_key])) {
            $gen_keys_done[$canon_key] = true;
            $gen_docs[$key] = [
                'key'       => $key,
                'label'     => $item_data['label'],
                'ref'       => $item_data['ref'],
                'appointee' => $row['appointee'] ?? '',
                'comments'  => $row['comments'] ?? '',
                'canon'     => $canon_key,
            ];
        }
    }
}

$total_gen = count($gen_docs);
$total_ext = count($ext_items);

/* ── Output ── */
ob_end_clean();
header('Content-Type: text/html; charset=UTF-8');
header('Content-Disposition: inline; filename="Remediation_Pack_' . $ref_id . '.html"');
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Remediation Pack — <?=h($ref_id)?> — <?=h($contractor)?></title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;font-size:10.5pt;color:#222;background:#f5f5f5}
  @media print{body{background:#fff;font-size:10pt} .no-print{display:none} .page-break{page-break-before:always;padding-top:0;margin-top:0}}
  .page-break{margin-top:30px;padding-top:30px;border-top:3px solid #c0392b}

  /* Cover */
  .cover{background:linear-gradient(135deg,#c0392b 0%,#7b1a1a 100%);color:#fff;padding:60px 50px;min-height:280px;print-color-adjust:exact;-webkit-print-color-adjust:exact}
  .cover h1{font-size:26pt;margin-bottom:8px}
  .cover h2{font-size:14pt;font-weight:normal;opacity:.9;margin-bottom:30px}
  .cover-meta{background:rgba(255,255,255,.15);border-radius:6px;padding:16px 20px;display:inline-block;min-width:320px}
  .cover-meta table{width:auto;border-collapse:collapse}
  .cover-meta td{padding:3px 12px 3px 0;font-size:10pt}
  .cover-meta .lbl{opacity:.75}
  .toc{background:#fff;border:1px solid #ddd;padding:20px 30px;margin:20px 0}
  .toc h3{color:#c0392b;margin-bottom:10px}
  .toc ol{padding-left:18px;line-height:1.8}
  .toc .ext-item{color:#888}

  /* Doc layout */
  .doc-wrap{background:#fff;border:1px solid #ddd;padding:24px 30px;margin:20px 0;border-radius:4px}
  .doc-hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #c0392b;padding-bottom:12px;margin-bottom:16px}
  .doc-hdr-left .doc-title{font-size:15pt;font-weight:bold;color:#c0392b}
  .doc-hdr-left .doc-meta{font-size:8.5pt;color:#666;margin-top:3px}
  .doc-hdr-stamp{background:#c0392b;color:#fff;padding:8px 12px;font-size:8pt;font-weight:bold;text-align:center;border-radius:4px;line-height:1.4}
  h3{color:#333;font-size:11pt;margin:14px 0 6px 0;border-bottom:1px solid #e0e0e0;padding-bottom:3px}
  p{margin:6px 0;line-height:1.5}
  ul,ol{margin:6px 0 8px 18px;line-height:1.6}
  li{margin-bottom:2px}

  /* Tables */
  .reg-tbl{width:100%;border-collapse:collapse;font-size:9pt;margin:8px 0}
  .reg-tbl th{background:#c0392b;color:#fff;padding:5px 7px;text-align:left;font-size:8.5pt}
  .reg-tbl td{border:1px solid #ccc;padding:4px 7px;vertical-align:top}
  .reg-tbl tr:nth-child(even) td{background:#fafafa}

  /* Signature */
  .sig-tbl{width:100%;border-collapse:collapse;margin-top:20px}
  .sig-tbl td{width:50%;padding:10px 20px 10px 0;vertical-align:top}
  .sig-line{border-bottom:2px solid #333;margin-bottom:6px;height:36px}
  .sig-lbl{font-size:8.5pt;color:#555;margin-bottom:3px}

  /* External item box */
  .ext-box{background:#fff8e1;border:1px solid #ffc107;border-radius:4px;padding:14px 18px}
  .ext-box h3{color:#856404;border-color:#ffc107}
  .ext-item-header{display:flex;align-items:center;gap:8px;margin-bottom:8px}
  .ext-badge{background:#ffc107;color:#333;padding:2px 8px;border-radius:10px;font-size:8pt;font-weight:bold}
  .ext-guidance{font-size:9.5pt;line-height:1.6}

  /* Section divider */
  .sec-divider{background:#7b1a1a;color:#fff;padding:10px 16px;margin-top:20px;border-radius:4px;font-weight:bold;font-size:10.5pt}

  /* Nav bar */
  .navbar{background:#333;color:#fff;padding:10px 20px;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:100}
  .navbar a{color:#ffd;font-size:9.5pt;text-decoration:none;margin-right:12px}
  .navbar .print-btn{background:#c0392b;color:#fff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-size:9.5pt}

  /* Print adjustments */
  @page{size:A4;margin:18mm 14mm}
  @media print{
    .navbar,.no-print{display:none !important}
    .doc-wrap{border:none;padding:0;margin:10px 0}
    .cover{padding:40px 30px}
    .page-break{border-top:none;margin-top:0;padding-top:0}
  }
</style>
</head>
<body>

<div class="navbar no-print">
  <div><strong>Remediation Pack</strong> — <?=h($ref_id)?> — <?=h($contractor)?></div>
  <div>
    <a href="#toc">Contents</a>
    <a href="#ext-section">External Evidence</a>
    <button class="print-btn" onclick="window.print()">&#128438; Print / Save PDF</button>
  </div>
</div>

<!-- Cover Page -->
<div class="cover">
  <h1>Safety Remediation Document Pack</h1>
  <h2>BF-SHE-FRM-010 — Contractor Safety File Audit</h2>
  <div class="cover-meta">
    <table>
      <tr><td class="lbl">Contractor:</td><td><strong><?=h($contractor)?></strong></td></tr>
      <tr><td class="lbl">Safety File Ref:</td><td><?=h($ref_id)?></td></tr>
      <tr><td class="lbl">Audit Date:</td><td><?=h($date_fmt)?></td></tr>
      <tr><td class="lbl">Generated:</td><td><?=h($gen_date)?></td></tr>
      <tr><td class="lbl">Generated By:</td><td><?=h($user['display_name'] ?? $user['username'])?></td></tr>
      <tr><td class="lbl">NTS Items — Templates:</td><td><?=$total_gen?> documents</td></tr>
      <tr><td class="lbl">NTS Items — External Evidence:</td><td><?=$total_ext?> items</td></tr>
    </table>
  </div>
  <p style="margin-top:20px;font-size:9pt;opacity:.7">This pack contains document templates for items marked "Not to Standard" in the safety audit.
  Complete, sign, and upload each document to the portal. Items requiring external evidence are listed at the end.</p>
</div>

<!-- Table of Contents -->
<div id="toc" class="toc">
  <h3>Table of Contents</h3>
  <ol>
<?php
$doc_num = 0;
foreach ($gen_docs as $key => $d):
    $doc_num++;
    echo "    <li><a href=\"#doc-" . h(str_replace('.', '-', $key)) . "\">" . h($d['label']) . " <span style='color:#888;font-size:8.5pt'>(" . h($d['key']) . ")</span></a></li>\n";
endforeach;
if ($ext_items):
    echo "    <li class='ext-item'><a href='#ext-section'>External Evidence Required (" . count($ext_items) . " items)</a></li>\n";
endif;
?>
  </ol>
</div>

<!-- Generated Documents -->
<?php
$prev_sec = '';
foreach ($gen_docs as $key => $d):
    $sec = substr($key, 0, 1);
    if ($sec !== $prev_sec):
        $prev_sec = $sec;
        $sec_title = $ITEMS[$sec]['title'] ?? "Section $sec";
        echo '<div class="sec-divider">' . h($sec_title) . '</div>';
    endif;
    $anchor = 'doc-' . str_replace('.', '-', $key);
    ?>
<div id="<?=h($anchor)?>" class="doc-wrap page-break">
  <?php
  if ($d['comments']):
      echo '<div style="background:#ffe4e4;border:1px solid #f5c6c6;padding:8px 12px;border-radius:4px;margin-bottom:10px;font-size:9pt;"><strong>Audit Finding (Item ' . h($key) . '):</strong> ' . h($d['comments']) . '</div>';
  endif;
  echo generate_template($d['canon'], $contractor, $date_fmt, $d['appointee']);
  ?>
</div>
<?php endforeach; ?>

<!-- External Evidence Section -->
<?php if ($ext_items): ?>
<div id="ext-section" class="page-break">
  <div class="sec-divider">External Evidence Required — Items Not to Standard</div>
  <p style="margin:12px 0;font-size:9.5pt;color:#555;">The following items require documentation issued or certified by an external body. Templates cannot be generated — follow the guidance below to obtain each document.</p>
  <?php foreach ($ext_items as $key => $e): ?>
  <div class="doc-wrap" style="margin-top:14px">
    <div class="ext-item-header">
      <div class="ext-badge">EXTERNAL</div>
      <div style="font-weight:bold;font-size:11pt"><?=h($e['label'])?></div>
      <div style="color:#888;font-size:9pt"><?=h($e['key'])?> &mdash; <?=h($e['ref'])?></div>
    </div>
    <?php if ($e['comments']): ?>
    <div style="background:#fff3cd;border:1px solid #ffc107;padding:6px 10px;border-radius:3px;font-size:9pt;margin-bottom:8px;"><strong>Audit Finding:</strong> <?=h($e['comments'])?></div>
    <?php endif; ?>
    <div class="ext-guidance"><?=$e['guidance']?></div>
  </div>
  <?php endforeach; ?>
</div>
<?php endif; ?>

<div style="background:#333;color:#aaa;padding:16px 24px;margin-top:30px;font-size:8.5pt;text-align:center">
  Generated by Umlilo Portal (BF-SHE-FRM-010 Rev 01) &mdash; <?=h($gen_date)?> &mdash; <?=h($ref_id)?> &mdash; <?=h($contractor)?>
  <br>This pack contains draft templates only. Ensure all documents are reviewed, completed, and signed by competent and duly authorised persons before upload.
</div>

</body>
</html>
