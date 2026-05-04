import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { dbObras } from "../_core/db";
import { projectAssets } from "../../drizzle/schema-obras-diario";

export const projectAssetsRouter = router({
  // Retorna asset de um projeto (ou null).
  get: protectedProcedure
    .input(z.object({ projectCode: z.string() }))
    .query(async ({ input }) => {
      const rows = await dbObras
        .select()
        .from(projectAssets)
        .where(eq(projectAssets.projectCode, input.projectCode))
        .limit(1);
      return rows[0] ?? null;
    }),

  // Lista TODOS — usado na tela admin.
  list: adminProcedure.query(async () => {
    return dbObras.select().from(projectAssets);
  }),

  // Cria/atualiza manualmente (admin). Quando o scan automatico rodar,
  // ele tambem usa upsert.
  upsert: adminProcedure
    .input(
      z.object({
        projectCode: z.string(),
        photosLink: z.string().nullable().optional(),
        driveFolderId: z.string().nullable().optional(),
        permissionStatus: z.enum(["public", "private", "unknown"]).optional(),
        markSynced: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { projectCode, markSynced, ...rest } = input;
      const data: any = { ...rest };
      if (markSynced) data.lastSyncedAt = new Date();

      const existing = await dbObras
        .select()
        .from(projectAssets)
        .where(eq(projectAssets.projectCode, projectCode))
        .limit(1);

      if (existing.length > 0) {
        await dbObras
          .update(projectAssets)
          .set(data)
          .where(eq(projectAssets.projectCode, projectCode));
      } else {
        await dbObras.insert(projectAssets).values({ projectCode, ...data });
      }
      return { success: true };
    }),
});
