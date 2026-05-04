import { useState, useMemo, useEffect } from 'react';
import { useSearch } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { cn, formatCurrency, formatNota } from '@/lib/utils';
import {
  ShieldCheck,
  GearSix,
  Sparkle,
  ClipboardText,
  Star,
  CurrencyDollar,
  FolderOpen,
  ArrowSquareOut,
  Warning,
  CheckCircle,
  SpinnerGap,
  CaretDown,
  CaretRight,
  ArrowLeft,
  Prohibit,
  Info,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';

const BONUS_MAP: Record<string, number> = {
  B1: 200, B2: 300, B3: 500, B4: 750, B5: 1000, B6: 1500, B7: 2000,
};

const CAT_CFG: Record<string, { label: string; icon: Icon; colorClass: string; bgClass: string; borderClass: string; weight: number; trackColor: string }> = {
  seguranca:      { label: 'Segurança',     icon: ShieldCheck,   colorClass: 'text-red-600 dark:text-red-400',    bgClass: 'bg-red-500/10',    borderClass: 'border-red-500/20',    weight: 2, trackColor: '#f87171' },
  funcionalidade: { label: 'Funcionalidade', icon: GearSix,       colorClass: 'text-blue-600 dark:text-blue-400',  bgClass: 'bg-blue-500/10',   borderClass: 'border-blue-500/20',   weight: 2, trackColor: '#60a5fa' },
  estetica:       { label: 'Estética',      icon: Sparkle,       colorClass: 'text-violet-600 dark:text-violet-400', bgClass: 'bg-violet-500/10', borderClass: 'border-violet-500/20', weight: 1, trackColor: '#c084fc' },
};

type CatKey = keyof typeof CAT_CFG;
type Entry = { score: number; obs: string; na: boolean };

function scoreColorClass(v: number) {
  if (v >= 8) return 'text-emerald-600 dark:text-emerald-400';
  if (v >= 6) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function scoreBgClass(v: number) {
  if (v >= 8) return 'bg-emerald-500/10 border-emerald-500/20';
  if (v >= 6) return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-red-500/10 border-red-500/20';
}

function trackColorFor(v: number) {
  if (v >= 8) return '#4ade80';
  if (v >= 6) return '#f97316';
  return '#f87171';
}

function avg(vals: (number | null)[]): number | null {
  const valid = vals.filter((v): v is number => v !== null);
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
}

// ── Score Input ──
function ScoreInput({ value, disabled, onChange }: {
  value: number; disabled?: boolean; onChange: (v: number) => void;
}) {
  const clamped = Math.min(10, Math.max(0, value));
  const pct = (clamped / 10) * 100;
  const fill = trackColorFor(clamped);

  return (
    <div className={cn('space-y-2', disabled && 'opacity-30 pointer-events-none select-none')}>
      <div className="flex items-center gap-3">
        <button type="button"
          onClick={() => onChange(Math.max(0, Math.round((clamped - 0.5) * 2) / 2))}
          className="w-8 h-8 shrink-0 rounded-full bg-muted border border-border text-muted-foreground hover:bg-accent flex items-center justify-center text-base font-bold transition-all"
        >-</button>
        <input
          type="number" min={0} max={10} step={0.5} value={clamped}
          onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(Math.min(10, Math.max(0, v))); }}
          className={cn(
            'w-20 text-center text-2xl font-bold font-mono rounded-lg border px-1 py-1 bg-transparent',
            'focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors',
            '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
            scoreColorClass(clamped), scoreBgClass(clamped),
          )}
        />
        <button type="button"
          onClick={() => onChange(Math.min(10, Math.round((clamped + 0.5) * 2) / 2))}
          className="w-8 h-8 shrink-0 rounded-full bg-muted border border-border text-muted-foreground hover:bg-accent flex items-center justify-center text-base font-bold transition-all"
        >+</button>
        <span className="text-xs font-mono text-muted-foreground">/ 10</span>
      </div>
      <input
        type="range" min={0} max={10} step={0.5} value={clamped}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={cn(
          'w-full h-2 rounded-full cursor-pointer appearance-none',
          '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5',
          '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground',
          '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background',
          '[&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer',
          '[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110',
          '[&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full',
          '[&::-moz-range-thumb]:bg-foreground [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background',
          '[&::-moz-range-thumb]:cursor-pointer',
        )}
        style={{ background: `linear-gradient(to right, ${fill} ${pct}%, var(--color-muted) ${pct}%)` }}
      />
    </div>
  );
}

