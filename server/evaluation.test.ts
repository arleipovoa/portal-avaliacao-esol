import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(overrides: Partial<AuthenticatedUser> = {}): TrpcContext {
  const user: AuthenticatedUser = {
    id: 21,
    openId: "local_test_admin",
    email: "arlei@grupoesol.com.br",
    name: "Árlei Póvoa",
    loginMethod: "email",
    role: "admin",
    appRole: "admin",
    areaId: 1,
    leaderId: null,
    passwordHash: "$2a$10$test",
    mustChangePassword: false,
    status: "active",
    deactivatedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

describe("auth.me", () => {
  it("returns null for unauthenticated users", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user data for authenticated users", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeTruthy();
    expect(result?.name).toBe("Árlei Póvoa");
    expect(result?.appRole).toBe("admin");
  });
});

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const clearedCookies: any[] = [];
    const ctx = createMockContext();
    ctx.res = {
      clearCookie: (name: string, options: any) => {
        clearedCookies.push({ name, options });
      },
    } as any;

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});

describe("areas.list", () => {
  it("returns areas for authenticated users", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.areas.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("name");
    expect(result[0]).toHaveProperty("id");
  });
});

describe("users.list", () => {
  it("returns users for authenticated users", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.users.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("name");
    expect(result[0]).toHaveProperty("appRole");
  });
});

describe("cycles.list", () => {
  it("returns cycles for authenticated users", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.cycles.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("monthYear");
    expect(result[0]).toHaveProperty("status");
  });
});

describe("cycles.current", () => {
  it("returns the current open cycle", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.cycles.current();
    expect(result).toBeTruthy();
    expect(result?.monthYear).toBe("2026-03");
    expect(result?.status).toBe("open");
  });
});

describe("criteria.list", () => {
  it("returns all active criteria", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.criteria.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(19); // 3 base + 9 detailed + 7 leadership
    const base = result.filter((c) => c.type === "base360");
    const detailed = result.filter((c) => c.type === "detailed360");
    const leadership = result.filter((c) => c.type === "leadership");
    expect(base.length).toBe(3);
    expect(detailed.length).toBe(9);
    expect(leadership.length).toBe(7);
  });
});

describe("dashboard.myData", () => {
  it("returns dashboard data for authenticated user", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dashboard.myData();
    expect(result).toHaveProperty("cycle");
    expect(result).toHaveProperty("annualBonus");
    expect(result).toHaveProperty("evalProgress");
    expect(result.annualBonus).toBeGreaterThanOrEqual(0);
  });
});

describe("admin.bonusSummary", () => {
  it("returns bonus summary for admin", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.bonusSummary({});
    expect(result).toHaveProperty("annual");
    expect(result.annual).toHaveProperty("totalGeral");
    expect(result.annual.totalGeral).toBeGreaterThanOrEqual(0);
  });

  it("rejects non-admin users", async () => {
    const ctx = createMockContext({ role: "user", appRole: "employee" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.bonusSummary({})).rejects.toThrow();
  });
});

describe("evaluations.getForm", () => {
  it("returns correct criteria for same_area relation", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const cycle = await caller.cycles.current();
    if (!cycle) return;

    const result = await caller.evaluations.getForm({
      cycleId: cycle.id,
      evaluateeId: 22, // some user
      relation: "same_area",
    });
    expect(result).toHaveProperty("criteria");
    expect(result.criteria.length).toBe(12); // 3 base + 9 detailed
  });

  it("returns correct criteria for other_area relation", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const cycle = await caller.cycles.current();
    if (!cycle) return;

    const result = await caller.evaluations.getForm({
      cycleId: cycle.id,
      evaluateeId: 22,
      relation: "other_area",
    });
    expect(result).toHaveProperty("criteria");
    expect(result.criteria.length).toBe(3); // 3 base only
  });

  it("returns correct criteria for leadership relation", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const cycle = await caller.cycles.current();
    if (!cycle) return;

    const result = await caller.evaluations.getForm({
      cycleId: cycle.id,
      evaluateeId: 22,
      relation: "leadership",
    });
    expect(result).toHaveProperty("criteria");
    expect(result.criteria.length).toBe(7); // 7 leadership
  });
});

describe("shared types and constants", () => {
  it("RADAR_CATEGORIES has 5 categories", async () => {
    const { RADAR_CATEGORIES } = await import("../shared/types");
    expect(RADAR_CATEGORIES.length).toBe(5);
  });

  it("PODIUM_PRIZES has correct values", async () => {
    const { PODIUM_PRIZES } = await import("../shared/types");
    expect(PODIUM_PRIZES[1]).toBe(100);
    expect(PODIUM_PRIZES[2]).toBe(50);
    expect(PODIUM_PRIZES[3]).toBe(25);
  });

  it("BONUS constants are correct", async () => {
    const { BONUS_PERFORMANCE_MAX, BONUS_PUNCTUALITY_MAX, PERFORMANCE_CUTOFF } = await import("../shared/types");
    expect(BONUS_PERFORMANCE_MAX).toBe(125);
    expect(BONUS_PUNCTUALITY_MAX).toBe(125);
    expect(PERFORMANCE_CUTOFF).toBe(7);
  });
});
