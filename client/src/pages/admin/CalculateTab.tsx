import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Award, Calculator, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function CalculateTab() {
  const { data: cycleData } = trpc.cycles.current.useQuery();
  const { data: allCycles } = trpc.cycles.list.useQuery();
  const [selectedCycle, setSelectedCycle] = useState<string>("");

  const cycleId = selectedCycle ? Number(selectedCycle) : cycleData?.id;

  const calculateMutation = trpc.admin.calculate.useMutation({
    onSuccess: (data) => toast.success(`Cálculos realizados para ${data.calculated} colaboradores!`),
    onError: (e) => toast.error(e.message),
  });

  const { data: aggregates, refetch } = trpc.admin.aggregates.useQuery(
    { cycleId: cycleId! },
    { enabled: !!cycleId }
  );

  const { data: podiumData } = trpc.admin.podium.useQuery(
    { cycleId: cycleId! },
    { enabled: !!cycleId }
  );

  const { data: allUsers } = trpc.users.list.useQuery();

  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select value={selectedCycle || String(cycleData?.id || "")} onValueChange={setSelectedCycle}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Selecione o ciclo" /></SelectTrigger>
          <SelectContent>
            {allCycles?.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.monthYear}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button
          onClick={() => { if (cycleId) calculateMutation.mutate({ cycleId }); }}
          disabled={calculateMutation.isPending || !cycleId}
        >
          {calculateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Calculator className="h-4 w-4 mr-2" />}
          Calcular Notas e Bônus
        </Button>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />Atualizar
        </Button>
      </div>

      {podiumData && podiumData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4" />Pódio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {podiumData.map((p) => {
                const user = allUsers?.find((u) => u.id === p.userId);
                const medals = ["🥇", "🥈", "🥉"];
                return (
                  <div key={p.position} className="flex-1 text-center p-4 rounded-lg border bg-card">
                    <span className="text-3xl">{medals[p.position - 1]}</span>
                    <p className="font-semibold mt-2">{user?.name || "—"}</p>
                    <p className="text-lg font-bold text-primary">{Number(p.avaliacaoGlobal).toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">+{formatCurrency(Number(p.prize))}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {aggregates && aggregates.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resultados Detalhados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2 font-medium">Colaborador</th>
                    <th className="text-center p-2 font-medium">360</th>
                    <th className="text-center p-2 font-medium">Liderança</th>
                    <th className="text-center p-2 font-medium">Global</th>
                    <th className="text-right p-2 font-medium">Pont.</th>
                    <th className="text-right p-2 font-medium">Desemp.</th>
                    <th className="text-right p-2 font-medium">Pódio</th>
                    <th className="text-right p-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregates.map((a) => {
                    const user = allUsers?.find((u) => u.id === a.userId);
                    return (
                      <tr key={a.id} className="border-t">
                        <td className="p-2">{user?.name || `ID ${a.userId}`}</td>
                        <td className="p-2 text-center">{Number(a.nota360).toFixed(1)}</td>
                        <td className="p-2 text-center">{Number(a.notaLideranca).toFixed(1)}</td>
                        <td className="p-2 text-center font-semibold">{Number(a.avaliacaoGlobal).toFixed(1)}</td>
                        <td className="p-2 text-right">{formatCurrency(Number(a.bonusPontualidade))}</td>
                        <td className="p-2 text-right">{formatCurrency(Number(a.bonusDesempenho))}</td>
                        <td className="p-2 text-right">{formatCurrency(Number(a.bonusPodio))}</td>
                        <td className="p-2 text-right font-semibold">{formatCurrency(Number(a.totalBonus))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
