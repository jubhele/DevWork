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
