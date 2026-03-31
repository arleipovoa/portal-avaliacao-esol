-- Migração: Adicionar tipo "obra" ao enum de critérios para Avaliação de Obras
ALTER TABLE `criteria`
  MODIFY COLUMN `type` ENUM('base360', 'detailed360', 'leadership', 'obra') NOT NULL;

-- Inserir critérios de Avaliação de Obras
INSERT INTO `criteria` (`name`, `code`, `type`, `description`, `active`, `sortOrder`) VALUES
  ('Uso de EPIs', 'OBRA_EPI', 'obra', 'Cumprimento e uso correto de Equipamentos de Proteção Individual', 1, 1),
  ('5S - Organização e Limpeza', 'OBRA_5S', 'obra', 'Manutenção da organização, limpeza e segurança do canteiro de obras', 1, 2),
  ('Qualidade da Montagem', 'OBRA_QUALIDADE', 'obra', 'Precisão e qualidade na montagem de equipamentos e estruturas', 1, 3),
  ('Segurança no Trabalho', 'OBRA_SEGURANCA', 'obra', 'Cumprimento de normas de segurança e procedimentos preventivos', 1, 4),
  ('Pontualidade e Produtividade', 'OBRA_PRODUTIVIDADE', 'obra', 'Cumprimento de prazos e eficiência na execução das atividades', 1, 5);
