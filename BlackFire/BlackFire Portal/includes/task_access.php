<?php

const TASK_CATEGORY_ROLES = [
    'admin'   => ['sysadmin', 'admin', 'admin_clerk', 'manager'],
    'sales'   => ['sysadmin', 'admin', 'manager'],
    'general' => ['sysadmin', 'admin', 'manager', 'admin_clerk', 'finance',
                  'safety_officer', 'call_logger', 'junior_tech', 'senior_tech', 'viewer'],
];

function task_user_roles(array $user): array {
    return !empty($user['roles']) ? $user['roles'] : [$user['role'] ?? ''];
}

function task_can_access_category(array $roles, string $category): bool {
    return count(array_intersect($roles, TASK_CATEGORY_ROLES[$category] ?? [])) > 0;
}

function task_accessible_categories(array $roles): array {
    return array_keys(array_filter(
        TASK_CATEGORY_ROLES,
        fn(array $allowed): bool => count(array_intersect($roles, $allowed)) > 0
    ));
}
