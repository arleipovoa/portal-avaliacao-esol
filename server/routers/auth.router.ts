import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import * as db from "../db";
import { sdk } from "../_core/sdk";

export const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),

  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.getUserByEmail(input.email.toLowerCase().trim());
      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha inválidos." });
      }
      if (user.status === "inactive") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Usuário desativado." });
      }
      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha inválidos." });
      }
      const token = await sdk.createSessionToken(user.openId, { name: user.name || "" });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });
      await db.updateUser(user.id, { lastSignedIn: new Date() });
      return {
        success: true,
        mustChangePassword: user.mustChangePassword,
        user: { id: user.id, name: user.name, email: user.email, appRole: user.appRole },
      };
    }),

  changePassword: protectedProcedure
    .input(z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(6) }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user || !user.passwordHash) throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário inválido." });
      const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Senha atual incorreta." });
      const hash = await bcrypt.hash(input.newPassword, 10);
      await db.updateUserPassword(user.id, hash);
      return { success: true };
    }),

  updateProfile: protectedProcedure
    .input(z.object({ name: z.string().min(2).max(120) }))
    .mutation(async ({ ctx, input }) => {
      await db.updateUser(ctx.user.id, { name: input.name.trim() });
      return { success: true };
    }),
});
