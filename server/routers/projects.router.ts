import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { projects, projectMembers, obraScores, obraEvaluations, obraCriteria, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
// import { canAccessObras } from "../_core/accessControl";

export const projectsRouter = router({
  // GET /api/projects - List all projects
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    
    // Fetch projects and their latest scores
    const allProjects = await db.select().from(projects);
    const allScores = await db.select().from(obraScores);
    
    // Map scores to respective projects
    return allProjects.map(proj => {
      const scores = allScores.filter(s => s.projectId === proj.id);
      
      let baseValue = 0;
      let correctedValue = 0;
      let projectScore = null;
      
      if (scores.length > 0) {
        // Find averge or just use the first/max logic. Since there's supposed to be 1 consolidated score, we'll take the first.
        const score = scores[0];
        projectScore = score.notaObraPercentual;
        baseValue = parseFloat(score.bonusValorBase as string || "0");
        correctedValue = parseFloat(score.bonusValorCorrigido as string || "0");
      }
      
      return {
        ...proj,
        projectScore,
        baseValue,
        correctedValue
      };
    });
  }),

  // GET /api/projects/:id - Get project details with members
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const projectRes = await db.select().from(projects).where(eq(projects.id, input.id));
      if (!projectRes.length) throw new Error("Project not found");

      const members = await db.select().from(projectMembers).where(eq(projectMembers.projectId, input.id));
      return { ...projectRes[0], members };
    }),

  calculateExpectedDays: protectedProcedure
    .input(z.object({ moduleCount: z.number() }))
    .query(({ input }) => {
      // Simplistic calculation: 1 day base + 1 day for every 10 modules
      return { expectedDays: 1 + Math.ceil(input.moduleCount / 10) };
    }),

  // POST /api/projects - Create new project
  create: protectedProcedure
    .input(z.object({
      code: z.string(),
      clientName: z.string(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      moduleCount: z.number().optional(),
      modulePower: z.number().optional(),
      powerKwp: z.number().optional(),
      category: z.string().optional(),
      completionDate: z.string().optional(),
      paymentMonth: z.string().optional(),
      actualDays: z.number().optional(),
      expectedDaysOverride: z.number().optional(),
      hasFinancialLoss: z.boolean().optional(),
      financialLossReason: z.string().optional(),
      forceMajeureJustification: z.string().optional(),
      photosLink: z.string().optional(),
      reportLink: z.string().optional(),
      nps: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      let finalCategory = input.category;
      if (!finalCategory && input.powerKwp) {
        if (input.powerKwp <= 5) finalCategory = "B1";
        else if (input.powerKwp <= 10) finalCategory = "B2";
        else if (input.powerKwp <= 20) finalCategory = "B3";
        else if (input.powerKwp <= 30) finalCategory = "B4";
        else if (input.powerKwp <= 50) finalCategory = "B5";
        else if (input.powerKwp <= 75) finalCategory = "B6";
        else finalCategory = "B7";
      }

      const { powerKwp, completionDate, nps, ...restInput } = input;
      const result = await db.insert(projects).values({
        ...restInput,
        completedDate: completionDate ? new Date(completionDate) : undefined,
        powerKwp: powerKwp !== undefined ? String(powerKwp) : undefined,
        nps: nps !== undefined ? String(nps) : undefined,
        category: finalCategory as any,
        status: "planning" as any,
      });
      return { id: result[0]?.insertId, message: "Project created successfully" };
    }),

  // PUT /api/projects/:id - Update project
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      clientName: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      completedDate: z.string().optional(),
      status: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const { id, startDate, endDate, completedDate, status, ...rest } = input;
      await db.update(projects).set({
        ...rest,
        status: status as any,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        completedDate: completedDate ? new Date(completedDate) : undefined,
      }).where(eq(projects.id, id));
      return { message: "Project updated successfully" };
    }),

  // GET /api/projects/:id/criteria - Get obra criteria for evaluation
  getCriteria: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const criteria = await db.select().from(obraCriteria).where(eq(obraCriteria.active, true));
      
      const grouped = criteria.reduce((acc, criterion) => {
        const cat = criterion.category || "outros";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(criterion);
        return acc;
      }, {} as Record<string, typeof criteria>);

      return grouped;
    }),

  // POST /api/projects/:id/scores - Submit obra evaluation scores
  submitScores: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      userId: z.number(),
      notaSeguranca: z.number(),
      notaFuncionalidade: z.number(),
      notaEstetica: z.number(),
      mediaOs: z.number(),
      eficiencia: z.number(),
      npsCliente: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const { projectId, userId, notaSeguranca, notaFuncionalidade, notaEstetica, mediaOs, eficiencia, npsCliente } = input;

      const baseScore = ((notaSeguranca * 2 + notaFuncionalidade * 2 + notaEstetica * 1) / 5);
      const notaObraPercentual = (baseScore * 0.5) + (mediaOs * 0.2) + (eficiencia * 0.15) + (npsCliente * 0.15);

      const projectRes = await db.select().from(projects).where(eq(projects.id, projectId));
      if (!projectRes.length) throw new Error("Project not found");

      const bonusMap: Record<string, number> = {
        B1: 200, B2: 300, B3: 500, B4: 750, B5: 1000, B6: 1500, B7: 2000,
      };

      const baseCategory = typeof projectRes[0].category === "string" ? projectRes[0].category : "B1";
      const bonusValorBase = bonusMap[baseCategory] || 200;
      const bonusValorCorrigido = bonusValorBase * (notaObraPercentual / 100);

      const existingScore = await db.select().from(obraScores).where(
        and(eq(obraScores.projectId, projectId), eq(obraScores.userId, userId))
      );

      if (existingScore.length) {
        await db.update(obraScores).set({
          notaSeguranca: String(notaSeguranca), 
          notaFuncionalidade: String(notaFuncionalidade), 
          notaEstetica: String(notaEstetica), 
          mediaOs: String(mediaOs), 
          eficiencia: String(eficiencia), 
          npsCliente: String(npsCliente),
          notaObraPercentual: String(notaObraPercentual),
          bonusValorBase: String(bonusValorBase),
          bonusValorCorrigido: String(bonusValorCorrigido),
        }).where(eq(obraScores.id, existingScore[0].id));
      } else {
        await db.insert(obraScores).values({
          projectId, 
          userId, 
          notaSeguranca: String(notaSeguranca), 
          notaFuncionalidade: String(notaFuncionalidade), 
          notaEstetica: String(notaEstetica), 
          mediaOs: String(mediaOs), 
          eficiencia: String(eficiencia), 
          npsCliente: String(npsCliente),
          notaObraPercentual: String(notaObraPercentual),
          bonusValorBase: String(bonusValorBase),
          bonusValorCorrigido: String(bonusValorCorrigido),
        });
      }

      return {
        notaObraPercentual,
        bonusValorBase,
        bonusValorCorrigido,
        message: "Scores submitted successfully",
      };
    }),

  getScores: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const scores = await db.select().from(obraScores).where(eq(obraScores.projectId, input.projectId));
      return scores;
    }),
});
