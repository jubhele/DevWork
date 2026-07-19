<?php

const TASK_DIGEST_VIEW_REGISTRY = [
    'w-ops'        => ['label' => 'Operations & Tracker', 'permissions' => ['task.view']],
    'w-fin'        => ['label' => 'Finance', 'permissions' => ['invoice.view', 'finance.income']],
    'w-alerts'     => ['label' => 'Live Alerts', 'permissions' => []],
    'w-compliance' => ['label' => 'Compliance Alerts', 'permissions' => ['safety.view']],
    'w-compare'    => ['label' => 'Period Comparisons', 'permissions' => ['invoice.view', 'finance.income']],
];

function task_digest_has_permission(array $permissions, string $permission): bool {
    return in_array($permission, $permissions, true);
}

function task_digest_allowed_views(array $permissions): array {
    $allowed = [];
    foreach (TASK_DIGEST_VIEW_REGISTRY as $id => $view) {
        $required = $view['permissions'];
        if (!$required || array_intersect($required, $permissions)) {
            $allowed[] = ['id' => $id, 'label' => $view['label']];
        }
    }
    return $allowed;
}

function task_digest_normalize_preferences(mixed $raw, array $allowed_view_ids): array {
    if (is_string($raw)) {
        $decoded = json_decode($raw, true);
        $raw = is_array($decoded) ? $decoded : [];
    }
    if (!is_array($raw)) $raw = [];

    $frequency = in_array($raw['frequency'] ?? '', ['daily', 'weekly'], true)
        ? $raw['frequency']
        : 'daily';
    $send_time = preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', (string)($raw['send_time'] ?? ''))
        ? $raw['send_time']
        : '07:00';
    $legacy_weekday = min(7, max(1, (int)($raw['weekday'] ?? 1)));
    $requested_weekdays = is_array($raw['weekdays'] ?? null)
        ? $raw['weekdays']
        : [$legacy_weekday];
    $weekdays = array_values(array_unique(array_filter(
        array_map('intval', $requested_weekdays),
        fn(int $weekday): bool => $weekday >= 1 && $weekday <= 7
    )));
    sort($weekdays);
    if (!$weekdays) $weekdays = [$legacy_weekday];
    $requested_views = is_array($raw['views'] ?? null) ? $raw['views'] : [];
    $views = array_values(array_unique(array_intersect(
        array_map('strval', $requested_views),
        $allowed_view_ids
    )));

    return [
        'enabled'   => filter_var($raw['enabled'] ?? false, FILTER_VALIDATE_BOOL),
        'frequency' => $frequency,
        'weekday'   => $weekdays[0],
        'weekdays'  => $weekdays,
        'send_time' => $send_time,
        'views'     => $views,
    ];
}

function task_digest_is_due(array $preferences, ?string $last_sent_at, DateTimeImmutable $now): bool {
    if (empty($preferences['enabled'])) return false;

    [$hour, $minute] = array_map('intval', explode(':', $preferences['send_time']));
    $scheduled = $now->setTime($hour, $minute);
    if ($now < $scheduled) return false;

    $last_sent = $last_sent_at ? new DateTimeImmutable($last_sent_at, $now->getTimezone()) : null;
    if ($preferences['frequency'] === 'weekly') {
        if (!in_array((int)$now->format('N'), $preferences['weekdays'], true)) return false;
        return !$last_sent || $last_sent->format('Y-m-d') !== $now->format('Y-m-d');
    }

    return !$last_sent || $last_sent->format('Y-m-d') !== $now->format('Y-m-d');
}

function task_digest_user_context(array $user): array {
    $user['roles'] = _user_roles((int)$user['id']);
    $permissions = permissions_for_user($user);
    $allowed_views = task_digest_allowed_views($permissions);
    return [
        'user'             => $user,
        'permissions'      => $permissions,
        'allowed_views'    => $allowed_views,
        'allowed_view_ids' => array_column($allowed_views, 'id'),
    ];
}

