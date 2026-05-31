<?php
ob_start();
/**
 * User Signature API
 * GET    /api/user_signature.php?user_id=N             → signature metadata + image
 * POST   /api/user_signature.php?user_id=N             → upload PNG; removes background if needed
 * DELETE /api/user_signature.php?user_id=N             → clear signature
 * POST   /api/user_signature.php?user_id=N&action=sign_as → admin signs document as this user
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

$cfg = require __DIR__ . '/../config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');
api_headers();

$method  = $_SERVER['REQUEST_METHOD'];
$user_id = (int)($_GET['user_id'] ?? 0);
$action  = clean($_GET['action'] ?? '');

if (!$user_id) json_err('Missing user_id');

$actor  = require_perm('user.update');
$target = db_row("SELECT id, username, name, email FROM bf_users WHERE id = ?", [$user_id]);
if (!$target) json_err('User not found', 404);

/* ─── GET ─────────────────────────────────────────────────── */
if ($method === 'GET') {
    $row = db_row(
        "SELECT signature_image, signature_updated_by, signature_updated_at FROM bf_users WHERE id = ?",
        [$user_id]
    );
    json_ok([
        'has_signature'        => !empty($row['signature_image']),
        'signature_image'      => $row['signature_image'] ?? null,
        'signature_updated_by' => $row['signature_updated_by'] ?? null,
        'signature_updated_at' => $row['signature_updated_at'] ?? null,
    ]);
}

/* ─── POST ────────────────────────────────────────────────── */
if ($method === 'POST') {

    /* ── Admin sign as user ────────────────────────────────── */
    if ($action === 'sign_as') {
        $b = get_body();
        require_fields($b, ['entity_type', 'entity_ref']);

        // Must have a stored signature to sign with
        $sig = db_row("SELECT signature_image FROM bf_users WHERE id = ?", [$user_id]);
        if (empty($sig['signature_image'])) json_err('This user has no stored signature');

        $entity_type   = clean($b['entity_type']);
        $entity_ref    = clean($b['entity_ref']);
        $reason        = clean($b['reason'] ?? '');
        $label_note    = "Admin {$actor['username']} signed as {$target['username']}";
        if ($reason) $label_note .= " — $reason";

        db_insert(
            "INSERT INTO bf_digital_signatures
             (entity_type, entity_ref, document_label, signer_name, signer_email,
              signer_role, signature_method, signature_image, status, signed_at, created_by)
             VALUES (?,?,?,?,?,?,?,?,?,NOW(),?)",
            [
                $entity_type,
                $entity_ref,
                $label_note,
                $target['name'],
                $target['email'] ?? '',
                db_row("SELECT role FROM bf_users WHERE id = ?", [$user_id])['role'] ?? '',
                'email_link',
                $sig['signature_image'],
                'Signed',
                $actor['username'],
            ]
        );

        audit($actor['username'], 'SIGN_AS_USER',
            "Admin {$actor['username']} signed {$entity_type}/{$entity_ref} as user {$target['username']}"
        );
        json_ok([], "Signed {$entity_ref} as {$target['username']}");
    }

    /* ── Upload / replace signature ────────────────────────── */
    $b   = get_body();
    $raw = trim($b['signature_image'] ?? '');
    if (!$raw) json_err('No signature image provided');

    // Strip data-URI prefix
    $raw    = preg_replace('#^data:image/png;base64,#i', '', $raw);
    $bytes  = base64_decode($raw, true);
    if ($bytes === false) json_err('Invalid base64 data');

    // Validate it really is a PNG
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    if ($finfo->buffer($bytes) !== 'image/png') json_err('Only PNG files are accepted');

    // Process: cap size, ensure transparent background
    $processed = sig_process_png($bytes);
    if ($processed === false) json_err('Image processing failed — ensure GD is available');

    $data_uri = 'data:image/png;base64,' . base64_encode($processed);

    db_exec(
        "UPDATE bf_users SET signature_image = ?, signature_updated_by = ?, signature_updated_at = NOW() WHERE id = ?",
        [$data_uri, $actor['username'], $user_id]
    );

    $note = ($actor['id'] === $user_id)
        ? "Signature uploaded for own account"
        : "Admin {$actor['username']} uploaded signature for user {$target['username']}";
    audit($actor['username'], 'SIGNATURE_UPLOAD', $note);

    json_ok(['signature_image' => $data_uri], 'Signature saved');
}

