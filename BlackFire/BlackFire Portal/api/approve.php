<?php
/**
 * Public Approval Page — Client can approve/reject calls or quotes without login
 * Token is passed in URL: approve.php?token=...&type=...
 */

$cfg = require __DIR__ . '/config/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Africa/Johannesburg');

$token = isset($_GET['token']) ? substr($_GET['token'], 0, 64) : '';
if (!$token || !preg_match('/^[a-f0-9]{64}$/i', $token)) {
    http_response_code(400);
    die('Invalid token');
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Approval Request — <?php echo htmlspecialchars($cfg['company_name'] ?? 'Portal'); ?></title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .container { background: white; border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); max-width: 600px; width: 100%; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .header h1 { font-size: 24px; margin-bottom: 8px; }
        .content { padding: 30px; }
        .record { background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .record-field { display: flex; margin: 12px 0; }
        .record-label { font-weight: 600; color: #555; width: 120px; flex-shrink: 0; }
        .record-value { color: #333; flex: 1; word-break: break-word; }
        .loading { text-align: center; padding: 40px; color: #666; }
        .spinner { border: 3px solid #f3f3f3; border-top: 3px solid #667eea; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 15px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .error { background: #fee; border-left: 4px solid #c33; padding: 15px; border-radius: 4px; color: #c33; margin: 20px 0; }
        .success { background: #efe; border-left: 4px solid #3c3; padding: 15px; border-radius: 4px; color: #3c3; margin: 20px 0; }
        .buttons { display: flex; gap: 15px; margin-top: 30px; justify-content: center; }
        button { padding: 12px 30px; font-size: 16px; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; transition: 0.2s; }
        .btn-approve { background: #28a745; color: white; }
        .btn-approve:hover { background: #218838; }
        .btn-reject { background: #dc3545; color: white; }
        .btn-reject:hover { background: #c82333; }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
        .notes { margin-top: 20px; }
        .notes textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit; resize: vertical; min-height: 80px; }
        .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; border-top: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><?php echo htmlspecialchars($cfg['company_name'] ?? 'Portal'); ?></h1>
            <p>Approval Request</p>
        </div>

        <div class="content" id="content">
            <div class="loading">
                <div class="spinner"></div>
                <p>Loading approval details...</p>
            </div>
        </div>

        <div class="footer">
            <p><?php echo htmlspecialchars($cfg['company_name'] ?? 'Company') . ' — ' . htmlspecialchars($cfg['company_email'] ?? ''); ?></p>
        </div>
    </div>

    <script>
        const token = '<?php echo htmlspecialchars($token); ?>';

        async function loadRecord() {
            try {
                const resp = await fetch(`/api/approvals.php?token=${encodeURIComponent(token)}`);
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const json = await resp.json();
                if (!json.success) throw new Error(json.error || 'Failed to load');
                displayRecord(json.data);
            } catch (err) {
                document.getElementById('content').innerHTML = `
                    <div class="error">
                        <strong>Error:</strong> ${escapeHtml(err.message)}<br>
                        The approval link may have expired or is invalid. Please contact support.
                    </div>
                `;
            }
        }

        function displayRecord(record) {
            const isCallout = record.type === 'callout';
            let html = '';

            if (isCallout) {
                html += `
                    <h2 style="margin-bottom: 20px;">Callout Approval</h2>
                    <div class="record">
                        <div class="record-field">
                            <div class="record-label">Reference:</div>
                            <div class="record-value"><strong>${escapeHtml(record.ref_id)}</strong></div>
                        </div>
                        <div class="record-field">
                            <div class="record-label">Service:</div>
                            <div class="record-value">${escapeHtml(record.service || '')}</div>
                        </div>
                        <div class="record-field">
                            <div class="record-label">Location:</div>
                            <div class="record-value">${escapeHtml(record.location || '')}</div>
                        </div>
                        <div class="record-field">
                            <div class="record-label">Date:</div>
                            <div class="record-value">${escapeHtml(record.callout_date || '')}</div>
                        </div>
                        <div class="record-field">
                            <div class="record-label">Time:</div>
                            <div class="record-value">${escapeHtml(record.callout_time || '')}</div>
                        </div>
                        ${record.notes ? `
                        <div class="record-field">
                            <div class="record-label">Notes:</div>
                            <div class="record-value">${escapeHtml(record.notes)}</div>
                        </div>
                        ` : ''}
                    </div>
                `;
            } else {
                html += `
                    <h2 style="margin-bottom: 20px;">Quote Approval</h2>
                    <div class="record">
                        <div class="record-field">
                            <div class="record-label">Reference:</div>
                            <div class="record-value"><strong>${escapeHtml(record.ref_id)}</strong></div>
                        </div>
                        <div class="record-field">
                            <div class="record-label">Amount:</div>
                            <div class="record-value"><strong>R ${Number(record.total_amount || 0).toFixed(2)}</strong></div>
                        </div>
                        <div class="record-field">
                            <div class="record-label">Valid Until:</div>
                            <div class="record-value">${escapeHtml(record.valid_until || '')}</div>
                        </div>
                        ${record.notes ? `
                        <div class="record-field">
                            <div class="record-label">Notes:</div>
                            <div class="record-value">${escapeHtml(record.notes)}</div>
                        </div>
                        ` : ''}
                    </div>
                `;
            }

            html += `
                <div class="notes">
                    <label style="display: block; margin-bottom: 10px; font-weight: 600;">Optional Comments:</label>
                    <textarea id="notes" placeholder="Add any comments about your decision..."></textarea>
                </div>

                <div class="buttons">
                    <button class="btn-approve" onclick="submitApproval('approved')">✓ Approve</button>
                    <button class="btn-reject" onclick="submitApproval('rejected')">✗ Reject</button>
                </div>
            `;

            document.getElementById('content').innerHTML = html;
        }

        async function submitApproval(decision) {
            const buttons = document.querySelectorAll('button');
            buttons.forEach(b => b.disabled = true);

            try {
                const resp = await fetch(`/api/approvals.php?token=${encodeURIComponent(token)}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        decision: decision,
                        notes: document.getElementById('notes')?.value || ''
                    })
                });

                const json = await resp.json();
                if (!json.success) throw new Error(json.error || 'Failed to submit');

                document.getElementById('content').innerHTML = `
                    <div class="success">
                        <strong>✓ Success!</strong><br>
                        Your decision has been recorded. Thank you.
                    </div>
                `;
            } catch (err) {
                document.getElementById('content').innerHTML = `
                    <div class="error">
                        <strong>Error:</strong> ${escapeHtml(err.message)}
                    </div>
                `;
                buttons.forEach(b => b.disabled = false);
            }
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        loadRecord();
    </script>
</body>
</html>
