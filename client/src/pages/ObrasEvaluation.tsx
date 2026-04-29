import { useState, useMemo } from 'react';
import { useSearch } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

const CATEGORY_CONFIG = {
  seguranca:     { label: 'Segurança',     icon: '🛡️', color: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/20',    weight: 2 },
  funcionalidade:{ label: 'Funcionalidade', icon: '⚙️', color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/20',   weight: 2 },
  estetica:      { label: 'Estética',      icon: '✨', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', weight: 1 },
  complementar:  { label: 'Complementar',  icon: '📋', color: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/20',  weight: 1 },
};

const MAX_SCORE = 10;

export default function ObrasEvaluation() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const search = useSearch();
  const projectId = parseInt(new URLSearchParams(search).get('projectId') ?? '0');
  const userId = (user as any)?.id as number | undefined;

  const { data: grouped = {}, isLoading: loadingCriteria } = trpc.projects.getCriteria.useQuery(undefined, {
    enabled: !!user,
  });

  const [scores, setScores] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const submitMutation = trpc.projects.submitScores.useMutation({
    onSuccess: (data) => {
      setFinalScore(data.notaObraPercentual);
      setSubmitted(true);
    },
    onError: (err) => {
      setError(err.message || 'Erro ao submeter avaliação');
    },
  });

  // Flatten criteria for initialisation
  const allCriteria = useMemo(() => Object.values(grouped).flat(), [grouped]);

  // Initialise scores to MAX when criteria load
  useMemo(() => {
    if (allCriteria.length > 0 && Object.keys(scores).length === 0) {
      const init: Record<number, number> = {};
      allCriteria.forEach((c) => { init[c.id] = MAX_SCORE; });
      setScores(init);
    }
  }, [allCriteria]);

  function getScore(id: number) {
    return scores[id] ?? MAX_SCORE;
  }

  function categoryAvgPct(cat: string): number {
    const items = (grouped as any)[cat] ?? [];
    if (!items.length) return 100;
    const avg = items.reduce((s: number, c: any) => s + getScore(c.id), 0) / items.length;
    return (avg / MAX_SCORE) * 100;
  }

  const notaSeguranca      = categoryAvgPct('seguranca');
  const notaFuncionalidade = categoryAvgPct('funcionalidade');
  const notaEstetica       = categoryAvgPct('estetica');
  const complementar       = (grouped as any)['complementar'] ?? [];
  const eficienciaCrit     = complementar.find((c: any) => c.code === 'eficiencia');
  const npsCrit            = complementar.find((c: any) => c.code === 'nps_cliente');
  const eficiencia         = eficienciaCrit ? (getScore(eficienciaCrit.id) / MAX_SCORE) * 100 : 100;
  const npsCliente         = npsCrit       ? (getScore(npsCrit.id) / MAX_SCORE) * 100 : 100;
  const baseScore = (notaSeguranca * 2 + notaFuncionalidade * 2 + notaEstetica) / 5;
  const mediaOs   = (notaSeguranca + notaFuncionalidade + notaEstetica) / 3;
  const totalScore = (baseScore * 0.5) + (mediaOs * 0.2) + (eficiencia * 0.15) + (npsCliente * 0.15);

  function handleSubmit() {
    if (!projectId || !userId) {
      setError('Projeto ou usuário não identificado.');
      return;
    }
    submitMutation.mutate({
      projectId,
      userId,
      notaSeguranca,
      notaFuncionalidade,
      notaEstetica,
      mediaOs,
      eficiencia,
      npsCliente,
    });
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500">
        <div className="glass rounded-2xl border border-green-500/20 p-12 text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Avaliação Enviada!</h2>
          <p className="text-sm text-slate-400 mb-2">
            Nota Final: <span className="text-green-400 font-bold font-mono">{finalScore.toFixed(1)}%</span>
          </p>
          <p className="text-xs text-slate-500 mb-6">A avaliação da equipe foi registrada com sucesso.</p>
          <a href="/obras/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-flux-orange text-void font-semibold text-sm rounded-lg hover:bg-flux-orange/90 transition-all">
            Voltar ao Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (loadingCriteria) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-flux-orange/30 border-t-flux-orange rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Carregando critérios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold text-flux-orange uppercase tracking-widest mb-1">Portal de Obras</p>
        <h1 className="text-2xl font-display font-semibold text-white">Avaliação da Equipe</h1>
        <p className="text-sm text-slate-400 mt-1">
          Avalie a equipe de instalação nos critérios de Segurança, Funcionalidade e Estética.
        </p>
      </div>

      {/* Score Summary (Sticky) */}
      <div className="sticky top-0 z-20 glass rounded-xl border border-white/5 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {(['seguranca', 'funcionalidade', 'estetica'] as const).map((cat) => {
              const cfg = CATEGORY_CONFIG[cat];
              const pct = categoryAvgPct(cat);
              return (
                <div key={cat} className="flex items-center gap-2">
                  <span className="text-sm">{cfg.icon}</span>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase">{cfg.label}</p>
                    <p className={cn('text-sm font-bold font-mono', cfg.color)}>{pct.toFixed(0)}%</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase">Nota Final</p>
            <p className={cn('text-2xl font-bold font-mono', totalScore >= 80 ? 'text-green-400' : totalScore >= 60 ? 'text-flux-orange' : 'text-red-400')}>
              {totalScore.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Criteria by Category */}
      {(Object.entries(CATEGORY_CONFIG) as [keyof typeof CATEGORY_CONFIG, typeof CATEGORY_CONFIG[keyof typeof CATEGORY_CONFIG]][]).map(([cat, cfg]) => {
        const items = (grouped as any)[cat] ?? [];
        if (!items.length) return null;
        return (
          <div key={cat} className="space-y-3">
            <div className={cn('flex items-center gap-3 px-4 py-3 rounded-lg', cfg.bg, 'border', cfg.border)}>
              <span className="text-lg">{cfg.icon}</span>
              <div>
                <h3 className={cn('text-sm font-semibold', cfg.color)}>{cfg.label}</h3>
                <p className="text-[10px] text-slate-500">Peso: {cfg.weight}x</p>
              </div>
            </div>
            {items.map((criterion: any) => {
              const score = getScore(criterion.id);
              const pct = (score / MAX_SCORE) * 100;
              return (
                <div key={criterion.id} className="glass rounded-xl border border-white/5 p-5 hover:border-white/10 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-medium text-white">{criterion.name}</h4>
                      {criterion.description && <p className="text-xs text-slate-500 mt-0.5">{criterion.description}</p>}
                    </div>
                    <div className="text-right">
                      <p className={cn('text-lg font-bold font-mono', pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-flux-orange' : 'text-red-400')}>
                        {score.toFixed(1)}
                      </p>
                      <p className="text-[10px] text-slate-500">/ {MAX_SCORE}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="range" min={0} max={MAX_SCORE} step={0.5} value={score}
                      onChange={(e) => setScores((prev) => ({ ...prev, [criterion.id]: parseFloat(e.target.value) }))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5
                        [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-flux-orange [&::-webkit-slider-thumb]:border-2
                        [&::-webkit-slider-thumb]:border-void [&::-webkit-slider-thumb]:shadow-lg
                        [&::-webkit-slider-thumb]:shadow-flux-orange/30 [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110"
                    />
                    <div
                      className={cn('absolute top-0 left-0 h-2 rounded-full pointer-events-none', pct >= 80 ? 'bg-green-400/40' : pct >= 60 ? 'bg-flux-orange/40' : 'bg-red-400/40')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Submit */}
      <div className="flex justify-end pt-4 pb-8">
        <button
          onClick={handleSubmit}
          disabled={submitMutation.isPending || !projectId}
          className={cn(
            'px-8 py-3 rounded-lg font-semibold text-sm transition-all',
            submitMutation.isPending || !projectId
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-flux-orange text-void hover:bg-flux-orange/90 hover:shadow-lg hover:shadow-flux-orange/20'
          )}
        >
          {submitMutation.isPending ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
              Enviando...
            </span>
          ) : (
            'Enviar Avaliação'
          )}
        </button>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-6 right-6 glass rounded-xl border border-red-500/20 p-4 max-w-sm animate-in slide-in-from-bottom-4 z-50">
          <div className="flex items-center gap-3">
            <span className="text-red-400">⚠️</span>
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={() => setError(null)} className="text-slate-500 hover:text-white ml-auto">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
