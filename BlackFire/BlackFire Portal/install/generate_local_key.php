<?php
/**
 * Generate BF_APP_KEY for local development
 * This generates a fresh encryption key and updates .env
 */

$keyBytes = random_bytes(32);
$keyHex = bin2hex($keyBytes);

echo "========================================\n";
echo "BlackFire Local Dev — Key Generation\n";
echo "========================================\n\n";

echo "Generated BF_APP_KEY:\n";
echo $keyHex . "\n\n";

// Read current .env
$envFile = __DIR__ . '/../.env';
$envContent = file_exists($envFile) ? file_get_contents($envFile) : '';

// Update or add BF_APP_KEY
if (strpos($envContent, 'BF_APP_KEY=') !== false) {
    $envContent = preg_replace('/BF_APP_KEY=.*/', 'BF_APP_KEY=' . $keyHex, $envContent);
    echo "✓ Updated existing BF_APP_KEY in .env\n";
} else {
    $envContent .= "BF_APP_KEY=" . $keyHex . "\n";
    echo "✓ Added BF_APP_KEY to .env\n";
}

file_put_contents($envFile, $envContent);

echo "\nNext steps:\n";
echo "1. Verify .env now contains BF_APP_KEY\n";
echo "2. Ensure database exists: blackfm6w9f9_portal\n";
echo "3. Run the installer: /install/index.php\n";
echo "4. Delete this file after setup is complete\n";
?>
