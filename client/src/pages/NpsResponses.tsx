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
