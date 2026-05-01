import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

// DEV ONLY: cache do usuario fake usado quando AUTH_BYPASS esta ligado.
// Evita bater no banco a cada request.
let cachedBypassUser: User | null = null;
let warnedAuthBypass = false;

async function getBypassUser(): Promise<User | null> {
  if (cachedBypassUser) return cachedBypassUser;
  if (!warnedAuthBypass) {
    console.warn(
      `[Auth] AUTH_BYPASS ativo - todos os requests assumem ${ENV.authBypassEmail} como admin. NAO use em producao.`
    );
    warnedAuthBypass = true;
  }
  try {
    const user = await db.getUserByEmail(ENV.authBypassEmail.toLowerCase().trim());
    if (user) {
      cachedBypassUser = user;
      return user;
    }
    console.error(
      `[Auth] AUTH_BYPASS: usuario ${ENV.authBypassEmail} nao encontrado no banco. Procedures protegidas vao falhar.`
    );
  } catch (error) {
    console.error("[Auth] AUTH_BYPASS: erro ao carregar usuario fake:", error);
  }
  return null;
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // DEV ONLY: bypass de autenticacao
  // Se nenhum usuario foi resolvido pela sessao e AUTH_BYPASS esta ligado,
  // injeta o admin padrao. Mantem o app navegavel sem passar pelo login.
  if (!user && ENV.authBypass) {
    user = await getBypassUser();
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
