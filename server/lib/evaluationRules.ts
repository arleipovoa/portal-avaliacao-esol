import type { PbiProject } from "./pbiClient";

// Mes selecionado pelo usuario no formato "YYYY-MM" (ex: "2026-04").
// A janela de avaliacao eh o MES ANTERIOR ao selecionado.
// Ex: selecionou 2026-04 (Abril) → janela = 2026-03-01 a 2026-03-31.
export function getEvaluationWindow(monthYear: string): {
  start: string; // ISO YYYY-MM-DD
  end: string;   // ISO YYYY-MM-DD
  label: string; // ex: "marco/2026"
} {
  const m = monthYear.match(/^(\d{4})-(\d{2})$/);
  if (!m) throw new Error(`monthYear invalido (esperado YYYY-MM): ${monthYear}`);
  const selectedYear = parseInt(m[1], 10);
  const selectedMonth = parseInt(m[2], 10); // 1-12

  // Mes anterior
  const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
  const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;

  const mm = String(prevMonth).padStart(2, "0");
  const start = `${prevYear}-${mm}-01`;
  // Ultimo dia do mes: usar 0 do mes seguinte
  const lastDay = new Date(prevYear, prevMonth, 0).getDate();
  const end = `${prevYear}-${mm}-${String(lastDay).padStart(2, "0")}`;

  const monthNames = [
    "janeiro", "fevereiro", "marco", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  const label = `${monthNames[prevMonth - 1]}/${prevYear}`;

  return { start, end, label };
}

// Regra de elegibilidade:
// 1. installacaoFinalizada === true (BM = TRUE)
// 2. pedidoVistoriaDate (BN) dentro da janela [start, end] inclusive
export function isEligibleForEvaluation(
  project: PbiProject,
  window: { start: string; end: string }
): boolean {
  if (!project.installacaoFinalizada) return false;
  if (!project.pedidoVistoriaDate) return false;
  return project.pedidoVistoriaDate >= window.start && project.pedidoVistoriaDate <= window.end;
}
