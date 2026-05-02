import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import * as db from "../db";
import { dbObras } from "../_core/db";
import { installers } from "../../drizzle/schema-obras-diario";

// Sincroniza status do instalador (matched by name) com o do user operacional
async function syncInstallerStatus(userName: string | null, status: "active" | "inactive") {
  if (!userName) return;
  try {
    const data: any = { status };
    data.leftAt = status === "inactive" ? new Date() : null;
    await dbObras.update(installers).set(data).where(eq(installers.name, userName));
  } catch (e) {
    console.error("[sync] Falha ao sincronizar instalador:", e);
  }
}

export const usersRouter = router({
  list: protectedProcedure.query(async () => {
    const allUsers = await db.getAllUsers();
    return allUsers.map((u) => ({
      id: u.id, name: u.name, email: u.email, appRole: u.appRole,
      jobCategory: u.jobCategory,
      areaId: u.areaId, leaderId: u.leaderId, status: u.status,
      mustChangePassword: u.mustChangePassword,
      secondaryAreaId: u.secondaryAreaId, secondaryLeaderId: u.secondaryLeaderId,
    }));
  }),

  listAll: adminProcedure.query(async () => {
    const allUsers = await db.getAllUsers(true);
    return allUsers.map((u) => ({
      id: u.id, name: u.name, email: u.email, appRole: u.appRole,
      jobCategory: u.jobCategory,
      areaId: u.areaId, leaderId: u.leaderId, status: u.status,
      mustChangePassword: u.mustChangePassword, deactivatedAt: u.deactivatedAt,
      secondaryAreaId: u.secondaryAreaId, secondaryLeaderId: u.secondaryLeaderId,
    }));
  }),

  byArea: protectedProcedure
    .input(z.object({ areaId: z.number() }))
    .query(async ({ input }) => {
      const areaUsers = await db.getUsersByArea(input.areaId);
      return areaUsers.map((u) => ({ id: u.id, name: u.name, email: u.email, appRole: u.appRole, areaId: u.areaId, leaderId: u.leaderId }));
    }),

  subordinates: protectedProcedure.query(async ({ ctx }) => {
    const subs = await db.getUsersByLeader(ctx.user.id);
    return subs.map((u) => ({ id: u.id, name: u.name, email: u.email, appRole: u.appRole, areaId: u.areaId }));
  }),

  create: adminProcedure
    .input(z.object({
      name: z.string().min(1), email: z.string().email(),
      password: z.string().min(6),
      appRole: z.enum(["admin", "leader", "employee"]),
      jobCategory: z.enum(["administrativo", "operacional"]).optional(),
      areaId: z.number().optional(), leaderId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const existing = await db.getUserByEmail(input.email.toLowerCase().trim());
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "E-mail já cadastrado." });
      const hash = await bcrypt.hash(input.password, 10);
      const user = await db.createAppUser({
        name: input.name, email: input.email.toLowerCase().trim(),
        passwordHash: hash, appRole: input.appRole,
        jobCategory: input.jobCategory || "administrativo",
        areaId: input.areaId, leaderId: input.leaderId,
      });
      // Cria registro de installer auto se for operacional
      if (input.jobCategory === "operacional" && user?.name) {
        try {
          const exists = await dbObras
            .select()
            .from(installers)
            .where(eq(installers.name, user.name))
            .limit(1);
          if (exists.length === 0) {
            await dbObras.insert(installers).values({ name: user.name, status: "active" });
          }
        } catch (e) {
          console.error("[sync] Falha ao criar installer:", e);
        }
      }
      return { success: true, user };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(), name: z.string().optional(), email: z.string().email().optional(),
      appRole: z.enum(["admin", "leader", "employee"]).optional(),
      jobCategory: z.enum(["administrativo", "operacional"]).optional(),
      areaId: z.number().nullable().optional(), leaderId: z.number().nullable().optional(),
      secondaryAreaId: z.number().nullable().optional(),
      secondaryLeaderId: z.number().nullable().optional(),
      status: z.enum(["active", "inactive"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const before = await db.getUserById(id);
      if (data.status === "inactive") {
        await db.deactivateUser(id);
      } else {
        await db.updateUser(id, data as any);
      }
      // Sync com installers se for operacional
      const after = await db.getUserById(id);
      if (after?.jobCategory === "operacional") {
        await syncInstallerStatus(after.name, after.status as "active" | "inactive");
      } else if (before?.jobCategory === "operacional") {
        // era operacional e mudou ou foi inativado → desativa o installer
        await syncInstallerStatus(before.name, "inactive");
      }
      return { success: true };
    }),

  resetPassword: adminProcedure
    .input(z.object({ id: z.number(), newPassword: z.string().min(6) }))
    .mutation(async ({ input }) => {
      const hash = await bcrypt.hash(input.newPassword, 10);
      await db.updateUser(input.id, { passwordHash: hash, mustChangePassword: false });
      return { success: true };
    }),
});
