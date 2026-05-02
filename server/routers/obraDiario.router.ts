import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { eq, and, asc } from "drizzle-orm";
import { dbObras } from "../_core/db";
import { obraDiario, installers, vehicles } from "../../drizzle/schema-obras-diario";

const dayInputSchema = z.object({
  dayNumber: z.number().int().min(1),
  date: z.string(),                                  // ISO YYYY-MM-DD
  vehicleId: z.number().int().nullable().optional(), // null = "-"
  installerIds: z.array(z.number().int()),           // quem estava nesse dia
  notes: z.string().optional(),
});

export const obraDiarioRouter = router({
  // Retorna o diário de uma obra: dias com data, veículo e instaladores.
  get: protectedProcedure
    .input(z.object({ projectCode: z.string() }))
    .query(async ({ input }) => {
      const rows = await dbObras
        .select()
        .from(obraDiario)
        .where(eq(obraDiario.projectCode, input.projectCode))
        .orderBy(asc(obraDiario.dayNumber));

      // Agrupar por dia
      const byDay = new Map<number, {
        dayNumber: number;
        date: Date;
        vehicleId: number | null;
        notes: string | null;
        installerIds: number[];
      }>();

      for (const r of rows) {
        if (!byDay.has(r.dayNumber)) {
          byDay.set(r.dayNumber, {
            dayNumber: r.dayNumber,
            date: r.date,
            vehicleId: r.vehicleId ?? null,
            notes: r.notes ?? null,
            installerIds: [],
          });
        }
        byDay.get(r.dayNumber)!.installerIds.push(r.installerId);
      }

      return {
        projectCode: input.projectCode,
        days: Array.from(byDay.values()).sort((a, b) => a.dayNumber - b.dayNumber),
      };
    }),

  // Substitui completamente o diário de uma obra (upsert por (project, day, installer)).
  // Mais simples e seguro que merge — admin envia a estrutura inteira.
  upsert: protectedProcedure
    .input(
      z.object({
        projectCode: z.string(),
        days: z.array(dayInputSchema),
      })
    )
    .mutation(async ({ input }) => {
      // 1) Apaga tudo da obra
      await dbObras.delete(obraDiario).where(eq(obraDiario.projectCode, input.projectCode));

      // 2) Insere os novos
      const inserts: any[] = [];
      for (const d of input.days) {
        for (const installerId of d.installerIds) {
          inserts.push({
            projectCode: input.projectCode,
            dayNumber: d.dayNumber,
            date: new Date(d.date),
            vehicleId: d.vehicleId ?? null,
            installerId,
            notes: d.notes ?? null,
          });
        }
      }
      if (inserts.length > 0) {
        await dbObras.insert(obraDiario).values(inserts);
      }

      return { success: true, totalLinhas: inserts.length };
    }),

  // Util: lista de instaladores ativos pra montar a UI (atalho)
  installersAtivos: protectedProcedure.query(async () => {
    return dbObras
      .select()
      .from(installers)
      .where(eq(installers.status, "active"))
      .orderBy(asc(installers.name));
  }),

  // Util: lista de veiculos ativos
  vehiclesAtivos: protectedProcedure.query(async () => {
    return dbObras
      .select()
      .from(vehicles)
      .where(eq(vehicles.status, "active"))
      .orderBy(asc(vehicles.identifier));
  }),
});
