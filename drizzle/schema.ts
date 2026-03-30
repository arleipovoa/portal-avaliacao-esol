import { relations } from "drizzle-orm";
import {
  boolean,
  decimal,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ───
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // App-specific fields
  appRole: mysqlEnum("appRole", ["admin", "leader", "employee"]).default("employee").notNull(),
  jobCategory: mysqlEnum("jobCategory", ["administrativo", "operacional"]).default("administrativo").notNull(),
  areaId: int("areaId"),
  leaderId: int("leaderId"),
  passwordHash: varchar("passwordHash", { length: 255 }),
  mustChangePassword: boolean("mustChangePassword").default(true).notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  // Duplo setor (opcional — qualquer colaborador pode pertencer a duas áreas)
  secondaryAreaId: int("secondaryAreaId"),
  secondaryLeaderId: int("secondaryLeaderId"),
  deactivatedAt: timestamp("deactivatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Areas / Companies ───
export const areas = mysqlTable("areas", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  companyName: varchar("companyName", { length: 255 }),
  leaderId: int("leaderId"),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Area = typeof areas.$inferSelect;
export type InsertArea = typeof areas.$inferInsert;

// ─── Evaluation Cycles ───
export const cycles = mysqlTable("cycles", {
  id: int("id").autoincrement().primaryKey(),
  monthYear: varchar("monthYear", { length: 7 }).notNull().unique(), // YYYY-MM
  status: mysqlEnum("status", ["open", "closed", "published"]).default("open").notNull(),
  startDate: timestamp("startDate"),
  deadline360: timestamp("deadline360"),
  deadlineLeadership: timestamp("deadlineLeadership"),
  closeDate: timestamp("closeDate"),
  publishDate: timestamp("publishDate"),
  minOtherAreaEvals: int("minOtherAreaEvals").default(5),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Cycle = typeof cycles.$inferSelect;
export type InsertCycle = typeof cycles.$inferInsert;

// ─── Criteria ───
export const criteria = mysqlTable("criteria", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  type: mysqlEnum("type", ["base360", "detailed360", "leadership", "obra"]).notNull(),
  description: text("description"),
  active: boolean("active").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Criterion = typeof criteria.$inferSelect;
export type InsertCriterion = typeof criteria.$inferInsert;

// ─── Evaluations ───
export const evaluations = mysqlTable("evaluations", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").notNull(),
  evaluatorId: int("evaluatorId").notNull(),
  evaluateeId: int("evaluateeId").notNull(),
  relation: mysqlEnum("relation", ["same_area", "other_area", "leadership", "self", "bottom_up"]).notNull(),
  items: json("items").$type<Array<{ criteriaId: number; score: number; justification: string | null }>>(),
  status: mysqlEnum("evalStatus", ["draft", "submitted"]).default("draft").notNull(),
  submittedAt: timestamp("submittedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Evaluation = typeof evaluations.$inferSelect;
export type InsertEvaluation = typeof evaluations.$inferInsert;

// ─── Aggregates (calculated results per user per cycle) ───
export const aggregates = mysqlTable("aggregates", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").notNull(),
  userId: int("userId").notNull(),
  nota360: decimal("nota360", { precision: 5, scale: 2 }),
  notaLideranca: decimal("notaLideranca", { precision: 5, scale: 2 }),
  avaliacaoGlobal: decimal("avaliacaoGlobal", { precision: 5, scale: 2 }),
  bonusPontualidade: decimal("bonusPontualidade", { precision: 8, scale: 2 }).default("0"),
  bonusDesempenho: decimal("bonusDesempenho", { precision: 8, scale: 2 }).default("0"),
  bonusPodio: decimal("bonusPodio", { precision: 8, scale: 2 }).default("0"),
  totalBonus: decimal("totalBonus", { precision: 8, scale: 2 }).default("0"),
  detailsByCriteria: json("detailsByCriteria").$type<Record<string, { median: number; trimmedMean: number; count: number; stdDev: number }>>(),
  radarData: json("radarData").$type<Record<string, number>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Aggregate = typeof aggregates.$inferSelect;
export type InsertAggregate = typeof aggregates.$inferInsert;

// ─── Punctuality ───
export const punctuality = mysqlTable("punctuality", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").notNull(),
  userId: int("userId").notNull(),
  maxDelayDayMin: int("maxDelayDayMin").default(0),
  totalDelayMonthMin: int("totalDelayMonthMin").default(0),
  eligible: boolean("eligible").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Punctuality = typeof punctuality.$inferSelect;
export type InsertPunctuality = typeof punctuality.$inferInsert;

// ─── Podium ───
export const podium = mysqlTable("podium", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").notNull(),
  userId: int("userId").notNull(),
  position: int("position").notNull(),
  avaliacaoGlobal: decimal("avaliacaoGlobal", { precision: 5, scale: 2 }),
  notaLideranca: decimal("notaLideranca", { precision: 5, scale: 2 }),
  nota360: decimal("nota360", { precision: 5, scale: 2 }),
  prize: decimal("prize", { precision: 8, scale: 2 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PodiumEntry = typeof podium.$inferSelect;
export type InsertPodiumEntry = typeof podium.$inferInsert;

// ─── Audit Flags (anti-panelinha) ───
export const auditFlags = mysqlTable("audit_flags", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").notNull(),
  evaluatorId: int("evaluatorId").notNull(),
  evaluateeId: int("evaluateeId").notNull(),
  flagType: varchar("flagType", { length: 100 }).notNull(),
  description: text("description"),
  resolved: boolean("resolved").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditFlag = typeof auditFlags.$inferSelect;

// ─── Relations ───
export const usersRelations = relations(users, ({ one }) => ({
  area: one(areas, { fields: [users.areaId], references: [areas.id] }),
  leader: one(users, { fields: [users.leaderId], references: [users.id], relationName: "leaderSubordinates" }),
}));

export const areasRelations = relations(areas, ({ one, many }) => ({
  leader: one(users, { fields: [areas.leaderId], references: [users.id] }),
  members: many(users),
}));


// ─── Projects / Works ───
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  completedDate: timestamp("completedDate"),
  moduleCount: int("moduleCount"),
  modulePower: int("modulePower"), // Power in Watts (Wp)
  powerKwp: decimal("powerKwp", { precision: 8, scale: 2 }), // Total power in kWp
  category: mysqlEnum("category", ["B1", "B2", "B3", "B4", "B5", "B6", "B7"]), // Bonus category based on kWp
  status: mysqlEnum("status", ["planning", "in_progress", "completed", "cancelled"]).default("planning").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// ─── Project Members (Installers assigned to works) ───
export const projectMembers = mysqlTable("project_members", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["leader", "organizer", "installer"]).default("installer").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  leftAt: timestamp("leftAt"),
});

export type ProjectMember = typeof projectMembers.$inferSelect;
export type InsertProjectMember = typeof projectMembers.$inferInsert;

// ─── Obra Criteria (Evaluation criteria specific to works) ───
export const obraCriteria = mysqlTable("obra_criteria", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  category: mysqlEnum("category", ["seguranca", "funcionalidade", "estetica", "complementar"]).notNull(),
  weight: decimal("weight", { precision: 3, scale: 1 }).default("1.0").notNull(),
  description: text("description"),
  active: boolean("active").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ObraCriterion = typeof obraCriteria.$inferSelect;
export type InsertObraCriterion = typeof obraCriteria.$inferInsert;

// ─── Obra Evaluations (Individual evaluations of works) ───
export const obraEvaluations = mysqlTable("obra_evaluations", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  evaluatorId: int("evaluatorId").notNull(),
  evaluatedMemberIds: json("evaluatedMemberIds").$type<number[]>(), // Array of user IDs being evaluated
  items: json("items").$type<Array<{ criteriaId: number; score: number; justification?: string }>>(),
  status: mysqlEnum("status", ["draft", "submitted"]).default("draft").notNull(),
  submittedAt: timestamp("submittedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ObraEvaluation = typeof obraEvaluations.$inferSelect;
export type InsertObraEvaluation = typeof obraEvaluations.$inferInsert;

// ─── Obra Scores (Consolidated scores per project) ───
export const obraScores = mysqlTable("obra_scores", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  notaSeguranca: decimal("notaSeguranca", { precision: 5, scale: 2 }), // Security score (0-10)
  notaFuncionalidade: decimal("notaFuncionalidade", { precision: 5, scale: 2 }), // Functionality score (0-10)
  notaEstetica: decimal("notaEstetica", { precision: 5, scale: 2 }), // Aesthetics score (0-10)
  mediaOs: decimal("mediaOs", { precision: 5, scale: 2 }), // Average OS completion (0-10)
  eficiencia: decimal("eficiencia", { precision: 5, scale: 2 }), // Efficiency score (0-10)
  npsCliente: decimal("npsCliente", { precision: 5, scale: 2 }), // Client NPS (0-10)
  notaObraPercentual: decimal("notaObraPercentual", { precision: 6, scale: 2 }), // Final work score (0-100)
  bonusValorBase: decimal("bonusValorBase", { precision: 10, scale: 2 }), // Base bonus value for the work
  bonusValorCorrigido: decimal("bonusValorCorrigido", { precision: 10, scale: 2 }), // Corrected bonus (base × score/100)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ObraScore = typeof obraScores.$inferSelect;
export type InsertObraScore = typeof obraScores.$inferInsert;

// ─── Relations for Projects ───
export const projectsRelations = relations(projects, ({ many }) => ({
  members: many(projectMembers),
  evaluations: many(obraEvaluations),
  scores: many(obraScores),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, { fields: [projectMembers.projectId], references: [projects.id] }),
  user: one(users, { fields: [projectMembers.userId], references: [users.id] }),
}));

export const obraEvaluationsRelations = relations(obraEvaluations, ({ one }) => ({
  project: one(projects, { fields: [obraEvaluations.projectId], references: [projects.id] }),
  evaluator: one(users, { fields: [obraEvaluations.evaluatorId], references: [users.id] }),
}));

export const obraScoresRelations = relations(obraScores, ({ one }) => ({
  project: one(projects, { fields: [obraScores.projectId], references: [projects.id] }),
  user: one(users, { fields: [obraScores.userId], references: [users.id] }),
}));
