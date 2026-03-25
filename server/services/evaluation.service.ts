import * as db from "../db";
import {
  BONUS_PERFORMANCE_MAX, BONUS_PUNCTUALITY_MAX, PERFORMANCE_CUTOFF,
  CRITERIA_TO_RADAR, RADAR_CATEGORIES,
} from "@shared/types";

export type EvalScoreResult = {
  nota360: number;
  notaLideranca: number;
  avaliacaoGlobal: number;
  bonusPontualidade: number;
  bonusDesempenho: number;
  radarAverages: Record<string, number>;
};

function computeRobustAverage(scores: number[]): number {
  if (scores.length >= 10) {
    const sorted = [...scores].sort((a, b) => a - b);
    const trimCount = Math.floor(sorted.length * 0.1);
    const trimmed = sorted.slice(trimCount, sorted.length - trimCount);
    return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  }
  const sorted = [...scores].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function computeCriteriaAverages(evals: any[]): number {
  const criteriaScores: Record<number, number[]> = {};
  for (const ev of evals) {
    if (!ev.items) continue;
    for (const item of ev.items as any[]) {
      if (!criteriaScores[item.criteriaId]) criteriaScores[item.criteriaId] = [];
      criteriaScores[item.criteriaId].push(item.score);
    }
  }
  const averages: number[] = [];
  for (const scores of Object.values(criteriaScores)) {
    averages.push(computeRobustAverage(scores));
  }
  return averages.length > 0 ? averages.reduce((a, b) => a + b, 0) / averages.length : 10;
}

function computeLeadershipAverages(evals: any[]): number {
  const criteriaScores: Record<number, number[]> = {};
  for (const ev of evals) {
    if (!ev.items) continue;
    for (const item of ev.items as any[]) {
      if (!criteriaScores[item.criteriaId]) criteriaScores[item.criteriaId] = [];
      criteriaScores[item.criteriaId].push(item.score);
    }
  }
  const averages: number[] = [];
  for (const scores of Object.values(criteriaScores)) {
    averages.push(scores.reduce((a, b) => a + b, 0) / scores.length);
  }
  return averages.length > 0 ? averages.reduce((a, b) => a + b, 0) / averages.length : 10;
}

export async function calculateUserScore(
  user: { id: number },
  submitted: any[],
  allCriteria: any[],
  punctualityData: any[]
): Promise<EvalScoreResult> {
  const userEvals = submitted.filter((e) => e.evaluateeId === user.id && e.relation !== "self");

  const evals360 = userEvals.filter((e) =>
    e.relation === "same_area" || e.relation === "other_area" || e.relation === "bottom_up"
  );
  const evalsLeadership = userEvals.filter((e) => e.relation === "leadership");

  const nota360 = evals360.length > 0 ? computeCriteriaAverages(evals360) : 10;
  const notaLideranca = evalsLeadership.length > 0 ? computeLeadershipAverages(evalsLeadership) : 10;
  const avaliacaoGlobal = (nota360 + notaLideranca) / 2;

  const punct = punctualityData.find((p) => p.userId === user.id);
  const bonusPontualidade = (!punct || punct.eligible) ? BONUS_PUNCTUALITY_MAX : 0;
  const bonusDesempenho = avaliacaoGlobal < PERFORMANCE_CUTOFF ? 0 : BONUS_PERFORMANCE_MAX * (avaliacaoGlobal / 10);

  const radarData: Record<string, number[]> = {};
  for (const cat of RADAR_CATEGORIES) radarData[cat] = [];

  for (const ev of [...evals360, ...evalsLeadership]) {
    if (!ev.items) continue;
    for (const item of ev.items as any[]) {
      const crit = allCriteria.find((c) => c.id === item.criteriaId);
      if (crit) {
        const radarCat = CRITERIA_TO_RADAR[crit.code];
        if (radarCat && radarData[radarCat]) {
          radarData[radarCat].push(item.score);
        }
      }
    }
  }

  const radarAverages: Record<string, number> = {};
  for (const [cat, scores] of Object.entries(radarData)) {
    radarAverages[cat] = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 10;
  }

  return { nota360, notaLideranca, avaliacaoGlobal, bonusPontualidade, bonusDesempenho, radarAverages };
}

export async function runCycleCalculation(cycleId: number) {
  const allEvals = await db.getEvaluationsByCycle(cycleId);
  const submitted = allEvals.filter((e) => e.status === "submitted");
  const allUsers = await db.getAllUsers();
  const activeUsers = allUsers.filter((u) => u.status === "active");
  const allCriteria = await db.getAllCriteria();
  const punctualityData = await db.getPunctualityByCycle(cycleId);

  for (const user of activeUsers) {
    const result = await calculateUserScore(user, submitted, allCriteria, punctualityData);

    await db.upsertAggregate({
      cycleId,
      userId: user.id,
      nota360: result.nota360.toFixed(2),
      notaLideranca: result.notaLideranca.toFixed(2),
      avaliacaoGlobal: result.avaliacaoGlobal.toFixed(2),
      bonusPontualidade: result.bonusPontualidade.toFixed(2),
      bonusDesempenho: result.bonusDesempenho.toFixed(2),
      bonusPodio: "0",
      totalBonus: (result.bonusPontualidade + result.bonusDesempenho).toFixed(2),
      radarData: result.radarAverages,
    });
  }

  return { activeUsers, submitted };
}
