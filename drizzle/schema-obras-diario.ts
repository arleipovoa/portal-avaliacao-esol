// Schema das 3 novas tabelas (instaladores, veículos, diário de obra).
// Vive separado do schema-obras.ts pra não trazer junto erros pre-existentes
// daquele arquivo (que não estavam afetando o build porque ninguém o importa).

import {
  mysqlTable,
  int,
  varchar,
  text,
  timestamp,
  mysqlEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";

// ─── Installers ───
export const installers = mysqlTable(
  "installers",
  {
    id: int().primaryKey().autoincrement(),
    name: varchar({ length: 100 }).notNull().unique(),
    status: mysqlEnum(["active", "inactive"]).notNull().default("active"),
    hiredAt: timestamp(),
    leftAt: timestamp(),
    role: varchar({ length: 50 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    nameIdx: uniqueIndex("idx_installer_name").on(table.name),
    statusIdx: index("idx_installer_status").on(table.status),
  })
);

// ─── Vehicles ───
export const vehicles = mysqlTable(
  "vehicles",
  {
    id: int().primaryKey().autoincrement(),
    identifier: varchar({ length: 50 }).notNull().unique(),
    model: varchar({ length: 100 }),
    plate: varchar({ length: 10 }),
    status: mysqlEnum(["active", "inactive"]).notNull().default("active"),
    notes: text(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    identifierIdx: uniqueIndex("idx_vehicle_identifier").on(table.identifier),
    statusIdx: index("idx_vehicle_status").on(table.status),
  })
);

// ─── ObraDiario ───
export const obraDiario = mysqlTable(
  "obra_diario",
  {
    id: int().primaryKey().autoincrement(),
    projectCode: varchar({ length: 20 }).notNull(),
    dayNumber: int().notNull(),
    date: timestamp().notNull(),
    vehicleId: int(),
    installerId: int().notNull(),
    notes: text(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    uniqueIdx: uniqueIndex("uniq_obra_dia_inst").on(
      table.projectCode, table.dayNumber, table.installerId
    ),
    projectIdx: index("idx_diario_project").on(table.projectCode),
    dateIdx: index("idx_diario_date").on(table.date),
    installerIdx: index("idx_diario_installer").on(table.installerId),
    vehicleIdx: index("idx_diario_vehicle").on(table.vehicleId),
  })
);

export type Installer = typeof installers.$inferSelect;
export type InsertInstaller = typeof installers.$inferInsert;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;
export type ObraDiario = typeof obraDiario.$inferSelect;
export type InsertObraDiario = typeof obraDiario.$inferInsert;
