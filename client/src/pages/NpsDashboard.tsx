import { useAuth } from '@/_core/hooks/useAuth';
import { cn } from '@/lib/utils';

export default function NpsDashboard() {
  useAuth({ redirectOnUnauthenticated: true });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-1">
          Pesquisa NPS
        </p>
        <h1 className="text-2xl font-display font-semibold text-white">Satisfação do Cliente</h1>
        <p className="text-sm text-slate-400 mt-1">Acompanhe a satisfação dos clientes</p>
      </div>

      {/* Em desenvolvimento */}
      <div className="glass rounded-2xl border border-white/5 p-16 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-400/10 border border-green-400/20 flex items-center justify-center mb-6">
          <span className="text-3xl">📊</span>
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Módulo em Configuração</h2>
        <p className="text-sm text-slate-400 max-w-sm">
          O módulo de NPS está sendo configurado e estará disponível em breve.
          Os dados coletados nas pesquisas serão exibidos aqui.
        </p>
        <div className={cn(
          'mt-6 px-4 py-2 rounded-full text-xs font-medium',
          'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20'
        )}>
          Em breve
        </div>
      </div>
    </div>
  );
}
