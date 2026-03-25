export type AppModule = "obras" | "360" | "nps";

const MODULE_STORAGE_KEY = "esol-active-module";

const LOGIN_PATHS: Record<AppModule, string> = {
  obras: "/login/obras",
  "360": "/login/360",
  nps: "/login/nps",
};

const DASHBOARD_PATHS: Record<AppModule, string> = {
  obras: "/modulo-obras/dashboard",
  "360": "/modulo-360/dashboard",
  nps: "/modulo-nps/dashboard",
};

export const DEFAULT_MODULE: AppModule = "obras";

export function normalizeModule(value?: string | null): AppModule | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();

  if (
    normalized === "obras" ||
    normalized === "modulo-obras" ||
    normalized === "obra"
  ) {
    return "obras";
  }

  if (
    normalized === "360" ||
    normalized === "360º" ||
    normalized === "360o" ||
    normalized === "avaliacao-360" ||
    normalized === "avaliacao360" ||
    normalized === "modulo-360"
  ) {
    return "360";
  }

  if (
    normalized === "nps" ||
    normalized === "modulo-nps" ||
    normalized === "net-promoter-score"
  ) {
    return "nps";
  }

  return null;
}

export function getLoginPathForModule(module: AppModule): string {
  return LOGIN_PATHS[module];
}

export function getDashboardPathForModule(module: AppModule): string {
  return DASHBOARD_PATHS[module];
}

export function getModuleFromPath(pathname: string): AppModule | null {
  const path = pathname.toLowerCase();

  if (path.includes("/modulo-obras") || path.includes("/login/obras")) {
    return "obras";
  }

  if (
    path.includes("/modulo-360") ||
    path.includes("/login/360") ||
    path.includes("/avaliacoes")
  ) {
    return "360";
  }

  if (path.includes("/modulo-nps") || path.includes("/login/nps")) {
    return "nps";
  }

  return null;
}

export function getModuleFromSearch(search: string): AppModule | null {
  const params = new URLSearchParams(search);
  return normalizeModule(params.get("module") ?? params.get("modulo"));
}

export function persistModule(module: AppModule): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(MODULE_STORAGE_KEY, module);
  } catch {
    // noop
  }
}

export function getPersistedModule(): AppModule | null {
  if (typeof window === "undefined") return null;
  try {
    return normalizeModule(window.sessionStorage.getItem(MODULE_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function resolveActiveModule(pathname: string): AppModule {
  return getModuleFromPath(pathname) ?? getPersistedModule() ?? DEFAULT_MODULE;
}

export function getLoginPathForCurrentPath(pathname: string): string {
  return getLoginPathForModule(resolveActiveModule(pathname));
}
