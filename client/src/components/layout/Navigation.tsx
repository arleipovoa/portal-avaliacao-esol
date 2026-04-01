import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  children?: { label: string; route: string }[];
  access?: 'all' | 'admin' | 'obras' | 'nps-editor';
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', icon: '\u{1F3E0}', route: '/', access: 'all' },
  { label: 'Dashboard', icon: '\u{1F4C8}', route: '/dashboard', access: 'admin' },
  {
    label: 'Avaliacao 360',
    icon: '\u{1F3AF}',
    route: '/360',
    access: 'all',
    children: [
      { label: 'Dashboard', route: '/360/dashboard' },
      { label: 'Avaliacoes', route: '/360/avaliacoes' },
    ],
  },
  {
    label: 'Portal de Obras',
    icon: '\u{1F3D7}',
    route: '/obras',
    access: 'obras',
    children: [
      { label: 'Dashboard', route: '/obras/dashboard' },
      { label: 'Avaliacao da Equipe', route: '/obras/avaliacao' },
    ],
  },
  {
    label: 'Pesquisa NPS',
    icon: '\u{1F4CA}',
    route: '/nps',
    access: 'all',
    children: [
      { label: 'Dashboard', route: '/nps/dashboard' },
      { label: 'Respostas', route: '/nps/respostas' },
    ],
  },
  { label: 'Usuarios', icon: '\u{1F465}', route: '/admin/users', access: 'admin' },
];

interface NavigationProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function Navigation({ collapsed = false, onToggle }: NavigationProps) {
  const [location, navigate] = useLocation();
  const { user } = useAuth({ redirectOnUnauthenticated: false });

  const appRole = (user as any)?.appRole || 'employee';
  const jobCategory = (user as any)?.jobCategory || 'administrativo';
  const areaId = (user as any)?.areaId;

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.access === 'all') return true;
    if (item.access === 'admin') return appRole === 'admin';
    if (item.access === 'obras') {
      return jobCategory === 'operacional' || appRole === 'admin' || appRole === 'leader';
    }
    if (item.access === 'nps-editor') {
      return appRole === 'admin' || areaId === 9;
    }
    return true;
  });

  const filterChildren = (item: NavItem) => {
    if (item.route === '/nps' && item.children) {
      const canEditNps = appRole === 'admin' || areaId === 9;
      if (!canEditNps) {
        return item.children.filter((c) => c.route !== '/nps/respostas');
      }
    }
    return item.children;
  };

  const isActive = (route: string) => {
    if (route === '/') return location === '/';
    return location.startsWith(route);
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 ease-out',
        'bg-void/95 backdrop-blur-xl border-r border-white/5',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="h-16 flex items-center px-4 border-b border-white/5 shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-flux-orange/10 border border-flux-orange/20 flex items-center justify-center">
              <span className="text-flux-orange text-sm font-bold">E</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-none">Central E-sol</p>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5">Portal de Avaliacoes</p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-flux-orange/10 border border-flux-orange/20 flex items-center justify-center mx-auto">
            <span className="text-flux-orange text-sm font-bold">E</span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {visibleItems.map((item) => {
          const active = isActive(item.route);
          const children = filterChildren(item);

          return (
            <div key={item.route}>
              <button
                onClick={() => {
                  if (children && children.length > 0) {
                    navigate(children[0].route);
                  } else {
                    navigate(item.route);
                  }
                }}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-flux-orange/10 text-flux-orange border border-flux-orange/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                )}
              >
                <span className="text-base shrink-0">{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className="truncate">{item.label}</span>
                    {children && children.length > 0 && (
                      <svg
                        className={cn('w-3 h-3 ml-auto transition-transform', active && 'rotate-90')}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
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
                        onClick={() => navigate(child.route)}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-all duration-200',
                          childActive
                            ? 'text-flux-orange bg-flux-orange/5'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                        )}
                      >
                        <span className={cn('inline-block w-1.5 h-1.5 rounded-full mr-2', childActive ? 'bg-flux-orange' : 'bg-slate-600')} />
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

      <div className="border-t border-white/5 p-3 shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-flux-orange/10 border border-flux-orange/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-flux-orange">
                {((user as any)?.name || 'U')[0].toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{(user as any)?.name || 'Usuario'}</p>
              <p className="text-[10px] text-slate-500 truncate capitalize">{appRole}</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-flux-orange/10 border border-flux-orange/20 flex items-center justify-center">
              <span className="text-xs font-bold text-flux-orange">
                {((user as any)?.name || 'U')[0].toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-obsidian border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-flux-orange/30 transition-all z-50"
      >
        <svg className={cn('w-3 h-3 transition-transform', collapsed && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </aside>
  );
}
