import { useState, useMemo } from 'react';
import { useSearch } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

// ── Configuração visual por categoria ──────────────────────────────────────
const CAT_CFG = {
  seguranca:      { label: 'Segurança',      icon: '🛡️', color: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/20',    weight: 2 },
  funcionalidade: { label: 'Funcionalidade', icon: '⚙️', color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/20',   weight: 2 },
  estetica:       { label: 'Estética',       icon: '✨', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', weight: 1 },
} as const;

type CatKey = keyof typeof CAT_CFG;

// ── Cor dinâmica pela nota (0-10) ──────────────────────────────────────────
function scoreColor(v: number) {
  if (v >= 8) return 'text-green-400';
  if (v >= 6) return 'text-flux-orange';
  return 'text-red-400';
}
function scoreBg(v: number) {
  if (v >= 8) return 'bg-green-400/10 border-green-400/20';
  if (v >= 6) return 'bg-flux-orange/10 border-flux-orange/20';
  return 'bg-red-400/10 border-red-400/20';
}

// ── Sub-componente: input de nota ─────────────────────────────────────────
function ScoreInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const clamped = Math.min(10, Math.max(0, value));
  const pct = (clamped / 10) * 100;

  return (
    <div className="flex items-center gap-3">
      {/* Botões − / + */}
      <button
        type="button"
        onClick={() => onChange(Math.max(0, Math.round((clamped - 0.5) * 2) / 2))}
        className="w-7 h-7 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 flex items-center justify-center text-sm font-bold transition-all"
      >−</button>

      {/* Valor numérico */}
      <input
        type="number"
        min={0}
        max={10}
        step={0.5}
        value={clamped}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(Math.min(10, Math.max(0, v)));
        }}
        className={cn(
          'w-16 text-center text-2xl font-bold font-mono rounded-lg border px-2 py-1 bg-transparent focus:outline-none focus:ring-1 focus:ring-flux-orange/50 transition-colors',
          scoreColor(clamped),
          scoreBg(clamped),
        )}
      />

      <button
        type="button"
        onClick={() => onChange(Math.min(10, Math.round((clamped + 0.5) * 2) / 2))}
        className="w-7 h-7 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 flex items-center justify-center text-sm font-bold transition-all"
      >+</button>

      {/* Barra de progresso */}
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden min-w-[80px]">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            clamped >= 8 ? 'bg-green-400' : clamped >= 6 ? 'bg-flux-orange' : 'bg-red-400',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Slider acessível */}
      <input
        type="range"
        min={0}
        max={10}
        step={0.5}
        value={clamped}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="sr-only"
      />
    </div>
  );
}

