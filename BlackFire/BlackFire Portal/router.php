<?php
/**
 * PHP built-in server router — dev only, never deploy this file.
 * Replicates the .htaccess mod_rewrite rules for local development.
 *
 * Usage: php -S localhost:8080 router.php
 */
if (PHP_SAPI !== 'cli-server') {
    die('This router is for the PHP built-in server only.');
}

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// Block sensitive directories (mirrors .htaccess rules)
$blocked = ['/config/', '/includes/', '/install/', '/_backups/', '/uploads/attachments/'];
foreach ($blocked as $b) {
    if (strpos($uri, $b) === 0) {
        http_response_code(403);
        echo 'Forbidden';
        return true;
    }
}

// Serve existing files and directories directly (images, CSS, JS, etc.)
if ($uri !== '/' && file_exists(__DIR__ . $uri) && !is_dir(__DIR__ . $uri)) {
    return false;
}

// Route everything else through index.php (same as: RewriteRule ^ index.php [L])
require __DIR__ . '/index.php';
return true;
