<?php
/**
 * import_safety_docs.php — DEV ONLY
 * Imports real physical safety file documents from a local/network folder
 * into the portal as per-item evidence (entity_type = 'safety_item').
 *
 * Access: localhost · portal session · OR dev key below.
 */

define('IMP_KEY', 'Bhekani2026!');

require_once __DIR__ . '/includes/auth.php';
bf_session_start();

$ip       = $_SERVER['REMOTE_ADDR'] ?? '';
$is_local = in_array($ip, ['127.0.0.1', '::1', ''], true);
$user     = current_user();
$auth_ok  = $is_local || ($user !== null) || ($_SESSION['bhk_ok'] ?? false);

$login_err = '';
if (!$auth_ok && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['k'])) {
    if (hash_equals(IMP_KEY, $_POST['k'] ?? '')) {
        $_SESSION['bhk_ok'] = true;
        header('Location: ' . strtok($_SERVER['REQUEST_URI'], '?'));
        exit;
    }
    $login_err = 'Wrong key.';
}

if (!$auth_ok):
?><!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Import Safety Docs · Access</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:ui-monospace,monospace;font-size:13px;background:#0a0a0a;color:#e2e8f0;
     display:flex;align-items:center;justify-content:center;min-height:100vh}
.card{background:#111;border:1px solid #222;border-top:2px solid #f97316;padding:32px 36px;
      border-radius:6px;width:320px}
