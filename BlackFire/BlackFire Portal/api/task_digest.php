<?php
ob_start();

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/task_access.php';
require_once __DIR__ . '/../includes/mailer.php';
require_once __DIR__ . '/../includes/task_digest.php';

$cfg = require __DIR__ . '/../config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');
api_headers();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = clean($_GET['action'] ?? '', 30);

if ($method === 'POST' && $action === 'cron') {
    $provided = clean($_SERVER['HTTP_X_CRON_SECRET'] ?? ($_GET['secret'] ?? ''), 200);
    $expected = cfg_env('BF_CRON_SECRET');
    if ($expected === '' || !hash_equals($expected, $provided)) json_err('Forbidden', 403);

    $lock = db_row("SELECT GET_LOCK('bf_task_digest_cron', 0) AS acquired");
    if ((int)($lock['acquired'] ?? 0) !== 1) json_ok(['sent' => 0, 'failed' => 0], 'Digest run already in progress');

    $sent = 0;
    $failed = 0;
    try {
        $users = db_select(
            "SELECT id, username, name, role, client_id, email,
                    email_digest_preferences, email_digest_last_sent_at
               FROM bf_users
              WHERE active = 1
                AND email IS NOT NULL AND email != ''
                AND email_digest_preferences IS NOT NULL"
        );
        $now = new DateTimeImmutable('now', new DateTimeZone($cfg['timezone'] ?? 'Africa/Johannesburg'));
        foreach ($users as $user) {
            $context = task_digest_user_context($user);
            $preferences = task_digest_normalize_preferences(
                $user['email_digest_preferences'],
                $context['allowed_view_ids']
            );
            if (!task_digest_is_due($preferences, $user['email_digest_last_sent_at'], $now)) continue;

            try {
                $ok = task_digest_send($context['user'], $context['permissions'], $preferences, $cfg);
                if (!$ok) throw new RuntimeException('SMTP delivery returned false');
                db_exec(
                    "UPDATE bf_users
                        SET email_digest_last_sent_at = NOW(), email_digest_last_error = NULL
                      WHERE id = ?",
                    [(int)$user['id']]
                );
                audit($user['username'], 'TASK_DIGEST_SENT', 'Scheduled task and dashboard digest delivered');
                $sent++;
            } catch (Throwable $error) {
                db_exec(
                    "UPDATE bf_users SET email_digest_last_error = ? WHERE id = ?",
                    [substr($error->getMessage(), 0, 500), (int)$user['id']]
                );
                audit($user['username'], 'TASK_DIGEST_FAILED', 'Scheduled digest delivery failed');
                $failed++;
            }
        }
    } finally {
        db_row("SELECT RELEASE_LOCK('bf_task_digest_cron') AS released");
    }
    json_ok(['sent' => $sent, 'failed' => $failed], 'Digest run complete');
}

$user = require_auth();
$row = db_row(
    "SELECT id, username, name, role, client_id, email,
            email_digest_preferences, email_digest_last_sent_at, email_digest_last_error
       FROM bf_users WHERE id = ? AND active = 1",
    [(int)$user['id']]
);
if (!$row) json_err('User not found', 404);
$context = task_digest_user_context($row);

if ($method === 'GET') {
    $preferences = task_digest_normalize_preferences(
        $row['email_digest_preferences'],
        $context['allowed_view_ids']
    );
    json_ok([
        'preferences'   => $preferences,
        'allowed_views' => $context['allowed_views'],
        'email'         => $row['email'],
        'last_sent_at'  => $row['email_digest_last_sent_at'],
        'last_error'    => !empty($row['email_digest_last_error']),
    ]);
}

if ($method === 'PUT') {
    if (empty($row['email'])) json_err('Add an email address to your portal profile before enabling digests');
    $body = get_body();
    $submitted_weekdays = is_array($body['weekdays'] ?? null)
        ? array_filter(array_map('intval', $body['weekdays']), fn(int $weekday): bool => $weekday >= 1 && $weekday <= 7)
        : [];
    $submitted_legacy_weekday = filter_var($body['weekday'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 7]]);
    if (($body['frequency'] ?? '') === 'weekly' && filter_var($body['enabled'] ?? false, FILTER_VALIDATE_BOOL) && !$submitted_weekdays && $submitted_legacy_weekday === false) {
        json_err('Select at least one delivery day for the weekly digest');
    }
    $preferences = task_digest_normalize_preferences($body, $context['allowed_view_ids']);
    if ($preferences['enabled'] && !$preferences['views'] && !task_digest_has_permission($context['permissions'], 'task.view')) {
        json_err('Select at least one dashboard section before enabling the digest');
    }
    db_exec(
        "UPDATE bf_users SET email_digest_preferences = ?, email_digest_last_error = NULL WHERE id = ?",
        [json_encode($preferences), (int)$row['id']]
    );
    audit($row['username'], 'TASK_DIGEST_PREFS', $preferences['enabled'] ? 'Email digest subscription updated' : 'Email digest disabled');
    json_ok(['preferences' => $preferences], 'Email digest settings saved');
}

json_err('Method not allowed', 405);
