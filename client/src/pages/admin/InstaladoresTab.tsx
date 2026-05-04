import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { cn, formatDateBR } from "@/lib/utils";

export default function InstaladoresTab() {
  const [showInactive, setShowInactive] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);

  const utils = trpc.useUtils();
  const listQ = trpc.installers.list.useQuery({ includeInactive: showInactive });
  const createM = trpc.installers.create.useMutation({
    onSuccess: () => { utils.installers.list.invalidate(); setCreating(false); },
    onError: (e) => alert(e.message),
  });
  const updateM = trpc.installers.update.useMutation({
    onSuccess: () => { utils.installers.list.invalidate(); setEditing(null); },
    onError: (e) => alert(e.message),
  });
  const setStatusM = trpc.installers.setStatus.useMutation({
    onSuccess: () => utils.installers.list.invalidate(),
    onError: (e) => alert(e.message),
  });

  const list = listQ.data ?? [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-semibold text-flux-orange uppercase tracking-widest mb-1">Cadastros</p>
          <h1 className="text-2xl font-display font-semibold text-foreground">Instaladores</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie a equipe de instalação ativa e desativada.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="accent-flux-orange" />
            Mostrar inativos
          </label>
          <button onClick={() => setCreating(true)} className="px-5 py-2.5 bg-flux-orange text-void font-semibold text-sm rounded-lg hover:bg-flux-orange/90 transition-all">
            + Novo Instalador
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-foreground/5 overflow-hidden">
        <div className="grid grid-cols-12 px-4 py-2 text-[10px] text-muted-foreground uppercase tracking-wider font-medium border-b border-border">
          <div className="col-span-4">Nome</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Cargo</div>
          <div className="col-span-2">Admissão</div>
          <div className="col-span-1">Saída</div>
          <div className="col-span-1 text-right">Ações</div>
        </div>
        {listQ.isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Carregando...</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">Nenhum instalador cadastrado.</div>
        ) : (
          list.map((i: any) => (
            <div key={i.id} className="grid grid-cols-12 px-4 py-2.5 text-sm hover:bg-foreground/[0.02] border-b border-border/50 last:border-0">
              <div className="col-span-4 text-foreground font-medium">{i.name}</div>
              <div className="col-span-2">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-medium",
                  i.status === "active" ? "bg-green-500/15 text-green-400" : "bg-slate-500/15 text-slate-400"
                )}>
                  {i.status === "active" ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="col-span-2 text-muted-foreground">{i.role ?? "—"}</div>
              <div className="col-span-2 text-muted-foreground text-xs">{formatDateBR(i.hiredAt)}</div>
              <div className="col-span-1 text-muted-foreground text-xs">{formatDateBR(i.leftAt)}</div>
              <div className="col-span-1 flex items-center justify-end gap-2">
                <button onClick={() => setEditing(i)} title="Editar" className="text-muted-foreground hover:text-flux-orange text-xs">✏️</button>
                <button
                  onClick={() => setStatusM.mutate({ id: i.id, status: i.status === "active" ? "inactive" : "active" })}
                  title={i.status === "active" ? "Desativar" : "Reativar"}
                  className="text-muted-foreground hover:text-foreground text-xs"
                >{i.status === "active" ? "🔒" : "🔓"}</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal criar/editar */}
      {(creating || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setCreating(false); setEditing(null); }}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const data = {
                name: String(fd.get("name") || "").trim(),
                role: String(fd.get("role") || "").trim() || undefined,
                hiredAt: String(fd.get("hiredAt") || "") || undefined,
              };
              if (editing) {
                updateM.mutate({ id: editing.id, ...data });
              } else {
                createM.mutate(data);
              }
            }}
            className="rounded-2xl border border-border p-6 max-w-md w-full mx-4 bg-background/95"
          >
            <h2 className="text-foreground font-semibold mb-4">{editing ? `Editar ${editing.name}` : "Novo instalador"}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Nome*</label>
                <input name="name" required defaultValue={editing?.name ?? ""} className="w-full mt-1 bg-foreground/5 border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Cargo (opcional)</label>
                <input name="role" defaultValue={editing?.role ?? ""} placeholder="instalador" className="w-full mt-1 bg-foreground/5 border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Data de admissão (opcional)</label>
                <input name="hiredAt" type="date" defaultValue={editing?.hiredAt ? new Date(editing.hiredAt).toISOString().slice(0,10) : ""} className="w-full mt-1 bg-foreground/5 border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => { setCreating(false); setEditing(null); }} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancelar</button>
              <button type="submit" className="px-5 py-2 bg-flux-orange text-void font-semibold text-sm rounded-lg hover:bg-flux-orange/90">
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
