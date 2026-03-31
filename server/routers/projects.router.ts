import { Router } from "express";
import { getDb } from "../db";
import { projects, projectMembers, obraScores, obraEvaluations, obraCriteria, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { canAccessObras } from "../_core/accessControl";

const router = Router();

// ─── GET /api/projects - List all projects ───
router.get("/", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });
    const allProjects = await db.select().from(projects);
    res.json(allProjects);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// ─── GET /api/projects/:id - Get project details with members ───
router.get("/:id", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });
    const projectId = parseInt(req.params.id);
    const project = await db.select().from(projects).where(eq(projects.id, projectId));
    
    if (!project.length) {
      return res.status(404).json({ error: "Project not found" });
    }

    const members = await db.select().from(projectMembers).where(eq(projectMembers.projectId, projectId));
    
    res.json({
      ...project[0],
      members,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

// ─── POST /api/projects - Create new project ───
router.post("/", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });
    const { code, clientName, address, city, state, moduleCount, modulePower, powerKwp, category } = req.body;

    // Calculate category based on kWp if not provided
    let finalCategory = category;
    if (!finalCategory && powerKwp) {
      if (powerKwp <= 5) finalCategory = "B1";
      else if (powerKwp <= 10) finalCategory = "B2";
      else if (powerKwp <= 20) finalCategory = "B3";
      else if (powerKwp <= 30) finalCategory = "B4";
      else if (powerKwp <= 50) finalCategory = "B5";
      else if (powerKwp <= 75) finalCategory = "B6";
      else finalCategory = "B7";
    }

    const result = await db.insert(projects).values({
      code,
      clientName,
      address,
      city,
      state,
      moduleCount,
      modulePower,
      powerKwp,
      category: finalCategory,
      status: "planning",
    });

    res.status(201).json({ id: result.insertId, message: "Project created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to create project" });
  }
});

// ─── PUT /api/projects/:id - Update project ───
router.put("/:id", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });
    const projectId = parseInt(req.params.id);
    const { clientName, address, city, state, startDate, endDate, completedDate, status } = req.body;

    await db.update(projects).set({
      clientName,
      address,
      city,
      state,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      completedDate: completedDate ? new Date(completedDate) : undefined,
      status,
    }).where(eq(projects.id, projectId));

    res.json({ message: "Project updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update project" });
  }
});

// ─── POST /api/projects/:id/members - Add member to project ───
router.post("/:id/members", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });
    const projectId = parseInt(req.params.id);
    const { userId, role } = req.body;

    const result = await db.insert(projectMembers).values({
      projectId,
      userId,
      role: role || "installer",
    });

    res.status(201).json({ id: result.insertId, message: "Member added successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to add member" });
  }
});

// ─── PUT /api/projects/:projectId/members/:memberId - Update member role ───
router.put("/:projectId/members/:memberId", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });
    const projectId = parseInt(req.params.projectId);
    const memberId = parseInt(req.params.memberId);
    const { role } = req.body;

    await db.update(projectMembers).set({ role }).where(
      and(eq(projectMembers.projectId, projectId), eq(projectMembers.id, memberId))
    );

    res.json({ message: "Member role updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update member" });
  }
});

// ─── DELETE /api/projects/:projectId/members/:memberId - Remove member from project ───
router.delete("/:projectId/members/:memberId", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });
    const projectId = parseInt(req.params.projectId);
    const memberId = parseInt(req.params.memberId);

    await db.delete(projectMembers).where(
      and(eq(projectMembers.projectId, projectId), eq(projectMembers.id, memberId))
    );

    res.json({ message: "Member removed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove member" });
  }
});

// ─── GET /api/projects/:id/criteria - Get obra criteria for evaluation ───
router.get("/:id/criteria", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });
    const criteria = await db.select().from(obraCriteria).where(eq(obraCriteria.active, true));
    
    // Group by category
    const grouped = criteria.reduce((acc, criterion) => {
      if (!acc[criterion.category]) {
        acc[criterion.category] = [];
      }
      acc[criterion.category].push(criterion);
      return acc;
    }, {} as Record<string, typeof criteria>);

    res.json(grouped);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch criteria" });
  }
});

// ─── POST /api/projects/:id/scores - Submit obra evaluation scores ───
router.post("/:id/scores", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });
    const projectId = parseInt(req.params.id);
    const { userId, notaSeguranca, notaFuncionalidade, notaEstetica, mediaOs, eficiencia, npsCliente } = req.body;

    // Calculate final score (0-100)
    const baseScore = ((notaSeguranca * 2 + notaFuncionalidade * 2 + notaEstetica * 1) / 5);
    const notaObraPercentual = (baseScore * 0.5) + (mediaOs * 0.2) + (eficiencia * 0.15) + (npsCliente * 0.15);

    // Get project to determine bonus value
    const project = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project.length) {
      return res.status(404).json({ error: "Project not found" });
    }

    const bonusMap: Record<string, number> = {
      B1: 200,
      B2: 300,
      B3: 500,
      B4: 750,
      B5: 1000,
      B6: 1500,
      B7: 2000,
    };

    const bonusValorBase = bonusMap[project[0].category || "B1"] || 200;
    const bonusValorCorrigido = bonusValorBase * (notaObraPercentual / 100);

    // Insert or update score
    const existingScore = await db.select().from(obraScores).where(
      and(eq(obraScores.projectId, projectId), eq(obraScores.userId, userId))
    );

    if (existingScore.length) {
      await db.update(obraScores).set({
        notaSeguranca,
        notaFuncionalidade,
        notaEstetica,
        mediaOs,
        eficiencia,
        npsCliente,
        notaObraPercentual,
        bonusValorBase,
        bonusValorCorrigido,
      }).where(eq(obraScores.id, existingScore[0].id));
    } else {
      await db.insert(obraScores).values({
        projectId,
        userId,
        notaSeguranca,
        notaFuncionalidade,
        notaEstetica,
        mediaOs,
        eficiencia,
        npsCliente,
        notaObraPercentual,
        bonusValorBase,
        bonusValorCorrigido,
      });
    }

    res.json({
      notaObraPercentual,
      bonusValorBase,
      bonusValorCorrigido,
      message: "Scores submitted successfully",
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to submit scores" });
  }
});

// ─── GET /api/projects/:id/scores - Get all scores for a project ───
router.get("/:id/scores", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });
    const projectId = parseInt(req.params.id);
    const scores = await db.select().from(obraScores).where(eq(obraScores.projectId, projectId));
    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch scores" });
  }
});

export { router as projectsRouter };
