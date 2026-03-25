import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EvalFormDialog } from "@/components/EvalFormDialog";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Circle, ClipboardList, Loader2 } from "lucide-react";
import { useState } from "react";

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



