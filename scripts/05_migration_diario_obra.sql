-- ============================================================================
-- Migration: Cadastro de Instaladores, Veículos e Diário de Obra
-- Banco: u155320717_esol_obras
--
-- IMPORTANTE: nomes de coluna em camelCase para bater com o drizzle schema
-- (drizzle/schema-obras-diario.ts). O drizzle gera SELECTs como
-- `SELECT \`hiredAt\` FROM installers`; se a coluna for hired_at, falha com
-- "Unknown column" e o tRPC devolve 500.
--
-- Se você já criou as tabelas com snake_case antes, derrube primeiro:
--   DROP TABLE IF EXISTS obra_diario;
--   DROP TABLE IF EXISTS vehicles;
--   DROP TABLE IF EXISTS installers;
-- depois rode este script.
-- ============================================================================

CREATE TABLE IF NOT EXISTS installers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  hiredAt TIMESTAMP NULL,
  leftAt TIMESTAMP NULL,
  role VARCHAR(50),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_installer_name (name),
  KEY idx_installer_status (status)
);

CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  identifier VARCHAR(50) NOT NULL,
  model VARCHAR(100),
  plate VARCHAR(10),
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_vehicle_identifier (identifier),
  KEY idx_vehicle_status (status)
);

CREATE TABLE IF NOT EXISTS obra_diario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  projectCode VARCHAR(20) NOT NULL,
  dayNumber INT NOT NULL,
  date TIMESTAMP NOT NULL,
  vehicleId INT NULL,
  installerId INT NOT NULL,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_obra_dia_inst (projectCode, dayNumber, installerId),
  KEY idx_diario_project (projectCode),
  KEY idx_diario_date (date),
  KEY idx_diario_installer (installerId),
  KEY idx_diario_vehicle (vehicleId),
  CONSTRAINT fk_diario_installer FOREIGN KEY (installerId) REFERENCES installers(id) ON DELETE RESTRICT,
  CONSTRAINT fk_diario_vehicle FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE SET NULL
);

-- ── Seed: 13 instaladores ativos (canônica do projeto) ──
INSERT IGNORE INTO installers (name, status, role) VALUES
  ('Elivelton',   'active', 'instalador'),
  ('Fábio',       'active', 'instalador'),
  ('Moisés',      'active', 'instalador'),
  ('Gabriel T',   'active', 'instalador'),
  ('Gabriel M',   'active', 'instalador'),
  ('Hyan',        'active', 'instalador'),
  ('Gustavo',     'active', 'instalador'),
  ('Kauã',        'active', 'instalador'),
  ('Gustavo P',   'active', 'instalador'),
  ('Enderson',    'active', 'instalador'),
  ('Flávio',      'active', 'instalador'),
  ('Ley',         'active', 'instalador'),
  ('Élder',       'active', 'instalador');

-- ── Seed: alguns veículos comuns (ajustar conforme realidade) ──
INSERT IGNORE INTO vehicles (identifier, model, status) VALUES
  ('L200 01',  'Mitsubishi L200',  'active'),
  ('L200 02',  'Mitsubishi L200',  'active'),
  ('Hilux 01', 'Toyota Hilux',     'active'),
  ('Strada 01','Fiat Strada',      'active');
