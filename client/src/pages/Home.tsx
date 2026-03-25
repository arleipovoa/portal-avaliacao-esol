import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { RADAR_CATEGORIES } from "@shared/types";
import { Award, BarChart3, DollarSign, Loader2, Target, TrendingUp, Trophy } from "lucide-react";
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Olá, {user.name?.split(" ")[0] || "Colaborador"}!
        </h1>
        <p className="text-muted-foreground mt-1">
          {data?.cycle ? `Ciclo de avaliação: ${monthLabel}` : "Nenhum ciclo ativo no momento."}
        </p>
      </div>

      {/* Eval Progress */}
      {data?.evalProgress && data.evalProgress.total > 0 && (
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <span className="font-medium">Avaliações Realizadas</span>
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
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avaliação Global</p>
                <p className="text-xl font-bold">
                  {data?.currentAggregate ? Number(data.currentAggregate.avaliacaoGlobal).toFixed(1) : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Bônus Parcial (Mês)</p>
                <p className="text-xl font-bold">
                  {data?.currentAggregate ? formatCurrency(Number(data.currentAggregate.totalBonus)) : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Acumulado no Ano</p>
                <p className="text-xl font-bold">
                  {formatCurrency(data?.annualBonus ?? 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ranking Anual</p>
                <p className="text-xl font-bold">
                  {data?.myAnnualPosition ? `${data.myAnnualPosition}º` : "—"}
                  {data?.annualRankingTotal ? <span className="text-sm font-normal text-muted-foreground"> / {data.annualRankingTotal}</span> : null}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Radar + Podium */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Meu Desempenho por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis
                    dataKey="category"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 10]}
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    tickCount={6}
                  />
                  <Radar
                    name="Nota"
                    dataKey="value"
                    stroke="#ffcc29"
                    fill="#ffcc29"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                  <Tooltip
                    formatter={(value: number) => [value.toFixed(1), "Nota"]}
                    contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
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
              <Trophy className="h-4 w-4" />
              Pódio do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.monthlyPodium && data.monthlyPodium.length > 0 ? (
              <div className="space-y-3 mt-2">
                {data.monthlyPodium.map((p, idx) => {
                  const medals = ["🥇", "🥈", "🥉"];
                  const bgColors = ["bg-amber-50 border-amber-200", "bg-gray-50 border-gray-200", "bg-orange-50 border-orange-200"];
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-4 rounded-lg border ${bgColors[idx]}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{medals[idx]}</span>
                        <div>
                          <p className="font-semibold text-sm">{p.position}º Lugar</p>
                          <p className="text-xs text-muted-foreground">
                            360: {Number(p.nota360).toFixed(1)} | Liderança: {Number(p.notaLideranca).toFixed(1)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{Number(p.avaliacaoGlobal).toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">Global</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <Trophy className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">Pódio ainda não calculado para este mês.</p>
              </div>
            )}

            {/* Bonus breakdown */}
            {data?.currentAggregate && (
              <div className="mt-6 pt-4 border-t space-y-2">
                <h4 className="text-sm font-medium mb-3">Detalhamento do Bônus</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pontualidade</span>
                  <span className="font-medium">{formatCurrency(Number(data.currentAggregate.bonusPontualidade))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Desempenho</span>
                  <span className="font-medium">{formatCurrency(Number(data.currentAggregate.bonusDesempenho))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pódio</span>
                  <span className="font-medium">{formatCurrency(Number(data.currentAggregate.bonusPodio))}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                  <span>Total</span>
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
