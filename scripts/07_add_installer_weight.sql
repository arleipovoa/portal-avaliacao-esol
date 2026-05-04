-- Adiciona coluna de peso individual para cálculo proporcional de bônus
-- Executar no banco: u155320717_esol_obras (phpMyAdmin)

ALTER TABLE installers
  ADD COLUMN weight VARCHAR(4) NOT NULL DEFAULT '1.0'
  AFTER role;

-- Pesos conforme planilha "Valores Bonificação Instalação.xlsx" (row 1000):
-- 1.2 = Líder de Equipe
-- 1.1 = Instalador 1
-- 1.0 = Auxiliar de Instalação
-- 0.5 = Backend (Projeto, Material, Planejamento)

UPDATE installers SET weight = '1.2' WHERE name IN ('Elivelton', 'Gustavo G.', 'Élder', 'Elder');
UPDATE installers SET weight = '1.1' WHERE name IN ('Fábio', 'Hyan', 'Gustavo P.', 'Flávio', 'Ley');
UPDATE installers SET weight = '1.0' WHERE name IN ('Moisés', 'Gabriel M.', 'Kauã', 'Enderson');
UPDATE installers SET weight = '0.5' WHERE name IN ('Gabriel T.', 'Material', 'Projeto', 'Projetos', 'Planejamento');

-- Adiciona a conta "Planejamento" se ainda não existir
INSERT IGNORE INTO installers (name, status, role, weight) VALUES ('Planejamento', 'active', 'conta', '0.5');