h1{font-size:18px;font-weight:700;color:#f97316;margin-bottom:4px}
p{font-size:11px;color:#64748b;margin-bottom:20px}
label{display:block;font-size:11px;color:#94a3b8;margin-bottom:6px}
input{width:100%;background:#0a0a0a;border:1px solid #333;color:#e2e8f0;
      padding:9px 12px;border-radius:4px;font-family:inherit;font-size:13px}
button{margin-top:14px;width:100%;background:#f97316;color:#000;border:none;
       padding:10px;border-radius:4px;font-weight:700;font-size:13px;cursor:pointer}
.err{margin-top:10px;font-size:11px;color:#ef4444}
</style></head>
<body><div class="card">
  <h1>Safety Docs Import</h1>
  <p>Dev key required</p>
  <form method="POST">
    <label for="k">Dev key</label>
    <input type="password" id="k" name="k" autofocus autocomplete="off">
    <button type="submit">Enter</button>
    <?php if ($login_err): ?><div class="err"><?= htmlspecialchars($login_err) ?></div><?php endif; ?>
  </form>
</div></body></html>
<?php
exit;
endif;

// ── Authorised ──────────────────────────────────────────────────────────
require_once __DIR__ . '/includes/db.php';

$uploaded_by = $user ? ($user['username'] ?? 'dev-import') : 'dev-import';

// ── Source folder ────────────────────────────────────────────────────────
$SOURCE_DIR = 'G:\\.shortcut-targets-by-id\\19jPRakzdBBQgK_LaHiAtGZiEm-A3fXb3\\Astute Insight\\old';
$ATTACH_DIR = dirname(__DIR__) . '/uploads/attachments';

// ── Allowed MIME types (mirrors files.php) ──────────────────────────────
const MIME_MAP = [
    'application/pdf'                                                          => 'pdf',
    'application/vnd.ms-excel'                                                 => 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'       => 'xlsx',
    'application/msword'                                                       => 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
    'image/jpeg'                                                               => 'jpg',
    'image/png'                                                                => 'png',
];

/**
 * Master mapping: original filename → [{section_key, item_no, label}]
 * A single file may map to multiple items (e.g. SWPs → multiple B6 docs).
 * Files mapped to section='file' item=0 go to the safety FILE level (general docs).
 */
$FILE_MAP = [
    '00. Cover page.pdf'                         => [['sec'=>'file','no'=>0,'label'=>'Cover page (general)']],
    '01. Legal Appointments_111759.pdf'          => [
        ['sec'=>'H','no'=>1,'label'=>'Manager (Sec 16.2)'],
        ['sec'=>'H','no'=>2,'label'=>'General Supervision (Sec 8)'],
        ['sec'=>'H','no'=>3,'label'=>'SHE Representative (Sec 17)'],
        ['sec'=>'H','no'=>6,'label'=>'Construction H&S Officer (CR8(6))'],
    ],
    '02. Scope of Work.pdf'                      => [['sec'=>'B','no'=>1,'label'=>'List of main activities / Scope of Work']],
    '03. Policy Cellphone.pdf'                   => [['sec'=>'A','no'=>8,'label'=>'H&S Policies — Cellphone']],
    '03. Policy Drug and Alcohol.pdf'            => [['sec'=>'C','no'=>2,'label'=>'Drug & Alcohol Policy']],
    '03. Policy SHE.pdf'                         => [['sec'=>'A','no'=>8,'label'=>'H&S Policies — SHE']],
    '03. Policy Smoking.pdf'                     => [['sec'=>'A','no'=>8,'label'=>'H&S Policies — Smoking']],
    '04.OHS Organogram.pdf'                      => [['sec'=>'A','no'=>9,'label'=>'OHS Organogram']],
    '05. List of employees on site.pdf'          => [['sec'=>'A','no'=>9,'label'=>'Onsite employees list']],
    '06. I.D_of_A.M_Ramalope.pdf'               => [['sec'=>'H','no'=>1,'label'=>'ID — A.M. Ramalope']],
    '06. JS ID Copy - Card.pdf'                  => [['sec'=>'H','no'=>1,'label'=>'ID — J. Shange']],
    '06. Nathi.jpg'                              => [['sec'=>'H','no'=>1,'label'=>'ID — Nathi']],
    '06. Tshepo Sekhoto.jpg'                     => [['sec'=>'H','no'=>1,'label'=>'ID — Tshepo Sekhoto']],
    '08. Proof of Competency (Blank).pdf'        => [['sec'=>'D','no'=>3,'label'=>'Competency records']],
    '09. ASTUTE INSIGHTS MEDICAL CERTIFICATES.pdf'=>[['sec'=>'C','no'=>1,'label'=>'Medical certificates of fitness']],
    '10. First Aider (Blank).pdf'                => [['sec'=>'H','no'=>33,'label'=>'First Aider appointment (GSR3)']],
    '11. Letter of good standing.pdf'            => [['sec'=>'A','no'=>4,'label'=>'Letter of Good Standing (COIDA)']],
    '12. Public liability.PDF'                   => [['sec'=>'A','no'=>7,'label'=>'Public Liability Insurance']],
    '13. SHE PLAN.pdf'                           => [['sec'=>'E','no'=>1,'label'=>'Health & Safety Plan']],
    '14. Fall Protection Plan.pdf'               => [['sec'=>'E','no'=>3,'label'=>'Fall Protection Plan']],
    '15. Emergency Preparedness.pdf'             => [['sec'=>'G','no'=>1,'label'=>'Emergency Preparedness Procedure']],
    '16. SWP - Grinder.pdf'                     => [['sec'=>'B','no'=>6,'label'=>'SWP — Grinder']],
    '16. SWP - Hand Tools.pdf'                  => [['sec'=>'B','no'=>6,'label'=>'SWP — Hand Tools']],
    '16. SWP - Ladders.pdf'                     => [['sec'=>'B','no'=>6,'label'=>'SWP — Ladders']],
    '16. SWP-Fall_Protection.pdf'               => [['sec'=>'B','no'=>6,'label'=>'SWP — Fall Protection']],
    '16. SWP-manualsafeliftingandhandling.pdf'  => [['sec'=>'B','no'=>6,'label'=>'SWP — Manual Lifting']],
    '17. Legal Appointments_111759.pdf'          => [
        ['sec'=>'H','no'=>7,'label'=>'Construction Manager (CR8(1))'],
        ['sec'=>'H','no'=>9,'label'=>'Construction Supervisor (CR8(7))'],
        ['sec'=>'H','no'=>11,'label'=>'Risk Assessor (CR9(1))'],
        ['sec'=>'H','no'=>12,'label'=>'Fall Protection Planner (CR10(1))'],
    ],
    '18. Contractor Appointment(Blank).pdf'      => [['sec'=>'A','no'=>3,'label'=>'Principal contractor appointment letter']],
    '19. PPE Checklist.pdf'                      => [['sec'=>'E','no'=>12,'label'=>'PPE Inspection checklist']],
    '19. PPE ISSUE FORM..pdf'                    => [['sec'=>'E','no'=>11,'label'=>'PPE Issue Form']],
    '21. HCS Checklist.pdf'                      => [['sec'=>'B','no'=>7,'label'=>'HCS Checklist (Safety Data Sheets)']],
    '21. HCS Register.pdf'                       => [['sec'=>'B','no'=>7,'label'=>'HCS Register']],
    '22. P.P.E Issue register for individuals.pdf'=>[['sec'=>'E','no'=>11,'label'=>'PPE Issue register — individuals']],
    '23. PPE Inspection register.pdf'            => [['sec'=>'E','no'=>12,'label'=>'PPE Inspection register']],
    '24. Tool Box talks Topics.pdf'              => [['sec'=>'I','no'=>2,'label'=>'Toolbox Talk topics']],
    '24. Toolbox Talks Attendance Register.docx' => [['sec'=>'I','no'=>2,'label'=>'Toolbox Talk attendance register']],
    '25. Act 85 of 1993.pdf'                    => [['sec'=>'A','no'=>8,'label'=>'OHS Act 85 of 1993 (reference)']],
    '26. First aid box content list.pdf'         => [['sec'=>'G','no'=>3,'label'=>'First aid box content list']],
    '26. FirstAid Injury Register.pdf'           => [['sec'=>'E','no'=>8,'label'=>'First Aid Injury Register (incident stats)']],
    '27. Reported Incident List.docx'            => [['sec'=>'E','no'=>8,'label'=>'Reported Incident List']],
    '28. Incident reporting forms.pdf'           => [['sec'=>'E','no'=>7,'label'=>'Incident reporting forms']],
    '28. Incident reporting procedures.pdf'      => [['sec'=>'E','no'=>7,'label'=>'Incident reporting procedures']],
    '28. W.Cl. 1 - Employers Report.pdf'        => [['sec'=>'A','no'=>4,'label'=>'WCL1 — Employer\'s Report of Accident']],
    '28. W.Cl.2 - Employers Report of an Accident.pdf'=>[['sec'=>'A','no'=>4,'label'=>'WCL2 — Employer\'s Report of an Accident']],
    '29. Statutory Inspection Certificates.docx' => [['sec'=>'F','no'=>2,'label'=>'Statutory Inspection Certificates']],
    '30. Health & Safety Monthly Meeting.pdf'    => [['sec'=>'I','no'=>10,'label'=>'Monthly Safety Performance / H&S Meeting']],
    '31. Policy Waste management.pdf'            => [['sec'=>'E','no'=>2,'label'=>'Environmental Mgmt — Waste Management Policy']],
    '32. Notification of Work.pdf'               => [['sec'=>'A','no'=>6,'label'=>'Notification of Construction Work (CR4)']],
    '33. HCS proof of training_Nathi.jpg'        => [['sec'=>'D','no'=>3,'label'=>'HCS proof of training — Nathi']],
    '34. Copies of Valid Drivers License.docx'   => [['sec'=>'H','no'=>29,'label'=>'Vehicle Operator — Drivers License (CR23)']],
];

// ── Handle import action ────────────────────────────────────────────────
$results = [];
$file_ref = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['file_ref'])) {
    $file_ref = preg_replace('/[^A-Z0-9\-]/', '', strtoupper(trim($_POST['file_ref'])));
    $dry_run  = !empty($_POST['dry_run']);
    $only_file = $_POST['only_file'] ?? '';

    if (!$file_ref) {
        $results[] = ['status'=>'err','msg'=>'Safety file ref is required (e.g. SAF-001)'];
    } else {
        // Verify safety file exists
        $sf = db_row("SELECT id FROM bf_safety_files WHERE ref_id = ? AND is_active = 1", [$file_ref]);
        if (!$sf) {
            $results[] = ['status'=>'err','msg'=>"Safety file '$file_ref' not found in database"];
        } else {
            if (!is_dir($ATTACH_DIR)) {
                if (!$dry_run) mkdir($ATTACH_DIR, 0755, true);
            }
            $finfo = new finfo(FILEINFO_MIME_TYPE);

            foreach ($FILE_MAP as $fname => $mappings) {
                if ($only_file && $only_file !== $fname) continue;

                $src_path = $SOURCE_DIR . '\\' . $fname;
                if (!file_exists($src_path)) {
                    $results[] = ['status'=>'miss','file'=>$fname,'msg'=>'Not found in source folder'];
                    continue;
                }

                $mime = $finfo->file($src_path);
                if (!array_key_exists($mime, MIME_MAP)) {
                    $results[] = ['status'=>'skip','file'=>$fname,'msg'=>"MIME '$mime' not allowed — skipped"];
                    continue;
                }
                $ext = MIME_MAP[$mime];

                foreach ($mappings as $m) {
                    $entity_type = $m['sec'] === 'file' ? 'safety_file' : 'safety_item';
                    $entity_ref  = $m['sec'] === 'file'
                        ? $file_ref
                        : "{$file_ref}:{$m['sec']}:{$m['no']}";

                    // Skip if already imported
                    $exists = db_row(
                        "SELECT id FROM bf_attachments WHERE entity_type=? AND entity_ref=? AND original_name=?",
                        [$entity_type, $entity_ref, $fname]
                    );
                    if ($exists) {
                        $results[] = ['status'=>'dup','file'=>$fname,'entity'=>$entity_ref,'msg'=>'Already imported — skipped'];
                        continue;
                    }

                    if (!$dry_run) {
                        $stored = bin2hex(random_bytes(16)) . '.' . $ext;
                        $dst    = $ATTACH_DIR . '/' . $stored;
                        if (!copy($src_path, $dst)) {
                            $results[] = ['status'=>'err','file'=>$fname,'entity'=>$entity_ref,'msg'=>'File copy failed'];
                            continue;
                        }
                        db_exec(
                            "INSERT INTO bf_attachments
                               (entity_type, entity_ref, original_name, stored_name, file_size, mime_type, uploaded_by)
                             VALUES (?,?,?,?,?,?,?)",
                            [$entity_type, $entity_ref, $fname, $stored, filesize($src_path), $mime, $uploaded_by]
                        );
                        // Mark item as To Standard (if not already set)
                        if ($entity_type === 'safety_item') {
                            $parts = explode(':', $entity_ref, 3);
                            if (count($parts) === 3) {
                                [, $sec, $no_str] = $parts;
                                db_exec(
                                    "UPDATE bf_safety_items SET result='To Standard'
                                      WHERE file_ref=? AND section_key=? AND item_no=? AND (result IS NULL OR result='')",
                                    [$file_ref, $sec, (int)$no_str]
                                );
                            }
                        }
                        $results[] = ['status'=>'ok','file'=>$fname,'entity'=>$entity_ref,'label'=>$m['label'],'msg'=>'Imported'];
                    } else {
                        $results[] = ['status'=>'dry','file'=>$fname,'entity'=>$entity_ref,'label'=>$m['label'],'msg'=>'DRY RUN — would import'];
                    }
                }
            }
        }
    }
}

// ── Build source file list ───────────────────────────────────────────────
$source_files = [];
if (is_dir($SOURCE_DIR)) {
    foreach (scandir($SOURCE_DIR) as $f) {
        if ($f === '.' || $f === '..' || is_dir($SOURCE_DIR . '\\' . $f)) continue;
        if (str_ends_with($f, '.php')) continue; // skip bhekani_bo.php
        $source_files[] = $f;
    }
}

// ── Live safety files in DB ─────────────────────────────────────────────
try {
    $sf_list = db_select("SELECT ref_id, contractor, status FROM bf_safety_files WHERE is_active=1 ORDER BY ref_id");
} catch (\Exception $e) {
    $sf_list = [];
}
?>
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Safety Docs Import · DEV ONLY</title>
<style>
:root{--bg:#0a0a0a;--surface:#111;--border:#222;--accent:#f97316;--accent2:#fb923c;
      --text:#e2e8f0;--muted:#64748b;--row-odd:#0f0f0f;--row-even:#111;--row-hover:#1c1c1c;
      --thead:#161616;--ok:#4ade80;--warn:#fbbf24;--err:#f87171;--blue:#60a5fa}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:12px;
     background:var(--bg);color:var(--text);min-height:100vh;padding:0 0 60px}

.topbar{position:sticky;top:0;z-index:200;background:var(--bg);
  border-bottom:2px solid var(--accent);padding:10px 20px;
  display:flex;align-items:center;gap:16px}
.topbar .brand{font-size:16px;font-weight:700;color:var(--accent);letter-spacing:.06em}
.topbar .brand small{font-weight:400;font-size:10px;color:var(--muted);display:block}

.panel{margin:20px;background:var(--surface);border:1px solid var(--border);border-radius:6px;overflow:hidden}
.ph{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;
    border-bottom:1px solid var(--border);background:var(--bg)}
.ph h2{font-size:11px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:.08em}
.pb{padding:16px}

/* import form */
.form-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px}
.form-row label{font-size:11px;color:var(--muted);min-width:90px}
.finput{background:var(--bg);border:1px solid #333;color:var(--text);
        padding:6px 10px;border-radius:4px;font-family:inherit;font-size:12px}
.finput:focus{outline:none;border-color:var(--accent)}
select.finput{cursor:pointer}
.btn{font-family:inherit;font-size:11px;font-weight:600;padding:6px 14px;
     border-radius:4px;border:none;cursor:pointer;letter-spacing:.03em}
.btn-primary{background:var(--accent);color:#000}
.btn-primary:hover{opacity:.88}
.btn-g{background:#1e293b;color:var(--text);border:1px solid #334155}
.btn-g:hover{border-color:var(--accent);color:var(--accent)}
.btn-warn{background:#78350f;color:#fef3c7;border:1px solid #b45309}
.dry-note{font-size:10px;color:var(--muted);margin-left:4px}

/* mapping table */
.wrap{overflow-x:auto}
table{border-collapse:collapse;min-width:100%;font-size:11px}
thead th{background:var(--thead);color:var(--accent2);padding:6px 12px;text-align:left;
  border-right:1px solid #1a1a1a;border-bottom:1px solid var(--border);
  white-space:nowrap;font-weight:600}
tbody td{padding:5px 12px;border-right:1px solid #1a1a1a;border-bottom:1px solid #181818;
  vertical-align:top;color:#cbd5e1}
tbody tr:nth-child(odd) td{background:var(--row-odd)}
tbody tr:nth-child(even) td{background:var(--row-even)}
tbody tr:hover td{background:var(--row-hover)}
.badge{display:inline-block;font-size:10px;font-weight:700;padding:2px 6px;border-radius:3px}
.b-sec{background:#1e3a5f;color:#93c5fd}
.b-item{background:#1a2e1a;color:var(--ok)}
.b-file{background:#2d1a00;color:var(--warn)}
.b-miss{background:#2d1a1a;color:var(--err)}
.file-miss{color:var(--err);font-style:italic}
.multi{font-size:10px;color:var(--muted)}

/* results */
.result-row{display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #1a1a1a}
.r-ok{color:var(--ok)}.r-dup{color:var(--muted)}.r-miss{color:var(--err)}.r-err{color:var(--err)}.r-dry{color:var(--blue)}.r-skip{color:var(--warn)}
.r-file{flex:0 0 340px;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.r-entity{font-size:10px;color:var(--muted);flex:0 0 160px}
.r-msg{font-size:11px}
</style>
</head>
<body>

<div class="topbar">
  <div class="brand">Safety Docs Import <small>DEV ONLY — bulk import from physical file folder</small></div>
  <a href="bhekani_bo.php" class="btn btn-g" style="font-size:10px">← bhekani_bo</a>
</div>

<!-- ── Import Action Form ────────────────────────────────────────── -->
<div class="panel">
  <div class="ph"><h2>Import Documents</h2></div>
  <div class="pb">
    <form method="POST">
      <div class="form-row">
        <label>Safety file ref</label>
        <?php if ($sf_list): ?>
        <select name="file_ref" class="finput" style="width:260px">
          <option value="">— select a safety file —</option>
          <?php foreach ($sf_list as $sf): ?>
          <option value="<?= htmlspecialchars($sf['ref_id']) ?>"
            <?= $file_ref === $sf['ref_id'] ? 'selected' : '' ?>>
            <?= htmlspecialchars($sf['ref_id']) ?> — <?= htmlspecialchars($sf['contractor']) ?> (<?= htmlspecialchars($sf['status']) ?>)
          </option>
          <?php endforeach; ?>
        </select>
        <?php else: ?>
        <input name="file_ref" class="finput" placeholder="e.g. SAF-001" value="<?= htmlspecialchars($file_ref) ?>" style="width:160px">
        <?php endif; ?>
      </div>
      <div class="form-row">
        <label>Mode</label>
        <label style="min-width:auto;display:flex;gap:6px;align-items:center;cursor:pointer">
          <input type="checkbox" name="dry_run" value="1" <?= !empty($_POST['dry_run']) ? 'checked' : '' ?>>
          <span>Dry run (preview only — no files written)</span>
        </label>
      </div>
      <div class="form-row">
        <label>Single file</label>
        <select name="only_file" class="finput" style="width:360px">
          <option value="">— all mapped files —</option>
          <?php foreach (array_keys($FILE_MAP) as $fn): ?>
          <option value="<?= htmlspecialchars($fn) ?>" <?= ($_POST['only_file'] ?? '') === $fn ? 'selected' : '' ?>>
            <?= htmlspecialchars($fn) ?>
          </option>
          <?php endforeach; ?>
        </select>
      </div>
      <div style="display:flex;gap:8px;align-items:center;margin-top:4px">
        <button type="submit" class="btn btn-primary">⇩ Import</button>
        <button type="submit" name="dry_run" value="1" class="btn btn-warn">⊙ Dry Run</button>
        <span class="dry-note">Dry run: shows what would happen without writing anything</span>
      </div>
    </form>

    <?php if (!empty($results)): ?>
    <div style="margin-top:20px">
      <?php
      $cnt_ok  = count(array_filter($results, fn($r) => $r['status']==='ok'));
      $cnt_dup  = count(array_filter($results, fn($r) => $r['status']==='dup'));
      $cnt_err  = count(array_filter($results, fn($r) => in_array($r['status'],['err','miss','skip'])));
      $cnt_dry  = count(array_filter($results, fn($r) => $r['status']==='dry'));
      ?>
      <div style="font-size:12px;margin-bottom:10px">
        <?php if ($cnt_ok): ?><span style="color:var(--ok)">✓ <?= $cnt_ok ?> imported</span>&ensp;<?php endif; ?>
        <?php if ($cnt_dry): ?><span style="color:var(--blue)">⊙ <?= $cnt_dry ?> would import</span>&ensp;<?php endif; ?>
        <?php if ($cnt_dup): ?><span style="color:var(--muted)">= <?= $cnt_dup ?> already exist</span>&ensp;<?php endif; ?>
        <?php if ($cnt_err): ?><span style="color:var(--err)">✗ <?= $cnt_err ?> errors/skipped</span><?php endif; ?>
      </div>
      <?php foreach ($results as $r): ?>
      <div class="result-row">
        <span class="r-<?= $r['status'] ?>"><?= match($r['status']) {
          'ok'=>'✓','dry'=>'⊙','dup'=>'=','miss'=>'✗','err'=>'✗','skip'=>'⚠','default'=>'?'
        } ?></span>
        <span class="r-file" title="<?= htmlspecialchars($r['file'] ?? '') ?>"><?= htmlspecialchars($r['file'] ?? $r['msg']) ?></span>
        <?php if (!empty($r['entity'])): ?>
        <span class="r-entity"><?= htmlspecialchars($r['entity']) ?></span>
        <?php endif; ?>
        <?php if (!empty($r['label'])): ?>
        <span class="r-msg" style="color:var(--muted)"><?= htmlspecialchars($r['label']) ?></span>
        <?php endif; ?>
        <span class="r-msg r-<?= $r['status'] ?>"><?= htmlspecialchars($r['msg'] ?? '') ?></span>
      </div>
      <?php endforeach; ?>
    </div>
    <?php endif; ?>
  </div>
</div>

<!-- ── Source Folder + Mapping Table ────────────────────────────── -->
<div class="panel">
  <div class="ph">
    <h2>Document Mapping</h2>
    <span style="font-size:10px;color:var(--muted)">
      Source: <?= htmlspecialchars($SOURCE_DIR) ?> ·
      <?= count($source_files) ?> files found
      <?php if (!is_dir($SOURCE_DIR)): ?><span style="color:var(--err)">⚠ Folder not accessible</span><?php endif; ?>
    </span>
  </div>
  <div class="wrap">
    <table>
      <thead>
        <tr>
          <th>File</th>
          <th>Size</th>
          <th>Maps To</th>
          <th>Checklist Criteria</th>
          <th>In Folder?</th>
        </tr>
      </thead>
      <tbody>
        <?php
        // Section criteria lookup (abbreviated from SAFETY_SECTIONS JS)
        $criteria = [
            'A:4'  => 'Letter of Good Standing + signed WCL2',
            'A:3'  => 'Principal contractor appointment letter',
            'A:6'  => 'Notification of Construction Work (CR4)',
            'A:7'  => 'Public Liability Insurance',
            'A:8'  => 'Health and Safety / EHS Policies',
            'A:9'  => 'Company Organogram & Onsite employees Organogram',
            'B:1'  => 'List of all main activities per scope of work',
            'B:6'  => 'Safe Work / Operating Procedures',
            'B:7'  => 'Safety Data Sheets for materials used onsite (HCS)',
            'C:1'  => 'Valid medical certificate of fitness (Annexure 3)',
            'C:2'  => 'Drug & Alcohol Policy + random testing arrangements',
            'D:3'  => 'Competency records as per training matrix',
            'E:1'  => 'Documented Health & Safety Plan',
            'E:2'  => 'Environmental Management Plan (waste, HCS, monitoring)',
            'E:3'  => 'Documented Fall Protection Plan',
            'E:7'  => 'Documented Incident Management Procedure',
            'E:8'  => '24 months of Incident Statistics',
            'E:11' => 'Proof of PPE issued',
            'E:12' => 'Proof of PPE inspections conducted',
            'F:2'  => 'Statutory & Mandatory scheduled inspections',
            'G:1'  => 'Emergency Preparedness Procedure + proof of training',
            'G:3'  => 'Proof of emergency equipment (fire extinguishers, use, maintenance)',
            'H:1'  => 'Manager (Section 16.2)',
            'H:2'  => 'General Supervision (Section 8)',
            'H:3'  => 'SHE Representative (Section 17)',
            'H:6'  => 'Construction H&S Officer (CR8(6))',
            'H:7'  => 'Construction Manager (CR8(1))',
            'H:9'  => 'Construction Supervisor (CR8(7))',
            'H:11' => 'Risk Assessor (CR9(1))',
            'H:12' => 'Fall Protection Planner (CR10(1))',
            'H:29' => 'Construction Vehicle Operator / Inspector (CR23)',
            'H:33' => 'First Aider (GSR3(1)&(4))',
            'I:2'  => 'Weekly Toolbox Talk register (OHS Act Sec 17)',
            'I:10' => 'Monthly Safety Performance Report to management',
        ];

        foreach ($FILE_MAP as $fname => $mappings):
            $src_path = $SOURCE_DIR . '\\' . $fname;
            $exists   = file_exists($src_path);
            $fsize    = $exists ? round(filesize($src_path) / 1024, 1) . ' KB' : '—';
            $rowspan  = count($mappings);
            $first    = true;
        ?>
        <?php foreach ($mappings as $m):
            $key  = $m['sec'] . ':' . $m['no'];
            $crit = $criteria[$key] ?? '—';
            $is_file_level = $m['sec'] === 'file';
        ?>
        <tr>
          <?php if ($first): ?>
          <td rowspan="<?= $rowspan ?>" <?= !$exists ? 'class="file-miss"' : '' ?>>
            <?= htmlspecialchars($fname) ?>
          </td>
          <td rowspan="<?= $rowspan ?>" style="color:var(--muted)"><?= $fsize ?></td>
          <?php $first = false; endif; ?>
          <td>
            <?php if ($is_file_level): ?>
            <span class="badge b-file">FILE</span>
            <?php else: ?>
            <span class="badge b-sec"><?= htmlspecialchars($m['sec']) ?></span>
            <span class="badge b-item">Item <?= $m['no'] ?></span>
            <?php endif; ?>
          </td>
          <td>
            <div><?= htmlspecialchars($m['label']) ?></div>
            <?php if ($crit !== '—'): ?><div class="multi"><?= htmlspecialchars($crit) ?></div><?php endif; ?>
          </td>
          <td>
            <?= $exists
              ? '<span style="color:var(--ok)">✓ Found</span>'
              : '<span class="badge b-miss">NOT FOUND</span>' ?>
          </td>
        </tr>
        <?php endforeach; ?>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>

<!-- ── Unmapped files in source folder ──────────────────────────── -->
<?php
$mapped_names = array_keys($FILE_MAP);
$unmapped = array_filter($source_files, fn($f) => !in_array($f, $mapped_names));
if ($unmapped):
?>
<div class="panel">
  <div class="ph"><h2>Unmapped Files in Source Folder</h2><span style="font-size:10px;color:var(--muted)">These exist in the folder but are not in the mapping — upload manually</span></div>
  <div class="pb">
    <?php foreach ($unmapped as $f): ?>
    <div style="padding:4px 0;color:var(--warn)">⚠ <?= htmlspecialchars($f) ?></div>
    <?php endforeach; ?>
  </div>
</div>
<?php endif; ?>

<div style="padding:20px;color:var(--muted);font-size:10px">
  Safety Docs Import · DEV ONLY · not deployed to production
</div>
</body>
</html>
