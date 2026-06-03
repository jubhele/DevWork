<?php
/**
 * Umlilo Portal — Configuration
 * PROD ENV · Afrihost MySQL · 2026-05-14 · v1.1
 *
 * Credentials are read from environment variables.
 * Set these in cPanel > Environment Variables, or in a .env file loaded
 * before this script runs. See .env.example for required keys.
 */

// ── Server secrets (production) ───────────────────────────────────
// ~/blackfire_secrets.php  — one level above public_html, never web-accessible,
// never committed to git. Owns ALL secrets: DB, encryption key, SMTP password.
// See blackfire_secrets.php.example in the portal root for the required template.
$secretsFile = dirname(__DIR__, 2) . '/blackfire_secrets.php';
if (file_exists($secretsFile)) {
    require_once $secretsFile;
}

// ── Local dev fallback (.env) ──────────────────────────────────────
// Only used when blackfire_secrets.php is absent (local development).
// Never deploy .env to the server — use blackfire_secrets.php instead.
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if ($line[0] === '#' || strpos($line, '=') === false) continue;
        [$key, $val] = explode('=', $line, 2);
        $key = trim($key); $val = trim($val);
        putenv("$key=$val");
        $_ENV[$key]    = $val;
        $_SERVER[$key] = $val;
    }
}

/**
 * Decrypt a value encrypted by install/encrypt_config.php.
 * Requires BF_APP_KEY env var (set in cPanel Environment Variables — never in a file).
 * Format: base64( IV[16 bytes] || AES-256-CBC ciphertext )
 * Falls back to plaintext BF_DB_PASS for local development.
 */
/**
 * Read a config value from env vars, $_ENV, $_SERVER, or a defined() constant.
 * Mirrors the same multi-source lookup used by bf_decrypt() — needed because
 * putenv() is disabled on some shared hosts (e.g. Afrihost cPanel).
 * blackfire_secrets.php can set values via define(); cPanel sets them as env vars.
 */
if (!function_exists('cfg_env')) {
function cfg_env(string $key, string $default = ''): string {
    return getenv($key)
        ?: ($_ENV[$key]    ?? null)
        ?: ($_SERVER[$key] ?? null)
        ?: (defined($key)  ? constant($key) : null)
        ?: $default;
}
}

if (!function_exists('bf_decrypt')) {
function bf_decrypt(string $encoded): string {
    // Check all possible sources — putenv() is disabled on some shared hosts
    $keyHex = getenv('BF_APP_KEY')
           ?: ($_ENV['BF_APP_KEY'] ?? '')
           ?: ($_SERVER['BF_APP_KEY'] ?? '')
           ?: (defined('BF_APP_KEY') ? BF_APP_KEY : '');
    if (!$keyHex) {
        // Fallback for local development: try plaintext password from env
        $plainPass = getenv('BF_DB_PASS') ?: ($_ENV['BF_DB_PASS'] ?? '');
        if ($plainPass) {
            error_log('[Portal] Using plaintext BF_DB_PASS (local dev mode)');
            return $plainPass;
        }
        error_log('[Portal] BF_APP_KEY is not set and BF_DB_PASS is missing — decryption failed');
        return '';
    }
    $raw  = base64_decode($encoded);
    if (!$raw || strlen($raw) < 17) {
        error_log('[Portal] Invalid encrypted value format');
        return '';
    }
    $iv   = substr($raw, 0, 16);
    $data = substr($raw, 16);
    $decrypted = openssl_decrypt($data, 'AES-256-CBC', hex2bin($keyHex), OPENSSL_RAW_DATA, $iv);
    return $decrypted ?: '';
}
}

