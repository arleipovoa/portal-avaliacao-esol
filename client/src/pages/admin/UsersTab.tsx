import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Loader2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EditUserForm } from "./EditUserForm";

export function UsersTab() {
  const { data: allUsers, isLoading, refetch } = trpc.users.listAll.useQuery();
  const { data: allAreas } = trpc.areas.list.useQuery();
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);

  const createMutation = trpc.users.create.useMutation({
    onSuccess: () => { toast.success("Colaborador criado!"); setShowCreate(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.users.update.useMutation({
    onSuccess: () => { toast.success("Atualizado!"); setEditUser(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const resetPwMutation = trpc.users.resetPassword.useMutation({
    onSuccess: () => toast.success("Senha resetada!"),
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({ name: "", email: "", password: "esol2026", appRole: "employee" as string, areaId: "", leaderId: "" });

  const leaders = allUsers?.filter((u) => u.appRole === "leader" || u.appRole === "admin") || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Colaboradores</h2>
        <Button onClick={() => { setForm({ name: "", email: "", password: "esol2026", appRole: "employee", areaId: "", leaderId: "" }); setShowCreate(true); }} size="sm">
          <UserPlus className="h-4 w-4 mr-2" />Novo Colaborador
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Nome</th>
                <th className="text-left p-3 font-medium">E-mail</th>
                <th className="text-left p-3 font-medium">Perfil</th>
                <th className="text-left p-3 font-medium">Área</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {allUsers?.map((u) => (
                <tr key={u.id} className={`border-t ${u.status === "inactive" ? "opacity-50" : ""}`}>
                  <td className="p-3">{u.name}</td>
                  <td className="p-3 text-muted-foreground">{u.email}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      u.appRole === "admin" ? "bg-red-50 text-red-700 border-red-200" :
                      u.appRole === "leader" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      "bg-blue-50 text-blue-700 border-blue-200"
                    }`}>
                      {u.appRole === "admin" ? "Admin" : u.appRole === "leader" ? "Líder" : "Colaborador"}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    <span>{allAreas?.find((a) => a.id === u.areaId)?.name || "—"}</span>
                    {(u as any).secondaryAreaId && (
                      <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">
                        +{allAreas?.find((a) => a.id === (u as any).secondaryAreaId)?.name || "2º setor"}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {u.status === "active" ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditUser(u)}>Editar</Button>
                    <Button variant="ghost" size="sm" onClick={() => {
                      if (confirm("Resetar senha para 'esol2026'?")) {
                        resetPwMutation.mutate({ id: u.id, newPassword: "esol2026" });
                      }
                    }}>Reset Senha</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Colaborador</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Senha Inicial</Label>
              <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select value={form.appRole} onValueChange={(v) => setForm({ ...form, appRole: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Colaborador</SelectItem>
                  <SelectItem value="leader">Líder</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Área</Label>
              <Select value={form.areaId} onValueChange={(v) => setForm({ ...form, areaId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {allAreas?.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Líder Direto</Label>
              <Select value={form.leaderId} onValueChange={(v) => setForm({ ...form, leaderId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {leaders.map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => createMutation.mutate({
                name: form.name, email: form.email, password: form.password,
                appRole: form.appRole as any,
                areaId: form.areaId ? Number(form.areaId) : undefined,
                leaderId: form.leaderId ? Number(form.leaderId) : undefined,
              })}
              disabled={createMutation.isPending}
              className="w-full"
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Criar Colaborador
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {editUser && (
        <Dialog open onOpenChange={() => setEditUser(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar: {editUser.name}</DialogTitle></DialogHeader>
            <EditUserForm
              user={editUser}
              areas={allAreas || []}
              leaders={leaders}
              onSave={(data: any) => updateMutation.mutate(data)}
              isPending={updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
