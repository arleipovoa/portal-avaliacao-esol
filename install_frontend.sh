#!/bin/bash
# ============================================================
# Script de Instalação - Frontend FLUX/ONYX
# Portal de Avaliações | Grupo E-sol
# ============================================================
# Uso: bash install_frontend.sh
# Executar na raiz do projeto: ~/dev/portal-avaliacao-esol
# ============================================================

set -e

PROJECT_DIR="$HOME/dev/portal-avaliacao-esol"

if [ ! -d "$PROJECT_DIR" ]; then
  echo "❌ Diretório do projeto não encontrado: $PROJECT_DIR"
  exit 1
fi

cd "$PROJECT_DIR"
echo "📁 Diretório: $PROJECT_DIR"
echo "🚀 Instalando arquivos do Frontend FLUX/ONYX..."
echo ""

# ── Criar diretórios necessários ──
mkdir -p client/src/lib
mkdir -p client/src/pages
mkdir -p client/src/components/layout

echo "✅ Diretórios criados"

# ============================================================
# 1. client/src/lib/api.ts
# ============================================================
echo "📝 Criando client/src/lib/api.ts..."
cat > client/src/lib/api.ts << 'ENDOFFILE'
import axios, { type AxiosInstance, type AxiosError } from 'axios';

// ── Base Config ──

const BASE_URL = import.meta.env.VITE_API_URL || '';

