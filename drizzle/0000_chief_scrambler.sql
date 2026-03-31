CREATE TABLE `aggregates` (
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
--> statement-breakpoint
CREATE TABLE `areas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`companyName` varchar(255),
	`leaderId` int,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `areas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_flags` (
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
--> statement-breakpoint
CREATE TABLE `criteria` (
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
--> statement-breakpoint
CREATE TABLE `cycles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`monthYear` varchar(7) NOT NULL,
	`status` enum('open','closed','published') NOT NULL DEFAULT 'open',
	`startDate` timestamp,
	`deadline360` timestamp,
	`deadlineLeadership` timestamp,
	`closeDate` timestamp,
	`publishDate` timestamp,
	`minOtherAreaEvals` int DEFAULT 5,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cycles_id` PRIMARY KEY(`id`),
	CONSTRAINT `cycles_monthYear_unique` UNIQUE(`monthYear`)
);
--> statement-breakpoint
CREATE TABLE `evaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`evaluatorId` int NOT NULL,
	`evaluateeId` int NOT NULL,
	`relation` enum('same_area','other_area','leadership','self','bottom_up') NOT NULL,
	`items` json,
	`evalStatus` enum('draft','submitted') NOT NULL DEFAULT 'draft',
	`submittedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evaluations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `obra_criteria` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(100) NOT NULL,
	`category` enum('seguranca','funcionalidade','estetica','complementar') NOT NULL,
	`weight` decimal(3,1) NOT NULL DEFAULT '1.0',
	`description` text,
	`active` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `obra_criteria_id` PRIMARY KEY(`id`),
	CONSTRAINT `obra_criteria_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `obra_evaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`evaluatorId` int NOT NULL,
	`evaluatedMemberIds` json,
	`items` json,
	`status` enum('draft','submitted') NOT NULL DEFAULT 'draft',
	`submittedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `obra_evaluations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `obra_scores` (
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
	CONSTRAINT `obra_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `podium` (
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
--> statement-breakpoint
CREATE TABLE `project_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('leader','organizer','installer') NOT NULL DEFAULT 'installer',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`leftAt` timestamp,
	CONSTRAINT `project_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`address` text,
	`city` varchar(100),
	`state` varchar(2),
	`startDate` timestamp,
	`endDate` timestamp,
	`completedDate` timestamp,
	`moduleCount` int,
	`modulePower` int,
	`powerKwp` decimal(8,2),
	`category` enum('B1','B2','B3','B4','B5','B6','B7'),
	`status` enum('planning','in_progress','completed','cancelled') NOT NULL DEFAULT 'planning',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `projects_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `punctuality` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`userId` int NOT NULL,
	`maxDelayDayMin` int DEFAULT 0,
	`totalDelayMonthMin` int DEFAULT 0,
	`eligible` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `punctuality_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
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
	`passwordHash` varchar(255),
	`mustChangePassword` boolean NOT NULL DEFAULT true,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`secondaryAreaId` int,
	`secondaryLeaderId` int,
	`deactivatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
