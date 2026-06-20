<?php
header('Content-Type: text/plain');

$secretsFile = dirname(__DIR__, 2) . '/blackfire_secrets.php';
echo "secretsFile path: $secretsFile\n";
echo "secretsFile exists: " . (file_exists($secretsFile) ? 'yes' : 'no') . "\n";

// From config/config.php:
$configDir = __DIR__ . DIRECTORY_SEPARATOR . 'config';
$portalMirrorFile = dirname($configDir) . DIRECTORY_SEPARATOR . '.env';
echo "portalMirrorFile path: $portalMirrorFile\n";
echo "portalMirrorFile exists: " . (file_exists($portalMirrorFile) ? 'yes' : 'no') . "\n";
echo "portalMirrorFile readable: " . (is_readable($portalMirrorFile) ? 'yes' : 'no') . "\n";

if (is_readable($portalMirrorFile)) {
    echo "File lines:\n";
    foreach (file($portalMirrorFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = preg_replace('/^\xEF\xBB\xBF/', '', trim($line));
        if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        echo "  $key = $value\n";
    }
}

$cfg = require __DIR__ . '/config/config.php';
echo "\n--- Config Array ---\n";
print_r($cfg);
