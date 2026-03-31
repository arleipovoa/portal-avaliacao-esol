/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

// ─── App-specific types ───
export type AppRole = "admin" | "leader" | "employee";

export type EvalRelation = "same_area" | "other_area" | "leadership" | "self" | "bottom_up";

export type CycleStatus = "open" | "closed" | "published";

export type EvalItem = {
  criteriaId: number;
  score: number;
  justification: string | null;
};

export type RadarCategory = {
  category: string;
  value: number;
  fullMark: number;
};

export const RADAR_CATEGORIES = [
  "Comunicação & Postura",
  "Qualidade & Técnica",
  "Processos & Prazos",
  "Autonomia & Proatividade",
  "Segurança & Zelo",
] as const;

export const CRITERIA_TO_RADAR: Record<string, string> = {
  comunicacao_clareza: "Comunicação & Postura",
  colaboracao_equipe: "Comunicação & Postura",
  respeito_postura: "Comunicação & Postura",
  entrega_qualidade_tecnica: "Qualidade & Técnica",
  qualidade_retrabalho: "Qualidade & Técnica",
  cumprimento_prazos_slas: "Processos & Prazos",
  organizacao_processos: "Processos & Prazos",
  aderencia_processos_prazos: "Processos & Prazos",
  documentacao_registro: "Processos & Prazos",
  proatividade_melhoria: "Autonomia & Proatividade",
  autonomia_prioridades: "Autonomia & Proatividade",
  confiabilidade_consistencia: "Autonomia & Proatividade",
  desenvolvimento_autonomia: "Autonomia & Proatividade",
  resultado_metas: "Qualidade & Técnica",
  postura_valores: "Comunicação & Postura",
  foco_cliente_posvenda: "Qualidade & Técnica",
  foco_cliente_negocio: "Qualidade & Técnica",
  seguranca_5s_epis: "Segurança & Zelo",
  seguranca_5s_zelo: "Segurança & Zelo",
};

export const PODIUM_PRIZES: Record<number, number> = {
  1: 0,
  2: 0,
  3: 0,
};

export const BONUS_PERFORMANCE_MAX = 125;
export const BONUS_PUNCTUALITY_MAX = 125;
export const PERFORMANCE_CUTOFF = 7;
