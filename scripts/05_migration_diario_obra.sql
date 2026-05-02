-- ============================================================================
-- Migration: Cadastro de Instaladores, Veículos e Diário de Obra
-- Banco: u155320717_esol_obras
-- ============================================================================

CREATE TABLE IF NOT EXISTS installers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  hired_at TIMESTAMP NULL,
  left_at TIMESTAMP NULL,
  role VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_vehicle_identifier (identifier),
  KEY idx_vehicle_status (status)
);

CREATE TABLE IF NOT EXISTS obra_diario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_code VARCHAR(20) NOT NULL,
  day_number INT NOT NULL,
  date TIMESTAMP NOT NULL,
  vehicle_id INT NULL,
  installer_id INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_obra_dia_inst (project_code, day_number, installer_id),
  KEY idx_diario_project (project_code),
  KEY idx_diario_date (date),
  KEY idx_diario_installer (installer_id),
  KEY idx_diario_vehicle (vehicle_id),
  CONSTRAINT fk_diario_installer FOREIGN KEY (installer_id) REFERENCES installers(id) ON DELETE RESTRICT,
  CONSTRAINT fk_diario_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
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
