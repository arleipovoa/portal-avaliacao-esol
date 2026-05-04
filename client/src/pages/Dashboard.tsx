import React from 'react';
import { useLocation } from 'wouter';
import { cn, formatDate, formatCurrency } from '../lib/utils';
import Header from '../components/layout/Header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import Loader from '../components/ui/Loader';
import { trpc } from '@/lib/trpc';
import {
  Target,
  HardHat,
  Star,
  Trophy,
  ArrowRight,
  CalendarDots,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';

interface ModuleConfig {
  id: string;
  title: string;
  description: string;
  icon: Icon;
  color: 'orange' | 'blue' | 'green' | 'purple';
  route: string;
  stats: { label: string; value: string | number }[];
  action: string;
  span: 'half' | 'full';
}

const colorMap = {
  orange: 'border-primary/20 hover:border-primary/40',
  blue: 'border-blue-500/20 hover:border-blue-500/40',
  green: 'border-emerald-500/20 hover:border-emerald-500/40',
  purple: 'border-violet-500/20 hover:border-violet-500/40',
};

const iconBgMap = {
  orange: 'bg-primary/10 text-primary',
  blue: 'bg-blue-500/10 text-blue-500 dark:text-blue-400',
  green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  purple: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
};

const Dashboard: React.FC = () => {
  const [, navigate] = useLocation();
  const { data: stats, isLoading } = trpc.dashboard.publicStats.useQuery();
  const { data: cycle } = trpc.cycles.current.useQuery();

  const cycleLabel = cycle?.monthYear
    ? new Date(cycle.monthYear + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : '—';

  const modules: ModuleConfig[] = [
    {
      id: '360',
      title: 'Avaliação 360',
      description: 'Avaliação de desempenho e comportamento',
      icon: Target,
      color: 'orange',
      route: '/360/dashboard',
      stats: [
        { label: 'Ciclo Ativo', value: cycleLabel },
        { label: 'Colaboradores', value: stats?.activeCollaborators ?? '—' },
        { label: 'Ciclos Fechados', value: stats?.closedCycles ?? '—' },
      ],
      action: 'Iniciar Avaliação',
      span: 'half',
    },
    {
      id: 'obras',
      title: 'Avaliação de Obras',
      description: 'Avaliação da equipe em projetos de instalação',
      icon: HardHat,
      color: 'blue',
      route: '/obras/dashboard',
      stats: [
        { label: 'Empresas', value: stats?.companies ?? '—' },
        { label: 'Módulo', value: 'Por Obra' },
        { label: 'Bônus', value: 'Por kWp' },
      ],
      action: 'Gerenciar Obras',
      span: 'half',
    },
    {
      id: 'nps',
      title: 'Portal NPS',
      description: 'Pesquisa de satisfação do cliente',
      icon: Star,
      color: 'green',
      route: '/nps/dashboard',
      stats: [
        { label: 'Tipo', value: 'Escala 0-10' },
        { label: 'Ciclo', value: 'Contínuo' },
        { label: 'Status', value: 'Em breve' },
      ],
      action: 'Ver Resultados',
      span: 'half',
    },
    {
      id: 'bonus',
      title: 'Bônus & Rankings',
      description: 'Resumo de bonificações e pódio mensal',
      icon: Trophy,
      color: 'purple',
      route: '/360/dashboard',
      stats: [
        { label: 'Bônus Total (ano)', value: stats?.totalBonus ? formatCurrency(stats.totalBonus) : '—' },
        { label: 'Avaliações', value: stats?.totalEvaluations ?? '—' },
        { label: 'Pódio', value: 'Mensal' },
      ],
      action: 'Ver Dashboard',
      span: 'full',
    },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Dashboard"
        subtitle="Bem-vindo ao Portal de Avaliações E-sol"
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Dashboard' }]}
        actions={
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <CalendarDots size={14} weight="duotone" />
              {formatDate(new Date())}
            </div>
          </div>
        }
      />

      <div className="flex-1">
        {isLoading ? (
          <Loader variant="spinner" size="lg" message="Carregando dados..." />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 auto-rows-max">
            {modules.map((module) => {
              const IconComp = module.icon;
              return (
                <div
                  key={module.id}
                  className={cn('col-span-1', module.span === 'full' && 'lg:col-span-2')}
                >
                  <Card
                    className={cn(
                      'cursor-pointer border transition-all duration-300 hover:shadow-lg',
                      colorMap[module.color]
                    )}
                    onClick={() => navigate(module.route)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconBgMap[module.color])}>
                              <IconComp size={20} weight="duotone" />
                            </div>
                            <div>
                              <CardTitle>{module.title}</CardTitle>
                              <CardDescription>{module.description}</CardDescription>
                            </div>
                          </div>
                        </div>
                        <div className="inline-flex items-center rounded-full border border-border bg-card px-2 py-1 text-[10px] font-medium text-muted-foreground">
                          Ativo
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-border">
                        {module.stats.map((stat, i) => (
                          <div key={i} className="space-y-1">
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                            <p className="text-lg font-semibold text-foreground">{stat.value}</p>
                          </div>
                        ))}
                      </div>
                      <button className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors">
                        {module.action}
                        <ArrowRight size={16} />
                      </button>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
