<?php
/**
 * dev-only/generate_attachment_placeholders.php
 *
 * Creates placeholder files on disk for every bf_attachments record
 * whose stored_name does not yet exist in uploads/attachments/.
 *
 * Useful after running the test-data SQL seeds, which insert metadata
 * rows referencing files that have never actually been uploaded.
 *
 * Generated files are intentionally minimal — JPEGs are a 1×1 white
 * pixel, PNGs likewise, PDFs contain a single text page with the
 * original filename. They satisfy file_exists() and readfile() without
 * breaking the portal's download handler.
 *
 * Usage (from this directory or portal root):
 *   php dev-only/generate_attachment_placeholders.php
 *
 * Safe to re-run — skips files that already exist on disk.
 */

// Allow running from portal root or from dev-only/
$portal_root = is_dir(__DIR__ . '/includes') ? __DIR__ : dirname(__DIR__);
require_once $portal_root . '/includes/db.php';

$attach_dir = $portal_root . '/uploads/attachments';
if (!is_dir($attach_dir) && !mkdir($attach_dir, 0755, true)) {
    echo "ERROR: Cannot create directory: $attach_dir\n";
    exit(1);
}

// ── Minimal valid JPEG (1×1 white pixel, baseline, no EXIF) ────────────
$jpeg_bytes = base64_decode(
    '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsL' .
    'DBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/' .
    'wAAUCAABAAEEASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABAUG/8QAHhAB' .
    'AAMBAAMBAQAAAAAAAAAAAQIDBAUREiH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QA' .
    'FBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8Aw6ltqCWluQpu1BjUoABK' .
    'vSNAA/9k='
);

// ── Minimal valid PNG (1×1 white pixel) ─────────────────────────────────
$png_bytes = base64_decode(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIA' .
    'BQAABjE+ibYAAAAASUVORK5CYII='
);

// ── Minimal valid PDF with filename as body text ─────────────────────────
function minimal_pdf(string $original_name): string {
    // Strip PDF-unsafe characters from the name shown in the document body
    $safe = preg_replace('/[^\x20-\x7E]/', '', $original_name);
    $safe = str_replace(['(', ')', '\\', "\r", "\n"], ['', '', '', '', ''], $safe);
    $body_stream = "BT /F1 10 Tf 50 780 Td ({$safe}) Tj ET\n";
    $len = strlen($body_stream);

    return "%PDF-1.4\n" .
           "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" .
           "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" .
           "3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R" .
               "/Contents 4 0 R/Resources<</Font<</F1<</Type/Font" .
               "/Subtype/Type1/BaseFont/Helvetica>>>>>>>>endobj\n" .
           "4 0 obj<</Length {$len}>>\nstream\n{$body_stream}endstream\nendobj\n" .
           "xref\n0 5\n" .
           "0000000000 65535 f \n" .
           "0000000009 00000 n \n" .
           "0000000058 00000 n \n" .
           "0000000115 00000 n \n" .
           "0000000266 00000 n \n" .
           "trailer<</Size 5/Root 1 0 R>>\nstartxref\n0\n%%EOF\n";
}

// ── Fetch all attachment rows ────────────────────────────────────────────
$rows    = db_select("SELECT stored_name, original_name, mime_type FROM bf_attachments ORDER BY id", []);
$created = 0;
$skipped = 0;
$errors  = 0;

foreach ($rows as $row) {
    $path = $attach_dir . '/' . $row['stored_name'];

    if (file_exists($path)) {
        $skipped++;
        continue;
    }

    switch ($row['mime_type']) {
        case 'image/jpeg':
            $bytes = $jpeg_bytes;
            break;
        case 'image/png':
            $bytes = $png_bytes;
            break;
        case 'application/pdf':
            $bytes = minimal_pdf($row['original_name']);
            break;
        default:
            $bytes = '';
    }

    if (file_put_contents($path, $bytes) === false) {
        echo "ERROR: Could not write {$row['stored_name']}\n";
        $errors++;
        continue;
    }

    echo "Created: {$row['stored_name']}  ({$row['original_name']})\n";
    $created++;
}

echo "\n--- Done ---\n";
echo "Created : $created\n";
echo "Skipped : $skipped (already on disk)\n";
if ($errors) echo "Errors  : $errors\n";