// ── Criterion Card ──
function CriterionCard({ criterion, entry, onScore, onObs, onNa, colorClass }: {
  criterion: { id: number; name: string; description?: string };
  entry: Entry;
  onScore: (v: number) => void; onObs: (v: string) => void; onNa: (v: boolean) => void;
  colorClass: string;
}) {
  const [showObs, setShowObs] = useState(false);
  return (
    <div className={cn(
      'rounded-xl border bg-card p-4 transition-all space-y-3',
      entry.na ? 'border-border opacity-60' : 'border-border hover:border-primary/20',
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={cn('text-sm font-semibold', entry.na ? 'text-muted-foreground' : colorClass)}>{criterion.name}</p>
          {criterion.description && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{criterion.description}</p>
          )}
        </div>
        <button type="button" onClick={() => onNa(!entry.na)}
          className={cn(
            'shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all inline-flex items-center gap-1',
            entry.na
              ? 'bg-muted border-border text-muted-foreground hover:border-foreground/20'
              : 'bg-card border-border text-muted-foreground hover:border-foreground/20',
          )}
        >
          {entry.na && <Prohibit size={12} />}
          {entry.na ? 'Nao avaliado' : 'Nao avaliado'}
        </button>
      </div>

      {entry.na ? (
        <p className="text-xs text-muted-foreground italic">Item excluido da media desta categoria</p>
      ) : (
        <ScoreInput value={entry.score} onChange={onScore} />
      )}

      {!entry.na ? (
        <div>
          <button type="button" onClick={() => setShowObs(v => !v)}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            {showObs ? <CaretDown size={10} /> : <CaretRight size={10} />}
            {entry.obs
              ? <span className="text-primary">Observacao registrada</span>
              : 'Adicionar observacao'}
          </button>
          {showObs && (
            <textarea value={entry.obs} onChange={e => onObs(e.target.value)} rows={2}
              placeholder="Descreva o que foi observado neste criterio..."
              className="mt-2 w-full text-xs bg-muted border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
            />
          )}
        </div>
      ) : (
        <textarea value={entry.obs} onChange={e => onObs(e.target.value)} rows={1}
          placeholder="Motivo pelo qual nao foi possivel avaliar..."
          className="w-full text-xs bg-muted border border-border rounded-lg px-3 py-2 text-muted-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-border resize-none"
        />
      )}
    </div>
  );
}

// ── Simple Score Section ──
function SimpleScoreSection({ label, description, value, obs, na, onValue, onObs, onNa, colorClass, obsPlaceholder }: {
  label: string; description?: string;
  value: number; obs: string; na: boolean;
  onValue: (v: number) => void; onObs: (v: string) => void; onNa: (v: boolean) => void;
  colorClass: string; obsPlaceholder: string;
}) {
  return (
    <div className={cn(
      'rounded-xl border bg-card p-4 transition-all space-y-3',
      na ? 'border-border opacity-60' : 'border-border hover:border-primary/20',
    )}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={cn('text-sm font-semibold', na ? 'text-muted-foreground' : colorClass)}>{label}</p>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        <button type="button" onClick={() => onNa(!na)}
          className={cn(
            'shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all inline-flex items-center gap-1',
            na
              ? 'bg-muted border-border text-muted-foreground hover:border-foreground/20'
              : 'bg-card border-border text-muted-foreground hover:border-foreground/20',
          )}
        >
          {na && <Prohibit size={12} />}
          {na ? 'Nao avaliado' : 'Nao avaliado'}
        </button>
      </div>

      {na
        ? <p className="text-xs text-muted-foreground italic">Campo excluido do calculo da nota final</p>
        : <ScoreInput value={value} onChange={onValue} />}

      <textarea value={obs} onChange={e => onObs(e.target.value)}
        rows={na ? 1 : 2}
        placeholder={na ? 'Motivo pelo qual nao foi possivel avaliar...' : obsPlaceholder}
        className={cn(
          'w-full text-xs bg-muted border border-border rounded-lg px-3 py-2 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 resize-none',
          na ? 'text-muted-foreground focus:ring-border' : 'text-foreground focus:ring-primary/40',
        )}
      />
    </div>
  );
}

// ── Main Component ──
export default function ObrasEvaluation() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const search = useSearch();
  const params = new URLSearchParams(search);
  const projectId = parseInt(params.get('projectId') ?? '0');
  const userId = (user as any)?.id as number | undefined;

  const { data: grouped = {}, isLoading: loadingCriteria } = trpc.projects.getCriteria.useQuery(undefined, { enabled: !!user });
  const { data: project } = trpc.projects.getById.useQuery({ id: projectId }, { enabled: projectId > 0 });
  const { data: savedEval, isSuccess: evalLoaded } = trpc.projects.getEvaluation.useQuery(
    { projectId, evaluatorId: userId! },
    { enabled: projectId > 0 && !!userId },
  );

  const allCriteria = useMemo(() => Object.values(grouped as Record<string, any[]>).flat(), [grouped]);
  const [entries,           setEntries]          = useState<Record<number, Entry>>({});
  const [initialized,       setInitialized]      = useState(false);

  // OS
  const [osModulos,         setOsModulos]        = useState(10);
  const [osObsModulos,      setOsObsModulos]     = useState('');
  const [osModulosNa,       setOsModulosNa]      = useState(false);
  const [osInversores,      setOsInversores]     = useState(10);
  const [osObsInversores,   setOsObsInversores]  = useState('');
  const [osInversoresNa,    setOsInversoresNa]   = useState(false);

  const [nps, setNps] = useState(10);
  const [npsObs, setNpsObs] = useState('');
  const [npsNa, setNpsNa] = useState(false);

  const [hasFinancialLoss, setHasFinancialLoss] = useState(false);
  const [financialLossReason, setFinancialLossReason] = useState('');

  const [driveLink, setDriveLink] = useState('');

  // Inicialização: aguarda critérios e snapshot salvo, depois preenche o estado
  useEffect(() => {
    if (initialized) return;
    if (allCriteria.length === 0) return;
    // Se há projectId+userId, esperar a query resolver antes de iniciar
    if (projectId > 0 && !!userId && !evalLoaded) return;

    const snap = (savedEval?.items as any) ?? null;

    if (snap?.entries && typeof snap.entries === 'object') {
      setEntries(snap.entries);
      if (snap.osModulos          !== undefined) setOsModulos(snap.osModulos);
      if (snap.osObsModulos       !== undefined) setOsObsModulos(snap.osObsModulos);
      if (snap.osModulosNa        !== undefined) setOsModulosNa(snap.osModulosNa);
      if (snap.osInversores       !== undefined) setOsInversores(snap.osInversores);
      if (snap.osObsInversores    !== undefined) setOsObsInversores(snap.osObsInversores);
      if (snap.osInversoresNa     !== undefined) setOsInversoresNa(snap.osInversoresNa);
      if (snap.nps                !== undefined) setNps(snap.nps);
      if (snap.npsObs             !== undefined) setNpsObs(snap.npsObs);
      if (snap.npsNa              !== undefined) setNpsNa(snap.npsNa);
      if (snap.hasFinancialLoss   !== undefined) setHasFinancialLoss(snap.hasFinancialLoss);
      if (snap.financialLossReason !== undefined) setFinancialLossReason(snap.financialLossReason);
      setDriveLink(snap.driveLink || project?.photosLink || '');
    } else {
      const init: Record<number, Entry> = {};
      allCriteria.forEach((c: any) => { init[c.id] = { score: 10, obs: '', na: false }; });
      setEntries(init);
      if (project?.photosLink) setDriveLink(project.photosLink);
    }
    setInitialized(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCriteria, evalLoaded, initialized]);

  function getEntry(id: number): Entry { return entries[id] ?? { score: 10, obs: '', na: false }; }
  function patchEntry(id: number, patch: Partial<Entry>) {
    setEntries(prev => ({ ...prev, [id]: { ...getEntry(id), ...patch } }));
  }

  function catAvg(cat: string): number | null {
    const items = (grouped as any)[cat] ?? [];
    return avg(items.map((c: any) => (getEntry(c.id).na ? null : getEntry(c.id).score)));
  }

  const notaSeg = catAvg('seguranca');
  const notaFunc = catAvg('funcionalidade');
  const notaEst = catAvg('estetica');
  const mediaOs = avg([osModulosNa ? null : osModulos, osInversoresNa ? null : osInversores]);
  const eficiencia = avg([notaSeg, notaFunc, notaEst]);
  const npsValue = npsNa ? null : nps;
  const notaFinal = avg([eficiencia, mediaOs, npsValue]);

  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const submitMutation = trpc.projects.submitScores.useMutation({
    onSuccess: data => { setResult(data); setSubmitted(true); },
    onError: err => { setError(err.message || 'Erro ao enviar avaliação'); },
  });

  function handleSubmit() {
    if (!projectId || !userId) { setError('Projeto ou usuário não identificado.'); return; }

    const formSnapshot = {
      entries,
      osModulos, osObsModulos, osModulosNa,
      osInversores, osObsInversores, osInversoresNa,
      nps, npsObs, npsNa,
      hasFinancialLoss, financialLossReason,
      driveLink,
    };

    submitMutation.mutate({
      projectId, userId,
      projectCode:        project?.code ?? '',
      notaSeguranca:      notaSeg     ?? 0,
      notaFuncionalidade: notaFunc    ?? 0,
      notaEstetica:       notaEst     ?? 0,
      osModulos:          osModulos,
      osInversores:       osInversores,
      npsCliente:         nps,
      osModulosNa,
      osInversoresNa,
      npsNa,
      hasFinancialLoss,
      driveLink:          driveLink || undefined,
      observacaoGeral:    hasFinancialLoss ? `PREJUÍZO FINANCEIRO: ${financialLossReason}` : undefined,
      itemScores: allCriteria
        .filter((c: any) => !getEntry(c.id).na)
        .map((c: any) => ({ criteriaId: c.id, score: getEntry(c.id).score, obs: getEntry(c.id).obs || undefined })),
      formSnapshot,
    });
  }

  function fmtAvg(v: number | null) {
    return v === null
      ? <span className="text-muted-foreground">N/A</span>
      : <span>{formatNota(v, 1)}</span>;
  }

  // ── Success ──
  if (submitted && result) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500">
        <div className="rounded-2xl border border-emerald-500/20 bg-card p-10 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={32} weight="duotone" className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-1">Avaliação Enviada!</h2>
          <p className="text-xs text-muted-foreground mb-6">{project?.code} · {project?.clientName}</p>
          {/* Breakdown dos componentes da nota */}
          <div className="grid grid-cols-3 gap-3 mb-6 text-left">
            {[
              { label: 'Segurança', value: result.breakdown.seguranca },
              { label: 'Funcionalidade', value: result.breakdown.funcionalidade },
              { label: 'Estética', value: result.breakdown.estetica },
              { label: 'OS Módulos', value: result.breakdown.osModulos },
              { label: 'OS Inversores', value: result.breakdown.osInversores },
              { label: 'NPS', value: result.breakdown.npsCliente },
            ].map(({ label, value }) => (
              <div key={label} className="bg-muted rounded-lg p-2">
                <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
                {value === null
                  ? <p className="text-xs text-muted-foreground italic">N/A</p>
                  : <p className={cn('text-sm font-bold tabular-nums', scoreColorClass(value))}>{formatNota(value, 1)}</p>
                }
              </div>
            ))}
          </div>

          {/* Nota Final */}
          <div className="bg-muted rounded-xl border border-border p-4 mb-4">
            <p className="text-xs text-muted-foreground mb-1">Nota Final</p>
            <p className={cn('text-4xl font-bold tabular-nums', scoreColorClass(result.notaFinal))}>
              {formatNota(result.notaFinal, 2)}
            </p>
            {result.hasFinancialLoss ? (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2 flex items-center justify-center gap-1">
                <Warning size={14} /> Prejuízo financeiro registrado — avaliação desconsiderada. Bônus zerado.
              </p>
            ) : result.bonusValorCorrigido > 0 ? (
              <p className="text-xs text-muted-foreground mt-1">
                Bônus estimado: <span className="text-primary font-semibold">{formatCurrency(result.bonusValorCorrigido)}</span>
              </p>
            ) : null}
          </div>

          {/* Tabela de bônus por participante */}
          {!result.hasFinancialLoss && result.hasDiaryData && result.participantBonuses?.length > 0 ? (
            <div className="bg-white/5 rounded-xl border border-white/5 p-4 mb-6 text-left space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Distribuição de Bônus
                </p>
                <span className="text-[10px] text-slate-600">{result.totalDias} dia(s) de obra</span>
              </div>
              <div className="space-y-2">
                {result.participantBonuses.map((p: any) => {
                  const freqPct = Math.round(p.frequencia * 100);
                  const freqColor = freqPct >= 80 ? 'text-green-400' : freqPct >= 50 ? 'text-flux-orange' : 'text-red-400';
                  return (
                    <div key={p.installerId} className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate">{p.nome}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-600">P {p.peso.toFixed(1)}</span>
                          <span className={cn('text-[10px] font-mono', freqColor)}>{freqPct}%</span>
                          <span className="text-[10px] text-slate-600">{p.diasPresentes}/{p.totalDias}d</span>
                          {p.nota360 < 10 && (
                            <span className="text-[10px] text-purple-400">360: {p.nota360.toFixed(1)}</span>
                          )}
                        </div>
                      </div>
                      <span className={cn(
                        'text-sm font-bold font-mono shrink-0',
                        p.bonusIndividual >= 100 ? 'text-flux-orange' : 'text-slate-400',
                      )}>
                        R$ {p.bonusIndividual.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-white/10">
                <span className="text-xs text-slate-500">Total distribuído</span>
                <span className="text-sm font-bold text-flux-orange font-mono">
                  R$ {result.participantBonuses.reduce((s: number, p: any) => s + p.bonusIndividual, 0).toFixed(2)}
                </span>
              </div>
            </div>
          ) : !result.hasFinancialLoss && result.bonusValorCorrigido > 0 ? (
            <div className="bg-white/5 rounded-xl border border-white/5 p-4 mb-6 space-y-1 text-left">
              <p className="text-xs text-slate-500">
                Valor corrigido pela nota: <span className="text-flux-orange font-semibold font-mono">R$ {result.bonusValorCorrigido.toFixed(2)}</span>
              </p>
              <p className="text-[10px] text-slate-600">Diário de obra não cadastrado — distribuição por participante indisponível</p>
            </div>
          ) : null}
          <a href="/obras/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:bg-primary/90 transition-all">
            <ArrowLeft size={16} /> Voltar ao Dashboard
          </a>
        </div>
      </div>
    );
  }

  // ── Loading ──
  if (loadingCriteria) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <SpinnerGap size={40} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando critérios…</p>
        </div>
      </div>
    );
  }

  // ── Form ──
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Portal de Obras</p>
          <h1 className="text-2xl font-display font-semibold text-foreground">Avaliação da Obra</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Notas de 0 a 10 por critério. Use <span className="text-foreground font-medium">Não avaliado</span> para excluir um item da média.
          </p>
          {savedEval && initialized && (
            <p className="text-[11px] text-slate-600 mt-1.5 flex items-center gap-1">
              <span>💾</span>
              Avaliação anterior restaurada ·{' '}
              {new Date(savedEval.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <a href="/obras/regras"
          className="shrink-0 text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 mt-1 border border-border rounded-lg px-3 py-1.5 hover:border-primary/30">
          <Info size={14} /> Ver regras
        </a>
      </div>

      {/* Project card */}
      {project ? (
        <div className="rounded-xl border border-primary/20 bg-card p-4 space-y-4">
          <div>
            <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-1">Projeto em Avaliação</p>
            <h2 className="text-base font-semibold text-foreground">{project.clientName}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">{project.code}</span>
              {project.moduleCount && <span className="text-xs text-muted-foreground">{project.moduleCount} módulos</span>}
              {project.powerKwp && <span className="text-xs text-muted-foreground">{project.powerKwp} kWp</span>}
              {project.category && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">Cat. {project.category}</span>}
            </div>
            {project.city && (
              <p className="text-xs text-muted-foreground mt-1">{project.city}{project.state ? `, ${project.state}` : ''}</p>
            )}
            {project.category && BONUS_MAP[project.category] != null && (
              <div className="flex items-center gap-2 mt-2">
                <CurrencyDollar size={14} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Prêmio base:</span>
                <span className="text-xs font-semibold text-primary">
                  R$ {BONUS_MAP[project.category].toLocaleString('pt-BR')}
                </span>
                <span className="text-xs text-muted-foreground">/ valor antes da correcao proporcional</span>
              </div>
            )}
          </div>

          {/* Toggle: Prejuízo Financeiro */}
          <div className="border-t border-border pt-4 space-y-3">
            <button
              type="button"
              onClick={() => {
                const next = !hasFinancialLoss;
                setHasFinancialLoss(next);
                if (next) {
                  setEntries(prev => {
                    const reset: Record<number, Entry> = {};
                    Object.entries(prev).forEach(([id, e]) => {
                      reset[parseInt(id)] = { ...e, score: 0, na: false };
                    });
                    return reset;
                  });
                  setOsModulos(0);
                  setOsInversores(0);
                  setNps(0);
                }
              }}
              className="flex items-center justify-between w-full group"
            >
              <div className="flex items-center gap-2">
                <CurrencyDollar size={18} weight="duotone" className={hasFinancialLoss ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'} />
                <span className={cn(
                  'text-sm font-medium transition-colors',
                  hasFinancialLoss ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground group-hover:text-foreground',
                )}>
                  Houve prejuízo financeiro?
                </span>
              </div>
              <div className={cn(
                'relative w-10 h-5 rounded-full transition-colors border',
                hasFinancialLoss ? 'bg-red-500/20 border-red-500/30' : 'bg-muted border-border',
              )}>
                <div className={cn(
                  'absolute top-0.5 w-4 h-4 rounded-full shadow-sm transition-all',
                  hasFinancialLoss ? 'left-5 bg-red-500' : 'left-0.5 bg-muted-foreground/40',
                )} />
              </div>
            </button>

            {hasFinancialLoss && (
              <textarea value={financialLossReason} onChange={e => setFinancialLossReason(e.target.value)}
                rows={2} placeholder="Descreva o prejuizo financeiro ocorrido na obra..."
                className="w-full text-xs bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-red-500/30 resize-none"
                autoFocus
              />
            )}
          </div>
        </div>
      ) : projectId > 0 ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Carregando dados do projeto...</p>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-2">
          <Warning size={18} className="text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-600 dark:text-amber-400">Nenhum projeto selecionado. Acesse esta pagina a partir do Dashboard de Obras.</p>
        </div>
      )}

      {/* Drive link */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="flex items-center gap-2">
          <FolderOpen size={18} weight="duotone" className="text-foreground" />
          <p className="text-sm font-semibold text-foreground">Fotos de Instalacao (Google Drive)</p>
        </div>
        <input type="url" value={driveLink} onChange={e => setDriveLink(e.target.value)}
          placeholder="https://drive.google.com/drive/folders/..."
          className="w-full text-xs bg-muted border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
        {driveLink && (
          <a href={driveLink} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
            <ArrowSquareOut size={12} /> Abrir pasta no Drive
          </a>
        )}
      </div>

      {/* Sticky summary bar */}
      <div className="sticky top-0 z-20 rounded-xl border border-border bg-card p-3 shadow-lg">
        <div className="flex flex-wrap items-center gap-4">
          {(Object.entries(CAT_CFG) as [CatKey, typeof CAT_CFG[CatKey]][]).map(([cat, cfg]) => {
            const v = catAvg(cat);
            const IconComp = cfg.icon;
            return (
              <div key={cat} className="flex items-center gap-2">
                <IconComp size={16} weight="duotone" className={cfg.colorClass} />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">{cfg.label}</p>
                  <p className={cn('text-sm font-bold font-mono', v === null ? 'text-muted-foreground' : scoreColorClass(v))}>
                    {fmtAvg(v)}
                  </p>
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-2">
            <ClipboardText size={16} weight="duotone" className="text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Média OS</p>
              <p className={cn('text-sm font-bold tabular-nums', mediaOs === null ? 'text-muted-foreground' : scoreColorClass(mediaOs))}>
                {fmtAvg(mediaOs)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Star size={16} weight="duotone" className="text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">NPS</p>
              <p className={cn('text-sm font-bold tabular-nums', npsNa ? 'text-muted-foreground' : scoreColorClass(nps))}>
                {npsNa ? <span className="text-muted-foreground">N/A</span> : formatNota(nps, 1)}
              </p>
            </div>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[10px] text-muted-foreground uppercase">Nota Final</p>
            <p className={cn('text-2xl font-bold tabular-nums', notaFinal === null ? 'text-muted-foreground' : scoreColorClass(notaFinal))}>
              {notaFinal === null ? 'N/A' : formatNota(notaFinal, 2)}
            </p>
          </div>
        </div>
      </div>

      {/* Categories */}
      {(Object.entries(CAT_CFG) as [CatKey, typeof CAT_CFG[CatKey]][]).map(([cat, cfg]) => {
        const items = (grouped as any)[cat] ?? [];
        if (!items.length) return null;
        const v = catAvg(cat);
        const naCount = items.filter((c: any) => getEntry(c.id).na).length;
        const IconComp = cfg.icon;
        return (
          <section key={cat} className="space-y-3">
            <div className={cn('flex items-center justify-between px-4 py-3 rounded-lg', cfg.bgClass, 'border', cfg.borderClass)}>
              <div className="flex items-center gap-3">
                <IconComp size={22} weight="duotone" className={cfg.colorClass} />
                <div>
                  <h3 className={cn('text-sm font-semibold', cfg.colorClass)}>{cfg.label}</h3>
                  <p className="text-[10px] text-muted-foreground">
                    Peso {cfg.weight}x - {items.length - naCount}/{items.length} critérios avaliados
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase">Média</p>
                <p className={cn('text-lg font-bold tabular-nums', v === null ? 'text-muted-foreground' : scoreColorClass(v))}>
                  {fmtAvg(v)}
                </p>
              </div>
            </div>
            {items.map((criterion: any) => (
              <CriterionCard key={criterion.id} criterion={criterion} entry={getEntry(criterion.id)}
                onScore={v => patchEntry(criterion.id, { score: v })}
                onObs={v => patchEntry(criterion.id, { obs: v })}
                onNa={v => patchEntry(criterion.id, { na: v })}
                colorClass={cfg.colorClass}
              />
            ))}
          </section>
        );
      })}

      {/* OS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-3">
            <ClipboardText size={22} weight="duotone" className="text-emerald-600 dark:text-emerald-400" />
            <div>
              <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Preenchimento das OS's</h3>
              <p className="text-[10px] text-muted-foreground">Ordens de Serviço — Módulos (col. AD) e Inversores (col. AE)</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase">Média OS</p>
            <p className={cn('text-lg font-bold tabular-nums', mediaOs === null ? 'text-muted-foreground' : scoreColorClass(mediaOs))}>
              {fmtAvg(mediaOs)}
            </p>
          </div>
        </div>
        <SimpleScoreSection label="OS Módulos" value={osModulos} obs={osObsModulos} na={osModulosNa}
          onValue={setOsModulos} onObs={setOsObsModulos} onNa={setOsModulosNa}
          colorClass="text-emerald-600 dark:text-emerald-400" obsPlaceholder="Observações sobre o preenchimento da OS de Módulos…"
        />
        <SimpleScoreSection label="OS Inversores" value={osInversores} obs={osObsInversores} na={osInversoresNa}
          onValue={setOsInversores} onObs={setOsObsInversores} onNa={setOsInversoresNa}
          colorClass="text-emerald-600 dark:text-emerald-400" obsPlaceholder="Observações sobre o preenchimento da OS de Inversores…"
        />
      </section>

      {/* NPS */}
      <section className="space-y-3">
        <div className="px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-3">
            <Star size={22} weight="duotone" className="text-amber-600 dark:text-amber-400" />
            <div>
              <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400">NPS — Avaliação do Cliente</h3>
              <p className="text-[10px] text-muted-foreground">Coletada em ligação pelo Sucesso do Cliente logo após a instalação (col. AH)</p>
            </div>
          </div>
        </div>
        <SimpleScoreSection label="NPS" description="Nota dada pelo cliente de 0 a 10"
          value={nps} obs={npsObs} na={npsNa}
          onValue={setNps} onObs={setNpsObs} onNa={setNpsNa}
          colorClass="text-amber-600 dark:text-amber-400" obsPlaceholder="Comentários do cliente ou contexto da coleta…"
        />
      </section>

      {/* Formula */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Como a Nota é calculada</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          {[
            { label: 'Eficiência', formula: 'média(Seg, Func, Est)', value: eficiencia },
            { label: 'Média OS', formula: 'média(OS Mod., OS Inv.)', value: mediaOs },
            { label: 'NPS', formula: 'nota do cliente', value: npsValue },
          ].map(({ label, formula, value }) => (
            <div key={label} className="bg-muted rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
              <p className="text-xs text-foreground font-mono">{formula}</p>
              <p className={cn('text-lg font-bold tabular-nums mt-1', value === null ? 'text-muted-foreground' : scoreColorClass(value))}>
                {value === null ? 'N/A' : formatNota(value, 2)}
              </p>
            </div>
          ))}
        </div>
        <div className="text-center mt-3 pt-3 border-t border-border">
          <p className="text-[10px] text-muted-foreground mb-1">
            Nota Final = média(Eficiência, Média OS, NPS)
          </p>
          <p className={cn('text-3xl font-bold tabular-nums', notaFinal === null ? 'text-muted-foreground' : scoreColorClass(notaFinal))}>
            {notaFinal === null ? '—' : formatNota(notaFinal, 2)}
          </p>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2 pb-10">
        <button onClick={handleSubmit}
          disabled={submitMutation.isPending || !projectId || notaFinal === null}
          className={cn(
            'px-10 py-3 rounded-lg font-semibold text-sm transition-all',
            submitMutation.isPending || !projectId || notaFinal === null
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg',
          )}
        >
          {submitMutation.isPending
            ? <span className="flex items-center gap-2">
                <SpinnerGap size={16} className="animate-spin" />
                Enviando…
              </span>
            : notaFinal === null
            ? 'Avalie pelo menos um componente'
            : 'Enviar Avaliação da Obra'}
        </button>
      </div>

      {error && (
        <div className="fixed bottom-6 right-6 rounded-xl border border-red-500/20 bg-card p-4 max-w-sm animate-in slide-in-from-bottom-4 z-50 shadow-lg">
          <div className="flex items-center gap-3">
            <Warning size={18} className="text-red-600 dark:text-red-400 shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button onClick={() => setError(null)} className="text-muted-foreground hover:text-foreground ml-auto">&times;</button>
          </div>
        </div>
      )}
    </div>
  );
}
