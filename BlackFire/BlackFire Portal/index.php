<?php
header('Content-Type: text/html; charset=UTF-8');
/**
 * BlackFire Solutions Portal — Entry Point
 * Serves the portal shell. Session check happens client-side via API.
 */

// Check if installed
if (!file_exists(__DIR__ . '/config/config.php') || strpos(file_get_contents(__DIR__ . '/config/config.php'), 'YOUR_DB_USER') !== false) {
    header('Location: install/');
    exit;
}

$cfg = require __DIR__ . '/config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');

// Serve the portal HTML
require __DIR__ . '/portal.php';
