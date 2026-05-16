<?php
/**
 * BlackFire Solutions Portal — Configuration
 * PROD ENV · Afrihost MySQL · 2026-05-14 · v1.1
 *
 * Credentials are read from environment variables.
 * Set these in cPanel > Environment Variables, or in a .env file loaded
 * before this script runs. See .env.example for required keys.
 */

// Load .env file if present (no Composer dependency — plain key=value parser)
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if ($line[0] === '#' || strpos($line, '=') === false) continue;
        [$key, $val] = explode('=', $line, 2);
        putenv(trim($key) . '=' . trim($val));
    }
}

return [
    // ═══════════════════════════════════════════════════════
    // DATABASE CONNECTION
    // ═══════════════════════════════════════════════════════
    'db_host'    => getenv('BF_DB_HOST') ?: 'localhost',
    'db_port'    => (int)(getenv('BF_DB_PORT') ?: 3306),
    'db_name'    => getenv('BF_DB_NAME') ?: 'blackfm6w9f9_portal',
    'db_user'    => getenv('BF_DB_USER') ?: 'blackfm6w9f9_izilo',
    'db_pass'    => getenv('BF_DB_PASS'),
    'db_charset' => 'utf8mb4',
    'db_options' => [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ],

    // ═══════════════════════════════════════════════════════
    // APPLICATION SETTINGS
    // ═══════════════════════════════════════════════════════
    'app_name'     => 'BlackFire Solutions Portal',
    'app_version'  => '1.1',
    'app_env'      => 'production',
    'base_url'     => 'https://blackfiresolutions.co.za/portal',
    'api_base'     => 'https://blackfiresolutions.co.za/portal/api',

    // ═══════════════════════════════════════════════════════
    // SECURITY & SESSION
    // ═══════════════════════════════════════════════════════
    'timezone'          => 'Africa/Johannesburg',
    'session_ttl'       => 3600,                  // 1 hour
    'session_name'      => 'BLKFR_SESSION',
    'remember_duration' => 604800,                // 7 days
    'max_login_attempts' => 5,
    'lockout_duration'  => 900,                  // 15 minutes
    'password_min_length' => 12,
    'require_https'     => true,
    'secure_cookies'    => true,

    // ═══════════════════════════════════════════════════════
    // EMAIL (for notifications & contact form)
    // ═══════════════════════════════════════════════════════
    'mail_from'     => 'info@blackfiresolutions.co.za',
    'mail_from_name' => 'BlackFire Solutions',
    'mail_host'     => 'mail.blackfiresolutions.co.za',
    'mail_port'     => 587,
    'mail_username' => 'info@blackfiresolutions.co.za',
    'mail_password' => '',  // Set via environment variable or cPanel
    'mail_encryption' => 'tls',
    'notification_email' => 'jubhele@astuteinsights.co.za',

    // ═══════════════════════════════════════════════════════
    // BUSINESS CONFIG
    // ═══════════════════════════════════════════════════════
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

    // ═══════════════════════════════════════════════════════
    // AUDIT & LOGGING
    // ═══════════════════════════════════════════════════════
    'log_file'      => __DIR__ . '/../logs/app.log',
    'audit_events'  => true,
    'log_api_calls' => true,

    // ═══════════════════════════════════════════════════════
    // FEATURE FLAGS
    // ═══════════════════════════════════════════════════════
    'feature_invoices'    => true,
    'feature_quotes'      => true,
    'feature_callouts'    => true,
    'feature_reports'     => true,
    'feature_audit'       => true,
    'feature_users'       => true,
    'feature_integration' => false,  // Third-party integrations

    // ═══════════════════════════════════════════════════════
    // CLIENT: AECI CHEMPARK
    // ═══════════════════════════════════════════════════════
    'aeci_site'     => 'Chempark, Modderfontein, Johannesburg',
    'aeci_contact'  => 'Site Manager',
    'aeci_email'    => 'admin@chempark.co.za',
    'aeci_budget'   => 150000,  // Monthly budget in R
];
?>
