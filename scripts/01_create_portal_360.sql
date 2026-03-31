-- ============================================================================
-- PORTAL 360° - Avaliação de Desempenho e Comportamento
-- ============================================================================
-- Este script cria o banco de dados e todas as tabelas necessárias para o
-- sistema de avaliação 360° (desempenho, comportamento e liderança)

-- ─── Criar Banco de Dados ───
CREATE DATABASE IF NOT EXISTS portal_360
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE portal_360;

-- ─── Tabela: Users ───
-- Usuários do sistema (cópia sincronizada do banco principal)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openId VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320) UNIQUE,
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  appRole ENUM('admin', 'leader', 'employee') NOT NULL DEFAULT 'employee',
  jobCategory ENUM('administrativo', 'operacional') NOT NULL DEFAULT 'administrativo',
  areaId INT,
  leaderId INT,
  passwordHash VARCHAR(255),
  mustChangePassword BOOLEAN NOT NULL DEFAULT TRUE,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  secondaryAreaId INT,
  secondaryLeaderId INT,
  deactivatedAt TIMESTAMP NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_openId (openId),
  INDEX idx_appRole (appRole),
  INDEX idx_areaId (areaId),
  INDEX idx_leaderId (leaderId),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Tabela: Areas ───
-- Áreas/Setores da empresa
CREATE TABLE IF NOT EXISTS areas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  companyName VARCHAR(255),
  leaderId INT,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_leaderId (leaderId),
  FOREIGN KEY (leaderId) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Tabela: Cycles ───
-- Ciclos de avaliação (mensais)
CREATE TABLE IF NOT EXISTS cycles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  monthYear VARCHAR(7) NOT NULL UNIQUE COMMENT 'YYYY-MM',
  status ENUM('open', 'closed', 'published') NOT NULL DEFAULT 'open',
  startDate TIMESTAMP NULL,
  deadline360 TIMESTAMP NULL,
  deadlineLeadership TIMESTAMP NULL,
  closeDate TIMESTAMP NULL,
  publishDate TIMESTAMP NULL,
  minOtherAreaEvals INT DEFAULT 5,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_monthYear (monthYear),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Tabela: Criteria360 ───
