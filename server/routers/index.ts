import { router } from "../_core/trpc";
import { adminRouter } from "./admin.router";
import { areasRouter } from "./areas.router";
import { authRouter } from "./auth.router";
import { criteriaRouter } from "./criteria.router";
import { cyclesRouter } from "./cycles.router";
import { dashboardRouter } from "./dashboard.router";
import { evaluationsRouter } from "./evaluations.router";
import { usersRouter } from "./users.router";
import { projectsRouter } from "./projects.router";

export const appRouter = router({
  auth: authRouter, // stub vazio — mantido por compatibilidade
  areas: areasRouter,
  users: usersRouter,
  cycles: cyclesRouter,
  criteria: criteriaRouter,
  evaluations: evaluationsRouter,
  admin: adminRouter,
  dashboard: dashboardRouter,
  projects: projectsRouter,
});

export type AppRouter = typeof appRouter;
