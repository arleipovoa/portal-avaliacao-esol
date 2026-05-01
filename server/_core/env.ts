// Configuracao de ambiente para o app pos-reboot.
// Sem login, sem OAuth, sem Forge: apenas o que rodamos de verdade.

export const ENV = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  database360Url: process.env.DATABASE_360_URL ?? "",
  databaseObrasUrl: process.env.DATABASE_OBRAS_URL ?? "",
  databaseNpsUrl: process.env.DATABASE_NPS_URL ?? "",
  port: parseInt(process.env.PORT ?? "3000", 10),
  isProduction: process.env.NODE_ENV === "production",
};
