import React, { useState } from 'react';
import { cn, getScoreBadge, formatPercentage } from '../lib/utils';
import Header from '../components/layout/Header';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/FluxCard';
import Button from '../components/ui/FluxButton';
import Badge from '../components/ui/FluxBadge';
import Input, { Textarea, Select } from '../components/ui/FluxInput';
import Loader from '../components/ui/Loader';

interface Criterion {
  id: string;
  name: string;
  description: string;
  category: 'base' | 'detailed' | 'leadership';
  weight: number;
}

interface EvaluationForm {
  evaluatedId: string;
  relationshipType: 'self' | 'same_area' | 'other_area' | 'bottom_up' | 'leadership';
  scores: Record<string, number>;
  comments: string;
}

const Evaluation360: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<EvaluationForm>({
    evaluatedId: '',
    relationshipType: 'same_area',
    scores: {},
    comments: '',
  });
  const [submitted, setSubmitted] = useState(false);

  // Mock criteria data
  const criteria: Criterion[] = [
    {
      id: 'base_1',
      name: 'Comunicação',
      description: 'Clareza e efetividade na comunicação',
      category: 'base',
      weight: 1,
    },
    {
      id: 'base_2',
      name: 'Colaboração',
      description: 'Trabalho em equipe e cooperação',
      category: 'base',
      weight: 1,
    },
    {
      id: 'base_3',
      name: 'Respeito',
      description: 'Respeito com colegas e processos',
      category: 'base',
      weight: 1,
    },
    {
      id: 'detailed_1',
      name: 'Entrega',
      description: 'Qualidade das entregas realizadas',
      category: 'detailed',
      weight: 2,
    },
    {
      id: 'detailed_2',
      name: 'Prazos',
      description: 'Cumprimento de prazos estabelecidos',
      category: 'detailed',
      weight: 2,
    },
  ];

  const categoryLabels = {
    base: 'Base 360',
    detailed: 'Avaliação Detalhada',
    leadership: 'Liderança',
  };

  const handleScoreChange = (criterionId: string, score: number) => {
    setForm(prev => ({
      ...prev,
      scores: { ...prev.scores, [criterionId]: score },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  const calculateAverageScore = () => {
    const scores = Object.values(form.scores);
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const averageScore = calculateAverageScore();
  const scoreBadge = getScoreBadge(averageScore);

  if (submitted) {
    return (
      <div className="flex-1 flex flex-col">
        <Header title="Avaliação 360°" subtitle="Avaliação de Desempenho" />
        <div className="flex-1 flex items-center justify-center p-8">
          <Card variant="glass" size="lg" className="max-w-md text-center">
            <CardContent className="space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                <iconify-icon icon="solar:check-circle-bold-duotone" width={32} className="text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Avaliação Enviada!
                </h3>
                <p className="text-slate-400">
                  Sua avaliação foi registrada com sucesso no sistema.
                </p>
              </div>
              <Button variant="primary" fullWidth>
                Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <Header
        title="Avaliação 360°"
        subtitle="Avaliação de Desempenho e Comportamento"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Avaliação 360°' },
        ]}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {loading ? (
          <Loader variant="spinner" size="lg" message="Processando avaliação..." />
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Form Card */}
            <Card variant="glass" size="lg">
              <CardHeader>
                <CardTitle>Informações da Avaliação</CardTitle>
                <CardDescription>
                  Preencha os dados abaixo para realizar a avaliação
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSubmit} className="space-y-6">
                <CardContent className="space-y-6">
                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Pessoa a Avaliar"
                      options={[
                        { value: 'user_1', label: 'João Silva' },
                        { value: 'user_2', label: 'Maria Santos' },
                        { value: 'user_3', label: 'Pedro Costa' },
                      ]}
                      value={form.evaluatedId}
                      onChange={(e) => setForm(prev => ({ ...prev, evaluatedId: e.target.value }))}
                      required
                    />
                    <Select
                      label="Tipo de Relação"
                      options={[
                        { value: 'self', label: 'Autoavaliação' },
                        { value: 'same_area', label: 'Colega do Setor' },
                        { value: 'other_area', label: 'Colega de Outro Setor' },
                        { value: 'bottom_up', label: 'Subordinado' },
                        { value: 'leadership', label: 'Liderança' },
                      ]}
                      value={form.relationshipType}
                      onChange={(e) => setForm(prev => ({ ...prev, relationshipType: e.target.value as any }))}
                      required
                    />
                  </div>
                </CardContent>

                {/* Criteria Scoring */}
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Critérios de Avaliação</h3>
                    <div className="space-y-4">
                      {Object.entries(
                        criteria.reduce((acc, c) => {
                          if (!acc[c.category]) acc[c.category] = [];
                          acc[c.category].push(c);
                          return acc;
                        }, {} as Record<string, Criterion[]>)
                      ).map(([category, items]) => (
                        <div key={category} className="space-y-3">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                              {categoryLabels[category as keyof typeof categoryLabels]}
                            </h4>
                            <div className="flex-1 h-px bg-white/5" />
                          </div>
                          {items.map((criterion) => (
                            <div key={criterion.id} className="glass rounded-lg p-4 space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-white">{criterion.name}</p>
                                  <p className="text-sm text-slate-400">{criterion.description}</p>
                                </div>
                                <Badge variant="secondary" size="sm">
                                  Peso: {criterion.weight}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="5"
                                  value={form.scores[criterion.id] || 0}
                                  onChange={(e) => handleScoreChange(criterion.id, parseInt(e.target.value))}
                                  className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-flux-orange"
                                />
                                <span className="text-sm font-semibold text-flux-orange min-w-12 text-right">
                                  {form.scores[criterion.id] || 0}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>

                {/* Comments */}
                <CardContent>
                  <Textarea
                    label="Comentários Adicionais"
                    placeholder="Adicione comentários sobre a avaliação..."
                    value={form.comments}
                    onChange={(e) => setForm(prev => ({ ...prev, comments: e.target.value }))}
                    rows={4}
                  />
                </CardContent>

                {/* Score Summary */}
                <CardContent className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Pontuação Média</p>
                      <p className="text-3xl font-bold text-white">{averageScore}%</p>
                    </div>
                    <div className={cn('px-4 py-2 rounded-lg border', scoreBadge.color)}>
                      <p className="text-sm font-semibold">{scoreBadge.text}</p>
                    </div>
                  </div>
                </CardContent>

                {/* Actions */}
                <CardFooter className="gap-3 justify-end">
                  <Button variant="ghost">
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    isLoading={loading}
                    rightIcon={
                      <iconify-icon icon="solar:send-bold-duotone" width={16} />
                    }
                  >
                    Enviar Avaliação
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Evaluation360;

