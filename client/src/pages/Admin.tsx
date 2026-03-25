import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  Building2, Calculator, DollarSign, Loader2, Plus, RefreshCw,
  Settings, UserPlus, Users, Calendar, TrendingUp, Award,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Admin() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });

  if (!user || (user as any).appRole !== "admin") {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso restrito a administradores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Administração</h1>
        <p className="text-muted-foreground mt-1">Gerencie áreas, colaboradores, ciclos e bonificações.</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="users">Colaboradores</TabsTrigger>
          <TabsTrigger value="areas">Áreas</TabsTrigger>
          <TabsTrigger value="cycles">Ciclos</TabsTrigger>
          <TabsTrigger value="calculate">Cálculos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><OverviewTab /></TabsContent>
        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="areas"><AreasTab /></TabsContent>
        <TabsContent value="cycles"><CyclesTab /></TabsContent>
        <TabsContent value="calculate"><CalculateTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Overview Tab ───
function OverviewTab() {
  const { data: cycleData } = trpc.cycles.current.useQuery();
  const { data: bonusData, isLoading } = trpc.admin.bonusSummary.useQuery(
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

      {/* Bonus Breakdown */}
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

// ─── Users Tab ───
function UsersTab() {
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

      {/* Create Dialog */}
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

      {/* Edit Dialog */}
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

function EditUserForm({ user, areas, leaders, onSave, isPending }: any) {
  const [form, setForm] = useState({
    name: user.name || "",
    email: user.email || "",
    appRole: user.appRole,
    areaId: user.areaId ? String(user.areaId) : "",
    leaderId: user.leaderId ? String(user.leaderId) : "",
    secondaryAreaId: user.secondaryAreaId ? String(user.secondaryAreaId) : "",
    secondaryLeaderId: user.secondaryLeaderId ? String(user.secondaryLeaderId) : "",
    status: user.status,
  });

  const hasSecondary = form.secondaryAreaId !== "" || form.secondaryLeaderId !== "";

  return (
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

      {/* Setor Primário */}
      <div className="rounded-lg border p-3 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Setor Primário</p>
        <div className="space-y-2">
          <Label>Área</Label>
          <Select value={form.areaId} onValueChange={(v) => setForm({ ...form, areaId: v })}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {areas.map((a: any) => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Líder Direto</Label>
          <Select value={form.leaderId} onValueChange={(v) => setForm({ ...form, leaderId: v })}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">— Nenhum —</SelectItem>
              {leaders.map((l: any) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Setor Secundário */}
      <div className="rounded-lg border border-dashed p-3 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Setor Secundário <span className="normal-case font-normal">(opcional)</span></p>
          {hasSecondary && (
            <button
              type="button"
              className="text-xs text-destructive hover:underline"
              onClick={() => setForm({ ...form, secondaryAreaId: "", secondaryLeaderId: "" })}
            >
              Remover
            </button>
          )}
        </div>
        <div className="space-y-2">
          <Label>Área Secundária</Label>
          <Select value={form.secondaryAreaId} onValueChange={(v) => setForm({ ...form, secondaryAreaId: v })}>
            <SelectTrigger><SelectValue placeholder="Não atribuído" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">— Nenhuma —</SelectItem>
              {areas
                .filter((a: any) => String(a.id) !== form.areaId)
                .map((a: any) => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Líder no Setor Secundário</Label>
          <Select value={form.secondaryLeaderId} onValueChange={(v) => setForm({ ...form, secondaryLeaderId: v })}>
            <SelectTrigger><SelectValue placeholder="Não atribuído" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">— Nenhum —</SelectItem>
              {leaders.map((l: any) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {!hasSecondary && (
          <p className="text-xs text-muted-foreground">
            Preencha quando o colaborador atuar em dois setores simultaneamente.
            Ele será avaliado por ambos os líderes e avaliará os colegas de ambas as áreas.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        onClick={() => onSave({
          id: user.id, name: form.name, email: form.email,
          appRole: form.appRole as any,
          areaId: form.areaId ? Number(form.areaId) : null,
          leaderId: form.leaderId ? Number(form.leaderId) : null,
          secondaryAreaId: form.secondaryAreaId ? Number(form.secondaryAreaId) : null,
          secondaryLeaderId: form.secondaryLeaderId ? Number(form.secondaryLeaderId) : null,
          status: form.status as any,
        })}
        disabled={isPending}
        className="w-full"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Salvar Alterações
      </Button>
    </div>
  );
}

// ─── Areas Tab ───
function AreasTab() {
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

// ─── Cycles Tab ───
function CyclesTab() {
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

// ─── Calculate Tab ───
function CalculateTab() {
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

      {/* Podium */}
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

      {/* Aggregates Table */}
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
