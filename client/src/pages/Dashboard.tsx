import React from 'react';
import { useLocation } from 'wouter';
import { cn, formatDate, formatCurrency } from '../lib/utils';
import Header from '../components/layout/Header';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/FluxCard';
import Button from '../components/ui/FluxButton';
import Badge from '../components/ui/FluxBadge';
import Loader from '../components/ui/Loader';
import { trpc } from '@/lib/trpc';

const colorMap = {
  orange: 'border-flux-orange/20 bg-flux-orange/5',
  blue:   'border-blue-500/20 bg-blue-500/5',
  green:  'border-green-500/20 bg-green-500/5',
  purple: 'border-purple-500/20 bg-purple-500/5',
};

const iconColorMap = {
  orange: 'text-flux-orange',
  blue:   'text-blue-400',
  green:  'text-green-400',
  purple: 'text-purple-400',
};

const Dashboard: React.FC = () => {
  const [, navigate] = useLocation();
  const { data: stats, isLoading } = trpc.dashboard.publicStats.useQuery();
  const { data: cycle } = trpc.cycles.current.useQuery();

  const cycleLabel = cycle?.monthYear
    ? new Date(cycle.monthYear + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : '—';

  const modules = [
    {
      id: '360',
      title: 'Avaliação 360°',
      description: 'Avaliação de desempenho e comportamento',
      icon: 'solar:chart-2-bold-duotone',
      color: 'orange' as const,
      route: '/360/dashboard',
      stats: [
        { label: 'Ciclo Ativo',   value: cycleLabel },
        { label: 'Colaboradores', value: stats?.activeCollaborators ?? '—' },
        { label: 'Ciclos Fechados', value: stats?.closedCycles ?? '—' },
      ],
      action: 'Iniciar Avaliação',
      span: 'half' as const,
    },
    {
      id: 'obras',
      title: 'Avaliação de Obras',
      description: 'Avaliação da equipe em projetos de instalação',
      icon: 'solar:hammer-bold-duotone',
      color: 'blue' as const,
      route: '/obras/dashboard',
      stats: [
        { label: 'Empresas',  value: stats?.companies ?? '—' },
        { label: 'Módulo',    value: 'Por Obra' },
        { label: 'Bônus',     value: 'Por kWp' },
      ],
      action: 'Gerenciar Obras',
      span: 'half' as const,
    },
    {
      id: 'nps',
      title: 'Portal NPS',
      description: 'Pesquisa de satisfação do cliente',
      icon: 'solar:star-bold-duotone',
      color: 'green' as const,
      route: '/nps/dashboard',
      stats: [
        { label: 'Tipo',    value: 'Escala 0-10' },
        { label: 'Ciclo',   value: 'Contínuo' },
        { label: 'Status',  value: 'Em breve' },
      ],
      action: 'Ver Resultados',
      span: 'half' as const,
    },
    {
      id: 'bonus',
      title: 'Bônus & Rankings',
      description: 'Resumo de bonificações e pódio mensal',
      icon: 'solar:medal-ribbon-bold-duotone',
      color: 'purple' as const,
      route: '/360/dashboard',
      stats: [
        { label: 'Bônus Total (ano)', value: stats?.totalBonus ? formatCurrency(stats.totalBonus) : '—' },
        { label: 'Avaliações',        value: stats?.totalEvaluations ?? '—' },
        { label: 'Pódio',             value: 'Mensal' },
      ],
      action: 'Ver Dashboard',
      span: 'full' as const,
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
            <Badge variant="info" icon="solar:calendar-bold-duotone">
              {formatDate(new Date())}
            </Badge>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-8">
        {isLoading ? (
          <Loader variant="spinner" size="lg" message="Carregando dados..." />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 auto-rows-max">
            {modules.map((module) => (
              <div
                key={module.id}
                className={cn('col-span-1', module.span === 'full' && 'lg:col-span-2')}
              >
                <Card
                  variant="glass"
                  size="lg"
                  interactive
                  onClick={() => navigate(module.route)}
                  className={cn('cursor-pointer border transition-all duration-300 hover:border-opacity-100', colorMap[module.color])}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <iconify-icon icon={module.icon} width={24} className={iconColorMap[module.color]} />
                          <CardTitle className="text-white">{module.title}</CardTitle>
                        </div>
                        <CardDescription className="text-slate-400">{module.description}</CardDescription>
                      </div>
                      <Badge variant={module.color as any} size="sm">Ativo</Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-white/5">
                      {module.stats.map((stat, i) => (
                        <div key={i} className="space-y-1">
                          <p className="text-xs text-slate-500 uppercase tracking-wide">{stat.label}</p>
                          <p className="text-lg font-semibold text-white">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="primary" size="md" fullWidth
                      rightIcon={<iconify-icon icon="solar:arrow-right-bold-duotone" width={16} />}
                    >
                      {module.action}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
