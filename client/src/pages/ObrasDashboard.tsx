import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import HistoricoSection from "@/components/obras/HistoricoSection";

// Mês corrente em YYYY-MM (ex: "2026-04")
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
  const [generatingDocs, setGeneratingDocs] = useState<string | null>(null);
  const [docsResult, setDocsResult] = useState<{ code: string; contrato?: string; procuracao?: string } | null>(null);

  const generateDocsMutation = trpc.projects.generateDocuments.useMutation({
    onSuccess: (data, variables) => {
      setDocsResult({ code: variables, ...data });
      setGeneratingDocs(null);
    },
    onError: (err) => {
      alert(`Erro ao gerar documentos: ${err.message}`);
      setGeneratingDocs(null);
    },
  });

  // Lista de obras elegíveis para o ciclo selecionado
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
    total:         mapped.length,
    avaliadas:     mapped.filter((p) => p.score !== null && p.score > 0).length,
    aAvaliar:      mapped.filter((p) => p.score === null || p.score === 0).length,
    potenciaTotal: mapped.reduce((s, p) => s + p.powerKwpNum, 0),
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-flux-orange uppercase tracking-widest mb-1">
            Portal de Obras
          </p>
          <h1 className="text-2xl font-display font-semibold text-white">Avaliação da Obra</h1>
          <p className="text-sm text-slate-400 mt-1">
            Obras elegíveis e avaliadas no ciclo selecionado.
          </p>
        </div>
      </div>

      {/* Seletor de Mês */}
      <div className="rounded-xl border border-flux-orange/20 bg-flux-orange/5 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-flux-orange uppercase tracking-widest mb-1">
            Ciclo de Avaliação
          </p>
          <p className="text-sm text-white">
            Mostrando obras finalizadas no <strong>mês anterior</strong> ao selecionado.
          </p>
          {evalWindow && (
            <p className="text-xs text-slate-400 mt-2">
              Janela: <strong className="text-flux-orange">{evalWindow.start}</strong> a <strong className="text-flux-orange">{evalWindow.end}</strong> ({evalWindow.label}).
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <label className="text-xs text-slate-400">Mês de avaliação:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-void/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-flux-orange/40 focus:outline-none"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Elegíveis no Ciclo", value: stats.total,                              icon: "🏗️", accent: "text-flux-orange" },
          { label: "A Avaliar",          value: stats.aAvaliar,                           icon: "📝", accent: "text-yellow-400"  },
          { label: "Avaliadas",          value: stats.avaliadas,                          icon: "✅", accent: "text-green-400"   },
          { label: "Potência Total",     value: `${stats.potenciaTotal.toFixed(1)} kWp`,  icon: "☀️", accent: "text-yellow-400"  },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-white/5 p-5 bg-white/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{stat.label}</span>
            </div>
            <p className={cn("text-2xl font-bold", stat.accent)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-flux-orange/30 border-t-flux-orange rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Carregando projetos...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 p-8 text-center bg-red-500/5">
          <p className="text-red-400 text-sm">Erro ao carregar projetos</p>
          <p className="text-xs text-slate-500 mt-1">{error.message}</p>
          <button onClick={() => refetch()} className="mt-4 text-xs text-flux-orange hover:underline">
            Tentar novamente
          </button>
        </div>
      ) : mapped.length === 0 ? (
        <div className="rounded-xl border border-white/5 p-12 text-center bg-white/5">
          <p className="text-4xl mb-4">🗓️</p>
          <h3 className="text-lg font-semibold text-white mb-2">Nenhuma obra elegível</h3>
          <p className="text-sm text-slate-400">
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
                  "rounded-xl border p-5 transition-all cursor-pointer group bg-white/5",
                  isAvaliada
                    ? "border-green-500/30 hover:border-green-500/60"
                    : "border-flux-orange/30 hover:border-flux-orange/60"
                )}
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
                onClick={() => navigate(`/obras/avaliacao?projectId=${project.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-[10px] font-mono text-flux-orange/70 shrink-0">{project.code}</span>
                      <h3 className="text-sm font-semibold text-white truncate group-hover:text-flux-orange transition-colors">
                        {project.clientName}
                      </h3>
                      {isAvaliada ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-green-500/15 text-green-400 border border-green-500/30">
                          Avaliada
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-flux-orange/15 text-flux-orange border border-flux-orange/30">
                          Avaliação aberta
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      <span>📍 {project.city || project.address || "Sem endereço"}{project.state ? ` - ${project.state}` : ""}</span>
                      <span>☀️ {project.powerKwpNum.toFixed(2)} kWp</span>
                      <span>🏷️ Cat. {project.category}</span>
                      {project.pedidoVistoriaDate && (
                        <span className="text-flux-orange/70">📅 Vistoria: {project.pedidoVistoriaDate}</span>
                      )}
                    </div>
                  </div>

                  {isAvaliada && (
                    <div className="text-right ml-4">
                      <p className="text-xs text-slate-500">Nota</p>
                      <p className={cn(
                        "text-lg font-bold font-mono",
                        project.score >= 80 ? "text-green-400" :
                        project.score >= 60 ? "text-yellow-400" : "text-red-400"
                      )}>
                        {project.score.toFixed(0)}%
                      </p>
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setGeneratingDocs(project.code);
                      generateDocsMutation.mutate(project.code);
                    }}
                    disabled={generatingDocs === project.code}
                    title="Gerar Contrato e Procuração"
                    className="ml-3 p-1.5 rounded-lg text-slate-500 hover:text-flux-orange hover:bg-flux-orange/10 transition-all shrink-0 disabled:opacity-40"
                  >
                    {generatingDocs === project.code
                      ? <div className="w-4 h-4 border border-flux-orange/30 border-t-flux-orange rounded-full animate-spin" />
                      : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    }
                  </button>
                  <svg className="w-4 h-4 text-slate-600 group-hover:text-flux-orange transition-all ml-1 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Histórico de Avaliações — anual / trimestral / mensal / ranking */}
      <HistoricoSection />

      {/* Modal de documentos */}
      {docsResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDocsResult(null)}>
          <div className="rounded-2xl border border-flux-orange/20 p-8 max-w-md w-full mx-4 bg-void/95" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-semibold">Documentos — {docsResult.code}</h3>
              <button onClick={() => setDocsResult(null)} className="text-slate-400 hover:text-white transition-colors">✕</button>
            </div>
            <div className="space-y-3">
              {docsResult.contrato && (
                <a href={docsResult.contrato} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl bg-flux-orange/10 border border-flux-orange/20 hover:border-flux-orange/40 transition-all">
                  <span className="text-2xl">📄</span>
                  <div>
                    <p className="text-sm font-medium text-flux-orange">Contrato</p>
                    <p className="text-xs text-slate-400">Clique para abrir</p>
                  </div>
                </a>
              )}
              {docsResult.procuracao && (
                <a href={docsResult.procuracao} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-all">
                  <span className="text-2xl">📋</span>
                  <div>
                    <p className="text-sm font-medium text-blue-400">Procuração</p>
                    <p className="text-xs text-slate-400">Clique para abrir</p>
                  </div>
                </a>
              )}
              {!docsResult.contrato && !docsResult.procuracao && (
                <p className="text-slate-400 text-sm text-center py-4">Nenhum documento retornado pela API.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
