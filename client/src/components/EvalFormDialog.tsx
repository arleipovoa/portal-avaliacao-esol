import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ClipboardList, Loader2, Send } from "lucide-react";
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

type EvalFormDialogProps = {
  target: EvalTarget;
  cycleId: number;
  onClose: () => void;
  onSuccess: () => void;
};

export function EvalFormDialog({ target, cycleId, onClose, onSuccess }: EvalFormDialogProps) {
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
