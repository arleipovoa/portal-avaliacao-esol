-- ============================================================================
-- PORTAL OBRAS - Avaliação de Instalações e Projetos
-- ============================================================================
-- Este script cria o banco de dados e todas as tabelas necessárias para o
-- sistema de avaliação de obras (projetos, equipes, notas técnicas e bônus)

-- ─── Criar Banco de Dados ───
CREATE DATABASE IF NOT EXISTS portal_obras
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE portal_obras;

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
  INDEX idx_jobCategory (jobCategory),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Tabela: Projects ───
-- Obras/Projetos de instalação solar
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Código da obra (ex: P1000)',
  clientName VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  startDate TIMESTAMP NULL,
  endDate TIMESTAMP NULL COMMENT 'Data prevista de término',
  completedDate TIMESTAMP NULL COMMENT 'Data de conclusão real',
  moduleCount INT COMMENT 'Quantidade de módulos',
  modulePower INT COMMENT 'Potência por módulo (Wp)',
  powerKwp DECIMAL(8,2) COMMENT 'Potência total (kWp)',
  category ENUM('B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7') COMMENT 'Categoria de bônus baseada em kWp',
  status ENUM('planning', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'planning',
  paymentMonth VARCHAR(7) COMMENT 'Mês de pagamento (YYYY-MM)',
  actualDays INT COMMENT 'Dias reais para conclusão',
  expectedDaysOverride INT COMMENT 'Override manual de dias esperados',
  hasFinancialLoss BOOLEAN DEFAULT FALSE,
  financialLossReason TEXT,
  forceMajeureJustification TEXT,
  photosLink TEXT COMMENT 'Link para fotos/documentação',
  reportLink TEXT COMMENT 'Link para relatório',
  nps DECIMAL(5,2) COMMENT 'NPS do cliente (0-10)',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_status (status),
  INDEX idx_category (category),
  INDEX idx_powerKwp (powerKwp),
  INDEX idx_paymentMonth (paymentMonth)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Tabela: ProjectMembers ───
-- Alocação de instaladores às obras com seus papéis
CREATE TABLE IF NOT EXISTS project_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  projectId INT NOT NULL,
  userId INT NOT NULL,
  role ENUM('leader', 'organizer', 'installer') NOT NULL DEFAULT 'installer' COMMENT 'Papel na obra',
  joinedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  leftAt TIMESTAMP NULL COMMENT 'Data de saída (se aplicável)',
  INDEX idx_projectId (projectId),
  INDEX idx_userId (userId),
  INDEX idx_role (role),
  UNIQUE KEY unique_member (projectId, userId),
  FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Tabela: ObraCriteria ───
-- Critérios específicos de avaliação de obras
CREATE TABLE IF NOT EXISTS obra_criteria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL UNIQUE,
  category ENUM('seguranca', 'funcionalidade', 'estetica', 'complementar') NOT NULL,
  weight DECIMAL(3,1) NOT NULL DEFAULT 1.0 COMMENT 'Peso para cálculo (2.0, 1.0, etc)',
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sortOrder INT NOT NULL DEFAULT 0,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_code (code),
  INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Tabela: ObraEvaluations ───
-- Avaliações individuais de obras
CREATE TABLE IF NOT EXISTS obra_evaluations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  projectId INT NOT NULL,
  evaluatorId INT NOT NULL,
  evaluatedMemberIds JSON COMMENT 'Array de IDs dos membros avaliados',
  items JSON COMMENT 'Array de {criteriaId, score, justification}',
  status ENUM('draft', 'submitted') NOT NULL DEFAULT 'draft',
  submittedAt TIMESTAMP NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_projectId (projectId),
  INDEX idx_evaluatorId (evaluatorId),
  INDEX idx_status (status),
  FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (evaluatorId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Tabela: ObraScores ───
-- Notas consolidadas por usuário por obra
CREATE TABLE IF NOT EXISTS obra_scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  projectId INT NOT NULL,
  userId INT NOT NULL,
  notaSeguranca DECIMAL(5,2) COMMENT 'Nota de Segurança (0-10)',
  notaFuncionalidade DECIMAL(5,2) COMMENT 'Nota de Funcionalidade (0-10)',
  notaEstetica DECIMAL(5,2) COMMENT 'Nota de Estética (0-10)',
  mediaOs DECIMAL(5,2) COMMENT 'Média de preenchimento de OS (0-10)',
  eficiencia DECIMAL(5,2) COMMENT 'Nota de Eficiência (0-10)',
  npsCliente DECIMAL(5,2) COMMENT 'NPS do Cliente (0-10)',
  notaObraPercentual DECIMAL(6,2) COMMENT 'Nota final da obra (0-100)',
  bonusValorBase DECIMAL(10,2) COMMENT 'Valor base do bônus conforme categoria',
  bonusValorCorrigido DECIMAL(10,2) COMMENT 'Valor corrigido (base × score/100)',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_score (projectId, userId),
  INDEX idx_projectId (projectId),
  INDEX idx_userId (userId),
  INDEX idx_notaObraPercentual (notaObraPercentual),
  FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Inserir Critérios de Segurança (Peso 2.0) ───
INSERT INTO obra_criteria (name, code, category, weight, description, sortOrder) VALUES
('Uso de EPI/EPC', 'uso_epi_epc', 'seguranca', 2.0, 'Equipamento de proteção individual e coletivo utilizado corretamente', 1),
('APR Inversor', 'apr_inversor', 'seguranca', 2.0, 'Análise Preliminar de Risco para Inversor realizada e documentada', 2),
('APR Módulos', 'apr_modulos', 'seguranca', 2.0, 'Análise Preliminar de Risco para Módulos realizada e documentada', 3),
('Acidente/Avaria', 'acidente_avaria', 'seguranca', 2.0, 'Ausência de acidentes ou danos durante a obra', 4),
('Esquecimento', 'esquecimento', 'seguranca', 2.0, 'Nenhum item esquecido ou não implementado', 5);

-- ─── Inserir Critérios de Funcionalidade (Peso 2.0) ───
INSERT INTO obra_criteria (name, code, category, weight, description, sortOrder) VALUES
('Identificação', 'identificacao', 'funcionalidade', 2.0, 'Identificação correta de todos os componentes', 6),
('Configuração Inversor', 'configuracao_inversor', 'funcionalidade', 2.0, 'Configuração adequada e funcional do inversor', 7),
('Placa de Advertência', 'placa_advertencia', 'funcionalidade', 2.0, 'Placa de advertência instalada conforme normas', 8),
('Prejuízo Financeiro', 'prejuizo_financeiro', 'funcionalidade', 2.0, 'Ausência de prejuízos financeiros causados pela instalação', 9),
('Lacre', 'lacre', 'funcionalidade', 2.0, 'Lacres de segurança aplicados corretamente', 10);

-- ─── Inserir Critérios de Estética (Peso 1.0) ───
INSERT INTO obra_criteria (name, code, category, weight, description, sortOrder) VALUES
('Montagem Módulos', 'montagem_modulos', 'estetica', 1.0, 'Qualidade e alinhamento da montagem dos módulos', 11),
('Montagem Inversor', 'montagem_inversor', 'estetica', 1.0, 'Qualidade da montagem e acabamento do inversor', 12),
('Cabeamento', 'cabeamento', 'estetica', 1.0, 'Organização e qualidade do cabeamento', 13),
('Eletroduto / Corrugado', 'eletroduto_corrugado', 'estetica', 1.0, 'Uso correto e organizado de proteção de cabos', 14),
('Telhado / Estrutura', 'telhado_estrutura', 'estetica', 1.0, 'Qualidade da estrutura de suporte no telhado', 15),
('Ponto de Conexão', 'ponto_conexao', 'estetica', 1.0, 'Qualidade e organização do ponto de conexão', 16),
('Aterramento', 'aterramento', 'estetica', 1.0, 'Aterramento adequado e conforme normas', 17),
('Quadros Elétricos', 'quadros_eletricos', 'estetica', 1.0, 'Qualidade e organização dos quadros elétricos', 18),
('Imagens Drone', 'imagens_drone', 'estetica', 1.0, 'Documentação fotográfica adequada via drone', 19),
('Limpeza Instalação', 'limpeza_instalacao', 'estetica', 1.0, 'Limpeza geral e organização da área após instalação', 20);

-- ─── Inserir Critérios Complementares (Peso 1.0) ───
INSERT INTO obra_criteria (name, code, category, weight, description, sortOrder) VALUES
('Preenchimento OS Módulos', 'preenchimento_os_modulos', 'complementar', 1.0, 'Ordem de Serviço de Módulos preenchida corretamente', 21),
('Preenchimento OS Inversor', 'preenchimento_os_inversor', 'complementar', 1.0, 'Ordem de Serviço de Inversor preenchida corretamente', 22),
('Eficiência', 'eficiencia', 'complementar', 1.0, 'Eficiência na execução do trabalho', 23),
('NPS Cliente', 'nps_cliente', 'complementar', 1.0, 'Satisfação do cliente (Net Promoter Score)', 24);

-- ─── Criar Índices Adicionais para Performance ───
CREATE INDEX idx_obra_evaluations_projectId_evaluatorId ON obra_evaluations(projectId, evaluatorId);
CREATE INDEX idx_obra_scores_projectId ON obra_scores(projectId);
CREATE INDEX idx_projects_completedDate ON projects(completedDate);

-- ─── Verificação Final ───
SELECT 'Portal Obras criado com sucesso!' AS status;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_criteria FROM obra_criteria;