function task_digest_tasks(array $user, array $permissions): array {
    if (!task_digest_has_permission($permissions, 'task.view')) return [];
    $categories = task_accessible_categories($user['roles']);
    if (!$categories) return [];

    $category_placeholders = implode(',', array_fill(0, count($categories), '?'));
    $params = array_merge([(int)$user['id'], (int)$user['id']], $categories);
    return db_select(
        "SELECT DISTINCT t.ref_id, t.title, t.category, t.status, t.priority,
                COALESCE(t.due_at, t.due_date) AS due_value
           FROM bf_tasks t
           LEFT JOIN bf_task_assignees ta ON ta.task_ref = t.ref_id
          WHERE (ta.user_id = ? OR t.assigned_to_user_id = ?)
            AND t.status IN ('Open', 'In Progress')
            AND t.category IN ($category_placeholders)
          ORDER BY FIELD(t.priority, 'Urgent', 'High', 'Normal', 'Low'),
                   COALESCE(t.due_at, t.due_date) IS NULL,
                   COALESCE(t.due_at, t.due_date) ASC,
                   t.created_at DESC",
        $params
    );
}

function task_digest_callout_scope(array $user): array {
    $role = $user['role'] ?? '';
    if (in_array($role, ['junior_tech', 'senior_tech'], true)) {
        return ['sql' => ' AND assigned_to = ?', 'params' => [$user['username']]];
    }
    if ($role === 'client_support' && !empty($user['client_id'])) {
        return ['sql' => ' AND client_id = ?', 'params' => [(int)$user['client_id']]];
    }
    return ['sql' => '', 'params' => []];
}

function task_digest_metrics(array $user, array $permissions, array $tasks): array {
    $metrics = [
        'tasks_open' => 0,
        'tasks_in_progress' => 0,
        'tasks_urgent' => 0,
        'tasks_overdue' => 0,
    ];
    foreach ($tasks as $task) {
        if ($task['status'] === 'Open') $metrics['tasks_open']++;
        if ($task['status'] === 'In Progress') $metrics['tasks_in_progress']++;
        if ($task['priority'] === 'Urgent') $metrics['tasks_urgent']++;
        if (!empty($task['due_value']) && substr($task['due_value'], 0, 10) < date('Y-m-d')) {
            $metrics['tasks_overdue']++;
        }
    }

    if (task_digest_has_permission($permissions, 'callout.view')) {
        $scope = task_digest_callout_scope($user);
        $metrics['callouts_open'] = (int)(db_row(
            "SELECT COUNT(*) AS n FROM bf_callouts WHERE status IN ('Open', 'In Progress')" . $scope['sql'],
            $scope['params']
        )['n'] ?? 0);
        $metrics['callouts_urgent'] = (int)(db_row(
            "SELECT COUNT(*) AS n FROM bf_callouts WHERE status IN ('Open', 'In Progress') AND priority = 'Urgent'" . $scope['sql'],
            $scope['params']
        )['n'] ?? 0);
    }

    if (task_digest_has_permission($permissions, 'invoice.view') || task_digest_has_permission($permissions, 'finance.income')) {
        $invoice = db_row(
            "SELECT COUNT(*) AS n, COALESCE(SUM(amount), 0) AS amount
               FROM bf_invoices WHERE status IN ('Sent', 'Overdue')"
        ) ?: [];
        $metrics['invoices_outstanding'] = (int)($invoice['n'] ?? 0);
        $metrics['invoices_outstanding_amount'] = (float)($invoice['amount'] ?? 0);
        $metrics['invoices_overdue'] = (int)(db_row(
            "SELECT COUNT(*) AS n FROM bf_invoices WHERE status = 'Overdue'"
        )['n'] ?? 0);
    }

    if (task_digest_has_permission($permissions, 'quote.approve')) {
        $metrics['quotes_pending'] = (int)(db_row(
            "SELECT COUNT(*) AS n FROM bf_quotes WHERE approval_status = 'pending'"
        )['n'] ?? 0);
    }

    if (task_digest_has_permission($permissions, 'safety.view')) {
        $compliance = db_row(
            "SELECT
                SUM(expiry_date < CURDATE()) AS overdue,
                SUM(expiry_date >= CURDATE() AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 60 DAY)) AS due_soon
               FROM bf_safety_compliance
              WHERE expiry_date IS NOT NULL
                AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 60 DAY)"
        ) ?: [];
        $metrics['compliance_overdue'] = (int)($compliance['overdue'] ?? 0);
        $metrics['compliance_due_soon'] = (int)($compliance['due_soon'] ?? 0);
    }

    if (task_digest_has_permission($permissions, 'finance.income')) {
        $period = db_row(
            "SELECT
                COALESCE(SUM(CASE WHEN YEAR(trans_date) = YEAR(CURDATE()) AND MONTH(trans_date) = MONTH(CURDATE()) THEN credit ELSE 0 END), 0) AS current_mtd,
                COALESCE(SUM(CASE WHEN YEAR(trans_date) = YEAR(CURDATE()) - 1 AND MONTH(trans_date) = MONTH(CURDATE()) THEN credit ELSE 0 END), 0) AS prior_mtd
               FROM bf_transactions
              WHERE category = 'Invoice Payment'"
        ) ?: [];
        $metrics['revenue_mtd'] = (float)($period['current_mtd'] ?? 0);
        $metrics['revenue_prior_mtd'] = (float)($period['prior_mtd'] ?? 0);
    }

    return $metrics;
}

