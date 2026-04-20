import React, { useState } from 'react';
import { cn, getModuleIcon, formatDate, formatCurrency } from '../lib/utils';
import Header from '../components/layout/Header';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/FluxCard';
import Button from '../components/ui/FluxButton';
import Badge from '../components/ui/FluxBadge';
import Loader from '../components/ui/Loader';

interface DashboardModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: 'orange' | 'blue' | 'green' | 'purple';
  stats: { label: string; value: string | number }[];
  action: string;
  span?: 'full' | 'half' | 'third';
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  // Mock data - replace with API calls
  const modules: DashboardModule[] = [
    {
      id: '360',
      title: 'Avaliação 360°',
      description: 'Avaliação de desempenho e comportamento',
      icon: 'solar:chart-2-bold-duotone',
      color: 'orange',
      stats: [
        { label: 'Ciclo Ativo', value: 'Março 2026' },
        { label: 'Avaliações', value: '24/45' },
        { label: 'Taxa Conclusão', value: '53%' },
      ],
      action: 'Iniciar Avaliação',
      span: 'half',
    },
    {
      id: 'obras',
      title: 'Avaliação de Obras',
      description: 'Avaliação da Equipe em projetos',
      icon: 'solar:hammer-bold-duotone',
      color: 'blue',
      stats: [
        { label: 'Projetos Ativos', value: '8' },
        { label: 'Avaliações Pendentes', value: '12' },
        { label: 'Taxa Conclusão', value: '67%' },
      ],
      action: 'Gerenciar Obras',
      span: 'half',
    },
    {
      id: 'nps',
      title: 'Portal NPS',
      description: 'Pesquisa de satisfação do cliente',
      icon: 'solar:star-bold-duotone',
      color: 'green',
      stats: [
        { label: 'NPS Score', value: '72' },
        { label: 'Respostas', value: '156/200' },
        { label: 'Tendência', value: '+5 pts' },
      ],
      action: 'Ver Resultados',
      span: 'half',
    },
    {
      id: 'podium',
      title: 'Pódio & Rankings',
      description: 'Ranking de desempenho mensal',
      icon: 'solar:medal-ribbon-bold-duotone',
      color: 'purple',
      stats: [
        { label: '1º Lugar', value: 'João Silva' },
        { label: '2º Lugar', value: 'Maria Santos' },
        { label: '3º Lugar', value: 'Pedro Costa' },
      ],
      action: 'Ver Ranking',
      span: 'full',
    },
  ];

  const colorMap = {
    orange: 'border-flux-orange/20 bg-flux-orange/5',
    blue: 'border-blue-500/20 bg-blue-500/5',
    green: 'border-green-500/20 bg-green-500/5',
    purple: 'border-purple-500/20 bg-purple-500/5',
  };

  const iconColorMap = {
    orange: 'text-flux-orange',
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
  };

  const handleModuleClick = (moduleId: string) => {
    setSelectedModule(moduleId);
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <Header
        title="Dashboard"
        subtitle="Bem-vindo ao Portal de Avaliações E-sol"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Dashboard' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Badge variant="info" icon="solar:calendar-bold-duotone">
              {formatDate(new Date())}
            </Badge>
            <Button variant="ghost" size="sm">
              <iconify-icon icon="solar:bell-bold-duotone" width={20} />
            </Button>
          </div>
        }
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {loading ? (
          <Loader variant="spinner" size="lg" message="Carregando módulo..." />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 auto-rows-max">
            {modules.map((module) => (
              <div
                key={module.id}
                className={cn(
                  'col-span-1',
                  module.span === 'full' && 'lg:col-span-2',
                  module.span === 'third' && 'lg:col-span-1'
                )}
              >
                <Card
                  variant="glass"
                  size="lg"
                  interactive
                  onClick={() => handleModuleClick(module.id)}
                  className={cn(
                    'cursor-pointer border transition-all duration-300 hover:border-opacity-100',
                    colorMap[module.color]
                  )}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <iconify-icon
                            icon={module.icon}
                            width={24}
                            className={iconColorMap[module.color]}
                          />
                          <CardTitle className="text-white">
                            {module.title}
                          </CardTitle>
                        </div>
                        <CardDescription className="text-slate-400">
                          {module.description}
                        </CardDescription>
                      </div>
                      <Badge variant={module.color as any} size="sm">
                        Ativo
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-white/5">
                      {module.stats.map((stat, index) => (
                        <div key={index} className="space-y-1">
                          <p className="text-xs text-slate-500 uppercase tracking-wide">
                            {stat.label}
                          </p>
                          <p className="text-lg font-semibold text-white">
                            {stat.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Action Button */}
                    <Button
                      variant="primary"
                      size="md"
                      fullWidth
                      rightIcon={
                        <iconify-icon icon="solar:arrow-right-bold-duotone" width={16} />
                      }
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

