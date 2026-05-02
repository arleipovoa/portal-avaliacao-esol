import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

// DEV MODE: sem login. Retorna sempre o admin padrão (Árlei) cacheado.
let cachedAdmin: User | null = null;

async function getDefaultAdmin(): Promise<User | null> {
  if (cachedAdmin) return cachedAdmin;
  try {
    const user = await db.getUserByEmail("arlei@grupoesol.com.br");
    if (user) { cachedAdmin = user; return user; }
    console.error("[Auth] Admin padrão (arlei@grupoesol.com.br) não encontrado no DB.");
  } catch (e) {
    console.error("[Auth] Erro ao buscar admin padrão:", e);
  }
  return null;
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const user = await getDefaultAdmin();
  return { req: opts.req, res: opts.res, user };
}
