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

function record_invoice_cost_of_sales(array $invoice): void {
    $amount = (float)($invoice['amount'] ?? 0);
    if ($amount <= 0) return;

    $invoiceRef = clean($invoice['ref_id'] ?? '', 30);
    $calloutRef = clean($invoice['callout_ref'] ?? '', 30);
    $basisRef   = $calloutRef ?: $invoiceRef;
    if (!$basisRef) return;

    $costRef = clean('COST-' . $basisRef, 30);
    $invoiceDate = valid_date($invoice['invoice_date'] ?? null)
        ? $invoice['invoice_date']
        : date('Y-m-d');
    $clientName = clean($invoice['client_name'] ?? 'Client', 255);
    $cost = round($amount / 1.30, 2);

    $generated = db_row(
        "SELECT id FROM bf_transactions
          WHERE category = 'Cost of Sales' AND reference = ?
          LIMIT 1",
        [$costRef]
    );
    if ($generated) {
        db_exec(
            "UPDATE bf_transactions SET trans_date = ?, description = ?, debit = ? WHERE id = ?",
            [$invoiceDate, "Cost of services - {$clientName} ({$basisRef})", $cost, (int)$generated['id']]
        );
        return;
    }

    $existing = db_row(
        "SELECT id FROM bf_transactions
          WHERE category = 'Cost of Sales' AND reference IN (?, ?)
          LIMIT 1",
        [$basisRef, $invoiceRef]
    );
    if ($existing) return;

    db_exec(
        "INSERT INTO bf_transactions
         (trans_date, description, category, reference, credit, debit)
         VALUES (?,?,?,?,?,?)",
        [$invoiceDate, "Cost of services - {$clientName} ({$basisRef})", 'Cost of Sales', $costRef, 0, $cost]
    );
}

/**
 * Set CORS + JSON headers (call before output)
 */
function api_headers(): void {
    header('Content-Type: application/json');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('X-Permitted-Cross-Domain-Policies: none');
    header("Content-Security-Policy: default-src 'none'");

    // CORS preflight — Apache's rewrite-based 204 is unreliable on shared hosting
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

/**
 * Escape user input for use inside a SQL LIKE pattern.
 * Prevents % and _ from acting as wildcards.
 */
function like_escape(string $val): string {
    return str_replace(['\\', '%', '_'], ['\\\\', '\%', '\_'], $val);
}

/**
 * Validate password complexity.
 * Requires: min 12 chars, uppercase, lowercase, digit, special char.
 */
function password_valid(string $pass): bool {
    return strlen($pass) >= 12
        && preg_match('/[A-Z]/', $pass)
        && preg_match('/[a-z]/', $pass)
        && preg_match('/[0-9]/', $pass)
        && preg_match('/[\W_]/', $pass);
}

const PASSWORD_COMPLEXITY_MSG = 'Password must be at least 12 characters and contain uppercase, lowercase, a number, and a special character';

/**
 * Get pagination params from GET
 */
function get_pagination(): array {
    $page  = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(500, max(10, (int)($_GET['limit'] ?? 100)));
    return ['page' => $page, 'limit' => $limit, 'offset' => ($page - 1) * $limit];
}
