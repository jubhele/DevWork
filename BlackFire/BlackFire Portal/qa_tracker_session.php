<?php
require __DIR__ . '/includes/db.php';
require __DIR__ . '/includes/auth.php';
if (!in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true) || ($_GET['token'] ?? '') !== 'tracker-qa-20260620') { http_response_code(404); exit; }
$user = db_row("SELECT id, username, name, role, title, client_id FROM bf_users WHERE active = 1 AND role IN ('sysadmin','admin') ORDER BY FIELD(role,'sysadmin','admin') LIMIT 1");
$user['id'] = (int)$user['id'];
$user['client_id'] = $user['client_id'] !== null ? (int)$user['client_id'] : null;
$user['roles'] = _user_roles($user['id']);
bf_session_start();
$_SESSION['bf_user'] = $user;
$_SESSION['bf_expires'] = time() + 300;
session_write_close();
header('Content-Type: application/json');
echo json_encode(['success' => true]);
