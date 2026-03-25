import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Circle, ClipboardList, Loader2, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type EvalTarget = { userId: number; name: string; relation: string };

const RELATION_LABELS: Record<string, string> = {
  self: "Autoavaliação",
  same_area: "Mesma Área (12 critérios)",
  other_area: "Convivência (3 critérios)",
  leadership: "Liderança (7 critérios)",
  bottom_up: "Avaliação do Líder (12 critérios)",
};

const RELATION_COLORS: Record<string, string> = {
  self: "bg-violet-50 border-violet-200 text-violet-700",
  same_area: "bg-blue-50 border-blue-200 text-blue-700",
  other_area: "bg-emerald-50 border-emerald-200 text-emerald-700",
  leadership: "bg-amber-50 border-amber-200 text-amber-700",
  bottom_up: "bg-rose-50 border-rose-200 text-rose-700",
};

// Priority order for display grouping
const RELATION_ORDER = ["self", "same_area", "leadership", "bottom_up", "other_area"];

type GroupedTarget = {
  userId: number;
  name: string;
  evaluations: EvalTarget[];
};

function groupTargets(targets: EvalTarget[]): GroupedTarget[] {
  const map = new Map<number, GroupedTarget>();
  for (const t of targets) {
    if (!map.has(t.userId)) {
      map.set(t.userId, { userId: t.userId, name: t.name, evaluations: [] });
    }
    map.get(t.userId)!.evaluations.push(t);
  }
  // Sort evaluations within each group by priority
  Array.from(map.values()).forEach((group) => {
    group.evaluations.sort((a: EvalTarget, b: EvalTarget) => RELATION_ORDER.indexOf(a.relation) - RELATION_ORDER.indexOf(b.relation));
  });
  // Sort groups: self first, then by first relation priority, then alphabetically
  return Array.from(map.values()).sort((a: GroupedTarget, b: GroupedTarget) => {
    const aFirst = a.evaluations[0]?.relation || "";
    const bFirst = b.evaluations[0]?.relation || "";
    if (aFirst === "self") return -1;
    if (bFirst === "self") return 1;
    const aIdx = RELATION_ORDER.indexOf(aFirst);
    const bIdx = RELATION_ORDER.indexOf(bFirst);
    if (aIdx !== bIdx) return aIdx - bIdx;
    return a.name.localeCompare(b.name, "pt-BR");
  });
}

