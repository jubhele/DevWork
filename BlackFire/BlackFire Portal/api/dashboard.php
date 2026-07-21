<?php
ob_start();
/**
 * Umlilo Portal — Dashboard Stats API
 * GET /api/dashboard.php
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/task_access.php';

$cfg = require __DIR__ . '/../config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');
api_headers();
$user = require_auth();

$task_counts = ['open_tasks' => 0, 'urgent_tasks' => 0, 'tasks_due_today' => 0];
$task_streams = ['admin' => 0, 'sales' => 0, 'general' => 0];
$recent_tasks = [];
if (can('task.view')) {
    $categories = task_accessible_categories(task_user_roles($user));
    if ($categories) {
        $placeholders = implode(',', array_fill(0, count($categories), '?'));
        $task_counts = db_row(
            "SELECT
                SUM(status IN ('Open','In Progress')) AS open_tasks,
                SUM(priority = 'Urgent' AND status IN ('Open','In Progress')) AS urgent_tasks,
                SUM(COALESCE(DATE(due_at), due_date) = CURDATE() AND status IN ('Open','In Progress')) AS tasks_due_today
             FROM bf_tasks
             WHERE category IN ($placeholders)",
            $categories
        ) ?: $task_counts;
        $stream_rows = db_select(
            "SELECT category, COUNT(*) AS total
             FROM bf_tasks
             WHERE category IN ($placeholders) AND status IN ('Open','In Progress')
             GROUP BY category",
            $categories
        );
        foreach ($stream_rows as $stream) {
            $task_streams[$stream['category']] = (int)$stream['total'];
        }
        $recent_tasks = db_select(
            "SELECT ref_id, category, title, status, priority, assigned_to, due_date, source_callout_ref, created_at
             FROM bf_tasks
             WHERE category IN ($placeholders) AND status != 'Cancelled'
             ORDER BY created_at DESC
             LIMIT 5",
            $categories
        );
    }
}

// KPI counts
$open_callouts    = db_row("SELECT COUNT(*) AS n FROM bf_callouts WHERE status IN ('Open','In Progress')")['n'] ?? 0;
$urgent_callouts  = db_row("SELECT COUNT(*) AS n FROM bf_callouts WHERE status IN ('Open','In Progress') AND priority IN ('Urgent','Emergency')")['n'] ?? 0;
$pending_quotes   = db_row("SELECT COUNT(*) AS n FROM bf_quotes WHERE status IN ('Draft','Sent','Pending Approval')")['n'] ?? 0;
$overdue_invoices = db_row("SELECT COUNT(*) AS n FROM bf_invoices WHERE status NOT IN ('Paid','Cancelled') AND due_date < CURDATE()")['n'] ?? 0;
$pending_statements = can('finance.statement')
    ? (db_row("SELECT COUNT(*) AS n FROM bf_statements WHERE status = 'pending_approval'")['n'] ?? 0)
    : 0;
$active_clients   = db_row("SELECT COUNT(*) AS n FROM bf_clients WHERE is_active = 1")['n'] ?? 0;

// Safety score: average score across active, approved safety files (null if none exist)
$ss_row      = db_row("SELECT AVG(score) AS avg FROM bf_safety_files WHERE status = 'Approved' AND is_active = 1");
$safety_score = ($ss_row['avg'] !== null) ? round((float)$ss_row['avg'], 1) : null;

$financial_start_year = (int)date('n') >= 3 ? (int)date('Y') : (int)date('Y') - 1;
$period_start = $financial_start_year . '-03-01';
$period_end = date('Y-m-d');
$period_label = 'Financial YTD ' . $financial_start_year . '/' . substr((string)($financial_start_year + 1), -2);

$invoice_run_months = [];
$cursor = new DateTimeImmutable($period_start);
$period_limit = new DateTimeImmutable(date('Y-m-01'));
while ($cursor <= $period_limit) {
    $row = db_row(
        "SELECT COUNT(*) AS invoice_count, COALESCE(SUM(amount),0) AS amount
           FROM bf_invoices
          WHERE status != 'Cancelled'
            AND YEAR(invoice_date) = ? AND MONTH(invoice_date) = ?",
        [$cursor->format('Y'), $cursor->format('n')]
    );
    $invoice_run_months[] = [
        'label' => $cursor->format('M'),
        'month' => $cursor->format('Y-m'),
        'count' => (int)($row['invoice_count'] ?? 0),
        'amount' => (float)($row['amount'] ?? 0),
    ];
    $cursor = $cursor->modify('+1 month');
}
$invoiced_total = array_sum(array_column($invoice_run_months, 'amount'));
$invoice_count_total = array_sum(array_column($invoice_run_months, 'count'));
$month_divisor = max(count($invoice_run_months), 1);
$outstanding = (float)(db_row("SELECT COALESCE(SUM(amount),0) AS total FROM bf_invoices WHERE status IN ('Sent','Overdue')")['total'] ?? 0);
$net_cash = (float)(db_row(
    "SELECT COALESCE(SUM(credit-debit),0) AS total FROM bf_transactions WHERE trans_date BETWEEN ? AND ?",
    [$period_start, $period_end]
)['total'] ?? 0);
$quote_pipeline = (float)(db_row(
    "SELECT COALESCE(SUM(total_amount),0) AS total FROM bf_quotes
      WHERE status IN ('Draft','Sent','Pending Approval') AND quote_date BETWEEN ? AND ?",
    [$period_start, $period_end]
)['total'] ?? 0);

$cash_total = static function (string $start, string $end): float {
    return (float)(db_row(
        "SELECT COALESCE(SUM(credit),0) AS total FROM bf_transactions
          WHERE category = 'Invoice Payment' AND trans_date BETWEEN ? AND ?",
        [$start, $end]
    )['total'] ?? 0);
};
$change_percent = static function (float $current, float $previous): ?int {
    if ($previous == 0.0) return $current == 0.0 ? 0 : null;
    return (int)round((($current - $previous) / $previous) * 100);
};
$now = new DateTimeImmutable();
$previous_today = $now->modify('-1 year')->format('Y-m-d');
$month_start = $now->format('Y-m-01');
$previous_month_start = $now->modify('-1 year')->format('Y-m-01');
$quarter_start_month = ((int)floor(((int)$now->format('n') - 1) / 3) * 3) + 1;
$quarter_start = $now->format('Y') . '-' . str_pad((string)$quarter_start_month, 2, '0', STR_PAD_LEFT) . '-01';
$previous_quarter_start = ((int)$now->format('Y') - 1) . '-' . str_pad((string)$quarter_start_month, 2, '0', STR_PAD_LEFT) . '-01';
$year_start = $now->format('Y') . '-01-01';
$previous_year_start = ((int)$now->format('Y') - 1) . '-01-01';
$mtd = $cash_total($month_start, $period_end);
$previous_mtd = $cash_total($previous_month_start, $previous_today);
$qtd = $cash_total($quarter_start, $period_end);
$previous_qtd = $cash_total($previous_quarter_start, $previous_today);
$ytd = $cash_total($year_start, $period_end);
$previous_ytd = $cash_total($previous_year_start, $previous_today);
$cash_comparisons = [
    ['key' => 'mtd', 'label' => 'MTD Collected', 'current' => $mtd, 'previous' => $previous_mtd, 'change_percent' => $change_percent($mtd, $previous_mtd)],
    ['key' => 'qtd', 'label' => 'Q' . ((int)floor(((int)$now->format('n') - 1) / 3) + 1) . ' Collected', 'current' => $qtd, 'previous' => $previous_qtd, 'change_percent' => $change_percent($qtd, $previous_qtd)],
    ['key' => 'ytd', 'label' => 'YTD Collected', 'current' => $ytd, 'previous' => $previous_ytd, 'change_percent' => $change_percent($ytd, $previous_ytd)],
];

// Recent callouts (5 most recent)
$recent_callouts = db_select("SELECT ref_id, client_name, service, status, priority, callout_date FROM bf_callouts ORDER BY callout_date DESC LIMIT 5");

// Records due in the next seven days. Overdue records are deliberately excluded
// because this feed is an intervention queue, not an aging report.
$due_soon = [];
$due_end = date('Y-m-d', strtotime('+7 days'));
if (can('task.view')) {
    $categories = task_accessible_categories(task_user_roles($user));
    if ($categories) {
        $placeholders = implode(',', array_fill(0, count($categories), '?'));
        $due_soon = array_merge($due_soon, db_select(
            "SELECT 'Task' AS record_type, t.ref_id, t.title AS record_title,
                    COALESCE(DATE(t.due_at), t.due_date) AS due_date, t.priority,
                    COALESCE(NULLIF(GROUP_CONCAT(DISTINCT ta.name ORDER BY ta.name SEPARATOR ', '), ''),
                             NULLIF(t.assigned_to, ''), 'Unassigned') AS assignee
               FROM bf_tasks t
               LEFT JOIN bf_task_assignees ta ON ta.task_ref = t.ref_id
              WHERE t.category IN ($placeholders)
                AND t.status IN ('Open','In Progress')
                 AND COALESCE(DATE(t.due_at), t.due_date) BETWEEN CURDATE() AND ?
              GROUP BY t.id, t.ref_id, t.title, t.due_at, t.due_date, t.priority, t.assigned_to",
            array_merge($categories, [$due_end])
        ));
    }
}
if (can('callout.view')) {
    $callout_where = "c.status IN ('Open','In Progress') AND DATE(c.due_at) BETWEEN CURDATE() AND ?";
    $callout_params = [$due_end];
    if (in_array($user['role'] ?? '', ['junior_tech', 'senior_tech'], true)) {
        $callout_where .= ' AND c.assigned_to = ?';
        $callout_params[] = $user['username'];
    } elseif (($user['role'] ?? '') === 'client_support' && !empty($user['client_id'])) {
        $callout_where .= ' AND c.client_id = ?';
        $callout_params[] = (int)$user['client_id'];
    }
    $due_soon = array_merge($due_soon, db_select(
        "SELECT 'Callout' AS record_type, c.ref_id, c.service AS record_title,
                DATE(c.due_at) AS due_date, c.priority,
                COALESCE(NULLIF(u.name, ''), NULLIF(c.assigned_to, ''), 'Unassigned') AS assignee
           FROM bf_callouts c
           LEFT JOIN bf_users u ON u.id = c.assigned_to_user_id
          WHERE $callout_where",
        $callout_params
    ));
}
if (can('invoice.view')) {
    $due_soon = array_merge($due_soon, db_select(
        "SELECT 'Invoice' AS record_type, i.ref_id, i.client_name AS record_title,
                i.due_date, 'High' AS priority,
                COALESCE(NULLIF(u.name, ''), NULLIF(u.username, ''), 'Finance team') AS assignee
           FROM bf_invoices i
           LEFT JOIN bf_users u ON u.id = i.sent_by_user_id
          WHERE i.status IN ('Draft','Sent')
            AND i.due_date BETWEEN CURDATE() AND ?",
        [$due_end]
    ));
}
if (can('quote.view')) {
    $due_soon = array_merge($due_soon, db_select(
        "SELECT 'Quote' AS record_type, q.ref_id, q.client_name AS record_title,
                q.valid_until AS due_date, 'Normal' AS priority,
                COALESCE(NULLIF(u.name, ''), NULLIF(u.username, ''), 'Unassigned') AS assignee
           FROM bf_quotes q
           LEFT JOIN bf_users u ON u.id = q.submitted_by_user_id
          WHERE q.status IN ('Draft','Sent','Pending Approval')
            AND q.valid_until BETWEEN CURDATE() AND ?",
        [$due_end]
    ));
}
usort($due_soon, fn($a, $b) => strcmp($a['due_date'], $b['due_date']) ?: strcmp($a['record_type'], $b['record_type']));

// Adoption is visible only to roles already trusted with user or audit administration.
$usage = [];
if (can('security.users') || can('security.audit')) {
    $usage = db_select(
        "SELECT u.username, u.name, u.last_login,
                MAX(CASE WHEN a.action NOT IN ('LOGIN_FAIL','MOBILE_LOGIN_FAIL','RESET_REQUEST') THEN a.created_at END) AS last_activity,
                SUM(CASE WHEN a.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                          AND a.action IN ('LOGIN','MOBILE_LOGIN') THEN 1 ELSE 0 END) AS current_logins,
                SUM(CASE WHEN a.created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
                          AND a.created_at < DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                          AND a.action IN ('LOGIN','MOBILE_LOGIN') THEN 1 ELSE 0 END) AS previous_logins,
                SUM(CASE WHEN a.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                          AND a.action = 'PAGE_VIEW' THEN 1 ELSE 0 END) AS page_views,
                SUM(CASE WHEN a.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                          AND a.action NOT IN ('LOGIN','MOBILE_LOGIN','LOGIN_FAIL','MOBILE_LOGIN_FAIL','LOGOUT','PAGE_VIEW')
                         THEN 1 ELSE 0 END) AS actions
           FROM bf_users u
           LEFT JOIN bf_audit_log a ON a.username = u.username
          WHERE u.active = 1
          GROUP BY u.id, u.username, u.name, u.last_login
          ORDER BY current_logins DESC, page_views DESC, actions DESC, u.name ASC"
    );
}

$months = array_map(static fn(array $month): array => ['label' => $month['label'], 'value' => $month['amount']], $invoice_run_months);

// Wrap KPIs under 'data' to match ApiResponse<DashboardKPIs> contract
json_ok([
    'data' => [
        'open_tasks'       => (int)($task_counts['open_tasks'] ?? 0),
        'urgent_tasks'     => (int)($task_counts['urgent_tasks'] ?? 0),
        'tasks_due_today'  => (int)($task_counts['tasks_due_today'] ?? 0),
        'open_callouts'    => (int)$open_callouts,
        'urgent_callouts'  => (int)$urgent_callouts,
        'overdue_invoices' => (int)$overdue_invoices,
        'pending_statements'=> (int)$pending_statements,
        'mtd_revenue'      => (float)$mtd,
        'safety_score'     => $safety_score,
        'pending_quotes'   => (int)$pending_quotes,
        'active_clients'   => (int)$active_clients,
    ],
    'amounts' => [
        'invoiced' => (float)$invoiced_total,
        'outstanding' => $outstanding,
        'net_cash_movement' => $net_cash,
        'quote_pipeline' => $quote_pipeline,
    ],
    'invoice_run_rate' => [
        'period_label' => $period_label,
        'period_start' => $period_start,
        'period_end' => $period_end,
        'average_count' => $invoice_count_total / $month_divisor,
        'average_amount' => $invoiced_total / $month_divisor,
        'total_count' => (int)$invoice_count_total,
        'total_amount' => (float)$invoiced_total,
        'months' => $invoice_run_months,
    ],
    'cash_comparisons' => $cash_comparisons,
    'recent_tasks' => $recent_tasks,
    'task_streams' => $task_streams,
    'recent_callouts' => $recent_callouts,
    'monthly_revenue' => $months,
    'due_soon' => $due_soon,
    'usage' => $usage,
    'usage_period_days' => 7,
]);