return [
    // �?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?
    // DATABASE CONNECTION
    // �?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?
    'db_host'    => getenv('BF_DB_HOST') ?: 'localhost',
    'db_port'    => (int)(getenv('BF_DB_PORT') ?: 3306),
    'db_name'    => getenv('BF_DB_NAME') ?: 'blackfm6w9f9_portal',
    'db_user'    => getenv('BF_DB_USER') ?: 'blackfm6w9f9_umlilo_admin', // fallback for local dev only
    'db_pass'    => bf_decrypt(
        getenv('BF_DB_PASS_ENC')
        ?: ($_ENV['BF_DB_PASS_ENC'] ?? '')
        ?: (defined('BF_DB_PASS_ENC') ? BF_DB_PASS_ENC : '')
    ),
    'db_charset' => 'utf8mb4',
    'db_options' => [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ],

    // �?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?
    // APPLICATION SETTINGS
    // �?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?
    'app_name'     => 'Umlilo Portal',
    'app_version'  => '1.1',
    'app_env'      => 'production',
    'base_url'        => 'https://blackfiresolutions.co.za',
    'api_base'        => 'https://blackfiresolutions.co.za/api',
    'portal_base_url' => 'https://blackfiresolutions.co.za',

    // �?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?
    // SECURITY & SESSION
    // �?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?
    'timezone'          => 'Africa/Johannesburg',
    'session_ttl'       => 3600,                  // 1 hour
    'session_name'      => cfg_env('SESSION_NAME', 'BLKFR_SESSION'),
    'remember_duration' => 604800,                // 7 days
    'max_login_attempts' => 5,
    'lockout_duration'  => 900,                  // 15 minutes
    'password_min_length' => 12,
    'require_https'     => true,
    'secure_cookies'    => true,

    // �?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?
    // EMAIL (for notifications & contact form)
    // �?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?
    'mail_from'      => 'noreply@blackfiresolutions.co.za',
    'mail_from_name' => cfg_env('COMPANY_NAME', 'BlackFire Solutions'),
    'mail_host'      => 'mail.blackfiresolutions.co.za',
    'mail_port'      => 587,
    'mail_username'  => 'noreply@blackfiresolutions.co.za',
    'mail_password'  => getenv('BF_MAIL_PASS') ?: '',
    'mail_encryption' => 'tls',
    'notification_email' => 'jubhele@astuteinsights.co.za',

    // �?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?
    // BUSINESS CONFIG
    // �?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?
    // Values read from: cPanel env vars → blackfire_secrets.php constants → .env → hardcoded fallback.
    // Update cPanel > Software > PHP > Environment Variables for production.
    // After Phase 1 (bf_host_companies table), the DB row takes precedence over these.
    'company_name'        => cfg_env('COMPANY_NAME',       'BlackFire Solutions'),
    'company_legal_name'  => cfg_env('COMPANY_LEGAL_NAME', 'Astute Insights Pty Ltd'),
    'company_reg'         => cfg_env('COMPANY_REG',        '2021/964381/07'),
    'company_vat'         => cfg_env('COMPANY_VAT',        '4060310358'),
    'company_phone'       => cfg_env('COMPANY_PHONE',      '073 693 8446'),
    'company_email'       => cfg_env('COMPANY_EMAIL',      'accounts@astuteinsights.co.za'),
    'company_addr'        => cfg_env('COMPANY_ADDR',       '102 Aloeridge 2, Stoneridge Street, Greenstone, 1616'),
    'company_tagline'     => cfg_env('COMPANY_TAGLINE',    'Fire, taught to behave.'),
    'company_logo'        => cfg_env('COMPANY_LOGO',       './blackfire_logo_transparent.png'),
    'invoice_prefix'      => cfg_env('INVOICE_PREFIX',     'INV'),
    'quote_prefix'        => cfg_env('QUOTE_PREFIX',       'QTE'),
    'callout_prefix'      => cfg_env('CALLOUT_PREFIX',     'CO'),
    'default_rate'        => 450,
    'default_currency'    => 'ZAR',
    'tax_rate'            => 0.15,

    // �?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?
    // AUDIT & LOGGING
    // �?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?
    'log_file'      => __DIR__ . '/../logs/app.log',
    'audit_events'  => true,
    'log_api_calls' => true,

    // �?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?
    // FEATURE FLAGS
    // �?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?
    'feature_invoices'    => true,
    'feature_quotes'      => true,
    'feature_callouts'    => true,
    'feature_reports'     => true,
    'feature_audit'       => true,
    'feature_users'       => true,
    'feature_integration' => false,  // Third-party integrations
];
?>
