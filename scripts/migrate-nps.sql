-- ============================================================
-- BANCO: u155320717_esol_nps
-- Portal NPS - Grupo E-sol
-- Execute este arquivo no phpMyAdmin selecionando o banco esol_nps
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

CREATE TABLE IF NOT EXISTS `nps_surveys` (
  `id` int AUTO_INCREMENT NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `question` text NOT NULL,
  `createdBy` int NOT NULL,
  `status` enum('draft','active','closed') NOT NULL DEFAULT 'draft',
  `startDate` timestamp NULL,
  `endDate` timestamp NULL,
  `targetAudience` json,
  `allowAnonymous` boolean DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `nps_surveys_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `nps_responses` (
  `id` int AUTO_INCREMENT NOT NULL,
  `surveyId` int NOT NULL,
  `respondentId` int,
  `score` int NOT NULL,
  `feedback` text,
  `submittedAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `nps_responses_id` PRIMARY KEY(`id`),
  UNIQUE KEY `unique_response` (`surveyId`, `respondentId`)
);

CREATE TABLE IF NOT EXISTS `nps_aggregates` (
  `id` int AUTO_INCREMENT NOT NULL,
  `surveyId` int NOT NULL,
  `totalResponses` int DEFAULT 0,
  `promoters` int DEFAULT 0,
  `passives` int DEFAULT 0,
  `detractors` int DEFAULT 0,
  `npsScore` decimal(6,2),
  `averageScore` decimal(5,2),
  `medianScore` int,
  `lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `nps_aggregates_id` PRIMARY KEY(`id`),
  UNIQUE KEY `unique_agg` (`surveyId`)
);

CREATE TABLE IF NOT EXISTS `nps_permissions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `surveyId` int NOT NULL,
  `userId` int NOT NULL,
  `permission` enum('viewer','editor','admin') NOT NULL DEFAULT 'viewer',
  `grantedBy` int,
  `grantedAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `nps_permissions_id` PRIMARY KEY(`id`),
  UNIQUE KEY `unique_perm` (`surveyId`, `userId`)
);

CREATE TABLE IF NOT EXISTS `nps_audit_log` (
  `id` int AUTO_INCREMENT NOT NULL,
  `surveyId` int NOT NULL,
  `userId` int,
  `action` varchar(100) NOT NULL,
  `details` json,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `nps_audit_log_id` PRIMARY KEY(`id`)
);