// ── Sub-componente: card de um critério ────────────────────────────────────
function CriterionCard({
  criterion,
  score,
  obs,
  onScore,
  onObs,
  color,
}: {
  criterion: { id: number; name: string; description?: string };
  score: number;
  obs: string;
  onScore: (v: number) => void;
  onObs: (v: string) => void;
  color: string;
}) {
  const [showObs, setShowObs] = useState(false);

  return (
    <div className="glass rounded-xl border border-white/5 p-4 hover:border-white/10 transition-all space-y-3">
      {/* Nome + nota */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={cn('text-sm font-semibold', color)}>{criterion.name}</p>
          {criterion.description && (
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{criterion.description}</p>
          )}
        </div>
      </div>

      {/* Input de nota */}
      <ScoreInput value={score} onChange={onScore} />

      {/* Observação toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowObs((v) => !v)}
          className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
        >
          <span>{showObs ? '▾' : '▸'}</span>
          {obs ? <span className="text-flux-orange">Observação registrada</span> : 'Adicionar observação'}
        </button>
        {showObs && (
          <textarea
            value={obs}
            onChange={(e) => onObs(e.target.value)}
            rows={2}
            placeholder="Descreva o que foi observado neste critério…"
            className="mt-2 w-full text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-flux-orange/40 resize-none"
          />
        )}
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────
export default function ObrasEvaluation() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const search = useSearch();
  const params  = new URLSearchParams(search);
  const projectId = parseInt(params.get('projectId') ?? '0');
  const userId    = (user as any)?.id as number | undefined;

  // Critérios agrupados do backend
  const { data: grouped = {}, isLoading: loadingCriteria } = trpc.projects.getCriteria.useQuery(undefined, {
    enabled: !!user,
  });

  // Dados do projeto
  const { data: project } = trpc.projects.getById.useQuery(
    { id: projectId },
    { enabled: projectId > 0 },
  );

  // Estado: nota + observação por critério
  const allCriteria = useMemo(() => Object.values(grouped as Record<string, any[]>).flat(), [grouped]);
  const [entries, setEntries] = useState<Record<number, { score: number; obs: string }>>({});

  // Inicializa notas em 10 quando critérios carregam
  useMemo(() => {
    if (allCriteria.length > 0 && Object.keys(entries).length === 0) {
      const init: Record<number, { score: number; obs: string }> = {};
      allCriteria.forEach((c) => { init[c.id] = { score: 10, obs: '' }; });
      setEntries(init);
    }
  }, [allCriteria]);

  // OS e NPS
  const [osModulos,    setOsModulos]    = useState(10);
  const [osObsModulos, setOsObsModulos] = useState('');
  const [osInversores,    setOsInversores]    = useState(10);
  const [osObsInversores, setOsObsInversores] = useState('');
  const [nps,    setNps]    = useState(10);
  const [npsObs, setNpsObs] = useState('');

  // Link do Google Drive
  const [driveLink, setDriveLink] = useState(project?.photosLink ?? '');

  // Atualiza driveLink quando projeto carrega
  useMemo(() => {
    if (project?.photosLink && !driveLink) setDriveLink(project.photosLink);
  }, [project]);

  // Helpers
  function getEntry(id: number) {
    return entries[id] ?? { score: 10, obs: '' };
  }
  function setScore(id: number, v: number) {
    setEntries((prev) => ({ ...prev, [id]: { ...getEntry(id), score: v } }));
  }
  function setObs(id: number, v: string) {
    setEntries((prev) => ({ ...prev, [id]: { ...getEntry(id), obs: v } }));
  }

  // Médias por categoria (0-10)
  function catAvg(cat: string): number {
    const items = (grouped as any)[cat] ?? [];
    if (!items.length) return 10;
    return items.reduce((s: number, c: any) => s + getEntry(c.id).score, 0) / items.length;
  }

  const notaSeg   = catAvg('seguranca');
  const notaFunc  = catAvg('funcionalidade');
  const notaEst   = catAvg('estetica');
  const mediaOs   = (osModulos + osInversores) / 2;
  const eficiencia = (notaSeg + notaFunc + notaEst) / 3;

  // Nota Final % = (Eficiência + Média OS + NPS) / 3 × 10
  const notaFinal = ((eficiencia + mediaOs + nps) / 3) * 10;

  // Submit
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const submitMutation = trpc.projects.submitScores.useMutation({
    onSuccess: (data) => { setResult(data); setSubmitted(true); },
    onError:   (err)  => { setError(err.message || 'Erro ao enviar avaliação'); },
  });

  function handleSubmit() {
    if (!projectId || !userId) { setError('Projeto ou usuário não identificado.'); return; }
    submitMutation.mutate({
      projectId,
      userId,
      notaSeguranca:      notaSeg,
      notaFuncionalidade: notaFunc,
      notaEstetica:       notaEst,
      osModulos,
      osInversores,
      npsCliente:         nps,
      driveLink:          driveLink || undefined,
      itemScores: allCriteria.map((c) => ({
        criteriaId: c.id,
        score:      getEntry(c.id).score,
        obs:        getEntry(c.id).obs || undefined,
      })),
    });
  }

  // ── Tela de sucesso ─────────────────────────────────────────────────────
  if (submitted && result) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500">
        <div className="glass rounded-2xl border border-green-500/20 p-10 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-5">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-xl font-semibold text-white mb-1">Avaliação Enviada!</h2>
          <p className="text-xs text-slate-500 mb-6">{project?.code} · {project?.clientName}</p>

          <div className="grid grid-cols-3 gap-3 mb-6 text-left">
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
                <p className={cn('text-sm font-bold font-mono', scoreColor(value))}>{value.toFixed(1)}</p>
              </div>
            ))}
          </div>

          <div className="bg-white/5 rounded-xl border border-white/5 p-4 mb-6">
            <p className="text-xs text-slate-500 mb-1">Nota Final</p>
            <p className={cn('text-4xl font-bold font-mono', scoreColor(result.notaObraPercentual / 10))}>
              {result.notaObraPercentual.toFixed(1)}%
            </p>
            {result.bonusValorCorrigido > 0 && (
              <p className="text-xs text-slate-500 mt-1">
                Bônus estimado: <span className="text-flux-orange font-semibold">
                  R$ {result.bonusValorCorrigido.toFixed(2)}
                </span>
              </p>
            )}
          </div>

          <a
            href="/obras/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-flux-orange text-void font-semibold text-sm rounded-lg hover:bg-flux-orange/90 transition-all"
          >
            Voltar ao Dashboard
          </a>
        </div>
      </div>
    );
  }

  // ── Loading ─────────────────────────────────────────────────────────────
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

  // ── Formulário principal ────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">

      {/* ── Cabeçalho ── */}
      <div>
        <p className="text-xs font-semibold text-flux-orange uppercase tracking-widest mb-1">Portal de Obras</p>
        <h1 className="text-2xl font-display font-semibold text-white">Avaliação da Obra</h1>
        <p className="text-sm text-slate-400 mt-1">
          Registre as notas de 0 a 10 por critério. Notas abaixo de 8 aceitam observação.
        </p>
      </div>

      {/* ── Card do Projeto ── */}
      {project ? (
        <div className="glass rounded-xl border border-flux-orange/20 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-flux-orange font-semibold uppercase tracking-widest mb-1">Projeto em Avaliação</p>
              <h2 className="text-base font-semibold text-white">{project.clientName}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <span className="text-xs font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">{project.code}</span>
                {project.moduleCount && (
                  <span className="text-xs text-slate-500">{project.moduleCount} módulos</span>
                )}
                {project.powerKwp && (
                  <span className="text-xs text-slate-500">{project.powerKwp} kWp</span>
                )}
                {project.category && (
                  <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded">Cat. {project.category}</span>
                )}
              </div>
              {project.city && (
                <p className="text-xs text-slate-600 mt-1">{project.city}{project.state ? `, ${project.state}` : ''}</p>
              )}
            </div>
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

      {/* ── Link Google Drive ── */}
      <div className="glass rounded-xl border border-white/5 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-base">📁</span>
          <p className="text-sm font-semibold text-white">Fotos de Instalação (Google Drive)</p>
        </div>
        <input
          type="url"
          value={driveLink}
          onChange={(e) => setDriveLink(e.target.value)}
          placeholder="https://drive.google.com/drive/folders/…"
          className="w-full text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-flux-orange/40"
        />
        {driveLink && (
          <a
            href={driveLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-flux-orange hover:underline"
          >
            <span>↗</span> Abrir pasta no Drive
          </a>
        )}
      </div>

      {/* ── Barra de resumo (sticky) ── */}
      <div className="sticky top-0 z-20 glass rounded-xl border border-white/5 p-3 shadow-xl shadow-black/20">
        <div className="flex flex-wrap items-center gap-4">
          {(Object.entries(CAT_CFG) as [CatKey, typeof CAT_CFG[CatKey]][]).map(([cat, cfg]) => {
            const avg = catAvg(cat);
            return (
              <div key={cat} className="flex items-center gap-2">
                <span className="text-sm">{cfg.icon}</span>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">{cfg.label}</p>
                  <p className={cn('text-sm font-bold font-mono', scoreColor(avg))}>{avg.toFixed(1)}</p>
                </div>
              </div>
            );
          })}

          <div className="flex items-center gap-2">
            <span className="text-sm">📋</span>
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Média OS</p>
              <p className={cn('text-sm font-bold font-mono', scoreColor(mediaOs))}>{mediaOs.toFixed(1)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm">⭐</span>
            <div>
              <p className="text-[10px] text-slate-500 uppercase">NPS</p>
              <p className={cn('text-sm font-bold font-mono', scoreColor(nps))}>{nps.toFixed(1)}</p>
            </div>
          </div>

          <div className="ml-auto text-right">
            <p className="text-[10px] text-slate-500 uppercase">Nota Final</p>
            <p className={cn('text-2xl font-bold font-mono', scoreColor(notaFinal / 10))}>
              {notaFinal.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* ── Categorias de critérios ── */}
      {(Object.entries(CAT_CFG) as [CatKey, typeof CAT_CFG[CatKey]][]).map(([cat, cfg]) => {
        const items = (grouped as any)[cat] ?? [];
        if (!items.length) return null;
        const avg = catAvg(cat);
        return (
          <section key={cat} className="space-y-3">
            {/* Cabeçalho da categoria */}
            <div className={cn('flex items-center justify-between px-4 py-3 rounded-lg', cfg.bg, 'border', cfg.border)}>
              <div className="flex items-center gap-3">
                <span className="text-lg">{cfg.icon}</span>
                <div>
                  <h3 className={cn('text-sm font-semibold', cfg.color)}>{cfg.label}</h3>
                  <p className="text-[10px] text-slate-500">Peso {cfg.weight}x · {items.length} critérios</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase">Média</p>
                <p className={cn('text-lg font-bold font-mono', scoreColor(avg))}>{avg.toFixed(1)}</p>
              </div>
            </div>

            {/* Critérios */}
            {items.map((criterion: any) => (
              <CriterionCard
                key={criterion.id}
                criterion={criterion}
                score={getEntry(criterion.id).score}
                obs={getEntry(criterion.id).obs}
                onScore={(v) => setScore(criterion.id, v)}
                onObs={(v) => setObs(criterion.id, v)}
                color={cfg.color}
              />
            ))}
          </section>
        );
      })}

      {/* ── Seção: Preenchimento OS ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-green-400/10 border border-green-400/20">
          <div className="flex items-center gap-3">
            <span className="text-lg">📋</span>
            <div>
              <h3 className="text-sm font-semibold text-green-400">Preenchimento das OS's</h3>
              <p className="text-[10px] text-slate-500">Ordens de Serviço — Módulos (AD) e Inversores (AE)</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase">Média OS</p>
            <p className={cn('text-lg font-bold font-mono', scoreColor(mediaOs))}>{mediaOs.toFixed(1)}</p>
          </div>
        </div>

        {/* OS Módulos */}
        <div className="glass rounded-xl border border-white/5 p-4 space-y-3">
          <p className="text-sm font-semibold text-green-400">OS Módulos</p>
          <ScoreInput value={osModulos} onChange={setOsModulos} />
          <textarea
            value={osObsModulos}
            onChange={(e) => setOsObsModulos(e.target.value)}
            rows={2}
            placeholder="Observações sobre o preenchimento da OS de Módulos…"
            className="w-full text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-flux-orange/40 resize-none"
          />
        </div>

        {/* OS Inversores */}
        <div className="glass rounded-xl border border-white/5 p-4 space-y-3">
          <p className="text-sm font-semibold text-green-400">OS Inversores</p>
          <ScoreInput value={osInversores} onChange={setOsInversores} />
          <textarea
            value={osObsInversores}
            onChange={(e) => setOsObsInversores(e.target.value)}
            rows={2}
            placeholder="Observações sobre o preenchimento da OS de Inversores…"
            className="w-full text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-flux-orange/40 resize-none"
          />
        </div>
      </section>

      {/* ── Seção: NPS ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-yellow-400/10 border border-yellow-400/20">
          <div className="flex items-center gap-3">
            <span className="text-lg">⭐</span>
            <div>
              <h3 className="text-sm font-semibold text-yellow-400">NPS — Avaliação do Cliente</h3>
              <p className="text-[10px] text-slate-500">
                Coletada em ligação pelo Sucesso do Cliente logo após a instalação (AH)
              </p>
            </div>
          </div>
        </div>
        <div className="glass rounded-xl border border-white/5 p-4 space-y-3">
          <ScoreInput value={nps} onChange={setNps} />
          <textarea
            value={npsObs}
            onChange={(e) => setNpsObs(e.target.value)}
            rows={2}
            placeholder="Comentários do cliente ou contexto da coleta do NPS…"
            className="w-full text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-flux-orange/40 resize-none"
          />
        </div>
      </section>

      {/* ── Fórmula explicativa ── */}
      <div className="glass rounded-xl border border-white/5 p-4 space-y-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Como a Nota é calculada</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-[10px] text-slate-500 mb-1">Eficiência</p>
            <p className="text-xs text-slate-300 font-mono">(Seg + Func + Est) / 3</p>
            <p className={cn('text-lg font-bold font-mono mt-1', scoreColor(eficiencia))}>{eficiencia.toFixed(2)}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-[10px] text-slate-500 mb-1">Média OS</p>
            <p className="text-xs text-slate-300 font-mono">(OS Mod. + OS Inv.) / 2</p>
            <p className={cn('text-lg font-bold font-mono mt-1', scoreColor(mediaOs))}>{mediaOs.toFixed(2)}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-[10px] text-slate-500 mb-1">NPS</p>
            <p className="text-xs text-slate-300 font-mono">Nota do cliente</p>
            <p className={cn('text-lg font-bold font-mono mt-1', scoreColor(nps))}>{nps.toFixed(2)}</p>
          </div>
        </div>
        <div className="text-center mt-3 pt-3 border-t border-white/5">
          <p className="text-[10px] text-slate-500 mb-1">Nota Final = (Eficiência + Média OS + NPS) / 3 × 10</p>
          <p className={cn('text-3xl font-bold font-mono', scoreColor(notaFinal / 10))}>
            {notaFinal.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* ── Botão Enviar ── */}
      <div className="flex justify-end pt-2 pb-10">
        <button
          onClick={handleSubmit}
          disabled={submitMutation.isPending || !projectId}
          className={cn(
            'px-10 py-3 rounded-lg font-semibold text-sm transition-all',
            submitMutation.isPending || !projectId
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-flux-orange text-void hover:bg-flux-orange/90 hover:shadow-lg hover:shadow-flux-orange/20',
          )}
        >
          {submitMutation.isPending ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
              Enviando…
            </span>
          ) : (
            'Enviar Avaliação da Obra'
          )}
        </button>
      </div>

      {/* ── Toast de erro ── */}
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
