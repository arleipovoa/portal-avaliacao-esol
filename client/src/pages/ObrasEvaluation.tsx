import { useState, useMemo } from 'react';
import { useSearch } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

// ── Mapa de bônus por categoria ────────────────────────────────────────────
const BONUS_MAP: Record<string, number> = {
  B1: 200, B2: 300, B3: 500, B4: 750, B5: 1000, B6: 1500, B7: 2000,
};

// ── Configuração visual por categoria ──────────────────────────────────────
const CAT_CFG = {
  seguranca:      { label: 'Segurança',      icon: '🛡️', color: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/20',    weight: 2, trackColor: '#f87171' },
  funcionalidade: { label: 'Funcionalidade', icon: '⚙️', color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/20',   weight: 2, trackColor: '#60a5fa' },
  estetica:       { label: 'Estética',       icon: '✨', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', weight: 1, trackColor: '#c084fc' },
} as const;

type CatKey = keyof typeof CAT_CFG;
type Entry  = { score: number; obs: string; na: boolean };

function scoreColor(v: number) {
  if (v >= 8) return 'text-green-400';
  if (v >= 6) return 'text-flux-orange';
  return 'text-red-400';
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

// ── Sub-componente: input de nota ─────────────────────────────────────────
// Slider visível + campo numérico sem setas nativas + botões ±0.5
function ScoreInput({ value, disabled, onChange }: {
  value: number;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  const clamped = Math.min(10, Math.max(0, value));
  const pct     = (clamped / 10) * 100;
  const fill    = trackColorFor(clamped);

  return (
    <div className={cn('space-y-2', disabled && 'opacity-30 pointer-events-none select-none')}>
      {/* linha: − | valor | + */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, Math.round((clamped - 0.5) * 2) / 2))}
          className="w-8 h-8 shrink-0 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 flex items-center justify-center text-base font-bold transition-all"
        >−</button>

        {/* Número sem setas nativas do browser */}
        <input
          type="number"
          min={0} max={10} step={0.5}
          value={clamped}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(Math.min(10, Math.max(0, v)));
          }}
          className={cn(
            'w-20 text-center text-2xl font-bold font-mono rounded-lg border px-1 py-1 bg-transparent',
            'focus:outline-none focus:ring-1 focus:ring-flux-orange/50 transition-colors',
            // oculta as setas nativas (webkit + firefox)
            '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
            scoreColor(clamped),
            clamped >= 8
              ? 'bg-green-400/10 border-green-400/30'
              : clamped >= 6
              ? 'bg-orange-500/10 border-orange-500/30'
              : 'bg-red-400/10 border-red-400/30',
          )}
        />

        <button
          type="button"
          onClick={() => onChange(Math.min(10, Math.round((clamped + 0.5) * 2) / 2))}
          className="w-8 h-8 shrink-0 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 flex items-center justify-center text-base font-bold transition-all"
        >+</button>

        <span className={cn('text-xs font-mono text-slate-600')}>/ 10</span>
      </div>

      {/* Slider arrastável — trilha colorida mostra o progresso */}
      <input
        type="range"
        min={0} max={10} step={0.5}
        value={clamped}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={cn(
          'w-full h-2 rounded-full cursor-pointer appearance-none',
          // thumb
          '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5',
          '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white',
          '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-void',
          '[&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer',
          '[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110',
          // firefox thumb
          '[&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full',
          '[&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-void',
          '[&::-moz-range-thumb]:cursor-pointer',
        )}
        style={{
          background: `linear-gradient(to right, ${fill} ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
        }}
      />
    </div>
  );
}

// ── Card de um critério ────────────────────────────────────────────────────
function CriterionCard({
  criterion, entry, onScore, onObs, onNa, color,
}: {
  criterion: { id: number; name: string; description?: string };
  entry: Entry;
  onScore: (v: number) => void;
  onObs:   (v: string) => void;
  onNa:    (v: boolean) => void;
  color:   string;
}) {
  const [showObs, setShowObs] = useState(false);
  return (
    <div className={cn(
      'glass rounded-xl border p-4 transition-all space-y-3',
      entry.na ? 'border-slate-700/50 opacity-60' : 'border-white/5 hover:border-white/10',
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={cn('text-sm font-semibold', entry.na ? 'text-slate-500' : color)}>{criterion.name}</p>
          {criterion.description && (
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{criterion.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onNa(!entry.na)}
          className={cn(
            'shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all',
            entry.na
              ? 'bg-slate-700/60 border-slate-600 text-slate-400 hover:border-slate-500'
              : 'bg-white/5 border-white/10 text-slate-500 hover:border-slate-500 hover:text-slate-300',
          )}
        >
          {entry.na ? '⊘ Não avaliado' : 'Não avaliado'}
        </button>
      </div>

      {entry.na ? (
        <p className="text-xs text-slate-600 italic">Item excluído da média desta categoria</p>
      ) : (
        <ScoreInput value={entry.score} onChange={onScore} />
      )}

      {!entry.na ? (
        <div>
          <button
            type="button"
            onClick={() => setShowObs(v => !v)}
            className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
          >
            <span>{showObs ? '▾' : '▸'}</span>
            {entry.obs
              ? <span className="text-flux-orange">Observação registrada</span>
              : 'Adicionar observação'}
          </button>
          {showObs && (
            <textarea
              value={entry.obs}
              onChange={e => onObs(e.target.value)}
              rows={2}
              placeholder="Descreva o que foi observado neste critério…"
              className="mt-2 w-full text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-flux-orange/40 resize-none"
            />
          )}
        </div>
      ) : (
        <textarea
          value={entry.obs}
          onChange={e => onObs(e.target.value)}
          rows={1}
          placeholder="Motivo pelo qual não foi possível avaliar…"
          className="w-full text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-slate-400 placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-600 resize-none"
        />
      )}
    </div>
  );
}

// ── Seção simples (OS / NPS) ────────────────────────────────────────────────
function SimpleScoreSection({ label, description, value, obs, na, onValue, onObs, onNa, color, obsPlaceholder }: {
  label: string; description?: string;
  value: number; obs: string; na: boolean;
  onValue: (v: number) => void; onObs: (v: string) => void; onNa: (v: boolean) => void;
  color: string; obsPlaceholder: string;
}) {
  return (
    <div className={cn(
      'glass rounded-xl border p-4 transition-all space-y-3',
      na ? 'border-slate-700/50 opacity-60' : 'border-white/5 hover:border-white/10',
    )}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={cn('text-sm font-semibold', na ? 'text-slate-500' : color)}>{label}</p>
          {description && <p className="text-xs text-slate-600 mt-0.5">{description}</p>}
        </div>
        <button
          type="button"
          onClick={() => onNa(!na)}
          className={cn(
            'shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all',
            na
              ? 'bg-slate-700/60 border-slate-600 text-slate-400 hover:border-slate-500'
              : 'bg-white/5 border-white/10 text-slate-500 hover:border-slate-500 hover:text-slate-300',
          )}
        >
          {na ? '⊘ Não avaliado' : 'Não avaliado'}
        </button>
      </div>

      {na
        ? <p className="text-xs text-slate-600 italic">Campo excluído do cálculo da nota final</p>
        : <ScoreInput value={value} onChange={onValue} />}

      <textarea
        value={obs}
        onChange={e => onObs(e.target.value)}
        rows={na ? 1 : 2}
        placeholder={na ? 'Motivo pelo qual não foi possível avaliar…' : obsPlaceholder}
        className={cn(
          'w-full text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2 placeholder:text-slate-700 focus:outline-none focus:ring-1 resize-none',
          na ? 'text-slate-400 focus:ring-slate-600' : 'text-slate-200 focus:ring-flux-orange/40',
        )}
      />
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────
export default function ObrasEvaluation() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const search    = useSearch();
  const params    = new URLSearchParams(search);
  const projectId = parseInt(params.get('projectId') ?? '0');
  const userId    = (user as any)?.id as number | undefined;

  const { data: grouped = {}, isLoading: loadingCriteria } = trpc.projects.getCriteria.useQuery(undefined, { enabled: !!user });
  const { data: project } = trpc.projects.getById.useQuery({ id: projectId }, { enabled: projectId > 0 });

  // Estado por critério
  const allCriteria = useMemo(() => Object.values(grouped as Record<string, any[]>).flat(), [grouped]);
  const [entries, setEntries] = useState<Record<number, Entry>>({});
  useMemo(() => {
    if (allCriteria.length > 0 && Object.keys(entries).length === 0) {
      const init: Record<number, Entry> = {};
      allCriteria.forEach(c => { init[c.id] = { score: 10, obs: '', na: false }; });
      setEntries(init);
    }
  }, [allCriteria]);

  // OS
  const [osModulos,       setOsModulos]       = useState(10);
  const [osObsModulos,    setOsObsModulos]    = useState('');
  const [osModulosNa,     setOsModulosNa]     = useState(false);
  const [osInversores,    setOsInversores]    = useState(10);
  const [osObsInversores, setOsObsInversores] = useState('');
  const [osInversoresNa,  setOsInversoresNa]  = useState(false);

  // NPS
  const [nps,    setNps]    = useState(10);
  const [npsObs, setNpsObs] = useState('');
  const [npsNa,  setNpsNa]  = useState(false);

  // Prejuízo financeiro
  const [hasFinancialLoss,    setHasFinancialLoss]    = useState(false);
  const [financialLossReason, setFinancialLossReason] = useState('');

  // Drive
  const [driveLink, setDriveLink] = useState('');
  useMemo(() => { if (project?.photosLink && !driveLink) setDriveLink(project.photosLink); }, [project]);

  function getEntry(id: number): Entry { return entries[id] ?? { score: 10, obs: '', na: false }; }
  function patchEntry(id: number, patch: Partial<Entry>) {
    setEntries(prev => ({ ...prev, [id]: { ...getEntry(id), ...patch } }));
  }

  function catAvg(cat: string): number | null {
    const items = (grouped as any)[cat] ?? [];
    return avg(items.map((c: any) => (getEntry(c.id).na ? null : getEntry(c.id).score)));
  }

  const notaSeg   = catAvg('seguranca');
  const notaFunc  = catAvg('funcionalidade');
  const notaEst   = catAvg('estetica');
  const mediaOs   = avg([osModulosNa ? null : osModulos, osInversoresNa ? null : osInversores]);
  const eficiencia = avg([notaSeg, notaFunc, notaEst]);
  const npsValue  = npsNa ? null : nps;
  const notaFinal = avg([eficiencia, mediaOs, npsValue]);

  // Submit
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult]       = useState<any>(null);
  const [error, setError]         = useState<string | null>(null);

  const submitMutation = trpc.projects.submitScores.useMutation({
    onSuccess: data => { setResult(data); setSubmitted(true); },
    onError:   err  => { setError(err.message || 'Erro ao enviar avaliação'); },
  });

  function handleSubmit() {
    if (!projectId || !userId) { setError('Projeto ou usuário não identificado.'); return; }
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
        .filter(c => !getEntry(c.id).na)
        .map(c => ({ criteriaId: c.id, score: getEntry(c.id).score, obs: getEntry(c.id).obs || undefined })),
    });
  }

  function fmtAvg(v: number | null) {
    return v === null
      ? <span className="text-slate-600">N/A</span>
      : <span>{v.toFixed(1)}</span>;
  }

  // ── Sucesso ──────────────────────────────────────────────────────────────
  if (submitted && result) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500">
        <div className="glass rounded-2xl border border-green-500/20 p-10 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-5">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-xl font-semibold text-white mb-1">Avaliação Enviada!</h2>
          <p className="text-xs text-slate-500 mb-6">{project?.code} · {project?.clientName}</p>
          {/* Breakdown dos componentes da nota */}
          <div className="grid grid-cols-3 gap-2 mb-4 text-left">
            {[
              { label: 'Segurança',      value: result.breakdown.seguranca },
              { label: 'Funcionalidade', value: result.breakdown.funcionalidade },
              { label: 'Estética',       value: result.breakdown.estetica },
              { label: 'OS Módulos',     value: result.breakdown.osModulos },
              { label: 'OS Inversores',  value: result.breakdown.osInversores },
              { label: 'NPS',            value: result.breakdown.npsCliente },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/5 rounded-lg p-2">
                <p className="text-[10px] text-slate-500 mb-0.5">{label}</p>
                {value === null
                  ? <p className="text-xs text-slate-600 italic">N/A</p>
                  : <p className={cn('text-sm font-bold font-mono', scoreColor(value))}>{value.toFixed(1)}</p>
                }
              </div>
            ))}
          </div>

          {/* Nota Final */}
          <div className="bg-white/5 rounded-xl border border-white/5 p-4 mb-4">
            <p className="text-xs text-slate-500 mb-1">Nota Final</p>
            <p className={cn('text-4xl font-bold font-mono', scoreColor(result.notaFinal))}>
              {result.notaFinal.toFixed(2)}
            </p>
            {result.hasFinancialLoss && (
              <p className="text-xs text-red-400 mt-2">
                ⚠️ Prejuízo financeiro registrado — avaliação desconsiderada. Bônus zerado.
              </p>
            )}
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
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-flux-orange text-void font-semibold text-sm rounded-lg hover:bg-flux-orange/90 transition-all">
            Voltar ao Dashboard
          </a>
        </div>
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loadingCriteria) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-flux-orange/30 border-t-flux-orange rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Carregando critérios…</p>
        </div>
      </div>
    );
  }

  // ── Formulário ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">

      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-flux-orange uppercase tracking-widest mb-1">Portal de Obras</p>
          <h1 className="text-2xl font-display font-semibold text-white">Avaliação da Obra</h1>
          <p className="text-sm text-slate-400 mt-1">
            Notas de 0 a 10 por critério. Use <span className="text-slate-300 font-medium">Não avaliado</span> para excluir um item da média.
          </p>
        </div>
        <a href="/obras/regras"
          className="shrink-0 text-xs text-slate-500 hover:text-flux-orange transition-colors flex items-center gap-1 mt-1 border border-white/10 rounded-lg px-3 py-1.5 hover:border-flux-orange/30">
          📋 Ver regras
        </a>
      </div>

      {/* Card do Projeto */}
      {project ? (
        <div className="glass rounded-xl border border-flux-orange/20 p-4 space-y-4">
          <div>
            <p className="text-xs text-flux-orange font-semibold uppercase tracking-widest mb-1">Projeto em Avaliação</p>
            <h2 className="text-base font-semibold text-white">{project.clientName}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <span className="text-xs font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">{project.code}</span>
              {project.moduleCount && <span className="text-xs text-slate-500">{project.moduleCount} módulos</span>}
              {project.powerKwp   && <span className="text-xs text-slate-500">{project.powerKwp} kWp</span>}
              {project.category   && <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded">Cat. {project.category}</span>}
            </div>
            {project.city && (
              <p className="text-xs text-slate-600 mt-1">{project.city}{project.state ? `, ${project.state}` : ''}</p>
            )}
            {project.category && BONUS_MAP[project.category] != null && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-slate-500">Prêmio base:</span>
                <span className="text-xs font-semibold text-flux-orange">
                  R$ {BONUS_MAP[project.category].toLocaleString('pt-BR')}
                </span>
                <span className="text-xs text-slate-600">/ valor antes da correção proporcional</span>
              </div>
            )}
          </div>

          {/* Toggle: Prejuízo Financeiro */}
          <div className="border-t border-white/5 pt-4 space-y-3">
            <button
              type="button"
              onClick={() => setHasFinancialLoss(v => !v)}
              className="flex items-center justify-between w-full group"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">💸</span>
                <span className={cn(
                  'text-sm font-medium transition-colors',
                  hasFinancialLoss ? 'text-red-400' : 'text-slate-400 group-hover:text-slate-300',
                )}>
                  Houve prejuízo financeiro?
                </span>
              </div>
              {/* Toggle pill */}
              <div className={cn(
                'relative w-10 h-5 rounded-full transition-colors border',
                hasFinancialLoss ? 'bg-red-500/20 border-red-500/40' : 'bg-white/5 border-white/10',
              )}>
                <div className={cn(
                  'absolute top-0.5 w-4 h-4 rounded-full shadow-sm transition-all',
                  hasFinancialLoss ? 'left-5 bg-red-400' : 'left-0.5 bg-slate-500',
                )} />
              </div>
            </button>

            {hasFinancialLoss && (
              <textarea
                value={financialLossReason}
                onChange={e => setFinancialLossReason(e.target.value)}
                rows={2}
                placeholder="Descreva o prejuízo financeiro ocorrido na obra…"
                className="w-full text-xs bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-red-500/30 resize-none"
                autoFocus
              />
            )}
          </div>
        </div>
      ) : projectId > 0 ? (
        <div className="glass rounded-xl border border-white/5 p-4">
          <p className="text-sm text-slate-500">Carregando dados do projeto…</p>
        </div>
      ) : (
        <div className="glass rounded-xl border border-yellow-500/20 p-4">
          <p className="text-sm text-yellow-400">⚠️ Nenhum projeto selecionado. Acesse esta página a partir do Dashboard de Obras.</p>
        </div>
      )}

      {/* Link Google Drive */}
      <div className="glass rounded-xl border border-white/5 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-base">📁</span>
          <p className="text-sm font-semibold text-white">Fotos de Instalação (Google Drive)</p>
        </div>
        <input
          type="url" value={driveLink} onChange={e => setDriveLink(e.target.value)}
          placeholder="https://drive.google.com/drive/folders/…"
          className="w-full text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-flux-orange/40"
        />
        {driveLink && (
          <a href={driveLink} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-flux-orange hover:underline">
            <span>↗</span> Abrir pasta no Drive
          </a>
        )}
      </div>

      {/* Barra de resumo sticky */}
      <div className="sticky top-0 z-20 glass rounded-xl border border-white/5 p-3 shadow-xl shadow-black/20">
        <div className="flex flex-wrap items-center gap-4">
          {(Object.entries(CAT_CFG) as [CatKey, typeof CAT_CFG[CatKey]][]).map(([cat, cfg]) => {
            const v = catAvg(cat);
            return (
              <div key={cat} className="flex items-center gap-2">
                <span className="text-sm">{cfg.icon}</span>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">{cfg.label}</p>
                  <p className={cn('text-sm font-bold font-mono', v === null ? 'text-slate-600' : scoreColor(v))}>
                    {fmtAvg(v)}
                  </p>
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-2">
            <span className="text-sm">📋</span>
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Média OS</p>
              <p className={cn('text-sm font-bold font-mono', mediaOs === null ? 'text-slate-600' : scoreColor(mediaOs))}>
                {fmtAvg(mediaOs)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">⭐</span>
            <div>
              <p className="text-[10px] text-slate-500 uppercase">NPS</p>
              <p className={cn('text-sm font-bold font-mono', npsNa ? 'text-slate-600' : scoreColor(nps))}>
                {npsNa ? <span className="text-slate-600">N/A</span> : nps.toFixed(1)}
              </p>
            </div>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[10px] text-slate-500 uppercase">Nota Final</p>
            <p className={cn('text-2xl font-bold font-mono', notaFinal === null ? 'text-slate-600' : scoreColor(notaFinal))}>
              {notaFinal === null ? 'N/A' : notaFinal.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Categorias */}
      {(Object.entries(CAT_CFG) as [CatKey, typeof CAT_CFG[CatKey]][]).map(([cat, cfg]) => {
        const items = (grouped as any)[cat] ?? [];
        if (!items.length) return null;
        const v       = catAvg(cat);
        const naCount = items.filter((c: any) => getEntry(c.id).na).length;
        return (
          <section key={cat} className="space-y-3">
            <div className={cn('flex items-center justify-between px-4 py-3 rounded-lg', cfg.bg, 'border', cfg.border)}>
              <div className="flex items-center gap-3">
                <span className="text-lg">{cfg.icon}</span>
                <div>
                  <h3 className={cn('text-sm font-semibold', cfg.color)}>{cfg.label}</h3>
                  <p className="text-[10px] text-slate-500">
                    Peso {cfg.weight}x · {items.length - naCount}/{items.length} critérios avaliados
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase">Média</p>
                <p className={cn('text-lg font-bold font-mono', v === null ? 'text-slate-600' : scoreColor(v))}>
                  {fmtAvg(v)}
                </p>
              </div>
            </div>
            {items.map((criterion: any) => (
              <CriterionCard
                key={criterion.id}
                criterion={criterion}
                entry={getEntry(criterion.id)}
                onScore={v => patchEntry(criterion.id, { score: v })}
                onObs={v   => patchEntry(criterion.id, { obs: v })}
                onNa={v    => patchEntry(criterion.id, { na: v })}
                color={cfg.color}
              />
            ))}
          </section>
        );
      })}

      {/* OS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-green-400/10 border border-green-400/20">
          <div className="flex items-center gap-3">
            <span className="text-lg">📋</span>
            <div>
              <h3 className="text-sm font-semibold text-green-400">Preenchimento das OS's</h3>
              <p className="text-[10px] text-slate-500">Ordens de Serviço — Módulos (col. AD) e Inversores (col. AE)</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase">Média OS</p>
            <p className={cn('text-lg font-bold font-mono', mediaOs === null ? 'text-slate-600' : scoreColor(mediaOs))}>
              {fmtAvg(mediaOs)}
            </p>
          </div>
        </div>
        <SimpleScoreSection
          label="OS Módulos" value={osModulos} obs={osObsModulos} na={osModulosNa}
          onValue={setOsModulos} onObs={setOsObsModulos} onNa={setOsModulosNa}
          color="text-green-400" obsPlaceholder="Observações sobre o preenchimento da OS de Módulos…"
        />
        <SimpleScoreSection
          label="OS Inversores" value={osInversores} obs={osObsInversores} na={osInversoresNa}
          onValue={setOsInversores} onObs={setOsObsInversores} onNa={setOsInversoresNa}
          color="text-green-400" obsPlaceholder="Observações sobre o preenchimento da OS de Inversores…"
        />
      </section>

      {/* NPS */}
      <section className="space-y-3">
        <div className="px-4 py-3 rounded-lg bg-yellow-400/10 border border-yellow-400/20">
          <div className="flex items-center gap-3">
            <span className="text-lg">⭐</span>
            <div>
              <h3 className="text-sm font-semibold text-yellow-400">NPS — Avaliação do Cliente</h3>
              <p className="text-[10px] text-slate-500">Coletada em ligação pelo Sucesso do Cliente logo após a instalação (col. AH)</p>
            </div>
          </div>
        </div>
        <SimpleScoreSection
          label="NPS" description="Nota dada pelo cliente de 0 a 10"
          value={nps} obs={npsObs} na={npsNa}
          onValue={setNps} onObs={setNpsObs} onNa={setNpsNa}
          color="text-yellow-400" obsPlaceholder="Comentários do cliente ou contexto da coleta…"
        />
      </section>

      {/* Fórmula */}
      <div className="glass rounded-xl border border-white/5 p-4 space-y-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Como a Nota é calculada</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          {[
            { label: 'Eficiência', formula: 'média(Seg, Func, Est)', value: eficiencia },
            { label: 'Média OS',   formula: 'média(OS Mod., OS Inv.)', value: mediaOs },
            { label: 'NPS',        formula: 'nota do cliente', value: npsValue },
          ].map(({ label, formula, value }) => (
            <div key={label} className="bg-white/5 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 mb-1">{label}</p>
              <p className="text-xs text-slate-300 font-mono">{formula}</p>
              <p className={cn('text-lg font-bold font-mono mt-1', value === null ? 'text-slate-600' : scoreColor(value))}>
                {value === null ? 'N/A' : value.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
        <div className="text-center mt-3 pt-3 border-t border-white/5">
          <p className="text-[10px] text-slate-500 mb-1">
            Nota Final = média(Eficiência, Média OS, NPS)
          </p>
          <p className={cn('text-3xl font-bold font-mono', notaFinal === null ? 'text-slate-600' : scoreColor(notaFinal))}>
            {notaFinal === null ? '—' : notaFinal.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Enviar */}
      <div className="flex justify-end pt-2 pb-10">
        <button
          onClick={handleSubmit}
          disabled={submitMutation.isPending || !projectId || notaFinal === null}
          className={cn(
            'px-10 py-3 rounded-lg font-semibold text-sm transition-all',
            submitMutation.isPending || !projectId || notaFinal === null
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-flux-orange text-void hover:bg-flux-orange/90 hover:shadow-lg hover:shadow-flux-orange/20',
          )}
        >
          {submitMutation.isPending
            ? <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
                Enviando…
              </span>
            : notaFinal === null
            ? 'Avalie pelo menos um componente'
            : 'Enviar Avaliação da Obra'}
        </button>
      </div>

      {error && (
        <div className="fixed bottom-6 right-6 glass rounded-xl border border-red-500/20 p-4 max-w-sm animate-in slide-in-from-bottom-4 z-50">
          <div className="flex items-center gap-3">
            <span className="text-red-400">⚠️</span>
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={() => setError(null)} className="text-slate-500 hover:text-white ml-auto">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
