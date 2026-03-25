import { and, eq, inArray, ne, or, sql, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  InsertArea, areas,
  InsertCycle, cycles,
  InsertCriterion, criteria,
  InsertEvaluation, evaluations,
  InsertAggregate, aggregates,
  InsertPunctuality, punctuality,
  InsertPodiumEntry, podium,
  auditFlags,
  type User,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);

  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
  if (user.appRole !== undefined) { values.appRole = user.appRole; updateSet.appRole = user.appRole; }
  if (user.areaId !== undefined) { values.areaId = user.areaId; updateSet.areaId = user.areaId; }
  if (user.leaderId !== undefined) { values.leaderId = user.leaderId; updateSet.leaderId = user.leaderId; }
  if (user.passwordHash !== undefined) { values.passwordHash = user.passwordHash; updateSet.passwordHash = user.passwordHash; }
  if (user.mustChangePassword !== undefined) { values.mustChangePassword = user.mustChangePassword; updateSet.mustChangePassword = user.mustChangePassword; }
  if (user.status !== undefined) { values.status = user.status; updateSet.status = user.status; }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers(includeInactive = false) {
  const db = await getDb();
  if (!db) return [];
  if (includeInactive) return db.select().from(users).orderBy(asc(users.name));
  return db.select().from(users).where(eq(users.status, "active")).orderBy(asc(users.name));
}

export async function getUsersByArea(areaId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(and(eq(users.areaId, areaId), eq(users.status, "active"))).orderBy(asc(users.name));
}

export async function getUsersByLeader(leaderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(
    and(
      or(eq(users.leaderId, leaderId), eq(users.secondaryLeaderId, leaderId)),
      eq(users.status, "active")
    )
  ).orderBy(asc(users.name));
}

export async function createAppUser(data: {
  name: string; email: string; passwordHash: string;
  appRole: "admin" | "leader" | "employee"; areaId?: number; leaderId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const openId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  await db.insert(users).values({
    openId,
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    appRole: data.appRole,
    role: data.appRole === "admin" ? "admin" : "user",
    areaId: data.areaId ?? null,
    leaderId: data.leaderId ?? null,
    mustChangePassword: false,
    status: "active",
    loginMethod: "email",
    lastSignedIn: new Date(),
  });
  return getUserByEmail(data.email);
}

export async function updateUserPassword(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ passwordHash, mustChangePassword: false }).where(eq(users.id, userId));
}

export async function updateUser(userId: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function deactivateUser(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ status: "inactive", deactivatedAt: new Date() }).where(eq(users.id, userId));
}

// ─── Areas ───
export async function getAllAreas(includeInactive = false) {
  const db = await getDb();
  if (!db) return [];
  if (includeInactive) return db.select().from(areas).orderBy(asc(areas.name));
  return db.select().from(areas).where(eq(areas.status, "active")).orderBy(asc(areas.name));
}

export async function getAreaById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(areas).where(eq(areas.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createArea(data: InsertArea) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(areas).values(data);
  return result;
}

export async function updateArea(id: number, data: Partial<InsertArea>) {
  const db = await getDb();
  if (!db) return;
  await db.update(areas).set(data).where(eq(areas.id, id));
}

// ─── Cycles ───
export async function getAllCycles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cycles).orderBy(desc(cycles.monthYear));
}

