import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const NON_PERSON = new Set(["Material", "Projeto", "Projetos", "Planejamento"]);

function fmt(v: number | null | undefined, digits = 1): string {
  if (v === null || v === undefined) return "—";
  return v.toFixed(digits);
}

// Heatmap colors: 0-10 mapeado pra escala
function heatmapColor(v: number | null | undefined): string {
  if (v === null || v === undefined) return "bg-white/[0.02] text-slate-600";
  if (v >= 9.5) return "bg-green-500/30 text-green-200";
  if (v >= 9.0) return "bg-green-500/20 text-green-300";
  if (v >= 8.0) return "bg-yellow-400/20 text-yellow-200";
  if (v >= 7.0) return "bg-orange-400/20 text-orange-200";
  if (v >= 5.0) return "bg-red-500/20 text-red-300";
  return "bg-red-700/30 text-red-200";
}

export default function AvaliacaoCruzada() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [hideContas, setHideContas] = useState<boolean>(false);

  const yearlyQ = trpc.projects.peerReviewYearly.useQuery({ year });
  const matrixQ = trpc.projects.peerReviewMatrix.useQuery();

  const yearly = yearlyQ.data;
  const matrix = matrixQ.data ?? [];

  // Lista de avaliadores (colunas) — pega de qualquer linha da matriz
  const avaliadores = useMemo(() => {
    if (matrix.length === 0) return [];
    const set = new Set<string>();
    for (const row of matrix) {
      Object.keys(row.notasRecebidas).forEach(k => set.add(k));
    }
    return Array.from(set);
  }, [matrix]);

  const matrixView = hideContas
    ? matrix.filter(m => !NON_PERSON.has(m.avaliado))
    : matrix;
  const avaliadoresView = hideContas
    ? avaliadores.filter(a => !NON_PERSON.has(a))
    : avaliadores;

  const rankingView = (yearly?.ranking ?? []).filter(r => !hideContas || r.isPerson);

  const isLoading = yearlyQ.isLoading || matrixQ.isLoading;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-semibold text-flux-orange uppercase tracking-widest mb-1">
            Portal de Obras
          </p>
          <h1 className="text-2xl font-display font-semibold text-white">Avaliação Cruzada</h1>
          <p className="text-sm text-slate-400 mt-1">
            Notas que os instaladores deram entre si nas obras em que trabalharam juntos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={hideContas}
              onChange={e => setHideContas(e.target.checked)}
              className="accent-flux-orange"
            />
            Ocultar contas (Material, Projeto, Planejamento)
          </label>
          <div className="flex gap-2">
            {[currentYear - 1, currentYear].map(y => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  year === y
                    ? "bg-flux-orange/15 text-flux-orange border border-flux-orange/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                )}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Aviso futuro: restricao admin */}
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3">
        <p className="text-xs text-blue-300">
          🔒 Quando o login for ativado, esta página ficará restrita a administradores.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-400 text-sm">Carregando...</div>
      ) : !yearly || yearly.totalObrasComPeerReview === 0 ? (
        <div className="rounded-xl border border-white/5 p-12 text-center bg-white/5">
          <p className="text-3xl mb-2">📭</p>
          <p className="text-sm text-slate-400">Sem dados de avaliação cruzada para {year}.</p>
        </div>
      ) : (
        <>
          {/* Stats anuais peer */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/5 p-5 bg-white/5">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Obras com Peer Review</p>
              <p className="text-2xl font-bold text-flux-orange mt-2">{yearly.totalObrasComPeerReview}</p>
            </div>
            <div className="rounded-xl border border-white/5 p-5 bg-white/5">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Colaboradores Avaliados</p>
              <p className="text-2xl font-bold text-blue-400 mt-2">{rankingView.length}</p>
            </div>
            <div className="rounded-xl border border-white/5 p-5 bg-white/5">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Média Geral</p>
              <p className="text-2xl font-bold text-green-400 mt-2">
                {fmt(rankingView.reduce((s, r) => s + r.mediaPeer, 0) / Math.max(1, rankingView.length))}
              </p>
            </div>
          </div>

          {/* Ranking */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">Ranking dos Pares ({year})</h2>
            <div className="rounded-xl border border-white/5 bg-white/5 overflow-hidden">
              <div className="grid grid-cols-12 px-4 py-2 text-[10px] text-slate-500 uppercase tracking-wider font-medium border-b border-white/5">
                <div className="col-span-1">#</div>
                <div className="col-span-4">Colaborador</div>
                <div className="col-span-2 text-right">Média Peer</div>
                <div className="col-span-2 text-right">Obras</div>
                <div className="col-span-1 text-right">Min</div>
                <div className="col-span-2 text-right">Max</div>
              </div>
              {rankingView.map((r, i) => (
                <div
                  key={r.nome}
                  className={cn(
                    "grid grid-cols-12 px-4 py-2.5 text-sm hover:bg-white/[0.02] transition-all border-b border-white/[0.02] last:border-0",
                    !r.isPerson && "opacity-70"
                  )}
                >
                  <div className={cn(
                    "col-span-1 font-bold",
                    i === 0 ? "text-yellow-400" :
                    i === 1 ? "text-slate-300" :
                    i === 2 ? "text-amber-600" : "text-slate-500"
                  )}>{i + 1}º</div>
                  <div className="col-span-4 text-white truncate flex items-center gap-1.5">
                    {i === 0 && r.isPerson && "🥇 "}{i === 1 && r.isPerson && "🥈 "}{i === 2 && r.isPerson && "🥉 "}
                    <span>{r.nome}</span>
                    {!r.isPerson && (
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 border border-white/10 rounded px-1.5 py-0.5">conta</span>
                    )}
                  </div>
                  <div className={cn(
                    "col-span-2 text-right font-mono font-bold",
                    r.mediaPeer >= 9 ? "text-green-400" : r.mediaPeer >= 7 ? "text-yellow-400" : "text-red-400"
                  )}>{fmt(r.mediaPeer, 2)}</div>
                  <div className="col-span-2 text-right text-slate-400 font-mono">{r.total}</div>
                  <div className="col-span-1 text-right text-slate-500 font-mono text-xs">{fmt(r.min, 1)}</div>
                  <div className="col-span-2 text-right text-slate-300 font-mono text-xs">{fmt(r.max, 1)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Matriz Cruzada (Heatmap) */}
          {matrixView.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">Matriz Cruzada — Heatmap</h2>
              <p className="text-xs text-slate-400 mb-3">
                Linha = colaborador <strong className="text-slate-300">avaliado</strong>.
                Coluna = colaborador <strong className="text-slate-300">avaliador</strong>.
                Cor verde = nota alta, vermelho = nota baixa.
              </p>
              <div className="rounded-xl border border-white/5 bg-white/5 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-2 py-2 text-left text-[10px] text-slate-500 uppercase tracking-wider sticky left-0 bg-void z-10 min-w-[110px]">
                        Avaliado ↓ / Avaliador →
                      </th>
                      {avaliadoresView.map(a => (
                        <th key={a} className={cn(
                          "px-2 py-2 text-[10px] uppercase tracking-wider min-w-[60px] text-center",
                          NON_PERSON.has(a) ? "text-slate-600" : "text-slate-400"
                        )}>
                          <span className="block whitespace-nowrap rotate-0">{a}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrixView.map(row => {
                      const notas = Object.values(row.notasRecebidas).filter(v => typeof v === "number") as number[];
                      const mediaLinha = notas.length ? notas.reduce((s, v) => s + v, 0) / notas.length : null;
                      return (
                        <tr key={row.avaliado} className="border-b border-white/[0.02] last:border-0">
                          <td className={cn(
                            "px-2 py-2 font-medium sticky left-0 bg-void z-10",
                            NON_PERSON.has(row.avaliado) ? "text-slate-500" : "text-white"
                          )}>
                            {row.avaliado}
                            {NON_PERSON.has(row.avaliado) && (
                              <span className="ml-2 text-[9px] uppercase tracking-wider text-slate-600 border border-white/10 rounded px-1.5 py-0.5">conta</span>
                            )}
                          </td>
                          {avaliadoresView.map(av => {
                            const v = row.notasRecebidas[av];
                            const isSelf = av === row.avaliado;
                            return (
                              <td key={av} className={cn(
                                "px-1 py-1 text-center font-mono text-[11px]",
                                isSelf ? "bg-slate-800/50 text-slate-600" : heatmapColor(v as number | null | undefined)
                              )}>
                                {isSelf ? "—" : (typeof v === "number" ? v.toFixed(1) : "")}
                              </td>
                            );
                          })}
                          <td className={cn(
                            "px-2 py-1 text-center font-mono font-bold border-l border-white/10",
                            mediaLinha === null ? "text-slate-600" :
                            mediaLinha >= 9 ? "text-green-400" :
                            mediaLinha >= 7 ? "text-yellow-400" : "text-red-400"
                          )}>
                            {fmt(mediaLinha, 2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Legenda:</span>
                <span className={cn("px-2 py-1 rounded text-[10px] font-mono", heatmapColor(9.7))}>≥ 9,5</span>
                <span className={cn("px-2 py-1 rounded text-[10px] font-mono", heatmapColor(9.2))}>9,0 – 9,5</span>
                <span className={cn("px-2 py-1 rounded text-[10px] font-mono", heatmapColor(8.5))}>8,0 – 9,0</span>
                <span className={cn("px-2 py-1 rounded text-[10px] font-mono", heatmapColor(7.5))}>7,0 – 8,0</span>
                <span className={cn("px-2 py-1 rounded text-[10px] font-mono", heatmapColor(6.0))}>5,0 – 7,0</span>
                <span className={cn("px-2 py-1 rounded text-[10px] font-mono", heatmapColor(3.0))}>&lt; 5,0</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
