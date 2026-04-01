import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { obrasApi } from '@/lib/api';
import { cn } from '@/lib/utils';

// ── Types ──

interface ObraCriterion {
  id: number;
  name: string;
  description: string;
  category: 'seguranca' | 'funcionalidade' | 'estetica' | 'complementar';
  weight: number;
  maxScore: number;
}

interface ScoreEntry {
  criterionId: number;
  score: number;
}

// ── Category Config ──

const CATEGORY_CONFIG = {
  seguranca: { label: 'Seguranca', icon: '🛡️', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20', weight: 2.0 },
  funcionalidade: { label: 'Funcionalidade', icon: '⚙️', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', weight: 2.0 },
  estetica: { label: 'Estetica', icon: '✨', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', weight: 1.0 },
  complementar: { label: 'Complementar', icon: '📋', color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20', weight: 1.0 },
};

// ── Component ──

export default function ObrasEvaluation() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [criteria, setCriteria] = useState<ObraCriterion[]>([]);
  const [scores, setScores] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCriteria();
  }, []);

  async function loadCriteria() {
    try {
      setLoading(true);
      const res = await obrasApi.getCriteria();
      setCriteria(res.data);
      // Initialize scores to max (10)
      const initial = new Map<number, number>();
      res.data.forEach((c: ObraCriterion) => initial.set(c.id, c.maxScore));
      setScores(initial);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar criterios');
    } finally {
      setLoading(false);
    }
  }

  function updateScore(criterionId: number, value: number) {
    setScores((prev) => {
      const next = new Map(prev);
      next.set(criterionId, value);
      return next;
    });
  }

  // Group criteria by category
  const grouped = useMemo(() => {
    const groups: Record<string, ObraCriterion[]> = {};
    criteria.forEach((c) => {
      if (!groups[c.category]) groups[c.category] = [];
      groups[c.category].push(c);
    });
    return groups;
  }, [criteria]);

  // Calculate scores per category and total
  const categoryScores = useMemo(() => {
    const result: Record<string, { earned: number; max: number; pct: number }> = {};
    Object.entries(grouped).forEach(([cat, items]) => {
      const earned = items.reduce((sum, c) => sum + (scores.get(c.id) || 0), 0);
      const max = items.reduce((sum, c) => sum + c.maxScore, 0);
      result[cat] = { earned, max, pct: max > 0 ? (earned / max) * 100 : 0 };
    });
    return result;
  }, [grouped, scores]);

  const totalScore = useMemo(() => {
    const seg = categoryScores.seguranca?.pct || 0;
    const func = categoryScores.funcionalidade?.pct || 0;
    const est = categoryScores.estetica?.pct || 0;
    // Formula: (Seg*2 + Func*2 + Est*1) / 5
    return (seg * 2 + func * 2 + est * 1) / 5;
  }, [categoryScores]);

  async function handleSubmit() {
    try {
      setSubmitting(true);
      const params = new URLSearchParams(window.location.search);
      const projectId = parseInt(params.get('projectId') || '0');

      const entries: ScoreEntry[] = [];
      scores.forEach((score, criterionId) => {
        entries.push({ criterionId, score });
      });

      await obrasApi.submitEvaluation(projectId, {
        evaluatorId: (user as any)?.id,
        scores: entries,
      });

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao submeter avaliacao');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500">
        <div className="glass rounded-2xl border border-green-500/20 p-12 text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Avaliacao Enviada!</h2>
          <p className="text-sm text-slate-400 mb-2">
            Nota Final: <span className="text-green-400 font-bold font-mono">{totalScore.toFixed(1)}%</span>
          </p>
          <p className="text-xs text-slate-500 mb-6">
            A avaliacao da equipe foi registrada com sucesso.
          </p>
          <a
            href="/obras/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-flux-orange text-void font-semibold text-sm rounded-lg hover:bg-flux-orange/90 transition-all"
          >
            Voltar ao Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-flux-orange/30 border-t-flux-orange rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Carregando criterios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Header ── */}
      <div>
        <p className="text-xs font-semibold text-flux-orange uppercase tracking-widest mb-1">
          Portal de Obras
        </p>
        <h1 className="text-2xl font-display font-semibold text-white">
          Avaliacao da Equipe
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Avalie a equipe de instalacao nos criterios de Seguranca, Funcionalidade e Estetica.
        </p>
      </div>

      {/* ── Score Summary (Sticky) ── */}
      <div className="sticky top-0 z-20 glass rounded-xl border border-white/5 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
              const catScore = categoryScores[key];
              if (!catScore) return null;
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-sm">{cfg.icon}</span>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase">{cfg.label}</p>
                    <p className={cn('text-sm font-bold font-mono', cfg.color)}>
                      {catScore.pct.toFixed(0)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase">Nota Final</p>
            <p className={cn(
              'text-2xl font-bold font-mono',
              totalScore >= 80 ? 'text-green-400' :
              totalScore >= 60 ? 'text-flux-orange' : 'text-red-400'
            )}>
              {totalScore.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* ── Criteria by Category ── */}
      {Object.entries(grouped).map(([category, items]) => {
        const cfg = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
        if (!cfg) return null;

        return (
          <div key={category} className="space-y-3">
            {/* Category Header */}
            <div className={cn('flex items-center gap-3 px-4 py-3 rounded-lg', cfg.bg, 'border', cfg.border)}>
              <span className="text-lg">{cfg.icon}</span>
              <div>
                <h3 className={cn('text-sm font-semibold', cfg.color)}>{cfg.label}</h3>
                <p className="text-[10px] text-slate-500">Peso: {cfg.weight}x</p>
              </div>
            </div>

            {/* Criteria Items */}
            {items.map((criterion) => {
              const score = scores.get(criterion.id) || 0;
              const pct = criterion.maxScore > 0 ? (score / criterion.maxScore) * 100 : 0;

              return (
                <div
                  key={criterion.id}
                  className="glass rounded-xl border border-white/5 p-5 hover:border-white/10 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-medium text-white">{criterion.name}</h4>
                      {criterion.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{criterion.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        'text-lg font-bold font-mono',
                        pct >= 80 ? 'text-green-400' :
                        pct >= 60 ? 'text-flux-orange' : 'text-red-400'
                      )}>
                        {score}
                      </p>
                      <p className="text-[10px] text-slate-500">/ {criterion.maxScore}</p>
                    </div>
                  </div>

                  {/* Slider */}
                  <div className="relative">
                    <input
                      type="range"
                      min={0}
                      max={criterion.maxScore}
                      step={0.5}
                      value={score}
                      onChange={(e) => updateScore(criterion.id, parseFloat(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-5
                        [&::-webkit-slider-thumb]:h-5
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-flux-orange
                        [&::-webkit-slider-thumb]:border-2
                        [&::-webkit-slider-thumb]:border-void
                        [&::-webkit-slider-thumb]:shadow-lg
                        [&::-webkit-slider-thumb]:shadow-flux-orange/30
                        [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-webkit-slider-thumb]:transition-all
                        [&::-webkit-slider-thumb]:hover:scale-110"
                    />
                    {/* Progress bar */}
                    <div
                      className={cn(
                        'absolute top-0 left-0 h-2 rounded-full pointer-events-none',
                        pct >= 80 ? 'bg-green-400/40' :
                        pct >= 60 ? 'bg-flux-orange/40' : 'bg-red-400/40'
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* ── Submit Button ── */}
      <div className="flex justify-end pt-4 pb-8">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={cn(
            'px-8 py-3 rounded-lg font-semibold text-sm transition-all',
            submitting
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-flux-orange text-void hover:bg-flux-orange/90 hover:shadow-lg hover:shadow-flux-orange/20'
          )}
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
              Enviando...
            </span>
          ) : (
            'Enviar Avaliacao'
          )}
        </button>
      </div>

      {/* ── Error Toast ── */}
      {error && (
        <div className="fixed bottom-6 right-6 glass rounded-xl border border-red-500/20 p-4 max-w-sm animate-in slide-in-from-bottom-4 z-50">
          <div className="flex items-center gap-3">
            <span className="text-red-400">⚠️</span>
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={() => setError(null)} className="text-slate-500 hover:text-white ml-auto">
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
