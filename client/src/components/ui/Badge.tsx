import React, { HTMLAttributes } from 'react';
import { cn, getStatusColor } from '../../lib/utils';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant | string;
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  dot?: boolean;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>((
  {
    className,
    variant = 'primary',
    size = 'md',
    icon,
    dot = false,
    children,
    ...props
  },
  ref
) => {
  const variantStyles: Record<string, string> = {
    primary: 'bg-flux-orange/10 text-flux-orange border-flux-orange/20',
    secondary: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
    success: 'bg-green-500/10 text-green-300 border-green-500/20',
    error: 'bg-red-500/10 text-red-300 border-red-500/20',
    warning: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
    info: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  };

  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm',
    lg: 'px-3 py-2 text-base',
  };

  const colorStyle = variantStyles[variant] || getStatusColor(variant);

  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium transition-all duration-200',
        sizeStyles[size],
        colorStyle,
        className
      )}
      {...props}
    >
      {dot && (
        <div className="w-1.5 h-1.5 rounded-full bg-current" />
      )}
      {icon && (
        <iconify-icon icon={icon} width={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />
      )}
      {children}
    </div>
  );
});

Badge.displayName = 'Badge';

export default Badge;

