import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Calendar, DollarSign, TrendingUp, Users } from "lucide-react";

export function OverviewTab() {
  const { data: cycleData } = trpc.cycles.current.useQuery();
  const { data: bonusData } = trpc.admin.bonusSummary.useQuery(
    { cycleId: cycleData?.id },
    { enabled: !!cycleData }
  );
  const { data: allUsers } = trpc.users.list.useQuery();

  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Colaboradores Ativos</p>
                <p className="text-xl font-bold">{allUsers?.length ?? 0}</p>
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
                <p className="text-xs text-muted-foreground">Custo Mensal Total</p>
                <p className="text-xl font-bold">{bonusData?.monthly ? formatCurrency(bonusData.monthly.totalGeral) : "—"}</p>
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
                <p className="text-xs text-muted-foreground">Custo Anual Total</p>
                <p className="text-xl font-bold">{bonusData?.annual ? formatCurrency(bonusData.annual.totalGeral) : "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ciclo Atual</p>
                <p className="text-xl font-bold">{cycleData?.monthYear || "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {bonusData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Custos do Mês</CardTitle>
            </CardHeader>
            <CardContent>
              {bonusData.monthly ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pontualidade</span>
                    <span className="font-medium">{formatCurrency(bonusData.monthly.totalPontualidade)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Desempenho</span>
                    <span className="font-medium">{formatCurrency(bonusData.monthly.totalDesempenho)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pódio</span>
                    <span className="font-medium">{formatCurrency(bonusData.monthly.totalPodio)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(bonusData.monthly.totalGeral)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum cálculo realizado para o mês atual.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Custos Acumulados no Ano</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pontualidade</span>
                  <span className="font-medium">{formatCurrency(bonusData.annual.totalPontualidade)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Desempenho</span>
                  <span className="font-medium">{formatCurrency(bonusData.annual.totalDesempenho)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pódio</span>
                  <span className="font-medium">{formatCurrency(bonusData.annual.totalPodio)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(bonusData.annual.totalGeral)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
