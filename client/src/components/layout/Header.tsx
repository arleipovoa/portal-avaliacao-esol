// Header simples — exibe titulo + subtitulo + actions, ignora breadcrumbs.
// Stub aberto para nao quebrar paginas que ainda usam props variadas.
import type { ReactNode } from "react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  breadcrumbs?: any;
  actions?: ReactNode;
  [key: string]: any;
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8 pb-4 border-b border-white/5">
      <div>
        {title && <h1 className="text-2xl font-semibold text-white">{title}</h1>}
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
}
