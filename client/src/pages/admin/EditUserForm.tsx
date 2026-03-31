import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export function EditUserForm({ user, areas, leaders, onSave, isPending }: any) {
  const [form, setForm] = useState({
    name: user.name || "",
    email: user.email || "",
    appRole: user.appRole,
    jobCategory: user.jobCategory || "administrativo",
    areaId: user.areaId ? String(user.areaId) : "none",
    leaderId: user.leaderId ? String(user.leaderId) : "none",
    secondaryAreaId: user.secondaryAreaId ? String(user.secondaryAreaId) : "none",
    secondaryLeaderId: user.secondaryLeaderId ? String(user.secondaryLeaderId) : "none",
    status: user.status,
  });

  const hasSecondary = form.secondaryAreaId !== "none" || form.secondaryLeaderId !== "none";

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
      <div className="space-y-2">
        <Label>Categoria da Vaga (Libera Avaliação de Obras)</Label>
        <Select value={form.jobCategory} onValueChange={(v) => setForm({ ...form, jobCategory: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="administrativo">Administrativo (Apenas 360º)</SelectItem>
            <SelectItem value="operacional">Operacional (360º + Obras)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border p-3 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Setor Primário</p>
        <div className="space-y-2">
          <Label>Área</Label>
          <Select value={form.areaId} onValueChange={(v) => setForm({ ...form, areaId: v })}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Nenhuma —</SelectItem>
              {areas.map((a: any) => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Líder Direto</Label>
          <Select value={form.leaderId} onValueChange={(v) => setForm({ ...form, leaderId: v })}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Nenhum —</SelectItem>
              {leaders.map((l: any) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border border-dashed p-3 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Setor Secundário <span className="normal-case font-normal">(opcional)</span></p>
          {hasSecondary && (
            <button
              type="button"
              className="text-xs text-destructive hover:underline"
              onClick={() => setForm({ ...form, secondaryAreaId: "none", secondaryLeaderId: "none" })}
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
              <SelectItem value="none">— Nenhuma —</SelectItem>
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
              <SelectItem value="none">— Nenhum —</SelectItem>
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
          areaId: form.areaId !== "none" ? Number(form.areaId) : null,
          jobCategory: form.jobCategory as any,
          leaderId: form.leaderId !== "none" ? Number(form.leaderId) : null,
          secondaryAreaId: form.secondaryAreaId !== "none" ? Number(form.secondaryAreaId) : null,
          secondaryLeaderId: form.secondaryLeaderId !== "none" ? Number(form.secondaryLeaderId) : null,
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
