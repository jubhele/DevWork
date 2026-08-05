<?php
/**
 * Umlilo Portal — Company/Client row-scope policy core.
 * Plan: docs/row-level-security-company-client-isolation-plan.md §9
 *
 * No endpoint may hand-build its own role-specific client filter once this
 * layer is available (plan §9.2).
 */

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';

/**
 * Build the immutable ScopeContext for the current request.
 * Loaded fresh per request — never trust the PHP session's login-time copy
 * of role/membership/assignment data (plan §9.1).
 *
 * @return array{
 *   user_id:int, roles:string[], permissions:string[],
 *   company_memberships:array, engagement_assignments:array,
 *   companies_with_all_client_access:int[],
 *   selected_company_id:int|null,
 *   is_explicit_cross_company_admin_context:bool,
 *   access_version:int, request_id:string
 * }
 */
function scope_context(): array {
    static $cached = null;
    if ($cached !== null) {
        return $cached;
    }

    $user = require_auth();
    $roles = !empty($user['roles']) ? $user['roles'] : [$user['role'] ?? ''];
    $is_sysadmin = in_array('sysadmin', $roles, true);

    $memberships = db_select(
        "SELECT m.company_profile_id, m.client_access_mode, m.is_primary
         FROM bf_user_company_memberships m
         JOIN bf_company_profiles cp ON cp.id = m.company_profile_id AND cp.is_active = 1
         WHERE m.user_id = ? AND (m.valid_to IS NULL OR m.valid_to > NOW())",
        [$user['id']]
    );

    $assignments = db_select(
        "SELECT a.company_client_id, cc.company_profile_id, cc.client_id
         FROM bf_user_client_assignments a
         JOIN bf_company_clients cc ON cc.id = a.company_client_id
         WHERE a.user_id = ? AND (a.valid_to IS NULL OR a.valid_to > NOW())",
        [$user['id']]
    );

    $available_company_ids = array_values(array_unique(array_map(
        fn($m) => (int)$m['company_profile_id'],
        $memberships
    )));
    $override_company_ids = [];
    $override_id = $_SESSION['bf_cross_company_override_id'] ?? null;
    $is_explicit_override = false;
    if ($is_sysadmin && $override_id) {
        $override = db_row(
            "SELECT company_profile_ids
             FROM bf_cross_company_override_contexts
             WHERE id = ? AND actor_user_id = ? AND ended_at IS NULL
               AND (expires_at IS NULL OR expires_at > NOW())",
            [(int)$override_id, (int)$user['id']]
        );
        if ($override) {
            $override_company_ids = array_values(array_unique(array_filter(
                array_map('intval', explode(',', $override['company_profile_ids']))
            )));
            $available_company_ids = $override_company_ids;
            $is_explicit_override = true;
        }
    }

    $requested_company_id = null;
    foreach ([
        $_SERVER['HTTP_X_BF_COMPANY_CONTEXT'] ?? null,
        $_COOKIE['bf_active_company_id'] ?? null,
        $_SESSION['bf_active_company_id'] ?? null,
    ] as $candidate) {
        if ($candidate !== null && filter_var($candidate, FILTER_VALIDATE_INT) !== false) {
            $requested_company_id = (int)$candidate;
            break;
        }
    }

    $primary_company_id = null;
    foreach ($memberships as $membership) {
        if ((int)($membership['is_primary'] ?? 0) === 1) {
            $primary_company_id = (int)$membership['company_profile_id'];
            break;
        }
    }
    if ($primary_company_id === null || !in_array($primary_company_id, $available_company_ids, true)) {
        $primary_company_id = $available_company_ids[0] ?? null;
    }
    $selected_company_id = $requested_company_id !== null
        && in_array($requested_company_id, $available_company_ids, true)
        ? $requested_company_id
        : $primary_company_id;

    $all_client_company_ids = array_values(array_map(
        fn($m) => (int)$m['company_profile_id'],
        array_filter(
            $memberships,
            fn($m) => $m['client_access_mode'] === 'all_company_clients'
                && (int)$m['company_profile_id'] === $selected_company_id
        )
    ));

    $cached = [
        'user_id' => (int)$user['id'],
        'roles' => $roles,
        'permissions' => permissions_for_user($user),
        'company_memberships' => $memberships,
        'engagement_assignments' => $assignments,
        'companies_with_all_client_access' => $all_client_company_ids,
        'available_company_ids' => $available_company_ids,
        'selected_company_id' => $selected_company_id,
        'is_explicit_cross_company_admin_context' => $is_explicit_override,
        'access_version' => (int)($user['access_version'] ?? 1),
        'request_id' => bin2hex(random_bytes(8)),
    ];
    return $cached;
}

/** Require a named action permission; exits 403 via require_perm() semantics. */
function require_action(string $permission): array {
    return require_perm($permission);
}

