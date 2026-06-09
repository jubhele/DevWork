<?php
ob_start();
/**
 * Umlilo Portal — Statements API
 *
 * GET  ?action=list                      → list all statements (paginated)
 * GET  ?action=pending                   → pending_approval statements only
 * GET  ?action=email_options             → FROM email options for logged-in role
 * POST ?action=generate                  → generate statement for this week (manual or cron)
 * POST ?action=cron&secret=XXX           → cron-triggered generate (no auth required, secret gated)
 * PUT  ?id=STMT-2026-0001                → release a pending statement
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$cfg = require __DIR__ . '/../config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');
api_headers();

$method = $_SERVER['REQUEST_METHOD'];
$action = clean($_GET['action'] ?? '', 30);
$ref_id = clean($_GET['id']     ?? '', 20);

// ── Cron endpoint (no session required, secret-gated) ─────────────────
if ($method === 'POST' && $action === 'cron') {
    $secret = clean($_GET['secret'] ?? '', 100);
    $expected = getenv('BF_CRON_SECRET') ?: ($cfg['cron_secret'] ?? '');
    if (!$expected || !hash_equals($expected, $secret)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Forbidden']);
        exit;
    }
    $result = _generate_statement('cron');
    json_ok($result, $result['message'] ?? 'Done');
}

// All other endpoints require authentication
$user = require_auth();

// ── GET — download ───────────────────────────────────────────────────
if ($method === 'GET' && $action === 'download') {
    if (!can('finance.statement', $user['role'])) json_err('Permission denied', 403);
    if (!$ref_id) json_err('Missing id', 400);
    $stmt = db_row("SELECT * FROM bf_statements WHERE ref_id=?", [$ref_id]);
    if (!$stmt) json_err('Statement not found', 404);
    $invoices = [];
    if (!empty($stmt['invoice_refs'])) {
        $refs = array_filter(array_map('trim', explode(',', $stmt['invoice_refs'])));
        if ($refs) {
            $ph = implode(',', array_fill(0, count($refs), '?'));
            $invoices = db_select("SELECT ref_id, client_name, invoice_date, due_date, status, amount FROM bf_invoices WHERE ref_id IN ($ph)", $refs);
        }
    }
    json_ok(['data' => array_merge($stmt, ['invoices' => $invoices])]);
}

// ── GET — email_options ───────────────────────────────────────────────
if ($method === 'GET' && $action === 'email_options') {
    $role = $user['role'];

    // Determine which roles' emails this user can use as FROM
    $allowed_roles = [];
    if (in_array($role, ['admin','sysadmin'])) {
        $allowed_roles = ['admin', 'manager', 'admin_clerk'];
    } elseif ($role === 'manager') {
        $allowed_roles = ['manager', 'admin_clerk'];
    } elseif ($role === 'admin_clerk') {
        $allowed_roles = ['admin_clerk'];
    } else {
        json_err('Permission denied', 403);
    }

    $placeholders = implode(',', array_fill(0, count($allowed_roles), '?'));
    $emails = db_select(
        "SELECT username, name, role, email FROM bf_users
          WHERE active = 1 AND role IN ($placeholders) AND email != ''
          ORDER BY FIELD(role,'admin','manager','admin_clerk'), name",
        $allowed_roles
    );

    // TO options are limited to the same pool as FROM — no harvesting all user emails
    json_ok(['from_options' => $emails, 'to_options' => $emails]);
}

// ── GET — list / pending ──────────────────────────────────────────────
if ($method === 'GET') {
    if (!can('finance.statement', $user['role'])) json_err('Permission denied', 403);

    $pg    = get_pagination();
    $where = '';
    $params = [];

    if ($action === 'pending') {
        $where  = "WHERE status = 'pending_approval'";
    } elseif ($action === 'list' || $action === '') {
        $status_filter = clean($_GET['status'] ?? '', 30);
        if ($status_filter) {
            $where  = "WHERE status = ?";
            $params = [$status_filter];
        }
    }

    $total = db_row("SELECT COUNT(*) AS n FROM bf_statements $where", $params)['n'] ?? 0;
    $rows  = db_select(
        "SELECT s.*, COALESCE(u.username,'') AS released_by
           FROM bf_statements s
           LEFT JOIN bf_users u ON u.id = s.released_by_user_id
          $where ORDER BY s.created_at DESC LIMIT {$pg['limit']} OFFSET {$pg['offset']}",
        $params
    );

    // Also return outstanding invoice summary for display
    $outstanding = db_select(
        "SELECT ref_id, client_name, client_email, amount, due_date, status, invoice_date
           FROM bf_invoices
          WHERE status IN ('Sent','Overdue','Draft')
          ORDER BY due_date ASC",
        []
    );
    $outstanding_total = array_sum(array_column($outstanding, 'amount'));

    json_ok([
        'data'              => $rows,
        'total'             => (int)$total,
        'outstanding'       => $outstanding,
        'outstanding_total' => (float)$outstanding_total,
    ]);
}

// ── POST — generate ───────────────────────────────────────────────────
if ($method === 'POST') {
    if (!can('finance.statement.generate', $user['role'])) json_err('Permission denied', 403);
    $result = _generate_statement($user['username']);
    json_ok($result, $result['message'] ?? 'Done');
}

// ── PUT — release ─────────────────────────────────────────────────────
if ($method === 'PUT') {
    if (!can('finance.statement.release', $user['role'])) json_err('Permission denied', 403);
    if (!$ref_id) json_err('Missing id');

    $b = get_body();

    $stmt = db_row("SELECT * FROM bf_statements WHERE ref_id = ?", [$ref_id]);
    if (!$stmt) json_err('Statement not found', 404);
    if ($stmt['status'] !== 'pending_approval') json_err('Statement is not pending approval');

    $from_email = clean($b['from_email'] ?? '', 150);
    $to_emails  = $b['to_emails'] ?? [];

    if (!$from_email || !filter_var($from_email, FILTER_VALIDATE_EMAIL)) {
        json_err('Valid FROM email required');
    }
    if (empty($to_emails)) json_err('At least one TO email address required');

    // Validate TO emails
    $clean_tos = [];
    foreach ((array)$to_emails as $e) {
        $e = clean($e, 150);
        if (!filter_var($e, FILTER_VALIDATE_EMAIL)) json_err('Invalid TO email: ' . htmlspecialchars($e, ENT_QUOTES, 'UTF-8'));
        $clean_tos[] = $e;
    }

    // Validate FROM email is in the allowed pool for this role
    $role = $user['role'];
    $allowed_roles = match ($role) {
        'admin'      => ['admin', 'manager', 'admin_clerk'],
        'manager'    => ['manager', 'admin_clerk'],
        'admin_clerk'=> ['admin_clerk'],
        default      => [],
    };
    if (empty($allowed_roles)) json_err('Permission denied', 403);

    $ph = implode(',', array_fill(0, count($allowed_roles), '?'));
    $from_user = db_row(
        "SELECT name FROM bf_users WHERE email = ? AND role IN ($ph) AND active = 1 LIMIT 1",
        array_merge([$from_email], $allowed_roles)
    );
    if (!$from_user) json_err('Selected FROM email is not permitted for your role');

    $from_name = $from_user['name'];

    // Load outstanding invoices at time of release
    $invoice_refs = array_filter(explode(',', $stmt['invoice_refs']));
    $invoices = [];
    if (!empty($invoice_refs)) {
        $ph2 = implode(',', array_fill(0, count($invoice_refs), '?'));
        $invoices = db_select(
            "SELECT * FROM bf_invoices WHERE ref_id IN ($ph2)",
            $invoice_refs
        );
    }
    // Fall back to current outstanding if refs are empty
    if (empty($invoices)) {
        $invoices = db_select(
            "SELECT * FROM bf_invoices WHERE status IN ('Sent','Overdue','Draft') ORDER BY due_date ASC",
            []
        );
    }

    require_once __DIR__ . '/../includes/mailer.php';
    $errors = [];
    foreach ($clean_tos as $to) {
        $ok = send_statement_email($stmt, $invoices, $to, $from_email, $from_name);
        if (!$ok) $errors[] = $to;
    }

    if (count($errors) === count($clean_tos)) {
        json_err('Failed to send statement email — check SMTP settings');
    }

    db_exec(
        "UPDATE bf_statements SET status = 'released', released_by_user_id = ?, released_at = NOW(), from_email = ?, to_emails = ? WHERE ref_id = ?",
        [(int)$user['id'], $from_email, implode(',', $clean_tos), $ref_id]
    );

    audit($user['username'], 'STATEMENT_RELEASED',
          "Statement {$ref_id} released from {$from_email} to " . implode(', ', $clean_tos));

    $stmt = db_row("SELECT * FROM bf_statements WHERE ref_id = ?", [$ref_id]);
    $msg = empty($errors)
        ? "Statement {$ref_id} sent successfully"
        : "Statement sent (failed for: " . implode(', ', $errors) . ")";
    json_ok(['data' => $stmt], $msg);
}

json_err('Method not allowed', 405);

// ── Helper: generate a statement ──────────────────────────────────────
function _generate_statement(string $triggered_by): array {
    // Get all outstanding invoices
    $outstanding = db_select(
        "SELECT ref_id, client_name, amount FROM bf_invoices
          WHERE status IN ('Sent','Overdue','Draft') AND amount > 0",
        []
    );

    if (empty($outstanding)) {
        return ['message' => 'No outstanding invoices — statement not generated', 'created' => false];
    }

    $total    = array_sum(array_column($outstanding, 'amount'));
    $refs_csv = implode(',', array_column($outstanding, 'ref_id'));
    $ref      = next_ref_id('stmt');
    $sched    = date('Y-m-d');

    // Avoid duplicate statements for the same scheduled date regardless of status
    $existing = db_row(
        "SELECT id FROM bf_statements WHERE scheduled_for = ? LIMIT 1",
        [$sched]
    );
    if ($existing) {
        return ['message' => 'A statement already exists for today', 'created' => false];
    }

    db_insert(
        "INSERT INTO bf_statements (ref_id, scheduled_for, status, invoice_refs, total_outstanding, from_email, to_emails)
         VALUES (?,?,?,?,?,?,?)",
        [$ref, $sched, 'pending_approval', $refs_csv, $total, '', '']
    );

    audit($triggered_by, 'STATEMENT_GENERATED',
          "Statement {$ref} generated with " . count($outstanding) . " invoices — total R" . number_format($total, 2));

    return [
        'message'      => "Statement {$ref} created — " . count($outstanding) . " invoices, total R" . number_format($total, 2),
        'ref_id'       => $ref,
        'invoice_count'=> count($outstanding),
        'total'        => $total,
        'created'      => true,
    ];
}
