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
