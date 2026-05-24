<?php
ob_start(); // Buffer output so headers can be sent from API calls
/**
 * BlackFire Solutions Portal - Main Portal PHP
 * This file outputs the full portal HTML, with the JS data layer
 * replaced by API calls to the PHP/MySQL backend.
 */
$cfg = require __DIR__ . '/config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');
$base = rtrim($cfg['base_url'] ?? '', '/');
?>
<!DOCTYPE html>
<html lang="en" data-theme="light" data-state="public">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data:; script-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none';">
<title>BlackFire Solutions - Fire, taught to behave.</title>
<link rel="icon" href="./favicon.ico?v=20260521" sizes="any">
<link rel="icon" type="image/png" sizes="512x512" href="./favicon-512x512.png?v=20260521">
<link rel="icon" type="image/png" sizes="32x32" href="./favicon-32x32.png?v=20260521">
<link rel="icon" type="image/png" sizes="16x16" href="./favicon-16x16.png?v=20260521">
<link rel="apple-touch-icon" sizes="180x180" href="./apple-touch-icon.png?v=20260521">
<link rel="shortcut icon" href="./favicon.ico?v=20260521">
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@400;600;700;900&family=Instrument+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/portal_main.css">
</head>
<body>
