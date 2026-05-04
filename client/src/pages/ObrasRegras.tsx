import { cn } from '@/lib/utils';

// ── Dados dos critérios (espelham mockObraCriteria.ts) ─────────────────────
const CRITERIOS = {
  seguranca: {
    label: 'Segurança', icon: '🛡️', colRef: 'G – K', weight: 2,
    color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20',
    mediaCol: 'L',
    items: [
      { id: 1, name: 'Uso de EPI/EPC',     desc: 'Capacete, luvas, óculos e cinto de segurança utilizados corretamente.' },
      { id: 2, name: 'APR INV.',            desc: 'Análise Preliminar de Risco dos Inversores realizada antes do início.' },
      { id: 3, name: 'APR MOD.',            desc: 'Análise Preliminar de Risco dos Módulos realizada antes do início.' },
      { id: 4, name: 'Acidente / Avaria',   desc: 'Ausência de acidentes com pessoas ou avarias em equipamentos durante a obra.' },
      { id: 5, name: 'Esquecimento',        desc: 'Nenhum item foi esquecido ou ficou pendente no local da instalação.' },
    ],
  },
  funcionalidade: {
    label: 'Funcionalidade', icon: '⚙️', colRef: 'M – Q', weight: 2,
    color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20',
    mediaCol: 'R',
    items: [
      { id: 6,  name: 'Identificação',       desc: 'Cabos e equipamentos corretamente identificados com etiquetas legíveis.' },
      { id: 7,  name: 'Configuração INV',    desc: 'Inversor configurado conforme projeto técnico e manual do fabricante.' },
      { id: 8,  name: 'Placa Adv.',          desc: 'Placa de advertência instalada em local visível e legível.' },
      { id: 9,  name: 'Prejuízo Financeiro', desc: 'Obra concluída sem causar danos, perdas materiais ou prejuízo financeiro ao cliente.' },
      { id: 10, name: 'Lacre',               desc: 'Lacres aplicados corretamente nos equipamentos conforme procedimento.' },
    ],
  },
  estetica: {
    label: 'Estética', icon: '✨', colRef: 'S – AB', weight: 1,
    color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20',
    mediaCol: 'AC',
    items: [
      { id: 11, name: 'Montagem MOD.',          desc: 'Módulos alinhados, nivelados e sem desvios visíveis entre fileiras.' },
      { id: 12, name: 'Montagem INV',            desc: 'Inversor montado conforme norma: posição, ventilação e fixação adequadas.' },
      { id: 13, name: 'Cabeamento',              desc: 'Cabos organizados, fixados com abraçadeiras e sem exposição ao sol direto.' },
      { id: 14, name: 'Eletroduto / Corrugado', desc: 'Corrugados e eletrodutos íntegros (sem cortes), bem fixados e alinhados.' },
      { id: 15, name: 'Telhado / Estrutura',    desc: 'Telhado e estrutura preservados após a instalação, sem telhas quebradas.' },
      { id: 16, name: 'Ponto de Conexão',       desc: 'Ponto de conexão executado conforme norma ABNT NBR 5410 / injetora.' },
      { id: 17, name: 'Aterramento',             desc: 'Sistema de aterramento instalado e identificado corretamente.' },
      { id: 18, name: 'Quadros',                 desc: 'Quadros elétricos organizados, com disjuntores identificados e sem folgas.' },
      { id: 19, name: 'Imagens Drone',           desc: 'Imagens aéreas registradas com qualidade suficiente para documentação.' },
      { id: 20, name: 'Limpeza Instalação',      desc: 'Local entregue completamente limpo, sem resíduos de material.' },
    ],
  },
} as const;

const OS_ITEMS = [
  { col: 'AD', name: 'OS Módulos',    desc: 'Ordem de Serviço dos Módulos preenchida corretamente pela equipe.' },
  { col: 'AE', name: 'OS Inversores', desc: 'Ordem de Serviço dos Inversores preenchida corretamente pela equipe.' },
];

