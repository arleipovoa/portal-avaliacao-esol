import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Target,
  HardHat,
  ChartBar,
  GearSix,
  ArrowRight,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

interface Module {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: Icon;
  route: string;
  accent: string;
  iconBg: string;
}

const MODULES: Module[] = [
  {
    id: "360",
    title: "Avaliacao 360",
    subtitle: "Desempenho & Comportamento",
    description: "Avaliacao completa de desempenho e comportamento entre colaboradores.",
    icon: Target,
    route: "/360/dashboard",
    accent: "border-blue-500/20 hover:border-blue-500/40 hover:shadow-blue-500/5",
    iconBg: "bg-blue-500/10 text-blue-500 dark:text-blue-400",
  },
  {
    id: "obras",
    title: "Avaliacao da Equipe",
    subtitle: "Portal de Obras",
    description: "Avaliacao tecnica das equipes de instalacao por obra.",
    icon: HardHat,
    route: "/obras/dashboard",
    accent: "border-primary/20 hover:border-primary/40 hover:shadow-primary/5",
    iconBg: "bg-primary/10 text-primary",
  },
  {
    id: "nps",
    title: "Pesquisa NPS",
    subtitle: "Satisfacao do Cliente",
    description: "Pesquisas de satisfacao para medir a experiencia dos clientes.",
    icon: ChartBar,
    route: "/nps/dashboard",
    accent: "border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-emerald-500/5",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "admin",
    title: "Administracao",
    subtitle: "Usuarios, Areas, Ciclos",
    description: "Cadastros, calculos de bonus e configuracoes do sistema.",
    icon: GearSix,
    route: "/admin/users",
    accent: "border-violet-500/20 hover:border-violet-500/40 hover:shadow-violet-500/5",
    iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
];

export default function Landing() {
  const [, navigate] = useLocation();

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="rounded-2xl border border-border bg-card p-8 md:p-12">
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
          Central E-sol
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-2">
          Portal de Avaliacoes
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-xl">
          Selecione um modulo abaixo para acessar avaliacoes, pesquisas e ferramentas de gestao do Grupo E-sol.
        </p>
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {MODULES.map((mod) => {
          const IconComp = mod.icon;
          return (
            <button
              key={mod.id}
              onClick={() => navigate(mod.route)}
              className={cn(
                "group text-left rounded-2xl border bg-card p-6 transition-all duration-300 hover:shadow-lg",
                mod.accent
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", mod.iconBg)}>
                  <IconComp size={24} weight="duotone" />
                </div>
                <ArrowRight
                  size={18}
                  className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">{mod.title}</h3>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                {mod.subtitle}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">{mod.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
