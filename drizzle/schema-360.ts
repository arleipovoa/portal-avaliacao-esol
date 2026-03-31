/**
 * ============================================================================
 * Schema do Drizzle ORM - Portal 360°
 * ============================================================================
 * 
 * Tabelas para o módulo de Avaliação 360° (Desempenho e Comportamento)
 * Banco de dados: portal_360
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
export const users360 = mysqlTable(
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
    areaIdIdx: index("idx_areaId").on(table.areaId),
    leaderIdIdx: index("idx_leaderId").on(table.leaderId),
    statusIdx: index("idx_status").on(table.status),
  })
);

// ─── Tabela: Areas ───
export const areas360 = mysqlTable(
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

// ─── Tabela: Cycles ───
export const cycles360 = mysqlTable(
  "cycles",
  {
    id: int().primaryKey().autoincrement(),
    monthYear: varchar({ length: 7 }).notNull().unique(),
    status: mysqlEnum(["open", "closed", "published"])
      .notNull()
      .default("open"),
    startDate: timestamp(),
    deadline360: timestamp(),
    deadlineLeadership: timestamp(),
    closeDate: timestamp(),
    publishDate: timestamp(),
    minOtherAreaEvals: int().default(5),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    monthYearIdx: uniqueIndex("idx_monthYear").on(table.monthYear),
    statusIdx: index("idx_status").on(table.status),
  })
);

// ─── Tabela: Criteria360 ───
export const criteria360 = mysqlTable(
  "criteria_360",
  {
    id: int().primaryKey().autoincrement(),
    name: varchar({ length: 255 }).notNull(),
    code: varchar({ length: 100 }).notNull().unique(),
    type: mysqlEnum(["base360", "detailed360", "leadership"]).notNull(),
    description: text(),
    active: boolean().notNull().default(true),
    sortOrder: int().notNull().default(0),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => ({
    typeIdx: index("idx_type").on(table.type),
    codeIdx: index("idx_code").on(table.code),
    activeIdx: index("idx_active").on(table.active),
  })
);

// ─── Tabela: Evaluations360 ───
export const evaluations360 = mysqlTable(
  "evaluations_360",
  {
    id: int().primaryKey().autoincrement(),
    cycleId: int().notNull(),
    evaluatorId: int().notNull(),
    evaluateeId: int().notNull(),
    relation: mysqlEnum([
      "same_area",
      "other_area",
      "leadership",
      "self",
      "bottom_up",
    ]).notNull(),
    items: json(),
    status: mysqlEnum(["draft", "submitted"]).notNull().default("draft"),
    submittedAt: timestamp(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    cycleIdIdx: index("idx_cycleId").on(table.cycleId),
    evaluatorIdIdx: index("idx_evaluatorId").on(table.evaluatorId),
    evaluateeIdIdx: index("idx_evaluateeId").on(table.evaluateeId),
    statusIdx: index("idx_status").on(table.status),
    uniqueEvalIdx: uniqueIndex("unique_eval").on(
      table.cycleId,
      table.evaluatorId,
      table.evaluateeId,
      table.relation
    ),
  })
);

// ─── Tabela: Aggregates360 ───
export const aggregates360 = mysqlTable(
  "aggregates_360",
  {
    id: int().primaryKey().autoincrement(),
    cycleId: int().notNull(),
    userId: int().notNull(),
    nota360: decimal({ precision: 5, scale: 2 }),
    notaLideranca: decimal({ precision: 5, scale: 2 }),
    avaliacaoGlobal: decimal({ precision: 5, scale: 2 }),
    bonusPontualidade: decimal({ precision: 8, scale: 2 }).default(0),
    bonusDesempenho: decimal({ precision: 8, scale: 2 }).default(0),
    totalBonus: decimal({ precision: 8, scale: 2 }).default(0),
    detailsByCriteria: json(),
    radarData: json(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    uniqueAggIdx: uniqueIndex("unique_agg").on(table.cycleId, table.userId),
    cycleIdIdx: index("idx_cycleId").on(table.cycleId),
    userIdIdx: index("idx_userId").on(table.userId),
  })
);

// ─── Tabela: Punctuality ───
export const punctuality360 = mysqlTable(
  "punctuality",
  {
    id: int().primaryKey().autoincrement(),
    cycleId: int().notNull(),
    userId: int().notNull(),
    maxDelayDayMin: int().default(0),
    totalDelayMonthMin: int().default(0),
    eligible: boolean().notNull().default(true),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => ({
    uniquePunctIdx: uniqueIndex("unique_punct").on(table.cycleId, table.userId),
    cycleIdIdx: index("idx_cycleId").on(table.cycleId),
    userIdIdx: index("idx_userId").on(table.userId),
  })
);

// ─── Tabela: Podium ───
export const podium360 = mysqlTable(
  "podium",
  {
    id: int().primaryKey().autoincrement(),
    cycleId: int().notNull(),
    userId: int().notNull(),
    position: int().notNull(),
    avaliacaoGlobal: decimal({ precision: 5, scale: 2 }),
    notaLideranca: decimal({ precision: 5, scale: 2 }),
    nota360: decimal({ precision: 5, scale: 2 }),
    prize: decimal({ precision: 8, scale: 2 }).default(0),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => ({
    uniquePodiumIdx: uniqueIndex("unique_podium").on(
      table.cycleId,
      table.userId
    ),
    cycleIdIdx: index("idx_cycleId").on(table.cycleId),
    userIdIdx: index("idx_userId").on(table.userId),
    positionIdx: index("idx_position").on(table.position),
  })
);

// ─── Tabela: AuditFlags360 ───
export const auditFlags360 = mysqlTable(
  "audit_flags_360",
  {
    id: int().primaryKey().autoincrement(),
    cycleId: int().notNull(),
    evaluatorId: int().notNull(),
    evaluateeId: int().notNull(),
    flagType: varchar({ length: 100 }).notNull(),
    description: text(),
    resolved: boolean().notNull().default(false),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => ({
    cycleIdIdx: index("idx_cycleId").on(table.cycleId),
    evaluatorIdIdx: index("idx_evaluatorId").on(table.evaluatorId),
    evaluateeIdIdx: index("idx_evaluateeId").on(table.evaluateeId),
    flagTypeIdx: index("idx_flagType").on(table.flagType),
  })
);

// ─── Exportar Tipos ───
export type User360 = typeof users360.$inferSelect;
export type Area360 = typeof areas360.$inferSelect;
export type Cycle360 = typeof cycles360.$inferSelect;
export type Criteria360 = typeof criteria360.$inferSelect;
export type Evaluation360 = typeof evaluations360.$inferSelect;
export type Aggregate360 = typeof aggregates360.$inferSelect;
export type Punctuality360 = typeof punctuality360.$inferSelect;
export type Podium360 = typeof podium360.$inferSelect;
export type AuditFlag360 = typeof auditFlags360.$inferSelect;
