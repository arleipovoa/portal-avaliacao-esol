-- ============================================================================
-- PORTAL NPS - Pesquisa de Satisfação do Cliente
-- ============================================================================
-- Este script cria o banco de dados e todas as tabelas necessárias para o
-- sistema de NPS (Net Promoter Score) - pesquisa de satisfação contínua

-- ─── Criar Banco de Dados ───
CREATE DATABASE IF NOT EXISTS portal_nps
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE portal_nps;

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
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Tabela: Areas ───
-- Áreas/Setores da empresa (para controle de acesso)
CREATE TABLE IF NOT EXISTS areas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  companyName VARCHAR(255),
  leaderId INT,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  FOREIGN KEY (leaderId) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Tabela: NPSSurveys ───
-- Pesquisas/Campanhas NPS
CREATE TABLE IF NOT EXISTS nps_surveys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  question TEXT NOT NULL COMMENT 'Pergunta principal do NPS',
  createdBy INT NOT NULL COMMENT 'Usuário que criou a pesquisa',
  status ENUM('draft', 'active', 'closed') NOT NULL DEFAULT 'draft',
  startDate TIMESTAMP NULL,
  endDate TIMESTAMP NULL,
  targetAudience JSON COMMENT 'Array de IDs de usuários ou áreas alvo',
  allowAnonymous BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_createdBy (createdBy),
  INDEX idx_startDate (startDate),
  FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Tabela: NPSResponses ───
-- Respostas individuais de NPS
CREATE TABLE IF NOT EXISTS nps_responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  surveyId INT NOT NULL,
  respondentId INT COMMENT 'Null se anônimo',
  score INT NOT NULL COMMENT 'Nota de 0-10',
  feedback TEXT COMMENT 'Feedback adicional do respondente',
  submittedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_surveyId (surveyId),
  INDEX idx_respondentId (respondentId),
  INDEX idx_score (score),
  UNIQUE KEY unique_response (surveyId, respondentId),
  FOREIGN KEY (surveyId) REFERENCES nps_surveys(id) ON DELETE CASCADE,
  FOREIGN KEY (respondentId) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Tabela: NPSAggregates ───
-- Estatísticas consolidadas por pesquisa
CREATE TABLE IF NOT EXISTS nps_aggregates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  surveyId INT NOT NULL,
  totalResponses INT DEFAULT 0,
  promoters INT DEFAULT 0 COMMENT 'Respostas 9-10',
  passives INT DEFAULT 0 COMMENT 'Respostas 7-8',
  detractors INT DEFAULT 0 COMMENT 'Respostas 0-6',
  npsScore DECIMAL(6,2) COMMENT 'NPS = (Promoters - Detractors) / Total * 100',
  averageScore DECIMAL(5,2) COMMENT 'Média aritmética das notas',
  medianScore INT COMMENT 'Mediana das notas',
  lastUpdated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_agg (surveyId),
  INDEX idx_surveyId (surveyId),
  FOREIGN KEY (surveyId) REFERENCES nps_surveys(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Tabela: NPSPermissions ───
-- Controle de acesso (quem pode editar/visualizar)
CREATE TABLE IF NOT EXISTS nps_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  surveyId INT NOT NULL,
  userId INT NOT NULL,
  permission ENUM('viewer', 'editor', 'admin') NOT NULL DEFAULT 'viewer',
  grantedBy INT,
  grantedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_surveyId (surveyId),
  INDEX idx_userId (userId),
  UNIQUE KEY unique_perm (surveyId, userId),
  FOREIGN KEY (surveyId) REFERENCES nps_surveys(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (grantedBy) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Tabela: NPSAuditLog ───
-- Log de auditoria (quem fez o quê e quando)
CREATE TABLE IF NOT EXISTS nps_audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  surveyId INT NOT NULL,
  userId INT,
  action VARCHAR(100) NOT NULL COMMENT 'create, update, delete, response_submitted, etc',
  details JSON,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_surveyId (surveyId),
  INDEX idx_userId (userId),
  INDEX idx_action (action),
  INDEX idx_createdAt (createdAt),
  FOREIGN KEY (surveyId) REFERENCES nps_surveys(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Criar Índices Adicionais para Performance ───
CREATE INDEX idx_nps_responses_surveyId_score ON nps_responses(surveyId, score);
CREATE INDEX idx_nps_responses_submittedAt ON nps_responses(submittedAt);
CREATE INDEX idx_nps_surveys_status_startDate ON nps_surveys(status, startDate);

-- ─── Criar Triggers para Atualizar Agregados ───
DELIMITER //

-- Trigger para atualizar agregados quando uma resposta é inserida
CREATE TRIGGER nps_update_aggregates_on_insert
AFTER INSERT ON nps_responses
FOR EACH ROW
BEGIN
  DECLARE v_total INT;
  DECLARE v_promoters INT;
  DECLARE v_passives INT;
  DECLARE v_detractors INT;
  DECLARE v_avg DECIMAL(5,2);
  DECLARE v_median INT;
  
  -- Contar respostas por categoria
  SELECT 
    COUNT(*),
    SUM(CASE WHEN score >= 9 THEN 1 ELSE 0 END),
    SUM(CASE WHEN score >= 7 AND score <= 8 THEN 1 ELSE 0 END),
    SUM(CASE WHEN score <= 6 THEN 1 ELSE 0 END),
    AVG(score)
  INTO v_total, v_promoters, v_passives, v_detractors, v_avg
  FROM nps_responses
  WHERE surveyId = NEW.surveyId;
  
  -- Calcular mediana
  SELECT score INTO v_median
  FROM nps_responses
  WHERE surveyId = NEW.surveyId
  ORDER BY score
  LIMIT 1 OFFSET (v_total DIV 2);
  
  -- Inserir ou atualizar agregados
  INSERT INTO nps_aggregates (surveyId, totalResponses, promoters, passives, detractors, npsScore, averageScore, medianScore)
  VALUES (NEW.surveyId, v_total, v_promoters, v_passives, v_detractors, 
          ((v_promoters - v_detractors) / v_total * 100), v_avg, v_median)
  ON DUPLICATE KEY UPDATE
    totalResponses = v_total,
    promoters = v_promoters,
    passives = v_passives,
    detractors = v_detractors,
    npsScore = ((v_promoters - v_detractors) / v_total * 100),
    averageScore = v_avg,
    medianScore = v_median,
    lastUpdated = CURRENT_TIMESTAMP;
END //

-- Trigger para registrar ações de criação de pesquisa
CREATE TRIGGER nps_audit_survey_create
AFTER INSERT ON nps_surveys
FOR EACH ROW
BEGIN
  INSERT INTO nps_audit_log (surveyId, userId, action, details)
  VALUES (NEW.id, NEW.createdBy, 'create', JSON_OBJECT('title', NEW.title, 'status', NEW.status));
END //

-- Trigger para registrar respostas
CREATE TRIGGER nps_audit_response_submit
AFTER INSERT ON nps_responses
FOR EACH ROW
BEGIN
  INSERT INTO nps_audit_log (surveyId, userId, action, details)
  VALUES (NEW.surveyId, NEW.respondentId, 'response_submitted', JSON_OBJECT('score', NEW.score));
END //

DELIMITER ;

-- ─── Verificação Final ───
SELECT 'Portal NPS criado com sucesso!' AS status;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_surveys FROM nps_surveys;
