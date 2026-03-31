/**
 * ============================================================================
 * Configuração de Conexão com Bancos de Dados - Arquitetura Separada
 * ============================================================================
 * 
 * Este arquivo gerencia as conexões com os 3 bancos de dados independentes:
 * - db360: Portal 360° (Avaliação de Desempenho)
 * - dbObras: Portal Obras (Avaliação de Instalações)
 * - dbNps: Portal NPS (Pesquisa de Satisfação)
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

// ─── Validar Variáveis de Ambiente ───
const validateEnv = () => {
  const required = [
    "DATABASE_360_URL",
    "DATABASE_OBRAS_URL",
    "DATABASE_NPS_URL",
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Variáveis de ambiente obrigatórias não configuradas: ${missing.join(", ")}`
    );
  }
};

validateEnv();

// ─── Criar Pools de Conexão ───

/**
 * Pool de conexão para Portal 360°
 */
const pool360 = mysql.createPool({
  uri: process.env.DATABASE_360_URL!,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Pool de conexão para Portal Obras
 */
const poolObras = mysql.createPool({
  uri: process.env.DATABASE_OBRAS_URL!,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Pool de conexão para Portal NPS
 */
const poolNps = mysql.createPool({
  uri: process.env.DATABASE_NPS_URL!,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ─── Criar Instâncias do Drizzle ───

/**
 * Instância Drizzle para Portal 360°
 * Importar schemas de 360° conforme necessário
 */
export const db360 = drizzle(pool360, {
  mode: "default",
  logger: process.env.NODE_ENV === "development",
});

/**
 * Instância Drizzle para Portal Obras
 * Importar schemas de Obras conforme necessário
 */
export const dbObras = drizzle(poolObras, {
  mode: "default",
  logger: process.env.NODE_ENV === "development",
});

/**
 * Instância Drizzle para Portal NPS
 * Importar schemas de NPS conforme necessário
 */
export const dbNps = drizzle(poolNps, {
  mode: "default",
  logger: process.env.NODE_ENV === "development",
});

// ─── Função para Obter DB Baseado no Módulo ───

export type ModuleType = "360" | "obras" | "nps";

/**
 * Retorna a instância Drizzle apropriada baseado no módulo
 */
export function getDb(module: ModuleType) {
  switch (module) {
    case "360":
      return db360;
    case "obras":
      return dbObras;
    case "nps":
      return dbNps;
    default:
      throw new Error(`Módulo desconhecido: ${module}`);
  }
}

// ─── Função para Fechar Conexões ───

/**
 * Fecha todas as conexões com os bancos de dados
 * Útil para shutdown gracioso da aplicação
 */
export async function closeAllConnections() {
  try {
    await pool360.end();
    console.log("Conexão com portal_360 fechada");
  } catch (error) {
    console.error("Erro ao fechar conexão com portal_360:", error);
  }

  try {
    await poolObras.end();
    console.log("Conexão com portal_obras fechada");
  } catch (error) {
    console.error("Erro ao fechar conexão com portal_obras:", error);
  }

  try {
    await poolNps.end();
    console.log("Conexão com portal_nps fechada");
  } catch (error) {
    console.error("Erro ao fechar conexão com portal_nps:", error);
  }
}

// ─── Health Check ───

/**
 * Verifica a saúde das conexões com todos os bancos
 */
export async function healthCheck() {
  const results = {
    portal_360: false,
    portal_obras: false,
    portal_nps: false,
  };

  try {
    const conn360 = await pool360.getConnection();
    await conn360.query("SELECT 1");
    conn360.release();
    results.portal_360 = true;
  } catch (error) {
    console.error("Erro ao conectar em portal_360:", error);
  }

  try {
    const connObras = await poolObras.getConnection();
    await connObras.query("SELECT 1");
    connObras.release();
    results.portal_obras = true;
  } catch (error) {
    console.error("Erro ao conectar em portal_obras:", error);
  }

  try {
    const connNps = await poolNps.getConnection();
    await connNps.query("SELECT 1");
    connNps.release();
    results.portal_nps = true;
  } catch (error) {
    console.error("Erro ao conectar em portal_nps:", error);
  }

  return results;
}
