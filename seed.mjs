/**
 * Seed script for the Grupo E-sol evaluation system.
 * Run: node seed.mjs
 * 
 * This script:
 * 1. Creates all areas/companies
 * 2. Creates all 22 evaluation criteria
 * 3. Creates all users with proper hierarchy
 * 4. Creates Jan/Feb 2026 cycles with score 10 for all
 */
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);

async function run() {
  console.log("🌱 Starting seed...");

  // ─── 1. Areas ───
  const areasData = [
    { name: "Diretoria", companyName: "Grupo E-sol" },
    { name: "Comercial", companyName: "E-sol Engenharia" },
    { name: "Instalação", companyName: "E-sol Engenharia" },
    { name: "Projetos", companyName: "E-sol Engenharia" },
    { name: "Administrativo", companyName: "E-sol Engenharia" },
    { name: "Sucesso do Cliente", companyName: "E-sol Engenharia" },
    { name: "OPEX Solar", companyName: "OPEX Solar" },
    { name: "ELEX SET", companyName: "ELEX Soluções Elétricas e Telecom" },
    { name: "ELEX Material Elétrico", companyName: "ELEX Material Elétrico" },
    { name: "reXiclar", companyName: "reXiclar" },
    { name: "Suprimentos", companyName: "Grupo E-sol" },
    { name: "Estúdio Paisagismo", companyName: "Grupo E-sol" },
  ];

  for (const area of areasData) {
    await conn.execute(
      `INSERT INTO areas (name, companyName, status) VALUES (?, ?, 'active') ON DUPLICATE KEY UPDATE companyName = VALUES(companyName)`,
      [area.name, area.companyName]
    );
  }
  console.log("✅ Areas created");

  // Get area IDs
  const [areaRows] = await conn.execute("SELECT id, name FROM areas");
  const areaMap = {};
  for (const row of areaRows) areaMap[row.name] = row.id;

  // ─── 2. Criteria ───
  const criteriaData = [
    // Base 360 (3)
    { name: "Comunicação e clareza", code: "comunicacao_clareza", type: "base360", description: "Capacidade de se comunicar de forma clara e objetiva.", sortOrder: 1 },
    { name: "Colaboração e espírito de equipe", code: "colaboracao_equipe", type: "base360", description: "Disposição para trabalhar em equipe e ajudar colegas.", sortOrder: 2 },
    { name: "Respeito e postura profissional", code: "respeito_postura", type: "base360", description: "Respeito aos colegas, clientes e normas da empresa.", sortOrder: 3 },
    // Detailed 360 (9)
    { name: "Entrega e qualidade técnica", code: "entrega_qualidade_tecnica", type: "detailed360", description: "Acabamentos, padrões E-sol, ausência de retrabalho.", sortOrder: 4 },
    { name: "Cumprimento de prazos e SLAs", code: "cumprimento_prazos_slas", type: "detailed360", description: "Entrega dentro dos prazos acordados.", sortOrder: 5 },
    { name: "Organização, planejamento e processos", code: "organizacao_processos", type: "detailed360", description: "Uso correto dos processos/sistemas (OS/CRM/ERP/checklists).", sortOrder: 6 },
    { name: "Proatividade e melhoria contínua", code: "proatividade_melhoria", type: "detailed360", description: "Sugere melhorias, resolve problemas sem ser solicitado.", sortOrder: 7 },
    { name: "Segurança, 5S, EPIs e zelo", code: "seguranca_5s_epis", type: "detailed360", description: "Atenção a normas de segurança, 5S, EPIs e zelo pelo patrimônio/veículos.", sortOrder: 8 },
    { name: "Documentação e registro", code: "documentacao_registro", type: "detailed360", description: "Checklists, fotos, relatórios, CRM atualizado.", sortOrder: 9 },
    { name: "Foco no cliente e pós-venda", code: "foco_cliente_posvenda", type: "detailed360", description: "Cordialidade, solução efetiva, retorno ao cliente.", sortOrder: 10 },
    { name: "Autonomia e gestão de prioridades", code: "autonomia_prioridades", type: "detailed360", description: "Puxa responsabilidade, precisa de pouca supervisão.", sortOrder: 11 },
    { name: "Confiabilidade e consistência", code: "confiabilidade_consistencia", type: "detailed360", description: "Mantém padrão de entrega ao longo do mês.", sortOrder: 12 },
    // Leadership (7)
    { name: "Resultado/Metas da função", code: "resultado_metas", type: "leadership", description: "Entregas, produtividade, indicadores.", sortOrder: 13 },
    { name: "Qualidade e retrabalho", code: "qualidade_retrabalho", type: "leadership", description: "Erro/ajuste, padrão técnico.", sortOrder: 14 },
    { name: "Aderência a processos e prazos", code: "aderencia_processos_prazos", type: "leadership", description: "Disciplina operacional.", sortOrder: 15 },
    { name: "Postura e valores", code: "postura_valores", type: "leadership", description: "Profissionalismo, respeito, ética.", sortOrder: 16 },
    { name: "Desenvolvimento e autonomia", code: "desenvolvimento_autonomia", type: "leadership", description: "Aprendizado, evolução, mentoria/cooperatividade.", sortOrder: 17 },
    { name: "Foco no cliente e impacto de negócio", code: "foco_cliente_negocio", type: "leadership", description: "Impacto das ações no resultado do negócio.", sortOrder: 18 },
    { name: "Segurança, 5S e zelo", code: "seguranca_5s_zelo", type: "leadership", description: "Quando aplicável à função.", sortOrder: 19 },
  ];

  for (const c of criteriaData) {
    await conn.execute(
      `INSERT INTO criteria (name, code, type, description, active, sortOrder) VALUES (?, ?, ?, ?, true, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), sortOrder = VALUES(sortOrder)`,
      [c.name, c.code, c.type, c.description, c.sortOrder]
    );
  }
  console.log("✅ Criteria created");

  // ─── 3. Users ───
  const defaultPassword = await bcrypt.hash("esol2026", 10);

  // Helper to create user
  async function createUser(name, email, appRole, areaName, leaderEmail = null) {
    const areaId = areaMap[areaName] || null;
    const openId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const role = appRole === "admin" ? "admin" : "user";

    // Check if exists
    const [existing] = await conn.execute("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      console.log(`  ⏭️  ${name} (${email}) already exists`);
      return existing[0].id;
    }

    await conn.execute(
      `INSERT INTO users (openId, name, email, passwordHash, appRole, role, areaId, mustChangePassword, status, loginMethod, lastSignedIn) VALUES (?, ?, ?, ?, ?, ?, ?, true, 'active', 'email', NOW())`,
      [openId, name, email, defaultPassword, appRole, role, areaId]
    );
    const [rows] = await conn.execute("SELECT id FROM users WHERE email = ?", [email]);
    console.log(`  ✅ ${name} (${appRole}) - ${email}`);
    return rows[0].id;
  }

  console.log("\n👥 Creating users...");

  // Admin/Diretoria
  const arleiId = await createUser("Árlei Póvoa", "arlei@grupoesol.com.br", "admin", "Diretoria");
  const nathaliaId = await createUser("Nathália Cavalcante", "nathalia@grupoesol.com.br", "admin", "Administrativo");

  // Leaders
  const annaId = await createUser("Anna Lhívia", "anna@grupoesol.com.br", "leader", "Comercial");
  const gabrielId = await createUser("Gabriel Trindade", "gabriel@grupoesol.com.br", "leader", "Instalação");
  const jonasId = await createUser("Jonas Calegar", "jonas@grupoesol.com.br", "leader", "OPEX Solar");
  const alamId = await createUser("Alam Saraiva", "alam@grupoesol.com.br", "leader", "Instalação");
  const lucasId = await createUser("Lucas Melo", "lucas@grupoesol.com.br", "leader", "ELEX Material Elétrico");
  const fabioSId = await createUser("Fábio Sanches", "fabio.sanches@grupoesol.com.br", "leader", "reXiclar");
  const rayandraId = await createUser("Rayandra Leite", "rayandra@grupoesol.com.br", "leader", "Sucesso do Cliente");
  const carolineId = await createUser("Caroline Martins", "caroline@grupoesol.com.br", "leader", "Administrativo");
  const wesleyFId = await createUser("Wesley Fernandes", "wesley.fernandes@grupoesol.com.br", "leader", "ELEX SET");

  // Employees - Comercial (E-sol)
  const kaylaneId = await createUser("Kaylane", "kaylane@grupoesol.com.br", "employee", "Comercial");
  const nathMoraisId = await createUser("Nathália Morais", "nathalia.morais@grupoesol.com.br", "employee", "Comercial");
  const marcosId = await createUser("Marcos José", "marcos@grupoesol.com.br", "employee", "Comercial");
  const andersonId = await createUser("Anderson", "anderson@grupoesol.com.br", "employee", "Comercial");
  const rogerId = await createUser("Roger", "roger@grupoesol.com.br", "employee", "Comercial");

  // Employees - Instalação (E-sol)
  const gustavoGId = await createUser("Gustavo Gomes", "gustavo.gomes@grupoesol.com.br", "employee", "Instalação");
  const elderId = await createUser("Élder Silva", "elder@grupoesol.com.br", "employee", "Instalação");
  const wesleyGId = await createUser("Wesley Garcia", "wesley.garcia@grupoesol.com.br", "employee", "Instalação");
  const fabioMId = await createUser("Fábio Marques", "fabio.marques@grupoesol.com.br", "employee", "Instalação");

  // Employees - Projetos
  const luanId = await createUser("Luan Mendes", "luan@grupoesol.com.br", "employee", "Projetos");

  // Employees - Administrativo
  const cassianaId = await createUser("Cassiana", "cassiana@grupoesol.com.br", "employee", "Administrativo");

  // Employees - Sucesso do Cliente
  const yaraId = await createUser("Yara Portes", "yara@grupoesol.com.br", "employee", "Sucesso do Cliente");
  const georgiaId = await createUser("Georgia Baia", "georgia@grupoesol.com.br", "employee", "Sucesso do Cliente");
  const liviaId = await createUser("Lívia", "livia@grupoesol.com.br", "employee", "Sucesso do Cliente");

  // Employees - OPEX Solar
  const eliveltonId = await createUser("Elivelton", "elivelton@grupoesol.com.br", "employee", "OPEX Solar");
  const endersonId = await createUser("Enderson", "enderson@grupoesol.com.br", "employee", "OPEX Solar");
  const gustavoPId = await createUser("Gustavo Painha", "gustavo.painha@grupoesol.com.br", "employee", "OPEX Solar");

  // Employees - ELEX SET
  const hyanId = await createUser("Hyan", "hyan@grupoesol.com.br", "employee", "ELEX SET");
  const matheusRId = await createUser("Matheus Ramos", "matheus.ramos@grupoesol.com.br", "employee", "ELEX SET");

  // Employees - ELEX Material Elétrico
  const jaquelineId = await createUser("Jaqueline Paiva", "jaqueline@grupoesol.com.br", "employee", "ELEX Material Elétrico");

  // Employees - reXiclar
  const matheusCId = await createUser("Matheus Cândido", "matheus.candido@grupoesol.com.br", "employee", "reXiclar");
  const gustavoEId = await createUser("Gustavo Emanoel", "gustavo.emanoel@grupoesol.com.br", "employee", "reXiclar");

  // Employees - Estúdio Paisagismo
  const jhemillyId = await createUser("Jhemilly Viana", "jhemilly@grupoesol.com.br", "employee", "Estúdio Paisagismo");

  // ─── Set leader relationships ───
  console.log("\n🔗 Setting leader relationships...");

  // Árlei leads all leaders + Luan + Wesley Fernandes
  const arleiSubordinates = [annaId, gabrielId, jonasId, alamId, lucasId, fabioSId, rayandraId, carolineId, nathaliaId, luanId, wesleyFId];
  for (const id of arleiSubordinates) {
    await conn.execute("UPDATE users SET leaderId = ? WHERE id = ?", [arleiId, id]);
  }

  // Anna Lhívia leads Comercial
  for (const id of [kaylaneId, nathMoraisId, marcosId, andersonId, rogerId]) {
    await conn.execute("UPDATE users SET leaderId = ? WHERE id = ?", [annaId, id]);
  }

  // Gabriel Trindade leads Instalação
  for (const id of [gustavoGId, elderId, wesleyGId, fabioMId]) {
    await conn.execute("UPDATE users SET leaderId = ? WHERE id = ?", [gabrielId, id]);
  }

  // Alam Saraiva also in Instalação (co-leader)
  // (Alam reports to Árlei, already set above)

  // Jonas Calegar leads OPEX Solar
  for (const id of [eliveltonId, endersonId, gustavoPId]) {
    await conn.execute("UPDATE users SET leaderId = ? WHERE id = ?", [jonasId, id]);
  }

  // Wesley Fernandes leads ELEX SET
  for (const id of [hyanId, matheusRId]) {
    await conn.execute("UPDATE users SET leaderId = ? WHERE id = ?", [wesleyFId, id]);
  }

  // Lucas Melo leads ELEX Material Elétrico
  await conn.execute("UPDATE users SET leaderId = ? WHERE id = ?", [lucasId, jaquelineId]);

  // Fábio Sanches leads reXiclar
  for (const id of [matheusCId, gustavoEId]) {
    await conn.execute("UPDATE users SET leaderId = ? WHERE id = ?", [fabioSId, id]);
  }

  // Rayandra leads Sucesso do Cliente
  for (const id of [yaraId, georgiaId, liviaId]) {
    await conn.execute("UPDATE users SET leaderId = ? WHERE id = ?", [rayandraId, id]);
  }

  // Caroline leads Administrativo (Cassiana)
  await conn.execute("UPDATE users SET leaderId = ? WHERE id = ?", [carolineId, cassianaId]);

  // Nathália Cavalcante leads Estúdio Paisagismo
  // Jhemilly: área primária = Estúdio Paisagismo, líder = Nathália
  await conn.execute("UPDATE users SET leaderId = ? WHERE id = ?", [nathaliaId, jhemillyId]);

  // Enderson e Gustavo Painha: duplo setor (OPEX Solar principal + Estúdio Paisagismo secundário)
  const [estudioArea] = await conn.execute("SELECT id FROM areas WHERE name = 'Estúdio Paisagismo'");
  const estudioAreaId = estudioArea[0]?.id;
  if (estudioAreaId) {
    await conn.execute(
      "UPDATE users SET secondaryAreaId = ?, secondaryLeaderId = ? WHERE id = ?",
      [estudioAreaId, nathaliaId, endersonId]
    );
    await conn.execute(
      "UPDATE users SET secondaryAreaId = ?, secondaryLeaderId = ? WHERE id = ?",
      [estudioAreaId, nathaliaId, gustavoPId]
    );
    console.log("  ✅ Duplo setor configurado para Enderson e Gustavo Painha");
  }

  // Update area leaders
  await conn.execute("UPDATE areas SET leaderId = ? WHERE name = ?", [arleiId, "Diretoria"]);
  await conn.execute("UPDATE areas SET leaderId = ? WHERE name = ?", [annaId, "Comercial"]);
  await conn.execute("UPDATE areas SET leaderId = ? WHERE name = ?", [gabrielId, "Instalação"]);
  await conn.execute("UPDATE areas SET leaderId = ? WHERE name = ?", [arleiId, "Projetos"]);
  await conn.execute("UPDATE areas SET leaderId = ? WHERE name = ?", [carolineId, "Administrativo"]);
  await conn.execute("UPDATE areas SET leaderId = ? WHERE name = ?", [rayandraId, "Sucesso do Cliente"]);
  await conn.execute("UPDATE areas SET leaderId = ? WHERE name = ?", [jonasId, "OPEX Solar"]);
  await conn.execute("UPDATE areas SET leaderId = ? WHERE name = ?", [wesleyFId, "ELEX SET"]);
  await conn.execute("UPDATE areas SET leaderId = ? WHERE name = ?", [lucasId, "ELEX Material Elétrico"]);
  await conn.execute("UPDATE areas SET leaderId = ? WHERE name = ?", [fabioSId, "reXiclar"]);
  await conn.execute("UPDATE areas SET leaderId = ? WHERE name = ?", [arleiId, "Suprimentos"]);
  await conn.execute("UPDATE areas SET leaderId = ? WHERE name = ?", [nathaliaId, "Estúdio Paisagismo"]);

  console.log("✅ Leader relationships set");

  // ─── 4. Cycles Jan/Feb 2026 with score 10 ───
  console.log("\n📅 Creating Jan/Feb 2026 cycles...");

  for (const monthYear of ["2026-01", "2026-02"]) {
    const [existingCycle] = await conn.execute("SELECT id FROM cycles WHERE monthYear = ?", [monthYear]);
    let cycleId;
    if (existingCycle.length > 0) {
      cycleId = existingCycle[0].id;
      console.log(`  ⏭️  Cycle ${monthYear} already exists`);
    } else {
      await conn.execute(
        `INSERT INTO cycles (monthYear, status) VALUES (?, 'published')`,
        [monthYear]
      );
      const [rows] = await conn.execute("SELECT id FROM cycles WHERE monthYear = ?", [monthYear]);
      cycleId = rows[0].id;
      console.log(`  ✅ Cycle ${monthYear} created`);
    }

    // Create aggregates with score 10 for all active users
    const [activeUsers] = await conn.execute("SELECT id FROM users WHERE status = 'active'");
    for (const user of activeUsers) {
      const [existingAgg] = await conn.execute(
        "SELECT id FROM aggregates WHERE cycleId = ? AND userId = ?",
        [cycleId, user.id]
      );
      if (existingAgg.length > 0) continue;

      await conn.execute(
        `INSERT INTO aggregates (cycleId, userId, nota360, notaLideranca, avaliacaoGlobal, bonusPontualidade, bonusDesempenho, bonusPodio, totalBonus, radarData) VALUES (?, ?, 10.00, 10.00, 10.00, 125.00, 125.00, 0.00, 250.00, ?)`,
        [cycleId, user.id, JSON.stringify({
          "Comunicação & Postura": 10,
          "Qualidade & Técnica": 10,
          "Processos & Prazos": 10,
          "Autonomia & Proatividade": 10,
          "Segurança & Zelo": 10,
        })]
      );
    }
    console.log(`  ✅ Aggregates for ${monthYear} created (score 10 for all)`);

    // Set punctuality as eligible for all
    for (const user of activeUsers) {
      const [existingPunct] = await conn.execute(
        "SELECT id FROM punctuality WHERE cycleId = ? AND userId = ?",
        [cycleId, user.id]
      );
      if (existingPunct.length > 0) continue;

      await conn.execute(
        `INSERT INTO punctuality (cycleId, userId, maxDelayDayMin, totalDelayMonthMin, eligible) VALUES (?, ?, 0, 0, true)`,
        [cycleId, user.id]
      );
    }
  }

  // Create March 2026 cycle as "open"
  const [existingMarch] = await conn.execute("SELECT id FROM cycles WHERE monthYear = '2026-03'");
  if (existingMarch.length === 0) {
    await conn.execute(`INSERT INTO cycles (monthYear, status) VALUES ('2026-03', 'open')`);
    console.log("  ✅ Cycle 2026-03 created (open)");
  }

  console.log("\n🎉 Seed complete!");
  await conn.end();
}

run().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