export default function Evaluations() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const { data: pendingData, isLoading, refetch } = trpc.evaluations.myPending.useQuery(undefined, { enabled: !!user });
  const { data: cycleData } = trpc.cycles.current.useQuery(undefined, { enabled: !!user });
  const [selectedTarget, setSelectedTarget] = useState<EvalTarget | null>(null);

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pending = pendingData?.pending || [];
  const completed = pendingData?.completed || [];
  const groupedPending = groupTargets(pending);
  const groupedCompleted = groupTargets(completed);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Avaliações</h1>
        <p className="text-muted-foreground mt-1">
          {pendingData ? `${pendingData.done} de ${pendingData.total} avaliações realizadas` : "Carregando..."}
        </p>
      </div>

      {/* Pending */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Circle className="h-4 w-4 text-amber-500" />
            Pendentes ({pending.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {groupedPending.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Todas as avaliações foram realizadas!</p>
          ) : (
            <div className="space-y-2">
              {groupedPending.map((group) => (
                <div key={group.userId} className="rounded-lg border overflow-hidden">
                  <div className="flex items-center gap-3 p-3 bg-muted/30">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">
                      {group.name.charAt(0)}
                    </div>
                    <p className="text-sm font-medium">
                      {group.evaluations[0]?.relation === "self" ? "Eu mesmo" : group.name}
                    </p>
                  </div>
                  <div className="divide-y">
                    {group.evaluations.map((t) => (
                      <button
                        key={`${t.userId}_${t.relation}`}
                        onClick={() => setSelectedTarget(t)}
                        className="w-full flex items-center justify-between px-3 py-2.5 pl-14 hover:bg-accent/50 transition-colors text-left"
                      >
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${RELATION_COLORS[t.relation] || "bg-gray-50"}`}>
                          {RELATION_LABELS[t.relation] || t.relation}
                        </span>
                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed */}
      {groupedCompleted.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Realizadas ({completed.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {groupedCompleted.map((group) => (
                <div key={group.userId} className="rounded-lg border bg-green-50/50 overflow-hidden">
                  <div className="flex items-center gap-3 p-3">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-medium text-green-700 shrink-0">
                      {group.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {group.evaluations[0]?.relation === "self" ? "Eu mesmo" : group.name}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {group.evaluations.map((t) => (
                          <span
                            key={`${t.userId}_${t.relation}`}
                            className={`text-xs px-2 py-0.5 rounded-full border ${RELATION_COLORS[t.relation] || "bg-gray-50"}`}
                          >
                            {RELATION_LABELS[t.relation] || t.relation}
                          </span>
                        ))}
                      </div>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evaluation Form Dialog */}
      {selectedTarget && cycleData && (
        <EvalFormDialog
          target={selectedTarget}
          cycleId={cycleData.id}
          onClose={() => setSelectedTarget(null)}
          onSuccess={() => {
            setSelectedTarget(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function EvalFormDialog({
  target,
  cycleId,
  onClose,
  onSuccess,
}: {
  target: EvalTarget;
  cycleId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const formInput = useMemo(() => ({
    cycleId,
    evaluateeId: target.userId,
    relation: target.relation as any,
  }), [cycleId, target.userId, target.relation]);

  const { data: formData, isLoading } = trpc.evaluations.getForm.useQuery(formInput);
  const submitMutation = trpc.evaluations.submit.useMutation({
    onSuccess: () => {
      toast.success("Avaliação enviada com sucesso!");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const [scores, setScores] = useState<Record<number, number>>({});
  const [justifications, setJustifications] = useState<Record<number, string>>({});

  // Initialize from existing data
  useEffect(() => {
    if (formData?.existingItems) {
      const s: Record<number, number> = {};
      const j: Record<number, string> = {};
      for (const item of formData.existingItems as any[]) {
        s[item.criteriaId] = item.score;
        j[item.criteriaId] = item.justification || "";
      }
      setScores(s);
      setJustifications(j);
    } else if (formData?.criteria) {
      const s: Record<number, number> = {};
      for (const c of formData.criteria) {
        s[c.id] = 10;
      }
      setScores(s);
    }
  }, [formData]);

  const handleSubmit = useCallback((isDraft: boolean) => {
    if (!formData?.criteria) return;
    const items = formData.criteria.map((c) => ({
      criteriaId: c.id,
      score: scores[c.id] ?? 10,
      justification: justifications[c.id] || null,
    }));
    submitMutation.mutate({
      cycleId,
      evaluateeId: target.userId,
      relation: target.relation as any,
      items,
      isDraft,
    });
  }, [formData, scores, justifications, cycleId, target, submitMutation]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Avaliar: {target.relation === "self" ? "Autoavaliação" : target.name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {RELATION_LABELS[target.relation]} — Nota padrão: 10. Notas diferentes de 10 exigem justificativa.
          </p>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6 mt-2">
            {formData?.criteria?.map((c) => {
              const score = scores[c.id] ?? 10;
              const needsJustification = score !== 10;
              return (
                <div key={c.id} className="space-y-3 p-4 rounded-lg border bg-card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <Label className="text-sm font-medium">{c.name}</Label>
                      {c.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-lg font-bold tabular-nums w-10 text-center">{score}</span>
                    </div>
                  </div>
                  <Slider
                    value={[score]}
                    onValueChange={([val]) => setScores((prev) => ({ ...prev, [c.id]: val }))}
                    min={0}
                    max={10}
                    step={0.5}
                    className="mt-1"
                  />
                  {needsJustification && (
                    <div className="mt-2">
                      <Label className="text-xs text-amber-600">Justificativa obrigatória (mín. 15 caracteres)</Label>
                      <Textarea
                        value={justifications[c.id] || ""}
                        onChange={(e) => setJustifications((prev) => ({ ...prev, [c.id]: e.target.value }))}
                        placeholder="Descreva com exemplos concretos..."
                        className="mt-1 text-sm"
                        rows={2}
                      />
                      {(justifications[c.id]?.length || 0) < 15 && (
                        <p className="text-xs text-destructive mt-1">
                          {15 - (justifications[c.id]?.length || 0)} caracteres restantes
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="flex gap-3 pt-2 border-t">
              <Button variant="outline" onClick={() => handleSubmit(true)} disabled={submitMutation.isPending}>
                Salvar Rascunho
              </Button>
              <Button onClick={() => handleSubmit(false)} disabled={submitMutation.isPending} className="flex-1">
                {submitMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                <Send className="h-4 w-4 mr-2" />
                Enviar Avaliação
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
