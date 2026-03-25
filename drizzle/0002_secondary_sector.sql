-- Migração: suporte a duplo setor (opcional para qualquer colaborador)
ALTER TABLE `users`
  ADD COLUMN `secondaryAreaId` INT DEFAULT NULL,
  ADD COLUMN `secondaryLeaderId` INT DEFAULT NULL;
