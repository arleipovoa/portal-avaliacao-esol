/**
 * ============================================================================
 * Schema do Drizzle ORM - Portal NPS
 * ============================================================================
 * 
 * Tabelas para o módulo de Pesquisa NPS (Net Promoter Score)
 * Banco de dados: portal_nps
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
export const usersNps = mysqlTable(
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
    statusIdx: index("idx_status").on(table.status),
  })
);

// ─── Tabela: Areas ───
export const areasNps = mysqlTable(
  "areas",
  {
    id: int().primaryKey().autoincrement(),
    name: varchar({ length: 255 }).notNull(),
    companyName: varchar({ length: 255 }),
    leaderId: int(),
    status: mysqlEnum(["active", "inactive"]).notNull().default("active"),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    nameIdx: index("idx_name").on(table.name),
    leaderIdIdx: index("idx_leaderId").on(table.leaderId),
  })
);

// ─── Tabela: NPSSurveys ───
export const npsSurveys = mysqlTable(
  "nps_surveys",
  {
    id: int().primaryKey().autoincrement(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    question: text().notNull(),
    createdBy: int().notNull(),
    status: mysqlEnum(["draft", "active", "closed"])
      .notNull()
      .default("draft"),
    startDate: timestamp(),
    endDate: timestamp(),
    targetAudience: json(),
    allowAnonymous: boolean().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    statusIdx: index("idx_status").on(table.status),
    createdByIdx: index("idx_createdBy").on(table.createdBy),
    startDateIdx: index("idx_startDate").on(table.startDate),
  })
);

// ─── Tabela: NPSResponses ───
export const npsResponses = mysqlTable(
  "nps_responses",
  {
    id: int().primaryKey().autoincrement(),
    surveyId: int().notNull(),
    respondentId: int(),
    score: int().notNull(),
    feedback: text(),
    submittedAt: timestamp().notNull().defaultNow(),
  },
  (table) => ({
    surveyIdIdx: index("idx_surveyId").on(table.surveyId),
    respondentIdIdx: index("idx_respondentId").on(table.respondentId),
    scoreIdx: index("idx_score").on(table.score),
    uniqueResponseIdx: uniqueIndex("unique_response").on(
      table.surveyId,
      table.respondentId
    ),
  })
);

// ─── Tabela: NPSAggregates ───
export const npsAggregates = mysqlTable(
  "nps_aggregates",
  {
    id: int().primaryKey().autoincrement(),
    surveyId: int().notNull(),
    totalResponses: int().default(0),
    promoters: int().default(0),
    passives: int().default(0),
    detractors: int().default(0),
    npsScore: decimal({ precision: 6, scale: 2 }),
    averageScore: decimal({ precision: 5, scale: 2 }),
    medianScore: int(),
    lastUpdated: timestamp().notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    uniqueAggIdx: uniqueIndex("unique_agg").on(table.surveyId),
    surveyIdIdx: index("idx_surveyId").on(table.surveyId),
  })
);

// ─── Tabela: NPSPermissions ───
export const npsPermissions = mysqlTable(
  "nps_permissions",
  {
    id: int().primaryKey().autoincrement(),
    surveyId: int().notNull(),
    userId: int().notNull(),
    permission: mysqlEnum(["viewer", "editor", "admin"])
      .notNull()
      .default("viewer"),
    grantedBy: int(),
    grantedAt: timestamp().notNull().defaultNow(),
  },
  (table) => ({
    surveyIdIdx: index("idx_surveyId").on(table.surveyId),
    userIdIdx: index("idx_userId").on(table.userId),
    uniquePermIdx: uniqueIndex("unique_perm").on(table.surveyId, table.userId),
  })
);

// ─── Tabela: NPSAuditLog ───
export const npsAuditLog = mysqlTable(
  "nps_audit_log",
  {
    id: int().primaryKey().autoincrement(),
    surveyId: int().notNull(),
    userId: int(),
    action: varchar({ length: 100 }).notNull(),
    details: json(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => ({
    surveyIdIdx: index("idx_surveyId").on(table.surveyId),
    userIdIdx: index("idx_userId").on(table.userId),
    actionIdx: index("idx_action").on(table.action),
    createdAtIdx: index("idx_createdAt").on(table.createdAt),
  })
);

// ─── Exportar Tipos ───
export type UserNps = typeof usersNps.$inferSelect;
export type AreaNps = typeof areasNps.$inferSelect;
export type NpsSurvey = typeof npsSurveys.$inferSelect;
export type NpsResponse = typeof npsResponses.$inferSelect;
export type NpsAggregate = typeof npsAggregates.$inferSelect;
export type NpsPermission = typeof npsPermissions.$inferSelect;
export type NpsAuditLogEntry = typeof npsAuditLog.$inferSelect;
