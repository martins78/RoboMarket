<?php
/**
 * ROBOMARKET · Configuración de la API
 * Conexión PDO a MySQL (Laragon) + sesión + utilidades JSON
 */

declare(strict_types=1);

const DB_HOST = '127.0.0.1';
const DB_NAME = 'robomarket';
const DB_USER = 'root';
const DB_PASS = '';          // Laragon: root sin contraseña
const DB_PORT = 3306;

date_default_timezone_set('America/La_Paz');

session_name('ROBOMARKET_SESS');
session_start();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4',
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ]
            );
        } catch (PDOException $e) {
            json_out(['ok' => false, 'error' => 'Sin conexión a MySQL. ¿Está corriendo Laragon?'], 503);
        }
    }
    return $pdo;
}

function json_out(array $data, int $status = 200): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function body(): array {
    $raw = file_get_contents('php://input');
    $d = json_decode($raw ?: '', true);
    return is_array($d) ? $d : [];
}

function user(): ?array {
    return $_SESSION['user'] ?? null;
}

function require_login(): array {
    $u = user();
    if (!$u) json_out(['ok' => false, 'error' => 'Sesión no iniciada'], 401);
    return $u;
}

function require_admin(): array {
    $u = require_login();
    if ($u['role'] !== 'admin') json_out(['ok' => false, 'error' => 'Requiere permisos de administrador'], 403);
    return $u;
}

function set_session_user(array $row): void {
    $_SESSION['user'] = [
        'email' => $row['email'],
        'name'  => $row['nombre'],
        'role'  => $row['rol'],
    ];
}

/* ─── Mapeos BD → formato que espera el frontend ─── */
function map_usuario(array $r): array {
    return ['name' => $r['nombre'], 'email' => $r['email'], 'role' => $r['rol']];
}

function map_producto(array $r): array {
    return [
        'id'     => (int)$r['id'],
        'name'   => $r['nombre'],
        'type'   => $r['tipo'],
        'tag'    => $r['etiqueta'] ?? '',
        'price'  => (float)$r['precio'],
        'desc'   => $r['descripcion'] ?? '',
        'img'    => $r['imagen'] ?? '',
        'features' => $r['caracteristicas'] ? (json_decode($r['caracteristicas'], true) ?: []) : [],
    ];
}

function map_pedido(array $r): array {
    return [
        'id'      => (int)$r['id'],
        'date'    => date('d/m/Y', strtotime($r['fecha'])),
        'user'    => $r['cliente'],
        'summary' => $r['detalle'],
        'total'   => (float)$r['total'],
        'status'  => $r['estado'],
    ];
}

function es_email_valido(string $e): bool {
    return filter_var($e, FILTER_VALIDATE_EMAIL) !== false;
}
