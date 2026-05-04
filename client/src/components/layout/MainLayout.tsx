import React, { ReactNode, useState } from "react";
import { cn } from "../../lib/utils";
import Navigation from "./Navigation";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Navigation
        collapsed={navCollapsed}
        onToggle={() => {
          if (window.innerWidth < 1024) {
            setMobileOpen(true);
          } else {
            setNavCollapsed(!navCollapsed);
          }
        }}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 overflow-hidden",
          "lg:ml-64",
          navCollapsed && "lg:ml-16"
        )}
      >
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
