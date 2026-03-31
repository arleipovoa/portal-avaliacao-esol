import React from 'react';
import { cn } from '../../lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  actions,
  breadcrumbs,
}) => {
  return (
    <div className="glass sticky top-0 z-30 border-b border-white/5">
      <div className="px-8 py-6 space-y-4">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <iconify-icon icon="solar:chevron-right-bold-duotone" width={14} />
                )}
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-white transition-colors">
                    {crumb.label}
                  </a>
                ) : (
                  <span className={index === breadcrumbs.length - 1 ? 'text-white' : ''}>
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Title and Actions */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-display font-semibold text-white mb-2">
              {title}
            </h1>
            {subtitle && (
              <p className="text-slate-400 text-sm">{subtitle}</p>
            )}
          </div>

          {actions && (
            <div className="flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
