<?php
$_bf = [
    'BF_DB_HOST'     => 'localhost',
    'BF_DB_PORT'     => '3306',
    'BF_DB_NAME'     => 'blackfm6w9f9_portal',
    'BF_DB_USER'     => 'blackfm6w9f9_umlilo_admin',
    'BF_DB_PASS_ENC' => 'C84pDH8x+JYEE0tMyrNHkXnOqi1Mo/3fOOcSBaDvmh00QCJ74f649/HOP9MDOUoT',
    'BF_APP_KEY'     => 'b7d1f957c7bfe9b9865f36c3d15ca0736d398aa4594954b31a61b4b4b51afb68',
    'BF_MAIL_PASS'   => 'noreplySawubona#@1',
    'BF_GITHUB_PAT'  => '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',
];
foreach ($_bf as $k => $v) {
    putenv("$k=$v");
    $_ENV[$k]    = $v;
    $_SERVER[$k] = $v;
}
unset($_bf, $k, $v);
if (!defined('BF_APP_KEY')) {
    define('BF_APP_KEY', getenv('BF_APP_KEY'));
}

define("BF_GITHUB_PAT", getenv("BF_GITHUB_PAT"));