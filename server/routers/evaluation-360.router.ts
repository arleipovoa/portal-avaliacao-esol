/**
 * ============================================================================
 * Router de API - Portal 360° (Avaliação de Desempenho)
 * ============================================================================
 * 
 * Endpoints para gerenciar avaliações 360°, ciclos, critérios e agregados
 * Banco de dados: portal_360
 */

import { Router, Request, Response } from "express";
import { db360 } from "../_core/db";
import {
  cycles360,
  evaluations360,
  aggregates360,
  podium360,
  criteria360,
  users360,
} from "../../drizzle/schema-360";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../_core/auth.middleware";
import { checkAccess } from "../_core/accessControl";

const router = Router();

// ─── Middleware de Autenticação ───
router.use(requireAuth);

/**
 * GET /api/360/cycles
 * Listar todos os ciclos de avaliação
 */
router.get("/cycles", async (req: Request, res: Response) => {
  try {
    const cycles = await db360.select().from(cycles360);
    res.json(cycles);
  } catch (error) {
    console.error("Erro ao listar ciclos:", error);
    res.status(500).json({ error: "Erro ao listar ciclos" });
  }
});

/**
 * GET /api/360/cycles/:cycleId
 * Obter detalhes de um ciclo específico
 */
router.get("/cycles/:cycleId", async (req: Request, res: Response) => {
  try {
    const { cycleId } = req.params;
    const cycle = await db360
      .select()
      .from(cycles360)
      .where(eq(cycles360.id, parseInt(cycleId)));

    if (cycle.length === 0) {
      return res.status(404).json({ error: "Ciclo não encontrado" });
    }

    res.json(cycle[0]);
  } catch (error) {
    console.error("Erro ao obter ciclo:", error);
    res.status(500).json({ error: "Erro ao obter ciclo" });
  }
});

/**
 * GET /api/360/criteria
 * Listar todos os critérios de avaliação 360°
 */
router.get("/criteria", async (req: Request, res: Response) => {
  try {
    const criteria = await db360
      .select()
      .from(criteria360)
      .where(eq(criteria360.active, true));

    res.json(criteria);
  } catch (error) {
    console.error("Erro ao listar critérios:", error);
    res.status(500).json({ error: "Erro ao listar critérios" });
  }
});

/**
 * GET /api/360/criteria/:type
 * Listar critérios por tipo (base360, detailed360, leadership)
 */
router.get("/criteria/:type", async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const criteria = await db360
      .select()
      .from(criteria360)
      .where(
        and(
          eq(criteria360.type, type as any),
          eq(criteria360.active, true)
        )
      );

    res.json(criteria);
  } catch (error) {
    console.error("Erro ao listar critérios por tipo:", error);
    res.status(500).json({ error: "Erro ao listar critérios" });
  }
});

/**
 * GET /api/360/evaluations/:cycleId/:userId
 * Obter avaliações de um usuário em um ciclo específico
 */
router.get(
  "/evaluations/:cycleId/:userId",
  async (req: Request, res: Response) => {
    try {
      const { cycleId, userId } = req.params;

      const evaluations = await db360
        .select()
        .from(evaluations360)
        .where(
          and(
            eq(evaluations360.cycleId, parseInt(cycleId)),
            eq(evaluations360.evaluateeId, parseInt(userId))
          )
        );

      res.json(evaluations);
    } catch (error) {
      console.error("Erro ao obter avaliações:", error);
      res.status(500).json({ error: "Erro ao obter avaliações" });
    }
  }
);

/**
 * POST /api/360/evaluations
 * Criar ou atualizar uma avaliação
 */
router.post("/evaluations", async (req: Request, res: Response) => {
  try {
    const { cycleId, evaluatorId, evaluateeId, relation, items } = req.body;

    // Validar entrada
    if (!cycleId || !evaluatorId || !evaluateeId || !relation) {
      return res.status(400).json({ error: "Campos obrigatórios faltando" });
    }

    // Verificar se avaliação já existe
    const existing = await db360
      .select()
      .from(evaluations360)
      .where(
        and(
          eq(evaluations360.cycleId, cycleId),
          eq(evaluations360.evaluatorId, evaluatorId),
          eq(evaluations360.evaluateeId, evaluateeId),
          eq(evaluations360.relation, relation)
        )
      );

    if (existing.length > 0) {
      // Atualizar
      await db360
        .update(evaluations360)
        .set({
          items,
          updatedAt: new Date(),
        })
        .where(eq(evaluations360.id, existing[0].id));

      return res.json({
        message: "Avaliação atualizada",
        id: existing[0].id,
      });
    } else {
      // Criar
      const result = await db360.insert(evaluations360).values({
        cycleId,
        evaluatorId,
        evaluateeId,
        relation,
        items,
        status: "draft",
      });

      res.status(201).json({
        message: "Avaliação criada",
        id: result.insertId,
      });
    }
  } catch (error) {
    console.error("Erro ao criar/atualizar avaliação:", error);
    res.status(500).json({ error: "Erro ao processar avaliação" });
  }
});

/**
 * PUT /api/360/evaluations/:evaluationId/submit
 * Submeter uma avaliação (mudar status de draft para submitted)
 */
router.put(
  "/evaluations/:evaluationId/submit",
  async (req: Request, res: Response) => {
    try {
      const { evaluationId } = req.params;

      await db360
        .update(evaluations360)
        .set({
          status: "submitted",
          submittedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(evaluations360.id, parseInt(evaluationId)));

      res.json({ message: "Avaliação submetida com sucesso" });
    } catch (error) {
      console.error("Erro ao submeter avaliação:", error);
      res.status(500).json({ error: "Erro ao submeter avaliação" });
    }
  }
);

/**
 * GET /api/360/aggregates/:cycleId/:userId
 * Obter agregados (notas consolidadas) de um usuário em um ciclo
 */
router.get(
  "/aggregates/:cycleId/:userId",
  async (req: Request, res: Response) => {
    try {
      const { cycleId, userId } = req.params;

      const aggregates = await db360
        .select()
        .from(aggregates360)
        .where(
          and(
            eq(aggregates360.cycleId, parseInt(cycleId)),
            eq(aggregates360.userId, parseInt(userId))
          )
        );

      if (aggregates.length === 0) {
        return res.status(404).json({ error: "Agregados não encontrados" });
      }

      res.json(aggregates[0]);
    } catch (error) {
      console.error("Erro ao obter agregados:", error);
      res.status(500).json({ error: "Erro ao obter agregados" });
    }
  }
);

/**
 * GET /api/360/podium/:cycleId
 * Obter pódio (ranking) de um ciclo
 */
router.get("/podium/:cycleId", async (req: Request, res: Response) => {
  try {
    const { cycleId } = req.params;

    const podium = await db360
      .select()
      .from(podium360)
      .where(eq(podium360.cycleId, parseInt(cycleId)));

    res.json(podium);
  } catch (error) {
    console.error("Erro ao obter pódio:", error);
    res.status(500).json({ error: "Erro ao obter pódio" });
  }
});

/**
 * GET /api/360/users
 * Listar usuários do Portal 360°
 */
router.get("/users", async (req: Request, res: Response) => {
  try {
    const users = await db360
      .select()
      .from(users360)
      .where(eq(users360.status, "active"));

    res.json(users);
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    res.status(500).json({ error: "Erro ao listar usuários" });
  }
});

export default router;
