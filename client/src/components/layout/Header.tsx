import type { ReactNode } from "react";
import { CaretRight } from "@phosphor-icons/react";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface HeaderProps {
  title?: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
  [key: string]: any;
}

export default function Header({ title, subtitle, breadcrumbs, actions }: HeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8 pb-4 border-b border-border">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <CaretRight size={10} />}
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-foreground transition-colors">{crumb.label}</a>
                ) : (
                  <span className="text-foreground font-medium">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        {title && <h1 className="text-2xl font-semibold text-foreground">{title}</h1>}
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
}
