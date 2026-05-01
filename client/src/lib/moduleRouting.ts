// SIMPLIFICADO no reboot — sem login, sem login-paths por modulo.
export type AppModule = "obras" | "360" | "nps";

const DASHBOARD_PATHS: Record<AppModule, string> = {
  obras: "/obras/dashboard",
  "360": "/360/dashboard",
  nps: "/nps/dashboard",
};

export const DEFAULT_MODULE: AppModule = "obras";

export function getDashboardPathForModule(m: AppModule): string {
  return DASHBOARD_PATHS[m];
}

export function resolveActiveModule(pathname: string): AppModule {
  if (pathname.includes("/obras")) return "obras";
  if (pathname.includes("/360")) return "360";
  if (pathname.includes("/nps")) return "nps";
  return DEFAULT_MODULE;
}

export function persistModule(_m: AppModule): void {
  /* no-op no reboot */
}

export function getLoginPathForCurrentPath(_pathname: string): string {
  return "/";
}