function createClient(prefix: string): AxiosInstance {
  const client = axios.create({
    baseURL: `${BASE_URL}${prefix}`,
    timeout: 15000,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return client;
}

// ── API Clients (one per module) ──

export const api360 = createClient('/api/360');
export const apiObras = createClient('/api/obras');
export const apiNps = createClient('/api/nps');
export const apiAuth = createClient('/api/auth');
export const apiAdmin = createClient('/api/admin');

// ── 360° Endpoints ──

export const evaluation360Api = {
  getCycles: () => api360.get('/cycles'),
  getCriteria: () => api360.get('/criteria'),
  getEvaluations: (cycleId: number, userId: number) =>
    api360.get(`/evaluations/${cycleId}/${userId}`),
  submitEvaluation: (data: any) => api360.post('/evaluations', data),
  finalizeEvaluation: (id: number) => api360.put(`/evaluations/${id}/submit`),
  getAggregates: (cycleId: number, userId: number) =>
    api360.get(`/aggregates/${cycleId}/${userId}`),
  getPodium: (cycleId: number) => api360.get(`/podium/${cycleId}`),
};

// ── Obras Endpoints ──

export const obrasApi = {
  getProjects: () => apiObras.get('/projects'),
  getProject: (id: number) => apiObras.get(`/projects/${id}`),
  createProject: (data: any) => apiObras.post('/projects', data),
  updateProject: (id: number, data: any) => apiObras.put(`/projects/${id}`, data),
  addMember: (projectId: number, data: any) =>
    apiObras.post(`/projects/${projectId}/members`, data),
  removeMember: (projectId: number, memberId: number) =>
    apiObras.delete(`/projects/${projectId}/members/${memberId}`),
  getCriteria: () => apiObras.get('/criteria'),
  submitEvaluation: (projectId: number, data: any) =>
    apiObras.post(`/projects/${projectId}/evaluations`, data),
  calculateScores: (projectId: number) =>
    apiObras.post(`/projects/${projectId}/scores`),
  getScores: (projectId: number) => apiObras.get(`/projects/${projectId}/scores`),
};

// ── NPS Endpoints ──

export const npsApi = {
  getSurveys: () => apiNps.get('/surveys'),
  getSurvey: (id: number) => apiNps.get(`/surveys/${id}`),
  createSurvey: (data: any) => apiNps.post('/surveys', data),
  updateSurvey: (id: number, data: any) => apiNps.put(`/surveys/${id}`, data),
  submitResponse: (surveyId: number, data: any) =>
    apiNps.post(`/surveys/${surveyId}/responses`, data),
  getResponses: (surveyId: number) => apiNps.get(`/surveys/${surveyId}/responses`),
  getAggregates: (surveyId: number) =>
    apiNps.get(`/surveys/${surveyId}/aggregates`),
};
ENDOFFILE

# ============================================================
# 2. client/src/pages/ObrasDashboard.tsx
# ============================================================
echo "📝 Criando client/src/pages/ObrasDashboard.tsx..."
cat > client/src/pages/ObrasDashboard.tsx << 'ENDOFFILE'
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { obrasApi } from '@/lib/api';
import { cn } from '@/lib/utils';

// ── Types ──

interface Project {
  id: number;
  clientName: string;
  address: string;
  potenciaKwp: number;
  bonusCategory: string;
  status: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
  createdAt: string;
  membersCount?: number;
  avgScore?: number;
}

// ── Status Config ──

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pendente: { label: 'Pendente', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  em_andamento: { label: 'Em Andamento', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  concluido: { label: 'Concluido', color: 'text-green-400', bg: 'bg-green-400/10' },
  cancelado: { label: 'Cancelado', color: 'text-red-400', bg: 'bg-red-400/10' },
};

// ── Component ──

export default function ObrasDashboard() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      setLoading(true);
      const res = await obrasApi.getProjects();
      setProjects(res.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar projetos');
    } finally {
      setLoading(false);
    }
  }

  const filteredProjects = filter === 'all'
    ? projects
    : projects.filter((p) => p.status === filter);

  const stats = {
    total: projects.length,
    emAndamento: projects.filter((p) => p.status === 'em_andamento').length,
    concluidos: projects.filter((p) => p.status === 'concluido').length,
    potenciaTotal: projects.reduce((sum, p) => sum + (p.potenciaKwp || 0), 0),
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-flux-orange uppercase tracking-widest mb-1">
            Portal de Obras
          </p>
          <h1 className="text-2xl font-display font-semibold text-white">
            Dashboard de Obras
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gerencie projetos e avaliacoes da equipe de instalacao
          </p>
        </div>
        <button
          onClick={() => navigate('/obras/avaliacao')}
          className="px-5 py-2.5 bg-flux-orange text-void font-semibold text-sm rounded-lg hover:bg-flux-orange/90 transition-all hover:shadow-lg hover:shadow-flux-orange/20"
        >
          Nova Avaliacao
        </button>
      </div>

      {/* ── Stats Grid (Bento) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total de Obras', value: stats.total, icon: '🏗️', accent: 'text-flux-orange' },
          { label: 'Em Andamento', value: stats.emAndamento, icon: '⚡', accent: 'text-blue-400' },
          { label: 'Concluidas', value: stats.concluidos, icon: '✅', accent: 'text-green-400' },
          { label: 'Potencia Total', value: `${stats.potenciaTotal.toFixed(1)} kWp`, icon: '☀️', accent: 'text-yellow-400' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass rounded-xl border border-white/5 p-5 hover:border-white/10 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                {stat.label}
              </span>
            </div>
            <p className={cn('text-2xl font-display font-bold', stat.accent)}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'pendente', label: 'Pendentes' },
          { key: 'em_andamento', label: 'Em Andamento' },
          { key: 'concluido', label: 'Concluidos' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
              filter === tab.key
                ? 'bg-flux-orange/10 text-flux-orange border border-flux-orange/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Projects List ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-flux-orange/30 border-t-flux-orange rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Carregando projetos...</p>
          </div>
        </div>
      ) : error ? (
        <div className="glass rounded-xl border border-red-500/20 p-8 text-center">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={loadProjects} className="mt-4 text-xs text-flux-orange hover:underline">
            Tentar novamente
          </button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="glass rounded-xl border border-white/5 p-12 text-center">
          <p className="text-4xl mb-4">🏗️</p>
          <h3 className="text-lg font-semibold text-white mb-2">Nenhuma obra encontrada</h3>
          <p className="text-sm text-slate-400">
            {filter === 'all'
              ? 'Nenhum projeto cadastrado ainda.'
              : `Nenhum projeto com status "${filter}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProjects.map((project, index) => {
            const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.pendente;
            return (
              <div
                key={project.id}
                className="glass rounded-xl border border-white/5 p-5 hover:border-white/10 transition-all cursor-pointer group animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                onClick={() => navigate(`/obras/avaliacao?projectId=${project.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-sm font-semibold text-white truncate group-hover:text-flux-orange transition-colors">
                        {project.clientName}
                      </h3>
                      <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-medium', statusCfg.bg, statusCfg.color)}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>📍 {project.address || 'Sem endereco'}</span>
                      <span>☀️ {project.potenciaKwp} kWp</span>
                      <span>🏷️ {project.bonusCategory}</span>
                    </div>
                  </div>

                  {/* Score */}
                  {project.avgScore !== undefined && project.avgScore > 0 && (
                    <div className="flex items-center gap-3 ml-4">
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Nota</p>
                        <p className={cn(
                          'text-lg font-bold font-mono',
                          project.avgScore >= 80 ? 'text-green-400' :
                          project.avgScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                        )}>
                          {project.avgScore.toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Arrow */}
                  <svg
                    className="w-4 h-4 text-slate-600 group-hover:text-flux-orange transition-all ml-4 group-hover:translate-x-1"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
ENDOFFILE

# ============================================================
# 3. client/src/pages/ObrasEvaluation.tsx
# ============================================================
echo "📝 Criando client/src/pages/ObrasEvaluation.tsx..."
cat > client/src/pages/ObrasEvaluation.tsx << 'ENDOFFILE'
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
ENDOFFILE

# ============================================================
# 4. client/src/pages/NpsDashboard.tsx
# ============================================================
echo "📝 Criando client/src/pages/NpsDashboard.tsx..."
cat > client/src/pages/NpsDashboard.tsx << 'ENDOFFILE'
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { npsApi } from '@/lib/api';
import { cn } from '@/lib/utils';

// ── Types ──

interface Survey {
  id: number;
  title: string;
  description: string;
  status: 'active' | 'closed' | 'draft';
  createdAt: string;
  responsesCount?: number;
  npsScore?: number;
}

interface NpsAggregates {
  totalResponses: number;
  npsScore: number;
  promoters: number;
  passives: number;
  detractors: number;
  avgScore: number;
}

// ── NPS Color Helper ──

function getNpsColor(score: number): string {
  if (score >= 75) return 'text-green-400';
  if (score >= 50) return 'text-lime-400';
  if (score >= 0) return 'text-yellow-400';
  return 'text-red-400';
}

function getNpsBg(score: number): string {
  if (score >= 75) return 'bg-green-400';
  if (score >= 50) return 'bg-lime-400';
  if (score >= 0) return 'bg-yellow-400';
  return 'bg-red-400';
}

function getNpsLabel(score: number): string {
  if (score >= 75) return 'Excelente';
  if (score >= 50) return 'Muito Bom';
  if (score >= 0) return 'Razoavel';
  return 'Critico';
}

// ── Component ──

export default function NpsDashboard() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSurvey, setNewSurvey] = useState({ title: '', description: '' });
  const [creating, setCreating] = useState(false);

  const appRole = (user as any)?.appRole || 'employee';
  const areaId = (user as any)?.areaId;
  const canEdit = appRole === 'admin' || areaId === 9; // Admin + Sucesso do Cliente

  useEffect(() => {
    loadSurveys();
  }, []);

  async function loadSurveys() {
    try {
      setLoading(true);
      const res = await npsApi.getSurveys();
      setSurveys(res.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar pesquisas');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSurvey() {
    if (!newSurvey.title.trim()) return;
    try {
      setCreating(true);
      await npsApi.createSurvey(newSurvey);
      setShowCreateModal(false);
      setNewSurvey({ title: '', description: '' });
      loadSurveys();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar pesquisa');
    } finally {
      setCreating(false);
    }
  }

  // Calculate overall NPS from all active surveys
  const overallNps = surveys.length > 0
    ? surveys.reduce((sum, s) => sum + (s.npsScore || 0), 0) / surveys.filter(s => s.npsScore !== undefined).length || 0
    : 0;

  const totalResponses = surveys.reduce((sum, s) => sum + (s.responsesCount || 0), 0);
  const activeSurveys = surveys.filter((s) => s.status === 'active').length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-1">
            Pesquisa NPS
          </p>
          <h1 className="text-2xl font-display font-semibold text-white">
            Satisfacao do Cliente
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {canEdit ? 'Gerencie pesquisas e acompanhe a satisfacao dos clientes' : 'Acompanhe a satisfacao dos clientes'}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-green-500 text-void font-semibold text-sm rounded-lg hover:bg-green-400 transition-all hover:shadow-lg hover:shadow-green-500/20"
          >
            Nova Pesquisa
          </button>
        )}
      </div>

      {/* ── NPS Gauge + Stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* NPS Gauge */}
        <div className="lg:col-span-1 glass rounded-2xl border border-white/5 p-8 flex flex-col items-center justify-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">NPS Score Geral</p>
          <div className="relative w-40 h-40">
            {/* Background circle */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke={overallNps >= 75 ? '#4ade80' : overallNps >= 50 ? '#a3e635' : overallNps >= 0 ? '#facc15' : '#f87171'}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${Math.max(0, (overallNps + 100) / 200) * 327} 327`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className={cn('text-3xl font-bold font-mono', getNpsColor(overallNps))}>
                {overallNps.toFixed(0)}
              </p>
              <p className="text-[10px] text-slate-500">{getNpsLabel(overallNps)}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {[
            { label: 'Total de Respostas', value: totalResponses, icon: '📝', accent: 'text-blue-400' },
            { label: 'Pesquisas Ativas', value: activeSurveys, icon: '📊', accent: 'text-green-400' },
            { label: 'Total de Pesquisas', value: surveys.length, icon: '📋', accent: 'text-purple-400' },
            { label: 'NPS Medio', value: `${overallNps.toFixed(0)}`, icon: '⭐', accent: getNpsColor(overallNps) },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-xl border border-white/5 p-5 hover:border-white/10 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg">{stat.icon}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className={cn('text-2xl font-display font-bold', stat.accent)}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Surveys List ── */}
      <div>
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Pesquisas</h2>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
          </div>
        ) : surveys.length === 0 ? (
          <div className="glass rounded-xl border border-white/5 p-12 text-center">
            <p className="text-4xl mb-4">📊</p>
            <h3 className="text-lg font-semibold text-white mb-2">Nenhuma pesquisa encontrada</h3>
            <p className="text-sm text-slate-400">
              {canEdit ? 'Crie uma nova pesquisa para comecar.' : 'Aguarde a criacao de uma pesquisa.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {surveys.map((survey, index) => {
              const nps = survey.npsScore || 0;
              return (
                <div
                  key={survey.id}
                  className="glass rounded-xl border border-white/5 p-5 hover:border-white/10 transition-all cursor-pointer group animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                  onClick={() => canEdit ? navigate(`/nps/respostas?surveyId=${survey.id}`) : null}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-sm font-semibold text-white truncate group-hover:text-green-400 transition-colors">
                          {survey.title}
                        </h3>
                        <span className={cn(
                          'px-2.5 py-0.5 rounded-full text-[10px] font-medium',
                          survey.status === 'active' ? 'bg-green-400/10 text-green-400' :
                          survey.status === 'closed' ? 'bg-slate-400/10 text-slate-400' :
                          'bg-yellow-400/10 text-yellow-400'
                        )}>
                          {survey.status === 'active' ? 'Ativa' : survey.status === 'closed' ? 'Encerrada' : 'Rascunho'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{survey.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span>📝 {survey.responsesCount || 0} respostas</span>
                        <span>📅 {new Date(survey.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>

                    {/* NPS Score */}
                    <div className="flex items-center gap-3 ml-4">
                      <div className="text-right">
                        <p className="text-xs text-slate-500">NPS</p>
                        <p className={cn('text-xl font-bold font-mono', getNpsColor(nps))}>
                          {nps.toFixed(0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Create Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass rounded-2xl border border-white/10 p-8 w-full max-w-md animate-in zoom-in-95 duration-300">
            <h3 className="text-lg font-semibold text-white mb-6">Nova Pesquisa NPS</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Titulo</label>
                <input
                  type="text"
                  value={newSurvey.title}
                  onChange={(e) => setNewSurvey({ ...newSurvey, title: e.target.value })}
                  placeholder="Ex: Satisfacao Q1 2026"
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:border-green-400/30 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Descricao</label>
                <textarea
                  value={newSurvey.description}
                  onChange={(e) => setNewSurvey({ ...newSurvey, description: e.target.value })}
                  placeholder="Descreva o objetivo da pesquisa..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:border-green-400/30 focus:outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateSurvey}
                disabled={creating || !newSurvey.title.trim()}
                className={cn(
                  'px-5 py-2 rounded-lg text-sm font-semibold transition-all',
                  creating || !newSurvey.title.trim()
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-green-500 text-void hover:bg-green-400'
                )}
              >
                {creating ? 'Criando...' : 'Criar Pesquisa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Error Toast ── */}
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
ENDOFFILE

# ============================================================
# 5. client/src/pages/NpsResponses.tsx
# ============================================================
echo "📝 Criando client/src/pages/NpsResponses.tsx..."
cat > client/src/pages/NpsResponses.tsx << 'ENDOFFILE'
import { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { npsApi } from '@/lib/api';
import { cn } from '@/lib/utils';

// ── Types ──

interface NpsResponse {
  id: number;
  respondentName: string;
  score: number;
  comment: string;
  createdAt: string;
}

// ── Component ──

export default function NpsResponses() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [responses, setResponses] = useState<NpsResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const appRole = (user as any)?.appRole || 'employee';
  const areaId = (user as any)?.areaId;
  const canEdit = appRole === 'admin' || areaId === 9;

  useEffect(() => {
    if (!canEdit) return;
    loadResponses();
  }, []);

  async function loadResponses() {
    try {
      setLoading(true);
      const params = new URLSearchParams(window.location.search);
      const surveyId = parseInt(params.get('surveyId') || '0');
      if (!surveyId) {
        setError('ID da pesquisa nao informado');
        return;
      }
      const res = await npsApi.getResponses(surveyId);
      setResponses(res.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar respostas');
    } finally {
      setLoading(false);
    }
  }

  function getScoreColor(score: number): string {
    if (score >= 9) return 'text-green-400 bg-green-400/10 border-green-400/20';
    if (score >= 7) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    return 'text-red-400 bg-red-400/10 border-red-400/20';
  }

  function getScoreLabel(score: number): string {
    if (score >= 9) return 'Promotor';
    if (score >= 7) return 'Neutro';
    return 'Detrator';
  }

  if (!canEdit) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass rounded-2xl border border-red-500/20 p-12 text-center max-w-md">
          <p className="text-4xl mb-4">🔒</p>
          <h2 className="text-xl font-semibold text-white mb-2">Acesso Restrito</h2>
          <p className="text-sm text-slate-400">
            Apenas administradores e a equipe de Sucesso do Cliente podem visualizar as respostas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Header ── */}
      <div>
        <p className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-1">
          Pesquisa NPS
        </p>
        <h1 className="text-2xl font-display font-semibold text-white">
          Respostas da Pesquisa
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Visualize todas as respostas individuais e comentarios dos clientes.
        </p>
      </div>

      {/* ── Summary Stats ── */}
      {!loading && responses.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: 'Promotores (9-10)',
              value: responses.filter((r) => r.score >= 9).length,
              total: responses.length,
              color: 'text-green-400',
            },
            {
              label: 'Neutros (7-8)',
              value: responses.filter((r) => r.score >= 7 && r.score < 9).length,
              total: responses.length,
              color: 'text-yellow-400',
            },
            {
              label: 'Detratores (0-6)',
              value: responses.filter((r) => r.score < 7).length,
              total: responses.length,
              color: 'text-red-400',
            },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-xl border border-white/5 p-5">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">{stat.label}</p>
              <div className="flex items-end gap-2">
                <p className={cn('text-2xl font-bold font-mono', stat.color)}>{stat.value}</p>
                <p className="text-xs text-slate-500 mb-1">
                  ({stat.total > 0 ? ((stat.value / stat.total) * 100).toFixed(0) : 0}%)
                </p>
              </div>
              {/* Bar */}
              <div className="mt-3 h-1.5 rounded-full bg-white/5">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', stat.color.replace('text-', 'bg-'))}
                  style={{ width: `${stat.total > 0 ? (stat.value / stat.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Responses List ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="glass rounded-xl border border-red-500/20 p-8 text-center">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      ) : responses.length === 0 ? (
        <div className="glass rounded-xl border border-white/5 p-12 text-center">
          <p className="text-4xl mb-4">📝</p>
          <h3 className="text-lg font-semibold text-white mb-2">Nenhuma resposta ainda</h3>
          <p className="text-sm text-slate-400">Aguarde os clientes responderem a pesquisa.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {responses.map((response, index) => (
            <div
              key={response.id}
              className="glass rounded-xl border border-white/5 p-5 hover:border-white/10 transition-all animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'both' }}
            >
              <div className="flex items-start gap-4">
                {/* Score Badge */}
                <div className={cn('w-14 h-14 rounded-xl border flex flex-col items-center justify-center shrink-0', getScoreColor(response.score))}>
                  <p className="text-lg font-bold font-mono">{response.score}</p>
                  <p className="text-[8px] uppercase">{getScoreLabel(response.score)}</p>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-white">{response.respondentName}</h4>
                    <span className="text-[10px] text-slate-500">
                      {new Date(response.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  {response.comment && (
                    <p className="text-xs text-slate-400 leading-relaxed mt-1">
                      "{response.comment}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
ENDOFFILE

# ============================================================
# 6. client/src/App.tsx
# ============================================================
echo "📝 Atualizando client/src/App.tsx..."
cat > client/src/App.tsx << 'ENDOFFILE'
import { Switch, Route, Redirect } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';

// ── Layouts ──
import MainLayout from '@/components/layout/MainLayout';

// ── Pages: Auth ──
import Login from '@/pages/Login';

// ── Pages: Core ──
import Landing from '@/pages/Landing';
import Dashboard from '@/pages/Dashboard';

// ── Pages: 360 ──
import Sub360Dashboard from '@/pages/Sub360Dashboard';
import Evaluation360 from '@/pages/Evaluation360';
import Evaluations from '@/pages/Evaluations';

// ── Pages: Obras ──
import ObrasDashboard from '@/pages/ObrasDashboard';
import ObrasEvaluation from '@/pages/ObrasEvaluation';

// ── Pages: NPS ──
import NpsDashboard from '@/pages/NpsDashboard';
import NpsResponses from '@/pages/NpsResponses';

// ── Pages: Admin ──
import AdminUsers from '@/pages/admin/AdminUsers';
import EditUserForm from '@/pages/admin/EditUserForm';

// ── Protected Route ──
function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType; path: string }) {
  const { user, isLoading } = useAuth({ redirectOnUnauthenticated: false });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-void">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-flux-orange/30 border-t-flux-orange rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-display">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

// ── App ──
export default function App() {
  return (
    <Switch>
      {/* ── Public Routes ── */}
      <Route path="/login" component={Login} />

      {/* ── Protected Routes (with MainLayout) ── */}
      <Route path="/">
        <MainLayout>
          <Switch>
            {/* Landing / Home */}
            <Route path="/" component={Landing} />
            <Route path="/dashboard" component={Dashboard} />

            {/* ── Modulo 360 ── */}
            <Route path="/360">
              <Redirect to="/360/dashboard" />
            </Route>
            <Route path="/360/dashboard">
              <ProtectedRoute path="/360/dashboard" component={Sub360Dashboard} />
            </Route>
            <Route path="/360/avaliacoes">
              <ProtectedRoute path="/360/avaliacoes" component={Evaluations} />
            </Route>
            <Route path="/360/avaliar/:userId">
              <ProtectedRoute path="/360/avaliar/:userId" component={Evaluation360} />
            </Route>

            {/* ── Modulo Obras ── */}
            <Route path="/obras">
              <Redirect to="/obras/dashboard" />
            </Route>
            <Route path="/obras/dashboard">
              <ProtectedRoute path="/obras/dashboard" component={ObrasDashboard} />
            </Route>
            <Route path="/obras/avaliacao">
              <ProtectedRoute path="/obras/avaliacao" component={ObrasEvaluation} />
            </Route>

            {/* ── Modulo NPS ── */}
            <Route path="/nps">
              <Redirect to="/nps/dashboard" />
            </Route>
            <Route path="/nps/dashboard">
              <ProtectedRoute path="/nps/dashboard" component={NpsDashboard} />
            </Route>
            <Route path="/nps/respostas">
              <ProtectedRoute path="/nps/respostas" component={NpsResponses} />
            </Route>

            {/* ── Admin ── */}
            <Route path="/admin/users">
              <ProtectedRoute path="/admin/users" component={AdminUsers} />
            </Route>
            <Route path="/admin/users/:id">
              <ProtectedRoute path="/admin/users/:id" component={EditUserForm} />
            </Route>

            {/* ── Fallback ── */}
            <Route>
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="glass rounded-2xl border border-white/5 p-12 text-center max-w-md">
                  <p className="text-5xl mb-4">404</p>
                  <h2 className="text-xl font-semibold text-white mb-2">Pagina nao encontrada</h2>
                  <p className="text-sm text-slate-400 mb-6">
                    A pagina que voce esta procurando nao existe ou foi movida.
                  </p>
                  <a
                    href="/"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-flux-orange text-void font-semibold text-sm rounded-lg hover:bg-flux-orange/90 transition-all"
                  >
                    Voltar ao Inicio
                  </a>
                </div>
              </div>
            </Route>
          </Switch>
        </MainLayout>
      </Route>
    </Switch>
  );
}
ENDOFFILE

# ============================================================
# 7. client/src/pages/Landing.tsx
# ============================================================
echo "📝 Atualizando client/src/pages/Landing.tsx..."
cat > client/src/pages/Landing.tsx << 'ENDOFFILE'
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';

// ── Module Cards Config ──

const MODULES = [
  {
    id: '360',
    title: 'Avaliacao 360',
    subtitle: 'Desempenho & Comportamento',
    description: 'Avaliacao completa de desempenho e comportamento de todos os colaboradores da empresa.',
    icon: '\u{1F3AF}',
    route: '/360/dashboard',
    gradient: 'from-blue-500/20 via-blue-500/5 to-transparent',
    borderColor: 'border-blue-500/20 hover:border-blue-500/40',
    accentColor: 'text-blue-400',
    badgeColor: 'bg-blue-500/10 text-blue-400',
    stats: [
      { label: 'Ciclo', value: 'Mensal' },
      { label: 'Podio', value: 'Trimestral' },
    ],
    access: 'all',
  },
  {
    id: 'obras',
    title: 'Avaliacao da Equipe',
    subtitle: 'Portal de Obras',
    description: 'Avaliacao tecnica das equipes de instalacao por obra: Seguranca, Funcionalidade e Estetica.',
    icon: '\u{1F3D7}',
    route: '/obras/dashboard',
    gradient: 'from-flux-orange/20 via-flux-orange/5 to-transparent',
    borderColor: 'border-flux-orange/20 hover:border-flux-orange/40',
    accentColor: 'text-flux-orange',
    badgeColor: 'bg-flux-orange/10 text-flux-orange',
    stats: [
      { label: 'Ciclo', value: 'Por Obra' },
      { label: 'Bonus', value: 'kWp' },
    ],
    access: 'obras',
  },
  {
    id: 'nps',
    title: 'Pesquisa NPS',
    subtitle: 'Satisfacao do Cliente',
    description: 'Pesquisas de satisfacao para medir a experiencia dos clientes com nossos servicos.',
    icon: '\u{1F4CA}',
    route: '/nps/dashboard',
    gradient: 'from-green-500/20 via-green-500/5 to-transparent',
    borderColor: 'border-green-500/20 hover:border-green-500/40',
    accentColor: 'text-green-400',
    badgeColor: 'bg-green-500/10 text-green-400',
    stats: [
      { label: 'Ciclo', value: 'Continuo' },
      { label: 'Tipo', value: '0-10' },
    ],
    access: 'all',
  },
];

// ── Component ──

export default function Landing() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();

  const appRole = (user as any)?.appRole || 'employee';
  const jobCategory = (user as any)?.jobCategory || 'administrativo';

  const visibleModules = MODULES.filter((mod) => {
    if (mod.access === 'all') return true;
    if (mod.access === 'obras') {
      if (jobCategory === 'operacional') return true;
      if (appRole === 'admin' || appRole === 'leader') return true;
      return false;
    }
    return true;
  });

  const greeting = getGreeting();
  const firstName = (user as any)?.name?.split(' ')[0] || 'Colaborador';

  return (
    <div className="space-y-10">
      {/* ── Hero Section ── */}
      <div className="relative overflow-hidden rounded-2xl glass border border-white/5 p-8 md:p-12">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-96 h-96 bg-flux-orange/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <p className="text-xs font-semibold text-flux-orange uppercase tracking-widest mb-3">
            Central E-sol
          </p>
          <h1 className="text-3xl md:text-4xl font-display font-semibold text-white mb-2">
            {greeting}, <span className="text-flux-orange">{firstName}</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-xl">
            Selecione um modulo abaixo para acessar as avaliacoes, pesquisas e ferramentas de gestao do Grupo E-sol.
          </p>
        </div>
      </div>

      {/* ── Module Cards (Bento Grid) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleModules.map((mod, index) => (
          <button
            key={mod.id}
            onClick={() => navigate(mod.route)}
            className={cn(
              'group relative text-left rounded-2xl border p-6 transition-all duration-300',
              'hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20',
              'bg-gradient-to-br',
              mod.gradient,
              mod.borderColor,
              'animate-in fade-in slide-in-from-bottom-4'
            )}
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                {mod.icon}
              </div>
              <svg
                className={cn('w-5 h-5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1', mod.accentColor)}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>

            <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-flux-orange transition-colors">
              {mod.title}
            </h3>
            <p className={cn('text-xs font-medium uppercase tracking-wider mb-3', mod.accentColor)}>
              {mod.subtitle}
            </p>
            <p className="text-sm text-slate-400 leading-relaxed mb-5">
              {mod.description}
            </p>

            <div className="flex gap-3">
              {mod.stats.map((stat) => (
                <div key={stat.label} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium', mod.badgeColor)}>
                  <span className="text-slate-500">{stat.label}:</span> {stat.value}
                </div>
              ))}
            </div>

            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
              <div className={cn('absolute inset-0 rounded-2xl bg-gradient-to-br', mod.gradient, 'opacity-50')} />
            </div>
          </button>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      {appRole === 'admin' && (
        <div className="glass rounded-xl border border-white/5 p-6">
          <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
            Acoes Rapidas (Admin)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Gerenciar Usuarios', route: '/admin/users', icon: '\u{1F465}' },
              { label: 'Dashboard Geral', route: '/dashboard', icon: '\u{1F4C8}' },
              { label: 'Novo Ciclo 360', route: '/360/dashboard', icon: '\u{1F504}' },
              { label: 'Nova Pesquisa NPS', route: '/nps/dashboard', icon: '\u{1F4CB}' },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.route)}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-left"
              >
                <span className="text-lg">{action.icon}</span>
                <span className="text-xs text-slate-300 font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}
ENDOFFILE

# ============================================================
# 8. client/src/components/layout/Navigation.tsx
# ============================================================
echo "📝 Atualizando client/src/components/layout/Navigation.tsx..."
cat > client/src/components/layout/Navigation.tsx << 'ENDOFFILE'
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  children?: { label: string; route: string }[];
  access?: 'all' | 'admin' | 'obras' | 'nps-editor';
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', icon: '\u{1F3E0}', route: '/', access: 'all' },
  { label: 'Dashboard', icon: '\u{1F4C8}', route: '/dashboard', access: 'admin' },
  {
    label: 'Avaliacao 360',
    icon: '\u{1F3AF}',
    route: '/360',
    access: 'all',
    children: [
      { label: 'Dashboard', route: '/360/dashboard' },
      { label: 'Avaliacoes', route: '/360/avaliacoes' },
    ],
  },
  {
    label: 'Portal de Obras',
    icon: '\u{1F3D7}',
    route: '/obras',
    access: 'obras',
    children: [
      { label: 'Dashboard', route: '/obras/dashboard' },
      { label: 'Avaliacao da Equipe', route: '/obras/avaliacao' },
    ],
  },
  {
    label: 'Pesquisa NPS',
    icon: '\u{1F4CA}',
    route: '/nps',
    access: 'all',
    children: [
      { label: 'Dashboard', route: '/nps/dashboard' },
      { label: 'Respostas', route: '/nps/respostas' },
    ],
  },
  { label: 'Usuarios', icon: '\u{1F465}', route: '/admin/users', access: 'admin' },
];

interface NavigationProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function Navigation({ collapsed = false, onToggle }: NavigationProps) {
  const [location, navigate] = useLocation();
  const { user } = useAuth({ redirectOnUnauthenticated: false });

  const appRole = (user as any)?.appRole || 'employee';
  const jobCategory = (user as any)?.jobCategory || 'administrativo';
  const areaId = (user as any)?.areaId;

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.access === 'all') return true;
    if (item.access === 'admin') return appRole === 'admin';
    if (item.access === 'obras') {
      return jobCategory === 'operacional' || appRole === 'admin' || appRole === 'leader';
    }
    if (item.access === 'nps-editor') {
      return appRole === 'admin' || areaId === 9;
    }
    return true;
  });

  const filterChildren = (item: NavItem) => {
    if (item.route === '/nps' && item.children) {
      const canEditNps = appRole === 'admin' || areaId === 9;
      if (!canEditNps) {
        return item.children.filter((c) => c.route !== '/nps/respostas');
      }
    }
    return item.children;
  };

  const isActive = (route: string) => {
    if (route === '/') return location === '/';
    return location.startsWith(route);
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 ease-out',
        'bg-void/95 backdrop-blur-xl border-r border-white/5',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="h-16 flex items-center px-4 border-b border-white/5 shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-flux-orange/10 border border-flux-orange/20 flex items-center justify-center">
              <span className="text-flux-orange text-sm font-bold">E</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-none">Central E-sol</p>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5">Portal de Avaliacoes</p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-flux-orange/10 border border-flux-orange/20 flex items-center justify-center mx-auto">
            <span className="text-flux-orange text-sm font-bold">E</span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {visibleItems.map((item) => {
          const active = isActive(item.route);
          const children = filterChildren(item);

          return (
            <div key={item.route}>
              <button
                onClick={() => {
                  if (children && children.length > 0) {
                    navigate(children[0].route);
                  } else {
                    navigate(item.route);
                  }
                }}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-flux-orange/10 text-flux-orange border border-flux-orange/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                )}
              >
                <span className="text-base shrink-0">{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className="truncate">{item.label}</span>
                    {children && children.length > 0 && (
                      <svg
                        className={cn('w-3 h-3 ml-auto transition-transform', active && 'rotate-90')}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </>
                )}
              </button>

              {!collapsed && active && children && children.length > 0 && (
                <div className="ml-8 mt-1 space-y-0.5">
                  {children.map((child) => {
                    const childActive = location === child.route;
                    return (
                      <button
                        key={child.route}
                        onClick={() => navigate(child.route)}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-all duration-200',
                          childActive
                            ? 'text-flux-orange bg-flux-orange/5'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                        )}
                      >
                        <span className={cn('inline-block w-1.5 h-1.5 rounded-full mr-2', childActive ? 'bg-flux-orange' : 'bg-slate-600')} />
                        {child.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/5 p-3 shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-flux-orange/10 border border-flux-orange/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-flux-orange">
                {((user as any)?.name || 'U')[0].toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{(user as any)?.name || 'Usuario'}</p>
              <p className="text-[10px] text-slate-500 truncate capitalize">{appRole}</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-flux-orange/10 border border-flux-orange/20 flex items-center justify-center">
              <span className="text-xs font-bold text-flux-orange">
                {((user as any)?.name || 'U')[0].toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-obsidian border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-flux-orange/30 transition-all z-50"
      >
        <svg className={cn('w-3 h-3 transition-transform', collapsed && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </aside>
  );
}
ENDOFFILE

echo ""
echo "============================================================"
echo "✅ Todos os 8 arquivos foram criados com sucesso!"
echo "============================================================"
echo ""
echo "Arquivos criados/atualizados:"
echo "  - client/src/lib/api.ts"
echo "  - client/src/pages/ObrasDashboard.tsx"
echo "  - client/src/pages/ObrasEvaluation.tsx"
echo "  - client/src/pages/NpsDashboard.tsx"
echo "  - client/src/pages/NpsResponses.tsx"
echo "  - client/src/App.tsx"
echo "  - client/src/pages/Landing.tsx"
echo "  - client/src/components/layout/Navigation.tsx"
echo ""
echo "Para commitar, execute:"
echo "  git add -A"
echo "  git commit -m 'feat: expandir telas de Obras e NPS com design FLUX/ONYX'"
echo "  git push origin branch-main"
echo ""
