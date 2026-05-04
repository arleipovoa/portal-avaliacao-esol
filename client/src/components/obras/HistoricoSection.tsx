import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { cn, formatDateBR, formatNota } from "@/lib/utils";
import {
  ChartBar,
  Tray,
  HardHat,
  Star,
  ShieldCheck,
  Sparkle,
  Trophy,
  Medal,
  MedalMilitary,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

const CLASSIF_COLORS: Record<string, string> = {
  Excelente: "text-green-700 dark:text-green-400 bg-green-500/10 border-green-500/20",
  Bom: "text-blue-700 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
  Regular: "text-yellow-800 dark:text-yellow-300 bg-yellow-500/15 border-yellow-500/30",
  Ruim: "text-red-700 dark:text-red-400 bg-red-500/10 border-red-500/20",
};

// Reexport do formatNota com mesma assinatura usada antes (drop-in).
const fmt = (v: number | null | undefined, digits = 1) => formatNota(v, digits);

// Escala 0-10
function colorByNota(n: number | null | undefined): string {
  if (n === null || n === undefined) return "text-slate-500";
  if (n >= 8) return "text-green-700 dark:text-green-400";
  if (n >= 6) return "text-yellow-700 dark:text-yellow-300";
  return "text-red-700 dark:text-red-400";
}

function bgByNota(n: number | null | undefined): string {
  if (n === null || n === undefined) return "bg-slate-400/60";
  if (n >= 8) return "bg-green-600 dark:bg-green-500";
  if (n >= 6) return "bg-yellow-500 dark:bg-yellow-400";
  return "bg-red-600 dark:bg-red-500";
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
      <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-border">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ChartBar size={20} weight="duotone" className="text-amber-700 dark:text-amber-300" />
            Histórico de Avaliações
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
                  ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent"
              )}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Carregando histórico…</div>
      ) : !yearly || yearly.total === 0 ? (
        <div className="rounded-xl border border-border p-8 text-center bg-card">
          <Tray size={40} weight="duotone" className="mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Nenhuma obra avaliada em {year}.</p>
        </div>
      ) : (
        <>
          {/* ── 1) ANUAL ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {([
              { label: "Total de Obras",   value: String(yearly.total),                            accent: "text-amber-700 dark:text-amber-300",       Icon: HardHat },
              { label: "Nota Final Média", value: fmt(to10(yearly.mediaFinal), 1),                 accent: colorByNota(to10(yearly.mediaFinal)),       Icon: Star },
              { label: "Segurança Média",  value: fmt(to10(yearly.mediaSeguranca), 1),             accent: colorByNota(to10(yearly.mediaSeguranca)),   Icon: ShieldCheck },
              { label: "Estética Média",   value: fmt(to10(yearly.mediaEstetica), 1),              accent: colorByNota(to10(yearly.mediaEstetica)),    Icon: Sparkle },
            ] as { label: string; value: string; accent: string; Icon: Icon }[]).map(s => (
              <div key={s.label} className="rounded-xl border border-border p-5 bg-card">
                <div className="flex items-center justify-between mb-3">
                  <s.Icon size={22} weight="duotone" className={s.accent} />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{s.label}</span>
                </div>
                <p className={cn("text-2xl font-bold", s.accent)}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Distribuição de classificação */}
          <div className="rounded-xl border border-border p-5 bg-card">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">
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
                    <p className="text-[10px] opacity-60">{fmt(pct, 0)} do ano</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 2) TRIMESTRAL — cards de médias ── */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Por Trimestre</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {quarterly.map(t => (
                <div key={t.trimestre} className={cn(
                  "rounded-xl border p-4 bg-card",
                  t.total === 0 ? "border-border opacity-50" : "border-amber-500/20"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">{t.label}</p>
                    <span className="text-[10px] text-muted-foreground">{t.total} obra(s)</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-3 capitalize">{t.monthRange}</p>
                  {t.total > 0 ? (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Final</span>
                        <span className={cn("tabular-nums font-bold", colorByNota(to10(t.mediaFinal)))}>{fmt(to10(t.mediaFinal), 1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Segurança</span>
                        <span className="tabular-nums">{fmt(to10(t.mediaSeguranca), 1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Funcional.</span>
                        <span className="tabular-nums">{fmt(to10(t.mediaFuncionalidade), 1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Estética</span>
                        <span className="tabular-nums">{fmt(to10(t.mediaEstetica), 1)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Sem dados</p>
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
            <h3 className="text-sm font-semibold text-foreground mb-3">Mês a Mês</h3>
            <div className="space-y-2">
              {monthly.map(m => {
                const open = expandedMonth === m.month;
                return (
                  <div key={m.month} className="rounded-xl border border-border bg-card overflow-hidden">
                    <button
                      onClick={() => setExpandedMonth(open ? null : m.month)}
                      className="w-full flex items-center justify-between p-4 hover:bg-accent transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <svg className={cn("w-3 h-3 text-muted-foreground transition-transform", open && "rotate-90")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-sm font-semibold text-foreground capitalize">{m.monthLabel}/{year}</span>
                        <span className="text-xs text-muted-foreground">{m.total} obra(s)</span>
                      </div>
                      <span className={cn("text-sm tabular-nums font-bold", colorByNota(to10(m.mediaNota)))}>
                        {fmt(to10(m.mediaNota), 1)}
                      </span>
                    </button>
                    {open && (
                      <div className="border-t border-border divide-y divide-border/50">
                        {m.obras.map((o: any) => (
                          <div key={o.projeto} className="p-3 px-12 hover:bg-accent/40 flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300">{o.projeto}</span>
                              <span className="text-sm text-foreground truncate">{o.cliente}</span>
                              <span className="text-[10px] text-muted-foreground">{formatDateBR(o.termino)}</span>
                              {o.observacao && (
                                <span className={cn(
                                  "text-[10px] px-2 py-0.5 rounded-full border font-medium",
                                  CLASSIF_COLORS[o.observacao] ?? "text-muted-foreground border-border"
                                )}>
                                  {o.observacao}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                              <span>S: <span className="tabular-nums text-foreground/80">{fmt(to10(o.notaSeguranca), 1)}</span></span>
                              <span>F: <span className="tabular-nums text-foreground/80">{fmt(to10(o.notaFuncionalidade), 1)}</span></span>
                              <span>E: <span className="tabular-nums text-foreground/80">{fmt(to10(o.notaEstetica), 1)}</span></span>
                              <span className={cn("tabular-nums font-bold", colorByNota(to10(o.notaEquipePct)))}>
                                {fmt(to10(o.notaEquipePct), 1)}
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
          {(() => {
            const ranking = yearly.ranking.filter((r: any) => r.isPerson);
            if (ranking.length === 0) return null;
            const maxTrack = Math.max(...ranking.map((r: any) => r.track), 0);
            return (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Ranking de Instaladores ({year})</h3>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="grid grid-cols-12 px-4 py-2 text-[10px] text-muted-foreground uppercase tracking-wider font-medium border-b border-border">
                  <div className="col-span-1">#</div>
                  <div className="col-span-4">Nome</div>
                  <div className="col-span-4">Track</div>
                  <div className="col-span-2 text-right">Média</div>
                  <div className="col-span-1 text-right">Obras</div>
                </div>
                {ranking.map((r: any, i: number) => (
                  <div
                    key={r.nome}
                    className="grid grid-cols-12 px-4 py-2.5 text-sm hover:bg-foreground/[0.02] transition-all border-b border-border/50 last:border-0"
                  >
                    <div className={cn(
                      "col-span-1 font-bold",
                      i === 0 ? "text-yellow-600 dark:text-yellow-400" :
                      i === 1 ? "text-foreground/70" :
                      i === 2 ? "text-amber-700 dark:text-amber-500" : "text-muted-foreground"
                    )}>
                      {i + 1}º
                    </div>
                    <div className="col-span-4 text-foreground truncate flex items-center gap-1.5">
                      {i === 0 && <Trophy size={14} weight="duotone" className="text-yellow-600 dark:text-yellow-400 shrink-0" />}
                      {i === 1 && <MedalMilitary size={14} weight="duotone" className="text-slate-500 dark:text-slate-300 shrink-0" />}
                      {i === 2 && <Medal size={14} weight="duotone" className="text-amber-700 dark:text-amber-500 shrink-0" />}
                      <span className="truncate">{r.nome}</span>
                    </div>
                    {(() => {
                      const relPct = maxTrack > 0 ? (r.track / maxTrack) * 100 : 0;
                      const trackPct = Math.min(100, Math.max(0, r.track));
                      return (
                        <div className="col-span-4 flex items-center gap-2 pr-2">
                          <div className="flex-1 h-2 rounded-full bg-foreground/10 overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all", bgByNota(to10(relPct)))}
                              style={{ width: `${trackPct}%` }}
                            />
                          </div>
                          <span className={cn("text-xs font-bold tabular-nums shrink-0 w-12 text-right", colorByNota(to10(relPct)))}>
                            {fmt(r.track, 1)}
                          </span>
                        </div>
                      );
                    })()}
                    <div className={cn("col-span-2 text-right tabular-nums", colorByNota(to10(r.media)))}>{fmt(to10(r.media), 1)}</div>
                    <div className="col-span-1 text-right text-muted-foreground tabular-nums">{r.total}</div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 px-1">
                <strong className="text-foreground/70">Track</strong> = média × (participações / total de obras avaliadas no ano).
                Reflete fidelidade da planilha (espelha coluna J de "Ranking Instaladores"). Cores comparam cada instalador
                contra o maior Track do período.
              </p>
            </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
