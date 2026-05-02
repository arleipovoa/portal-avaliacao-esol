import historico from "./historicoAvaliacoes.json";

export interface ObraAvaliada {
  projeto: string;
  cliente: string;
  inicio: string | null;       // ISO YYYY-MM-DD
  termino: string | null;      // ISO YYYY-MM-DD
  qtdModulos: number | null;
  potenciaModuloWp: number | null;
  notaSeguranca: number | null;       // 0-100, peso 2.0
  notaFuncionalidade: number | null;  // 0-100, peso 2.0
  notaEstetica: number | null;        // 0-100, peso 1.0
  preenchOSModulos: number | null;
  preenchOSInversores: number | null;
  mediaOS: number | null;
  eficiencia: number | null;
  nps: number | null;
  notaEquipePct: number | null; // 0-100 (nota final consolidada)
  observacao: string;           // "Excelente" | "Bom" | "Regular" | "Ruim"
  equipe: string[];             // nomes dos membros presentes
}

// Cast — o JSON tem o shape correto
export const HISTORICO: ObraAvaliada[] = historico as ObraAvaliada[];
