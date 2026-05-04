import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const CLASSIF_COLORS: Record<string, string> = {
  Excelente: "text-green-400 bg-green-400/10 border-green-400/20",
  Bom: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  Regular: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  Ruim: "text-red-400 bg-red-400/10 border-red-400/20",
};

function fmt(v: number | null | undefined, digits = 1): string {
  if (v === null || v === undefined) return "—";
  return v.toFixed(digits);
}

// Escala 0-10
function colorByNota(n: number | null | undefined): string {
  if (n === null || n === undefined) return "text-slate-400";
  if (n >= 8) return "text-green-400";
  if (n >= 6) return "text-yellow-400";
  return "text-red-400";
}
// Converte valor histórico (0-100) → 0-10 para exibição
function to10(v: number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  return v / 10;
}

export default function HistoricoSection() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  const yearlyQ = trpc.projects.historyYearly.useQuery({ year });
  const quarterlyQ = trpc.projects.historyQuarterly.useQuery({ year });
  const monthlyQ = trpc.projects.historyByMonth.useQuery({ year });

  const yearly = yearlyQ.data;
  const quarterly = quarterlyQ.data ?? [];
  const monthly = monthlyQ.data ?? [];

  const isLoading = yearlyQ.isLoading || quarterlyQ.isLoading || monthlyQ.isLoading;

  return (
    <div className="space-y-6">
      {/* Header da seção + seletor de ano */}
      <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-white/5">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>📊</span> Histórico de Avaliações
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Resumos por ano, trimestre, mês e ranking de instaladores.
          </p>
        </div>
        <div className="flex items-center gap-2">
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

      {isLoading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Carregando histórico...</div>
      ) : !yearly || yearly.total === 0 ? (
        <div className="rounded-xl border border-white/5 p-8 text-center bg-white/5">
          <p className="text-3xl mb-2">📭</p>
          <p className="text-sm text-slate-400">Nenhuma obra avaliada em {year}.</p>
        </div>
      ) : (
        <>
          {/* ── 1) ANUAL ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total de Obras",   value: String(yearly.total),                                   accent: "text-flux-orange", icon: "🏗️" },
              { label: "Nota Final Média", value: fmt(to10(yearly.mediaFinal), 2),                        accent: colorByNota(to10(yearly.mediaFinal)), icon: "⭐" },
              { label: "Segurança Média",  value: fmt(to10(yearly.mediaSeguranca), 2),                    accent: colorByNota(to10(yearly.mediaSeguranca)), icon: "🛡️" },
              { label: "Estética Média",   value: fmt(to10(yearly.mediaEstetica), 2),                     accent: colorByNota(to10(yearly.mediaEstetica)), icon: "✨" },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-white/5 p-5 bg-white/5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{s.label}</span>
                </div>
                <p className={cn("text-2xl font-bold", s.accent)}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Distribuição de classificação */}
          <div className="rounded-xl border border-white/5 p-5 bg-white/5">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-3">
              Distribuição de Classificação ({year})
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(["Excelente", "Bom", "Regular", "Ruim"] as const).map(c => {
                const n = yearly.distribClassif[c] ?? 0;
                const pct = yearly.total > 0 ? (n / yearly.total) * 100 : 0;
                return (
                  <div key={c} className={cn("rounded-lg border p-3", CLASSIF_COLORS[c])}>
                    <p className="text-[10px] uppercase tracking-wider font-medium opacity-70">{c}</p>
                    <p className="text-2xl font-bold mt-1">{n}</p>
                    <p className="text-[10px] opacity-60">{pct.toFixed(0)}% do ano</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 2) TRIMESTRAL — cards de médias ── */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Por Trimestre</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {quarterly.map(t => (
                <div key={t.trimestre} className={cn(
                  "rounded-xl border p-4 bg-white/5",
                  t.total === 0 ? "border-white/5 opacity-50" : "border-flux-orange/20"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-flux-orange">{t.label}</p>
                    <span className="text-[10px] text-slate-500">{t.total} obra(s)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mb-3 capitalize">{t.monthRange}</p>
                  {t.total > 0 ? (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Final</span>
                        <span className={cn("font-mono font-bold", colorByNota(to10(t.mediaFinal)))}>{fmt(to10(t.mediaFinal), 2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Segurança</span>
                        <span className="font-mono">{fmt(to10(t.mediaSeguranca), 1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Funcional.</span>
                        <span className="font-mono">{fmt(to10(t.mediaFuncionalidade), 1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Estética</span>
                        <span className="font-mono">{fmt(to10(t.mediaEstetica), 1)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Sem dados</p>
                  )}
                </div>
              ))}
            </div>

            {/* Ranking por trimestre */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
              {quarterly.map(t => (
                <div key={`rank-${t.trimestre}`} className={cn(
                  "rounded-xl border p-4 bg-white/5",
                  t.total === 0 ? "border-white/5 opacity-50" : "border-white/10"
                )}>
                  <p className="text-xs font-semibold text-slate-400 mb-3">
                    🏆 {t.label} — Top
                  </p>
                  {(t as any).ranking?.length > 0 ? (
                    <div className="space-y-2">
                      {(t as any).ranking.slice(0, 5).map((r: any, i: number) => (
                        <div key={r.nome} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={cn('text-[11px] font-bold shrink-0',
                              i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-slate-500'
                            )}>{i + 1}º</span>
                            <span className="text-xs text-white truncate">{r.nome}</span>
                          </div>
                          <span className={cn('text-xs font-mono font-bold shrink-0', colorByNota(to10(r.media)))}>
                            {fmt(to10(r.media), 1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Sem dados</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── 3) MES A MES (accordion) ── */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Mês a Mês</h3>
            <div className="space-y-2">
              {monthly.map(m => {
                const open = expandedMonth === m.month;
                return (
                  <div key={m.month} className="rounded-xl border border-white/5 bg-white/5 overflow-hidden">
                    <button
                      onClick={() => setExpandedMonth(open ? null : m.month)}
                      className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <svg className={cn("w-3 h-3 text-slate-400 transition-transform", open && "rotate-90")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-sm font-semibold text-white capitalize">{m.monthLabel}/{year}</span>
                        <span className="text-xs text-slate-500">{m.total} obra(s)</span>
                      </div>
                      <span className={cn("text-sm font-mono font-bold", colorByNota(to10(m.mediaNota)))}>
                        {fmt(to10(m.mediaNota), 2)}
                      </span>
                    </button>
                    {open && (
                      <div className="border-t border-white/5 divide-y divide-white/5">
                        {m.obras.map((o: any) => (
                          <div key={o.projeto} className="p-3 px-12 hover:bg-white/[0.02] flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="text-[10px] font-mono text-flux-orange/70">{o.projeto}</span>
                              <span className="text-sm text-white truncate">{o.cliente}</span>
                              <span className="text-[10px] text-slate-500">{o.termino}</span>
                              {o.observacao && (
                                <span className={cn(
                                  "text-[10px] px-2 py-0.5 rounded-full border font-medium",
                                  CLASSIF_COLORS[o.observacao] ?? "text-slate-400 border-white/10"
                                )}>
                                  {o.observacao}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-slate-500 shrink-0">
                              <span>S: <span className="font-mono">{fmt(to10(o.notaSeguranca), 1)}</span></span>
                              <span>F: <span className="font-mono">{fmt(to10(o.notaFuncionalidade), 1)}</span></span>
                              <span>E: <span className="font-mono">{fmt(to10(o.notaEstetica), 1)}</span></span>
                              <span className={cn("font-mono font-bold", colorByNota(to10(o.notaEquipePct)))}>
                                {fmt(to10(o.notaEquipePct), 2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 4) RANKING ANUAL ── */}
          {yearly.ranking.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Ranking de Instaladores ({year})</h3>
              <div className="rounded-xl border border-white/5 bg-white/5 overflow-hidden">
                <div className="grid grid-cols-12 px-4 py-2 text-[10px] text-slate-500 uppercase tracking-wider font-medium border-b border-white/5">
                  <div className="col-span-1">#</div>
                  <div className="col-span-4">Nome</div>
                  <div className="col-span-2 text-right">Média</div>
                  <div className="col-span-1 text-right">Obras</div>
                  <div className="col-span-2 text-right">Min</div>
                  <div className="col-span-2 text-right">Max</div>
                </div>
                {yearly.ranking.map((r: any, i: number) => (
                  <div
                    key={r.nome}
                    className="grid grid-cols-12 px-4 py-2.5 text-sm hover:bg-white/[0.02] transition-all border-b border-white/[0.02] last:border-0"
                  >
                    <div className={cn(
                      "col-span-1 font-bold",
                      i === 0 ? "text-yellow-400" :
                      i === 1 ? "text-slate-300" :
                      i === 2 ? "text-amber-600" : "text-slate-500"
                    )}>
                      {i + 1}º
                    </div>
                    <div className="col-span-4 text-white truncate flex items-center gap-1.5">
                      {i === 0 && "🥇 "}{i === 1 && "🥈 "}{i === 2 && "🥉 "}
                      <span>{r.nome}</span>
                    </div>
                    <div className={cn("col-span-2 text-right font-mono font-bold", colorByNota(to10(r.media)))}>{fmt(to10(r.media), 2)}</div>
                    <div className="col-span-1 text-right text-slate-400 font-mono">{r.total}</div>
                    <div className="col-span-2 text-right text-slate-500 font-mono text-xs">{fmt(to10(r.min), 1)}</div>
                    <div className="col-span-2 text-right text-slate-300 font-mono text-xs">{fmt(to10(r.max), 1)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