/** Company IDs available for selection; availability does not itself grant row access. */
function available_company_ids(array $ctx): array {
    return array_values(array_unique(array_map('intval', $ctx['available_company_ids'] ?? [])));
}

/** Company IDs the current request may read/write after applying active context. */
function allowed_company_ids(array $ctx): array {
    $selected = $ctx['selected_company_id'] ?? null;
    return $selected !== null && in_array((int)$selected, available_company_ids($ctx), true)
        ? [(int)$selected]
        : [];
}

/** Engagement (company_client) IDs the current scope may read/write. */
function allowed_engagement_ids(array $ctx): array {
    $active_company_ids = allowed_company_ids($ctx);
    if (!$active_company_ids) {
        return [];
    }
    $active_company_id = $active_company_ids[0];
    $ids = array_map(
        fn($a) => (int)$a['company_client_id'],
        array_filter(
            $ctx['engagement_assignments'],
            fn($a) => (int)$a['company_profile_id'] === $active_company_id
        )
    );

    if (!empty($ctx['companies_with_all_client_access'])) {
        $placeholders = implode(',', array_fill(0, count($ctx['companies_with_all_client_access']), '?'));
        $rows = db_select(
            "SELECT id FROM bf_company_clients
             WHERE company_profile_id IN ({$placeholders}) AND relationship_status != 'ended'",
            $ctx['companies_with_all_client_access']
        );
        foreach ($rows as $row) {
            $ids[] = (int)$row['id'];
        }
    }

    return array_values(array_unique($ids));
}

function require_company_access(int $companyId, string $permission): void {
    require_action($permission);
    $ctx = scope_context();
    if (!in_array($companyId, allowed_company_ids($ctx), true)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Not found', 'code' => 'RESOURCE_NOT_FOUND']);
        exit;
    }
}

function require_engagement_access(int $engagementId, string $permission): void {
    require_action($permission);
    $ctx = scope_context();
    if (!in_array($engagementId, allowed_engagement_ids($ctx), true)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Not found', 'code' => 'RESOURCE_NOT_FOUND']);
        exit;
    }
}

/**
 * Fetch a record and verify it is within scope. Returns the row or exits 404.
 * Covers the plan §14 priority resource types only (callout, quote, invoice, client);
 * NOT wired into any live endpoint yet — Phase 4 is observe mode (plan §20 Phase 4).
 */
function require_record_access(string $resourceType, $recordId, string $permission): array {
    require_action($permission);
    $ctx = scope_context();

    $tableMap = [
        'callout' => 'bf_callouts',
        'quote'   => 'bf_quotes',
        'invoice' => 'bf_invoices',
    ];

    if ($resourceType === 'client') {
        $row = db_select("SELECT * FROM bf_clients WHERE id = ?", [(int)$recordId]);
        $row = $row[0] ?? null;
        if (!$row) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Not found', 'code' => 'RESOURCE_NOT_FOUND']);
            exit;
        }
        $engagementIds = allowed_engagement_ids($ctx);
        $reachable = $engagementIds
            ? db_select(
                "SELECT 1 FROM bf_company_clients WHERE client_id = ? AND id IN ("
                . implode(',', array_fill(0, count($engagementIds), '?')) . ')',
                array_merge([(int)$recordId], $engagementIds)
            )
            : [];
        if (!$reachable) {
            audit_access_denial($ctx, $resourceType, $recordId, $permission);
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Not found', 'code' => 'RESOURCE_NOT_FOUND']);
            exit;
        }
        return $row;
    }

    if (!isset($tableMap[$resourceType])) {
        throw new \RuntimeException("require_record_access: unsupported resource type: $resourceType");
    }

    $table = $tableMap[$resourceType];
    $row = db_select("SELECT * FROM {$table} WHERE id = ?", [(int)$recordId]);
    $row = $row[0] ?? null;
    if (!$row) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Not found', 'code' => 'RESOURCE_NOT_FOUND']);
        exit;
    }

    $engagementId = $row['company_client_id'] ?? null;
    $allowed = allowed_engagement_ids($ctx);
    // A record with no engagement scope yet (pre-backfill) is not visible under the
    // target policy — deny by default per plan §2 rule 10, even though enforcement is off.
    if ($engagementId === null || !in_array((int)$engagementId, $allowed, true)) {
        audit_access_denial($ctx, $resourceType, $recordId, $permission);
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Not found', 'code' => 'RESOURCE_NOT_FOUND']);
        exit;
    }

    return $row;
}

/**
 * Append the mandatory scope predicate to a query fragment.
 * Caller supplies the table alias; this appends "<alias>.company_client_id IN (...)"
 * bound via $params by reference (plan §9.3 — every list/detail/count/export uses this).
 */
