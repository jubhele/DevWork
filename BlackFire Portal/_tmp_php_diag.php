<?php
header('Content-Type: text/plain');
echo 'sapi=' . php_sapi_name() . PHP_EOL;
echo 'php_version=' . PHP_VERSION . PHP_EOL;
echo 'pdo=' . (extension_loaded('PDO') ? 'yes' : 'no') . PHP_EOL;
echo 'pdo_mysql=' . (extension_loaded('pdo_mysql') ? 'yes' : 'no') . PHP_EOL;
echo 'mysqli=' . (extension_loaded('mysqli') ? 'yes' : 'no') . PHP_EOL;
echo 'docroot=' . ($_SERVER['DOCUMENT_ROOT'] ?? '') . PHP_EOL;
echo 'script=' . __FILE__ . PHP_EOL;
