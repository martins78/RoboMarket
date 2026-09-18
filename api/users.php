<?php
declare(strict_types=1);
require __DIR__ . '/config.php';

/* GET · solo admin */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    require_admin();
    $rows = db()->query('SELECT nombre, email, rol FROM usuarios ORDER BY id ASC')->fetchAll();
    json_out(['ok' => true, 'usuarios' => array_map('map_usuario', $rows)]);
}

$me = require_login();
$b  = body();

/* POST · crear usuario (solo admin) */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_admin();
    $name  = trim((string)($b['name'] ?? ''));
    $email = strtolower(trim((string)($b['email'] ?? '')));
    $pass  = (string)($b['pass'] ?? '');
    $role  = ($b['role'] ?? 'user') === 'admin' ? 'admin' : 'user';

    if ($name === '') json_out(['ok' => false, 'error' => 'El nombre es obligatorio'], 422);
    if (!es_email_valido($email)) json_out(['ok' => false, 'error' => 'Correo electrónico inválido'], 422);
    if (strlen($pass) < 6) json_out(['ok' => false, 'error' => 'La contraseña debe tener al menos 6 caracteres'], 422);

    $dup = db()->prepare('SELECT 1 FROM usuarios WHERE email = ?');
    $dup->execute([$email]);
    if ($dup->fetch()) json_out(['ok' => false, 'error' => 'Ese correo ya está registrado'], 409);

    db()->prepare('INSERT INTO usuarios (nombre, email, password, rol) VALUES (?,?,?,?)')
        ->execute([$name, $email, password_hash($pass, PASSWORD_DEFAULT), $role]);

    $row = db()->prepare('SELECT * FROM usuarios WHERE email = ?');
    $row->execute([$email]);
    json_out(['ok' => true, 'usuario' => map_usuario($row->fetch())], 201);
}

/* PUT / DELETE · con ?email= original */
$orig = strtolower(trim((string)($_GET['email'] ?? $b['origEmail'] ?? '')));
if ($orig === '') json_out(['ok' => false, 'error' => 'Falta el identificador del usuario'], 422);

$self = $orig === $me['email'];
if (!$self) require_admin();

/* PUT · editar */
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $stmt = db()->prepare('SELECT * FROM usuarios WHERE email = ? LIMIT 1');
    $stmt->execute([$orig]);
    $target = $stmt->fetch();
    if (!$target) json_out(['ok' => false, 'error' => 'Usuario no encontrado'], 404);

    $name  = trim((string)($b['name'] ?? $target['nombre']));
    $email = strtolower(trim((string)($b['email'] ?? $orig)));
    $pass  = (string)($b['pass'] ?? '');
    $role  = isset($b['role']) && $b['role'] === 'admin' ? 'admin' : 'user';

    if ($name === '') json_out(['ok' => false, 'error' => 'El nombre es obligatorio'], 422);
    if (!es_email_valido($email)) json_out(['ok' => false, 'error' => 'Correo electrónico inválido'], 422);
    if ($pass !== '' && strlen($pass) < 6) json_out(['ok' => false, 'error' => 'La contraseña debe tener al menos 6 caracteres'], 422);

    /* un usuario que se edita a sí mismo no puede cambiar su propio rol */
    if ($self) $role = $target['rol'];

    if ($email !== $orig) {
        $dup = db()->prepare('SELECT 1 FROM usuarios WHERE email = ? AND email <> ?');
        $dup->execute([$email, $orig]);
        if ($dup->fetch()) json_out(['ok' => false, 'error' => 'Ese correo ya está registrado'], 409);
    }

    /* regla del último administrador */
    if ($target['rol'] === 'admin' && $role !== 'admin') {
        $admins = db()->prepare("SELECT COUNT(*) FROM usuarios WHERE rol='admin' AND email <> ?");
        $admins->execute([$orig]);
        if ((int)$admins->fetchColumn() === 0) {
            json_out(['ok' => false, 'error' => 'Debe existir al menos un administrador en el sistema'], 409);
        }
    }
    /* un usuario estándar no puede auto-promoverse */
    if ($self && !$requireAdminBypass = true) {
        if ($target['rol'] !== 'admin' && $role === 'admin') {
            json_out(['ok' => false, 'error' => 'No puedes modificar tu propio rol'], 403);
        }
    }

    $sql = 'UPDATE usuarios SET nombre=?, email=?, rol=?';
    $args = [$name, $email, $role];
    if ($pass !== '') { $sql .= ', password=?'; $args[] = password_hash($pass, PASSWORD_DEFAULT); }
    $sql .= ' WHERE email=?';
    $args[] = $orig;
    db()->prepare($sql)->execute($args);

    /* remapear pedidos si cambió el correo */
    if ($email !== $orig) {
        db()->prepare('UPDATE pedidos SET cliente=? WHERE cliente=?')->execute([$email, $orig]);
    }
    /* refrescar sesión si se editó a sí mismo */
    if ($self) set_session_user(['nombre' => $name, 'email' => $email, 'rol' => $role]);

    $row = db()->prepare('SELECT nombre, email, rol FROM usuarios WHERE email = ?');
    $row->execute([$email]);
    json_out(['ok' => true, 'usuario' => map_usuario($row->fetch())]);
}

/* DELETE · eliminar (solo admin) */
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if ($self) json_out(['ok' => false, 'error' => 'No puedes eliminar tu propia cuenta'], 409);

    $stmt = db()->prepare('SELECT rol FROM usuarios WHERE email = ?');
    $stmt->execute([$orig]);
    $t = $stmt->fetch();
    if (!$t) json_out(['ok' => false, 'error' => 'Usuario no encontrado'], 404);

    if ($t['rol'] === 'admin') {
        $admins = db()->prepare("SELECT COUNT(*) FROM usuarios WHERE rol='admin' AND email <> ?");
        $admins->execute([$orig]);
        if ((int)$admins->fetchColumn() === 0) {
            json_out(['ok' => false, 'error' => 'Debe quedar al menos un administrador'], 409);
        }
    }

    db()->prepare('DELETE FROM usuarios WHERE email = ?')->execute([$orig]);
    json_out(['ok' => true]);
}

json_out(['ok' => false, 'error' => 'Método no permitido'], 405);
