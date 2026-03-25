import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const dashboardRouter = router({
  publicStats: publicProcedure.query(async () => {
    const allUsers = await db.getAllUsers();
    const allAreas = await db.getAllAreas();
    const allCycles = await db.getAllCycles();
    const allEvals = await db.getAllEvaluations?.() ?? [];
    const closedCycles = allCycles.filter((c) => c.status === "closed" || c.status === "published").length;
    const companies = new Set(allAreas.map((a) => a.companyName).filter(Boolean)).size;
    let totalBonus = 0;
    try {
      const allAggs = await db.getAllAggregates?.();
      if (allAggs) totalBonus = allAggs.reduce((sum: number, a: any) => sum + Number(a.totalBonus ?? 0), 0);
    } catch {}
    return {
      totalEvaluations: allEvals.length || null,
      activeCollaborators: allUsers.length,
      closedCycles,
      companies,
      totalBonus: totalBonus || null,
    };
  }),

  myData: protectedProcedure.query(async ({ ctx }) => {
    const cycle = await db.getCurrentCycle();
    const allCycles = await db.getAllCycles();
    const currentYear = new Date().getFullYear().toString();

    let currentAggregate = null;
    let monthlyPodium: any[] = [];
    if (cycle) {
      const aggs = await db.getAggregatesByCycle(cycle.id);
      currentAggregate = aggs.find((a) => a.userId === ctx.user.id) || null;
      monthlyPodium = await db.getPodiumByCycle(cycle.id);
    }

    let annualBonus = 0;
    const annualAggregates: any[] = [];
    for (const c of allCycles) {
      if (c.monthYear.startsWith(currentYear)) {
        const aggs = await db.getAggregatesByCycle(c.id);
        const myAgg = aggs.find((a) => a.userId === ctx.user.id);
        if (myAgg) {
          annualBonus += Number(myAgg.totalBonus);
          annualAggregates.push({ monthYear: c.monthYear, ...myAgg });
        }
      }
    }

    const annualScores: Record<number, { total: number; count: number }> = {};
    for (const c of allCycles) {
      if (c.monthYear.startsWith(currentYear)) {
        const aggs = await db.getAggregatesByCycle(c.id);
        for (const a of aggs) {
          if (!annualScores[a.userId]) annualScores[a.userId] = { total: 0, count: 0 };
          annualScores[a.userId].total += Number(a.avaliacaoGlobal);
          annualScores[a.userId].count += 1;
        }
      }
    }
    const annualRanking = Object.entries(annualScores)
      .map(([uid, data]) => ({ userId: Number(uid), average: data.total / data.count }))
      .sort((a, b) => b.average - a.average);
    const myAnnualPosition = annualRanking.findIndex((r) => r.userId === ctx.user.id) + 1;

    let evalProgress = { total: 0, done: 0, percent: 0 };
    if (cycle) {
      const myEvals = await db.getEvaluationsByEvaluator(cycle.id, ctx.user.id);
      const submittedCount = myEvals.filter((e) => e.status === "submitted").length;
      const allUsers = await db.getAllUsers();
      const allAreas = await db.getAllAreas();
      const me = allUsers.find((u) => u.id === ctx.user.id);
      if (me) {
        const myArea = allAreas.find((a) => a.id === me.areaId);
        const isDirectoria = myArea?.name === "Diretoria";
        const myAreaIds = new Set<number | null | undefined>([me.areaId]);
        if (me.secondaryAreaId) myAreaIds.add(me.secondaryAreaId);

        const sameAreaUsers = allUsers.filter(
          (u) => u.id !== me.id && myAreaIds.has(u.areaId) && u.status === "active"
        );
        const sameAreaIds = new Set(sameAreaUsers.map((u) => u.id));
        const mySubIds = new Set<number>();
        if (me.appRole === "leader" || me.appRole === "admin") {
          allUsers
            .filter((u) => (u.leaderId === me.id || u.secondaryLeaderId === me.id) && u.status === "active")
            .forEach((u) => mySubIds.add(u.id));
        }
        const myLeaderIds = new Set<number>();
        if (me.leaderId) myLeaderIds.add(me.leaderId);
        if (me.secondaryLeaderId) myLeaderIds.add(me.secondaryLeaderId);

        let total = 1 + sameAreaUsers.length;
        if (me.appRole === "leader" || me.appRole === "admin") total += mySubIds.size;
        if (me.appRole !== "admin") total += myLeaderIds.size;
        if (!isDirectoria) {
          const excludeFromConvivencia = new Set([me.id, ...Array.from(sameAreaIds), ...Array.from(mySubIds), ...Array.from(myLeaderIds)]);
          const convivenciaCount = allUsers.filter(
            (u) => !excludeFromConvivencia.has(u.id) && u.status === "active"
          ).length;
          total += convivenciaCount;
        }
        evalProgress = { total, done: submittedCount, percent: total > 0 ? Math.round((submittedCount / total) * 100) : 0 };
      }
    }

    return {
      cycle,
      currentAggregate,
      monthlyPodium: monthlyPodium.map((p) => ({
        position: p.position,
        avaliacaoGlobal: p.avaliacaoGlobal,
        nota360: p.nota360,
        notaLideranca: p.notaLideranca,
      })),
      annualBonus,
      annualAggregates,
      myAnnualPosition,
      annualRankingTotal: annualRanking.length,
      evalProgress,
    };
  }),
});
