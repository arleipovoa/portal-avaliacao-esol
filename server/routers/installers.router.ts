import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { dbObras } from "../_core/db";
import { installers } from "../../drizzle/schema-obras-diario";

export const installersRouter = router({
  // Lista todos (default: só ativos). admin pode ver inativos via includeInactive.
  list: protectedProcedure
    .input(z.object({ includeInactive: z.boolean().optional() }).optional())
    .query(async ({ input }) => {
      const includeInactive = input?.includeInactive ?? false;
      const rows = includeInactive
        ? await dbObras.select().from(installers).orderBy(asc(installers.name))
        : await dbObras
            .select()
            .from(installers)
            .where(eq(installers.status, "active"))
            .orderBy(asc(installers.name));
      return rows;
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        role: z.string().max(50).optional(),
        hiredAt: z.string().optional(),
        weight: z.string().regex(/^\d(\.\d)?$/).optional(), // ex: "1.0", "1.2", "0.5"
      })
    )
    .mutation(async ({ input }) => {
      const exists = await dbObras
        .select()
        .from(installers)
        .where(eq(installers.name, input.name))
        .limit(1);
      if (exists.length > 0)
        throw new TRPCError({ code: "CONFLICT", message: "Já existe um instalador com esse nome" });
      await dbObras.insert(installers).values({
        name: input.name,
        role: input.role ?? null,
        hiredAt: input.hiredAt ? new Date(input.hiredAt) : null,
        weight: input.weight ?? "1.0",
        status: "active",
      });
      return { success: true };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        role: z.string().max(50).nullable().optional(),
        hiredAt: z.string().nullable().optional(),
        leftAt: z.string().nullable().optional(),
        status: z.enum(["active", "inactive"]).optional(),
        weight: z.string().regex(/^\d(\.\d)?$/).nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, hiredAt, leftAt, ...rest } = input;
      const data: any = { ...rest };
      if (hiredAt !== undefined) data.hiredAt = hiredAt ? new Date(hiredAt) : null;
      if (leftAt !== undefined) data.leftAt = leftAt ? new Date(leftAt) : null;
      await dbObras.update(installers).set(data).where(eq(installers.id, id));
      return { success: true };
    }),

  setStatus: adminProcedure
    .input(z.object({ id: z.number(), status: z.enum(["active", "inactive"]) }))
    .mutation(async ({ input }) => {
      const data: any = { status: input.status };
      if (input.status === "inactive") data.leftAt = new Date();
      else data.leftAt = null;
      await dbObras.update(installers).set(data).where(eq(installers.id, input.id));
      return { success: true };
    }),
});
