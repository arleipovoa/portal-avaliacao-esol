import * as db from "../db";
import { PODIUM_PRIZES } from "@shared/types";

export type PodiumEntry = {
  cycleId: number;
  userId: number;
  position: number;
  avaliacaoGlobal: string;
  notaLideranca: string;
  nota360: string;
  prize: string;
};

export async function calculatePodiumAndBonus(cycleId: number): Promise<PodiumEntry[]> {
  const allAggs = await db.getAggregatesByCycle(cycleId);

  const sorted = [...allAggs].sort((a, b) => {
    const diff = Number(b.avaliacaoGlobal) - Number(a.avaliacaoGlobal);
    if (diff !== 0) return diff;
    const diff2 = Number(b.notaLideranca) - Number(a.notaLideranca);
    if (diff2 !== 0) return diff2;
    return Number(b.nota360) - Number(a.nota360);
  });

  const podiumEntries: PodiumEntry[] = sorted.slice(0, 3).map((agg, idx) => ({
    cycleId,
    userId: agg.userId,
    position: idx + 1,
    avaliacaoGlobal: agg.avaliacaoGlobal ?? "0",
    notaLideranca: agg.notaLideranca ?? "0",
    nota360: agg.nota360 ?? "0",
    prize: String(PODIUM_PRIZES[idx + 1] || 0),
  }));

  await db.savePodium(cycleId, podiumEntries);

  for (const entry of podiumEntries) {
    const agg = allAggs.find((a) => a.userId === entry.userId);
    if (agg) {
      const totalBonus = Number(agg.bonusPontualidade) + Number(agg.bonusDesempenho) + Number(entry.prize);
      await db.upsertAggregate({
        cycleId,
        userId: entry.userId,
        bonusPodio: entry.prize,
        totalBonus: totalBonus.toFixed(2),
      });
    }
  }

  return podiumEntries;
}

export async function getBonusSummary(cycleId?: number) {
  const allCycles = await db.getAllCycles();
  const currentYear = new Date().getFullYear().toString();

  let monthlyData = null;
  if (cycleId) {
    const aggs = await db.getAggregatesByCycle(cycleId);
    monthlyData = {
      totalPontualidade: aggs.reduce((s, a) => s + Number(a.bonusPontualidade), 0),
      totalDesempenho: aggs.reduce((s, a) => s + Number(a.bonusDesempenho), 0),
      totalPodio: aggs.reduce((s, a) => s + Number(a.bonusPodio), 0),
      totalGeral: aggs.reduce((s, a) => s + Number(a.totalBonus), 0),
      count: aggs.length,
    };
  }

  let annualPontualidade = 0, annualDesempenho = 0, annualPodio = 0, annualTotal = 0;
  for (const cycle of allCycles) {
    if (cycle.monthYear.startsWith(currentYear)) {
      const aggs = await db.getAggregatesByCycle(cycle.id);
      annualPontualidade += aggs.reduce((s, a) => s + Number(a.bonusPontualidade), 0);
      annualDesempenho += aggs.reduce((s, a) => s + Number(a.bonusDesempenho), 0);
      annualPodio += aggs.reduce((s, a) => s + Number(a.bonusPodio), 0);
      annualTotal += aggs.reduce((s, a) => s + Number(a.totalBonus), 0);
    }
  }

  return {
    monthly: monthlyData,
    annual: {
      totalPontualidade: annualPontualidade,
      totalDesempenho: annualDesempenho,
      totalPodio: annualPodio,
      totalGeral: annualTotal,
    },
  };
}
