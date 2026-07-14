<?php
/**
 * Shared attachment storage helpers.
 *
 * The production host may expose uploaded files from an `opload` tree while
 * older installs used `uploads/attachments`. Store new files in the configured
 * or deployed upload folder, but resolve existing attachment rows from either
 * location so old record links continue to work.
 */

function bf_portal_root(): string {
    return dirname(__DIR__);
}

function bf_upload_path_value(): string {
    $cfg = require __DIR__ . '/../config/config.php';
    $configured = trim((string)($cfg['upload_path'] ?? ''));
    if ($configured !== '') return $configured;

    if (function_exists('cfg_env')) {
        $env = trim((string)cfg_env('BF_UPLOAD_PATH', ''));
        if ($env !== '') return $env;
    }

    $root = bf_portal_root();
    if (is_dir($root . '/opload/attachments')) return 'opload/attachments';
    if (is_dir($root . '/opload')) return 'opload';
    return 'uploads/attachments';
}

function bf_normalize_upload_path(string $path): string {
    $path = trim(str_replace('\\', '/', $path));
    $path = preg_replace('#/+#', '/', $path);
    return trim($path, '/');
}

function bf_upload_dir(): string {
    $path = bf_upload_path_value();
    if (preg_match('/^[A-Za-z]:[\/\\\\]/', $path) || substr($path, 0, 1) === '/') {
        return rtrim(str_replace('\\', '/', $path), '/');
    }
    return bf_portal_root() . '/' . bf_normalize_upload_path($path);
}

function bf_attachment_candidate_dirs(): array {
    $root = bf_portal_root();
    $dirs = [
        bf_upload_dir(),
        $root . '/opload/attachments',
        $root . '/opload',
        $root . '/uploads/attachments',
    ];

    $out = [];
    foreach ($dirs as $dir) {
        $norm = rtrim(str_replace('\\', '/', $dir), '/');
        if ($norm !== '' && !in_array($norm, $out, true)) {
            $out[] = $norm;
        }
    }
    return $out;
}

function bf_attachment_disk_path(string $stored_name): string {
    $stored = basename($stored_name);
    foreach (bf_attachment_candidate_dirs() as $dir) {
        $candidate = $dir . '/' . $stored;
        if (is_file($candidate)) return $candidate;
    }
    return bf_upload_dir() . '/' . $stored;
}

function bf_attachment_url(string $stored_name = ''): string {
    $path = bf_upload_path_value();
    if (preg_match('/^https?:\/\//i', $path)) {
        return rtrim($path, '/') . ($stored_name !== '' ? '/' . rawurlencode(basename($stored_name)) : '');
    }

    $rel = bf_normalize_upload_path($path);
    return '/' . $rel . ($stored_name !== '' ? '/' . rawurlencode(basename($stored_name)) : '');
}
