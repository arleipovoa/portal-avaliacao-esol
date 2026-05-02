// SIMPLIFICADO no reboot — sem login real.
// Mantemos apenas auth.me que retorna o usuario do contexto (admin fake).
// Quando o login real voltar, ampliar este router (login, logout, changePassword).
import { router, publicProcedure } from "../_core/trpc";

export const authRouter = router({
  me: publicProcedure.query(({ ctx }) => ctx.user),
});