function apply_scope_filter(string $resourceType, string $tableAlias, array &$params): string {
    $ctx = scope_context();
    $engagementIds = allowed_engagement_ids($ctx);
    if (!$engagementIds) {
        // No assignments — return a predicate that matches nothing (plan §2 rule 10).
        return '1 = 0';
    }
    $placeholders = implode(',', array_fill(0, count($engagementIds), '?'));
    foreach ($engagementIds as $id) {
        $params[] = $id;
    }
    return "{$tableAlias}.company_client_id IN ({$placeholders})";
}

/**
 * Resolve the engagement (company_client_id) for an attachment's parent entity, by
 * entity_type + entity_ref, for use by files.php (plan §9.3 — attachments inherit the
 * parent record's immutable scope, they have no engagement column of their own).
 * Returns null if the parent record doesn't exist, or if the entity_type has no
 * engagement concept (task/callout use tracker_can_view() instead, not this function).
 */
function attachment_parent_engagement_id(string $entityType, string $entityRef): ?int {
    switch ($entityType) {
        case 'quote':
            $row = db_row("SELECT company_client_id FROM bf_quotes WHERE ref_id = ?", [$entityRef]);
            return $row ? ($row['company_client_id'] !== null ? (int)$row['company_client_id'] : null) : null;
        case 'invoice':
            $row = db_row("SELECT company_client_id FROM bf_invoices WHERE ref_id = ?", [$entityRef]);
            return $row ? ($row['company_client_id'] !== null ? (int)$row['company_client_id'] : null) : null;
        case 'payment':
            $row = db_row(
                "SELECT i.company_client_id FROM bf_payments p
                 JOIN bf_invoices i ON i.ref_id = p.invoice_ref
                 WHERE p.payment_ref = ?",
                [$entityRef]
            );
            return $row ? ($row['company_client_id'] !== null ? (int)$row['company_client_id'] : null) : null;
        case 'safety_file':
            $row = db_row("SELECT company_client_id FROM bf_safety_files WHERE ref_id = ?", [$entityRef]);
            return $row ? ($row['company_client_id'] !== null ? (int)$row['company_client_id'] : null) : null;
        case 'safety_compliance':
            $row = db_row(
                "SELECT f.company_client_id FROM bf_safety_compliance c
                 JOIN bf_safety_files f ON f.ref_id = c.file_ref
                 WHERE c.id = ?",
                [(int)$entityRef]
            );
            return $row ? ($row['company_client_id'] !== null ? (int)$row['company_client_id'] : null) : null;
        case 'safety_item':
            // entity_ref format: {file_ref}:{section}:{item_no}
            $fileRef = explode(':', $entityRef, 3)[0] ?? '';
            $row = db_row("SELECT company_client_id FROM bf_safety_files WHERE ref_id = ?", [$fileRef]);
            return $row ? ($row['company_client_id'] !== null ? (int)$row['company_client_id'] : null) : null;
        default:
            return null; // task/callout handled separately via tracker_can_view()
    }
}

/**
 * True if the current scope may access the attachment's parent entity. entity_type
 * values without an engagement concept (task/callout) always return true here — the
 * caller (files.php) must have already checked tracker_can_view() for those.
 */
function attachment_parent_in_scope(string $entityType, string $entityRef): bool {
    if (in_array($entityType, ['task', 'callout'], true)) {
        return true;
    }
    $ctx = scope_context();
    if (in_array('sysadmin', $ctx['roles'], true) && $ctx['is_explicit_cross_company_admin_context']) {
        return true;
    }
    $engagementId = attachment_parent_engagement_id($entityType, $entityRef);
    $inScope = $engagementId !== null && in_array($engagementId, allowed_engagement_ids($ctx), true);
    if (!$inScope) {
        audit_access_denial($ctx, $entityType, $entityRef, "attachment.{$entityType}");
    }
    return $inScope;
}

/**
 * Log a denial for audit (plan §17). Columns match the real bf_audit_log schema
 * (username/action/detail/ip_address, plus the Phase 2 migration's additive
 * company_profile_id/company_client_id/decision/reason_code/request_id) — the
 * skeleton draft assumed actor_user_id/resource_type/resource_id, which never
 * existed and threw on every call; caught here defensively too, same as the
 * existing audit() helper, so a logging failure never blocks the 404 response.
 */
function audit_access_denial(array $ctx, string $resourceType, $recordId, string $permission): void {
    try {
        $username = db_row("SELECT username FROM bf_users WHERE id = ?", [$ctx['user_id']])['username'] ?? (string)$ctx['user_id'];
        db_exec(
            "INSERT INTO bf_audit_log (username, action, detail, ip_address, decision, reason_code, request_id, created_at)
             VALUES (?, ?, ?, ?, 'denied', 'SCOPE_DENIED', ?, NOW())",
            [$username, $permission, "resource_type={$resourceType} resource_id=" . (string)$recordId, $_SERVER['REMOTE_ADDR'] ?? '', $ctx['request_id']]
        );
    } catch (\Throwable $e) {
        // Don't fail the request because audit logging failed (matches audit() in auth.php).
    }
}
