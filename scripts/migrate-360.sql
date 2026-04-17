-- ============================================================
-- BANCO: u155320717_esol_360
-- Portal de Avaliação 360° - Grupo E-sol
-- Execute este arquivo no phpMyAdmin selecionando o banco esol_360
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
  CONSTRAINT `users_openId_unique` UNIQUE(`openId`),
  CONSTRAINT `users_email_unique` UNIQUE(`email`)
);

CREATE TABLE IF NOT EXISTS `areas` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `companyName` varchar(255),
  `leaderId` int,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `areas_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `criteria` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(100) NOT NULL,
  `type` enum('base360','detailed360','leadership','obra') NOT NULL,
  `description` text,
  `active` boolean NOT NULL DEFAULT true,
  `sortOrder` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `criteria_id` PRIMARY KEY(`id`),
  CONSTRAINT `criteria_code_unique` UNIQUE(`code`)
);

CREATE TABLE IF NOT EXISTS `cycles` (
  `id` int AUTO_INCREMENT NOT NULL,
  `monthYear` varchar(7) NOT NULL,
  `status` enum('open','closed','published') NOT NULL DEFAULT 'open',
  `startDate` timestamp NULL,
  `deadline360` timestamp NULL,
  `deadlineLeadership` timestamp NULL,
  `closeDate` timestamp NULL,
  `publishDate` timestamp NULL,
  `minOtherAreaEvals` int DEFAULT 5,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `cycles_id` PRIMARY KEY(`id`),
  CONSTRAINT `cycles_monthYear_unique` UNIQUE(`monthYear`)
);

CREATE TABLE IF NOT EXISTS `evaluations` (
  `id` int AUTO_INCREMENT NOT NULL,
  `cycleId` int NOT NULL,
  `evaluatorId` int NOT NULL,
  `evaluateeId` int NOT NULL,
  `relation` enum('same_area','other_area','leadership','self','bottom_up') NOT NULL,
  `items` json,
  `evalStatus` enum('draft','submitted') NOT NULL DEFAULT 'draft',
  `submittedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `evaluations_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `aggregates` (
  `id` int AUTO_INCREMENT NOT NULL,
  `cycleId` int NOT NULL,
  `userId` int NOT NULL,
  `nota360` decimal(5,2),
  `notaLideranca` decimal(5,2),
  `avaliacaoGlobal` decimal(5,2),
  `bonusPontualidade` decimal(8,2) DEFAULT '0',
  `bonusDesempenho` decimal(8,2) DEFAULT '0',
  `bonusPodio` decimal(8,2) DEFAULT '0',
  `totalBonus` decimal(8,2) DEFAULT '0',
  `detailsByCriteria` json,
  `radarData` json,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `aggregates_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `podium` (
  `id` int AUTO_INCREMENT NOT NULL,
  `cycleId` int NOT NULL,
  `userId` int NOT NULL,
  `position` int NOT NULL,
  `avaliacaoGlobal` decimal(5,2),
  `notaLideranca` decimal(5,2),
  `nota360` decimal(5,2),
  `prize` decimal(8,2) DEFAULT '0',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `podium_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `punctuality` (
  `id` int AUTO_INCREMENT NOT NULL,
  `cycleId` int NOT NULL,
  `userId` int NOT NULL,
  `maxDelayDayMin` int DEFAULT 0,
  `totalDelayMonthMin` int DEFAULT 0,
  `eligible` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `punctuality_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `audit_flags` (
  `id` int AUTO_INCREMENT NOT NULL,
  `cycleId` int NOT NULL,
  `evaluatorId` int NOT NULL,
  `evaluateeId` int NOT NULL,
  `flagType` varchar(100) NOT NULL,
  `description` text,
  `resolved` boolean NOT NULL DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `audit_flags_id` PRIMARY KEY(`id`)
);
