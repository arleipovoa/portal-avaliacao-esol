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
