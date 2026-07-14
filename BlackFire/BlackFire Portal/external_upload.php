<?php
/**
 * external_upload.php — Public document upload page. No portal login required.
 * Linked from emails sent by api/external_uploads.php.
 * External parties (doctors, trainers, sub-contractors) upload files directly
 * into a safety file section without needing a portal account.
 */
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/file_storage.php';
$cfg = require __DIR__ . '/config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');

$token = substr(preg_replace('/[^a-f0-9]/i', '', $_GET['token'] ?? ''), 0, 64);
$rec   = null;
$error = null;
$upload_errors = [];
$success_count = 0;

if (!$token) {
    $error = 'No upload token provided.';
} else {
    $rec = db_row(
        "SELECT * FROM bf_external_upload_tokens
          WHERE token = ? AND status IN ('Active','Partially Used')",
        [$token]
    );
    if (!$rec) {
        $error = 'This upload link is invalid, has already been completed, or has been cancelled.';
    } elseif (strtotime($rec['expires_at']) < time()) {
        db_exec("UPDATE bf_external_upload_tokens SET status='Expired' WHERE id=?", [$rec['id']]);
        $error = 'This upload link has expired. Please contact the person who sent it to request a new link.';
    } elseif ((int)$rec['files_uploaded'] >= (int)$rec['max_files']) {
        $error = 'The maximum number of files for this request has already been received. Thank you.';
    }
}

$allowed_mimes = $rec ? array_map('trim', explode(',', $rec['allowed_mime_types'] ?? '')) : [];
$mime_ext_map  = [
    'application/pdf' => 'pdf',
    'image/jpeg'      => 'jpg',
    'image/png'       => 'png',
];

