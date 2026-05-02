import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Sem login no momento: protected/admin agem como public mas garantem que
// ctx.user existe (o context sempre injeta o admin padrao).
const ensureUser = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Admin padrao nao foi carregado do banco. Verifique DATABASE_URL.",
    });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const protectedProcedure = t.procedure.use(ensureUser);
export const adminProcedure = t.procedure.use(ensureUser);
