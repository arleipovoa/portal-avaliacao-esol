import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  type AppModule,
  getLoginPathForCurrentPath,
  persistModule,
  resolveActiveModule,
} from "@/lib/moduleRouting";
import { getStoredProfilePhoto } from "@/lib/profilePhoto";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import { useSidebarResize } from "@/hooks/useSidebarResize";
import {
  ClipboardList, LayoutDashboard, LogOut, PanelLeft,
  Shield, User, type LucideIcon,
} from "lucide-react";
import { BASE_PATH } from "@shared/const";
import { CSSProperties, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

type MenuItem = { icon: LucideIcon; label: string; path: string };

const MODULE_MENU_ITEMS: Record<AppModule, MenuItem[]> = {
  obras: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/modulo-obras/dashboard" },
    { icon: ClipboardList, label: "Avaliações", path: "/modulo-obras/avaliacoes" },
  ],
  "360": [
    { icon: LayoutDashboard, label: "Dashboard", path: "/modulo-360/dashboard" },
    { icon: ClipboardList, label: "Avaliações", path: "/modulo-360/avaliacoes" },
  ],
  nps: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/modulo-nps/dashboard" },
  ],
};

const ADMIN_MENU_ITEM: MenuItem = {
  icon: Shield,
  label: "Administração",
  path: "/admin",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarWidth } = useSidebarResize(false);
  const { loading, user } = useAuth();

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    // Redirect to login
    if (typeof window !== "undefined") {
      const loginPath = getLoginPathForCurrentPath(window.location.pathname);
      const fullLoginPath = `${BASE_PATH}${loginPath}`;
      if (window.location.pathname !== fullLoginPath) {
        window.location.href = fullLoginPath;
      }
    }
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <div className="w-12 h-12 rounded-full bg-[#ffcc29] flex items-center justify-center">
              <span className="text-[#12110f] font-bold text-xl">E</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Avaliação E-sol
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Faça login para acessar o sistema de avaliação.
            </p>
          </div>
          <Button
            onClick={() => {
              const loginPath = getLoginPathForCurrentPath(window.location.pathname);
              window.location.href = `${BASE_PATH}${loginPath}`;
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all bg-[#ffcc29] text-[#12110f] hover:bg-[#e6b800]"
          >
            Entrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <DashboardLayoutContent>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
};

function DashboardLayoutContent({ children }: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { isResizing, startResizing } = useSidebarResize(isCollapsed);
  const isMobile = useIsMobile();
  const activeModule = useMemo(() => resolveActiveModule(location), [location]);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  const appRole = (user as any)?.appRole || "employee";
  const jobCategory = (user as any)?.jobCategory || "administrativo";

  useEffect(() => {
    if (activeModule === "obras" && jobCategory !== "operacional" && appRole !== "admin") {
      persistModule("360");
      setLocation("/modulo-360/dashboard");
    } else {
      persistModule(activeModule);
    }
  }, [activeModule, jobCategory, appRole, setLocation]);

  const moduleMenuItems = useMemo(
    () => MODULE_MENU_ITEMS[activeModule] ?? MODULE_MENU_ITEMS.obras,
    [activeModule]
  );

  const menuItems = useMemo(
    () => (appRole === "admin" ? [...moduleMenuItems, ADMIN_MENU_ITEM] : moduleMenuItems),
    [appRole, moduleMenuItems]
  );

  const activeMenuItem = menuItems.find((item) => location === item.path || location.startsWith(`${item.path}/`));

  useEffect(() => {
    setProfilePhoto(getStoredProfilePhoto(user?.id));
  }, [user?.id, location]);

  return (
    <>
      <div className="relative" data-sidebar-resize-ref>
        <Sidebar collapsible="icon" className="border-r-0" disableTransition={isResizing}>
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent rounded-lg transition-colors focus:outline-none shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-sidebar-foreground/70" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-[#ffcc29] flex items-center justify-center shrink-0">
                    <span className="text-[#12110f] font-bold text-xs">E</span>
                  </div>
                  <span className="font-semibold tracking-tight truncate text-sidebar-foreground">
                    Avaliação
                  </span>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map((item) => {
                const isActive = location === item.path || location.startsWith(`${item.path}/`);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className="h-10 transition-all font-normal"
                    >
                      <item.icon className={`h-4 w-4 ${isActive ? "text-[#ffcc29]" : ""}`} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-sidebar-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none">
                  <Avatar className="h-9 w-9 border border-sidebar-border shrink-0">
                    {profilePhoto ? <AvatarImage src={profilePhoto} alt={user?.name || "Usuário"} /> : null}
                    <AvatarFallback className="text-xs font-medium bg-[#ffcc29] text-[#12110f]">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none text-sidebar-foreground">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-sidebar-foreground/60 truncate mt-1.5">
                      {appRole === "admin" ? "Administrador" : appRole === "leader" ? "Líder" : "Colaborador"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setLocation("/perfil")} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Meu Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[#ffcc29]/30 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={startResizing}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <span className="tracking-tight text-foreground">
                {activeMenuItem?.label ?? "Menu"}
              </span>
            </div>
          </div>
        )}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
