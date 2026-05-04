import { HISTORICO, type ObraAvaliada } from "./historicoData";

// "Material", "Projeto"/"Projetos" e "Planejamento" sao contas globais (nao pessoas).
const NON_PERSON = new Set(["Material", "Projeto", "Projetos", "Planejamento"]);

// A partir de 2026, "Gabriel T" passou a ser registrado como "Planejamento"
// (mudanca de papel). Em anos anteriores permanece como instalador.
function displayName(rawName: string, year: number): string {
  if (year >= 2026 && rawName === "Gabriel T") return "Planejamento";
  return rawName;
}

function obrasDoAno(year: number): ObraAvaliada[] {
  return HISTORICO.filter(o => o.termino?.startsWith(String(year)));
}

function mesDe(iso: string | null): number | null {
  if (!iso) return null;
  const m = iso.match(/^(\d{4})-(\d{2})/);
  return m ? parseInt(m[2], 10) : null;
}

function trimestreDe(iso: string | null): number | null {
  const m = mesDe(iso);
  return m === null ? null : Math.ceil(m / 3);
}

function avg(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v !== null);
  if (nums.length === 0) return null;
  return nums.reduce((s, v) => s + v, 0) / nums.length;
}

const MONTH_LABELS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function classificacaoCount(obras: ObraAvaliada[]) {
  const counts: Record<string, number> = { Excelente: 0, Bom: 0, Regular: 0, Ruim: 0 };
  for (const o of obras) {
    const obs = o.observacao;
    if (obs in counts) counts[obs]++;
  }
  return counts;
}

// ── 1) MES A MES ──
export function historyByMonth(year: number) {
  const obras = obrasDoAno(year);
  const grupos: Record<number, ObraAvaliada[]> = {};
  for (const o of obras) {
    const m = mesDe(o.termino);
    if (m === null) continue;
    if (!grupos[m]) grupos[m] = [];
    grupos[m].push(o);
  }
  return Object.keys(grupos)
    .map(k => parseInt(k, 10))
    .sort((a, b) => a - b)
    .map(m => ({
      month: m,
      monthLabel: MONTH_LABELS[m - 1],
      monthYear: `${year}-${String(m).padStart(2, "0")}`,
      total: grupos[m].length,
      mediaNota: avg(grupos[m].map(o => o.notaEquipePct)),
      obras: grupos[m].map(o => ({
        projeto: o.projeto,
        cliente: o.cliente,
        termino: o.termino,
        notaEquipePct: o.notaEquipePct,
        notaSeguranca: o.notaSeguranca,
        notaFuncionalidade: o.notaFuncionalidade,
        notaEstetica: o.notaEstetica,
        observacao: o.observacao,
        equipe: o.equipe,
      })),
    }));
}

// ── 2) TRIMESTRAL ──
export function historyQuarterly(year: number) {
  const obras = obrasDoAno(year);
  const trimGroups: Record<number, ObraAvaliada[]> = { 1: [], 2: [], 3: [], 4: [] };
  for (const o of obras) {
    const t = trimestreDe(o.termino);
    if (t !== null && trimGroups[t]) trimGroups[t].push(o);
  }
  return [1, 2, 3, 4].map(t => ({
    trimestre: t,
    label: `${t}º trimestre`,
    monthRange: `${MONTH_LABELS[(t - 1) * 3]} - ${MONTH_LABELS[(t - 1) * 3 + 2]}`,
    total: trimGroups[t].length,
    mediaSeguranca: avg(trimGroups[t].map(o => o.notaSeguranca)),
    mediaFuncionalidade: avg(trimGroups[t].map(o => o.notaFuncionalidade)),
    mediaEstetica: avg(trimGroups[t].map(o => o.notaEstetica)),
    mediaFinal: avg(trimGroups[t].map(o => o.notaEquipePct)),
    distribClassif: classificacaoCount(trimGroups[t]),
  }));
}

// ── 3) ANUAL ──
// Ranking espelha a logica da aba "Ranking Instaladores":
//   Track = mediaGeralObras × (totalParticipacoes / totalAvaliacoes)
// Onde mediaGeralObras = media das notaEquipePct das obras em que participou (em escala 0-10).
// Na planilha, F (Geral Obras) = AVERAGE(BP4:BP1199)/10  → soma das notas em escala 0-100 sobre 10.
// Aqui usamos diretamente a notaEquipePct (0-100) e mantemos consistencia mostrando em %.
export function historyYearly(year: number) {
  const obras = obrasDoAno(year);
  const totalAvaliacoes = obras.length;

  // Stats por instalador
  type Stat = {
    nome: string;
    isPerson: boolean;
    total: number;
    somaNotaFinal: number;
    somaSeguranca: number; nSeg: number;
    somaFuncional: number; nFunc: number;
    somaEstetica: number;  nEst: number;
    max: number; min: number;
  };
  const stats: Record<string, Stat> = {};

  for (const o of obras) {
    if (o.notaEquipePct === null) continue;
    for (const rawNome of o.equipe) {
      const nome = displayName(rawNome, year);
      if (!stats[nome]) {
        stats[nome] = {
          nome, isPerson: !NON_PERSON.has(nome),
          total: 0, somaNotaFinal: 0,
          somaSeguranca: 0, nSeg: 0,
          somaFuncional: 0, nFunc: 0,
          somaEstetica: 0,  nEst: 0,
          max: -Infinity, min: Infinity,
        };
      }
      const s = stats[nome];
      s.total += 1;
      s.somaNotaFinal += o.notaEquipePct;
      s.max = Math.max(s.max, o.notaEquipePct);
      s.min = Math.min(s.min, o.notaEquipePct);
      if (o.notaSeguranca !== null)      { s.somaSeguranca += o.notaSeguranca; s.nSeg++; }
      if (o.notaFuncionalidade !== null) { s.somaFuncional += o.notaFuncionalidade; s.nFunc++; }
      if (o.notaEstetica !== null)       { s.somaEstetica  += o.notaEstetica;  s.nEst++; }
    }
  }

  const ranking = Object.values(stats)
    .map(s => {
      const media = s.somaNotaFinal / s.total;
      // Track = media × (participacao / totalGeral). Reflete fidelidade ao volume avaliado.
      const track = totalAvaliacoes > 0 ? media * (s.total / totalAvaliacoes) : 0;
      return {
        nome: s.nome,
        isPerson: s.isPerson,
        total: s.total,
        media,
        mediaSeguranca: s.nSeg > 0 ? s.somaSeguranca / s.nSeg : null,
        mediaFuncional: s.nFunc > 0 ? s.somaFuncional / s.nFunc : null,
        mediaEstetica:  s.nEst > 0 ? s.somaEstetica  / s.nEst  : null,
        track,
        max: s.max,
        min: s.min,
      };
    })
    .sort((a, b) => b.track - a.track); // Ordena por Track decrescente

  return {
    year,
    total: totalAvaliacoes,
    mediaSeguranca: avg(obras.map(o => o.notaSeguranca)),
    mediaFuncionalidade: avg(obras.map(o => o.notaFuncionalidade)),
    mediaEstetica: avg(obras.map(o => o.notaEstetica)),
    mediaFinal: avg(obras.map(o => o.notaEquipePct)),
    distribClassif: classificacaoCount(obras),
    ranking,
  };
}
