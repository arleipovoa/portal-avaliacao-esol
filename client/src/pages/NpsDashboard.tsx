import { useAuth } from '@/_core/hooks/useAuth';
import { ChartBar } from '@phosphor-icons/react';

export default function NpsDashboard() {
  useAuth({ redirectOnUnauthenticated: true });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">
          Pesquisa NPS
        </p>
        <h1 className="text-2xl font-display font-semibold text-foreground">Satisfacao do Cliente</h1>
        <p className="text-sm text-muted-foreground mt-1">Acompanhe a satisfacao dos clientes</p>
      </div>

      {/* Coming soon */}
      <div className="rounded-2xl border border-border bg-card p-16 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
          <ChartBar size={32} weight="duotone" className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Modulo em Configuracao</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          O modulo de NPS esta sendo configurado e estara disponivel em breve.
          Os dados coletados nas pesquisas serao exibidos aqui.
        </p>
        <div className="mt-6 px-4 py-2 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          Em breve
        </div>
      </div>
    </div>
  );
}
