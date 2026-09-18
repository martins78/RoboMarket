<?php
declare(strict_types=1);
require __DIR__ . '/config.php';

$u = user();
json_out(['ok' => true, 'user' => $u]);
