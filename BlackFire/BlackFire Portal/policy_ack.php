<?php
/**
 * Public policy acknowledgment page — no portal login required.
 * Linked from emails sent by safety_policy.php.
 * Employee reads the policy, clicks Acknowledge, and this records acked_at.
 */
require_once __DIR__ . '/includes/db.php';
$cfg = require __DIR__ . '/config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');

$token  = substr(preg_replace('/[^a-f0-9]/i', '', $_GET['token'] ?? ''), 0, 64);
$status = null;
$rec    = null;
$error  = null;

if (!$token) { $error = 'No acknowledgment token provided.'; }
else {
    $rec = db_row("SELECT * FROM bf_policy_acks WHERE token = ?", [$token]);
    if (!$rec) { $error = 'This acknowledgment link is invalid or has expired. Please contact your H&S representative.'; }
}

$acknowledged = $rec && $rec['status'] === 'Acknowledged';
$declined     = $rec && $rec['status'] === 'Declined';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $rec && !$acknowledged && !$declined) {
    $act = $_POST['act'] ?? '';
    if ($act === 'acknowledge') {
        $ip = substr($_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '', 0, 45);
        db_exec(
            "UPDATE bf_policy_acks SET status='Acknowledged', acked_at=NOW(), acked_ip=? WHERE id=?",
            [$ip, $rec['id']]
        );
        $acknowledged = true;
        $status = 'ok';
    } elseif ($act === 'decline') {
        $ip = substr($_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '', 0, 45);
        db_exec(
            "UPDATE bf_policy_acks SET status='Declined', acked_at=NOW(), acked_ip=? WHERE id=?",
            [$ip, $rec['id']]
        );
        $declined = true;
        $status = 'declined';
    }
}

$company = htmlspecialchars($cfg['company_name'] ?? 'Astute Insights / BlackFire Solutions');
$name_h  = $rec ? htmlspecialchars($rec['recipient_name']) : '';
$title_h = $rec ? htmlspecialchars($rec['policy_title'])   : '';
$ref_h   = $rec ? htmlspecialchars($rec['file_ref'])       : '';
$body_h  = $rec && $rec['policy_body'] ? nl2br(htmlspecialchars($rec['policy_body'])) : '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Policy Acknowledgment — <?= $company ?></title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;background:#f1f5f9;color:#1e293b;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:32px 16px}
.card{background:#fff;border-radius:8px;box-shadow:0 2px 16px rgba(0,0,0,.1);max-width:640px;width:100%;padding:0;overflow:hidden}
.card-hdr{background:#1a1a1a;padding:20px 28px}
.card-hdr h1{color:#f97316;font-size:22px;margin-bottom:4px}
.card-hdr p{color:#94a3b8;font-size:13px}
.card-body{padding:28px}
.info-block{border:1px solid #e2e8f0;border-left:4px solid #f97316;padding:14px 16px;margin:16px 0;background:#fafafa;border-radius:0 4px 4px 0}
.info-block p{margin-bottom:6px;font-size:14px}
.info-block p:last-child{margin-bottom:0}
.policy-body{background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;padding:16px;margin:16px 0;font-size:14px;line-height:1.6;white-space:pre-line;max-height:360px;overflow-y:auto}
.btn-row{display:flex;gap:12px;margin-top:24px;flex-wrap:wrap}
.btn{padding:12px 24px;border-radius:4px;font-size:15px;font-weight:bold;cursor:pointer;border:none}
.btn-ack{background:#16a34a;color:#fff}
.btn-ack:hover{background:#15803d}
.btn-dec{background:#f1f5f9;color:#64748b;border:1px solid #cbd5e1}
.btn-dec:hover{background:#e2e8f0}
.success{background:#dcfce7;border:1px solid #16a34a;border-radius:6px;padding:20px;text-align:center;margin-top:8px}
.success h2{color:#15803d;margin-bottom:6px}
.success p{color:#166534;font-size:14px}
.declined-msg{background:#fee2e2;border:1px solid #dc2626;border-radius:6px;padding:20px;text-align:center;margin-top:8px}
.declined-msg h2{color:#dc2626;margin-bottom:6px}
.already{background:#fef3c7;border:1px solid #d97706;border-radius:6px;padding:16px;margin-top:8px}
.already h2{color:#b45309;margin-bottom:4px}
.error-msg{background:#fee2e2;border:1px solid #dc2626;border-radius:6px;padding:20px;text-align:center}
.error-msg h2{color:#dc2626;margin-bottom:8px}
.footer{margin-top:24px;font-size:12px;color:#94a3b8;text-align:center}
</style>
</head>
<body>
<div class="card">
  <div class="card-hdr">
    <h1><?= $company ?></h1>
    <p>Health &amp; Safety — Policy Acknowledgment</p>
  </div>
  <div class="card-body">
<?php if ($error): ?>
    <div class="error-msg">
      <h2>Invalid Link</h2>
      <p><?= htmlspecialchars($error) ?></p>
    </div>
<?php elseif ($acknowledged): ?>
    <div class="success">
      <h2>&#10003; Acknowledgment Recorded</h2>
      <p><strong><?= $name_h ?></strong> has acknowledged the policy:<br><em><?= $title_h ?></em></p>
      <?php if ($rec['acked_at']): ?><p style="margin-top:8px;font-size:13px">Recorded: <?= htmlspecialchars($rec['acked_at']) ?></p><?php endif; ?>
    </div>
    <p style="margin-top:16px;color:#64748b;font-size:13px">You may close this page. Your acknowledgment has been saved and the H&amp;S administrator has been notified.</p>
<?php elseif ($declined): ?>
    <div class="declined-msg">
      <h2>Acknowledgment Declined</h2>
      <p>You have indicated that you do not accept this policy. Please contact your H&amp;S representative immediately before commencing any site work.</p>
    </div>
<?php else: ?>
    <p style="margin-bottom:16px">Dear <strong><?= $name_h ?></strong>,</p>
    <p>Please read the following Health &amp; Safety policy carefully. By clicking <strong>I Acknowledge</strong>, you confirm that you have read, understood, and accept this policy as it applies to your scope of work on site.</p>

    <div class="info-block">
      <p><strong>Policy:</strong> <?= $title_h ?></p>
      <p><strong>Safety File Reference:</strong> <?= $ref_h ?></p>
    </div>

    <?php if ($body_h): ?>
    <div class="policy-body"><?= $body_h ?></div>
    <?php endif; ?>

    <?php if ($rec['status'] === 'Pending'): ?>
    <p style="margin-top:16px;color:#dc2626;font-size:13px">&#9888; This acknowledgment has not yet been sent — your acknowledgment will still be recorded.</p>
    <?php endif; ?>

    <form method="POST">
      <input type="hidden" name="token" value="<?= htmlspecialchars($token) ?>">
      <div class="btn-row">
        <button class="btn btn-ack" type="submit" name="act" value="acknowledge">&#10003; I Acknowledge this Policy</button>
        <button class="btn btn-dec" type="submit" name="act" value="decline" onclick="return confirm('Declining means you do not accept this policy. Your H&S representative will be notified. Proceed?')">I Decline</button>
      </div>
    </form>
<?php endif; ?>
  </div>
</div>
<p class="footer"><?= $company ?> — Secure policy acknowledgment portal. Your response is logged with a timestamp and IP address for compliance purposes.</p>
</body>
</html>