function task_digest_h(mixed $value): string {
    return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function task_digest_money(float $value): string {
    return 'R ' . number_format($value, 2, '.', ' ');
}

function task_digest_metric_card(string $label, string $value): string {
    return "<td style='padding:12px;border:1px solid #d7d7d7;background:#f7f7f7'>"
        . "<div style='font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#6b7280'>" . task_digest_h($label) . "</div>"
        . "<div style='margin-top:6px;font-size:24px;font-weight:700;color:#292929'>" . task_digest_h($value) . "</div></td>";
}

function task_digest_metric_table(array $cards): string {
    if (!$cards) return '';
    return "<table role='presentation' style='width:100%;border-collapse:collapse;margin:12px 0'><tr>"
        . implode('', $cards) . '</tr></table>';
}

function task_digest_task_section(array $tasks): string {
    $open = count(array_filter($tasks, fn(array $task): bool => $task['status'] === 'Open'));
    $in_progress = count($tasks) - $open;
    $html = "<h2 style='font-size:18px;color:#292929;margin:24px 0 8px'>My Active Tasks</h2>";
    $html .= task_digest_metric_table([
        task_digest_metric_card('Active', (string)count($tasks)),
        task_digest_metric_card('Open', (string)$open),
        task_digest_metric_card('In Progress', (string)$in_progress),
    ]);
    if (!$tasks) return $html . "<p style='color:#6b7280'>You have no active tasks.</p>";

    $html .= "<table style='width:100%;border-collapse:collapse;font-size:12px'>"
        . "<thead><tr style='background:#292929;color:#fff'><th style='padding:9px;text-align:left'>Ref</th><th style='padding:9px;text-align:left'>Task</th><th style='padding:9px;text-align:left'>Status</th><th style='padding:9px;text-align:left'>Due</th></tr></thead><tbody>";
    foreach (array_slice($tasks, 0, 20) as $task) {
        $due = $task['due_value'] ? date('d M Y', strtotime($task['due_value'])) : 'No date';
        $html .= "<tr><td style='padding:9px;border-bottom:1px solid #e5e7eb'>" . task_digest_h($task['ref_id']) . "</td>"
            . "<td style='padding:9px;border-bottom:1px solid #e5e7eb'>" . task_digest_h($task['title']) . "</td>"
            . "<td style='padding:9px;border-bottom:1px solid #e5e7eb'>" . task_digest_h($task['status']) . "</td>"
            . "<td style='padding:9px;border-bottom:1px solid #e5e7eb'>" . task_digest_h($due) . "</td></tr>";
    }
    $html .= '</tbody></table>';
    if (count($tasks) > 20) $html .= '<p style="color:#6b7280">Plus ' . (count($tasks) - 20) . ' more active tasks.</p>';
    return $html;
}

function task_digest_view_section(string $view_id, array $metrics, array $permissions): string {
    $cards = [];
    if ($view_id === 'w-ops') {
        $cards[] = task_digest_metric_card('My Active Tasks', (string)($metrics['tasks_open'] + $metrics['tasks_in_progress']));
        $cards[] = task_digest_metric_card('Urgent Tasks', (string)$metrics['tasks_urgent']);
        if (isset($metrics['callouts_open'])) $cards[] = task_digest_metric_card('Open Callouts', (string)$metrics['callouts_open']);
    } elseif ($view_id === 'w-fin') {
        $cards[] = task_digest_metric_card('Outstanding Invoices', (string)($metrics['invoices_outstanding'] ?? 0));
        $cards[] = task_digest_metric_card('Outstanding Value', task_digest_money((float)($metrics['invoices_outstanding_amount'] ?? 0)));
    } elseif ($view_id === 'w-alerts') {
        if (task_digest_has_permission($permissions, 'task.view')) $cards[] = task_digest_metric_card('Overdue Tasks', (string)$metrics['tasks_overdue']);
        if (isset($metrics['callouts_urgent'])) $cards[] = task_digest_metric_card('Urgent Callouts', (string)$metrics['callouts_urgent']);
        if (isset($metrics['invoices_overdue'])) $cards[] = task_digest_metric_card('Overdue Invoices', (string)$metrics['invoices_overdue']);
        if (isset($metrics['quotes_pending'])) $cards[] = task_digest_metric_card('Quote Approvals', (string)$metrics['quotes_pending']);
    } elseif ($view_id === 'w-compliance') {
        $cards[] = task_digest_metric_card('Compliance Overdue', (string)($metrics['compliance_overdue'] ?? 0));
        $cards[] = task_digest_metric_card('Due Within 60 Days', (string)($metrics['compliance_due_soon'] ?? 0));
    } elseif ($view_id === 'w-compare') {
        $cards[] = task_digest_metric_card('Revenue MTD', task_digest_money((float)($metrics['revenue_mtd'] ?? 0)));
        $cards[] = task_digest_metric_card('Prior-year MTD', task_digest_money((float)($metrics['revenue_prior_mtd'] ?? 0)));
    }
    if (!$cards) return '';
    $label = TASK_DIGEST_VIEW_REGISTRY[$view_id]['label'] ?? 'Dashboard';
    return "<h2 style='font-size:18px;color:#292929;margin:24px 0 8px'>" . task_digest_h($label) . '</h2>'
        . task_digest_metric_table($cards);
}

function task_digest_build_message(array $user, array $permissions, array $preferences, array $tasks, array $metrics, array $cfg): array {
    $frequency = $preferences['frequency'] === 'weekly' ? 'Weekly' : 'Daily';
    $subject = "{$frequency} task & dashboard digest - " . date('d M Y');
    $name = task_digest_h($user['name'] ?: $user['username']);
    $html = "<!doctype html><html><body style='margin:0;background:#efefef;font-family:Arial,sans-serif;color:#292929'>"
        . "<div style='max-width:760px;margin:0 auto;background:#fff'>"
        . "<div style='padding:22px 26px;background:#292929;border-top:5px solid #f07820;color:#fff'>"
        . "<div style='font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#f07820'>Umlilo Portal</div>"
        . "<h1 style='margin:7px 0 0;font-size:24px'>{$frequency} work digest</h1></div>"
        . "<div style='padding:24px 26px'><p style='margin-top:0'>Hello {$name},</p>"
        . "<p style='color:#6b7280'>Here is the current state of your work and the dashboard sections you subscribed to.</p>";

    if (task_digest_has_permission($permissions, 'task.view')) {
        $html .= task_digest_task_section($tasks);
    }
    foreach ($preferences['views'] as $view_id) {
        $html .= task_digest_view_section($view_id, $metrics, $permissions);
    }

    $portal_url = rtrim((string)($cfg['portal_base_url'] ?? $cfg['base_url'] ?? ''), '/');
    if ($portal_url !== '') {
        $html .= "<p style='margin:26px 0 8px'><a href='" . task_digest_h($portal_url) . "' style='display:inline-block;padding:11px 16px;background:#f07820;color:#fff;text-decoration:none;font-weight:700'>Open Umlilo Portal</a></p>";
    }
    $html .= "<p style='margin-top:24px;font-size:11px;color:#6b7280'>Change or disable this digest from Email Digest settings on your dashboard.</p>"
        . '</div></div></body></html>';
    return ['subject' => $subject, 'html' => $html];
}

function task_digest_send(array $user, array $permissions, array $preferences, array $cfg): bool {
    $tasks = task_digest_tasks($user, $permissions);
    $metrics = task_digest_metrics($user, $permissions, $tasks);
    $message = task_digest_build_message($user, $permissions, $preferences, $tasks, $metrics, $cfg);
    return send_mail($user['email'], $message['subject'], $message['html']);
}
