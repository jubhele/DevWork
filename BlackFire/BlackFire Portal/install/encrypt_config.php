<?php
/**
 * BlackFire Portal — Credential Encryption Utility
 *
 * Use this page ONE TIME to generate your BF_APP_KEY and encrypt sensitive values.
 * DELETE this file from the server after use.
 *
 * Access: https://blackfiresolutions.co.za/portal/install/encrypt_config.php
 */

$result = null;
$error  = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $plain = trim($_POST['plaintext'] ?? '');
    if ($plain === '') {
        $error = 'Enter a value to encrypt.';
    } else {
        $keyBytes = random_bytes(32);
        $iv       = random_bytes(openssl_cipher_iv_length('AES-256-CBC'));
        $cipher   = openssl_encrypt($plain, 'AES-256-CBC', $keyBytes, OPENSSL_RAW_DATA, $iv);
        $encoded  = base64_encode($iv . $cipher);
        $keyHex   = bin2hex($keyBytes);

        $result = [
            'app_key' => $keyHex,
            'enc_val' => $encoded,
        ];
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>BlackFire — Encrypt Config Value</title>
<style>
body{font-family:monospace;max-width:800px;margin:40px auto;padding:20px;background:#1a1a1a;color:#e0e0e0}
h1{color:#ff6b35}
label{display:block;margin-top:16px;color:#aaa}
input,textarea{width:100%;padding:8px;background:#2a2a2a;border:1px solid #444;color:#e0e0e0;border-radius:4px;box-sizing:border-box}
button{margin-top:16px;padding:10px 24px;background:#ff6b35;color:#fff;border:none;border-radius:4px;cursor:pointer}
.box{background:#2a2a2a;border:1px solid #444;border-radius:4px;padding:16px;margin-top:16px}
.key{color:#ffd700;word-break:break-all}
.enc{color:#7ec8e3;word-break:break-all}
.warn{color:#ff4444;border:1px solid #ff4444;padding:12px;border-radius:4px;margin-top:16px}
.step{margin-top:8px;padding-left:16px}
</style>
</head>
<body>
<h1>BlackFire — Credential Encryption Utility</h1>

<?php if ($error): ?>
<div class="warn"><?= htmlspecialchars($error) ?></div>
<?php endif; ?>

<?php if ($result): ?>
<div class="box">
    <strong>Generated successfully. Follow the steps below — then delete this file.</strong>

    <div class="warn" style="margin-top:12px">
        DELETE this file from the server immediately after completing setup.
    </div>

    <label>Step 1 — Add BF_APP_KEY to cPanel Environment Variables (NOT to any file):</label>
    <p class="step">cPanel → Software → PHP Config → Environment Variables → Add:</p>
    <div class="box"><span class="key">BF_APP_KEY=<?= htmlspecialchars($result['app_key']) ?></span></div>

    <label>Step 2 — Add BF_DB_PASS_ENC to your .env file on the server:</label>
    <div class="box"><span class="enc">BF_DB_PASS_ENC=<?= htmlspecialchars($result['enc_val']) ?></span></div>

    <label>Step 3 — Remove BF_DB_PASS from .env if it still exists.</label>

    <label>Step 4 — Delete this file:</label>
    <div class="box">rm ~/public_html/portal/install/encrypt_config.php</div>
</div>
<?php else: ?>
<form method="POST">
    <label for="plaintext">Plain-text value to encrypt (e.g. your database password):</label>
    <input type="password" id="plaintext" name="plaintext" autocomplete="off" required>
    <button type="submit">Generate Encrypted Value</button>
</form>
<?php endif; ?>

<div class="warn" style="margin-top:32px">
    Security model: the encrypted value alone is useless without BF_APP_KEY.<br>
    BF_APP_KEY lives only in cPanel. The encrypted value lives only in .env (gitignored).<br>
    Neither is committed to Git.
</div>
</body>
</html>
