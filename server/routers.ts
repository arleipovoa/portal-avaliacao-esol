import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import * as db from "./db";
import { sdk } from "./_core/sdk";
import {
  BONUS_PERFORMANCE_MAX, BONUS_PUNCTUALITY_MAX, PERFORMANCE_CUTOFF,
  PODIUM_PRIZES, CRITERIA_TO_RADAR, RADAR_CATEGORIES,
} from "@shared/types";

// ─── Leader procedure ───
const leaderProcedure = protectedProcedure.use(async (opts) => {
  const { ctx, next } = opts;
  if (ctx.user.appRole !== "leader" && ctx.user.appRole !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a líderes e admins." });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  // ─── Auth ───
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserByEmail(input.email.toLowerCase().trim());
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha inválidos." });
        }
        if (user.status === "inactive") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Usuário desativado." });
        }
        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha inválidos." });
        }
        // Create session
        const token = await sdk.createSessionToken(user.openId, { name: user.name || "" });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });
        await db.updateUser(user.id, { lastSignedIn: new Date() });
        return {
          success: true,
          mustChangePassword: user.mustChangePassword,
          user: { id: user.id, name: user.name, email: user.email, appRole: user.appRole },
        };
      }),
    changePassword: protectedProcedure
      .input(z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(6) }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user || !user.passwordHash) throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário inválido." });
        const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Senha atual incorreta." });
        const hash = await bcrypt.hash(input.newPassword, 10);
        await db.updateUserPassword(user.id, hash);
        return { success: true };
      }),

    // Registro de 1º acesso pelo próprio colaborador
    register: publicProcedure
      .input(z.object({
        name: z.string().min(2, "Nome muito curto"),
        email: z.string().email("E-mail inválido"),
        password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
      }))
      .mutation(async ({ input }) => {
        const existing = await db.getUserByEmail(input.email.toLowerCase().trim());
        if (existing) {
          // Se já existe mas está pendente de aprovação, informa
          if ((existing as any).approvalStatus === "pending") {
            throw new TRPCError({ code: "CONFLICT", message: "Cadastro já enviado. Aguarde a aprovação do administrador." });
          }
          throw new TRPCError({ code: "CONFLICT", message: "E-mail já cadastrado. Faça login normalmente." });
        }
        const hash = await bcrypt.hash(input.password, 10);
        await db.createPendingUser({
          name: input.name,
          email: input.email.toLowerCase().trim(),
          passwordHash: hash,
        });
        return { success: true };
      }),

    // Admin: lista cadastros pendentes de aprovação
    pendingApprovals: adminProcedure.query(async () => {
      return db.getPendingUsers();
    }),

    // Admin: aprova e vincula cadastro a um usuário pré-cadastrado
    approveUser: adminProcedure
      .input(z.object({
        pendingId: z.number(),
        linkToUserId: z.number().optional(), // vincular a usuário existente
      }))
      .mutation(async ({ input }) => {
        await db.approveUser(input.pendingId, input.linkToUserId);
        return { success: true };
      }),

    // Admin: rejeita cadastro pendente
    rejectUser: adminProcedure
      .input(z.object({ pendingId: z.number() }))
      .mutation(async ({ input }) => {
        await db.rejectPendingUser(input.pendingId);
        return { success: true };
      }),
  }),

  // ─── Areas ───
  areas: router({
    list: protectedProcedure.query(async () => {
      return db.getAllAreas();
    }),
    listAll: adminProcedure.query(async () => {
      return db.getAllAreas(true);
    }),
    create: adminProcedure
      .input(z.object({ name: z.string().min(1), companyName: z.string().optional(), leaderId: z.number().optional() }))
      .mutation(async ({ input }) => {
        await db.createArea({ name: input.name, companyName: input.companyName, leaderId: input.leaderId });
        return { success: true };
      }),
    update: adminProcedure
      .input(z.object({ id: z.number(), name: z.string().optional(), companyName: z.string().optional(), leaderId: z.number().nullable().optional(), status: z.enum(["active", "inactive"]).optional() }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateArea(id, data as any);
        return { success: true };
      }),
  }),

  // ─── Users Management ───
  users: router({
    list: protectedProcedure.query(async () => {
      const allUsers = await db.getAllUsers();
      return allUsers.map((u) => ({
        id: u.id, name: u.name, email: u.email, appRole: u.appRole,
        areaId: u.areaId, leaderId: u.leaderId, status: u.status,
        mustChangePassword: u.mustChangePassword,
        secondaryAreaId: u.secondaryAreaId, secondaryLeaderId: u.secondaryLeaderId,
      }));
    }),
    listAll: adminProcedure.query(async () => {
      const allUsers = await db.getAllUsers(true);
      return allUsers.map((u) => ({
        id: u.id, name: u.name, email: u.email, appRole: u.appRole,
        areaId: u.areaId, leaderId: u.leaderId, status: u.status,
        mustChangePassword: u.mustChangePassword, deactivatedAt: u.deactivatedAt,
        secondaryAreaId: u.secondaryAreaId, secondaryLeaderId: u.secondaryLeaderId,
      }));
    }),
    byArea: protectedProcedure
      .input(z.object({ areaId: z.number() }))
      .query(async ({ input }) => {
        const areaUsers = await db.getUsersByArea(input.areaId);
        return areaUsers.map((u) => ({ id: u.id, name: u.name, email: u.email, appRole: u.appRole, areaId: u.areaId, leaderId: u.leaderId }));
      }),
    subordinates: protectedProcedure.query(async ({ ctx }) => {
      const subs = await db.getUsersByLeader(ctx.user.id);
      return subs.map((u) => ({ id: u.id, name: u.name, email: u.email, appRole: u.appRole, areaId: u.areaId }));
    }),
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1), email: z.string().email(),
        password: z.string().min(6),
        appRole: z.enum(["admin", "leader", "employee"]),
        areaId: z.number().optional(), leaderId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const existing = await db.getUserByEmail(input.email.toLowerCase().trim());
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "E-mail já cadastrado." });
        const hash = await bcrypt.hash(input.password, 10);
        const user = await db.createAppUser({
          name: input.name, email: input.email.toLowerCase().trim(),
          passwordHash: hash, appRole: input.appRole,
          areaId: input.areaId, leaderId: input.leaderId,
        });
        return { success: true, user };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(), name: z.string().optional(), email: z.string().email().optional(),
        appRole: z.enum(["admin", "leader", "employee"]).optional(),
        areaId: z.number().nullable().optional(), leaderId: z.number().nullable().optional(),
        secondaryAreaId: z.number().nullable().optional(),
        secondaryLeaderId: z.number().nullable().optional(),
        status: z.enum(["active", "inactive"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        if (data.status === "inactive") {
          await db.deactivateUser(id);
        } else {
          await db.updateUser(id, data as any);
        }
        return { success: true };
      }),
    resetPassword: adminProcedure
      .input(z.object({ id: z.number(), newPassword: z.string().min(6) }))
      .mutation(async ({ input }) => {
        const hash = await bcrypt.hash(input.newPassword, 10);
        await db.updateUser(input.id, { passwordHash: hash, mustChangePassword: true });
        return { success: true };
      }),
  }),

  // ─── Cycles ───
  cycles: router({
    list: protectedProcedure.query(async () => {
      return db.getAllCycles();
    }),
    current: protectedProcedure.query(async () => {
      return db.getCurrentCycle();
    }),
    create: adminProcedure
      .input(z.object({
        monthYear: z.string().regex(/^\d{4}-\d{2}$/),
        startDate: z.date().optional(), deadline360: z.date().optional(),
        deadlineLeadership: z.date().optional(), closeDate: z.date().optional(),
        minOtherAreaEvals: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const existing = await db.getCycleByMonthYear(input.monthYear);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Ciclo já existe para este mês." });
        return db.createCycle(input);
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(), status: z.enum(["open", "closed", "published"]).optional(),
        startDate: z.date().optional(), deadline360: z.date().optional(),
        deadlineLeadership: z.date().optional(), closeDate: z.date().optional(),
        publishDate: z.date().optional(), minOtherAreaEvals: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCycle(id, data as any);
        return { success: true };
      }),
  }),

  // ─── Criteria ───
  criteria: router({
    list: protectedProcedure.query(async () => {
      return db.getAllCriteria();
    }),
  }),

  // ─── Evaluations ───
  evaluations: router({
    myPending: protectedProcedure.query(async ({ ctx }) => {
      const cycle = await db.getCurrentCycle();
      if (!cycle) return { pending: [], completed: [], total: 0, done: 0 };

      const myEvals = await db.getEvaluationsByEvaluator(cycle.id, ctx.user.id);
      const submitted = myEvals.filter((e) => e.status === "submitted");
      const allUsers = await db.getAllUsers();
      const allAreas = await db.getAllAreas();
      const me = allUsers.find((u) => u.id === ctx.user.id);
      if (!me) return { pending: [], completed: [], total: 0, done: 0 };

      // Verifica se o usuário pertence à Diretoria (não realiza avaliação de convivência)
      const myArea = allAreas.find((a) => a.id === me.areaId);
      const isDirectoria = myArea?.name === "Diretoria";

      // IDs das áreas às quais o usuário pertence (primária + secundária)
      const myAreaIds = new Set<number | null | undefined>([me.areaId]);
      if (me.secondaryAreaId) myAreaIds.add(me.secondaryAreaId);

      // Colegas de mesma área (primária + secundária)
      const sameAreaUsers = allUsers.filter(
        (u) => u.id !== me.id && myAreaIds.has(u.areaId) && u.status === "active"
      );
      const sameAreaIds = new Set(sameAreaUsers.map((u) => u.id));

      // Subordinados diretos (liderança primária + secundária)
      const mySubIds = new Set<number>();
      if (me.appRole === "leader" || me.appRole === "admin") {
        allUsers
          .filter((u) => (u.leaderId === me.id || u.secondaryLeaderId === me.id) && u.status === "active")
          .forEach((u) => mySubIds.add(u.id));
      }

      // Líderes diretos (primário + secundário)
      const myLeaderIds = new Set<number>();
      if (me.leaderId) myLeaderIds.add(me.leaderId);
      if (me.secondaryLeaderId) myLeaderIds.add(me.secondaryLeaderId);

      const targets: Array<{ userId: number; name: string; relation: string }> = [];

      // Autoavaliação
      targets.push({ userId: me.id, name: me.name || "Eu", relation: "self" });

      // Mesma área — 12 critérios detalhados (primária + secundária)
      sameAreaUsers.forEach((u) => targets.push({ userId: u.id, name: u.name || "", relation: "same_area" }));

      // Liderança top-down — 7 critérios (apenas para líderes/admins)
      if (me.appRole === "leader" || me.appRole === "admin") {
        Array.from(mySubIds).forEach((subId) => {
          const u = allUsers.find((x) => x.id === subId);
          if (u) targets.push({ userId: u.id, name: u.name || "", relation: "leadership" });
        });
      }

      // Convivência (other_area — 3 critérios base):
      // - Apenas para quem NÃO é da Diretoria
      // - Exclui: próprio usuário, colegas de mesma área, subordinados (já em liderança),
      //   líderes diretos (já em bottom_up)
      if (!isDirectoria) {
        const excludeFromConvivencia = new Set([
          me.id,
          ...sameAreaIds,
          ...mySubIds,
          ...myLeaderIds,
        ]);
        allUsers
          .filter((u) => !excludeFromConvivencia.has(u.id) && u.status === "active")
          .forEach((u) => {
            targets.push({ userId: u.id, name: u.name || "", relation: "other_area" });
          });
      }

      // Bottom-up — avalia líder(es) direto(s)
      if (me.appRole !== "admin") {
        myLeaderIds.forEach((leaderId) => {
          const leader = allUsers.find((u) => u.id === leaderId);
          if (leader) targets.push({ userId: leader.id, name: leader.name || "", relation: "bottom_up" });
        });
      }

      const submittedIds = new Set(submitted.map((e) => `${e.evaluateeId}_${e.relation}`));
      const pending = targets.filter((t) => !submittedIds.has(`${t.userId}_${t.relation}`));
      const completed = targets.filter((t) => submittedIds.has(`${t.userId}_${t.relation}`));

      return { pending, completed, total: targets.length, done: completed.length };
    }),

    submit: protectedProcedure
      .input(z.object({
        cycleId: z.number(),
        evaluateeId: z.number(),
        relation: z.enum(["same_area", "other_area", "leadership", "self", "bottom_up"]),
        items: z.array(z.object({
          criteriaId: z.number(),
          score: z.number().min(0).max(10),
          justification: z.string().nullable(),
        })),
        isDraft: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        // Validate justifications
        if (!input.isDraft) {
          for (const item of input.items) {
            if (item.score !== 10 && (!item.justification || item.justification.trim().length < 15)) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Nota diferente de 10 exige justificativa com pelo menos 15 caracteres (critério ID ${item.criteriaId}).`,
              });
            }
          }
        }

        await db.upsertEvaluation({
          cycleId: input.cycleId,
          evaluatorId: ctx.user.id,
          evaluateeId: input.evaluateeId,
          relation: input.relation,
          items: input.items,
          status: input.isDraft ? "draft" : "submitted",
        });

        return { success: true };
      }),

    getForm: protectedProcedure
      .input(z.object({ cycleId: z.number(), evaluateeId: z.number(), relation: z.enum(["same_area", "other_area", "leadership", "self", "bottom_up"]) }))
      .query(async ({ ctx, input }) => {
        const allCriteria = await db.getAllCriteria();
        let filteredCriteria;

        if (input.relation === "same_area" || input.relation === "bottom_up") {
          filteredCriteria = allCriteria.filter((c) => c.type === "base360" || c.type === "detailed360");
        } else if (input.relation === "other_area") {
          filteredCriteria = allCriteria.filter((c) => c.type === "base360");
        } else if (input.relation === "leadership") {
          filteredCriteria = allCriteria.filter((c) => c.type === "leadership");
        } else {
          // self - same as detailed360
          filteredCriteria = allCriteria.filter((c) => c.type === "base360" || c.type === "detailed360");
        }

        // Check existing draft
        const existingEvals = await db.getEvaluationsByEvaluator(input.cycleId, ctx.user.id);
        const existing = existingEvals.find((e) => e.evaluateeId === input.evaluateeId && e.relation === input.relation);

        return {
          criteria: filteredCriteria,
          existingItems: existing?.items || null,
          existingStatus: existing?.status || null,
        };
      }),

    myResults: protectedProcedure.query(async ({ ctx }) => {
      return db.getAggregatesByUser(ctx.user.id);
    }),
  }),

  // ─── Admin Calculations ───
  admin: router({
    calculate: adminProcedure
      .input(z.object({ cycleId: z.number() }))
      .mutation(async ({ input }) => {
        const allEvals = await db.getEvaluationsByCycle(input.cycleId);
        const submitted = allEvals.filter((e) => e.status === "submitted");
        const allUsers = await db.getAllUsers();
        const activeUsers = allUsers.filter((u) => u.status === "active");
        const allCriteria = await db.getAllCriteria();
        const punctualityData = await db.getPunctualityByCycle(input.cycleId);

        for (const user of activeUsers) {
          // Get evaluations received by this user
          const userEvals = submitted.filter((e) => e.evaluateeId === user.id && e.relation !== "self");

          // 360 evaluations
          const evals360 = userEvals.filter((e) => e.relation === "same_area" || e.relation === "other_area" || e.relation === "bottom_up");
          const evalsLeadership = userEvals.filter((e) => e.relation === "leadership");

          // Calculate 360 score
          let nota360 = 10;
          if (evals360.length > 0) {
            const criteriaScores: Record<number, number[]> = {};
            for (const ev of evals360) {
              if (!ev.items) continue;
              for (const item of ev.items as any[]) {
                if (!criteriaScores[item.criteriaId]) criteriaScores[item.criteriaId] = [];
                criteriaScores[item.criteriaId].push(item.score);
              }
            }
            const criteriaAverages: number[] = [];
            for (const [, scores] of Object.entries(criteriaScores)) {
              if (scores.length >= 10) {
                // Trimmed mean (10% top and bottom)
                const sorted = [...scores].sort((a, b) => a - b);
                const trimCount = Math.floor(sorted.length * 0.1);
                const trimmed = sorted.slice(trimCount, sorted.length - trimCount);
                criteriaAverages.push(trimmed.reduce((a, b) => a + b, 0) / trimmed.length);
              } else {
                // Median
                const sorted = [...scores].sort((a, b) => a - b);
                const mid = Math.floor(sorted.length / 2);
                const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
                criteriaAverages.push(median);
              }
            }
            if (criteriaAverages.length > 0) {
              nota360 = criteriaAverages.reduce((a, b) => a + b, 0) / criteriaAverages.length;
            }
          }

          // Calculate leadership score
          let notaLideranca = 10;
          if (evalsLeadership.length > 0) {
            const criteriaScores: Record<number, number[]> = {};
            for (const ev of evalsLeadership) {
              if (!ev.items) continue;
              for (const item of ev.items as any[]) {
                if (!criteriaScores[item.criteriaId]) criteriaScores[item.criteriaId] = [];
                criteriaScores[item.criteriaId].push(item.score);
              }
            }
            const criteriaAverages: number[] = [];
            for (const [, scores] of Object.entries(criteriaScores)) {
              criteriaAverages.push(scores.reduce((a, b) => a + b, 0) / scores.length);
            }
            if (criteriaAverages.length > 0) {
              notaLideranca = criteriaAverages.reduce((a, b) => a + b, 0) / criteriaAverages.length;
            }
          }

          const avaliacaoGlobal = (nota360 + notaLideranca) / 2;

          // Bonus
          const punct = punctualityData.find((p) => p.userId === user.id);
          const bonusPontualidade = (!punct || punct.eligible) ? BONUS_PUNCTUALITY_MAX : 0;
          const bonusDesempenho = avaliacaoGlobal < PERFORMANCE_CUTOFF ? 0 : BONUS_PERFORMANCE_MAX * (avaliacaoGlobal / 10);

          // Radar data
          const radarData: Record<string, number[]> = {};
          for (const cat of RADAR_CATEGORIES) radarData[cat] = [];

          for (const ev of [...evals360, ...evalsLeadership]) {
            if (!ev.items) continue;
            for (const item of ev.items as any[]) {
              const crit = allCriteria.find((c) => c.id === item.criteriaId);
              if (crit) {
                const radarCat = CRITERIA_TO_RADAR[crit.code];
                if (radarCat && radarData[radarCat]) {
                  radarData[radarCat].push(item.score);
                }
              }
            }
          }

          const radarAverages: Record<string, number> = {};
          for (const [cat, scores] of Object.entries(radarData)) {
            radarAverages[cat] = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 10;
          }

          await db.upsertAggregate({
            cycleId: input.cycleId,
            userId: user.id,
            nota360: nota360.toFixed(2),
            notaLideranca: notaLideranca.toFixed(2),
            avaliacaoGlobal: avaliacaoGlobal.toFixed(2),
            bonusPontualidade: bonusPontualidade.toFixed(2),
            bonusDesempenho: bonusDesempenho.toFixed(2),
            bonusPodio: "0",
            totalBonus: (bonusPontualidade + bonusDesempenho).toFixed(2),
            radarData: radarAverages,
          });
        }

        // Calculate podium
        const allAggs = await db.getAggregatesByCycle(input.cycleId);
        const sorted = [...allAggs].sort((a, b) => {
          const diff = Number(b.avaliacaoGlobal) - Number(a.avaliacaoGlobal);
          if (diff !== 0) return diff;
          const diff2 = Number(b.notaLideranca) - Number(a.notaLideranca);
          if (diff2 !== 0) return diff2;
          return Number(b.nota360) - Number(a.nota360);
        });

        const podiumEntries = sorted.slice(0, 3).map((agg, idx) => ({
          cycleId: input.cycleId,
          userId: agg.userId,
          position: idx + 1,
          avaliacaoGlobal: agg.avaliacaoGlobal,
          notaLideranca: agg.notaLideranca,
          nota360: agg.nota360,
          prize: String(PODIUM_PRIZES[idx + 1] || 0),
        }));

        await db.savePodium(input.cycleId, podiumEntries);

        // Update podium bonus in aggregates
        for (const entry of podiumEntries) {
          const agg = allAggs.find((a) => a.userId === entry.userId);
          if (agg) {
            const totalBonus = Number(agg.bonusPontualidade) + Number(agg.bonusDesempenho) + Number(entry.prize);
            await db.upsertAggregate({
              cycleId: input.cycleId,
              userId: entry.userId,
              bonusPodio: entry.prize,
              totalBonus: totalBonus.toFixed(2),
            });
          }
        }

        return { success: true, calculated: activeUsers.length };
      }),

    aggregates: adminProcedure
      .input(z.object({ cycleId: z.number() }))
      .query(async ({ input }) => {
        return db.getAggregatesByCycle(input.cycleId);
      }),

    podium: protectedProcedure
      .input(z.object({ cycleId: z.number() }))
      .query(async ({ input }) => {
        return db.getPodiumByCycle(input.cycleId);
      }),

    punctuality: router({
      import: adminProcedure
        .input(z.object({
          cycleId: z.number(),
          data: z.array(z.object({
            userId: z.number(),
            maxDelayDayMin: z.number(),
            totalDelayMonthMin: z.number(),
          })),
        }))
        .mutation(async ({ input }) => {
          for (const item of input.data) {
            const eligible = item.maxDelayDayMin <= 10 && item.totalDelayMonthMin <= 60;
            await db.upsertPunctuality({
              cycleId: input.cycleId,
              userId: item.userId,
              maxDelayDayMin: item.maxDelayDayMin,
              totalDelayMonthMin: item.totalDelayMonthMin,
              eligible,
            });
          }
          return { success: true };
        }),
    }),

    bonusSummary: adminProcedure
      .input(z.object({ cycleId: z.number().optional() }))
      .query(async ({ input }) => {
        const allCycles = await db.getAllCycles();
        const currentYear = new Date().getFullYear().toString();

        let monthlyData = null;
        if (input.cycleId) {
          const aggs = await db.getAggregatesByCycle(input.cycleId);
          monthlyData = {
            totalPontualidade: aggs.reduce((s, a) => s + Number(a.bonusPontualidade), 0),
            totalDesempenho: aggs.reduce((s, a) => s + Number(a.bonusDesempenho), 0),
            totalPodio: aggs.reduce((s, a) => s + Number(a.bonusPodio), 0),
            totalGeral: aggs.reduce((s, a) => s + Number(a.totalBonus), 0),
            count: aggs.length,
          };
        }

        // Annual summary
        let annualPontualidade = 0, annualDesempenho = 0, annualPodio = 0, annualTotal = 0;
        for (const cycle of allCycles) {
          if (cycle.monthYear.startsWith(currentYear)) {
            const aggs = await db.getAggregatesByCycle(cycle.id);
            annualPontualidade += aggs.reduce((s, a) => s + Number(a.bonusPontualidade), 0);
            annualDesempenho += aggs.reduce((s, a) => s + Number(a.bonusDesempenho), 0);
            annualPodio += aggs.reduce((s, a) => s + Number(a.bonusPodio), 0);
            annualTotal += aggs.reduce((s, a) => s + Number(a.totalBonus), 0);
          }
        }

        return {
          monthly: monthlyData,
          annual: { totalPontualidade: annualPontualidade, totalDesempenho: annualDesempenho, totalPodio: annualPodio, totalGeral: annualTotal },
        };
      }),

    teamStatus: leaderProcedure
      .input(z.object({ cycleId: z.number() }))
      .query(async ({ ctx, input }) => {
        const subs = await db.getUsersByLeader(ctx.user.id);
        const allEvals = await db.getEvaluationsByCycle(input.cycleId);

        return subs.map((u) => {
          const userSubmitted = allEvals.filter((e) => e.evaluatorId === u.id && e.status === "submitted");
          return { userId: u.id, name: u.name, submitted: userSubmitted.length };
        });
      }),
  }),

  // ─── Dashboard data ───
  dashboard: router({
    publicStats: publicProcedure.query(async () => {
      const allUsers = await db.getAllUsers();
      const allAreas = await db.getAllAreas();
      const allCycles = await db.getAllCycles();
      const allEvals = await db.getAllEvaluations?.() ?? [];
      const closedCycles = allCycles.filter((c) => c.status === "closed" || c.status === "published").length;
      const companies = new Set(allAreas.map((a) => a.companyName).filter(Boolean)).size;
      // Total bonus across all published cycles
      let totalBonus = 0;
      try {
        const allAggs = await db.getAllAggregates?.();
        if (allAggs) totalBonus = allAggs.reduce((sum: number, a: any) => sum + Number(a.totalBonus ?? 0), 0);
      } catch {}
      return {
        totalEvaluations: allEvals.length || null,
        activeCollaborators: allUsers.length,
        closedCycles,
        companies,
        totalBonus: totalBonus || null,
      };
    }),
    myData: protectedProcedure.query(async ({ ctx }) => {
      const cycle = await db.getCurrentCycle();
      const allCycles = await db.getAllCycles();
      const currentYear = new Date().getFullYear().toString();

      let currentAggregate = null;
      let monthlyPodium: any[] = [];
      if (cycle) {
        const aggs = await db.getAggregatesByCycle(cycle.id);
        currentAggregate = aggs.find((a) => a.userId === ctx.user.id) || null;
        monthlyPodium = await db.getPodiumByCycle(cycle.id);
      }

      // Annual data
      let annualBonus = 0;
      const annualAggregates: any[] = [];
      for (const c of allCycles) {
        if (c.monthYear.startsWith(currentYear)) {
          const aggs = await db.getAggregatesByCycle(c.id);
          const myAgg = aggs.find((a) => a.userId === ctx.user.id);
          if (myAgg) {
            annualBonus += Number(myAgg.totalBonus);
            annualAggregates.push({ monthYear: c.monthYear, ...myAgg });
          }
        }
      }

      // Annual ranking
      const annualScores: Record<number, { total: number; count: number }> = {};
      for (const c of allCycles) {
        if (c.monthYear.startsWith(currentYear)) {
          const aggs = await db.getAggregatesByCycle(c.id);
          for (const a of aggs) {
            if (!annualScores[a.userId]) annualScores[a.userId] = { total: 0, count: 0 };
            annualScores[a.userId].total += Number(a.avaliacaoGlobal);
            annualScores[a.userId].count += 1;
          }
        }
      }
      const annualRanking = Object.entries(annualScores)
        .map(([uid, data]) => ({ userId: Number(uid), average: data.total / data.count }))
        .sort((a, b) => b.average - a.average);
      const myAnnualPosition = annualRanking.findIndex((r) => r.userId === ctx.user.id) + 1;

      // Eval progress — espelha exatamente a lógica de myPending
      let evalProgress = { total: 0, done: 0, percent: 0 };
      if (cycle) {
        const myEvals = await db.getEvaluationsByEvaluator(cycle.id, ctx.user.id);
        const submittedCount = myEvals.filter((e) => e.status === "submitted").length;
        const allUsers = await db.getAllUsers();
        const allAreas = await db.getAllAreas();
        const me = allUsers.find((u) => u.id === ctx.user.id);
        if (me) {
          const myArea = allAreas.find((a) => a.id === me.areaId);
          const isDirectoria = myArea?.name === "Diretoria";
          const myAreaIds = new Set<number | null | undefined>([me.areaId]);
          if (me.secondaryAreaId) myAreaIds.add(me.secondaryAreaId);

          const sameAreaUsers = allUsers.filter(
            (u) => u.id !== me.id && myAreaIds.has(u.areaId) && u.status === "active"
          );
          const sameAreaIds = new Set(sameAreaUsers.map((u) => u.id));
          const mySubIds = new Set<number>();
          if (me.appRole === "leader" || me.appRole === "admin") {
            allUsers
              .filter((u) => (u.leaderId === me.id || u.secondaryLeaderId === me.id) && u.status === "active")
              .forEach((u) => mySubIds.add(u.id));
          }
          const myLeaderIds = new Set<number>();
          if (me.leaderId) myLeaderIds.add(me.leaderId);
          if (me.secondaryLeaderId) myLeaderIds.add(me.secondaryLeaderId);

          let total = 1 + sameAreaUsers.length; // self + mesma área
          if (me.appRole === "leader" || me.appRole === "admin") total += mySubIds.size; // liderança
          if (me.appRole !== "admin") total += myLeaderIds.size; // bottom-up
          if (!isDirectoria) {
            const excludeFromConvivencia = new Set([me.id, ...sameAreaIds, ...mySubIds, ...myLeaderIds]);
            const convivenciaCount = allUsers.filter(
              (u) => !excludeFromConvivencia.has(u.id) && u.status === "active"
            ).length;
            total += convivenciaCount;
          }
          evalProgress = { total, done: submittedCount, percent: total > 0 ? Math.round((submittedCount / total) * 100) : 0 };
        }
      }

      return {
        cycle,
        currentAggregate,
        monthlyPodium: monthlyPodium.map((p) => ({
          position: p.position,
          avaliacaoGlobal: p.avaliacaoGlobal,
          nota360: p.nota360,
          notaLideranca: p.notaLideranca,
        })),
        annualBonus,
        annualAggregates,
        myAnnualPosition,
        annualRankingTotal: annualRanking.length,
        evalProgress,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