// Handle POST upload
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $rec && !$error) {
    $uploader_name    = substr(trim($_POST['uploader_name']    ?? ''), 0, 255);
    $uploader_email   = substr(trim($_POST['uploader_email']   ?? ''), 0, 255);
    $uploader_company = substr(trim($_POST['uploader_company'] ?? ''), 0, 255);
    $uploader_phone   = substr(trim($_POST['uploader_phone']   ?? ''), 0, 50);

    if (!$uploader_name) {
        $upload_errors[] = 'Your full name is required.';
    }

    if (empty($_FILES['file']) || $_FILES['file']['error'] === UPLOAD_ERR_NO_FILE) {
        $upload_errors[] = 'No file was selected.';
    }

    if (empty($upload_errors)) {
        $f = $_FILES['file'];
        if ($f['error'] !== UPLOAD_ERR_OK) {
            $msgs = [
                UPLOAD_ERR_INI_SIZE  => 'File exceeds server upload limit',
                UPLOAD_ERR_FORM_SIZE => 'File too large',
                UPLOAD_ERR_PARTIAL   => 'Upload was incomplete — please try again',
            ];
            $upload_errors[] = $msgs[$f['error']] ?? 'Upload error (' . $f['error'] . ')';
        } elseif ($f['size'] > 10 * 1024 * 1024) {
            $upload_errors[] = 'File exceeds the 10 MB limit.';
        } else {
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $mime  = $finfo->file($f['tmp_name']);
            if (!in_array($mime, $allowed_mimes, true)) {
                $readable = implode(', ', array_map(fn($m) => strtoupper($mime_ext_map[$m] ?? $m), $allowed_mimes));
                $upload_errors[] = "File type not accepted. Allowed formats: {$readable}.";
            } else {
                $ext    = $mime_ext_map[$mime] ?? 'bin';
                $stored = bin2hex(random_bytes(16)) . '.' . $ext;
                $dir    = bf_upload_dir();
                if (!is_dir($dir)) mkdir($dir, 0755, true);

                if (!move_uploaded_file($f['tmp_name'], $dir . '/' . $stored)) {
                    $upload_errors[] = 'Could not save the file. Please try again.';
                } else {
                    $uploaded_by = 'ext:' . ($uploader_email ?: $uploader_name);
                    db_exec(
                        "INSERT INTO bf_attachments
                           (entity_type, entity_ref, original_name, stored_name, file_size, mime_type, uploaded_by)
                         VALUES (?,?,?,?,?,?,?)",
                        [$rec['entity_type'], $rec['entity_ref'],
                         basename($f['name']), $stored, (int)$f['size'], $mime, $uploaded_by]
                    );

                    $new_count  = (int)$rec['files_uploaded'] + 1;
                    $new_status = $new_count >= (int)$rec['max_files'] ? 'Completed' : 'Partially Used';
                    $completed  = $new_status === 'Completed' ? date('Y-m-d H:i:s') : null;

                    db_exec(
                        "UPDATE bf_external_upload_tokens SET
                           files_uploaded   = ?,
                           status           = ?,
                           first_used_at    = COALESCE(first_used_at, NOW()),
                           completed_at     = ?,
                           uploader_name    = COALESCE(NULLIF(uploader_name,''), ?),
                           uploader_email   = COALESCE(NULLIF(uploader_email,''), ?),
                           uploader_company = COALESCE(NULLIF(uploader_company,''), ?),
                           uploader_phone   = COALESCE(NULLIF(uploader_phone,''), ?)
                         WHERE id = ?",
                        [$new_count, $new_status, $completed,
                         $uploader_name, $uploader_email, $uploader_company, $uploader_phone,
                         $rec['id']]
                    );

                    // Notify portal contact on first upload only
                    if ($rec['notify_email'] && (int)$rec['files_uploaded'] === 0) {
                        try {
                            require_once __DIR__ . '/includes/mailer.php';
                            $ref_h     = htmlspecialchars($rec['entity_ref']);
                            $name_h    = htmlspecialchars($uploader_name);
                            $co_h      = $uploader_company ? ' (' . htmlspecialchars($uploader_company) . ')' : '';
                            $file_h    = htmlspecialchars(basename($f['name']));
                            $purpose_h = htmlspecialchars($rec['upload_purpose']);
                            $html  = "<html><body style='font-family:Arial,sans-serif;color:#333'>";
                            $html .= "<h2>" . htmlspecialchars($cfg['company_name'] ?? 'BlackFire Solutions') . "</h2>";
                            $html .= "<p>An external document has been uploaded against <strong>{$ref_h}</strong>.</p>";
                            $html .= "<ul><li><strong>File:</strong> {$file_h}</li>";
                            $html .= "<li><strong>Uploaded by:</strong> {$name_h}{$co_h}</li>";
                            if ($uploader_email) $html .= "<li><strong>Email:</strong> " . htmlspecialchars($uploader_email) . "</li>";
                            $html .= "<li><strong>Purpose:</strong> {$purpose_h}</li></ul>";
                            $html .= "<p>Log in to the portal to review and file the document.</p></body></html>";
                            send_mail($rec['notify_email'], "External document received — {$rec['entity_ref']}", $html);
                        } catch (Throwable $e) {
                            error_log('external_upload notify error: ' . $e->getMessage());
                        }
                    }

                    $rec = db_row("SELECT * FROM bf_external_upload_tokens WHERE id=?", [$rec['id']]);
                    $success_count++;
                }
            }
        }
    }
}

