import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: number;
  submenu?: NavItem[];
}

interface NavigationProps {
  items: NavItem[];
  activeItem?: string;
  onNavigate?: (id: string) => void;
  collapsed?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({
  items,
  activeItem,
  onNavigate,
  collapsed = false,
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleSubmenu = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <nav className={cn(
      'glass fixed left-0 top-0 h-screen flex flex-col transition-all duration-300 z-40',
      collapsed ? 'w-20' : 'w-64'
    )}>
      {/* Logo */}
      <div className="h-20 flex items-center justify-center border-b border-white/5 px-4">
        <div className={cn(
          'flex items-center gap-3 transition-all duration-300',
          collapsed && 'justify-center'
        )}>
          <div className="w-8 h-8 rounded-lg bg-flux-orange flex items-center justify-center text-void font-bold">
            E
          </div>
          {!collapsed && <span className="font-display font-semibold text-white">E-sol</span>}
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-2">
        {items.map((item) => (
          <div key={item.id}>
            <button
              onClick={() => {
                onNavigate?.(item.id);
                if (item.submenu) {
                  toggleSubmenu(item.id);
                }
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group',
                activeItem === item.id
                  ? 'bg-flux-orange/10 text-flux-orange border border-flux-orange/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              <iconify-icon
                icon={item.icon}
                width={20}
                className="flex-shrink-0"
              />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left text-sm font-medium truncate">
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="text-xs font-semibold bg-flux-orange/20 text-flux-orange px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {item.submenu && (
                    <iconify-icon
                      icon="solar:chevron-right-bold-duotone"
                      width={16}
                      className={cn(
                        'transition-transform duration-200',
                        expandedItems.has(item.id) && 'rotate-90'
                      )}
                    />
                  )}
                </>
              )}
            </button>

            {/* Submenu */}
            {!collapsed && item.submenu && expandedItems.has(item.id) && (
              <div className="ml-4 mt-1 space-y-1 border-l border-white/5 pl-3">
                {item.submenu.map((subitem) => (
                  <button
                    key={subitem.id}
                    onClick={() => onNavigate?.(subitem.id)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200',
                      activeItem === subitem.id
                        ? 'text-flux-orange bg-flux-orange/5'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    )}
                  >
                    {subitem.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-white/5 p-3 space-y-2">
        <button className={cn(
          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200',
          collapsed && 'justify-center'
        )}>
          <iconify-icon icon="solar:settings-bold-duotone" width={20} />
          {!collapsed && <span className="text-sm font-medium">Configurações</span>}
        </button>
        <button className={cn(
          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200',
          collapsed && 'justify-center'
        )}>
          <iconify-icon icon="solar:logout-2-bold-duotone" width={20} />
          {!collapsed && <span className="text-sm font-medium">Sair</span>}
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