-- Critérios de avaliação 360° (Base360, Detailed360, Leadership)
CREATE TABLE IF NOT EXISTS criteria_360 (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL UNIQUE,
  type ENUM('base360', 'detailed360', 'leadership') NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sortOrder INT NOT NULL DEFAULT 0,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_code (code),
  INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Tabela: Evaluations360 ───
-- Avaliações individuais do 360°
CREATE TABLE IF NOT EXISTS evaluations_360 (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cycleId INT NOT NULL,
  evaluatorId INT NOT NULL,
  evaluateeId INT NOT NULL,
  relation ENUM('same_area', 'other_area', 'leadership', 'self', 'bottom_up') NOT NULL,
  items JSON COMMENT 'Array de {criteriaId, score, justification}',
  status ENUM('draft', 'submitted') NOT NULL DEFAULT 'draft',
  submittedAt TIMESTAMP NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cycleId (cycleId),
  INDEX idx_evaluatorId (evaluatorId),
  INDEX idx_evaluateeId (evaluateeId),
  INDEX idx_status (status),
  UNIQUE KEY unique_eval (cycleId, evaluatorId, evaluateeId, relation),
  FOREIGN KEY (cycleId) REFERENCES cycles(id) ON DELETE CASCADE,
  FOREIGN KEY (evaluatorId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (evaluateeId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Tabela: Aggregates360 ───
-- Resultados consolidados por usuário por ciclo
CREATE TABLE IF NOT EXISTS aggregates_360 (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cycleId INT NOT NULL,
  userId INT NOT NULL,
  nota360 DECIMAL(5,2),
  notaLideranca DECIMAL(5,2),
  avaliacaoGlobal DECIMAL(5,2),
  bonusPontualidade DECIMAL(8,2) DEFAULT 0,
  bonusDesempenho DECIMAL(8,2) DEFAULT 0,
  totalBonus DECIMAL(8,2) DEFAULT 0 COMMENT 'pontualidade + desempenho (sem pódio)',
  detailsByCriteria JSON COMMENT 'Detalhes por critério',
  radarData JSON COMMENT 'Dados para gráfico radar',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_agg (cycleId, userId),
  INDEX idx_cycleId (cycleId),
  INDEX idx_userId (userId),
  FOREIGN KEY (cycleId) REFERENCES cycles(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Tabela: Punctuality ───
-- Dados de pontualidade para cálculo de bônus
CREATE TABLE IF NOT EXISTS punctuality (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cycleId INT NOT NULL,
  userId INT NOT NULL,
  maxDelayDayMin INT DEFAULT 0,
  totalDelayMonthMin INT DEFAULT 0,
  eligible BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_punct (cycleId, userId),
  INDEX idx_cycleId (cycleId),
  INDEX idx_userId (userId),
  FOREIGN KEY (cycleId) REFERENCES cycles(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Tabela: Podium ───
-- Ranking trimestral (pódio com prêmios)
CREATE TABLE IF NOT EXISTS podium (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cycleId INT NOT NULL,
  userId INT NOT NULL,
  position INT NOT NULL,
  avaliacaoGlobal DECIMAL(5,2),
  notaLideranca DECIMAL(5,2),
  nota360 DECIMAL(5,2),
  prize DECIMAL(8,2) DEFAULT 0 COMMENT 'Prêmio trimestral (SEM bonificação financeira)',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_podium (cycleId, userId),
  INDEX idx_cycleId (cycleId),
  INDEX idx_userId (userId),
  INDEX idx_position (position),
  FOREIGN KEY (cycleId) REFERENCES cycles(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Tabela: AuditFlags360 ───
-- Flags de auditoria (detecção de "panelinha")
CREATE TABLE IF NOT EXISTS audit_flags_360 (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cycleId INT NOT NULL,
  evaluatorId INT NOT NULL,
  evaluateeId INT NOT NULL,
  flagType VARCHAR(100) NOT NULL,
  description TEXT,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_cycleId (cycleId),
  INDEX idx_evaluatorId (evaluatorId),
  INDEX idx_evaluateeId (evaluateeId),
  INDEX idx_flagType (flagType),
  FOREIGN KEY (cycleId) REFERENCES cycles(id) ON DELETE CASCADE,
  FOREIGN KEY (evaluatorId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (evaluateeId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Inserir Critérios Base360 ───
INSERT INTO criteria_360 (name, code, type, description, sortOrder) VALUES
('Comunicação', 'base360_comunicacao', 'base360', 'Clareza e efetividade na comunicação com colegas e lideranças', 1),
('Colaboração', 'base360_colaboracao', 'base360', 'Disposição em trabalhar em equipe e apoiar colegas', 2),
('Respeito', 'base360_respeito', 'base360', 'Respeito pelas diferenças e diversidade na equipe', 3);

-- ─── Inserir Critérios Detailed360 ───
INSERT INTO criteria_360 (name, code, type, description, sortOrder) VALUES
('Entrega de Resultados', 'detailed360_entrega', 'detailed360', 'Capacidade de entregar projetos e tarefas no prazo', 4),
('Cumprimento de Prazos', 'detailed360_prazos', 'detailed360', 'Pontualidade na entrega de trabalhos', 5),
('Organização', 'detailed360_organizacao', 'detailed360', 'Capacidade de organizar trabalho e prioridades', 6),
('Proatividade', 'detailed360_proatividade', 'detailed360', 'Iniciativa em buscar soluções e melhorias', 7),
('Segurança e EPIs', 'detailed360_seguranca', 'detailed360', 'Cumprimento de normas de segurança e uso de EPIs', 8),
('Documentação', 'detailed360_documentacao', 'detailed360', 'Qualidade e completude da documentação de trabalhos', 9),
('Foco no Cliente', 'detailed360_cliente', 'detailed360', 'Orientação para satisfação e necessidades do cliente', 10),
('Autonomia', 'detailed360_autonomia', 'detailed360', 'Capacidade de trabalhar independentemente', 11),
('Confiabilidade', 'detailed360_confiabilidade', 'detailed360', 'Consistência e confiança em suas ações', 12);

-- ─── Inserir Critérios Leadership ───
INSERT INTO criteria_360 (name, code, type, description, sortOrder) VALUES
('Resultado e Metas', 'leadership_resultado', 'leadership', 'Alcance de metas e resultados da equipe', 13),
('Qualidade', 'leadership_qualidade', 'leadership', 'Garantia de qualidade nos trabalhos da equipe', 14),
('Aderência a Processos', 'leadership_aderencia', 'leadership', 'Cumprimento de processos e normas estabelecidas', 15),
('Postura e Exemplo', 'leadership_postura', 'leadership', 'Exemplo pessoal e postura profissional', 16),
('Desenvolvimento de Pessoas', 'leadership_desenvolvimento', 'leadership', 'Investimento no desenvolvimento da equipe', 17),
('Foco no Cliente', 'leadership_cliente', 'leadership', 'Orientação da equipe para satisfação do cliente', 18),
('Organização e Zelo', 'leadership_organizacao', 'leadership', 'Organização e cuidado com recursos e ambiente', 19);

-- ─── Criar Índices Adicionais para Performance ───
CREATE INDEX idx_evaluations_360_cycleId_evaluateeId ON evaluations_360(cycleId, evaluateeId);
CREATE INDEX idx_evaluations_360_cycleId_evaluatorId ON evaluations_360(cycleId, evaluatorId);
CREATE INDEX idx_aggregates_360_cycleId_userId ON aggregates_360(cycleId, userId);

-- ─── Verificação Final ───
SELECT 'Portal 360° criado com sucesso!' AS status;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_criteria FROM criteria_360;
