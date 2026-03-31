import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to locale string
 */
export function formatDate(date: Date | string, locale = 'pt-BR'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale);
}

/**
 * Format currency to BRL
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Truncate string to max length
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}

/**
 * Delay function for async operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

/**
 * Get color based on status
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'active': 'text-green-400 bg-green-400/10',
    'inactive': 'text-slate-400 bg-slate-400/10',
    'pending': 'text-yellow-400 bg-yellow-400/10',
    'error': 'text-red-400 bg-red-400/10',
    'success': 'text-green-400 bg-green-400/10',
    'warning': 'text-yellow-400 bg-yellow-400/10',
  };
  return colors[status] || 'text-slate-400 bg-slate-400/10';
}

/**
 * Get icon based on module
 */
export function getModuleIcon(module: string): string {
  const icons: Record<string, string> = {
    '360': 'solar:chart-2-bold-duotone',
    'obras': 'solar:hammer-bold-duotone',
    'nps': 'solar:star-bold-duotone',
  };
  return icons[module] || 'solar:layers-minimalistic-bold-duotone';
}

/**
 * Calculate score color
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}

/**
 * Get score badge
 */
export function getScoreBadge(score: number): { color: string; text: string } {
  if (score >= 80) return { color: 'bg-green-500/10 text-green-300 border-green-500/20', text: 'Excelente' };
  if (score >= 60) return { color: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20', text: 'Bom' };
  if (score >= 40) return { color: 'bg-orange-500/10 text-orange-300 border-orange-500/20', text: 'Regular' };
  return { color: 'bg-red-500/10 text-red-300 border-red-500/20', text: 'Insuficiente' };
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