$company   = htmlspecialchars($cfg['company_name'] ?? 'Astute Insights / BlackFire Solutions');
$remaining = $rec ? max(0, (int)$rec['max_files'] - (int)$rec['files_uploaded']) : 0;
$full      = $rec && $remaining === 0;
$pct       = $rec && (int)$rec['max_files'] > 0
             ? round(((int)$rec['files_uploaded'] / (int)$rec['max_files']) * 100)
             : 0;
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Document Upload — <?= $company ?></title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;background:#f1f5f9;color:#1e293b;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:32px 16px}
.card{background:#fff;border-radius:8px;box-shadow:0 2px 16px rgba(0,0,0,.1);max-width:640px;width:100%;overflow:hidden}
.card-hdr{background:#1a1a1a;padding:20px 28px}
.card-hdr h1{color:#f97316;font-size:22px;margin-bottom:4px}
.card-hdr p{color:#94a3b8;font-size:13px}
.card-body{padding:28px}
.info-block{border:1px solid #e2e8f0;border-left:4px solid #f97316;padding:14px 16px;margin:16px 0;background:#fafafa;border-radius:0 4px 4px 0}
.info-block p{margin-bottom:6px;font-size:14px}
.info-block p:last-child{margin:0}
.form-group{margin-bottom:16px}
label{display:block;font-size:13px;font-weight:bold;margin-bottom:6px;color:#475569}
input[type=text],input[type=email],input[type=tel]{width:100%;padding:10px 12px;border:1px solid #cbd5e1;border-radius:4px;font-size:14px;color:#1e293b}
input:focus{outline:none;border-color:#f97316;box-shadow:0 0 0 2px rgba(249,115,22,.2)}
.drop-zone{border:2px dashed #cbd5e1;border-radius:6px;padding:32px 16px;text-align:center;cursor:pointer;transition:border-color .2s,background .2s}
.drop-zone:hover,.drop-zone.drag-over{border-color:#f97316;background:#fff7ed}
.drop-zone p{color:#64748b;margin-bottom:6px;font-size:14px}
.drop-zone strong{color:#f97316}
.drop-zone input[type=file]{display:none}
.file-selected{margin-top:10px;padding:8px 12px;background:#f0fdf4;border:1px solid #16a34a;border-radius:4px;font-size:13px;color:#15803d}
.progress-wrap{margin:12px 0}
.progress-label{font-size:12px;color:#64748b;margin-bottom:4px}
.progress-bar{background:#e2e8f0;border-radius:4px;height:8px}
.progress-bar-fill{height:8px;border-radius:4px;background:#f97316;transition:width .4s}
.btn{display:inline-block;padding:12px 28px;border-radius:4px;font-size:15px;font-weight:bold;cursor:pointer;border:none;background:#f97316;color:#fff;width:100%;margin-top:8px}
.btn:hover{background:#ea6b0c}
.success-box{background:#dcfce7;border:1px solid #16a34a;border-radius:6px;padding:20px;margin-bottom:16px;text-align:center}
.success-box h2{color:#15803d;margin-bottom:6px}
.error-box{background:#fee2e2;border:1px solid #dc2626;border-radius:6px;padding:16px;margin-bottom:16px}
.error-box h3{color:#991b1b;margin-bottom:8px;font-size:15px}
.error-box ul{padding-left:18px}
.error-box li{font-size:14px;color:#991b1b;margin-bottom:4px}
.invalid-box{background:#fee2e2;border:1px solid #dc2626;border-radius:6px;padding:24px;text-align:center}
.invalid-box h2{color:#dc2626;margin-bottom:8px}
.footer{margin-top:24px;font-size:12px;color:#94a3b8;text-align:center}
</style>
</head>
<body>
<div class="card">
  <div class="card-hdr">
    <h1><?= $company ?></h1>
    <p>Secure Document Upload Portal</p>
  </div>
  <div class="card-body">

<?php if ($error): ?>
  <div class="invalid-box">
    <h2>Link Unavailable</h2>
    <p style="font-size:14px;color:#64748b;margin-top:8px"><?= htmlspecialchars($error) ?></p>
  </div>

<?php elseif ($full && $success_count === 0): ?>
  <div class="success-box">
    <h2>&#10003; Upload Complete</h2>
    <p>All <?= (int)$rec['max_files'] ?> document(s) for this request have been received. Thank you.</p>
  </div>

<?php else: ?>

  <?php if ($success_count > 0): ?>
  <div class="success-box">
    <h2>&#10003; Document Received</h2>
    <?php if ($remaining > 0): ?>
    <p>Your file has been uploaded. You may upload <?= $remaining ?> more document(s) using this link.</p>
    <?php else: ?>
    <p>Your file has been uploaded. All requested documents have been received — thank you.</p>
    <?php endif; ?>
  </div>
  <?php endif; ?>

  <?php if ($full): ?>
  <div class="success-box">
    <h2>&#10003; All Documents Received</h2>
    <p>No further uploads are required for this request.</p>
  </div>
  <?php else: ?>

  <?php if (!empty($upload_errors)): ?>
  <div class="error-box">
    <h3>Please correct the following:</h3>
    <ul><?php foreach ($upload_errors as $ue): ?><li><?= htmlspecialchars($ue) ?></li><?php endforeach; ?></ul>
  </div>
  <?php endif; ?>

  <h2 style="font-size:18px;margin-bottom:12px">Document Upload Request</h2>

  <div class="info-block">
    <p><strong>Reference:</strong> <?= htmlspecialchars($rec['entity_ref']) ?></p>
    <p><strong>What to upload:</strong> <?= htmlspecialchars($rec['upload_purpose']) ?></p>
    <?php if ($rec['section_key']): ?>
    <p><strong>Section:</strong> <?= htmlspecialchars($rec['section_key']) ?><?= $rec['item_no'] ? ' — Item ' . (int)$rec['item_no'] : '' ?></p>
    <?php endif; ?>
    <p><strong>Accepted:</strong> <?= htmlspecialchars(implode(', ', array_map('strtoupper', array_map(fn($m) => $mime_ext_map[$m] ?? $m, $allowed_mimes)))) ?> &mdash; max 10 MB</p>
    <p><strong>Expires:</strong> <?= htmlspecialchars(date('d M Y', strtotime($rec['expires_at']))) ?></p>
  </div>

  <div class="progress-wrap">
    <div class="progress-label"><?= (int)$rec['files_uploaded'] ?> of <?= (int)$rec['max_files'] ?> file(s) received</div>
    <div class="progress-bar"><div class="progress-bar-fill" style="width:<?= $pct ?>%"></div></div>
  </div>

  <form method="POST" enctype="multipart/form-data">
    <input type="hidden" name="token" value="<?= htmlspecialchars($token) ?>">

    <div class="form-group">
      <label for="uploader_name">Your Full Name <span style="color:#dc2626">*</span></label>
      <input type="text" id="uploader_name" name="uploader_name" required
             value="<?= htmlspecialchars($rec['uploader_name'] ?? $_POST['uploader_name'] ?? '') ?>"
             placeholder="e.g. Dr. Aisha Petersen">
    </div>
    <div class="form-group">
      <label for="uploader_company">Company / Organisation</label>
      <input type="text" id="uploader_company" name="uploader_company"
             value="<?= htmlspecialchars($rec['uploader_company'] ?? $_POST['uploader_company'] ?? '') ?>"
             placeholder="e.g. Occupational Health Solutions Pty Ltd">
    </div>
    <div class="form-group">
      <label for="uploader_email">Your Email Address</label>
      <input type="email" id="uploader_email" name="uploader_email"
             value="<?= htmlspecialchars($rec['uploader_email'] ?? $_POST['uploader_email'] ?? '') ?>"
             placeholder="e.g. doctor@clinic.co.za">
    </div>

    <div class="form-group">
      <label>Select File <span style="color:#dc2626">*</span></label>
      <div class="drop-zone" id="dropZone" onclick="document.getElementById('fileInput').click()">
        <p>Click to browse or drag &amp; drop here</p>
        <p><strong><?= htmlspecialchars(implode(', ', array_map('strtoupper', array_map(fn($m) => $mime_ext_map[$m] ?? $m, $allowed_mimes)))) ?> — max 10 MB</strong></p>
        <input type="file" id="fileInput" name="file"
               accept="<?= htmlspecialchars(implode(',', $allowed_mimes)) ?>"
               onchange="showFile(this)">
        <div class="file-selected" id="fileSelected" style="display:none"></div>
      </div>
    </div>

    <button class="btn" type="submit">Upload Document</button>
  </form>

  <?php endif; ?>

<?php endif; ?>

  </div>
</div>
<p class="footer"><?= $company ?> &mdash; Secure document upload. Files are stored encrypted and access-controlled.</p>

<script>
function showFile(input) {
  const el = document.getElementById('fileSelected');
  if (input.files && input.files[0]) {
    const kb = Math.round(input.files[0].size / 1024);
    el.textContent = 'Selected: ' + input.files[0].name + ' (' + kb + ' KB)';
    el.style.display = 'block';
  }
}
const dz = document.getElementById('dropZone');
if (dz) {
  dz.addEventListener('dragover',  e => { e.preventDefault(); dz.classList.add('drag-over'); });
  dz.addEventListener('dragleave', ()  => dz.classList.remove('drag-over'));
  dz.addEventListener('drop', e => {
    e.preventDefault();
    dz.classList.remove('drag-over');
    const fi = document.getElementById('fileInput');
    fi.files = e.dataTransfer.files;
    showFile(fi);
  });
}
</script>
</body>
</html>
