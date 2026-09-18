<?php
declare(strict_types=1);
require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(['ok' => false, 'error' => 'Método no permitido'], 405);

$b = body();
$email = strtolower(trim((string)($b['email'] ?? '')));
$pass  = (string)($b['pass'] ?? '');

if (!es_email_valido($email) || $pass === '') json_out(['ok' => false, 'error' => 'Credenciales incompletas'], 422);

$stmt = db()->prepare('SELECT * FROM usuarios WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
$u = $stmt->fetch();

if (!$u || !password_verify($pass, $u['password'])) {
    json_out(['ok' => false, 'error' => 'Correo o contraseña incorrectos'], 401);
}

session_regenerate_id(true);
set_session_user($u);

json_out(['ok' => true, 'user' => map_usuario($u)]);
