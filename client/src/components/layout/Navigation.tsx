import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  House,
  ChartLineUp,
  Target,
  HardHat,
  ChartBar,
  GearSix,
  CaretRight,
  CaretLeft,
  List,
  X,
  Sun,
  Moon,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { useState, useEffect } from "react";

interface NavItem {
  label: string;
  icon: Icon;
  route: string;
  children?: { label: string; route: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Início", icon: House, route: "/" },
  { label: "Dashboard", icon: ChartLineUp, route: "/dashboard" },
  {
    label: "Avaliação 360",
    icon: Target,
    route: "/360",
    children: [
      { label: "Dashboard", route: "/360/dashboard" },
      { label: "Avaliações", route: "/360/avaliacoes" },
    ],
  },
  {
    label: "Portal de Obras",
    icon: HardHat,
    route: "/obras",
    children: [
      { label: "Dashboard", route: "/obras/dashboard" },
      { label: "Avaliação da Obra", route: "/obras/avaliacao" },
      { label: "Regras e Critérios", route: "/obras/regras" },
      { label: "Avaliação Cruzada", route: "/obras/avaliacao-cruzada" },
    ],
  },
  {
    label: "Pesquisa NPS",
    icon: ChartBar,
    route: "/nps",
    children: [
      { label: "Dashboard", route: "/nps/dashboard" },
      { label: "Respostas", route: "/nps/respostas" },
    ],
  },
  {
    label: "Admin",
    icon: GearSix,
    route: "/admin",
    children: [
      { label: "Usuários", route: "/admin/users" },
      { label: "Instaladores", route: "/admin/instaladores" },
      { label: "Veículos", route: "/admin/veiculos" },
      { label: "Áreas", route: "/admin/areas" },
      { label: "Ciclos", route: "/admin/cycles" },
      { label: "Calcular Bônus", route: "/admin/calculate" },
    ],
  },
];

interface NavigationProps {
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Navigation({ collapsed = false, onToggle, mobileOpen = false, onMobileClose }: NavigationProps) {
  const [location, navigate] = useLocation();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else if (stored === "light") {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const isActive = (route: string) => {
    if (route === "/") return location === "/";
    return location.startsWith(route);
  };

  const handleNavigate = (item: NavItem) => {
    if (item.children && item.children.length > 0) navigate(item.children[0].route);
    else navigate(item.route);
    onMobileClose?.();
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <span className="text-amber-800 dark:text-amber-300 text-sm font-bold">E</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-sidebar-foreground leading-none">Central E-sol</p>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Portal de Avaliacoes</p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto">
            <span className="text-amber-800 dark:text-amber-300 text-sm font-bold">E</span>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.route);
          const children = item.children;
          const IconComponent = item.icon;

          return (
            <div key={item.route}>
              <button
                onClick={() => handleNavigate(item)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent"
                )}
              >
                <IconComponent size={20} weight={active ? "duotone" : "regular"} className="shrink-0" />
                {!collapsed && (
                  <>
                    <span className="truncate">{item.label}</span>
                    {children && children.length > 0 && (
                      <CaretRight
                        size={12}
                        className={cn("ml-auto transition-transform", active && "rotate-90")}
                      />
                    )}
                  </>
                )}
              </button>

              {!collapsed && active && children && children.length > 0 && (
                <div className="ml-8 mt-1 space-y-0.5">
                  {children.map((child) => {
                    const childActive = location === child.route;
                    return (
                      <button
                        key={child.route}
                        onClick={() => { navigate(child.route); onMobileClose?.(); }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-all duration-200",
                          childActive
                            ? "text-amber-800 dark:text-amber-300 bg-amber-500/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                      >
                        <span className={cn(
                          "inline-block w-1.5 h-1.5 rounded-full mr-2",
                          childActive ? "bg-amber-500" : "bg-muted-foreground/30"
                        )} />
                        {child.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Theme toggle + collapse */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
        >
          {isDark ? <Sun size={20} weight="duotone" /> : <Moon size={20} weight="duotone" />}
          {!collapsed && <span>{isDark ? "Modo claro" : "Modo escuro"}</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full z-40 flex-col transition-all duration-300 ease-out hidden lg:flex",
          "bg-sidebar border-r border-sidebar-border",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent}

        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-amber-500/30 transition-all z-50"
        >
          <CaretLeft size={12} className={cn("transition-transform", collapsed && "rotate-180")} />
        </button>
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={onMobileClose ? undefined : onToggle}
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center text-foreground"
        aria-label="Menu"
      >
        <List size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-sidebar border-r border-sidebar-border flex flex-col animate-in slide-in-from-left duration-300">
            <button
              onClick={onMobileClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <X size={18} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
