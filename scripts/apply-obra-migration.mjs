import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não configurada');
  process.exit(1);
}

async function runMigration() {
  let connection;
  try {
    console.log('🔗 Conectando ao banco de dados...');
    connection = await mysql.createConnection(DATABASE_URL);

    console.log('📝 Executando migration: Adicionar tipo "obra" ao enum de critérios...');

    // Alterar enum da coluna type
    await connection.execute(
      `ALTER TABLE \`criteria\`
       MODIFY COLUMN \`type\` ENUM('base360', 'detailed360', 'leadership', 'obra') NOT NULL`
    );
    console.log('✅ Enum atualizado com sucesso');

    // Inserir critérios de Avaliação de Obras
    const criterios = [
      ['Uso de EPIs', 'OBRA_EPI', 'obra', 'Cumprimento e uso correto de Equipamentos de Proteção Individual', 1, 1],
      ['5S - Organização e Limpeza', 'OBRA_5S', 'obra', 'Manutenção da organização, limpeza e segurança do canteiro de obras', 1, 2],
      ['Qualidade da Montagem', 'OBRA_QUALIDADE', 'obra', 'Precisão e qualidade na montagem de equipamentos e estruturas', 1, 3],
      ['Segurança no Trabalho', 'OBRA_SEGURANCA', 'obra', 'Cumprimento de normas de segurança e procedimentos preventivos', 1, 4],
      ['Pontualidade e Produtividade', 'OBRA_PRODUTIVIDADE', 'obra', 'Cumprimento de prazos e eficiência na execução das atividades', 1, 5],
    ];

    console.log('📝 Inserindo critérios de Avaliação de Obras...');
    for (const criterio of criterios) {
      await connection.execute(
        `INSERT INTO \`criteria\` (\`name\`, \`code\`, \`type\`, \`description\`, \`active\`, \`sortOrder\`)
         VALUES (?, ?, ?, ?, ?, ?)`,
        criterio
      );
      console.log(`  ✅ ${criterio[0]}`);
    }

    console.log('\n✅ Migration aplicada com sucesso!');
    console.log('📊 Critérios de Obras criados:');
    criterios.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c[0]} (${c[1]})`);
    });

  } catch (error) {
    console.error('❌ Erro ao executar migration:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
