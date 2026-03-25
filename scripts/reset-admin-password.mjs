#!/usr/bin/env node
import "dotenv/config";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

const DEFAULT_ADMIN_EMAILS = [
  "arlei@grupoesol.com.br",
  "nathalia@grupoesol.com.br",
];

function parseArgs(argv) {
  const out = {
    list: false,
    emails: [],
    password: "",
    makeAdmin: true,
    activate: true,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--list") {
      out.list = true;
      continue;
    }

    if (arg === "--email" || arg === "-e") {
      const value = argv[i + 1];
      if (value) {
        out.emails.push(value.toLowerCase().trim());
        i += 1;
      }
      continue;
    }

    if (arg === "--password" || arg === "-p") {
      const value = argv[i + 1];
      if (value) {
        out.password = value;
        i += 1;
      }
      continue;
    }

    if (arg === "--keep-role") {
      out.makeAdmin = false;
      continue;
    }

    if (arg === "--keep-status") {
      out.activate = false;
      continue;
    }
  }

  return out;
}

function usage() {
  console.log(`
Uso:
  node scripts/reset-admin-password.mjs --list
  node scripts/reset-admin-password.mjs --password "NovaSenha@123"
  node scripts/reset-admin-password.mjs --email arlei@grupoesol.com.br --password "NovaSenha@123"

Opcoes:
  --list          Lista usuarios admin atuais
  --email, -e     Email alvo (pode repetir mais de uma vez). Se omitido, usa admins padrao.
  --password, -p  Nova senha (obrigatoria para reset)
  --keep-role     Nao força appRole/role para admin
  --keep-status   Nao força status para active
`);
}

async function listAdmins(conn) {
  const [rows] = await conn.execute(
    "SELECT id, name, email, appRole, role, status FROM users WHERE appRole = 'admin' OR role = 'admin' ORDER BY id"
  );

  if (!rows.length) {
    console.log("Nenhum usuario admin encontrado.");
    return;
  }

  console.log("Admins encontrados:");
  for (const row of rows) {
    console.log(
      `- id=${row.id} | ${row.name ?? "-"} | ${row.email ?? "-"} | appRole=${row.appRole} | role=${row.role} | status=${row.status}`
    );
  }
}

async function resetPassword(conn, emails, password, makeAdmin, activate) {
  const hash = await bcrypt.hash(password, 10);

  for (const email of emails) {
    const [found] = await conn.execute(
      "SELECT id, name, email, appRole, role, status FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (!found.length) {
      console.log(`Nao encontrado: ${email}`);
      continue;
    }

    const sets = ["passwordHash = ?", "mustChangePassword = false"];
    const values = [hash];

    if (activate) sets.push("status = 'active'");
    if (makeAdmin) {
      sets.push("appRole = 'admin'");
      sets.push("role = 'admin'");
    }

    values.push(email);

    await conn.execute(
      `UPDATE users SET ${sets.join(", ")} WHERE email = ?`,
      values
    );

    const [after] = await conn.execute(
      "SELECT id, name, email, appRole, role, status, mustChangePassword FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    const u = after[0];
    console.log(
      `Resetado: ${u.email} | appRole=${u.appRole} | role=${u.role} | status=${u.status} | mustChangePassword=${u.mustChangePassword}`
    );
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL nao configurada.");
    process.exit(1);
  }

  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    if (args.list) {
      await listAdmins(conn);
      return;
    }

    if (!args.password) {
      usage();
      process.exit(1);
    }

    const emails =
      args.emails.length > 0 ? args.emails : DEFAULT_ADMIN_EMAILS;

    await resetPassword(
      conn,
      Array.from(new Set(emails)),
      args.password,
      args.makeAdmin,
      args.activate
    );
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("Falha no reset:", err.message);
  process.exit(1);
});

