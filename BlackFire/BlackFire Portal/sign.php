<?php
/**
 * sign.php — Public electronic signature page. No portal login required.
 * Linked from emails sent by api/digital_signatures.php.
 * Signer draws their signature on a canvas and clicks "Sign Document".
 * IP address and timestamp are captured for audit purposes.
 */
require_once __DIR__ . '/includes/db.php';
$cfg = require __DIR__ . '/config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');

$token = substr(preg_replace('/[^a-f0-9]/i', '', $_GET['token'] ?? ''), 0, 64);
$rec   = null;
$error = null;

if (!$token) {
    $error = 'No signing token provided.';
} else {
    $rec = db_row(
        "SELECT * FROM bf_digital_signatures
          WHERE token = ? AND signature_method = 'email_link'",
        [$token]
    );
    if (!$rec) {
        $error = 'This signing link is invalid or has already been used.';
    } elseif ($rec['status'] === 'Expired') {
        $error = 'This signing link has expired. Please contact the person who sent it.';
    } elseif (!in_array($rec['status'], ['Pending','Sent','Signed','Declined'], true)) {
        $error = 'This signing link is no longer active.';
    } elseif ($rec['token_expires_at'] && strtotime($rec['token_expires_at']) < time()
              && !in_array($rec['status'], ['Signed','Declined'], true)) {
        db_exec("UPDATE bf_digital_signatures SET status='Expired' WHERE id=?", [$rec['id']]);
        $error = 'This signing link has expired. Please contact the requesting party.';
    }
}

$signed   = $rec && $rec['status'] === 'Signed';
$declined = $rec && $rec['status'] === 'Declined';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $rec && !$error && !$signed && !$declined) {
    $act = $_POST['act'] ?? '';
    $ip  = substr($_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '', 0, 45);

    if ($act === 'sign') {
        $sig_image = null;
        if (!empty($_POST['signature_image'])) {
            // Validate it's a PNG data URI and strip the prefix — store only base64 payload
            if (preg_match('/^data:image\/png;base64,([A-Za-z0-9+\/=]+)$/', $_POST['signature_image'], $m)) {
                $sig_image = $m[1];
            }
        }
        db_exec(
            "UPDATE bf_digital_signatures
             SET status='Signed', signed_at=NOW(), signer_ip=?, signature_image=?
             WHERE id=?",
            [$ip, $sig_image, $rec['id']]
        );
        $rec    = db_row("SELECT * FROM bf_digital_signatures WHERE id=?", [$rec['id']]);
        $signed = true;

    } elseif ($act === 'decline') {
        $reason = substr(trim($_POST['decline_reason'] ?? ''), 0, 1000);
        db_exec(
            "UPDATE bf_digital_signatures
             SET status='Declined', declined_at=NOW(), signer_ip=?, declined_reason=?
             WHERE id=?",
            [$ip, $reason ?: null, $rec['id']]
        );
        $rec      = db_row("SELECT * FROM bf_digital_signatures WHERE id=?", [$rec['id']]);
        $declined = true;
    }
}

