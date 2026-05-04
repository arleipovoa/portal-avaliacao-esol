-- ============================================================================
-- Migration: project_assets — link de Drive por projeto (fotos da instalação)
-- Banco: u155320717_esol_obras
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_assets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_code VARCHAR(20) NOT NULL,
  photos_link TEXT,
  drive_folder_id VARCHAR(64),
  permission_status ENUM('public', 'private', 'unknown') DEFAULT 'unknown',
  last_synced_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_assets_project_code (project_code)
);
