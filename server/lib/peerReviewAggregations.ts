import peerReviewMatriz from "./peerReviewMatriz.json";
import peerReviewCruzada from "./peerReviewCruzada.json";
import { HISTORICO } from "./historicoData";

export interface PeerReviewObra {
  projeto: string;
  cliente: string;
  presenca: string[];
  mediasPorColaborador: Record<string, number>;
}

export interface PeerReviewCruzada {
  avaliado: string;
  notasRecebidas: Record<string, number>;
}

const PEER_OBRAS: PeerReviewObra[] = peerReviewMatriz as unknown as PeerReviewObra[];
const PEER_MATRIZ: PeerReviewCruzada[] = peerReviewCruzada as unknown as PeerReviewCruzada[];

const NON_PERSON = new Set(["Material", "Projeto", "Projetos"]);

// Obtem o ano (do termino) cruzando com HISTORICO via codigo do projeto
function anoDoProjeto(projeto: string): number | null {
  const obra = HISTORICO.find(o => o.projeto === projeto);
  if (!obra?.termino) return null;
  return parseInt(obra.termino.slice(0, 4), 10);
}

// ── 1) Ranking Peer Review do ano ──
// Para cada colaborador, media das notas recebidas em obras do ano.
export function peerReviewYearly(year: number) {
  const obrasDoAno = PEER_OBRAS.filter(o => anoDoProjeto(o.projeto) === year);

  type Stat = { nome: string; isPerson: boolean; total: number; soma: number; max: number; min: number };
  const stats: Record<string, Stat> = {};

  for (const o of obrasDoAno) {
    for (const [nome, media] of Object.entries(o.mediasPorColaborador)) {
      if (!stats[nome]) {
        stats[nome] = { nome, isPerson: !NON_PERSON.has(nome), total: 0, soma: 0, max: -Infinity, min: Infinity };
      }
      stats[nome].total++;
      stats[nome].soma += media;
      stats[nome].max = Math.max(stats[nome].max, media);
      stats[nome].min = Math.min(stats[nome].min, media);
    }
  }

  const ranking = Object.values(stats)
    .map(s => ({
      nome: s.nome, isPerson: s.isPerson, total: s.total,
      mediaPeer: s.soma / s.total,
      max: s.max, min: s.min,
    }))
    .sort((a, b) => b.mediaPeer - a.mediaPeer);

  return {
    year,
    totalObrasComPeerReview: obrasDoAno.length,
    ranking,
  };
}

// ── 2) Matriz cruzada (heatmap) ──
// Quem avalia bem quem? Para cada avaliado, lista as notas que recebeu de cada par.
export function peerReviewMatrix() {
  return PEER_MATRIZ;
}

// ── 3) Detalhe por obra ──
export function peerReviewByObra(projeto: string) {
  return PEER_OBRAS.find(o => o.projeto === projeto) ?? null;
}
