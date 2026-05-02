import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

export default function VeiculosTab() {
  const [showInactive, setShowInactive] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);

  const utils = trpc.useUtils();
  const listQ = trpc.vehicles.list.useQuery({ includeInactive: showInactive });
  const createM = trpc.vehicles.create.useMutation({
    onSuccess: () => { utils.vehicles.list.invalidate(); setCreating(false); },
    onError: (e) => alert(e.message),
  });
  const updateM = trpc.vehicles.update.useMutation({
    onSuccess: () => { utils.vehicles.list.invalidate(); setEditing(null); },
    onError: (e) => alert(e.message),
  });
  const setStatusM = trpc.vehicles.setStatus.useMutation({
    onSuccess: () => utils.vehicles.list.invalidate(),
    onError: (e) => alert(e.message),
  });

  const list = listQ.data ?? [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-semibold text-flux-orange uppercase tracking-widest mb-1">Cadastros</p>
          <h1 className="text-2xl font-display font-semibold text-white">Veículos</h1>
          <p className="text-sm text-slate-400 mt-1">Frota da empresa usada nas instalações.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="accent-flux-orange" />
            Mostrar inativos
          </label>
          <button onClick={() => setCreating(true)} className="px-5 py-2.5 bg-flux-orange text-void font-semibold text-sm rounded-lg hover:bg-flux-orange/90 transition-all">
            + Novo Veículo
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-white/5 overflow-hidden">
        <div className="grid grid-cols-12 px-4 py-2 text-[10px] text-slate-500 uppercase tracking-wider font-medium border-b border-white/5">
          <div className="col-span-3">Identificador</div>
          <div className="col-span-3">Modelo</div>
          <div className="col-span-2">Placa</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>
        {listQ.isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Carregando...</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">Nenhum veículo cadastrado.</div>
        ) : (
          list.map((v: any) => (
            <div key={v.id} className="grid grid-cols-12 px-4 py-2.5 text-sm hover:bg-white/[0.02] border-b border-white/[0.02] last:border-0">
              <div className="col-span-3 text-white font-medium">{v.identifier}</div>
              <div className="col-span-3 text-slate-400">{v.model ?? "—"}</div>
              <div className="col-span-2 text-slate-500 font-mono text-xs">{v.plate ?? "—"}</div>
              <div className="col-span-2">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-medium",
                  v.status === "active" ? "bg-green-500/15 text-green-400" : "bg-slate-500/15 text-slate-400"
                )}>{v.status === "active" ? "Ativo" : "Inativo"}</span>
              </div>
              <div className="col-span-2 flex items-center justify-end gap-2">
                <button onClick={() => setEditing(v)} title="Editar" className="text-slate-400 hover:text-flux-orange text-xs">✏️</button>
                <button
                  onClick={() => setStatusM.mutate({ id: v.id, status: v.status === "active" ? "inactive" : "active" })}
                  title={v.status === "active" ? "Desativar" : "Reativar"}
                  className="text-slate-400 hover:text-white text-xs"
                >{v.status === "active" ? "🔒" : "🔓"}</button>
              </div>
            </div>
          ))
        )}
      </div>

      {(creating || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setCreating(false); setEditing(null); }}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const data = {
                identifier: String(fd.get("identifier") || "").trim(),
                model: String(fd.get("model") || "").trim() || undefined,
                plate: String(fd.get("plate") || "").trim() || undefined,
                notes: String(fd.get("notes") || "").trim() || undefined,
              };
              if (editing) {
                updateM.mutate({ id: editing.id, ...data });
              } else {
                createM.mutate(data);
              }
            }}
            className="rounded-2xl border border-white/10 p-6 max-w-md w-full mx-4 bg-void/95"
          >
            <h2 className="text-white font-semibold mb-4">{editing ? `Editar ${editing.identifier}` : "Novo veículo"}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Identificador*</label>
                <input name="identifier" required defaultValue={editing?.identifier ?? ""} placeholder="L200 01" className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Modelo</label>
                <input name="model" defaultValue={editing?.model ?? ""} placeholder="Mitsubishi L200" className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Placa</label>
                <input name="plate" defaultValue={editing?.plate ?? ""} placeholder="ABC-1234" className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Observações</label>
                <textarea name="notes" defaultValue={editing?.notes ?? ""} rows={2} className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => { setCreating(false); setEditing(null); }} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancelar</button>
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
