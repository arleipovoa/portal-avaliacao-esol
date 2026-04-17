-- ============================================================
-- BANCO: u155320717_esol_obras
-- Portal de Avaliação de Obras - Grupo E-sol
-- Execute este arquivo no phpMyAdmin selecionando o banco esol_obras
-- ============================================================

CREATE TABLE IF NOT EXISTS `users` (
  `id` int AUTO_INCREMENT NOT NULL,
  `openId` varchar(64) NOT NULL,
  `name` text,
  `email` varchar(320),
  `loginMethod` varchar(64),
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `appRole` enum('admin','leader','employee') NOT NULL DEFAULT 'employee',
  `jobCategory` enum('administrativo','operacional') NOT NULL DEFAULT 'administrativo',
  `areaId` int,
  `leaderId` int,
  `secondaryAreaId` int,
  `secondaryLeaderId` int,
  `passwordHash` varchar(255),
  `mustChangePassword` boolean NOT NULL DEFAULT true,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `deactivatedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `users_id` PRIMARY KEY(`id`),
  UNIQUE KEY `idx_openId` (`openId`),
  UNIQUE KEY `users_email_unique` (`email`)
);

CREATE TABLE IF NOT EXISTS `projects` (
  `id` int AUTO_INCREMENT NOT NULL,
  `code` varchar(50) NOT NULL,
  `clientName` varchar(255) NOT NULL,
  `address` text,
  `city` varchar(100),
  `state` varchar(2),
  `startDate` timestamp NULL,
  `endDate` timestamp NULL,
  `completedDate` timestamp NULL,
  `moduleCount` int,
  `modulePower` int,
  `powerKwp` decimal(8,2),
  `category` enum('B1','B2','B3','B4','B5','B6','B7'),
  `status` enum('planning','in_progress','completed','cancelled') NOT NULL DEFAULT 'planning',
  `paymentMonth` varchar(7),
  `actualDays` int,
  `expectedDaysOverride` int,
  `hasFinancialLoss` boolean DEFAULT false,
  `financialLossReason` text,
  `forceMajeureJustification` text,
  `photosLink` text,
  `reportLink` text,
  `nps` decimal(5,2),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `projects_id` PRIMARY KEY(`id`),
  UNIQUE KEY `idx_code` (`code`)
);

CREATE TABLE IF NOT EXISTS `project_members` (
  `id` int AUTO_INCREMENT NOT NULL,
  `projectId` int NOT NULL,
  `userId` int NOT NULL,
  `role` enum('leader','organizer','installer') NOT NULL DEFAULT 'installer',
  `joinedAt` timestamp NOT NULL DEFAULT (now()),
  `leftAt` timestamp NULL,
  CONSTRAINT `project_members_id` PRIMARY KEY(`id`),
  UNIQUE KEY `unique_member` (`projectId`, `userId`)
);

CREATE TABLE IF NOT EXISTS `obra_criteria` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(100) NOT NULL,
  `category` enum('seguranca','funcionalidade','estetica','complementar') NOT NULL,
  `weight` decimal(3,1) NOT NULL DEFAULT 1.0,
  `description` text,
  `active` boolean NOT NULL DEFAULT true,
  `sortOrder` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `obra_criteria_id` PRIMARY KEY(`id`),
  UNIQUE KEY `idx_code` (`code`)
);

CREATE TABLE IF NOT EXISTS `obra_evaluations` (
  `id` int AUTO_INCREMENT NOT NULL,
  `projectId` int NOT NULL,
  `evaluatorId` int NOT NULL,
  `evaluatedMemberIds` json,
  `items` json,
  `status` enum('draft','submitted') NOT NULL DEFAULT 'draft',
  `submittedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `obra_evaluations_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `obra_scores` (
  `id` int AUTO_INCREMENT NOT NULL,
  `projectId` int NOT NULL,
  `userId` int NOT NULL,
  `notaSeguranca` decimal(5,2),
  `notaFuncionalidade` decimal(5,2),
  `notaEstetica` decimal(5,2),
  `mediaOs` decimal(5,2),
  `eficiencia` decimal(5,2),
  `npsCliente` decimal(5,2),
  `notaObraPercentual` decimal(6,2),
  `bonusValorBase` decimal(10,2),
  `bonusValorCorrigido` decimal(10,2),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `obra_scores_id` PRIMARY KEY(`id`),
  UNIQUE KEY `unique_score` (`projectId`, `userId`)
);
