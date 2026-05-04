import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { projects, projectMembers, obraScores, obraEvaluations, obraCriteria, users } from "../../drizzle/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { dbObras } from "../_core/db";
import { obraDiario, installers } from "../../drizzle/schema-obras-diario";
import { fetchPbiProjects, generatePbiDocuments, isPbiConfigured } from "../lib/pbiClient";
import { MOCK_PROJECTS } from "../lib/mockProjects";
import { MOCK_OBRA_CRITERIA_GROUPED } from "../lib/mockObraCriteria";
import { getEvaluationWindow, isEligibleForEvaluation } from "../lib/evaluationRules";
import { historyByMonth, historyQuarterly, historyYearly } from "../lib/historicoAggregations";
import { peerReviewYearly, peerReviewMatrix, peerReviewByObra } from "../lib/peerReviewAggregations";
// import { canAccessObras } from "../_core/accessControl";


// ── Modo mock ──
// Quando PBI_API_URL nao esta configurada, evitamos qualquer escrita no DB
// (a tabela `projects` nao necessariamente existe no DATABASE_URL legado).
// IDs sao derivados do codigo: P1001 -> 1001, permitindo getById/submitScores
// funcionarem de forma estavel.
function mockProjectId(codigoProjeto: string): number {
  const numeric = parseInt(codigoProjeto.replace(/\D/g, ""), 10);
  return Number.isFinite(numeric) ? numeric : 1;
}

function buildMockProjectList() {
  return MOCK_PROJECTS.map((p) => ({
    id: mockProjectId(p.codigoProjeto),
    code: p.codigoProjeto,
    clientName: p.clientName,
    address: p.address ?? null,
    city: p.city ?? null,
    state: p.state ?? null,
    powerKwp: p.powerKwp ? String(p.powerKwp) : null,
    category: p.category,
    status: p.status,
    moduleCount: p.moduleCount ?? null,
    startDate: p.startDate ? new Date(p.startDate) : null,
    endDate: p.endDate ? new Date(p.endDate) : null,
    completedDate: null,
    modulePower: null,
    paymentMonth: null,
    actualDays: null,
    expectedDaysOverride: null,
    hasFinancialLoss: false,
    financialLossReason: null,
    forceMajeureJustification: null,
    photosLink: null,
    reportLink: null,
    nps: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    projectScore: null,
    baseValue: 0,
    correctedValue: 0,
    fromPbi: false,
    installacaoFinalizada: p.installacaoFinalizada,
    pedidoVistoriaDate: p.pedidoVistoriaDate,
    vendedor: p.vendedor,
  }));
}

