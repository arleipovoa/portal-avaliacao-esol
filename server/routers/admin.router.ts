import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../db";
import { runCycleCalculation } from "../services/evaluation.service";
import { calculatePodiumAndBonus, getBonusSummary } from "../services/bonus.service";

const leaderProcedure = protectedProcedure.use(async (opts) => {
  const { ctx, next } = opts;
  if (ctx.user.appRole !== "leader" && ctx.user.appRole !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a líderes e admins." });
  }
  return next({ ctx });
});

export const adminRouter = router({
  calculate: adminProcedure
    .input(z.object({ cycleId: z.number() }))
    .mutation(async ({ input }) => {
      const { activeUsers } = await runCycleCalculation(input.cycleId);
      await calculatePodiumAndBonus(input.cycleId);
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
      return getBonusSummary(input.cycleId);
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
});
