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
	`type` enum('base360','detailed360','leadership') NOT NULL,
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
ALTER TABLE `users` ADD `appRole` enum('admin','leader','employee') DEFAULT 'employee' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `areaId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `leaderId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `mustChangePassword` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `status` enum('active','inactive') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `deactivatedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);