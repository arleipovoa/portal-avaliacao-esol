import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Building2, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function AreasTab() {
  const { data: allAreas, isLoading, refetch } = trpc.areas.listAll.useQuery();
  const { data: allUsers } = trpc.users.list.useQuery();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", companyName: "", leaderId: "" });

  const createMutation = trpc.areas.create.useMutation({
    onSuccess: () => { toast.success("Área criada!"); setShowCreate(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.areas.update.useMutation({
    onSuccess: () => { toast.success("Atualizado!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const leaders = allUsers?.filter((u) => u.appRole === "leader" || u.appRole === "admin") || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Áreas / Empresas</h2>
        <Button onClick={() => { setForm({ name: "", companyName: "", leaderId: "" }); setShowCreate(true); }} size="sm">
          <Plus className="h-4 w-4 mr-2" />Nova Área
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allAreas?.map((area) => {
            const leader = allUsers?.find((u) => u.id === area.leaderId);
            const members = allUsers?.filter((u) => u.areaId === area.id) || [];
            return (
              <Card key={area.id} className={area.status === "inactive" ? "opacity-50" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {area.name}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateMutation.mutate({
                        id: area.id,
                        status: area.status === "active" ? "inactive" : "active",
                      })}
                    >
                      {area.status === "active" ? "Desativar" : "Ativar"}
                    </Button>
                  </div>
                  {area.companyName && <p className="text-xs text-muted-foreground">{area.companyName}</p>}
                </CardHeader>
                <CardContent>
                  <p className="text-sm"><strong>Líder:</strong> {leader?.name || "—"}</p>
                  <p className="text-sm text-muted-foreground mt-1">{members.length} membro(s)</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Área</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Área</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="Ex: E-sol Engenharia" />
            </div>
            <div className="space-y-2">
              <Label>Líder</Label>
              <Select value={form.leaderId} onValueChange={(v) => setForm({ ...form, leaderId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {leaders.map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => createMutation.mutate({
                name: form.name, companyName: form.companyName || undefined,
                leaderId: form.leaderId ? Number(form.leaderId) : undefined,
              })}
              disabled={createMutation.isPending}
              className="w-full"
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Criar Área
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
