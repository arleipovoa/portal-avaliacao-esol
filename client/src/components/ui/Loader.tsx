import React from 'react';
import { cn } from '../../lib/utils';

interface LoaderProps {
  variant?: 'spinner' | 'pulse' | 'dots' | 'bar';
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'secondary';
  fullScreen?: boolean;
  message?: string;
}

const Loader: React.FC<LoaderProps> = ({
  variant = 'spinner',
  size = 'md',
  color = 'primary',
  fullScreen = false,
  message,
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const colorMap = {
    primary: 'border-flux-orange',
    white: 'border-white',
    secondary: 'border-slate-400',
  };

  const containerClass = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-void/80 backdrop-blur-sm z-50'
    : 'flex items-center justify-center';

  const loaderContent = (
    <div className="flex flex-col items-center gap-4">
      {variant === 'spinner' && (
        <div
          className={cn(
            'border-2 rounded-full animate-spin',
            sizeMap[size],
            `border-${colorMap[color]}/20 border-t-${colorMap[color]}`
          )}
          style={{
            borderColor: color === 'primary' ? 'rgba(255, 204, 41, 0.2)' : undefined,
            borderTopColor: color === 'primary' ? 'rgb(255, 204, 41)' : undefined,
          }}
        />
      )}

      {variant === 'pulse' && (
        <div
          className={cn(
            'rounded-full animate-pulse-glow',
            sizeMap[size],
            color === 'primary' ? 'bg-flux-orange' : 'bg-white'
          )}
        />
      )}

      {variant === 'dots' && (
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'rounded-full animate-bounce',
                size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4',
                color === 'primary' ? 'bg-flux-orange' : 'bg-white'
              )}
              style={{
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      {variant === 'bar' && (
        <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full animate-pulse',
              color === 'primary' ? 'bg-flux-orange' : 'bg-white'
            )}
            style={{
              width: '30%',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
        </div>
      )}

      {message && <p className="text-sm text-slate-400 text-center">{message}</p>}
    </div>
  );

  return (
    <div className={containerClass}>
      {loaderContent}
    </div>
  );
};

export default Loader;

// Skeleton Loading Component
interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'bg-gradient-to-r from-slate-800 to-slate-700 animate-pulse rounded-lg',
            className
          )}
        />
      ))}
    </>
  );
};
