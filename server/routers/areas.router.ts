import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const areasRouter = router({
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
    .input(z.object({
      id: z.number(), name: z.string().optional(), companyName: z.string().optional(),
      leaderId: z.number().nullable().optional(), status: z.enum(["active", "inactive"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateArea(id, data as any);
      return { success: true };
    }),
});
