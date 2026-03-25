import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const criteriaRouter = router({
  list: protectedProcedure.query(async () => {
    return db.getAllCriteria();
  }),
});
