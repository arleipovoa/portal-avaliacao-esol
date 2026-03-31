/**
 * ============================================================================
 * Schema do Drizzle ORM - Portal Obras
 * ============================================================================
 * 
 * Tabelas para o módulo de Avaliação de Obras (Instalações e Projetos)
 * Banco de dados: portal_obras
 */

import {
  mysqlTable,
  int,
  varchar,
  text,
  timestamp,
  boolean,
  decimal,
  json,
  enum as mysqlEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";

// ─── Tabela: Users ───
export const usersObras = mysqlTable(
  "users",
  {
    id: int().primaryKey().autoincrement(),
    openId: varchar({ length: 64 }).notNull().unique(),
    name: text(),
    email: varchar({ length: 320 }).unique(),
    loginMethod: varchar({ length: 64 }),
    role: mysqlEnum(["user", "admin"]).notNull().default("user"),
    appRole: mysqlEnum(["admin", "leader", "employee"])
      .notNull()
      .default("employee"),
    jobCategory: mysqlEnum(["administrativo", "operacional"])
      .notNull()
      .default("administrativo"),
    areaId: int(),
    leaderId: int(),
    passwordHash: varchar({ length: 255 }),
    mustChangePassword: boolean().notNull().default(true),
    status: mysqlEnum(["active", "inactive"]).notNull().default("active"),
    secondaryAreaId: int(),
    secondaryLeaderId: int(),
    deactivatedAt: timestamp(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().onUpdateNow(),
    lastSignedIn: timestamp().notNull().defaultNow(),
  },
  (table) => ({
    openIdIdx: uniqueIndex("idx_openId").on(table.openId),
    appRoleIdx: index("idx_appRole").on(table.appRole),
    jobCategoryIdx: index("idx_jobCategory").on(table.jobCategory),
    statusIdx: index("idx_status").on(table.status),
  })
);

// ─── Tabela: Projects ───
export const projects = mysqlTable(
  "projects",
  {
    id: int().primaryKey().autoincrement(),
    code: varchar({ length: 50 }).notNull().unique(),
    clientName: varchar({ length: 255 }).notNull(),
    address: text(),
    city: varchar({ length: 100 }),
    state: varchar({ length: 2 }),
    startDate: timestamp(),
    endDate: timestamp(),
    completedDate: timestamp(),
    moduleCount: int(),
    modulePower: int(),
    powerKwp: decimal({ precision: 8, scale: 2 }),
    category: mysqlEnum(["B1", "B2", "B3", "B4", "B5", "B6", "B7"]),
    status: mysqlEnum(["planning", "in_progress", "completed", "cancelled"])
      .notNull()
      .default("planning"),
    paymentMonth: varchar({ length: 7 }),
    actualDays: int(),
    expectedDaysOverride: int(),
    hasFinancialLoss: boolean().default(false),
    financialLossReason: text(),
    forceMajeureJustification: text(),
    photosLink: text(),
    reportLink: text(),
    nps: decimal({ precision: 5, scale: 2 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    codeIdx: uniqueIndex("idx_code").on(table.code),
    statusIdx: index("idx_status").on(table.status),
    categoryIdx: index("idx_category").on(table.category),
    powerKwpIdx: index("idx_powerKwp").on(table.powerKwp),
    paymentMonthIdx: index("idx_paymentMonth").on(table.paymentMonth),
  })
);

// ─── Tabela: ProjectMembers ───
export const projectMembers = mysqlTable(
  "project_members",
  {
    id: int().primaryKey().autoincrement(),
    projectId: int().notNull(),
    userId: int().notNull(),
    role: mysqlEnum(["leader", "organizer", "installer"])
      .notNull()
      .default("installer"),
    joinedAt: timestamp().notNull().defaultNow(),
    leftAt: timestamp(),
  },
  (table) => ({
    projectIdIdx: index("idx_projectId").on(table.projectId),
    userIdIdx: index("idx_userId").on(table.userId),
    roleIdx: index("idx_role").on(table.role),
    uniqueMemberIdx: uniqueIndex("unique_member").on(
      table.projectId,
      table.userId
    ),
  })
);

// ─── Tabela: ObraCriteria ───
export const obraCriteria = mysqlTable(
  "obra_criteria",
  {
    id: int().primaryKey().autoincrement(),
    name: varchar({ length: 255 }).notNull(),
    code: varchar({ length: 100 }).notNull().unique(),
    category: mysqlEnum([
      "seguranca",
      "funcionalidade",
      "estetica",
      "complementar",
    ]).notNull(),
    weight: decimal({ precision: 3, scale: 1 }).notNull().default(1.0),
    description: text(),
    active: boolean().notNull().default(true),
    sortOrder: int().notNull().default(0),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => ({
    categoryIdx: index("idx_category").on(table.category),
    codeIdx: index("idx_code").on(table.code),
    activeIdx: index("idx_active").on(table.active),
  })
);

// ─── Tabela: ObraEvaluations ───
export const obraEvaluations = mysqlTable(
  "obra_evaluations",
  {
    id: int().primaryKey().autoincrement(),
    projectId: int().notNull(),
    evaluatorId: int().notNull(),
    evaluatedMemberIds: json(),
    items: json(),
    status: mysqlEnum(["draft", "submitted"]).notNull().default("draft"),
    submittedAt: timestamp(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    projectIdIdx: index("idx_projectId").on(table.projectId),
    evaluatorIdIdx: index("idx_evaluatorId").on(table.evaluatorId),
    statusIdx: index("idx_status").on(table.status),
  })
);

// ─── Tabela: ObraScores ───
export const obraScores = mysqlTable(
  "obra_scores",
  {
    id: int().primaryKey().autoincrement(),
    projectId: int().notNull(),
    userId: int().notNull(),
    notaSeguranca: decimal({ precision: 5, scale: 2 }),
    notaFuncionalidade: decimal({ precision: 5, scale: 2 }),
    notaEstetica: decimal({ precision: 5, scale: 2 }),
    mediaOs: decimal({ precision: 5, scale: 2 }),
    eficiencia: decimal({ precision: 5, scale: 2 }),
    npsCliente: decimal({ precision: 5, scale: 2 }),
    notaObraPercentual: decimal({ precision: 6, scale: 2 }),
    bonusValorBase: decimal({ precision: 10, scale: 2 }),
    bonusValorCorrigido: decimal({ precision: 10, scale: 2 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    uniqueScoreIdx: uniqueIndex("unique_score").on(
      table.projectId,
      table.userId
    ),
    projectIdIdx: index("idx_projectId").on(table.projectId),
    userIdIdx: index("idx_userId").on(table.userId),
    notaObraPercentualIdx: index("idx_notaObraPercentual").on(
      table.notaObraPercentual
    ),
  })
);

// ─── Exportar Tipos ───
export type UserObras = typeof usersObras.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type ProjectMember = typeof projectMembers.$inferSelect;
export type ObraCriteria = typeof obraCriteria.$inferSelect;
export type ObraEvaluation = typeof obraEvaluations.$inferSelect;
export type ObraScore = typeof obraScores.$inferSelect;
