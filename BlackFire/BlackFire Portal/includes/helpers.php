<?php
/**
 * Umlilo Portal — Response Helpers
 */

/**
 * Send a JSON response and exit
 */
function json_ok(array $data = [], string $message = 'OK'): void {
    header('Content-Type: application/json');
    echo json_encode(array_merge(['success' => true, 'message' => $message], $data));
    exit;
}

function json_err(string $error, int $code = 400): void {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => $error]);
    exit;
}

/**
 * Get JSON POST body as array
 */
function get_body(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/**
 * Require specific fields in an array; return field value or call json_err
 */
function require_fields(array $data, array $fields): void {
    foreach ($fields as $f) {
        if (!isset($data[$f]) || (is_string($data[$f]) && trim($data[$f]) === '')) {
            json_err("Missing required field: $f");
        }
    }
}

/**
 * Sanitize a string for storage
 */
function clean(mixed $v, int $maxLen = 255): string {
    return substr(trim((string)($v ?? '')), 0, $maxLen);
}

/**
 * Validate a date string (YYYY-MM-DD)
 */
function valid_date(?string $d): bool {
    if (!$d) return false;
    $dt = DateTime::createFromFormat('Y-m-d', $d);
    return $dt && $dt->format('Y-m-d') === $d;
}

/**
 * Set CORS + JSON headers (call before output)
 */
function api_headers(): void {
    header('Content-Type: application/json');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
}

/**
 * Get pagination params from GET
 */
function get_pagination(): array {
    $page  = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(500, max(10, (int)($_GET['limit'] ?? 100)));
    return ['page' => $page, 'limit' => $limit, 'offset' => ($page - 1) * $limit];
}
