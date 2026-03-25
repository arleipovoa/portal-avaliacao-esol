import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Calendar, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function CyclesTab() {
  const { data: allCycles, isLoading, refetch } = trpc.cycles.list.useQuery();
  const [showCreate, setShowCreate] = useState(false);
  const [monthYear, setMonthYear] = useState("");

  const createMutation = trpc.cycles.create.useMutation({
    onSuccess: () => { toast.success("Ciclo criado!"); setShowCreate(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.cycles.update.useMutation({
    onSuccess: () => { toast.success("Atualizado!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Ciclos de Avaliação</h2>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />Novo Ciclo
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {allCycles?.map((cycle) => (
            <Card key={cycle.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">{cycle.monthYear}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        cycle.status === "open" ? "bg-green-50 text-green-700" :
                        cycle.status === "closed" ? "bg-amber-50 text-amber-700" :
                        "bg-blue-50 text-blue-700"
                      }`}>
                        {cycle.status === "open" ? "Aberto" : cycle.status === "closed" ? "Fechado" : "Publicado"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {cycle.status === "open" && (
                      <Button variant="outline" size="sm" onClick={() => updateMutation.mutate({ id: cycle.id, status: "closed" })}>
                        Fechar
                      </Button>
                    )}
                    {cycle.status === "closed" && (
                      <Button variant="outline" size="sm" onClick={() => updateMutation.mutate({ id: cycle.id, status: "published", publishDate: new Date() })}>
                        Publicar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Ciclo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Mês/Ano (YYYY-MM)</Label>
              <Input
                type="month"
                value={monthYear}
                onChange={(e) => setMonthYear(e.target.value)}
              />
            </div>
            <Button
              onClick={() => createMutation.mutate({ monthYear })}
              disabled={createMutation.isPending || !monthYear}
              className="w-full"
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Criar Ciclo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
