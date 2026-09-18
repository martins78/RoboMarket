<?php
declare(strict_types=1);
require __DIR__ . '/config.php';

$me = require_login();

/* GET · admin ve todo; usuario solo lo suyo */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($me['role'] === 'admin') {
        $rows = db()->query('SELECT * FROM pedidos ORDER BY id DESC')->fetchAll();
    } else {
        $st = db()->prepare('SELECT * FROM pedidos WHERE cliente = ? ORDER BY id DESC');
        $st->execute([$me['email']]);
        $rows = $st->fetchAll();
    }
    json_out(['ok' => true, 'pedidos' => array_map('map_pedido', $rows)]);
}

$b = body();

/* POST · registrar pedido */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $cliente = $me['role'] === 'admin'
        ? strtolower(trim((string)($b['user'] ?? '')))
        : $me['email'];
    $detalle = trim((string)($b['summary'] ?? ''));
    $total   = max(0, (float)($b['total'] ?? 0));
    $estado  = in_array(($b['status'] ?? ''), ['pendiente', 'proceso', 'done'], true)
        ? $b['status']
        : 'pendiente';

    if (!es_email_valido($cliente)) json_out(['ok' => false, 'error' => 'Correo del cliente inválido'], 422);
    if ($detalle === '') json_out(['ok' => false, 'error' => 'El detalle es obligatorio'], 422);

    /* si el cliente no existe aún como usuario, se acepta igual (cotización externa) */
    db()->prepare('INSERT INTO pedidos (cliente, detalle, total, estado, fecha) VALUES (?,?,?,?,CURDATE())')
        ->execute([$cliente, $detalle, $total, $estado]);

    $id = (int)db()->lastInsertId();
    $row = db()->prepare('SELECT * FROM pedidos WHERE id = ?');
    $row->execute([$id]);
    json_out(['ok' => true, 'pedido' => map_pedido($row->fetch())], 201);
}

/* PUT / DELETE · con ?id= */
$id = (int)($_GET['id'] ?? $b['id'] ?? 0);
if ($id <= 0) json_out(['ok' => false, 'error' => 'Falta el id del pedido'], 422);

require_admin();

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $estado = (string)($b['status'] ?? '');
    if (!in_array($estado, ['pendiente', 'proceso', 'done'], true)) {
        json_out(['ok' => false, 'error' => 'Estado inválido'], 422);
    }
    db()->prepare('UPDATE pedidos SET estado = ? WHERE id = ?')->execute([$estado, $id]);
    json_out(['ok' => true]);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    db()->prepare('DELETE FROM pedidos WHERE id = ?')->execute([$id]);
    json_out(['ok' => true]);
}

json_out(['ok' => false, 'error' => 'Método no permitido'], 405);
