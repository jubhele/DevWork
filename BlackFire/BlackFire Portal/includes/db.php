<?php
ob_start();
/**
 * Umlilo Portal — Database Connection
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
 * Generate next reference ID in format [TYPE]-[ddmmyy]-[counter]
 * e.g. CO-190526-0042, Q-190526-0002, INV-190526-0042
 * Uses atomic counter in DB. Date defaults to today; pass a date string to override.
 */
function next_ref_id(string $type, ?string $date = null): string {
    $stmt = get_db()->prepare("UPDATE bf_counters SET current_value = current_value + 1 WHERE counter_type = ?");
    $stmt->execute([$type]);
    $row    = db_row("SELECT current_value FROM bf_counters WHERE counter_type = ?", [$type]);
    $n      = $row['current_value'] ?? 1;
    $prefix = ['co' => 'CO', 'q' => 'Q', 'inv' => 'INV', 'stmt' => 'STMT'][$type] ?? strtoupper($type);
    $dmy    = (new DateTime($date ?? 'now'))->format('dmy');
    return $prefix . '-' . $dmy . '-' . str_pad($n, 4, '0', STR_PAD_LEFT);
}

function db_begin(): void    { get_db()->beginTransaction(); }
function db_commit(): void   { get_db()->commit(); }
function db_rollback(): void { if (get_db()->inTransaction()) get_db()->rollBack(); }
