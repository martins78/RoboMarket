<?php
declare(strict_types=1);
require __DIR__ . '/config.php';

/* GET público · lista para catálogo */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $rows = db()->query('SELECT * FROM productos ORDER BY id DESC')->fetchAll();
    json_out(['ok' => true, 'productos' => array_map('map_producto', $rows)]);
}

require_admin();

/* POST · crear producto */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $b    = body();
    $name = trim((string)($b['name'] ?? ''));
    $tipo = (string)($b['type'] ?? 'industrial');
    if ($name === '') json_out(['ok' => false, 'error' => 'El nombre es obligatorio'], 422);
    if (!in_array($tipo, ['vision', 'industrial', 'collaborative'], true)) $tipo = 'industrial';

    $st = db()->prepare(
        'INSERT INTO productos (nombre, tipo, etiqueta, precio, descripcion, imagen, caracteristicas)
         VALUES (?,?,?,?,?,?,?)'
    );
    $st->execute([
        $name,
        $tipo,
        mb_strtoupper(trim((string)($b['tag'] ?? ''))) ?: null,
        max(0, (float)($b['price'] ?? 0)),
        trim((string)($b['desc'] ?? '')) ?: null,
        (string)($b['img'] ?? ''),
        json_encode(array_values((array)($b['features'] ?? [])), JSON_UNESCAPED_UNICODE),
    ]);

    $id = (int)db()->lastInsertId();
    $row = db()->prepare('SELECT * FROM productos WHERE id = ?');
    $row->execute([$id]);
    json_out(['ok' => true, 'producto' => map_producto($row->fetch())], 201);
}

/* PUT / DELETE · requieren ?id= */
$b   = body();
$id  = (int)($_GET['id'] ?? $b['id'] ?? 0);
if ($id <= 0) json_out(['ok' => false, 'error' => 'Falta el id del producto'], 422);

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $b    = body();
    $name = trim((string)($b['name'] ?? ''));
    $tipo = (string)($b['type'] ?? 'industrial');
    if ($name === '') json_out(['ok' => false, 'error' => 'El nombre es obligatorio'], 422);
    if (!in_array($tipo, ['vision', 'industrial', 'collaborative'], true)) $tipo = 'industrial';

    $st = db()->prepare(
        'UPDATE productos SET nombre=?, tipo=?, etiqueta=?, precio=?, descripcion=? WHERE id=?'
    );
    $st->execute([
        $name,
        $tipo,
        mb_strtoupper(trim((string)($b['tag'] ?? ''))) ?: null,
        max(0, (float)($b['price'] ?? 0)),
        trim((string)($b['desc'] ?? '')) ?: null,
        $id,
    ]);
    json_out(['ok' => true]);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    db()->prepare('DELETE FROM productos WHERE id = ?')->execute([$id]);
    json_out(['ok' => true]);
}

json_out(['ok' => false, 'error' => 'Método no permitido'], 405);
