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
$portalMirrorFile = dirname(__DIR__) . DIRECTORY_SEPARATOR . '.env';
$portalMirrorKeys = [
    'BF_DB_HOST', 'BF_DB_PORT', 'BF_DB_NAME', 'BF_DB_USER', 'BF_DB_PASS',
    'BF_DB_PASS_ENC', 'BF_APP_URL', 'BF_APP_KEY', 'BF_JWT_SECRET',
    'BF_SESSION_LIFETIME', 'BF_SESSION_NAME', 'BF_SMTP_HOST', 'BF_SMTP_PORT',
    'BF_SMTP_USER', 'BF_MAIL_PASS', 'BF_MAIL_PASS_ENC', 'BF_MAIL_FROM',
    'BF_MAIL_FROM_NAME', 'BF_NOTIFICATION_EMAIL', 'BF_UPLOAD_PATH',
    'BF_UPLOAD_MAX_SIZE', 'BF_COMPANY_NAME', 'BF_COMPANY_LEGAL_NAME',
    'BF_COMPANY_REG', 'BF_COMPANY_VAT', 'BF_COMPANY_PHONE', 'BF_COMPANY_EMAIL',
    'BF_COMPANY_ADDR', 'BF_COMPANY_TAGLINE', 'BF_COMPANY_LOGO',
    'BF_INVOICE_PREFIX', 'BF_QUOTE_PREFIX', 'BF_CALLOUT_PREFIX',
];

if (!file_exists($secretsFile) && is_readable($portalMirrorFile)) {
    foreach (file($portalMirrorFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = preg_replace('/^\xEF\xBB\xBF/', '', trim($line));
        if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) {
            continue;
        }

        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        if (!in_array($key, $portalMirrorKeys, true)) {
            continue;
        }

        // Existing server values win if a mirror is accidentally present outside local development.
        if (getenv($key) !== false || isset($_ENV[$key]) || isset($_SERVER[$key]) || defined($key)) {
            continue;
        }

        putenv("$key=$value");
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
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
    $keyHex = cfg_env('BF_APP_KEY');
    if (!$keyHex) {
        // Fallback for local development: try plaintext password from env
        $plainPass = cfg_env('BF_DB_PASS');
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
    'db_host'    => cfg_env('BF_DB_HOST', 'localhost'),
    'db_port'    => (int)cfg_env('BF_DB_PORT', '3306'),
    'db_name'    => cfg_env('BF_DB_NAME', 'blackfm6w9f9_portal'),
    'db_user'    => getenv('BF_DB_USER')
        ?: ($_ENV['BF_DB_USER'] ?? '')
        ?: (defined('BF_DB_USER') ? BF_DB_USER : ''), // no hardcoded fallback — see .env.example
    'db_pass'    => bf_decrypt(
        cfg_env('BF_DB_PASS_ENC')
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
    'session_name'      => cfg_env('BF_SESSION_NAME', 'BLKFR_SESSION'),
    'remember_duration' => 604800,                // 7 days
    'max_login_attempts' => 5,
    'lockout_duration'  => 900,                  // 15 minutes
    'password_min_length' => 12,
    'require_https'     => true,
    'secure_cookies'    => true,

    // �?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?
    // EMAIL (for notifications & contact form)
    // �?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?
    'mail_from'      => cfg_env('BF_MAIL_FROM', 'noreply@blackfiresolutions.co.za'),
    'mail_from_name' => cfg_env('BF_MAIL_FROM_NAME', 'BlackFire Solutions'),
    'mail_host'      => cfg_env('BF_SMTP_HOST', 'mail.blackfiresolutions.co.za'),
    'mail_port'      => (int)cfg_env('BF_SMTP_PORT', '587'),
    'mail_username'  => cfg_env('BF_SMTP_USER', 'noreply@blackfiresolutions.co.za'),
    'mail_password'  => cfg_env('BF_MAIL_PASS'),
    'mail_encryption' => 'tls',
    'notification_email' => cfg_env('BF_NOTIFICATION_EMAIL', 'jubhele@astuteinsights.co.za'),

    // �?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?
    // BUSINESS CONFIG
    // �?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?
    // Values read from: cPanel env vars → blackfire_secrets.php constants → .env → hardcoded fallback.
    // Update cPanel > Software > PHP > Environment Variables for production.
    // After Phase 1 (bf_host_companies table), the DB row takes precedence over these.
    'company_name'        => cfg_env('BF_COMPANY_NAME',       'BlackFire Solutions'),
    'company_legal_name'  => cfg_env('BF_COMPANY_LEGAL_NAME', 'Astute Insights Pty Ltd'),
    'company_reg'         => cfg_env('BF_COMPANY_REG',        '2021/964381/07'),
    'company_vat'         => cfg_env('BF_COMPANY_VAT',        '4060310358'),
    'company_phone'       => cfg_env('BF_COMPANY_PHONE',      '073 693 8446'),
    'company_email'       => cfg_env('BF_COMPANY_EMAIL',      'accounts@astuteinsights.co.za'),
    'company_addr'        => cfg_env('BF_COMPANY_ADDR',       '102 Aloeridge 2, Stoneridge Street, Greenstone, 1616'),
    'company_tagline'     => cfg_env('BF_COMPANY_TAGLINE',    'Fire, taught to behave.'),
    'company_logo'        => cfg_env('BF_COMPANY_LOGO',       './blackfire_logo_transparent.png'),
    'invoice_prefix'      => cfg_env('BF_INVOICE_PREFIX',     'INV'),
    'quote_prefix'        => cfg_env('BF_QUOTE_PREFIX',       'QTE'),
    'callout_prefix'      => cfg_env('BF_CALLOUT_PREFIX',     'CO'),
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
