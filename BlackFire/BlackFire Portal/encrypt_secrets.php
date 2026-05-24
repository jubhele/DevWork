<?php
/**
 * BlackFire Secrets Generator
 * ────────────────────────────
 * Run this ONCE on the server (or locally) to:
 *   1. Generate a new BF_APP_KEY
 *   2. Encrypt your DB password with it
 *   3. Output the ready-to-paste blackfire_secrets.php content
 *
 * Usage:
 *   - Upload to your server temporarily (e.g. public_html/gen.php)
 *   - Open in browser, fill in your DB password
 *   - Copy the output into ~/blackfire_secrets.php (one level above public_html)
 *   - DELETE this file immediately after use
 *
 * SECURITY: Never leave this file on a public server.
 */

// ── Handle form submission ─────────────────────────────────────────────
$output = '';
$error  = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $db_pass   = $_POST['db_pass']   ?? '';
    $mail_pass = $_POST['mail_pass'] ?? '';
    $app_key   = $_POST['app_key']   ?? '';

    // Generate a new key if not provided
    if (!$app_key || strlen($app_key) !== 64) {
        $app_key = bin2hex(random_bytes(32));
    }

    // Validate
    if (!$db_pass) {
        $error = 'DB password is required.';
    } else {
        function bf_encrypt(string $plaintext, string $keyHex): string {
            $key = hex2bin($keyHex);
            $iv  = random_bytes(16);
            $padLen = 16 - (strlen($plaintext) % 16);
            $padded = $plaintext . str_repeat(chr($padLen), $padLen);
            $ct = openssl_encrypt($padded, 'AES-256-CBC', $key, OPENSSL_RAW_DATA | OPENSSL_ZERO_PADDING, $iv);
            return base64_encode($iv . $ct);
        }

        $db_enc   = bf_encrypt($db_pass, $app_key);
        $mail_enc = $mail_pass ? bf_encrypt($mail_pass, $app_key) : '';

        $output = <<<PHP_OUT
<?php
/**
 * BlackFire Secrets — PRODUCTION
 * One level above public_html: ~/blackfire_secrets.php
 * NEVER commit to git. NEVER make web-accessible.
 * Generated: {$_SERVER['HTTP_HOST']} — {$_POST['generated_at']}
 */

// AES-256-CBC application key (hex-encoded)
define('BF_APP_KEY',      '$app_key');

// Database credentials
define('BF_DB_HOST',      'localhost');
define('BF_DB_PORT',      '3306');
define('BF_DB_NAME',      'blackfm6w9f9_portal');
define('BF_DB_USER',      'blackfm6w9f9_umlilo_admin');
define('BF_DB_PASS_ENC',  '$db_enc');

// Mail password (Brevo SMTP or hosting SMTP)
define('BF_MAIL_PASS',    '$mail_enc');

// Make available as env vars for getenv() compatibility
putenv('BF_APP_KEY='     . BF_APP_KEY);
putenv('BF_DB_HOST='     . BF_DB_HOST);
putenv('BF_DB_PORT='     . BF_DB_PORT);
putenv('BF_DB_NAME='     . BF_DB_NAME);
putenv('BF_DB_USER='     . BF_DB_USER);
putenv('BF_DB_PASS_ENC=' . BF_DB_PASS_ENC);
putenv('BF_MAIL_PASS='   . BF_MAIL_PASS);
PHP_OUT;
    }
}

$gen_key = bin2hex(random_bytes(32));
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>BlackFire Secrets Generator</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 13px;
         background: #0A0E19; color: #E0E4EA; min-height: 100vh;
         display: flex; align-items: center; justify-content: center; padding: 20px; }
  .card { background: #141B26; border: 1px solid #2B3340; border-top: 3px solid #E05A1A;
          padding: 32px; max-width: 640px; width: 100%; border-radius: 2px; }
  h1 { font-size: 18px; font-weight: 700; color: #F07820; margin-bottom: 4px; letter-spacing: 1px; }
  .sub { font-size: 11px; color: #7A8699; margin-bottom: 28px; letter-spacing: 2px; text-transform: uppercase; }
  label { display: block; font-size: 11px; color: #A8B2BE; margin-bottom: 5px; letter-spacing: 1px; text-transform: uppercase; }
  input { width: 100%; background: #0A0E19; border: 1px solid #2B3340; color: #E0E4EA;
          padding: 10px 12px; font-family: inherit; font-size: 13px; border-radius: 2px;
          margin-bottom: 16px; }
  input:focus { outline: none; border-color: #F07820; }
  .key-note { font-size: 11px; color: #7A8699; margin-top: -12px; margin-bottom: 16px; }
  button { background: #E05A1A; color: #fff; border: none; padding: 12px 24px;
           font-family: inherit; font-size: 12px; font-weight: 700; letter-spacing: 2px;
           text-transform: uppercase; cursor: pointer; border-radius: 2px; width: 100%; }
  button:hover { background: #F07820; }
  .error { background: rgba(192,57,43,.15); border: 1px solid #C0392B; color: #C0392B;
           padding: 10px 14px; border-radius: 2px; margin-bottom: 16px; font-size: 12px; }
  .output { background: #0A0E19; border: 1px solid #2ecc71; padding: 16px;
            border-radius: 2px; margin-top: 24px; overflow-x: auto; }
  .output pre { color: #2ecc71; font-size: 12px; white-space: pre-wrap; word-break: break-all; }
  .warn { background: rgba(240,120,32,.1); border: 1px solid #F07820; color: #F07820;
          padding: 10px 14px; border-radius: 2px; margin-bottom: 20px; font-size: 11px; line-height: 1.6; }
  .copy-btn { background: #1E2530; color: #A8B2BE; border: 1px solid #2B3340;
              padding: 6px 14px; font-size: 11px; margin-top: 10px; width: auto; }
</style>
</head>
<body>
<div class="card">
  <h1>BLACKFIRE · SECRETS GENERATOR</h1>
  <div class="sub">One-time production setup tool</div>

  <div class="warn">
    ⚠ DELETE THIS FILE immediately after use.<br>
    Save the output as <strong>~/blackfire_secrets.php</strong> (one level above public_html).<br>
    Never commit secrets to git.
  </div>

  <?php if ($error): ?>
    <div class="error"><?= htmlspecialchars($error) ?></div>
  <?php endif; ?>

  <form method="POST">
    <input type="hidden" name="generated_at" value="<?= date('Y-m-d H:i:s') ?>">

    <label>App Key (BF_APP_KEY) — leave blank to auto-generate</label>
    <input type="text" name="app_key" value="<?= htmlspecialchars($_POST['app_key'] ?? $gen_key) ?>"
           placeholder="64-character hex string">
    <div class="key-note">Auto-generated above. Save this key — you'll need it if you ever need to re-encrypt.</div>

    <label>Database Password (BF_DB_PASS)</label>
    <input type="password" name="db_pass" placeholder="Your MySQL user password" required>

    <label>Mail Password (BF_MAIL_PASS) — optional</label>
    <input type="password" name="mail_pass" placeholder="Brevo SMTP or hosting mail password">

    <button type="submit">Generate blackfire_secrets.php →</button>
  </form>

  <?php if ($output): ?>
    <div class="output">
      <div style="color:#F07820;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">
        ✓ Ready to deploy — copy everything below
      </div>
      <pre id="secrets-out"><?= htmlspecialchars($output) ?></pre>
      <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('secrets-out').textContent).then(()=>this.textContent='✓ Copied')">Copy to Clipboard</button>
    </div>
  <?php endif; ?>
</div>
</body>
</html>