const ESCALA = [
  { faixa: '9,0 – 10,0', label: 'Excelente',  cor: 'bg-green-500/20 text-green-400  border-green-500/20' },
  { faixa: '7,0 –  8,9', label: 'Bom',         cor: 'bg-blue-500/20  text-blue-400   border-blue-500/20'  },
  { faixa: '5,0 –  6,9', label: 'Razoável',    cor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20' },
  { faixa: '3,0 –  4,9', label: 'Ruim',        cor: 'bg-orange-500/20 text-orange-400 border-orange-500/20' },
  { faixa: '0,0 –  2,9', label: 'Péssimo',     cor: 'bg-red-500/20   text-red-400    border-red-500/20'   },
];

export default function ObrasRegras() {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">

      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-flux-orange uppercase tracking-widest mb-1">Portal de Obras</p>
          <h1 className="text-2xl font-display font-semibold text-foreground">Regras e Critérios de Avaliação</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Referência completa dos critérios, categorias, pesos e fórmula de cálculo da Nota da Obra.
          </p>
        </div>
        <a href="/obras/avaliacao"
          className="shrink-0 text-xs text-slate-500 hover:text-flux-orange transition-colors flex items-center gap-1 mt-1 border border-border rounded-lg px-3 py-1.5 hover:border-flux-orange/30">
          ✏️ Ir avaliar
        </a>
      </div>

      {/* Escala de notas */}
      <section className="glass rounded-xl border border-border p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Escala de Notas (0 a 10)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {ESCALA.map(({ faixa, label, cor }) => (
            <div key={label} className={cn('rounded-lg border px-3 py-2 text-center', cor)}>
              <p className="text-xs font-bold">{label}</p>
              <p className="text-[10px] opacity-70 mt-0.5">{faixa}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          Todas as notas são de <strong className="text-foreground">0 a 10</strong> com incremento de 0,5.
          Itens marcados como <strong className="text-foreground">Não avaliado</strong> são excluídos da média da respectiva categoria — a nota deles não é contabilizada nem como zero.
        </p>
      </section>

      {/* Categorias */}
      {(Object.entries(CRITERIOS) as [keyof typeof CRITERIOS, typeof CRITERIOS[keyof typeof CRITERIOS]][]).map(([key, cat]) => (
        <section key={key} className="space-y-3">
          {/* Cabeçalho da categoria */}
          <div className={cn('flex items-center justify-between px-4 py-3 rounded-lg', cat.bg, 'border', cat.border)}>
            <div className="flex items-center gap-3">
              <span className="text-xl">{cat.icon}</span>
              <div>
                <h2 className={cn('text-sm font-semibold', cat.color)}>{cat.label}</h2>
                <p className="text-[10px] text-slate-500">
                  {cat.items.length} critérios · Peso {cat.weight}x · Colunas {cat.colRef} · Média → col. {cat.mediaCol}
                </p>
              </div>
            </div>
            <div className={cn('text-xs font-bold px-3 py-1 rounded-full border', cat.bg, cat.border, cat.color)}>
              Peso {cat.weight}×
            </div>
          </div>

          {/* Tabela de critérios */}
          <div className="glass rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2 text-[10px] text-slate-500 uppercase font-semibold w-6">#</th>
                  <th className="text-left px-4 py-2 text-[10px] text-slate-500 uppercase font-semibold">Critério</th>
                  <th className="text-left px-4 py-2 text-[10px] text-slate-500 uppercase font-semibold">O que é avaliado</th>
                </tr>
              </thead>
              <tbody>
                {cat.items.map((item, idx) => (
                  <tr key={item.id} className={cn('border-b border-border last:border-0', idx % 2 === 0 ? '' : 'bg-foreground/[0.02]')}>
                    <td className="px-4 py-3 text-xs text-slate-600 font-mono">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <p className={cn('text-xs font-semibold', cat.color)}>{item.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {/* Preenchimento das OS's */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-green-400/10 border border-green-400/20">
          <div className="flex items-center gap-3">
            <span className="text-xl">📋</span>
            <div>
              <h2 className="text-sm font-semibold text-green-400">Preenchimento das OS's</h2>
              <p className="text-[10px] text-slate-500">2 campos · Colunas AD e AE · Média → col. AF</p>
            </div>
          </div>
          <div className="text-xs font-bold px-3 py-1 rounded-full border bg-green-400/10 border-green-400/20 text-green-400">
            Componente independente
          </div>
        </div>
        <div className="glass rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2 text-[10px] text-slate-500 uppercase font-semibold w-16">Col.</th>
                <th className="text-left px-4 py-2 text-[10px] text-slate-500 uppercase font-semibold">Campo</th>
                <th className="text-left px-4 py-2 text-[10px] text-slate-500 uppercase font-semibold">O que é avaliado</th>
              </tr>
            </thead>
            <tbody>
              {OS_ITEMS.map((item, idx) => (
                <tr key={item.col} className={cn('border-b border-border last:border-0', idx % 2 === 0 ? '' : 'bg-foreground/[0.02]')}>
                  <td className="px-4 py-3 text-xs text-slate-600 font-mono">{item.col}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-green-400">{item.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 leading-relaxed">{item.desc}</td>
                </tr>
              ))}
              <tr className="bg-foreground/[0.02]">
                <td className="px-4 py-3 text-xs text-slate-600 font-mono">AF</td>
                <td className="px-4 py-3 text-xs font-semibold text-green-300">Média OS</td>
                <td className="px-4 py-3 text-xs text-slate-400">(OS Módulos + OS Inversores) ÷ 2</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* NPS */}
      <section className="space-y-3">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-yellow-400/10 border border-yellow-400/20">
          <span className="text-xl">⭐</span>
          <div>
            <h2 className="text-sm font-semibold text-yellow-400">NPS — Avaliação do Cliente</h2>
            <p className="text-[10px] text-slate-500">1 campo · Coluna AH</p>
          </div>
        </div>
        <div className="glass rounded-xl border border-border p-4 text-xs text-slate-400 leading-relaxed space-y-2">
          <p>
            O <strong className="text-foreground">NPS (Net Promoter Score)</strong> é a nota de satisfação dada pelo cliente de 0 a 10.
            É coletada pela equipe de <strong className="text-foreground">Sucesso do Cliente</strong> em ligação telefônica logo após a conclusão da instalação.
          </p>
          <p>
            Quando a ligação não foi realizada ou o cliente não atendeu, o campo deve ser marcado como <strong className="text-foreground">Não avaliado</strong> para não impactar a nota final.
          </p>
        </div>
      </section>

      {/* Fórmula de cálculo */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span>🧮</span> Fórmula de Cálculo da Nota Final
        </h2>

        {/* Passo a passo */}
        <div className="space-y-3">
          {[
            {
              step: '1', title: 'Média de cada categoria',
              desc: 'Soma das notas dos critérios avaliados ÷ quantidade de critérios avaliados (itens N/A são ignorados).',
              formula: 'Nota Seg = média(EPI, APR INV, APR MOD, Acidente, Esquecimento)',
              color: 'text-red-400', bg: 'bg-red-400/5', border: 'border-red-400/15',
            },
            {
              step: '2', title: 'Eficiência (col. AG)',
              desc: 'Média simples entre as três categorias avaliadas.',
              formula: 'Eficiência = (Nota Seg + Nota Func + Nota Est) ÷ N_categorias_avaliadas',
              color: 'text-foreground', bg: 'bg-white/[0.03]', border: 'border-border',
            },
            {
              step: '3', title: 'Média OS (col. AF)',
              desc: 'Média das duas Ordens de Serviço avaliadas.',
              formula: 'Média OS = (OS Módulos + OS Inversores) ÷ N_OS_avaliadas',
              color: 'text-green-400', bg: 'bg-green-400/5', border: 'border-green-400/15',
            },
            {
              step: '4', title: 'Nota Final (col. AI)',
              desc: 'Média simples dos três componentes (Eficiência, Média OS, NPS). Resultado na escala 0–10.',
              formula: 'Nota Final = média(Eficiência, Média OS, NPS)',
              color: 'text-flux-orange', bg: 'bg-flux-orange/5', border: 'border-flux-orange/15',
            },
          ].map(({ step, title, desc, formula, color, bg, border }) => (
            <div key={step} className={cn('rounded-xl border p-4 space-y-2', bg, border)}>
              <div className="flex items-center gap-3">
                <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border', bg, border, color)}>
                  {step}
                </div>
                <p className={cn('text-sm font-semibold', color)}>{title}</p>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pl-9">{desc}</p>
              <div className="pl-9">
                <code className="text-xs bg-black/30 rounded px-2 py-1 text-foreground font-mono">{formula}</code>
              </div>
            </div>
          ))}
        </div>

        {/* Exemplo numérico */}
        <div className="glass rounded-xl border border-border p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Exemplo — Projeto P774</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            {[
              { label: 'Seg.',  value: '6,0' },
              { label: 'Func.', value: '8,0' },
              { label: 'Est.',  value: '8,1' },
              { label: 'Eficiência', value: '7,37' },
              { label: 'OS Mod.', value: '10,0' },
              { label: 'OS Inv.', value: '7,0' },
              { label: 'Média OS', value: '8,5' },
              { label: 'NPS',      value: '10,0' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-foreground/5 rounded-lg p-2">
                <p className="text-[10px] text-slate-500">{label}</p>
                <p className="text-sm font-bold font-mono text-foreground">{value}</p>
              </div>
            ))}
          </div>
          <div className="text-center pt-2 border-t border-border">
            <p className="text-xs text-slate-500 font-mono mb-1">(7,37 + 8,5 + 10,0) ÷ 3 = 8,62</p>
            <p className="text-2xl font-bold font-mono text-green-400">8,62 / 10</p>
          </div>
        </div>
      </section>

      {/* Tabela de Premiação */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span>🏆</span> Tabela de Premiação por Categoria
        </h2>
        <div className="glass rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-foreground/[0.02]">
                <th className="text-left px-4 py-3 text-[10px] text-slate-500 uppercase font-semibold">Categoria</th>
                <th className="text-right px-4 py-3 text-[10px] text-slate-500 uppercase font-semibold">Prêmio Base</th>
                <th className="text-right px-4 py-3 text-[10px] text-slate-500 uppercase font-semibold">Com nota 10,0</th>
                <th className="text-right px-4 py-3 text-[10px] text-slate-500 uppercase font-semibold">Com nota 8,0</th>
              </tr>
            </thead>
            <tbody>
              {([
                { cat: 'B1', base: 200  },
                { cat: 'B2', base: 300  },
                { cat: 'B3', base: 500  },
                { cat: 'B4', base: 750  },
                { cat: 'B5', base: 1000 },
                { cat: 'B6', base: 1500 },
                { cat: 'B7', base: 2000 },
              ] as const).map(({ cat, base }, idx) => (
                <tr key={cat} className={cn('border-b border-border last:border-0', idx % 2 === 0 ? '' : 'bg-foreground/[0.02]')}>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold text-flux-orange bg-flux-orange/10 border border-flux-orange/20 rounded px-2 py-0.5">{cat}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-foreground font-mono">R$ {base.toLocaleString('pt-BR')}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs text-green-400 font-mono">R$ {base.toLocaleString('pt-BR')}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs text-yellow-400 font-mono">R$ {(base * 0.8).toLocaleString('pt-BR')}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="glass rounded-xl border border-border p-4 space-y-2 text-xs text-slate-400">
          <p>
            <strong className="text-foreground">Correção proporcional:</strong>{' '}
            O prêmio base é multiplicado pela nota final dividida por 10.
          </p>
          <div className="bg-black/20 rounded-lg px-3 py-2">
            <code className="font-mono text-foreground">Prêmio = Prêmio Base × (Nota Final ÷ 10)</code>
          </div>
          <p>
            Exemplo: categoria B3 (R$ 500), nota 8,5 → <strong className="text-flux-orange">R$ 425,00</strong>
          </p>
          <p className="text-red-400">
            ⚠️ Se houver prejuízo financeiro registrado, o prêmio é automaticamente zerado e a avaliação desconsiderada.
          </p>
        </div>
      </section>

      {/* Rodapé de referência */}
      <div className="glass rounded-xl border border-border p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Referência</p>
        <p className="text-xs text-slate-500">
          Planilha: <span className="text-foreground">Avaliação de Qualidade de Obras 2025</span> · aba <span className="text-foreground">Notas</span> · linha 3 (cabeçalho de critérios) · colunas G–AI.
        </p>
      </div>

    </div>
  );
}
