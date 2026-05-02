import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { dbObras } from "../_core/db";
import { vehicles } from "../../drizzle/schema-obras-diario";

export const vehiclesRouter = router({
  list: protectedProcedure
    .input(z.object({ includeInactive: z.boolean().optional() }).optional())
    .query(async ({ input }) => {
      const includeInactive = input?.includeInactive ?? false;
      const rows = includeInactive
        ? await dbObras.select().from(vehicles).orderBy(asc(vehicles.identifier))
        : await dbObras
            .select()
            .from(vehicles)
            .where(eq(vehicles.status, "active"))
            .orderBy(asc(vehicles.identifier));
      return rows;
    }),

  create: adminProcedure
    .input(
      z.object({
        identifier: z.string().min(1).max(50),
        model: z.string().max(100).optional(),
        plate: z.string().max(10).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const exists = await dbObras
        .select()
        .from(vehicles)
        .where(eq(vehicles.identifier, input.identifier))
        .limit(1);
      if (exists.length > 0)
        throw new TRPCError({ code: "CONFLICT", message: "Já existe um veículo com esse identificador" });
      await dbObras.insert(vehicles).values({
        identifier: input.identifier,
        model: input.model ?? null,
        plate: input.plate ?? null,
        notes: input.notes ?? null,
        status: "active",
      });
      return { success: true };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        identifier: z.string().min(1).max(50).optional(),
        model: z.string().max(100).nullable().optional(),
        plate: z.string().max(10).nullable().optional(),
        notes: z.string().nullable().optional(),
        status: z.enum(["active", "inactive"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...rest } = input;
      await dbObras.update(vehicles).set(rest as any).where(eq(vehicles.id, id));
      return { success: true };
    }),

  setStatus: adminProcedure
    .input(z.object({ id: z.number(), status: z.enum(["active", "inactive"]) }))
    .mutation(async ({ input }) => {
      await dbObras.update(vehicles).set({ status: input.status }).where(eq(vehicles.id, input.id));
      return { success: true };
    }),
});
