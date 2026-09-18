CREATE DATABASE IF NOT EXISTS robomarket
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE robomarket;

-- ─── USUARIOS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre     VARCHAR(120)    NOT NULL,
  email      VARCHAR(160)    NOT NULL UNIQUE,
  password   VARCHAR(255)    NOT NULL,
  rol        ENUM('admin','user') NOT NULL DEFAULT 'user',
  creado_en  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─── PRODUCTOS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS productos (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(160) NOT NULL,
  tipo           ENUM('vision','industrial','collaborative') NOT NULL DEFAULT 'industrial',
  etiqueta       VARCHAR(40)  DEFAULT NULL,
  precio         DECIMAL(12,2) NOT NULL DEFAULT 0,
  descripcion    TEXT,
  imagen         VARCHAR(500),
  caracteristicas TEXT,  -- JSON: ["a","b","c"]
  creado_en      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─── PEDIDOS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pedidos (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cliente     VARCHAR(160) NOT NULL,          -- email del cliente
  detalle     TEXT         NOT NULL,
  total       DECIMAL(12,2) NOT NULL DEFAULT 0,
  estado      ENUM('pendiente','proceso','done') NOT NULL DEFAULT 'pendiente',
  fecha       DATE         NOT NULL,
  creado_en   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_cliente (cliente),
  INDEX idx_estado  (estado)
) ENGINE=InnoDB;

-- ─── DATOS INICIALES ────────────────────────────────────────────
-- Contraseñas en bcrypt: admin123 / user123
INSERT INTO usuarios (nombre, email, password, rol) VALUES
('Administrador RoboMarket', 'admin@robomarket.bo',   '$2y$10$yW6Q1PN8ns./UHY0y8TQUuu5hkCUpJONc2uHYOUR8pjXaRVmfXuNq', 'admin'),
('Usuario Demo',             'usuario@robomarket.bo', '$2y$10$DvnaAPdH8gy9jhVgEduo5eLp6E0Wk7NWnwPQudUFIsSRPxJimO.5a', 'user')
ON DUPLICATE KEY UPDATE email = email;

INSERT INTO productos (nombre, tipo, etiqueta, precio, descripcion, imagen, caracteristicas) VALUES
('Brazo Seleccionador', 'vision', 'VISIÓN ARTIFICIAL', 34900.00,
 'Brazo seleccionador con visión artificial para clasificar y manipular piezas de forma automática.',
 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=700&q=80',
 '["Visión artificial","Detección de objetos","Clasificación automática"]'),
('Brazo Sin Visión', 'industrial', 'SIN VISIÓN', 28500.00,
 'Brazo sin visión artificial, de alta precisión para procesos de producción controlada.',
 'https://images.unsplash.com/photo-1561144257-e32e8efc6c4f?auto=format&fit=crop&w=700&q=80',
 '["Alta precisión","Movimientos controlados","Carga: 10 kg"]'),
('Brazo Normal', 'collaborative', 'ESTÁNDAR', 18500.00,
 'Brazo normal para tareas básicas de automatización, laboratorio y educación.',
 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=700&q=80',
 '["Diseño simple","Configuración rápida","Bajo consumo"]');

INSERT INTO pedidos (cliente, detalle, total, estado, fecha) VALUES
('usuario@robomarket.bo', 'Brazo Seleccionador x1 + instalación', 34900.00, 'pendiente', CURDATE()),
('admin@robomarket.bo',   'Brazo Normal x2 para laboratorio',     37000.00, 'done',     CURDATE());
