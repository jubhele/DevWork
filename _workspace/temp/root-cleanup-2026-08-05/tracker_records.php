<?php

require_once __DIR__ . '/task_access.php';

function tracker_record(string $entity_type, string $entity_ref): ?array {
    if ($entity_type === 'task') {
        return db_row("SELECT id, ref_id, category FROM bf_tasks WHERE ref_id = ?", [$entity_ref]);
    }
    if ($entity_type === 'callout') {
        return db_row(
            "SELECT id, ref_id, assigned_to, client_id FROM bf_callouts WHERE ref_id = ?",
            [$entity_ref]
        );
    }
    return null;
}

function tracker_can_view(array $user, string $entity_type, array $record): bool {
    if ($entity_type === 'task') {
        return can('task.view') && task_can_access_category(task_user_roles($user), $record['category']);
    }
    if ($entity_type !== 'callout' || !can('callout.view')) return false;

    $roles = task_user_roles($user);
    if (count(array_intersect($roles, ['sysadmin', 'admin', 'manager'])) > 0) return true;
    if (count(array_intersect($roles, ['junior_tech', 'senior_tech'])) > 0) {
        return ($record['assigned_to'] ?? '') === ($user['username'] ?? '');
    }
    if (count(array_intersect($roles, ['client', 'client_support'])) > 0) {
        return !empty($user['client_id']) && (int)$record['client_id'] === (int)$user['client_id'];
    }
    return true;
}

function tracker_can_edit(array $user, string $entity_type, array $record): bool {
    if ($entity_type === 'task') {
        return can('task.update') && task_can_access_category(task_user_roles($user), $record['category']);
    }
    return $entity_type === 'callout'
        && can('callout.update')
        && tracker_can_view($user, $entity_type, $record);
}

function tracker_datetime($value): ?string {
    if ($value === null || trim((string)$value) === '') return null;
    $value = trim((string)$value);
    foreach (['Y-m-d\TH:i', 'Y-m-d H:i:s', 'Y-m-d H:i'] as $format) {
        $date = DateTime::createFromFormat($format, $value);
        $errors = DateTime::getLastErrors();
        if ($date && ($errors === false || ($errors['warning_count'] === 0 && $errors['error_count'] === 0))) {
            return $date->format('Y-m-d H:i:s');
        }
    }
    return null;
}

function tracker_is_public_holiday(DateTimeImmutable $date): bool {
    static $cache = [];
    $key = $date->format('Y-m-d');
    if (array_key_exists($key, $cache)) return $cache[$key];

    $year = (int)$date->format('Y');
    $standard = [
        "$year-01-01", "$year-03-21", "$year-04-27", "$year-05-01",
        "$year-06-16", "$year-08-09", "$year-09-24", "$year-12-16",
        "$year-12-25", "$year-12-26",
    ];
    $easter_sunday = (new DateTimeImmutable("$year-03-21"))->modify('+' . easter_days($year) . ' days');
    $standard[] = $easter_sunday->modify('-2 days')->format('Y-m-d');
    $standard[] = $easter_sunday->modify('+1 day')->format('Y-m-d');
    foreach (array_slice($standard, 0, 10) as $fixed_holiday) {
        $fixed_date = new DateTimeImmutable($fixed_holiday);
        if ((int)$fixed_date->format('N') === 7) $standard[] = $fixed_date->modify('+1 day')->format('Y-m-d');
    }
    if (in_array($key, $standard, true)) return $cache[$key] = true;

    try {
        $cache[$key] = db_row(
            "SELECT holiday_date FROM bf_business_holidays WHERE holiday_date = ? LIMIT 1",
            [$key]
        ) !== null;
    } catch (Throwable $e) {
        $cache[$key] = false;
    }
    return $cache[$key];
}

function tracker_is_business_day(DateTimeImmutable $date, ?callable $holiday_check = null): bool {
    if ((int)$date->format('N') > 5) return false;
    return !($holiday_check ? $holiday_check($date) : tracker_is_public_holiday($date));
}

function tracker_add_business_days(DateTimeImmutable $date, int $days, ?callable $holiday_check = null): DateTimeImmutable {
    while ($days > 0) {
        $date = $date->modify('+1 day');
        if (tracker_is_business_day($date, $holiday_check)) $days--;
    }
    return $date;
}

function automatic_tracker_deadline(?DateTimeImmutable $created_at = null, ?callable $holiday_check = null): string {
    $created_at = $created_at ?: new DateTimeImmutable('now');
    while (!tracker_is_business_day($created_at, $holiday_check)) {
        $created_at = $created_at->modify('+1 day');
    }

    $time = $created_at->format('H:i:s');
    if ($time < '08:00:00') {
        $created_at = $created_at->setTime(8, 0, 0);
    } elseif ($time > '17:00:00') {
        $created_at = tracker_add_business_days($created_at, 1, $holiday_check);
    }

    return tracker_add_business_days($created_at, 1, $holiday_check)->format('Y-m-d H:i:s');
}
