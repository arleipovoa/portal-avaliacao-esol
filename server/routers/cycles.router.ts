import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../db";

export const cyclesRouter = router({
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
});
