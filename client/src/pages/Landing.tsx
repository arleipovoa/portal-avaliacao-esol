import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

const MODULES = [
  {
    id: "360",
    title: "Avaliacao 360",
    subtitle: "Desempenho & Comportamento",
    description: "Avaliacao completa de desempenho e comportamento entre colaboradores.",
    icon: "\u{1F3AF}",
    route: "/360/dashboard",
    accent: "border-blue-500/30 hover:border-blue-500/60",
    accentText: "text-blue-400",
  },
  {
    id: "obras",
    title: "Avaliacao da Equipe",
    subtitle: "Portal de Obras",
    description: "Avaliacao tecnica das equipes de instalacao por obra.",
    icon: "\u{1F3D7}",
    route: "/obras/dashboard",
    accent: "border-flux-orange/30 hover:border-flux-orange/60",
    accentText: "text-flux-orange",
  },
  {
    id: "nps",
    title: "Pesquisa NPS",
    subtitle: "Satisfacao do Cliente",
    description: "Pesquisas de satisfacao para medir a experiencia dos clientes.",
    icon: "\u{1F4CA}",
    route: "/nps/dashboard",
    accent: "border-green-500/30 hover:border-green-500/60",
    accentText: "text-green-400",
  },
  {
    id: "admin",
    title: "Administracao",
    subtitle: "Usuarios, Areas, Ciclos",
    description: "Cadastros, calculos de bonus e configuracoes do sistema.",
    icon: "\u{2699}",
    route: "/admin/users",
    accent: "border-purple-500/30 hover:border-purple-500/60",
    accentText: "text-purple-400",
  },
];

export default function Landing() {
  const [, navigate] = useLocation();

  return (
    <div className="space-y-10">
      <div className="rounded-2xl border border-white/5 p-8 md:p-12 bg-gradient-to-br from-flux-orange/10 via-transparent to-transparent">
        <p className="text-xs font-semibold text-flux-orange uppercase tracking-widest mb-3">
          Central E-sol
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold text-white mb-2">
          Portal de Avaliacoes
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-xl">
          Selecione um modulo abaixo para acessar avaliacoes, pesquisas e ferramentas de gestao do Grupo E-sol.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MODULES.map((mod) => (
          <button
            key={mod.id}
            onClick={() => navigate(mod.route)}
            className={cn(
              "group text-left rounded-2xl border p-6 transition-all duration-300",
              "hover:scale-[1.01] bg-white/5",
              mod.accent
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
                {mod.icon}
              </div>
              <svg className={cn("w-5 h-5 opacity-50 group-hover:opacity-100 transition", mod.accentText)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">{mod.title}</h3>
            <p className={cn("text-xs font-medium uppercase tracking-wider mb-3", mod.accentText)}>
              {mod.subtitle}
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">{mod.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
