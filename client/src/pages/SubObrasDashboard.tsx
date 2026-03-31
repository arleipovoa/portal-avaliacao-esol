import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2, Plus, Search, AlertTriangle, Clock, Zap,
  ExternalLink, Camera, FileText,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export function getClassification(score: number): { color: "green" | "blue" | "yellow" | "red", label: string } {
  if (score >= 90) return { color: "green", label: "Excelente" };
  if (score >= 75) return { color: "blue", label: "Bom" };
  if (score >= 60) return { color: "yellow", label: "Regular" };
  return { color: "red", label: "Crítico" };
}

export default function SubObrasDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const projects = trpc.projects.list.useQuery();
  const isAdmin = user?.role === "admin" || user?.appRole === "admin" || user?.appRole === "leader"; // Adjusted for app roles
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const filtered = useMemo(() => {
    if (!projects.data) return [];
    const q = search.toLowerCase();
    return projects.data.filter(
      (p: any) => p.code.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q)
    );
  }, [projects.data, search]);

  if (projects.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[#b8930d]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#12110f] tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffcc29]/15 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#b8930d]" strokeWidth={1.5} />
            </div>
            Obras
          </h1>
          <p className="text-sm text-[#666666] mt-1 ml-[52px]">
            {projects.data?.length ?? 0} obras cadastradas
          </p>
        </div>
        {isAdmin && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="bg-[#ffcc29] text-[#12110f] hover:bg-[#e6b800] font-semibold shadow-sm">
                <Plus className="w-4 h-4 mr-2" strokeWidth={2} /> Nova Obra
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <CreateProjectForm
                onSuccess={() => {
                  setShowCreate(false);
                  projects.refetch();
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" strokeWidth={1.5} />
        <Input
          placeholder="Buscar por código ou cliente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 border-[#e5e5e5] focus:border-[#ffcc29] focus:ring-[#ffcc29]/20"
        />
      </div>

      {/* Project List */}
      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#faf9f7] flex items-center justify-center mx-auto mb-4">
                <Zap className="w-7 h-7 text-[#cccccc]" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-[#666666]">
                {search ? "Nenhuma obra encontrada." : "Nenhuma obra cadastrada."}
              </p>
              {!search && isAdmin && (
                <Button
                  className="mt-3 bg-[#ffcc29] text-[#12110f] hover:bg-[#e6b800] font-semibold"
                  size="sm"
                  onClick={() => setShowCreate(true)}
                >
                  Cadastrar Obra
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filtered.map((project: any) => {
            const score = project.projectScore ? parseFloat(project.projectScore) : null;
            const classification = score !== null ? getClassification(score) : null;
            const expectedDays = project.expectedDaysOverride || (1 + Math.ceil((project.moduleCount || 0) / 10));
            const isDelayed = project.actualDays && expectedDays && project.actualDays > expectedDays && !project.forceMajeureJustification;

            return (
              <Card
                key={project.id}
                className="border-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group overflow-hidden"
                onClick={() => setLocation(`/modulo-obras/avaliacoes`)}
              >
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#ffcc29]/10 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-[#b8930d]" strokeWidth={1.5} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#12110f]">{project.code}</span>
                          {project.hasFinancialLoss && (
                            <Badge variant="destructive" className="text-[10px]">
                              <AlertTriangle className="w-3 h-3 mr-0.5" strokeWidth={1.5} /> Prejuízo
                            </Badge>
                          )}
                          {isDelayed && (
                            <Badge variant="secondary" className="text-[10px] bg-orange-50 text-orange-700 border-orange-200">
                              <Clock className="w-3 h-3 mr-0.5" strokeWidth={1.5} /> Atraso
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-[#666666]">{project.clientName}</p>
                        {/* Photos link - visible to all users */}
                        {project.photosLink && (
                          <a
                            href={project.photosLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 mt-0.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Camera className="w-3 h-3" strokeWidth={1.5} /> Ver fotos da obra
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-right">
                      <div className="hidden sm:block">
                        <p className="text-[10px] text-[#999999] uppercase tracking-wider">Potência</p>
                        <p className="font-mono font-medium text-[#12110f]">{parseFloat(project.powerKwp || 0).toFixed(1)} kWp</p>
                      </div>
                      <div className="hidden md:block">
                        <p className="text-[10px] text-[#999999] uppercase tracking-wider">Prazo</p>
                        <p className={`font-mono font-medium ${isDelayed ? "text-red-600" : "text-[#12110f]"}`}>
                          {project.actualDays ?? "—"}/{expectedDays ?? "—"}d
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#999999] uppercase tracking-wider">Nota</p>
                        {classification ? (
                          <Badge
                            variant="secondary"
                            className={`font-mono ${
                              classification.color === "green" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              classification.color === "blue" ? "bg-blue-50 text-blue-700 border-blue-200" :
                              classification.color === "yellow" ? "bg-amber-50 text-amber-700 border-amber-200" :
                              "bg-red-50 text-red-700 border-red-200"
                            }`}
                          >
                            {score!.toFixed(0)}
                          </Badge>
                        ) : (
                          <span className="text-[#cccccc]">—</span>
                        )}
                      </div>
                      {isAdmin && (
                        <div className="hidden lg:block">
                          <p className="text-[10px] text-[#999999] uppercase tracking-wider">Valor</p>
                          <p className="font-mono font-medium">
                            {project.hasFinancialLoss
                              ? <span className="text-red-600">R$ 0</span>
                              : project.correctedValue
                                ? <span className="text-[#12110f]">R$ {parseFloat(project.correctedValue).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</span>
                                : <span className="text-[#12110f]">R$ {parseFloat(project.baseValue || 0).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</span>}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="h-0.5 bg-gradient-to-r from-[#ffcc29] to-[#ffcc29]/10 group-hover:to-[#ffcc29] transition-all duration-500" />
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function CreateProjectForm({ onSuccess }: { onSuccess: () => void }) {
  const createProject = trpc.projects.create.useMutation();

  const [form, setForm] = useState({
    code: "",
    clientName: "",
    moduleCount: "",
    modulePower: "585",
    completionDate: "",
    paymentMonth: "",
    actualDays: "",
    expectedDaysOverride: "",
    hasFinancialLoss: false,
    financialLossReason: "",
    forceMajeureJustification: "",
    photosLink: "",
    reportLink: "",
    nps: "",
  });

  const moduleCount = parseInt(form.moduleCount) || 0;
  const modulePower = parseInt(form.modulePower) || 585;
  const powerKwp = (moduleCount * modulePower) / 1000;

  const expectedDaysQuery = trpc.projects.calculateExpectedDays.useQuery(
    { moduleCount },
    { enabled: moduleCount > 0 }
  );
  const expectedDays = form.expectedDaysOverride
    ? parseInt(form.expectedDaysOverride)
    : expectedDaysQuery.data?.expectedDays ?? 0;

  const handleSubmit = async () => {
    if (!form.code || !form.clientName || moduleCount <= 0) {
      toast.error("Preencha código, cliente e quantidade de módulos.");
      return;
    }
    try {
      await createProject.mutateAsync({
        code: form.code,
        clientName: form.clientName,
        moduleCount,
        modulePower,
        powerKwp,
        completionDate: form.completionDate || undefined,
        paymentMonth: form.paymentMonth || undefined,
        actualDays: form.actualDays ? parseInt(form.actualDays) : undefined,
        expectedDaysOverride: form.expectedDaysOverride ? parseInt(form.expectedDaysOverride) : undefined,
        hasFinancialLoss: form.hasFinancialLoss,
        financialLossReason: form.financialLossReason || undefined,
        forceMajeureJustification: form.forceMajeureJustification || undefined,
        photosLink: form.photosLink || undefined,
        reportLink: form.reportLink || undefined,
        nps: form.nps || undefined,
      });
      toast.success("Obra criada com sucesso!");
      onSuccess();
    } catch (err) {
      toast.error("Erro ao criar obra.");
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-[#12110f] font-extrabold">Nova Obra</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-semibold text-[#666666] uppercase tracking-wider">Código *</Label>
            <Input placeholder="P001" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} className="border-[#e5e5e5] focus:border-[#ffcc29]" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-[#666666] uppercase tracking-wider">Cliente *</Label>
            <Input placeholder="Nome do cliente" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} className="border-[#e5e5e5] focus:border-[#ffcc29]" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs font-semibold text-[#666666] uppercase tracking-wider">Módulos *</Label>
            <Input type="number" placeholder="12" value={form.moduleCount} onChange={e => setForm(f => ({ ...f, moduleCount: e.target.value }))} className="border-[#e5e5e5] focus:border-[#ffcc29]" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-[#666666] uppercase tracking-wider">Potência Módulo (W)</Label>
            <Input type="number" value={form.modulePower} onChange={e => setForm(f => ({ ...f, modulePower: e.target.value }))} className="border-[#e5e5e5] focus:border-[#ffcc29]" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-[#666666] uppercase tracking-wider">Potência Total</Label>
            <Input value={`${powerKwp.toFixed(2)} kWp`} disabled className="bg-[#faf9f7] border-[#e5e5e5] font-mono" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs font-semibold text-[#666666] uppercase tracking-wider">Prazo Esperado</Label>
            <Input
              type="number"
              placeholder={expectedDays > 0 ? `Auto: ${expectedDays}` : "—"}
              value={form.expectedDaysOverride}
              onChange={e => setForm(f => ({ ...f, expectedDaysOverride: e.target.value }))}
              className="border-[#e5e5e5] focus:border-[#ffcc29]"
            />
            {expectedDays > 0 && !form.expectedDaysOverride && (
              <p className="text-[10px] text-[#b8930d] mt-0.5 font-mono">Auto: {expectedDays} dias</p>
            )}
          </div>
          <div>
            <Label className="text-xs font-semibold text-[#666666] uppercase tracking-wider">Dias Reais</Label>
            <Input type="number" placeholder="—" value={form.actualDays} onChange={e => setForm(f => ({ ...f, actualDays: e.target.value }))} className="border-[#e5e5e5] focus:border-[#ffcc29]" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-[#666666] uppercase tracking-wider">Data Conclusão</Label>
            <Input type="date" value={form.completionDate} onChange={e => setForm(f => ({ ...f, completionDate: e.target.value }))} className="border-[#e5e5e5] focus:border-[#ffcc29]" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-semibold text-[#666666] uppercase tracking-wider">Mês Pagamento</Label>
            <Input placeholder="Ex: 2026-03" value={form.paymentMonth} onChange={e => setForm(f => ({ ...f, paymentMonth: e.target.value }))} className="border-[#e5e5e5] focus:border-[#ffcc29]" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-[#666666] uppercase tracking-wider">NPS do Cliente</Label>
            <Input type="number" placeholder="0 a 10" min="0" max="10" step="0.1" value={form.nps} onChange={e => setForm(f => ({ ...f, nps: e.target.value }))} className="border-[#e5e5e5] focus:border-[#ffcc29]" />
          </div>
        </div>

        {/* Photos Link */}
        <div>
          <Label className="text-xs font-semibold text-[#666666] uppercase tracking-wider flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" strokeWidth={1.5} /> Link das Fotos (Google Drive)
          </Label>
          <Input
            placeholder="https://drive.google.com/drive/folders/..."
            value={form.photosLink}
            onChange={e => setForm(f => ({ ...f, photosLink: e.target.value }))}
            className="border-[#e5e5e5] focus:border-[#ffcc29]"
          />
          <p className="text-[10px] text-[#999999] mt-0.5">Link público para que instaladores possam ver as fotos da obra.</p>
        </div>

        {/* Report Link */}
        <div>
          <Label className="text-xs font-semibold text-[#666666] uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" strokeWidth={1.5} /> Link do Relatório
          </Label>
          <Input
            placeholder="https://drive.google.com/file/..."
            value={form.reportLink}
            onChange={e => setForm(f => ({ ...f, reportLink: e.target.value }))}
            className="border-[#e5e5e5] focus:border-[#ffcc29]"
          />
          <p className="text-[10px] text-[#999999] mt-0.5">Link público para o relatório da obra.</p>
        </div>

        <div>
          <Label className="text-xs font-semibold text-[#666666] uppercase tracking-wider">Justificativa Força Maior</Label>
          <Textarea
            placeholder="Se houver atraso por motivo de força maior (chuva, etc.), descreva aqui..."
            value={form.forceMajeureJustification}
            onChange={e => setForm(f => ({ ...f, forceMajeureJustification: e.target.value }))}
            className="border-[#e5e5e5] focus:border-[#ffcc29]"
          />
          <p className="text-[10px] text-[#b8930d] mt-0.5">Se preenchido, o fator de prazo será 1.00 (sem penalização).</p>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50/50 border border-red-100">
          <Switch
            checked={form.hasFinancialLoss}
            onCheckedChange={v => setForm(f => ({ ...f, hasFinancialLoss: v }))}
          />
          <div>
            <Label className="text-red-700 font-semibold text-sm">Prejuízo Financeiro / Remoção da Premiação</Label>
            <p className="text-[10px] text-red-500">Ao ativar, a bonificação desta obra será zerada.</p>
          </div>
        </div>

        {form.hasFinancialLoss && (
          <div>
            <Label className="text-xs font-semibold text-[#666666] uppercase tracking-wider">Motivo do Prejuízo</Label>
            <Textarea
              placeholder="Descreva o prejuízo (ex: placa quebrada durante instalação)"
              value={form.financialLossReason}
              onChange={e => setForm(f => ({ ...f, financialLossReason: e.target.value }))}
              className="border-[#e5e5e5] focus:border-[#ffcc29]"
            />
          </div>
        )}
      </div>
      <DialogFooter>
        <Button
          onClick={handleSubmit}
          disabled={createProject.isPending}
          className="bg-[#ffcc29] text-[#12110f] hover:bg-[#e6b800] font-semibold"
        >
          {createProject.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Criar Obra
        </Button>
      </DialogFooter>
    </>
  );
}
