// Devolve true para qualquer string "verdadeira" (1, true, yes, on)
function envFlag(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized);
}

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // ── DEV ONLY ──
  // Quando AUTH_BYPASS=1, o backend assume um usuario admin fake automaticamente
  // (definido por AUTH_BYPASS_EMAIL ou, por padrao, arlei@grupoesol.com.br).
  // Permite navegar pelo app sem passar pela tela de login durante o desenvolvimento.
  // ATENCAO: NUNCA habilitar em producao real. Religar auth antes do go-live.
  authBypass: envFlag(process.env.AUTH_BYPASS),
  authBypassEmail: process.env.AUTH_BYPASS_EMAIL ?? "arlei@grupoesol.com.br",
};
