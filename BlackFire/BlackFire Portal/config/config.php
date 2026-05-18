<?php
/**
 * BlackFire Solutions Portal â€” Configuration
 * PROD ENV Â· Afrihost MySQL Â· 2026-05-14 Â· v1.1
 *
 * Credentials are read from environment variables.
 * Set these in cPanel > Environment Variables, or in a .env file loaded
 * before this script runs. See .env.example for required keys.
 */

// Load secrets file stored above public_html (not web-accessible).
// Path: ~/blackfire_secrets.php  (one level above public_html)
// This is where BF_APP_KEY lives on the server â€” never committed to git.
$secretsFile = dirname(__DIR__, 3) . '/blackfire_secrets.php';
if (file_exists($secretsFile)) {
    require_once $secretsFile;
}

// Load .env file if present (no Composer dependency â€” plain key=value parser)
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if ($line[0] === '#' || strpos($line, '=') === false) continue;
        [$key, $val] = explode('=', $line, 2);
        putenv(trim($key) . '=' . trim($val));
    }
}

/**
 * Decrypt a value encrypted by install/encrypt_config.php.
 * Requires BF_APP_KEY env var (set in cPanel Environment Variables â€” never in a file).
 * Format: base64( IV[16 bytes] || AES-256-CBC ciphertext )
 * Falls back to plaintext BF_DB_PASS for local development.
 */
if (!function_exists('bf_decrypt')) {
function bf_decrypt(string $encoded): string {
    $keyHex = getenv('BF_APP_KEY');
    if (!$keyHex) {
        // Fallback for local development: try plaintext password from env
        $plainPass = getenv('BF_DB_PASS');
        if ($plainPass) {
            error_log('BlackFire: Using plaintext BF_DB_PASS (local dev mode)');
            return $plainPass;
        }
        error_log('BlackFire: BF_APP_KEY is not set and BF_DB_PASS is missing â€” decryption failed');
        return '';
    }
    $raw  = base64_decode($encoded);
    if (!$raw || strlen($raw) < 17) {
        error_log('BlackFire: Invalid encrypted value format');
        return '';
    }
    $iv   = substr($raw, 0, 16);
    $data = substr($raw, 16);
    $decrypted = openssl_decrypt($data, 'AES-256-CBC', hex2bin($keyHex), OPENSSL_RAW_DATA, $iv);
    return $decrypted ?: '';
}
}

return [
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // DATABASE CONNECTION
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    'db_host'    => getenv('BF_DB_HOST') ?: 'localhost',
    'db_port'    => (int)(getenv('BF_DB_PORT') ?: 3306),
    'db_name'    => getenv('BF_DB_NAME') ?: 'blackfm6w9f9_portal',
    'db_user'    => getenv('BF_DB_USER') ?: 'blackfm6w9f9_izilo',
    'db_pass'    => bf_decrypt(getenv('BF_DB_PASS_ENC')),
    'db_charset' => 'utf8mb4',
    'db_options' => [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ],

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // APPLICATION SETTINGS
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    'app_name'     => 'BlackFire Solutions Portal',
    'app_version'  => '1.1',
    'app_env'      => 'production',
    'base_url'     => 'https://blackfiresolutions.co.za/portal',
    'api_base'     => 'https://blackfiresolutions.co.za/portal/api',

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // SECURITY & SESSION
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    'timezone'          => 'Africa/Johannesburg',
    'session_ttl'       => 3600,                  // 1 hour
    'session_name'      => 'BLKFR_SESSION',
    'remember_duration' => 604800,                // 7 days
    'max_login_attempts' => 5,
    'lockout_duration'  => 900,                  // 15 minutes
    'password_min_length' => 12,
    'require_https'     => true,
    'secure_cookies'    => true,

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // EMAIL (for notifications & contact form)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    'mail_from'     => 'info@blackfiresolutions.co.za',
    'mail_from_name' => 'BlackFire Solutions',
    'mail_host'     => 'mail.blackfiresolutions.co.za',
    'mail_port'     => 587,
    'mail_username' => 'info@blackfiresolutions.co.za',
    'mail_password' => '',  // Set via environment variable or cPanel
    'mail_encryption' => 'tls',
    'notification_email' => 'jubhele@astuteinsights.co.za',

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // BUSINESS CONFIG
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    'company_name'   => 'BlackFire Solutions',
    'company_phone'  => '+27 (0) 11 234 5678',
    'company_email'  => 'info@blackfiresolutions.co.za',
    'company_addr'   => 'Johannesburg, South Africa',
    'invoice_prefix' => 'INV',
    'quote_prefix'   => 'QTE',
    'callout_prefix' => 'CO',
    'default_rate'   => 450,                     // R/hour
    'default_currency' => 'ZAR',
    'tax_rate'       => 0.15,                    // 15% VAT

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // AUDIT & LOGGING
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    'log_file'      => __DIR__ . '/../logs/app.log',
    'audit_events'  => true,
    'log_api_calls' => true,

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // FEATURE FLAGS
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    'feature_invoices'    => true,
    'feature_quotes'      => true,
    'feature_callouts'    => true,
    'feature_reports'     => true,
    'feature_audit'       => true,
    'feature_users'       => true,
    'feature_integration' => false,  // Third-party integrations

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // CLIENT: AECI CHEMPARK
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    'aeci_site'     => 'Chempark, Modderfontein, Johannesburg',
    'aeci_contact'  => 'Site Manager',
    'aeci_email'    => 'admin@chempark.co.za',
    'aeci_budget'   => 150000,  // Monthly budget in R
];
?>