// Retorna projetos da API (real ou mock) ja no shape do PbiProject + projectScore.
async function fetchAllProjectsForUI() {
  if (!isPbiConfigured()) {
    return buildMockProjectList();
  }
  const pbi = await fetchPbiProjects();
  return pbi.map((p) => ({
    id: mockProjectId(p.codigoProjeto),
    code: p.codigoProjeto,
    clientName: p.clientName,
    address: p.address ?? null,
    city: p.city ?? null,
    state: p.state ?? null,
    powerKwp: p.powerKwp ? String(p.powerKwp) : null,
    category: p.category,
    status: p.status,
    moduleCount: p.moduleCount ?? null,
    startDate: p.startDate ? new Date(p.startDate) : null,
    endDate: p.endDate ? new Date(p.endDate) : null,
    completedDate: null,
    modulePower: null,
    paymentMonth: null,
    actualDays: null,
    expectedDaysOverride: null,
    hasFinancialLoss: false,
    financialLossReason: null,
    forceMajeureJustification: null,
    photosLink: null,
    reportLink: null,
    nps: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    projectScore: null,
    baseValue: 0,
    correctedValue: 0,
    fromPbi: true,
    installacaoFinalizada: p.installacaoFinalizada,
    pedidoVistoriaDate: p.pedidoVistoriaDate,
    vendedor: p.vendedor,
  }));
}

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
  // Sempre busca da fonte de verdade (PBI ou mocks), sem DB local.
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const all = await fetchAllProjectsForUI();
      const found = all.find((p) => p.id === input.id);
      if (!found) throw new Error("Project not found");
      return { ...found, members: [] };
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
  // Por enquanto sempre devolve os criterios mockados (3 categorias: seguranca,
  // funcionalidade, estetica). Quando popular tabela `obra_criteria` no banco
  // de obras, voltar a ler do DB.
  getCriteria: protectedProcedure
    .query(async () => {
      return MOCK_OBRA_CRITERIA_GROUPED;
    }),

  // POST /api/projects/:id/scores - Submit obra evaluation scores
  submitScores: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      userId: z.number(),
      // Notas por categoria (0–10), calculadas como média dos critérios individuais
      notaSeguranca: z.number().min(0).max(10),
      notaFuncionalidade: z.number().min(0).max(10),
      notaEstetica: z.number().min(0).max(10),
      // OS (Ordens de Serviço) — Módulos e Inversores (0–10 cada)
      osModulos: z.number().min(0).max(10),
      osInversores: z.number().min(0).max(10),
      // NPS do cliente (0–10)
      npsCliente: z.number().min(0).max(10),
      // Critérios individuais com observações
      itemScores: z.array(z.object({
        criteriaId: z.number(),
        score: z.number().min(0).max(10),
        obs: z.string().optional(),
      })).optional(),
      // Flags de "Não avaliado" — exclui o componente da média (sem impacto na nota)
      npsNa: z.boolean().optional(),
      osModulosNa: z.boolean().optional(),
      osInversoresNa: z.boolean().optional(),
      // Observações globais e link de fotos
      driveLink: z.string().optional(),
      observacaoGeral: z.string().optional(),
      hasFinancialLoss: z.boolean().optional(),
      // Código string do projeto (ex: "P2345") para buscar diário de obra
      projectCode: z.string().optional(),
      // Snapshot completo do formulário para persistência
      formSnapshot: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      const {
        projectId, userId,
        notaSeguranca, notaFuncionalidade, notaEstetica,
        osModulos, osInversores, npsCliente,
        hasFinancialLoss,
        npsNa = false,
        osModulosNa = false,
        osInversoresNa = false,
      } = input;

      // ── Nota Final (escala 0–10) ─────────────────────────────────────────
      // Componentes marcados como "Não avaliado" são excluídos da média.
      function avgNullable(vals: (number | null)[]): number | null {
        const valid = vals.filter((v): v is number => v !== null);
        return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
      }

      const eficiencia = (notaSeguranca + notaFuncionalidade + notaEstetica) / 3;
      const mediaOs    = avgNullable([osModulosNa ? null : osModulos, osInversoresNa ? null : osInversores]);
      const npsValue   = npsNa ? null : npsCliente;
      const notaFinal  = avgNullable([eficiencia, mediaOs, npsValue]) ?? 0;

      const all = await fetchAllProjectsForUI();
      const found = all.find((p) => p.id === projectId);
      if (!found) throw new Error("Project not found");

      const bonusMap: Record<string, number> = {
        B1: 200, B2: 300, B3: 500, B4: 750, B5: 1000, B6: 1500, B7: 2000,
      };
      const bonusValorBase = bonusMap[found.category ?? "B1"] || 200;

      // Prejuízo financeiro → bônus zerado e avaliação desconsiderada
      const bonusValorCorrigido = hasFinancialLoss ? 0 : bonusValorBase * (notaFinal / 10);

      // ── Cálculo de bônus por participante ───────────────────────────────
      // Fórmula: BonusIndividual_i = DP_i × MediaPonderada × (nota360_i / 10)
      //   onde DP_i = peso_i × frequência_i
      //        MediaPonderada = ValorCorrigido / Σ(DP_i)
      type ParticipantBonus = {
        installerId: number;
        nome: string;
        peso: number;
        diasPresentes: number;
        totalDias: number;
        frequencia: number;
        dp: number;
        nota360: number;
        mediaPonderada: number;
        bonusIndividual: number;
      };

      let participantBonuses: ParticipantBonus[] = [];
      let hasDiaryData = false;
      let totalDias = 0;

      if (!hasFinancialLoss && input.projectCode) {
        try {
          // Total de dias distintos da obra
          const allDays = await dbObras
            .selectDistinct({ day: obraDiario.dayNumber })
            .from(obraDiario)
            .where(eq(obraDiario.projectCode, input.projectCode));

          if (allDays.length > 0) {
            hasDiaryData = true;
            totalDias = allDays.length;

            // Instaladores distintos que participaram
            const participantRows = await dbObras
              .selectDistinct({ installerId: obraDiario.installerId })
              .from(obraDiario)
              .where(eq(obraDiario.projectCode, input.projectCode));

            const installerIds = participantRows.map(r => r.installerId);
            const installerDetails = await dbObras
              .select({ id: installers.id, name: installers.name, weight: installers.weight })
              .from(installers)
              .where(inArray(installers.id, installerIds));

            // Nota360 da avaliação dos pares (histórico) — default 10 se não disponível
            const peerData = peerReviewByObra(input.projectCode);

            // 1ª passagem: calcular DP_i para cada instalador
            const tempData: Omit<ParticipantBonus, 'nota360' | 'mediaPonderada' | 'bonusIndividual'>[] = [];
            let sumDP = 0;

            for (const inst of installerDetails) {
              const presenceDays = await dbObras
                .selectDistinct({ day: obraDiario.dayNumber })
                .from(obraDiario)
                .where(and(
                  eq(obraDiario.projectCode, input.projectCode),
                  eq(obraDiario.installerId, inst.id)
                ));

              const diasPresentes = presenceDays.length;
              const frequencia    = totalDias > 0 ? diasPresentes / totalDias : 0;
              const peso          = parseFloat(inst.weight ?? '1.0') || 1.0;
              const dp            = peso * frequencia;
              sumDP += dp;

              tempData.push({ installerId: inst.id, nome: inst.name ?? '', peso, diasPresentes, totalDias, frequencia, dp });
            }

            // 2ª passagem: aplicar MediaPonderada e nota360
            const mediaPonderada = sumDP > 0 ? bonusValorCorrigido / sumDP : 0;

            participantBonuses = tempData.map(p => {
              const nota360       = peerData?.mediasPorColaborador[p.nome] ?? 10;
              const bonusIndividual = p.dp * mediaPonderada * (nota360 / 10);
              return { ...p, nota360, mediaPonderada, bonusIndividual };
            }).sort((a, b) => b.bonusIndividual - a.bonusIndividual);
          }
        } catch (e) {
          console.error('[submitScores] Erro ao calcular bônus dos participantes:', e);
        }
      }

      // ── Persistência ────────────────────────────────────────────────────
      if (input.formSnapshot !== undefined) {
        try {
          const db = await getDb();
          if (db) {
            // Snapshot na obraEvaluations (check-then-upsert por (projectId, evaluatorId))
            const existing = await db.select({ id: obraEvaluations.id })
              .from(obraEvaluations)
              .where(and(eq(obraEvaluations.projectId, projectId), eq(obraEvaluations.evaluatorId, userId)))
              .limit(1);

            if (existing.length > 0) {
              await db.update(obraEvaluations)
                .set({ items: input.formSnapshot as any, status: "submitted", submittedAt: new Date() })
                .where(eq(obraEvaluations.id, existing[0].id));
            } else {
              await db.insert(obraEvaluations).values({
                projectId, evaluatorId: userId,
                items: input.formSnapshot as any,
                status: "submitted", submittedAt: new Date(),
              });
            }

            // Scores resumidos na obraScores (check-then-upsert por (projectId, userId))
            const existingScore = await db.select({ id: obraScores.id })
              .from(obraScores)
              .where(and(eq(obraScores.projectId, projectId), eq(obraScores.userId, userId)))
              .limit(1);

            const scoreData = {
              notaSeguranca:      String(notaSeguranca),
              notaFuncionalidade: String(notaFuncionalidade),
              notaEstetica:       String(notaEstetica),
              mediaOs:            mediaOs !== null ? String(mediaOs) : null,
              eficiencia:         String(eficiencia),
              npsCliente:         npsNa ? null : String(npsCliente),
              notaObraPercentual: String(notaFinal),
              bonusValorBase:     String(bonusValorBase),
              bonusValorCorrigido: String(bonusValorCorrigido),
            };

            if (existingScore.length > 0) {
              await db.update(obraScores).set(scoreData).where(eq(obraScores.id, existingScore[0].id));
            } else {
              await db.insert(obraScores).values({ projectId, userId, ...scoreData });
            }
          }
        } catch (e) {
          console.error("[submitScores] Erro ao persistir avaliação:", e);
          // Não propagar — retorna o resultado calculado mesmo se a persistência falhar
        }
      }

      return {
        notaFinal,
        eficiencia,
        mediaOs,
        npsValue,
        bonusValorBase,
        bonusValorCorrigido,
        hasDiaryData,
        totalDias,
        participantBonuses,
        hasFinancialLoss: !!hasFinancialLoss,
        breakdown: {
          seguranca:      notaSeguranca,
          funcionalidade: notaFuncionalidade,
          estetica:       notaEstetica,
          osModulos:      osModulosNa ? null : osModulos,
          osInversores:   osInversoresNa ? null : osInversores,
          npsCliente:     npsNa ? null : npsCliente,
        },
        message: hasFinancialLoss
          ? "Avaliação desconsiderada — prejuízo financeiro registrado. Bônus zerado."
          : hasDiaryData
          ? `Avaliação registrada. ${participantBonuses.length} participante(s) calculado(s).`
          : "Avaliação registrada. Diário de obra não encontrado — bônus individuais não calculados.",
      };
    }),

  // Retorna o snapshot salvo de uma avaliação (null se não houver)
  getEvaluation: protectedProcedure
    .input(z.object({ projectId: z.number(), evaluatorId: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return null;
        const rows = await db.select()
          .from(obraEvaluations)
          .where(and(
            eq(obraEvaluations.projectId, input.projectId),
            eq(obraEvaluations.evaluatorId, input.evaluatorId),
          ))
          .orderBy(desc(obraEvaluations.updatedAt))
          .limit(1);
        return rows[0] ?? null;
      } catch {
        return null;
      }
    }),

  // Gera contrato e procuração via API do form-pbi
  generateDocuments: protectedProcedure
    .input(z.string()) // codigoProjeto ex: "P1044"
    .mutation(async ({ input }) => {
      return generatePbiDocuments(input);
    }),

  // Lista projetos do form-pbi (ou mocks se nao configurado).
  // NAO faz upsert no DB local: a fonte de verdade eh a planilha via API.
  // Quando voltar a salvar scores reais, usaremos `obraScores` separado por code.
  listFromPbi: protectedProcedure.query(async () => {
    return fetchAllProjectsForUI();
  }),

  // ── Lista projetos ELEGIVEIS para avaliacao em um mes especifico ──
  // Input: monthYear no formato "YYYY-MM" (ex: "2026-04").
  // Janela considerada: o MES ANTERIOR ao selecionado.
  // Regra: installacaoFinalizada=true E pedidoVistoriaDate dentro da janela.
  listEvaluable: protectedProcedure
    .input(z.object({ monthYear: z.string().regex(/^\d{4}-\d{2}$/) }))
    .query(async ({ input }) => {
      const window = getEvaluationWindow(input.monthYear);
      const all = await fetchAllProjectsForUI();
      const eligible = all.filter((p) =>
        isEligibleForEvaluation(
          {
            installacaoFinalizada: p.installacaoFinalizada,
            pedidoVistoriaDate: p.pedidoVistoriaDate,
          } as any,
          window
        )
      );
      return { window, projects: eligible };
    }),

  // ── HISTORICO DE AVALIACOES ──
  // Le do JSON estatico server/lib/historicoAvaliacoes.json (175 obras avaliadas)
  // Quando integrar com a planilha "Avaliação de Qualidade de Obras 2025" via API,
  // substituir o data source no historicoData.ts.

  historyByMonth: protectedProcedure
    .input(z.object({ year: z.number().int().min(2020).max(2100) }))
    .query(async ({ input }) => historyByMonth(input.year)),

  historyQuarterly: protectedProcedure
    .input(z.object({ year: z.number().int().min(2020).max(2100) }))
    .query(async ({ input }) => historyQuarterly(input.year)),

  historyYearly: protectedProcedure
    .input(z.object({ year: z.number().int().min(2020).max(2100) }))
    .query(async ({ input }) => historyYearly(input.year)),

  // ── PEER REVIEW (Avaliação dos Pares — INTRA-OBRA) ──
  // Notas que os instaladores deram entre si nas obras em que trabalharam juntos.
  // Vem da planilha "Matriz Geral" (NotaObras + Matriz). Nada a ver com o módulo
  // /360 do portal (que será a avaliação 360 da empresa toda, escopo diferente).

  peerReviewYearly: protectedProcedure
    .input(z.object({ year: z.number().int().min(2020).max(2100) }))
    .query(async ({ input }) => peerReviewYearly(input.year)),

  peerReviewMatrix: protectedProcedure
    .query(async () => peerReviewMatrix()),

  peerReviewByObra: protectedProcedure
    .input(z.object({ projeto: z.string() }))
    .query(async ({ input }) => peerReviewByObra(input.projeto)),
});
