import React, { ReactNode, useState } from 'react';
import { cn } from '../../lib/utils';
import Navigation from './Navigation';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: number;
  submenu?: NavItem[];
}

interface MainLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
  activeItem?: string;
  onNavigate?: (id: string) => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  navItems,
  activeItem,
  onNavigate,
}) => {
  const [navCollapsed, setNavCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-void overflow-hidden">
      {/* Navigation Sidebar */}
      <Navigation
        items={navItems}
        activeItem={activeItem}
        onNavigate={onNavigate}
        collapsed={navCollapsed}
      />

      {/* Main Content */}
      <div className={cn(
        'flex-1 flex flex-col transition-all duration-300 overflow-hidden',
        navCollapsed ? 'ml-20' : 'ml-64'
      )}>
        {/* Toggle Button */}
        <button
          onClick={() => setNavCollapsed(!navCollapsed)}
          className="absolute top-4 left-4 z-50 p-2 rounded-lg glass hover:bg-white/10 transition-all duration-200"
        >
          <iconify-icon
            icon={navCollapsed ? 'solar:menu-dots-bold-duotone' : 'solar:menu-dots-bold-duotone'}
            width={20}
          />
        </button>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;

