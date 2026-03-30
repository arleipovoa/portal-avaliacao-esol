/**
 * Access Control Module
 * Defines permissions for different modules based on user role, jobCategory, and area
 */

import { User } from "../../drizzle/schema";

export type ModuleType = "360" | "obras" | "nps";
export type AccessLevel = "none" | "viewer" | "editor" | "admin";

export interface ModuleAccess {
  module: ModuleType;
  access: AccessLevel;
  canView: boolean;
  canEdit: boolean;
}

/**
 * Determine module access for a user
 */
export function getUserModuleAccess(user: User): ModuleAccess[] {
  const access: ModuleAccess[] = [];

  // ─── Módulo 360° (Avaliação Global) ───
  // Todos têm acesso
  access.push({
    module: "360",
    access: user.appRole === "admin" ? "admin" : "editor",
    canView: true,
    canEdit: true,
  });

  // ─── Módulo de Obras ───
  // Operacionais têm acesso total
  // Administrativos específicos (líderes de instalação, etc) têm acesso
  if (user.jobCategory === "operacional") {
    access.push({
      module: "obras",
      access: "editor",
      canView: true,
      canEdit: true,
    });
  } else if (user.appRole === "admin") {
    // Admin tem acesso total
    access.push({
      module: "obras",
      access: "admin",
      canView: true,
      canEdit: true,
    });
  } else if (user.appRole === "leader") {
    // Líderes podem ter acesso se estiverem alocados em obras
    // Esta verificação será feita no endpoint específico
    access.push({
      module: "obras",
      access: "editor",
      canView: true,
      canEdit: true,
    });
  } else {
    // Outros usuários administrativos não têm acesso
    access.push({
      module: "obras",
      access: "none",
      canView: false,
      canEdit: false,
    });
  }

  // ─── Módulo NPS ───
  // Todos podem visualizar
  access.push({
    module: "nps",
    access: "viewer",
    canView: true,
    canEdit: false,
  });

  // Admin e "Sucesso do Cliente" podem editar
  if (user.appRole === "admin") {
    access[access.length - 1].access = "admin";
    access[access.length - 1].canEdit = true;
  } else if (user.areaId) {
    // Verificar se o usuário está na área "Sucesso do Cliente"
    // Esta verificação será feita com base no nome da área
    // Por enquanto, apenas admin pode editar
  }

  return access;
}

/**
 * Check if user has access to a specific module
 */
export function hasModuleAccess(user: User, module: ModuleType, action: "view" | "edit" = "view"): boolean {
  const access = getUserModuleAccess(user);
  const moduleAccess = access.find((m) => m.module === module);

  if (!moduleAccess) return false;

  if (action === "view") {
    return moduleAccess.canView;
  } else if (action === "edit") {
    return moduleAccess.canEdit;
  }

  return false;
}

/**
 * Check if user can edit NPS (Admin or "Sucesso do Cliente" area)
 */
export function canEditNPS(user: User, areaName?: string): boolean {
  if (user.appRole === "admin") return true;
  if (areaName === "Sucesso do Cliente") return true;
  return false;
}

/**
 * Check if user can access obras module
 * Operacionais e Líderes têm acesso
 */
export function canAccessObras(user: User): boolean {
  if (user.appRole === "admin") return true;
  if (user.jobCategory === "operacional") return true;
  if (user.appRole === "leader") return true;
  return false;
}

/**
 * Get available modules for a user
 */
export function getAvailableModules(user: User): ModuleType[] {
  const modules: ModuleType[] = ["360"]; // Todos têm acesso ao 360

  if (canAccessObras(user)) {
    modules.push("obras");
  }

  modules.push("nps"); // Todos podem visualizar NPS

  return modules;
}
