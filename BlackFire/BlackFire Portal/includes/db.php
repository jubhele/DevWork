<?php
ob_start();
/**
 * BlackFire Solutions Portal — Database Connection
 * PDO singleton with UTF-8 MB4
 */

function get_db(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $cfg = require __DIR__ . '/../config/config.php';

    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=%s;port=%d',
        $cfg['db_host'],
        $cfg['db_name'],
        $cfg['db_charset'],
        $cfg['db_port']
    );

    try {
        $pdo = new PDO($dsn, $cfg['db_user'], $cfg['db_pass'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    } catch (PDOException $e) {
        // Don't expose connection details in output
        http_response_code(503);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'error' => 'Database connection failed']);
        exit;
    }

    return $pdo;
}

/**
 * Execute a query and return all rows
 */
function db_select(string $sql, array $params = []): array {
    $stmt = get_db()->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

/**
 * Execute a query and return first row or null
 */
function db_row(string $sql, array $params = []): ?array {
    $stmt = get_db()->prepare($sql);
    $stmt->execute($params);
    $row = $stmt->fetch();
    return $row ?: null;
}

/**
 * Execute INSERT/UPDATE/DELETE, return affected rows
 */
function db_exec(string $sql, array $params = []): int {
    $stmt = get_db()->prepare($sql);
    $stmt->execute($params);
    return $stmt->rowCount();
}

/**
 * Execute INSERT, return last insert ID
 */
function db_insert(string $sql, array $params = []): int {
    $stmt = get_db()->prepare($sql);
    $stmt->execute($params);
    return (int) get_db()->lastInsertId();
}

/**
 * Generate next reference ID (JOB-001, QTE-001, INV-001)
 * Uses atomic counter in DB
 */
function next_ref_id(string $type): string {
    $db = get_db();
    $db->exec("UPDATE bf_counters SET current_value = current_value + 1 WHERE counter_type = '$type'");
    $row = db_row("SELECT current_value FROM bf_counters WHERE counter_type = ?", [$type]);
    $n   = $row['current_value'] ?? 1;
    $prefix = ['co' => 'JOB', 'q' => 'QTE', 'inv' => 'INV'][$type] ?? strtoupper($type);
    return $prefix . '-' . str_pad($n, 3, '0', STR_PAD_LEFT);
}
