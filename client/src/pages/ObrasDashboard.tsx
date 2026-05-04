import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { cn, formatDateBR, formatNota } from "@/lib/utils";
import HistoricoSection from "@/components/obras/HistoricoSection";
import {
  HardHat,
  NotePencil,
  CheckCircle,
  SunDim,
  MapPin,
  Tag,
  CalendarDots,
  ArrowRight,
  SpinnerGap,
  CalendarBlank,
} from "@phosphor-icons/react";

function currentMonthYear(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

export default function ObrasDashboard() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthYear());

  const evaluableQuery = trpc.projects.listEvaluable.useQuery(
    { monthYear: selectedMonth },
    { enabled: !!user }
  );

  const { isLoading, error, refetch } = evaluableQuery;
  const projects = evaluableQuery.data?.projects ?? [];
  const evalWindow = evaluableQuery.data?.window ?? null;

  const mapped = useMemo(() => projects.map((p: any) => ({
    ...p,
    powerKwpNum: parseFloat(String(p.powerKwp ?? 0)),
    score: p.projectScore ? parseFloat(String(p.projectScore)) : null,
  })), [projects]);

  const stats = {
    total: mapped.length,
    avaliadas: mapped.filter((p) => p.score !== null && p.score > 0).length,
    aAvaliar: mapped.filter((p) => p.score === null || p.score === 0).length,
    potenciaTotal: mapped.reduce((s, p) => s + p.powerKwpNum, 0),
  };

  const statCards = [
    { label: "Elegíveis no Ciclo", value: stats.total, icon: HardHat, color: "text-primary" },
    { label: "A Avaliar", value: stats.aAvaliar, icon: NotePencil, color: "text-amber-600 dark:text-amber-400" },
    { label: "Avaliadas", value: stats.avaliadas, icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Potência Total", value: `${formatNota(stats.potenciaTotal, 1)} kWp`, icon: SunDim, color: "text-amber-600 dark:text-amber-400" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
            Portal de Obras
          </p>
          <h1 className="text-2xl font-display font-semibold text-foreground">Avaliação da Obra</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Obras elegíveis e avaliadas no ciclo selecionado.
          </p>
        </div>
      </div>

      {/* Cycle selector */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-widest mb-1">
            Ciclo de Avaliação
          </p>
          <p className="text-sm text-foreground">
            Mostrando obras finalizadas no <strong>mês anterior</strong> ao selecionado.
          </p>
          {evalWindow && (
            <p className="text-xs text-muted-foreground mt-2">
              Janela: <strong className="text-amber-700 dark:text-amber-300">{formatDateBR(evalWindow.start)}</strong> a <strong className="text-amber-700 dark:text-amber-300">{formatDateBR(evalWindow.end)}</strong> ({evalWindow.label}).
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <label className="text-xs text-muted-foreground">Mês de avaliação:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary/40 focus:outline-none"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const IconComp = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border border-border p-5 bg-card">
              <div className="flex items-center justify-between mb-3">
                <IconComp size={22} weight="duotone" className={stat.color} />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{stat.label}</span>
              </div>
              <p className={cn("text-2xl font-bold text-foreground")}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <SpinnerGap size={40} className="animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando projetos…</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/20 p-8 text-center bg-destructive/5">
          <p className="text-destructive text-sm">Erro ao carregar projetos</p>
          <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
          <button onClick={() => refetch()} className="mt-4 text-xs text-primary hover:underline">
            Tentar novamente
          </button>
        </div>
      ) : mapped.length === 0 ? (
        <div className="rounded-xl border border-border p-12 text-center bg-card">
          <CalendarBlank size={48} weight="duotone" className="mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma obra elegível</h3>
          <p className="text-sm text-muted-foreground">
            Nenhuma obra foi finalizada em {evalWindow?.label ?? "este período"}.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {mapped.map((project: any, index: number) => {
            const isAvaliada = project.score !== null && project.score > 0;
            return (
              <div
                key={project.id}
                className={cn(
                  "rounded-xl border p-5 transition-all cursor-pointer group bg-card",
                  isAvaliada
                    ? "border-emerald-500/20 hover:border-emerald-500/40"
                    : "border-primary/20 hover:border-primary/40"
                )}
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
                onClick={() => navigate(`/obras/avaliacao?projectId=${project.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-[10px] font-mono text-amber-700/80 dark:text-amber-300/80 shrink-0">{project.code}</span>
                      <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {project.clientName}
                      </h3>
                      {isAvaliada ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Avaliada
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                          Avaliação aberta
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {project.city || project.address || "Sem endereço"}{project.state ? ` - ${project.state}` : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <SunDim size={12} />
                        {formatNota(project.powerKwpNum, 2)} kWp
                      </span>
                      <span className="flex items-center gap-1">
                        <Tag size={12} />
                        Cat. {project.category}
                      </span>
                      {project.pedidoVistoriaDate && (
                        <span className="flex items-center gap-1 text-amber-700/80 dark:text-amber-300/80">
                          <CalendarDots size={12} />
                          Vistoria: {formatDateBR(project.pedidoVistoriaDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  {isAvaliada && (
                    <div className="text-right ml-4">
                      <p className="text-xs text-muted-foreground">Nota</p>
                      <p className={cn(
                        "text-lg font-bold tabular-nums",
                        project.score >= 80 ? "text-emerald-600 dark:text-emerald-400" :
                        project.score >= 60 ? "text-amber-600 dark:text-amber-400" : "text-red-500"
                      )}>
                        {formatNota(project.score, 1)}
                      </p>
                    </div>
                  )}

                  <ArrowRight size={16} className="text-muted-foreground/30 group-hover:text-primary transition-all ml-3 group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <HistoricoSection />

    </div>
  );
}
