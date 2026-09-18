<?php
declare(strict_types=1);
require __DIR__ . '/config.php';

$me = require_login();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(['ok' => false, 'error' => 'Método no permitido'], 405);

$b    = body();
$cur  = (string)($b['cur'] ?? '');
$new  = (string)($b['new'] ?? '');

if (strlen($new) < 6) json_out(['ok' => false, 'error' => 'La nueva contraseña debe tener al menos 6 caracteres'], 422);

$stmt = db()->prepare('SELECT password FROM usuarios WHERE email = ? LIMIT 1');
$stmt->execute([$me['email']]);
$row = $stmt->fetch();

if (!$row || !password_verify($cur, $row['password'])) {
    json_out(['ok' => false, 'error' => 'La contraseña actual no coincide'], 401);
}

db()->prepare('UPDATE usuarios SET password = ? WHERE email = ?')
    ->execute([password_hash($new, PASSWORD_DEFAULT), $me['email']]);

json_out(['ok' => true]);
