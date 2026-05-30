<?php
/**
 * bhekani_bo.php — "Look at them all" (Zulu)
 * DEV DB viewer: top 10 rows from every bf_* table.
 * Access: localhost (free) · portal session · OR dev key below.
 */

define('BHK_KEY', 'Bhekani2026!@@');

// Works whether deployed to portal root OR run from dev-only/ subdirectory
$_bhk_root = is_dir(__DIR__ . '/includes') ? __DIR__ : dirname(__DIR__);
require_once $_bhk_root . '/includes/auth.php';

// Start session so we can store bhk_ok flag independently of portal session
bf_session_start();

$ip       = $_SERVER['REMOTE_ADDR'] ?? '';
$is_local = in_array($ip, ['127.0.0.1', '::1', ''], true);
$user     = current_user();
$auth_ok  = $is_local || ($user !== null) || ($_SESSION['bhk_ok'] ?? false);

// Handle dev-key login
$login_err = '';
if (!$auth_ok && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (hash_equals(BHK_KEY, $_POST['k'] ?? '')) {
        session_start(); // reopen after current_user() called session_write_close()
        $_SESSION['bhk_ok'] = true;
        header('Location: ' . strtok($_SERVER['REQUEST_URI'], '?'));
        exit;
    }
    $login_err = 'Wrong key.';
}