export async function getCurrentCycle() {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(cycles).where(ne(cycles.status, "published")).orderBy(desc(cycles.monthYear)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCycleByMonthYear(monthYear: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(cycles).where(eq(cycles.monthYear, monthYear)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCycle(data: InsertCycle) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(cycles).values(data);
  return getCycleByMonthYear(data.monthYear);
}

export async function updateCycle(id: number, data: Partial<InsertCycle>) {
  const db = await getDb();
  if (!db) return;
  await db.update(cycles).set(data).where(eq(cycles.id, id));
}

// ─── Criteria ───
export async function getAllCriteria() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(criteria).where(eq(criteria.active, true)).orderBy(asc(criteria.sortOrder));
}

export async function seedCriteria(data: InsertCriterion[]) {
  const db = await getDb();
  if (!db) return;
  for (const c of data) {
    await db.insert(criteria).values(c).onDuplicateKeyUpdate({ set: { name: c.name, type: c.type, description: c.description } });
  }
}

// ─── Evaluations ───
export async function getEvaluationsByCycle(cycleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(evaluations).where(eq(evaluations.cycleId, cycleId));
}

export async function getEvaluationsByEvaluator(cycleId: number, evaluatorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(evaluations).where(and(eq(evaluations.cycleId, cycleId), eq(evaluations.evaluatorId, evaluatorId)));
}

export async function getEvaluationsForUser(cycleId: number, evaluateeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(evaluations).where(and(eq(evaluations.cycleId, cycleId), eq(evaluations.evaluateeId, evaluateeId)));
}

export async function upsertEvaluation(data: InsertEvaluation) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(evaluations).where(
    and(
      eq(evaluations.cycleId, data.cycleId),
      eq(evaluations.evaluatorId, data.evaluatorId),
      eq(evaluations.evaluateeId, data.evaluateeId),
      eq(evaluations.relation, data.relation),
    )
  ).limit(1);

  if (existing.length > 0) {
    await db.update(evaluations).set({
      items: data.items,
      status: data.status,
      submittedAt: data.status === "submitted" ? new Date() : null,
    }).where(eq(evaluations.id, existing[0].id));
    return existing[0].id;
  } else {
    const result = await db.insert(evaluations).values({
      ...data,
      submittedAt: data.status === "submitted" ? new Date() : null,
    });
    return Number(result[0].insertId);
  }
}

// ─── Aggregates ───
export async function getAggregatesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aggregates).where(eq(aggregates.userId, userId)).orderBy(desc(aggregates.cycleId));
}

export async function getAggregatesByCycle(cycleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aggregates).where(eq(aggregates.cycleId, cycleId)).orderBy(desc(aggregates.avaliacaoGlobal));
}

export async function upsertAggregate(data: InsertAggregate) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(aggregates).where(
    and(eq(aggregates.cycleId, data.cycleId), eq(aggregates.userId, data.userId))
  ).limit(1);

  if (existing.length > 0) {
    await db.update(aggregates).set(data).where(eq(aggregates.id, existing[0].id));
  } else {
    await db.insert(aggregates).values(data);
  }
}

// ─── Punctuality ───
export async function getPunctualityByCycle(cycleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(punctuality).where(eq(punctuality.cycleId, cycleId));
}

export async function upsertPunctuality(data: InsertPunctuality) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(punctuality).where(
    and(eq(punctuality.cycleId, data.cycleId), eq(punctuality.userId, data.userId))
  ).limit(1);

  if (existing.length > 0) {
    await db.update(punctuality).set(data).where(eq(punctuality.id, existing[0].id));
  } else {
    await db.insert(punctuality).values(data);
  }
}

// ─── Podium ───
export async function getPodiumByCycle(cycleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(podium).where(eq(podium.cycleId, cycleId)).orderBy(asc(podium.position));
}

export async function savePodium(cycleId: number, entries: InsertPodiumEntry[]) {
  const db = await getDb();
  if (!db) return;
  await db.delete(podium).where(eq(podium.cycleId, cycleId));
  if (entries.length > 0) {
    await db.insert(podium).values(entries);
  }
}

// ─── Audit Flags ───
export async function getAuditFlagsByCycle(cycleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditFlags).where(eq(auditFlags.cycleId, cycleId));
}

export async function createAuditFlag(data: { cycleId: number; evaluatorId: number; evaluateeId: number; flagType: string; description: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditFlags).values(data);
}

export async function getAllAggregates() {
  const dbConn = await getDb();
  if (!dbConn) return [];
  return dbConn.select().from(aggregates);
}

export async function getAllEvaluations() {
  const dbConn = await getDb();
  if (!dbConn) return [];
  return dbConn.select().from(evaluations);
}