$company = htmlspecialchars($cfg['company_name'] ?? 'BlackFire Solutions');
$name_h  = $rec ? htmlspecialchars($rec['signer_name'])                  : '';
$label_h = $rec ? htmlspecialchars($rec['document_label'])               : '';
$role_h  = $rec && $rec['signer_role'] ? htmlspecialchars($rec['signer_role']) : '';
$co_h    = $rec && $rec['signer_company'] ? htmlspecialchars($rec['signer_company']) : '';
$ref_h   = $rec ? htmlspecialchars($rec['entity_ref'])                   : '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Electronic Signature — <?= $company ?></title>
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
canvas{border:2px solid #cbd5e1;border-radius:4px;width:100%;height:160px;cursor:crosshair;touch-action:none;background:#fff;display:block}
.sig-tools{display:flex;gap:8px;margin-top:8px;align-items:center}
.btn-sm{padding:6px 14px;border-radius:4px;font-size:13px;cursor:pointer;border:1px solid #cbd5e1;background:#f8fafc}
.btn-sm:hover{background:#e2e8f0}
.consent-row{display:flex;align-items:flex-start;gap:10px;margin:20px 0;padding:14px;background:#fef3c7;border:1px solid #d97706;border-radius:4px}
.consent-row input[type=checkbox]{width:18px;height:18px;flex-shrink:0;margin-top:2px;cursor:pointer}
.consent-row label{font-size:13px;color:#92400e;cursor:pointer;line-height:1.5}
.btn-row{display:flex;gap:12px;margin-top:20px;flex-wrap:wrap}
.btn{padding:12px 24px;border-radius:4px;font-size:15px;font-weight:bold;cursor:pointer;border:none}
.btn-sign{background:#16a34a;color:#fff}
.btn-sign:hover:not(:disabled){background:#15803d}
.btn-sign:disabled{background:#94a3b8;cursor:not-allowed}
.btn-dec{background:#f1f5f9;color:#64748b;border:1px solid #cbd5e1}
.btn-dec:hover{background:#e2e8f0}
.decline-section{margin-top:20px;padding:16px;border:1px solid #fca5a5;border-radius:6px;background:#fff5f5}
.decline-section p{font-size:14px;margin-bottom:10px;color:#7f1d1d}
textarea{width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:4px;font-size:14px;resize:vertical}
.btn-decline-confirm{background:#dc2626;color:#fff;padding:10px 20px;border-radius:4px;font-size:14px;font-weight:bold;cursor:pointer;border:none;margin-top:10px}
.btn-decline-confirm:hover{background:#b91c1c}
.success{background:#dcfce7;border:1px solid #16a34a;border-radius:6px;padding:24px;text-align:center}
.success h2{color:#15803d;margin-bottom:8px}
.success p{color:#166534;font-size:14px;margin-top:6px}
.declined-msg{background:#fee2e2;border:1px solid #dc2626;border-radius:6px;padding:24px;text-align:center}
.declined-msg h2{color:#dc2626;margin-bottom:8px}
.error-msg{background:#fee2e2;border:1px solid #dc2626;border-radius:6px;padding:24px;text-align:center}
.error-msg h2{color:#dc2626;margin-bottom:8px}
.footer{margin-top:24px;font-size:12px;color:#94a3b8;text-align:center}
.sig-label{font-size:13px;font-weight:bold;display:block;margin-bottom:8px;color:#475569}
</style>
</head>
<body>
<div class="card">
  <div class="card-hdr">
    <h1><?= $company ?></h1>
    <p>Electronic Signature Request</p>
  </div>
  <div class="card-body">

<?php if ($error): ?>
  <div class="error-msg">
    <h2>Link Unavailable</h2>
    <p style="font-size:14px;color:#64748b;margin-top:8px"><?= htmlspecialchars($error) ?></p>
  </div>

<?php elseif ($signed): ?>
  <div class="success">
    <h2>&#10003; Signature Recorded</h2>
    <p><strong><?= $name_h ?></strong> has electronically signed:</p>
    <p><em><?= $label_h ?></em></p>
    <?php if ($rec['signed_at']): ?>
    <p style="margin-top:10px;font-size:12px;color:#64748b">Recorded: <?= htmlspecialchars($rec['signed_at']) ?> &mdash; IP: <?= htmlspecialchars($rec['signer_ip'] ?? '') ?></p>
    <?php endif; ?>
  </div>
  <p style="margin-top:16px;font-size:13px;color:#64748b">You may close this page. Your electronic signature has been securely logged for audit purposes.</p>

<?php elseif ($declined): ?>
  <div class="declined-msg">
    <h2>Signature Declined</h2>
    <p style="font-size:14px;margin-top:8px">You have declined to sign this document. The requesting party has been notified. Please contact them directly if you have concerns or need to discuss the document.</p>
  </div>

<?php else: ?>
  <p style="margin-bottom:16px">Dear <strong><?= $name_h ?></strong><?= $role_h ? ' <span style="color:#64748b;font-weight:normal">(' . $role_h . ')</span>' : '' ?>,</p>
  <p style="font-size:14px;color:#475569">You have been asked to electronically sign the following document. Please review the details, draw your signature below, and click <strong>Sign Document</strong>.</p>

  <div class="info-block">
    <p><strong>Document:</strong> <?= $label_h ?></p>
    <p><strong>Reference:</strong> <?= $ref_h ?></p>
    <?php if ($co_h): ?><p><strong>Your Organisation:</strong> <?= $co_h ?></p><?php endif; ?>
    <?php if ($rec['token_expires_at']): ?>
    <p><strong>Link expires:</strong> <?= htmlspecialchars(date('d M Y H:i', strtotime($rec['token_expires_at']))) ?></p>
    <?php endif; ?>
  </div>

  <form method="POST" id="sigForm">
    <input type="hidden" name="token" value="<?= htmlspecialchars($token) ?>">
    <input type="hidden" name="signature_image" id="sigData">

    <div style="margin-bottom:16px">
      <span class="sig-label">Your Signature <span style="font-weight:normal;color:#64748b">(draw below using mouse or touch)</span></span>
      <canvas id="sigCanvas"></canvas>
      <div class="sig-tools">
        <button type="button" class="btn-sm" onclick="clearSig()">&#8635; Clear</button>
        <span id="sigHint" style="font-size:12px;color:#94a3b8">Draw your signature above</span>
      </div>
    </div>

    <div class="consent-row">
      <input type="checkbox" id="consent" onchange="updateSignBtn()">
      <label for="consent">
        I, <strong><?= $name_h ?></strong>, hereby electronically sign <em><?= $label_h ?></em>.
        I confirm I have read, understood, and agree to the contents of this document.
        I acknowledge that this electronic signature is legally binding under the
        Electronic Communications and Transactions Act (ECT Act) 25 of 2002 of South Africa.
      </label>
    </div>

    <div class="btn-row">
      <button type="button" class="btn btn-sign" id="signBtn" onclick="submitSign()" disabled>&#10003; Sign Document</button>
      <button type="button" class="btn btn-dec" onclick="toggleDecline()">Decline</button>
    </div>

    <div class="decline-section" id="declineSection" style="display:none">
      <p><strong>Reason for declining</strong> (optional — will be recorded):</p>
      <textarea name="decline_reason" rows="3" placeholder="Enter your reason for declining..."></textarea>
      <br>
      <button type="submit" name="act" value="decline" class="btn-decline-confirm"
              onclick="return confirm('Confirm: you are declining to sign this document.')">
        Confirm Decline
      </button>
    </div>

  </form>
<?php endif; ?>

  </div>
</div>
<p class="footer"><?= $company ?> &mdash; Electronic signatures are recorded with a timestamp and IP address for compliance and audit purposes (ECT Act 25 of 2002).</p>

<script>
const canvas = document.getElementById('sigCanvas');
const signBtn = document.getElementById('signBtn');
const sigHint = document.getElementById('sigHint');
const consent = document.getElementById('consent');
let hasDrawn = false;

if (canvas) {
  const ctx = canvas.getContext('2d');
  let drawing = false;

  function resize() {
    const w = canvas.parentElement.getBoundingClientRect().width;
    // Preserve drawing on resize by re-drawing from image data
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    canvas.width  = Math.floor(w);
    canvas.height = 160;
    ctx.putImageData(img, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - r.left) * (canvas.width / r.width),
             y: (src.clientY - r.top)  * (canvas.height / r.height) };
  }

  function startDraw(e) {
    drawing = true;
    ctx.beginPath();
    const p = getPos(e);
    ctx.moveTo(p.x, p.y);
  }
  function draw(e) {
    if (!drawing) return;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e293b';
    const p = getPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    if (!hasDrawn) {
      hasDrawn = true;
      if (sigHint) sigHint.textContent = 'Signature drawn';
      updateSignBtn();
    }
  }
  function endDraw() { drawing = false; }

  canvas.addEventListener('mousedown',  startDraw);
  canvas.addEventListener('mousemove',  draw);
  canvas.addEventListener('mouseup',    endDraw);
  canvas.addEventListener('mouseleave', endDraw);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); startDraw(e); }, { passive: false });
  canvas.addEventListener('touchmove',  e => { e.preventDefault(); draw(e); },      { passive: false });
  canvas.addEventListener('touchend',   endDraw);
}

function clearSig() {
  if (!canvas) return;
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  hasDrawn = false;
  if (sigHint) sigHint.textContent = 'Draw your signature above';
  updateSignBtn();
}

function updateSignBtn() {
  if (signBtn) signBtn.disabled = !(hasDrawn && consent && consent.checked);
}
if (consent) consent.addEventListener('change', updateSignBtn);

function submitSign() {
  const sd = document.getElementById('sigData');
  if (canvas && sd) sd.value = canvas.toDataURL('image/png');
  const form = document.getElementById('sigForm');
  const hidden = document.createElement('input');
  hidden.type  = 'hidden';
  hidden.name  = 'act';
  hidden.value = 'sign';
  form.appendChild(hidden);
  form.submit();
}

function toggleDecline() {
  const sec = document.getElementById('declineSection');
  sec.style.display = sec.style.display === 'none' ? 'block' : 'none';
}
</script>
</body>
</html>
