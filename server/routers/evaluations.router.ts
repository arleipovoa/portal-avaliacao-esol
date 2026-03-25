import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../db";

export const evaluationsRouter = router({
  myPending: protectedProcedure.query(async ({ ctx }) => {
    const cycle = await db.getCurrentCycle();
    if (!cycle) return { pending: [], completed: [], total: 0, done: 0 };

    const myEvals = await db.getEvaluationsByEvaluator(cycle.id, ctx.user.id);
    const submitted = myEvals.filter((e) => e.status === "submitted");
    const allUsers = await db.getAllUsers();
    const allAreas = await db.getAllAreas();
    const me = allUsers.find((u) => u.id === ctx.user.id);
    if (!me) return { pending: [], completed: [], total: 0, done: 0 };

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

    const targets: Array<{ userId: number; name: string; relation: string }> = [];

    targets.push({ userId: me.id, name: me.name || "Eu", relation: "self" });

    sameAreaUsers.forEach((u) => targets.push({ userId: u.id, name: u.name || "", relation: "same_area" }));

    if (me.appRole === "leader" || me.appRole === "admin") {
      Array.from(mySubIds).forEach((subId) => {
        const u = allUsers.find((x) => x.id === subId);
        if (u) targets.push({ userId: u.id, name: u.name || "", relation: "leadership" });
      });
    }

    if (!isDirectoria) {
      const excludeFromConvivencia = new Set([me.id, ...Array.from(sameAreaIds), ...Array.from(mySubIds), ...Array.from(myLeaderIds)]);
      allUsers
        .filter((u) => !excludeFromConvivencia.has(u.id) && u.status === "active")
        .forEach((u) => {
          targets.push({ userId: u.id, name: u.name || "", relation: "other_area" });
        });
    }

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
    .input(z.object({
      cycleId: z.number(),
      evaluateeId: z.number(),
      relation: z.enum(["same_area", "other_area", "leadership", "self", "bottom_up"]),
    }))
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
        filteredCriteria = allCriteria.filter((c) => c.type === "base360" || c.type === "detailed360");
      }

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
});
