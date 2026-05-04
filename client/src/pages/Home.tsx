import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { RADAR_CATEGORIES } from "@shared/types";
import {
  ChartLineUp,
  CurrencyDollar,
  TrendUp,
  Medal,
  Target,
  Trophy,
  SpinnerGap,
} from "@phosphor-icons/react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from "recharts";

export default function Home() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const { data, isLoading } = trpc.dashboard.myData.useQuery(undefined, { enabled: !!user });

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <SpinnerGap size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  const radarData = data?.currentAggregate?.radarData
    ? RADAR_CATEGORIES.map((cat) => ({
        category: cat.replace(" & ", "\n& "),
        value: Number((data.currentAggregate!.radarData as any)?.[cat] ?? 10),
        fullMark: 10,
      }))
    : RADAR_CATEGORIES.map((cat) => ({ category: cat.replace(" & ", "\n& "), value: 10, fullMark: 10 }));

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const monthLabel = data?.cycle?.monthYear
    ? new Date(data.cycle.monthYear + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : "Mês atual";

  const isDark = document.documentElement.classList.contains("dark");
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb";
  const labelColor = isDark ? "rgba(255,255,255,0.5)" : "#6b7280";
  const radarStroke = "#ffcc29";
  const radarFill = "#ffcc29";

  const kpis = [
    {
      icon: ChartLineUp,
      label: "Avaliação Global",
      value: data?.currentAggregate ? Number(data.currentAggregate.avaliacaoGlobal).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "—",
      color: "text-blue-500 dark:text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      icon: CurrencyDollar,
      label: "Bônus Parcial (Mês)",
      value: data?.currentAggregate ? formatCurrency(Number(data.currentAggregate.totalBonus)) : "—",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      icon: TrendUp,
      label: "Acumulado no Ano",
      value: formatCurrency(data?.annualBonus ?? 0),
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      icon: Medal,
      label: "Ranking Anual",
      value: data?.myAnnualPosition ? `${data.myAnnualPosition}º` : "—",
      suffix: data?.annualRankingTotal ? ` / ${data.annualRankingTotal}` : "",
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Ola, {user.name?.split(" ")[0] || "Colaborador"}!
        </h1>
        <p className="text-muted-foreground mt-1">
          {data?.cycle ? `Ciclo de avaliacao: ${monthLabel}` : "Nenhum ciclo ativo no momento."}
        </p>
      </div>

      {/* Eval Progress */}
      {data?.evalProgress && data.evalProgress.total > 0 && (
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target size={20} weight="duotone" className="text-primary" />
                <span className="font-medium text-foreground">Avaliacoes Realizadas</span>
              </div>
              <span className="text-sm font-semibold text-primary">
                {data.evalProgress.done}/{data.evalProgress.total} ({data.evalProgress.percent}%)
              </span>
            </div>
            <Progress value={data.evalProgress.percent} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const IconComp = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                    <IconComp size={20} weight="duotone" className={kpi.color} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <p className="text-xl font-bold text-foreground">
                      {kpi.value}
                      {"suffix" in kpi && kpi.suffix && (
                        <span className="text-sm font-normal text-muted-foreground">{kpi.suffix}</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Radar + Podium */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ChartLineUp size={18} weight="duotone" />
              Meu Desempenho por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke={gridColor} />
                  <PolarAngleAxis
                    dataKey="category"
                    tick={{ fontSize: 11, fill: labelColor }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 10]}
                    tick={{ fontSize: 10, fill: labelColor }}
                    tickCount={6}
                  />
                  <Radar
                    name="Nota"
                    dataKey="value"
                    stroke={radarStroke}
                    fill={radarFill}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }), "Nota"]}
                    contentStyle={{
                      borderRadius: "8px",
                      fontSize: "13px",
                      background: isDark ? "#1a1a2e" : "#fff",
                      border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e5e7eb",
                      color: isDark ? "#e5e7eb" : "#1f2937",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Podium */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy size={18} weight="duotone" />
              Pódio do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.monthlyPodium && data.monthlyPodium.length > 0 ? (
              <div className="space-y-3 mt-2">
                {data.monthlyPodium.map((p, idx) => {
                  const medals = ["🥇", "🥈", "🥉"];
                  const bgColors = [
                    "bg-amber-500/10 border-amber-500/20",
                    "bg-muted border-border",
                    "bg-orange-500/10 border-orange-500/20",
                  ];
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-4 rounded-lg border ${bgColors[idx]}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{medals[idx]}</span>
                        <div>
                          <p className="font-semibold text-sm text-foreground">{p.position}º Lugar</p>
                          <p className="text-xs text-muted-foreground">
                            360: {Number(p.nota360).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} | Liderança: {Number(p.notaLideranca).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">{Number(p.avaliacaoGlobal).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</p>
                        <p className="text-xs text-muted-foreground">Global</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <Trophy size={40} weight="duotone" className="mb-3 opacity-30" />
                <p className="text-sm">Pódio ainda não calculado para este mês.</p>
              </div>
            )}

            {/* Bonus breakdown */}
            {data?.currentAggregate && (
              <div className="mt-6 pt-4 border-t border-border space-y-2">
                <h4 className="text-sm font-medium text-foreground mb-3">Detalhamento do Bonus</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pontualidade</span>
                  <span className="font-medium text-foreground">{formatCurrency(Number(data.currentAggregate.bonusPontualidade))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Desempenho</span>
                  <span className="font-medium text-foreground">{formatCurrency(Number(data.currentAggregate.bonusDesempenho))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Podio</span>
                  <span className="font-medium text-foreground">{formatCurrency(Number(data.currentAggregate.bonusPodio))}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-2 border-t border-border">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary">{formatCurrency(Number(data.currentAggregate.totalBonus))}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
