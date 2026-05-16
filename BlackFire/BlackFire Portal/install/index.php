<?php
/**
 * BlackFire Solutions Portal — Installation Wizard
 * Delete /install/ directory after setup is complete.
 */

// Block re-install
if (file_exists(__DIR__ . '/install.lock')) {
    die('<html><body style="font-family:sans-serif;padding:40px;background:#0A0E19;color:#E0E4EA">
    <h2 style="color:#F07820">&#128274; Installation already complete</h2>
    <p>Delete <code>/install/install.lock</code> to re-run the installer.<br>
    <a href="../" style="color:#F07820">Return to portal →</a></p></body></html>');
}

$step    = (int)($_POST['step'] ?? $_GET['step'] ?? 1);
$errors  = [];
$success = '';

// ── Step 2: Test Connection ────────────────────────────
$db_host    = $_POST['db_host']    ?? 'localhost';
$db_port    = $_POST['db_port']    ?? '3306';
$db_name    = $_POST['db_name']    ?? 'blackfire_portal';
$db_user    = $_POST['db_user']    ?? '';
$db_pass    = $_POST['db_pass']    ?? '';
$base_url   = $_POST['base_url']   ?? '';
$admin_pass = $_POST['admin_pass'] ?? '';

if ($step === 2 && $_SERVER['REQUEST_METHOD'] === 'POST') {
    // Test DB connection
    try {
        $dsn = "mysql:host={$db_host};port={$db_port};dbname={$db_name};charset=utf8mb4";
        $pdo = new PDO($dsn, $db_user, $db_pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        $success = 'Connection successful.';
    } catch (PDOException $e) {
        $errors[] = 'Connection failed: ' . $e->getMessage();
        $step = 1;
    }
}

// ── Step 3: Create Tables + Seed ──────────────────────
if ($step === 3 && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$admin_pass || strlen($admin_pass) < 8) {
        $errors[] = 'Admin password must be at least 8 characters.';
        $step = 2;
    } else {
        try {
            $dsn = "mysql:host={$db_host};port={$db_port};dbname={$db_name};charset=utf8mb4";
            $pdo = new PDO($dsn, $db_user, $db_pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

            // Run schema
            $sql = file_get_contents(__DIR__ . '/schema.sql');
            // Split and execute statements
            $statements = array_filter(array_map('trim', explode(';', $sql)));
            foreach ($statements as $stmt) {
                if ($stmt) $pdo->exec($stmt);
            }

            // Seed users
            $users = [
                ['admin',   $admin_pass,    'J. Ndlovu',  'admin',          'System Administrator'],
                ['manager', 'BlackFire2026!','T. Nkosi',   'manager',        'Operations Manager'],
                ['calllog', 'CallLog2026!',  'N. Mokoena', 'call_logger',    'Call Logger'],
                ['jtech',   'JTech2026!',    'J. Mthembu', 'junior_tech',    'Junior Technician'],
                ['stech',   'STech2026!',    'R. Khumalo', 'senior_tech',    'Senior Technician'],
                ['support', 'Support2026!',  'L. Dlamini', 'client_support', 'Client Support'],
                ['clerk',   'Clerk2026!',    'A. Sithole', 'admin_clerk',    'Admin Clerk'],
                ['viewer',  'view2026',      'S. Baloyi',  'viewer',         'Read-Only Viewer'],
            ];
            $stmt = $pdo->prepare("INSERT IGNORE INTO bf_users (username, password_hash, name, role, title) VALUES (?,?,?,?,?)");
            foreach ($users as $u) {
                $stmt->execute([$u[0], password_hash($u[1], PASSWORD_BCRYPT), $u[2], $u[3], $u[4]]);
            }

            // Seed sample data
            $d = function(int $offset=0): string {
                return date('Y-m-d', strtotime("$offset days"));
            };
            // Callouts
            $pdo->exec("DELETE FROM bf_callouts");
            $co = $pdo->prepare("INSERT IGNORE INTO bf_callouts (ref_id,client_name,service,location,tech,assigned_to,priority,status,callout_date,callout_time,notes,logged_by,po) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)");
            $co->execute(['JOB-001','AECI Chempark','Armed Response — Perimeter Breach','Sector C Gate','R. Khumalo','stech','Emergency','In Progress',$d(-2),'14:22','Perimeter breach alert. Unit dispatched. Client notified.','calllog','']);
            $co->execute(['JOB-002','AECI Chempark','CCTV System Monthly Sweep','All sectors','J. Mthembu','jtech','Normal','Completed',$d(-5),'08:00','Monthly camera maintenance completed.','calllog','PO-2026-041']);
            $co->execute(['JOB-003','AECI Chempark','Access Control — Biometric Fault','Gate 2','J. Mthembu','jtech','Urgent','Open',$d(0),'09:15','Biometric reader offline. Temporary access manual.','calllog','']);
            $co->execute(['JOB-004','AECI Chempark','Weekend Patrol — Full Site','Full site','R. Khumalo','stech','Normal','Invoiced',$d(-8),'06:00','Scheduled weekend patrol completed without incident.','manager','PO-2026-039']);

            // Quotes
            $pdo->exec("DELETE FROM bf_quote_items; DELETE FROM bf_quotes");
            $qq = $pdo->prepare("INSERT IGNORE INTO bf_quotes (ref_id,client_name,status,valid_until,quote_date,submitted_by,source,approval_status,total_amount) VALUES (?,?,?,?,?,?,?,?,?)");
            $qq->execute(['QTE-001','AECI Chempark','Approved',$d(30),$d(-7),'manager','staff',null, 41975.00]);
            $qq->execute(['QTE-002','AECI Chempark','Sent',$d(14),$d(-3),'manager','staff',null,53500.00]);
            $qq->execute(['QTE-003','AECI Chempark','Pending Approval',$d(21),$d(-1),'stech','senior_tech','pending',6000.00]);
            // Items
            $q1 = $pdo->query("SELECT id FROM bf_quotes WHERE ref_id='QTE-001'")->fetch()['id'];
            $q2 = $pdo->query("SELECT id FROM bf_quotes WHERE ref_id='QTE-002'")->fetch()['id'];
            $q3 = $pdo->query("SELECT id FROM bf_quotes WHERE ref_id='QTE-003'")->fetch()['id'];
            $qi = $pdo->prepare("INSERT INTO bf_quote_items (quote_id,description,qty,unit_price) VALUES (?,?,?,?)");
            $qi->execute([$q1,'Armed Response Contract (12 months)',12,3200]);
            $qi->execute([$q1,'Perimeter Patrol — 4 Officers (monthly)',1,3575]);
            $qi->execute([$q2,'CCTV System Upgrade — 24 IP Cameras',1,45000]);
            $qi->execute([$q2,'Installation, Config & Commissioning',1,8500]);
            $qi->execute([$q3,'Electric Fence Repair — Sector B',1,4200]);
            $qi->execute([$q3,'Labour & Materials',1,1800]);

            // Invoices
            $pdo->exec("DELETE FROM bf_invoices");
            $inv = $pdo->prepare("INSERT IGNORE INTO bf_invoices (ref_id,client_name,amount,due_date,status,quote_ref,callout_ref,po,invoice_date,paid_date) VALUES (?,?,?,?,?,?,?,?,?,?)");
            $inv->execute(['INV-001','AECI Chempark',41975,$d(14),'Sent','QTE-001','','PO-2026-038',$d(-7),null]);
            $inv->execute(['INV-002','AECI Chempark',18800,$d(-5),'Overdue','','JOB-004','PO-2026-039',$d(-20),null]);
            $inv->execute(['INV-003','AECI Chempark',9560,$d(7),'Paid','','JOB-002','PO-2026-041',$d(-10),$d(-3)]);

            // Transactions
            $pdo->exec("DELETE FROM bf_transactions");
            $tx = $pdo->prepare("INSERT INTO bf_transactions (trans_date,description,category,reference,credit,debit) VALUES (?,?,?,?,?,?)");
            $tx->execute([$d(-10),'Payment received — INV-003','Invoice Payment','INV-003',9560,0]);
            $tx->execute([$d(-12),'Fuel — patrol vehicles x3','Vehicle','',0,1840]);
            $tx->execute([$d(-15),'Uniform procurement — 6 units','Equipment','',0,3200]);

            // Reset counters
            $pdo->exec("UPDATE bf_counters SET current_value=4 WHERE counter_type='co'");
            $pdo->exec("UPDATE bf_counters SET current_value=3 WHERE counter_type='q'");
            $pdo->exec("UPDATE bf_counters SET current_value=3 WHERE counter_type='inv'");

            // Write config file
            $config_content = '<?php' . "\n" . 'return [' . "\n"
                . "    'db_host'    => " . var_export($db_host, true) . ",\n"
                . "    'db_port'    => " . (int)$db_port . ",\n"
                . "    'db_name'    => " . var_export($db_name, true) . ",\n"
                . "    'db_user'    => " . var_export($db_user, true) . ",\n"
                . "    'db_pass'    => " . var_export($db_pass, true) . ",\n"
                . "    'db_charset' => 'utf8mb4',\n"
                . "    'app_name'   => 'BlackFire Solutions Portal',\n"
                . "    'app_version'=> '1.0.0',\n"
                . "    'base_url'   => " . var_export(rtrim($base_url, '/'), true) . ",\n"
                . "    'timezone'   => 'Africa/Johannesburg',\n"
                . "];\n";

            $config_path = __DIR__ . '/../config/config.php';
            if (!file_put_contents($config_path, $config_content)) {
                $errors[] = 'Could not write config/config.php — check directory permissions.';
                $step = 2;
            } else {
                // Write lock file
                file_put_contents(__DIR__ . '/install.lock', date('Y-m-d H:i:s') . ' - Installation complete');
                $step = 4; // Done
            }
        } catch (PDOException $e) {
            $errors[] = 'Database error: ' . $e->getMessage();
            $step = 2;
        } catch (Exception $e) {
            $errors[] = 'Error: ' . $e->getMessage();
            $step = 2;
        }
    }
}

$title = ['', 'System Requirements', 'Database Configuration', 'Installing…', 'Complete!'][$step] ?? 'Installer';

?><!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>BlackFire Portal — Installer</title>
<link rel="icon" type="image/png" href="../../blackfire-logo-pack/blackfire_icon_transparent.png">
<link rel="shortcut icon" type="image/png" href="../../blackfire-logo-pack/blackfire_icon_transparent.png">
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;900&family=Instrument+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0A0E19 url('../../blackfire-logo-pack/blackfire_logo_transparent.png') no-repeat center fixed;background-size:auto;background-attachment:fixed;opacity:0.95;color:#E0E4EA;font-family:'Instrument Sans',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
body::before{content:'';position:fixed;inset:0;background-image:url('../../blackfire-logo-pack/blackfire_logo_transparent.png');background-size:auto;background-position:center;background-attachment:fixed;background-repeat:no-repeat;opacity:0.08;pointer-events:none;z-index:0}
.card{background:#141B26;border:1px solid #2B3340;border-radius:4px;width:100%;max-width:560px;overflow:hidden}
.card-header{background:#1E2530;padding:28px 32px;border-bottom:1px solid #2B3340}
.brand{font-family:'Big Shoulders Display',sans-serif;font-size:22px;font-weight:900;margin-bottom:6px}
.brand em{color:#F07820;font-style:normal}
.subtitle{font-family:'IBM Plex Mono',monospace;font-size:10px;color:#7A8699;letter-spacing:2px}
.steps{display:flex;gap:0;padding:0 32px;background:#1E2530;border-bottom:1px solid #2B3340}
.step{padding:12px 16px;font-size:11px;font-family:'IBM Plex Mono',monospace;letter-spacing:1px;color:#7A8699;border-bottom:2px solid transparent}
.step.active{color:#F07820;border-bottom-color:#F07820}
.step.done{color:#1A7A40}
.body{padding:28px 32px}
h2{font-family:'Big Shoulders Display',sans-serif;font-size:20px;font-weight:700;margin-bottom:16px}
.check-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #2B3340;font-size:13px}
.check-row:last-child{border:none}
.ok{color:#1A7A40;font-size:16px}
.fail{color:#C0392B;font-size:16px}
.fgroup{margin-bottom:16px}
label{display:block;font-size:11px;font-family:'IBM Plex Mono',monospace;letter-spacing:1px;color:#7A8699;margin-bottom:6px;text-transform:uppercase}
input{width:100%;background:#1E2530;border:1px solid #2B3340;color:#E0E4EA;padding:10px 12px;font-size:13px;border-radius:2px;font-family:'Instrument Sans',sans-serif}
input:focus{outline:none;border-color:#F07820}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.btn{background:#F07820;color:#fff;border:none;padding:12px 24px;font-family:'Big Shoulders Display',sans-serif;font-size:14px;font-weight:700;letter-spacing:.5px;cursor:pointer;border-radius:2px;width:100%}
.btn:hover{background:#E05A1A}
.errors{background:rgba(192,57,43,.15);border:1px solid rgba(192,57,43,.3);border-radius:2px;padding:12px 16px;margin-bottom:16px}
.errors p{color:#C0392B;font-size:13px;margin-bottom:4px}
.errors p:last-child{margin:0}
.success-box{text-align:center;padding:20px 0}
.success-icon{font-size:48px;margin-bottom:16px}
.creds{background:#1E2530;border:1px solid #2B3340;border-radius:2px;padding:16px;margin:16px 0;font-family:'IBM Plex Mono',monospace;font-size:11px}
.cred-row{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2B3340}
.cred-row:last-child{border:none}
.cred-role{color:#7A8699}
.cred-val{color:#F07820}
.note{font-size:11px;color:#7A8699;margin-top:6px}
.link{color:#F07820;text-decoration:none}
</style>
</head>
<body>
<div class="card">
  <div class="card-header">
    <div class="brand"><em>BlackFire</em> Solutions</div>
    <div class="subtitle">PORTAL INSTALLATION WIZARD · v1.0</div>
  </div>
  <div class="steps">
    <?php
    $stepLabels = ['01 REQUIREMENTS', '02 DATABASE', '03 INSTALL', '04 DONE'];
    foreach ($stepLabels as $i => $label) {
        $n = $i + 1;
        $cls = $n === $step ? 'active' : ($n < $step ? 'done' : '');
        echo "<div class=\"step $cls\">$label</div>";
    }
    ?>
  </div>
  <div class="body">
  <?php if ($errors): ?>
    <div class="errors">
      <?php foreach ($errors as $e): ?><p>⚠ <?= htmlspecialchars($e) ?></p><?php endforeach; ?>
    </div>
  <?php endif; ?>

  <?php if ($step === 1): ?>
    <h2>System Requirements</h2>
    <?php
    $checks = [
        ['PHP Version ≥ 7.4', version_compare(PHP_VERSION, '7.4.0', '>='), PHP_VERSION],
        ['PDO Extension',      extension_loaded('pdo'),       ''],
        ['PDO MySQL Driver',   extension_loaded('pdo_mysql'), ''],
        ['JSON Extension',     extension_loaded('json'),      ''],
        ['config/ writable',   is_writable(__DIR__ . '/../config'), ''],
    ];
    $all_ok = true;
    foreach ($checks as $c) {
        $ok = $c[1];
        if (!$ok) $all_ok = false;
        echo '<div class="check-row">';
        echo '<span class="' . ($ok ? 'ok' : 'fail') . '">' . ($ok ? '✓' : '✗') . '</span>';
        echo '<span>' . htmlspecialchars($c[0]) . '</span>';
        if ($c[2]) echo '<span style="margin-left:auto;font-family:IBM Plex Mono,monospace;font-size:11px;color:#7A8699">' . htmlspecialchars($c[2]) . '</span>';
        echo '</div>';
    }
    ?>
    <form method="post" action="?step=2" style="margin-top:24px">
      <input type="hidden" name="step" value="2">
      <?php if (!$all_ok): ?>
        <p style="color:#C0392B;font-size:13px;margin-bottom:16px">⚠ Fix the above issues before continuing.</p>
      <?php endif; ?>
      <button class="btn" <?= !$all_ok ? 'disabled' : '' ?>>Continue →</button>
    </form>

  <?php elseif ($step === 2): ?>
    <h2>Database & Configuration</h2>
    <form method="post" action="?step=3">
      <input type="hidden" name="step" value="3">
      <div class="grid2">
        <div class="fgroup">
          <label>DB Host</label>
          <input name="db_host" value="<?= htmlspecialchars($db_host) ?>" placeholder="localhost" required>
        </div>
        <div class="fgroup">
          <label>DB Port</label>
          <input name="db_port" value="<?= htmlspecialchars($db_port) ?>" placeholder="3306">
        </div>
      </div>
      <div class="fgroup">
        <label>Database Name</label>
        <input name="db_name" value="<?= htmlspecialchars($db_name) ?>" placeholder="blackfire_portal" required>
        <p class="note">Create this database first in cPanel → MySQL Databases</p>
      </div>
      <div class="grid2">
        <div class="fgroup">
          <label>DB Username</label>
          <input name="db_user" value="<?= htmlspecialchars($db_user) ?>" required>
        </div>
        <div class="fgroup">
          <label>DB Password</label>
          <input name="db_pass" type="password" value="<?= htmlspecialchars($db_pass) ?>">
        </div>
      </div>
      <div class="fgroup">
        <label>Base URL (no trailing slash)</label>
        <input name="base_url" value="<?= htmlspecialchars($base_url ?: 'https://blackfiresolutions.co.za/portal') ?>" required>
      </div>
      <div class="fgroup">
        <label>Admin Password (for "admin" user)</label>
        <input name="admin_pass" type="password" placeholder="Min 8 characters" required minlength="8">
      </div>
      <button class="btn">Install Database & Configure →</button>
    </form>

  <?php elseif ($step === 4): ?>
    <div class="success-box">
      <div class="success-icon">🔥</div>
      <h2>Installation Complete!</h2>
      <p style="color:#7A8699;font-size:13px;margin-top:8px">BlackFire Solutions Portal is ready.</p>

      <div class="creds">
        <div style="font-size:10px;color:#7A8699;letter-spacing:2px;margin-bottom:10px">DEFAULT USERNAMES</div>
        <div class="cred-row"><span class="cred-role">ADMIN</span><span class="cred-val">admin</span></div>
        <div class="cred-row"><span class="cred-role">MANAGER</span><span class="cred-val">manager</span></div>
        <div class="cred-row"><span class="cred-role">CALL LOGGER</span><span class="cred-val">calllog</span></div>
        <div class="cred-row"><span class="cred-role">JUNIOR TECH</span><span class="cred-val">jtech</span></div>
        <div class="cred-row"><span class="cred-role">SENIOR TECH</span><span class="cred-val">stech</span></div>
        <div class="cred-row"><span class="cred-role">CLIENT SUPPORT</span><span class="cred-val">support</span></div>
        <div class="cred-row"><span class="cred-role">ADMIN CLERK</span><span class="cred-val">clerk</span></div>
        <div class="cred-row"><span class="cred-role">VIEWER</span><span class="cred-val">viewer</span></div>
        <div style="font-size:11px;color:#7A8699;margin-top:10px;font-family:IBM Plex Mono,monospace;">
          Passwords are set during install or managed by admin.<br>
          Share credentials privately — never publicly.
        </div>
      </div>

      <p style="color:#C0392B;font-size:12px;font-family:'IBM Plex Mono',monospace;margin:12px 0">
        ⚠ DELETE the /install/ directory now for security.
      </p>
      <a href="../" class="btn" style="display:inline-block;text-decoration:none;margin-top:12px">Open Portal →</a>
    </div>
  <?php endif; ?>
  </div>
</div>
</body>
</html>
