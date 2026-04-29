import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

const STATUS_MAP: Record<string, string> = {
  planning: 'pendente',
  in_progress: 'em_andamento',
  completed: 'concluido',
  cancelled: 'cancelado',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pendente:     { label: 'Pendente',    color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  em_andamento: { label: 'Em Andamento', color: 'text-blue-400',   bg: 'bg-blue-400/10'   },
  concluido:    { label: 'Concluído',   color: 'text-green-400',  bg: 'bg-green-400/10'  },
  cancelado:    { label: 'Cancelado',   color: 'text-red-400',    bg: 'bg-red-400/10'    },
};

const FILTER_TABS = [
  { key: 'all',         label: 'Todos'       },
  { key: 'pendente',    label: 'Pendentes'   },
  { key: 'em_andamento',label: 'Em Andamento'},
  { key: 'concluido',   label: 'Concluídos'  },
];

import { useState } from 'react';

export default function ObrasDashboard() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState('all');

  const { data: projects = [], isLoading, error, refetch } = trpc.projects.list.useQuery(undefined, {
    enabled: !!user,
  });

  const mapped = projects.map((p) => ({
    ...p,
    statusKey: STATUS_MAP[p.status] ?? 'pendente',
    powerKwp: parseFloat(String(p.powerKwp ?? 0)),
    score: p.projectScore ? parseFloat(String(p.projectScore)) : null,
  }));

  const filtered = filter === 'all' ? mapped : mapped.filter((p) => p.statusKey === filter);

  const stats = {
    total:        mapped.length,
    emAndamento:  mapped.filter((p) => p.statusKey === 'em_andamento').length,
    concluidos:   mapped.filter((p) => p.statusKey === 'concluido').length,
    potenciaTotal: mapped.reduce((s, p) => s + p.powerKwp, 0),
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-flux-orange uppercase tracking-widest mb-1">
            Portal de Obras
          </p>
          <h1 className="text-2xl font-display font-semibold text-white">Dashboard de Obras</h1>
          <p className="text-sm text-slate-400 mt-1">
            Gerencie projetos e avaliações da equipe de instalação
          </p>
        </div>
        <button
          onClick={() => navigate('/obras/avaliacao')}
          className="px-5 py-2.5 bg-flux-orange text-void font-semibold text-sm rounded-lg hover:bg-flux-orange/90 transition-all hover:shadow-lg hover:shadow-flux-orange/20"
        >
          Nova Avaliação
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total de Obras',  value: stats.total,                              icon: '🏗️', accent: 'text-flux-orange' },
          { label: 'Em Andamento',    value: stats.emAndamento,                        icon: '⚡', accent: 'text-blue-400'    },
          { label: 'Concluídas',      value: stats.concluidos,                         icon: '✅', accent: 'text-green-400'   },
          { label: 'Potência Total',  value: `${stats.potenciaTotal.toFixed(1)} kWp`,  icon: '☀️', accent: 'text-yellow-400'  },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-xl border border-white/5 p-5 hover:border-white/10 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{stat.label}</span>
            </div>
            <p className={cn('text-2xl font-display font-bold', stat.accent)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {FILTER_TABS.map((tab) => (
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

      {/* Projects List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-flux-orange/30 border-t-flux-orange rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Carregando projetos...</p>
          </div>
        </div>
      ) : error ? (
        <div className="glass rounded-xl border border-red-500/20 p-8 text-center">
          <p className="text-red-400 text-sm">Erro ao carregar projetos</p>
          <button onClick={() => refetch()} className="mt-4 text-xs text-flux-orange hover:underline">
            Tentar novamente
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl border border-white/5 p-12 text-center">
          <p className="text-4xl mb-4">🏗️</p>
          <h3 className="text-lg font-semibold text-white mb-2">Nenhuma obra encontrada</h3>
          <p className="text-sm text-slate-400">
            {filter === 'all' ? 'Nenhum projeto cadastrado ainda.' : `Nenhum projeto com status "${filter}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((project, index) => {
            const statusCfg = STATUS_CONFIG[project.statusKey] ?? STATUS_CONFIG.pendente;
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
                      <span>📍 {project.address || project.city || 'Sem endereço'}</span>
                      <span>☀️ {project.powerKwp.toFixed(2)} kWp</span>
                      <span>🏷️ Cat. {project.category}</span>
                    </div>
                  </div>

                  {project.score !== null && project.score > 0 && (
                    <div className="text-right ml-4">
                      <p className="text-xs text-slate-500">Nota</p>
                      <p className={cn(
                        'text-lg font-bold font-mono',
                        project.score >= 80 ? 'text-green-400' :
                        project.score >= 60 ? 'text-yellow-400' : 'text-red-400'
                      )}>
                        {project.score.toFixed(0)}%
                      </p>
                    </div>
                  )}

                  <svg className="w-4 h-4 text-slate-600 group-hover:text-flux-orange transition-all ml-4 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
