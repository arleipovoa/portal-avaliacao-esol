import { useAuth } from '@/_core/hooks/useAuth';
import { cn } from '@/lib/utils';

export default function NpsResponses() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });

  const appRole = (user as any)?.appRole || 'employee';
  const areaId  = (user as any)?.areaId;
  const canView = appRole === 'admin' || areaId === 9;

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass rounded-2xl border border-red-500/20 p-12 text-center max-w-md">
          <p className="text-4xl mb-4">🔒</p>
          <h2 className="text-xl font-semibold text-foreground mb-2">Acesso Restrito</h2>
          <p className="text-sm text-muted-foreground">
            Apenas administradores e a equipe de Sucesso do Cliente podem visualizar as respostas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <p className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-1">Pesquisa NPS</p>
        <h1 className="text-2xl font-display font-semibold text-foreground">Respostas da Pesquisa</h1>
        <p className="text-sm text-muted-foreground mt-1">Visualize as respostas individuais dos clientes.</p>
      </div>

      <div className="glass rounded-2xl border border-border p-16 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-400/10 border border-green-400/20 flex items-center justify-center mb-6">
          <span className="text-3xl">📝</span>
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Módulo em Configuração</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          O módulo de respostas NPS estará disponível assim que as pesquisas forem configuradas.
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
