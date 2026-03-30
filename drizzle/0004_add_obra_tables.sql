-- Migration: Add Obra (Works) Tables
-- Description: Create tables to support the Obra (Works) evaluation module
-- Date: 2026-03-30

-- ─── Projects / Works ───
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  clientName VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  startDate TIMESTAMP,
  endDate TIMESTAMP,
  completedDate TIMESTAMP,
  moduleCount INT,
  modulePower INT COMMENT 'Power in Watts (Wp)',
  powerKwp DECIMAL(8, 2) COMMENT 'Total power in kWp',
  category ENUM('B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7') COMMENT 'Bonus category based on kWp',
  status ENUM('planning', 'in_progress', 'completed', 'cancelled') DEFAULT 'planning',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── Project Members (Installers assigned to works) ───
CREATE TABLE IF NOT EXISTS project_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  projectId INT NOT NULL,
  userId INT NOT NULL,
  role ENUM('leader', 'organizer', 'installer') DEFAULT 'installer' COMMENT 'Role in the project',
  joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  leftAt TIMESTAMP,
  FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_project_member (projectId, userId)
);

-- ─── Obra Criteria (Evaluation criteria specific to works) ───
CREATE TABLE IF NOT EXISTS obra_criteria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL UNIQUE,
  category ENUM('seguranca', 'funcionalidade', 'estetica', 'complementar') NOT NULL,
  weight DECIMAL(3, 1) DEFAULT 1.0 COMMENT 'Weight for calculation (2.0, 1.0, etc)',
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  sortOrder INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Obra Evaluations (Individual evaluations of works) ───
CREATE TABLE IF NOT EXISTS obra_evaluations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  projectId INT NOT NULL,
  evaluatorId INT NOT NULL,
  evaluatedMemberIds JSON COMMENT 'Array of user IDs being evaluated',
  items JSON COMMENT 'Array of {criteriaId, score (0-10), justification}',
  status ENUM('draft', 'submitted') DEFAULT 'draft',
  submittedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (evaluatorId) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── Obra Scores (Consolidated scores per project) ───
CREATE TABLE IF NOT EXISTS obra_scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  projectId INT NOT NULL,
  userId INT NOT NULL,
  notaSeguranca DECIMAL(5, 2) COMMENT 'Security score (0-10)',
  notaFuncionalidade DECIMAL(5, 2) COMMENT 'Functionality score (0-10)',
  notaEstetica DECIMAL(5, 2) COMMENT 'Aesthetics score (0-10)',
  mediaOs DECIMAL(5, 2) COMMENT 'Average OS completion (0-10)',
  eficiencia DECIMAL(5, 2) COMMENT 'Efficiency score (0-10)',
  npsCliente DECIMAL(5, 2) COMMENT 'Client NPS (0-10)',
  notaObraPercentual DECIMAL(6, 2) COMMENT 'Final work score (0-100)',
  bonusValorBase DECIMAL(10, 2) COMMENT 'Base bonus value for the work',
  bonusValorCorrigido DECIMAL(10, 2) COMMENT 'Corrected bonus (base × score/100)',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_project_user_score (projectId, userId)
);

-- ─── Indexes for performance ───
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_project_members_user ON project_members(userId);
CREATE INDEX idx_project_members_project ON project_members(projectId);
CREATE INDEX idx_obra_evaluations_project ON obra_evaluations(projectId);
CREATE INDEX idx_obra_evaluations_evaluator ON obra_evaluations(evaluatorId);
CREATE INDEX idx_obra_scores_project ON obra_scores(projectId);
CREATE INDEX idx_obra_scores_user ON obra_scores(userId);