// ── Gate: show login form if not authorised ───────────────────────────
if (!$auth_ok):
?><!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>bhekani_bo · Access</title>
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
  input:focus{outline:none;border-color:#f97316}
  button{margin-top:14px;width:100%;background:#f97316;color:#000;border:none;
         padding:10px;border-radius:4px;font-weight:700;font-size:13px;cursor:pointer}
  button:hover{background:#fb923c}
  .err{margin-top:10px;font-size:11px;color:#ef4444}
</style>
</head>
<body>
<div class="card">
  <h1>bhekani Bo</h1>
  <p>BlackFire DB Viewer · dev key required</p>
  <form method="POST">
    <label for="k">Dev key</label>
    <input type="password" id="k" name="k" autofocus autocomplete="off">
    <button type="submit">Enter</button>
    <?php if ($login_err): ?>
      <div class="err"><?= htmlspecialchars($login_err) ?></div>
    <?php endif; ?>
  </form>
</div>
</body>
</html>
<?php
exit;
endif;

// ── Authorised — load DB ──────────────────────────────────────────────
require_once $_bhk_root . '/includes/db.php';

// ── DB Script Generator ───────────────────────────────────────────────
function bhk_gen_script(array $opts): string {
    $lines  = [];
    $meta   = db_row("SELECT DATABASE() AS d, VERSION() AS v");
    $db     = $meta['d'] ?? 'unknown';
    $ver    = $meta['v'] ?? '';

    $lines[] = "-- ================================================================";
    $lines[] = "-- Database : `{$db}`";
    $lines[] = "-- Server   : MySQL {$ver}";
    $lines[] = "-- Generated: " . date('Y-m-d H:i:s') . " (SAST UTC+2)";
    $lines[] = "-- Tool     : bhekani_bo · BlackFire DB Viewer";
    $lines[] = "-- ================================================================";
    $lines[] = "";
    $lines[] = "SET NAMES utf8mb4;";
    $lines[] = "SET FOREIGN_KEY_CHECKS = 0;";
    $lines[] = "SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';";
    $lines[] = "SET TIME_ZONE = '+02:00';";
    $lines[] = "";

    // ── Tables (includes indexes — part of CREATE TABLE DDL) ──────────
    if ($opts['tables'] ?? true) {
        try {
            $tables = db_select("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
            if ($tables) {
                $lines[] = "-- ────────────────────────────────────────────────────────────";
                $lines[] = "-- TABLES + INDEXES  (" . count($tables) . ")";
                $lines[] = "-- ────────────────────────────────────────────────────────────";
                $lines[] = "";
                foreach ($tables as $row) {
                    $tbl = array_values($row)[0];
                    $r   = db_row("SHOW CREATE TABLE `{$tbl}`");
                    $ddl = $r['Create Table'] ?? '';
                    $lines[] = "-- ── `{$tbl}` ──────────────────────────────";
                    $lines[] = "DROP TABLE IF EXISTS `{$tbl}`;";
                    $lines[] = $ddl . ";";
                    $lines[] = "";

                    if (($opts['data'] ?? false) && $ddl) {
                        $rows = db_select("SELECT * FROM `{$tbl}`");
                        if ($rows) {
                            $cols   = array_keys($rows[0]);
                            $colStr = implode(', ', array_map(fn($c) => "`{$c}`", $cols));
                            foreach (array_chunk($rows, 200) as $chunk) {
                                $vals = array_map(function ($row) {
                                    return '(' . implode(', ', array_map(function ($v) {
                                        if ($v === null) return 'NULL';
                                        if (is_numeric($v) && !preg_match('/^0\d/', (string)$v)) return $v;
                                        return "'" . str_replace(
                                            ["\\",   "'",  "\n",  "\r",  "\0",  "\x1a"],
                                            ["\\\\", "\\'","\\n","\\r","\\0","\\Z"],
                                            (string)$v
                                        ) . "'";
                                    }, array_values($row))) . ')';
                                }, $chunk);
                                $lines[] = "INSERT INTO `{$tbl}` ({$colStr}) VALUES";
                                $lines[] = implode(",\n", $vals) . ";";
                                $lines[] = "";
                            }
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            $lines[] = "-- ERROR scripting tables: " . $e->getMessage();
            $lines[] = "";
        }
    }

    // ── Views ─────────────────────────────────────────────────────────
    if ($opts['views'] ?? true) {
        try {
            $views = db_select("SHOW FULL TABLES WHERE Table_type = 'VIEW'");
            if ($views) {
                $lines[] = "-- ────────────────────────────────────────────────────────────";
                $lines[] = "-- VIEWS  (" . count($views) . ")";
                $lines[] = "-- ────────────────────────────────────────────────────────────";
                $lines[] = "";
                foreach ($views as $row) {
                    $v   = array_values($row)[0];
                    $r   = db_row("SHOW CREATE VIEW `{$v}`");
                    $ddl = $r['Create View'] ?? '';
                    $lines[] = "-- ── `{$v}` ──────────────────────────────";
                    $lines[] = "DROP VIEW IF EXISTS `{$v}`;";
                    $lines[] = $ddl . ";";
                    $lines[] = "";
                }
            }
        } catch (\Exception $e) {
            $lines[] = "-- ERROR scripting views: " . $e->getMessage();
            $lines[] = "";
        }
    }

    // ── Stored Procedures ─────────────────────────────────────────────
    if ($opts['procedures'] ?? true) {
        try {
            $procs = db_select(
                "SELECT ROUTINE_NAME FROM information_schema.ROUTINES
                  WHERE ROUTINE_SCHEMA = DATABASE() AND ROUTINE_TYPE = 'PROCEDURE'
                  ORDER BY ROUTINE_NAME"
            );
            if ($procs) {
                $lines[] = "-- ────────────────────────────────────────────────────────────";
                $lines[] = "-- STORED PROCEDURES  (" . count($procs) . ")";
                $lines[] = "-- ────────────────────────────────────────────────────────────";
                $lines[] = "";
                $lines[] = "DELIMITER ;;";
                $lines[] = "";
                foreach ($procs as $row) {
                    $name = $row['ROUTINE_NAME'];
                    $r    = db_row("SHOW CREATE PROCEDURE `{$name}`");
                    $ddl  = $r['Create Procedure'] ?? '';
                    $lines[] = "-- ── `{$name}` ──────────────────────────────";
                    $lines[] = "DROP PROCEDURE IF EXISTS `{$name}`;;";
                    $lines[] = $ddl . ";;";
                    $lines[] = "";
                }
                $lines[] = "DELIMITER ;";
                $lines[] = "";
            }
        } catch (\Exception $e) {
            $lines[] = "-- ERROR scripting procedures: " . $e->getMessage();
            $lines[] = "";
        }
    }

    // ── Functions ─────────────────────────────────────────────────────
    if ($opts['functions'] ?? true) {
        try {
            $funcs = db_select(
                "SELECT ROUTINE_NAME FROM information_schema.ROUTINES
                  WHERE ROUTINE_SCHEMA = DATABASE() AND ROUTINE_TYPE = 'FUNCTION'
                  ORDER BY ROUTINE_NAME"
            );
            if ($funcs) {
                $lines[] = "-- ────────────────────────────────────────────────────────────";
                $lines[] = "-- FUNCTIONS  (" . count($funcs) . ")";
                $lines[] = "-- ────────────────────────────────────────────────────────────";
                $lines[] = "";
                $lines[] = "DELIMITER ;;";
                $lines[] = "";
                foreach ($funcs as $row) {
                    $name = $row['ROUTINE_NAME'];
                    $r    = db_row("SHOW CREATE FUNCTION `{$name}`");
                    $ddl  = $r['Create Function'] ?? '';
                    $lines[] = "-- ── `{$name}` ──────────────────────────────";
                    $lines[] = "DROP FUNCTION IF EXISTS `{$name}`;;";
                    $lines[] = $ddl . ";;";
                    $lines[] = "";
                }
                $lines[] = "DELIMITER ;";
                $lines[] = "";
            }
        } catch (\Exception $e) {
            $lines[] = "-- ERROR scripting functions: " . $e->getMessage();
            $lines[] = "";
        }
    }

    // ── Triggers ──────────────────────────────────────────────────────
    if ($opts['triggers'] ?? true) {
        try {
            $trigs = db_select(
                "SELECT TRIGGER_NAME FROM information_schema.TRIGGERS
                  WHERE TRIGGER_SCHEMA = DATABASE()
                  ORDER BY EVENT_OBJECT_TABLE, TRIGGER_NAME"
            );
            if ($trigs) {
                $lines[] = "-- ────────────────────────────────────────────────────────────";
                $lines[] = "-- TRIGGERS  (" . count($trigs) . ")";
                $lines[] = "-- ────────────────────────────────────────────────────────────";
                $lines[] = "";
                $lines[] = "DELIMITER ;;";
                $lines[] = "";
                foreach ($trigs as $row) {
                    $name = $row['TRIGGER_NAME'];
                    $r    = db_row("SHOW CREATE TRIGGER `{$name}`");
                    // MySQL 8: 'SQL Original Statement'; MariaDB: 'Create Trigger'
                    $ddl  = $r['SQL Original Statement'] ?? ($r['Create Trigger'] ?? '');
                    $lines[] = "-- ── `{$name}` ──────────────────────────────";
                    $lines[] = "DROP TRIGGER IF EXISTS `{$name}`;;";
                    $lines[] = $ddl . ";;";
                    $lines[] = "";
                }
                $lines[] = "DELIMITER ;";
                $lines[] = "";
            }
        } catch (\Exception $e) {
            $lines[] = "-- ERROR scripting triggers: " . $e->getMessage();
            $lines[] = "";
        }
    }

    $lines[] = "";
    $lines[] = "SET FOREIGN_KEY_CHECKS = 1;";
    $lines[] = "-- ── End of script ──────────────────────────────────────────────";

    return implode("\n", $lines);
}

// ── Password Hash Utility (AJAX, runs before HTML output) ────────────
if (($_GET['action'] ?? '') === 'pw_util') {
    while (ob_get_level() > 0) ob_end_clean();
    header('Content-Type: application/json');
    $mode      = $_POST['mode']      ?? '';
    $plaintext = $_POST['plaintext'] ?? '';
    if ($mode === 'hash') {
        if ($plaintext === '') { echo json_encode(['error' => 'Enter a password']); exit; }
        echo json_encode(['hash' => password_hash($plaintext, PASSWORD_BCRYPT)]);
    } elseif ($mode === 'verify') {
        $stored_hash = $_POST['hash'] ?? '';
        if ($plaintext === '' || $stored_hash === '') {
            echo json_encode(['error' => 'Enter both password and hash']); exit;
        }
        echo json_encode(['match' => password_verify($plaintext, $stored_hash)]);
    } else {
        echo json_encode(['error' => 'Unknown mode']);
    }
    exit;
}

// ── Handle export action (must run before any HTML output) ────────────
if (($_GET['action'] ?? '') === 'export_sql') {
    while (ob_get_level() > 0) ob_end_clean();
    $opts = [
        'tables'     => ($_GET['tables']     ?? '1') === '1',
        'views'      => ($_GET['views']      ?? '1') === '1',
        'procedures' => ($_GET['procedures'] ?? '1') === '1',
        'functions'  => ($_GET['functions']  ?? '1') === '1',
        'triggers'   => ($_GET['triggers']   ?? '1') === '1',
        'data'       => ($_GET['data']       ?? '0') === '1',
    ];
    $script = bhk_gen_script($opts);
    if (isset($_GET['preview'])) {
        header('Content-Type: text/plain; charset=utf-8');
    } else {
        $db_name = preg_replace('/[^a-z0-9_]/', '_', strtolower(db_row("SELECT DATABASE() AS d")['d'] ?? 'database'));
        $fname   = $db_name . '_' . date('Ymd_His') . '.sql';
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="' . $fname . '"');
        header('Content-Length: ' . strlen($script));
    }
    echo $script;
    exit;
}
// ─────────────────────────────────────────────────────────────────────

$raw    = db_select("SHOW TABLES LIKE 'bf\\_%'");
$tables = array_map(fn($r) => array_values($r)[0], $raw);
sort($tables);

$data   = [];
$counts = [];
foreach ($tables as $tbl) {
    $counts[$tbl] = (int)(db_row("SELECT COUNT(*) AS n FROM `$tbl`")['n'] ?? 0);
    $data[$tbl]   = db_select("SELECT * FROM `$tbl` LIMIT 10");
}

// ── Portal page → table dependency map ────────────────────────────────────
$portal_map = [
    'Dashboard'       => ['bf_callouts', 'bf_invoices', 'bf_quotes', 'bf_transactions'],
    'Callouts'        => ['bf_callouts'],
    'Invoices'        => ['bf_invoices'],
    'Quotes'          => ['bf_quotes'],
    'Transactions'    => ['bf_transactions'],
    'Statement'       => ['bf_statements'],
    'Income Statement'=> ['bf_invoices', 'bf_transactions'],
    'Safety Files'    => ['bf_safety_files'],
    'Users & Roles'   => ['bf_users'],
    'Audit Log'       => ['bf_audit_log'],
];

// Overall readiness
$probe_pass = 0; $probe_warn = 0; $probe_miss = 0;
foreach ($portal_map as $page => $deps) {
    foreach ($deps as $t) {
        if (!isset($counts[$t])) { $probe_miss++; }
        elseif ($counts[$t] === 0) { $probe_warn++; }
        else { $probe_pass++; }
    }
}

function esc(mixed $v): string {
    if ($v === null) return '<span class="null">NULL</span>';
    if ($v === '')   return '<span class="empty">""</span>';
    $s = htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8');
    if (strlen((string)$v) >= 60) {
        return '<span class="hash" title="' . $s . '">' . substr($s, 0, 24) . '…</span>';
    }
    return $s;
}

$who        = $user ? ($user['name'] ?? $user['username']) . ' (' . $user['role'] . ')' : ($is_local ? 'localhost' : 'dev key');
$total_rows = array_sum($counts);

// ── Code Health Checks (static file scans) ───────────────────────────
$code_checks = [];
$api_dir     = $_bhk_root . '/api';
$api_files   = glob($api_dir . '/*.php') ?: [];

function bhk_file_check(string $label, string $file, string $pattern, bool $should_exist = true, string $hint = ''): array {
    global $_bhk_root;
    $path = $_bhk_root . '/' . $file;
    if (!file_exists($path)) {
        return ['label' => $label, 'file' => $file, 'status' => 'miss', 'hint' => 'File not found', 'detail' => ''];
    }
    $src   = file_get_contents($path);
    $found = (bool)preg_match($pattern, $src);
    $ok    = $should_exist ? $found : !$found;
    return [
        'label'  => $label,
        'file'   => $file,
        'status' => $ok ? 'ok' : 'fail',
        'hint'   => $hint,
        'detail' => $ok ? '' : ($should_exist ? 'Pattern not found' : 'Pattern found (should be absent)'),
    ];
}

// 1. No db_last_id() calls anywhere in api/
$db_last_id_hits = [];
foreach ($api_files as $f) {
    if (preg_match('/db_last_id\s*\(/', (string)file_get_contents($f))) {
        $db_last_id_hits[] = 'api/' . basename($f);
    }
}
if (empty($db_last_id_hits)) {
    $code_checks[] = ['label' => 'No db_last_id() calls in api/', 'file' => 'api/*.php', 'status' => 'ok', 'hint' => '', 'detail' => ''];
} else {
    foreach ($db_last_id_hits as $rel) {
        $code_checks[] = ['label' => "db_last_id() found in $rel", 'file' => $rel, 'status' => 'fail',
            'hint' => 'db_last_id() does not exist — capture return value of db_insert() instead', 'detail' => 'Call found'];
    }
}

// 2. safety API files have require_perm('safety.view')
$safety_apis = ['api/safety.php','api/safety_compliance.php','api/safety_personnel.php','api/safety_doc_gen.php','api/safety_policy.php'];
foreach ($safety_apis as $rel) {
    $code_checks[] = bhk_file_check(
        "safety.view gate: $rel", $rel,
        "/require_perm\s*\(\s*'safety\.view'\s*\)/",
        true, 'All safety APIs must call require_perm(\'safety.view\') after require_auth()'
    );
}

// 3. No security.users gate in safety*.php
foreach ($safety_apis as $rel) {
    $code_checks[] = bhk_file_check(
        "No security.users in $rel", $rel,
        "/require_perm\s*\(\s*'security\.users'\s*\)/",
        false, "safety files must use safety.* permissions, not security.users"
    );
}

// 4. safety.php has all four method-level gates
$code_checks[] = bhk_file_check('safety.php: safety.create gate (POST)', 'api/safety.php',
    "/require_perm\s*\(\s*'safety\.create'\s*\)/", true, 'POST block must gate on safety.create');
$code_checks[] = bhk_file_check('safety.php: safety.update gate (PUT)', 'api/safety.php',
    "/require_perm\s*\(\s*'safety\.update'\s*\)/", true, 'PUT block must gate on safety.update');
$code_checks[] = bhk_file_check('safety.php: safety.approve gate (PUT approve)', 'api/safety.php',
    "/require_perm\s*\(\s*'safety\.approve'\s*\)/", true, 'approve sub-action must gate on safety.approve');
$code_checks[] = bhk_file_check('safety.php: safety.delete gate (DELETE)', 'api/safety.php',
    "/require_perm\s*\(\s*'safety\.delete'\s*\)/", true, 'DELETE block must gate on safety.delete');

// 5. portal.js PERMS has all safety.* entries
foreach (['safety.view','safety.create','safety.update','safety.delete','safety.approve'] as $perm) {
    $code_checks[] = bhk_file_check("portal.js PERMS: '$perm'", 'portal.js',
        '/' . preg_quote("'$perm'", '/') . '\s*:/', true, "PERMS map must include '$perm'");
}

// 6. portal.js ROLE_LABELS has safety_officer entry
$code_checks[] = bhk_file_check('portal.js: safety_officer in ROLE_LABELS', 'portal.js',
    "/safety_officer\s*:\s*['\"]Safety Officer['\"]/", true, 'ROLE_LABELS must have a display name for safety_officer');

// 7. portal.js: both firstPage maps contain safety_officer:'p-safety'
$js_src   = file_exists($_bhk_root . '/portal.js') ? (string)file_get_contents($_bhk_root . '/portal.js') : '';
$fp_count = substr_count($js_src, "safety_officer:'p-safety'") + substr_count($js_src, 'safety_officer:"p-safety"');
$code_checks[] = [
    'label'  => "portal.js: safety_officer in both firstPage maps ($fp_count/2 found)",
    'file'   => 'portal.js',
    'status' => $fp_count >= 2 ? 'ok' : 'fail',
    'hint'   => 'Login flow AND session-restore firstPage maps must both include safety_officer',
    'detail' => $fp_count >= 2 ? '' : "Only $fp_count found — need 2",
];

// 8. clients.php: is_active cast as int in PUT
$code_checks[] = bhk_file_check('clients.php: is_active (int)(bool) cast in PUT', 'api/clients.php',
    '/\(int\)\(bool\)\$b\[/', true, 'is_active must be cast to prevent string injection into tinyint column');

$ch_ok   = count(array_filter($code_checks, fn($c) => $c['status'] === 'ok'));
$ch_fail = count($code_checks) - $ch_ok;

// ── DB Integrity Checks (live SQL assertions) ─────────────────────────
$db_checks = [];

function bhk_db_check(string $label, bool $ok, string $hint = '', string $detail = ''): array {
    return ['label' => $label, 'status' => $ok ? 'ok' : 'fail', 'hint' => $hint, 'detail' => $detail];
}

// 1. safety.* permissions seeded in bf_role_permissions
try {
    foreach (['safety.view','safety.create','safety.update','safety.delete','safety.approve'] as $perm) {
        $n = (int)(db_row("SELECT COUNT(*) AS n FROM bf_role_permissions WHERE permission = ?", [$perm])['n'] ?? 0);
        $db_checks[] = bhk_db_check(
            "bf_role_permissions: '$perm' seeded ($n roles)",
            $n > 0, 'Run install/safety_officer_migration.sql to seed safety.* permissions',
            $n > 0 ? '' : '0 roles have this permission — migration not yet run'
        );
    }
} catch (\Exception $e) {
    $db_checks[] = bhk_db_check('bf_role_permissions: safety.* check', false, '', $e->getMessage());
}

// 2. safety_officer role has safety.view
try {
    $n = (int)(db_row("SELECT COUNT(*) AS n FROM bf_role_permissions WHERE role='safety_officer' AND permission='safety.view'")['n'] ?? 0);
    $db_checks[] = bhk_db_check('safety_officer has safety.view permission', $n > 0,
        'safety_officer must have safety.view in bf_role_permissions');
} catch (\Exception $e) {
    $db_checks[] = bhk_db_check('safety_officer: safety.view', false, '', $e->getMessage());
}

// 3. bf_counters has 'saf' counter type
try {
    $n = (int)(db_row("SELECT COUNT(*) AS n FROM bf_counters WHERE counter_type = 'saf'")['n'] ?? 0);
    $db_checks[] = bhk_db_check("bf_counters: 'saf' counter exists", $n > 0,
        "Safety file reference numbers require a 'saf' row in bf_counters");
} catch (\Exception $e) {
    $db_checks[] = bhk_db_check("bf_counters: 'saf'", false, '', $e->getMessage());
}

// 4. At least one active admin/sysadmin user
try {
    $n = (int)(db_row("SELECT COUNT(*) AS n FROM bf_users WHERE role IN ('admin','sysadmin') AND active = 1")['n'] ?? 0);
    $db_checks[] = bhk_db_check("Active admin/sysadmin user ($n found)", $n > 0,
        'System requires at least one active admin or sysadmin account');
} catch (\Exception $e) {
    $db_checks[] = bhk_db_check('Active admin/sysadmin', false, '', $e->getMessage());
}

// 5. No duplicate usernames in bf_users
try {
    $dupes = db_select("SELECT username FROM bf_users GROUP BY username HAVING COUNT(*) > 1");
    $db_checks[] = bhk_db_check('No duplicate usernames in bf_users', empty($dupes),
        'Duplicate usernames break authentication',
        empty($dupes) ? '' : 'Duplicates: ' . implode(', ', array_column($dupes, 'username')));
} catch (\Exception $e) {
    $db_checks[] = bhk_db_check('Duplicate usernames', false, '', $e->getMessage());
}

// 6. All active users have bcrypt password hashes
try {
    $n = (int)(db_row("SELECT COUNT(*) AS n FROM bf_users WHERE active=1 AND (password_hash IS NULL OR password_hash NOT LIKE '\$2y\$%')")['n'] ?? 0);
    $db_checks[] = bhk_db_check("All active users have bcrypt hashes ($n non-bcrypt)", $n === 0,
        'All passwords must use bcrypt ($2y$ prefix)');
} catch (\Exception $e) {
    $db_checks[] = bhk_db_check('Bcrypt password hashes', false, '', $e->getMessage());
}

// 7. No orphaned bf_safety_items (file_ref not in bf_safety_files)
try {
    $n = (int)(db_row("SELECT COUNT(*) AS n FROM bf_safety_items i LEFT JOIN bf_safety_files f ON i.file_ref=f.ref_id WHERE f.id IS NULL")['n'] ?? 0);
    $db_checks[] = bhk_db_check("No orphaned safety items ($n found)", $n === 0,
        'bf_safety_items.file_ref must reference an existing bf_safety_files.file_ref');
} catch (\Exception $e) {
    $db_checks[] = bhk_db_check('Orphaned safety items', false, '', $e->getMessage());
}

// 8. All non-deleted bf_safety_files have ≥86 checklist items
try {
    $bad = db_select(
        "SELECT f.ref_id, COUNT(i.id) AS n FROM bf_safety_files f
         LEFT JOIN bf_safety_items i ON i.file_ref=f.ref_id
         WHERE f.status != 'Deleted'
         GROUP BY f.ref_id HAVING n < 86"
    );
    $db_checks[] = bhk_db_check(
        "All active safety files have ≥86 items (" . count($bad) . " under-populated)",
        empty($bad),
        'Each file needs A9+B7+C2+D6+E12+F3+G3+H34+I10 = 86 items',
        empty($bad) ? '' : 'Under-populated: ' . implode(', ', array_column($bad, 'ref_id'))
    );
} catch (\Exception $e) {
    $db_checks[] = bhk_db_check('Safety file item count (≥86)', false, '', $e->getMessage());
}

// 9. "To Standard" items must have at least one evidence document
try {
    $ts_no_evidence = db_select(
        "SELECT i.file_ref, i.section_key, i.item_no
           FROM bf_safety_items i
           LEFT JOIN bf_attachments a
             ON a.entity_type = 'safety_item'
            AND a.entity_ref  = CONCAT(i.file_ref, ':', i.section_key, ':', i.item_no)
          WHERE i.result = 'To Standard' AND a.id IS NULL
          ORDER BY i.file_ref, i.section_key, i.item_no"
    );
    $ts_count = (int)(db_row(
        "SELECT COUNT(*) AS n FROM bf_safety_items WHERE result = 'To Standard'"
    )['n'] ?? 0);
    $db_checks[] = bhk_db_check(
        "Safety items 'To Standard' all have evidence (" . count($ts_no_evidence) . " of $ts_count unevidenced)",
        empty($ts_no_evidence),
        "Every 'To Standard' item must have an evidence file uploaded via the item-level upload button",
        empty($ts_no_evidence) ? '' :
            implode(', ', array_map(fn($r) => "{$r['file_ref']}/{$r['section_key']}.{$r['item_no']}", array_slice($ts_no_evidence, 0, 10)))
            . (count($ts_no_evidence) > 10 ? ' … +' . (count($ts_no_evidence) - 10) . ' more' : '')
    );
} catch (\Exception $e) {
    $db_checks[] = bhk_db_check("'To Standard' items have evidence", false, '', $e->getMessage());
}

// 10. bf_invoices valid status values
try {
    $valid = ['Draft','Sent','Paid','Overdue','Cancelled'];
    $ph    = implode(',', array_fill(0, count($valid), '?'));
    $n     = (int)(db_row("SELECT COUNT(*) AS n FROM bf_invoices WHERE status NOT IN ($ph)", $valid)['n'] ?? 0);
    $db_checks[] = bhk_db_check("bf_invoices: all statuses valid ($n invalid)", $n === 0,
        'Valid: ' . implode(', ', $valid));
} catch (\Exception $e) {
    $db_checks[] = bhk_db_check('Invoice statuses', false, '', $e->getMessage());
}

// 10. bf_safety_files valid status values
try {
    $valid = ['Draft','In Progress','Submitted','Approved','Rejected'];
    $ph    = implode(',', array_fill(0, count($valid), '?'));
    $n     = (int)(db_row("SELECT COUNT(*) AS n FROM bf_safety_files WHERE status NOT IN ($ph)", $valid)['n'] ?? 0);
    $db_checks[] = bhk_db_check("bf_safety_files: all statuses valid ($n invalid)", $n === 0,
        'Valid: ' . implode(', ', $valid));
} catch (\Exception $e) {
    $db_checks[] = bhk_db_check('Safety file statuses', false, '', $e->getMessage());
}

$di_ok   = count(array_filter($db_checks, fn($c) => $c['status'] === 'ok'));
$di_fail = count($db_checks) - $di_ok;

// ── Transaction Audit ─────────────────────────────────────────────────
try {
    $tx_summary = db_row("SELECT COUNT(*) AS n, COALESCE(SUM(credit),0) AS tc, COALESCE(SUM(debit),0) AS td, COALESCE(SUM(credit),0)-COALESCE(SUM(debit),0) AS net FROM bf_transactions");
    $tx_dupes   = db_select("SELECT trans_date, description, credit, debit, COUNT(*) AS cnt FROM bf_transactions GROUP BY trans_date, description, credit, debit HAVING COUNT(*) > 1 ORDER BY cnt DESC LIMIT 20");
    $tx_by_cat  = db_select("SELECT category, COUNT(*) AS n, COALESCE(SUM(credit),0) AS tc, COALESCE(SUM(debit),0) AS td FROM bf_transactions GROUP BY category ORDER BY tc DESC");
    $tx_rows    = db_select("SELECT * FROM bf_transactions ORDER BY trans_date ASC, id ASC");
    $tx_mixed   = (int)(db_row("SELECT COUNT(*) AS n FROM bf_transactions WHERE credit > 0 AND debit > 0")['n'] ?? 0);

    // Add DQ assertions to db_checks
    $db_checks[] = bhk_db_check(
        "bf_transactions: no duplicate entries (" . count($tx_dupes) . " dupe group(s))",
        empty($tx_dupes),
        'Duplicate = same date+description+credit+debit. Usually caused by double log-payment.',
        !empty($tx_dupes) ? implode(' | ', array_map(fn($d) => "{$d['trans_date']} [{$d['description']}] x{$d['cnt']}", $tx_dupes)) : ''
    );
    $db_checks[] = bhk_db_check(
        "bf_transactions: no mixed credit+debit rows ($tx_mixed found)",
        $tx_mixed === 0,
        'Each row must have credit OR debit — not both. Mutual exclusivity enforced by API.'
    );
    $di_ok   = count(array_filter($db_checks, fn($c) => $c['status'] === 'ok'));
    $di_fail = count($db_checks) - $di_ok;

    $tx_ok = true;
} catch (\Exception $e) {
    $tx_ok = false; $tx_summary = null; $tx_dupes = []; $tx_by_cat = []; $tx_rows = []; $tx_mixed = 0;
    $tx_error = $e->getMessage();
}

function bhk_fmt(float $n): string {
    return 'R ' . number_format($n, 2, '.', ',');
}
?>
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>bhekani_bo · DB Viewer</title>
<style>
/* ── Light theme (default) ── */
:root {
  --bg:#f8fafc; --surface:#ffffff; --border:#e2e8f0;
  --accent:#f97316; --accent2:#c2410c;
  --text:#1e293b; --muted:#64748b;
  --row-odd:#ffffff; --row-even:#f8fafc; --row-hover:#f1f5f9;
  --topbar-bg:#ffffff; --thead-bg:#f1f5f9; --td-color:#334155;
  --row-vborder:#e2e8f0; --row-hborder:#f1f5f9;
  --probe-bg:#ffffff; --probe-hdr-bg:#f8fafc; --probe-border:#e2e8f0;
  --probe-grid-gap:#e2e8f0; --probe-cell-bg:#ffffff; --probe-tname:#64748b;
  --ctrl-border:#e2e8f0;
}
/* ── Dark theme overrides ── */
html[data-theme="dark"] {
  --bg:#0a0a0a; --surface:#111; --border:#222;
  --accent:#f97316; --accent2:#fb923c;
  --text:#e2e8f0; --muted:#64748b;
  --row-odd:#0f0f0f; --row-even:#111; --row-hover:#1c1c1c;
  --topbar-bg:#0a0a0a; --thead-bg:#161616; --td-color:#cbd5e1;
  --row-vborder:#1a1a1a; --row-hborder:#181818;
  --probe-bg:#111; --probe-hdr-bg:#0d0d0d; --probe-border:#222;
  --probe-grid-gap:#1a1a1a; --probe-cell-bg:#111; --probe-tname:#94a3b8;
  --ctrl-border:#333;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:12px;
     background:var(--bg);color:var(--text);min-height:100vh}

.topbar{position:sticky;top:0;z-index:200;background:var(--topbar-bg);
  border-bottom:2px solid var(--accent);
  display:flex;align-items:center;justify-content:space-between;
  padding:10px 20px;gap:12px}
.topbar .brand{font-size:16px;font-weight:700;letter-spacing:.08em;color:var(--accent)}
.topbar .brand small{font-weight:400;font-size:10px;color:var(--muted);display:block}
.topbar .stats{font-size:11px;color:var(--muted);text-align:right;line-height:1.6}
.topbar .stats strong{color:var(--accent2)}
.topbar .logout{font-size:11px;color:var(--muted);text-decoration:none;
  border:1px solid var(--ctrl-border);padding:3px 10px;border-radius:3px;white-space:nowrap}
.topbar .logout:hover{border-color:var(--accent);color:var(--accent)}

/* ── Theme toggle ── */
.btn-theme{background:none;border:1px solid var(--ctrl-border);padding:4px 8px;
  border-radius:3px;cursor:pointer;color:var(--muted);display:flex;align-items:center;
  transition:border-color .15s,color .15s}
.btn-theme:hover{border-color:var(--accent);color:var(--accent)}
.btn-theme svg{width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2}
html[data-theme="dark"]  .icon-sun {display:none}
html[data-theme="light"] .icon-moon{display:none}

.toc{position:sticky;top:49px;z-index:190;background:var(--surface);
  border-bottom:1px solid var(--border);padding:8px 20px;
  display:flex;flex-wrap:wrap;gap:5px}
.toc a{color:var(--muted);text-decoration:none;font-size:11px;padding:3px 9px;
  border:1px solid var(--border);border-radius:3px;transition:all .15s;white-space:nowrap}
.toc a:hover,.toc a.active{background:var(--accent);color:#fff;border-color:var(--accent)}
.toc a .cnt{opacity:.6;margin-left:4px}

.section{margin:28px 20px;scroll-margin-top:100px}
.section-head{display:flex;align-items:baseline;gap:12px;
  margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--border)}
.section-head h2{font-size:13px;font-weight:700;color:var(--accent)}
.section-head .tag{font-size:10px;color:var(--muted);
  border:1px solid var(--border);padding:1px 6px;border-radius:2px}
.empty{color:var(--muted);font-style:italic;padding:10px 0}

.wrap{overflow-x:auto;border:1px solid var(--border);border-radius:5px}
table{border-collapse:collapse;min-width:100%;font-size:11.5px}
thead th{background:var(--thead-bg);color:var(--accent2);padding:7px 12px;text-align:left;
  border-right:1px solid var(--row-vborder);border-bottom:1px solid var(--border);
  white-space:nowrap;font-weight:600;letter-spacing:.03em}
tbody td{padding:5px 12px;border-right:1px solid var(--row-vborder);border-bottom:1px solid var(--row-hborder);
  vertical-align:top;max-width:280px;overflow:hidden;text-overflow:ellipsis;
  white-space:nowrap;color:var(--td-color)}
tbody tr:nth-child(odd)  td{background:var(--row-odd)}
tbody tr:nth-child(even) td{background:var(--row-even)}
tbody tr:hover td{background:var(--row-hover)}
.null{color:var(--muted);font-style:italic} .hash{color:#6366f1;cursor:help}

footer{padding:20px;border-top:1px solid var(--border);
  color:var(--muted);font-size:10px;margin-top:30px}

/* ── Probe panel ── */
.probe{margin:20px 20px 0;background:var(--probe-bg);border:1px solid var(--probe-border);border-radius:6px;overflow:hidden}
.probe-hdr{display:flex;align-items:center;justify-content:space-between;
  padding:10px 16px;border-bottom:1px solid var(--probe-border);background:var(--probe-hdr-bg)}
.probe-hdr h2{font-size:12px;font-weight:700;color:var(--accent);letter-spacing:.08em;text-transform:uppercase}
.probe-summary{display:flex;gap:16px;font-size:11px}
.probe-summary .ps-ok{color:#16a34a}.probe-summary .ps-warn{color:#b45309}.probe-summary .ps-miss{color:#dc2626}
html[data-theme="dark"] .probe-summary .ps-ok{color:#4ade80}
html[data-theme="dark"] .probe-summary .ps-warn{color:#fbbf24}
html[data-theme="dark"] .probe-summary .ps-miss{color:#f87171}
.probe-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1px;background:var(--probe-grid-gap)}
.probe-cell{background:var(--probe-cell-bg);padding:10px 14px;display:flex;flex-direction:column;gap:4px}
.probe-cell-page{font-size:10px;color:var(--muted);letter-spacing:.06em;text-transform:uppercase}
.probe-cell-deps{display:flex;flex-direction:column;gap:3px}
.probe-dep{display:flex;align-items:center;gap:6px;font-size:11px}
.probe-dep .dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.dot-ok{background:#16a34a;box-shadow:0 0 5px #16a34a66}
.dot-warn{background:#d97706;box-shadow:0 0 5px #d9770666}
.dot-miss{background:#dc2626;box-shadow:0 0 5px #dc262666}
html[data-theme="dark"] .dot-ok  {background:#4ade80;box-shadow:0 0 5px #4ade8088}
html[data-theme="dark"] .dot-warn{background:#fbbf24;box-shadow:0 0 5px #fbbf2488}
html[data-theme="dark"] .dot-miss{background:#f87171;box-shadow:0 0 5px #f8717188}
.probe-dep .tname{color:var(--probe-tname)}
.probe-dep .tcount{color:var(--accent2);font-weight:600;margin-left:auto}

/* ── Script Generator panel ── */
.sgen{margin:12px 20px 0;background:var(--probe-bg);border:1px solid var(--probe-border);border-radius:6px;overflow:hidden}
.sgen-hdr{display:flex;align-items:center;gap:12px;padding:10px 16px;
  border-bottom:1px solid var(--probe-border);background:var(--probe-hdr-bg)}
.sgen-hdr h2{font-size:12px;font-weight:700;color:var(--accent);letter-spacing:.08em;
  text-transform:uppercase;white-space:nowrap}
.sgen-hint{font-size:10px;color:var(--muted)}
.sgen-body{display:flex;align-items:center;gap:16px;padding:12px 16px;flex-wrap:wrap}
.sgen-opts{display:flex;gap:14px;flex-wrap:wrap;flex:1}
.sgen-chk{display:flex;align-items:center;gap:5px;font-size:11px;
  color:var(--text);cursor:pointer;user-select:none}
.sgen-chk input[type=checkbox]{accent-color:var(--accent);width:13px;height:13px;cursor:pointer}
.sgen-chk-data{color:var(--accent2);font-weight:600}
.sgen-actions{display:flex;gap:8px;align-items:center;flex-shrink:0}
.sgen-preview-bar{display:flex;align-items:center;gap:8px;padding:8px 16px;
  border-top:1px solid var(--probe-border);background:var(--probe-hdr-bg)}
.sgen-preview-lbl{font-size:10px;color:var(--muted);flex:1;letter-spacing:.04em;text-transform:uppercase}
.sgen-pre{padding:16px 20px;font-size:11px;line-height:1.6;overflow:auto;
  max-height:420px;white-space:pre;color:var(--td-color);
  background:var(--probe-cell-bg);border-top:1px solid var(--probe-border)}

/* ── Export PDF button ── */
.btn-pdf{font-size:11px;font-family:inherit;font-weight:600;color:#fff;
  background:var(--accent);border:none;padding:5px 14px;border-radius:3px;
  cursor:pointer;white-space:nowrap;letter-spacing:.03em}
.btn-pdf:hover{opacity:.9}

/* ── Code Health & DB Integrity panels ── */
.hchk{margin:12px 20px 0;background:var(--probe-bg);border:1px solid var(--probe-border);border-radius:6px;overflow:hidden}
.hchk-hdr{display:flex;align-items:center;justify-content:space-between;
  padding:10px 16px;border-bottom:1px solid var(--probe-border);background:var(--probe-hdr-bg)}
.hchk-hdr h2{font-size:12px;font-weight:700;color:var(--accent);letter-spacing:.08em;text-transform:uppercase}
.hchk-summary{display:flex;gap:16px;font-size:11px}
.hchk-s-ok{color:#16a34a}.hchk-s-fail{color:#dc2626}
html[data-theme="dark"] .hchk-s-ok{color:#4ade80}
html[data-theme="dark"] .hchk-s-fail{color:#f87171}
.hchk-list{display:flex;flex-direction:column;gap:1px;background:var(--probe-grid-gap)}
.hchk-row{background:var(--probe-cell-bg);padding:8px 14px;display:flex;align-items:flex-start;gap:10px}
.hchk-row .dot{flex-shrink:0;margin-top:3px}
.hchk-label{font-size:11px;color:var(--text)}
.hchk-hint{font-size:10px;color:var(--muted);margin-top:2px}
.hchk-detail{font-size:10px;color:#dc2626;margin-top:2px}
.hchk-file{font-size:10px;color:var(--muted);margin-left:auto;flex-shrink:0;white-space:nowrap;padding-left:12px}
html[data-theme="dark"] .hchk-detail{color:#f87171}

/* ── Print / PDF export ── */
@media print {
  *{-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important;color-adjust:exact !important}
  .topbar,.toc{position:static !important}
  .btn-pdf,.btn-theme,.logout,.toc a{display:none !important}
  .toc{display:flex !important;flex-wrap:wrap !important;border:none !important;padding:4px 0 12px !important;gap:6px !important}
  .toc a{display:inline-block !important;font-size:10px;border:1px solid #ccc !important;color:#f97316 !important;padding:2px 6px !important}
  tr{page-break-inside:avoid}
  .section{page-break-inside:avoid;margin:16px 0 !important}
  .wrap{overflow:visible !important}
}
</style>
</head>
<body>

<div class="topbar">
  <div class="brand">
    bhekani Bo
    <small>BlackFire DB Viewer · DEV ONLY</small>
  </div>
  <div class="stats">
    <strong><?= count($tables) ?></strong> tables ·
    <strong><?= number_format($total_rows) ?></strong> total rows ·
    <?= date('Y-m-d H:i:s') ?><br>
    <?= esc($who) ?>
  </div>
  <div style="display:flex;gap:8px;align-items:center">
    <button class="btn-pdf" onclick="exportPDF()">Export PDF</button>
    <button class="btn-theme" onclick="toggleTheme()" title="Toggle theme">
      <svg class="icon-moon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
      <svg class="icon-sun"  viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
    </button>
    <a class="logout" href="?logout=1">Sign out</a>
  </div>
</div>

<nav class="toc">
  <a href="#pw-util">&#128273; PW Util</a>
<?php foreach ($tables as $tbl): ?>
  <a href="#<?= $tbl ?>"><?= $tbl ?><span class="cnt"><?= $counts[$tbl] ?></span></a>
<?php endforeach; ?>
</nav>

<!-- ── Portal Data Probe ───────────────────────────────────── -->
<div class="probe">
  <div class="probe-hdr">
    <h2>&#9679; Portal Data Probe</h2>
    <div class="probe-summary">
      <span class="ps-ok">&#10003; <?= $probe_pass ?> tables with data</span>
      <span class="ps-warn">&#9675; <?= $probe_warn ?> empty</span>
      <?php if ($probe_miss): ?><span class="ps-miss">&#9888; <?= $probe_miss ?> missing</span><?php endif; ?>
    </div>
  </div>
  <div class="probe-grid">
    <?php foreach ($portal_map as $page => $deps): ?>
    <div class="probe-cell">
      <div class="probe-cell-page"><?= esc($page) ?></div>
      <div class="probe-cell-deps">
        <?php foreach ($deps as $t):
            $cnt = $counts[$t] ?? null;
            if ($cnt === null) { $cls = 'dot-miss'; $label = 'TABLE MISSING'; }
            elseif ($cnt === 0) { $cls = 'dot-warn'; $label = '0 rows'; }
            else                { $cls = 'dot-ok';   $label = number_format($cnt) . ' row' . ($cnt === 1 ? '' : 's'); }
        ?>
        <div class="probe-dep">
          <span class="dot <?= $cls ?>"></span>
          <span class="tname"><?= esc($t) ?></span>
          <span class="tcount"><?= esc($label) ?></span>
        </div>
        <?php endforeach; ?>
      </div>
    </div>
    <?php endforeach; ?>
  </div>
</div>
<!-- /Portal Data Probe ──────────────────────────────────── -->

<!-- ── Script Generator ──────────────────────────────────── -->
<div class="sgen">
  <div class="sgen-hdr">
    <h2>&#8659; Script Generator</h2>
    <span class="sgen-hint">Full database DDL — tables, indexes, views, stored procedures, functions, triggers</span>
  </div>
  <div class="sgen-body">
    <div class="sgen-opts">
      <label class="sgen-chk"><input type="checkbox" id="sgen-tables"     checked> Tables &amp; Indexes</label>
      <label class="sgen-chk"><input type="checkbox" id="sgen-views"      checked> Views</label>
      <label class="sgen-chk"><input type="checkbox" id="sgen-procedures" checked> Stored Procedures</label>
      <label class="sgen-chk"><input type="checkbox" id="sgen-functions"  checked> Functions</label>
      <label class="sgen-chk"><input type="checkbox" id="sgen-triggers"   checked> Triggers</label>
      <label class="sgen-chk sgen-chk-data"><input type="checkbox" id="sgen-data"> Data (INSERT rows)</label>
    </div>
    <div class="sgen-actions">
      <button class="btn-pdf" onclick="downloadScript()">&#8659; Download .sql</button>
      <button class="btn-theme" id="sgen-preview-btn" onclick="previewScript()">&#9660; Preview</button>
    </div>
  </div>
  <div id="sgen-preview-wrap" style="display:none">
    <div class="sgen-preview-bar">
      <span class="sgen-preview-lbl" id="sgen-preview-lbl">SQL Preview</span>
      <button class="btn-theme" onclick="copyScript(this)">&#8227; Copy all</button>
      <button class="btn-theme" onclick="document.getElementById('sgen-preview-wrap').style.display='none';
        document.getElementById('sgen-preview-btn').textContent='▼ Preview'">&#10005; Close</button>
    </div>
    <pre id="sgen-pre" class="sgen-pre"></pre>
  </div>
</div>
<!-- /Script Generator ───────────────────────────────────── -->

<!-- ── Password Hash Utility ─────────────────────────────── -->
<div class="sgen" id="pw-util">
  <div class="sgen-hdr">
    <h2>&#128273; Password Hash Utility</h2>
    <span class="sgen-hint">Generate a bcrypt hash or verify a password against an existing hash</span>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--probe-grid-gap)">

    <!-- Generate Hash -->
    <div style="background:var(--probe-cell-bg);padding:14px 16px">
      <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">Generate Bcrypt Hash</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <input type="password" id="pw-gen-input" placeholder="Enter plaintext password"
          style="background:var(--bg);border:1px solid var(--ctrl-border);color:var(--text);
                 padding:8px 10px;border-radius:4px;font-family:inherit;font-size:12px;width:100%">
        <div style="display:flex;gap:8px">
          <button class="btn-pdf" style="flex:1" onclick="pwGenHash()">Generate Hash</button>
          <button class="btn-theme" onclick="pwToggleVis('pw-gen-input',this)" title="Show/hide">&#128065;</button>
        </div>
        <div id="pw-gen-result" style="display:none;margin-top:4px">
          <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Bcrypt hash (copy into SQL or user record):</div>
          <div style="position:relative">
            <textarea id="pw-gen-hash" readonly rows="3"
              style="width:100%;background:var(--bg);border:1px solid var(--ctrl-border);color:#6366f1;
                     padding:8px 36px 8px 10px;border-radius:4px;font-family:inherit;font-size:11px;
                     resize:none;word-break:break-all"></textarea>
            <button onclick="pwCopy('pw-gen-hash',this)" title="Copy"
              style="position:absolute;top:6px;right:6px;background:none;border:none;
                     cursor:pointer;color:var(--muted);font-size:14px;padding:0">&#8227;</button>
          </div>
        </div>
        <div id="pw-gen-err" style="display:none;font-size:11px;color:#dc2626"></div>
      </div>
    </div>

    <!-- Verify Hash -->
    <div style="background:var(--probe-cell-bg);padding:14px 16px">
      <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">Verify Password Against Hash</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div style="font-size:10px;color:var(--muted);margin-bottom:-4px">① Stored bcrypt hash (paste from DB):</div>
        <textarea id="pw-ver-hash" rows="2" placeholder="$2y$10$…"
          style="width:100%;background:var(--bg);border:1px solid var(--ctrl-border);color:var(--text);
                 padding:8px 10px;border-radius:4px;font-family:inherit;font-size:11px;resize:none"></textarea>
        <div style="font-size:10px;color:var(--muted);margin-bottom:-4px">② Plaintext password to test:</div>
        <div style="display:flex;gap:8px;align-items:center">
          <input type="password" id="pw-ver-input" placeholder="e.g. BlackFire@2026!"
            style="background:var(--bg);border:1px solid var(--ctrl-border);color:var(--text);
                   padding:8px 10px;border-radius:4px;font-family:inherit;font-size:12px;flex:1">
          <button class="btn-theme" onclick="pwToggleVis('pw-ver-input',this)" title="Show/hide">&#128065;</button>
        </div>
        <div style="font-size:10px;color:#64748b;font-style:italic">bcrypt is one-way — enter the candidate password above, not a hash</div>
        <button class="btn-pdf" onclick="pwVerify()">Verify</button>
        <div id="pw-ver-result" style="display:none;padding:8px 12px;border-radius:4px;font-size:12px;font-weight:600;text-align:center"></div>
        <div id="pw-ver-err" style="display:none;font-size:11px;color:#dc2626"></div>
      </div>
    </div>

  </div>
</div>
<!-- /Password Hash Utility ──────────────────────────────── -->

<!-- ── Code Health ───────────────────────────────────────── -->
<div class="hchk">
  <div class="hchk-hdr">
    <h2>&#9679; Code Health</h2>
    <div class="hchk-summary">
      <span class="hchk-s-ok">&#10003; <?= $ch_ok ?> passed</span>
      <?php if ($ch_fail): ?><span class="hchk-s-fail">&#10007; <?= $ch_fail ?> failed</span><?php endif; ?>
    </div>
  </div>
  <div class="hchk-list">
    <?php foreach ($code_checks as $c):
        $dot = $c['status'] === 'ok' ? 'dot-ok' : ($c['status'] === 'miss' ? 'dot-warn' : 'dot-miss');
    ?>
    <div class="hchk-row">
      <span class="dot <?= $dot ?>"></span>
      <div style="flex:1;min-width:0">
        <div class="hchk-label"><?= htmlspecialchars($c['label'], ENT_QUOTES, 'UTF-8') ?></div>
        <?php if ($c['hint']): ?>
        <div class="hchk-hint"><?= htmlspecialchars($c['hint'], ENT_QUOTES, 'UTF-8') ?></div>
        <?php endif; ?>
        <?php if ($c['detail']): ?>
        <div class="hchk-detail"><?= htmlspecialchars($c['detail'], ENT_QUOTES, 'UTF-8') ?></div>
        <?php endif; ?>
      </div>
      <?php if (!empty($c['file'])): ?>
      <span class="hchk-file"><?= htmlspecialchars($c['file'], ENT_QUOTES, 'UTF-8') ?></span>
      <?php endif; ?>
    </div>
    <?php endforeach; ?>
  </div>
</div>
<!-- /Code Health ────────────────────────────────────────── -->

<!-- ── DB Integrity ──────────────────────────────────────── -->
<div class="hchk">
  <div class="hchk-hdr">
    <h2>&#9679; DB Integrity</h2>
    <div class="hchk-summary">
      <span class="hchk-s-ok">&#10003; <?= $di_ok ?> passed</span>
      <?php if ($di_fail): ?><span class="hchk-s-fail">&#10007; <?= $di_fail ?> failed</span><?php endif; ?>
    </div>
  </div>
  <div class="hchk-list">
    <?php foreach ($db_checks as $c): ?>
    <div class="hchk-row">
      <span class="dot <?= $c['status'] === 'ok' ? 'dot-ok' : 'dot-miss' ?>"></span>
      <div style="flex:1;min-width:0">
        <div class="hchk-label"><?= htmlspecialchars($c['label'], ENT_QUOTES, 'UTF-8') ?></div>
        <?php if ($c['hint']): ?>
        <div class="hchk-hint"><?= htmlspecialchars($c['hint'], ENT_QUOTES, 'UTF-8') ?></div>
        <?php endif; ?>
        <?php if ($c['detail']): ?>
        <div class="hchk-detail"><?= htmlspecialchars($c['detail'], ENT_QUOTES, 'UTF-8') ?></div>
        <?php endif; ?>
      </div>
    </div>
    <?php endforeach; ?>
  </div>
</div>
<!-- /DB Integrity ───────────────────────────────────────── -->

<!-- ── Transaction Audit ─────────────────────────────────── -->
<?php if ($tx_ok && $tx_summary): ?>
<div class="hchk" style="margin-top:12px">
  <div class="hchk-hdr">
    <h2>&#9679; Transaction Audit</h2>
    <div class="hchk-summary">
      <span class="hchk-s-ok"><?= (int)$tx_summary['n'] ?> rows</span>
      <span style="color:var(--accent2)">Net <?= bhk_fmt((float)$tx_summary['net']) ?></span>
      <?php if (!empty($tx_dupes)): ?>
        <span class="hchk-s-fail">&#9888; <?= count($tx_dupes) ?> duplicate group(s)</span>
      <?php endif; ?>
    </div>
  </div>

  <!-- Summary row -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--probe-grid-gap)">
    <?php foreach ([
      ['Total Credits', bhk_fmt((float)$tx_summary['tc']), 'hchk-s-ok'],
      ['Total Debits',  '('.bhk_fmt((float)$tx_summary['td']).')', 'hchk-s-fail'],
      ['Net Balance',   bhk_fmt((float)$tx_summary['net']), (float)$tx_summary['net']>=0?'hchk-s-ok':'hchk-s-fail'],
      ['Row Count',     (int)$tx_summary['n'].' rows', ''],
    ] as [$lbl,$val,$cls]): ?>
    <div style="background:var(--probe-cell-bg);padding:10px 14px">
      <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em"><?= $lbl ?></div>
      <div style="font-size:13px;font-weight:700;margin-top:4px" class="<?= $cls ?>"><?= $val ?></div>
    </div>
    <?php endforeach; ?>
  </div>

  <!-- External statement reconciliation -->
  <div style="padding:12px 16px;border-top:1px solid var(--probe-border);background:var(--probe-cell-bg)">
    <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Reconciliation — paste external statement closing balance</div>
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <input type="number" id="bhk-ext-bal" step="0.01" placeholder="e.g. 315416.83"
        style="background:var(--bg);border:1px solid var(--ctrl-border);color:var(--text);
               padding:7px 10px;border-radius:4px;font-family:inherit;font-size:12px;width:200px"
        oninput="bhkCalcDiff(this.value)">
      <span id="bhk-diff-out" style="font-size:12px;color:var(--muted)">Enter a balance to compare</span>
    </div>
  </div>

  <!-- Category breakdown -->
  <?php if ($tx_by_cat): ?>
  <div style="padding:12px 16px;border-top:1px solid var(--probe-border)">
    <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Credits by Category</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <?php foreach ($tx_by_cat as $row): ?>
      <span style="font-size:11px;background:var(--probe-hdr-bg);border:1px solid var(--probe-border);
                   padding:3px 8px;border-radius:3px;white-space:nowrap">
        <?= htmlspecialchars($row['category'] ?: 'Uncategorised', ENT_QUOTES, 'UTF-8') ?>:
        <strong style="color:var(--accent2)"><?= bhk_fmt((float)$row['tc']) ?></strong>
        <?php if ($row['td'] > 0): ?>/ <strong style="color:#dc2626">(<?= bhk_fmt((float)$row['td']) ?>)</strong><?php endif; ?>
      </span>
      <?php endforeach; ?>
    </div>
  </div>
  <?php endif; ?>

  <!-- Duplicates -->
  <?php if (!empty($tx_dupes)): ?>
  <div style="border-top:2px solid #dc2626;padding:12px 16px">
    <div style="font-size:10px;color:#dc2626;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">&#9888; Duplicate Groups (same date + description + amount)</div>
    <div class="wrap">
      <table>
        <thead><tr><th>Date</th><th>Description</th><th>Credit</th><th>Debit</th><th>Count</th></tr></thead>
        <tbody>
          <?php foreach ($tx_dupes as $d): ?>
          <tr>
            <td><?= htmlspecialchars($d['trans_date'], ENT_QUOTES, 'UTF-8') ?></td>
            <td><?= htmlspecialchars($d['description'], ENT_QUOTES, 'UTF-8') ?></td>
            <td style="color:#16a34a"><?= $d['credit'] > 0 ? bhk_fmt((float)$d['credit']) : '-' ?></td>
            <td style="color:#dc2626"><?= $d['debit']  > 0 ? bhk_fmt((float)$d['debit'])  : '-' ?></td>
            <td style="color:#dc2626;font-weight:700"><?= (int)$d['cnt'] ?>&times;</td>
          </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>
  <?php endif; ?>

  <!-- Running balance table -->
  <div style="border-top:1px solid var(--probe-border);padding:12px 16px">
    <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">All Transactions — Running Balance</div>
    <div class="wrap">
      <table>
        <thead><tr><th>ID</th><th>Date</th><th>Description</th><th>Category</th><th>Reference</th><th>Credit</th><th>Debit</th><th>Running Bal</th></tr></thead>
        <tbody>
          <?php
          $running = 0;
          $dupe_set = [];
          foreach ($tx_dupes as $d) {
              $dupe_set["{$d['trans_date']}|{$d['description']}|{$d['credit']}|{$d['debit']}"] = true;
          }
          foreach ($tx_rows as $r):
              $running += (float)$r['credit'] - (float)$r['debit'];
              $dk = "{$r['trans_date']}|{$r['description']}|{$r['credit']}|{$r['debit']}";
              $is_dupe = isset($dupe_set[$dk]);
          ?>
          <tr <?= $is_dupe ? 'style="background:rgba(220,38,38,.1)"' : '' ?>>
            <td style="color:var(--muted)"><?= (int)$r['id'] ?></td>
            <td><?= htmlspecialchars($r['trans_date'], ENT_QUOTES, 'UTF-8') ?></td>
            <td><?= htmlspecialchars($r['description'], ENT_QUOTES, 'UTF-8') ?><?= $is_dupe ? ' <span style="color:#dc2626;font-size:10px">DUP</span>' : '' ?></td>
            <td><span style="font-size:10px;border:1px solid var(--border);padding:1px 5px;border-radius:2px"><?= htmlspecialchars($r['category'] ?? '', ENT_QUOTES, 'UTF-8') ?></span></td>
            <td style="color:var(--muted);font-size:11px"><?= htmlspecialchars($r['reference'] ?? '-', ENT_QUOTES, 'UTF-8') ?></td>
            <td style="color:#16a34a;text-align:right"><?= (float)$r['credit'] > 0 ? bhk_fmt((float)$r['credit']) : '-' ?></td>
            <td style="color:#dc2626;text-align:right"><?= (float)$r['debit']  > 0 ? bhk_fmt((float)$r['debit'])  : '-' ?></td>
            <td style="text-align:right;font-weight:600;color:<?= $running >= 0 ? '#16a34a' : '#dc2626' ?>"><?= bhk_fmt($running) ?></td>
          </tr>
          <?php endforeach; ?>
          <tr style="background:var(--thead-bg);font-weight:700">
            <td colspan="5">TOTAL</td>
            <td style="color:#16a34a;text-align:right"><?= bhk_fmt((float)$tx_summary['tc']) ?></td>
            <td style="color:#dc2626;text-align:right">(<?= bhk_fmt((float)$tx_summary['td']) ?>)</td>
            <td style="text-align:right;color:<?= (float)$tx_summary['net'] >= 0 ? '#16a34a' : '#dc2626' ?>"><?= bhk_fmt((float)$tx_summary['net']) ?></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
<?php elseif (!$tx_ok): ?>
<div class="hchk" style="margin-top:12px">
  <div class="hchk-hdr"><h2>&#9679; Transaction Audit</h2></div>
  <div style="padding:12px 16px;color:#dc2626;font-size:12px">Error: <?= htmlspecialchars($tx_error ?? 'unknown', ENT_QUOTES, 'UTF-8') ?></div>
</div>
<?php endif; ?>
<!-- /Transaction Audit ──────────────────────────────────── -->

<?php foreach ($tables as $tbl):
    $rows  = $data[$tbl];
    $cols  = $rows ? array_keys($rows[0]) : [];
    $shown = count($rows);
    $total = $counts[$tbl];
?>
<div class="section" id="<?= $tbl ?>">
  <div class="section-head">
    <h2><?= $tbl ?></h2>
    <span class="tag">
      <?= $shown ?> / <?= $total ?> rows<?php if ($total > 10): ?> · LIMIT 10<?php endif; ?>
    </span>
  </div>
  <?php if (!$rows): ?>
    <div class="empty">— table is empty —</div>
  <?php else: ?>
  <div class="wrap">
    <table>
      <thead><tr><?php foreach ($cols as $c): ?><th><?= htmlspecialchars($c, ENT_QUOTES, 'UTF-8') ?></th><?php endforeach; ?></tr></thead>
      <tbody>
        <?php foreach ($rows as $row): ?>
          <tr><?php foreach ($row as $val): ?><td title="<?= htmlspecialchars((string)($val ?? ''), ENT_QUOTES, 'UTF-8') ?>"><?= esc($val) ?></td><?php endforeach; ?></tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
  <?php endif; ?>
</div>
<?php endforeach; ?>

<footer>
  bhekani Bo · BlackFire DB Viewer · <?= esc($who) ?> · <?= date('Y-m-d H:i:s') ?><br>
  DEV ONLY — not deployed to production.
</footer>

<script>
// Sign out
if (location.search.includes('logout=1')) {
  fetch('?_logout=1', {method:'POST'}).finally(() => location.href = location.pathname);
}

// Theme — restore saved preference on load (default: light)
(function(){
  const saved = localStorage.getItem('bhk-theme') || 'light';
  document.documentElement.dataset.theme = saved;
})();

function bhkCalcDiff(val) {
  const ext = parseFloat(val) || 0;
  const net = <?= json_encode($tx_ok ? round((float)($tx_summary['net'] ?? 0), 2) : 0) ?>;
  const out = document.getElementById('bhk-diff-out');
  if (!ext) { out.textContent = 'Enter a balance to compare'; out.style.color = ''; return; }
  const diff = net - ext;
  const abs  = Math.abs(diff).toLocaleString('en-ZA', {minimumFractionDigits:2, maximumFractionDigits:2});
  if (Math.abs(diff) < 0.01) {
    out.textContent = '✓ Portal matches statement exactly.';
    out.style.color = '#16a34a';
  } else if (diff > 0) {
    out.textContent = `Portal is R ${abs} HIGHER than statement — check for duplicate credits.`;
    out.style.color = '#dc2626';
  } else {
    out.textContent = `Portal is R ${abs} LOWER than statement — check for missing payment entries.`;
    out.style.color = '#d97706';
  }
}

function toggleTheme() {
  const html = document.documentElement;
  const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
  html.dataset.theme = next;
  localStorage.setItem('bhk-theme', next);
}

function exportPDF() {
  const orig = document.title;
  document.title = 'bhekani_bo_' + new Date().toISOString().slice(0,10);
  window.print();
  document.title = orig;
}

// ── Script Generator ──────────────────────────────────────────────────
function _scriptParams() {
  return {
    action:     'export_sql',
    tables:     document.getElementById('sgen-tables').checked     ? '1' : '0',
    views:      document.getElementById('sgen-views').checked      ? '1' : '0',
    procedures: document.getElementById('sgen-procedures').checked ? '1' : '0',
    functions:  document.getElementById('sgen-functions').checked  ? '1' : '0',
    triggers:   document.getElementById('sgen-triggers').checked   ? '1' : '0',
    data:       document.getElementById('sgen-data').checked       ? '1' : '0',
  };
}
function downloadScript() {
  window.location.href = '?' + new URLSearchParams(_scriptParams()).toString();
}
async function previewScript() {
  const btn  = document.getElementById('sgen-preview-btn');
  const wrap = document.getElementById('sgen-preview-wrap');
  const pre  = document.getElementById('sgen-pre');
  const lbl  = document.getElementById('sgen-preview-lbl');
  btn.disabled = true; btn.textContent = '… Generating';
  try {
    const qs = new URLSearchParams({..._scriptParams(), preview: '1'}).toString();
    const r  = await fetch('?' + qs);
    const txt = await r.text();
    const lines = txt.split('\n').length;
    const bytes = new Blob([txt]).size;
    pre.textContent = txt;
    lbl.textContent = `SQL Preview — ${lines.toLocaleString()} lines · ${(bytes/1024).toFixed(1)} KB`;
    wrap.style.display = 'block';
    btn.textContent = '&#9660; Refresh';
  } catch (e) {
    pre.textContent = 'Error: ' + e;
    wrap.style.display = 'block';
    btn.textContent = '&#9660; Retry';
  }
  btn.disabled = false;
}
async function copyScript(btn) {
  const txt = document.getElementById('sgen-pre').textContent;
  try { await navigator.clipboard.writeText(txt); } catch(e) {}
  const orig = btn.textContent; btn.textContent = '✓ Copied!';
  setTimeout(() => btn.textContent = orig, 2000);
}

// ── Password Hash Utility ─────────────────────────────────────────────
async function pwGenHash() {
  const plain = document.getElementById('pw-gen-input').value;
  const resEl = document.getElementById('pw-gen-result');
  const errEl = document.getElementById('pw-gen-err');
  const hashEl = document.getElementById('pw-gen-hash');
  resEl.style.display = 'none'; errEl.style.display = 'none';
  const fd = new FormData(); fd.append('mode', 'hash'); fd.append('plaintext', plain);
  try {
    const r = await fetch('?action=pw_util', {method:'POST', body:fd});
    const d = await r.json();
    if (d.error) { errEl.textContent = d.error; errEl.style.display = 'block'; return; }
    hashEl.value = d.hash;
    resEl.style.display = 'block';
  } catch(e) { errEl.textContent = 'Request failed: ' + e; errEl.style.display = 'block'; }
}

async function pwVerify() {
  const plain   = document.getElementById('pw-ver-input').value;
  const hash    = document.getElementById('pw-ver-hash').value.trim();
  const resEl   = document.getElementById('pw-ver-result');
  const errEl   = document.getElementById('pw-ver-err');
  resEl.style.display = 'none'; errEl.style.display = 'none';
  const fd = new FormData(); fd.append('mode', 'verify'); fd.append('plaintext', plain); fd.append('hash', hash);
  try {
    const r = await fetch('?action=pw_util', {method:'POST', body:fd});
    const d = await r.json();
    if (d.error) { errEl.textContent = d.error; errEl.style.display = 'block'; return; }
    resEl.style.display = 'block';
    if (d.match) {
      resEl.style.background = 'rgba(22,163,74,.15)'; resEl.style.color = '#16a34a';
      resEl.style.border = '1px solid #16a34a'; resEl.textContent = '✓ Password matches the hash';
    } else {
      resEl.style.background = 'rgba(220,38,38,.1)'; resEl.style.color = '#dc2626';
      resEl.style.border = '1px solid #dc2626'; resEl.textContent = '✗ Password does NOT match the hash';
    }
  } catch(e) { errEl.textContent = 'Request failed: ' + e; errEl.style.display = 'block'; }
}

function pwToggleVis(id, btn) {
  const el = document.getElementById(id);
  const isHidden = el.type === 'password';
  el.type = isHidden ? 'text' : 'password';
  btn.style.opacity = isHidden ? '1' : '0.5';
}

async function pwCopy(id, btn) {
  const txt = document.getElementById(id).value;
  try { await navigator.clipboard.writeText(txt); } catch(e) {}
  const orig = btn.textContent; btn.textContent = '✓';
  setTimeout(() => btn.textContent = orig, 1500);
}

const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    const l = document.querySelector(`.toc a[href="#${e.target.id}"]`);
    if (l) l.classList.toggle('active', e.isIntersecting);
  });
}, {rootMargin:'-10% 0px -85% 0px'});
document.querySelectorAll('.section').forEach(s => obs.observe(s));
</script>
<?php
// Handle sign-out POST
if (isset($_GET['_logout'])) {
    unset($_SESSION['bhk_ok']);
    exit;
}
?>
</body>
</html>