/* ─── DELETE ──────────────────────────────────────────────── */
if ($method === 'DELETE') {
    db_exec(
        "UPDATE bf_users SET signature_image = NULL, signature_updated_by = ?, signature_updated_at = NOW() WHERE id = ?",
        [$actor['username'], $user_id]
    );
    audit($actor['username'], 'SIGNATURE_DELETE',
        "Signature removed for user {$target['username']} by {$actor['username']}"
    );
    json_ok([], 'Signature removed');
}

json_err('Method not allowed', 405);

/* ─── Helpers ─────────────────────────────────────────────── */

/**
 * Validates dimensions, caps at 800×400, and ensures transparent background.
 * If the PNG already has alpha on any corner pixel it is kept as-is.
 * Otherwise the background colour is sampled from the 4 corners and removed.
 *
 * Returns the processed PNG binary, or false on failure.
 */
function sig_process_png($raw) {
    $img = @imagecreatefromstring($raw);
    if (!$img) return false;

    $w = imagesx($img);
    $h = imagesy($img);

    // Cap dimensions — resize if too large
    if ($w > 800 || $h > 400) {
        $scale  = min(800 / $w, 400 / $h);
        $nw     = max(1, (int)round($w * $scale));
        $nh     = max(1, (int)round($h * $scale));
        $sized  = imagecreatetruecolor($nw, $nh);
        imagealphablending($sized, false);
        imagesavealpha($sized, true);
        $fill = imagecolorallocatealpha($sized, 255, 255, 255, 127);
        imagefill($sized, 0, 0, $fill);
        imagecopyresampled($sized, $img, 0, 0, 0, 0, $nw, $nh, $w, $h);
        imagedestroy($img);
        $img = $sized;
        $w   = $nw;
        $h   = $nh;
    }

    // Check whether any corner pixel already carries meaningful transparency
    $has_alpha = false;
    if (imageistruecolor($img)) {
        foreach ([[0, 0], [$w - 1, 0], [0, $h - 1], [$w - 1, $h - 1]] as [$sx, $sy]) {
            // GD alpha channel: 0 = fully opaque, 127 = fully transparent
            if ((imagecolorat($img, $sx, $sy) >> 24 & 0x7F) > 10) {
                $has_alpha = true;
                break;
            }
        }
    }

    // Build RGBA output canvas
    $out = imagecreatetruecolor($w, $h);
    imagealphablending($out, false);
    imagesavealpha($out, true);
    $transparent = imagecolorallocatealpha($out, 0, 0, 0, 127);
    imagefill($out, 0, 0, $transparent);

    if ($has_alpha) {
        // Already transparent — just copy preserving alpha
        imagecopy($out, $img, 0, 0, 0, 0, $w, $h);
    } else {
        // No alpha — sample corners to identify background colour, then remove it
        $corners = [];
        foreach ([[0, 0], [$w - 1, 0], [0, $h - 1], [$w - 1, $h - 1]] as [$cx, $cy]) {
            $c = imagecolorat($img, $cx, $cy);
            $corners[] = [($c >> 16) & 0xFF, ($c >> 8) & 0xFF, $c & 0xFF];
        }
        $bg_r = (int)(($corners[0][0] + $corners[1][0] + $corners[2][0] + $corners[3][0]) / 4);
        $bg_g = (int)(($corners[0][1] + $corners[1][1] + $corners[2][1] + $corners[3][1]) / 4);
        $bg_b = (int)(($corners[0][2] + $corners[1][2] + $corners[2][2] + $corners[3][2]) / 4);

        // Max-channel distance tolerance — fast and avoids sqrt
        $threshold = 45;

        for ($y = 0; $y < $h; $y++) {
            for ($x = 0; $x < $w; $x++) {
                $c    = imagecolorat($img, $x, $y);
                $r    = ($c >> 16) & 0xFF;
                $g    = ($c >> 8)  & 0xFF;
                $b    = $c         & 0xFF;
                $dist = max(abs($r - $bg_r), abs($g - $bg_g), abs($b - $bg_b));
                if ($dist < $threshold) {
                    imagesetpixel($out, $x, $y, $transparent);
                } else {
                    imagesetpixel($out, $x, $y, imagecolorallocatealpha($out, $r, $g, $b, 0));
                }
            }
        }
    }

    imagedestroy($img);
    ob_start();
    imagepng($out, null, 6); // compression level 6 — balanced size/speed
    $result = ob_get_clean();
    imagedestroy($out);
    return $result;
}
