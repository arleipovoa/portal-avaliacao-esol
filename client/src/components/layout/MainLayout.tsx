import React, { ReactNode, useState } from "react";
import { cn } from "../../lib/utils";
import Navigation from "./Navigation";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [navCollapsed, setNavCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-void overflow-hidden">
      <Navigation collapsed={navCollapsed} onToggle={() => setNavCollapsed(!navCollapsed)} />

      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 overflow-hidden",
          navCollapsed ? "ml-20" : "ml-64"
        )}
      >
        <div className="flex-1 overflow-y-auto">
          {/* Container central com largura maxima — em telas pequenas ocupa tudo,
              em telas grandes (>1280px) limita pra leitura mais confortavel.
              Padding lateral cresce com a tela. */}
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
