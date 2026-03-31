-- ============================================================================
-- SCRIPT DE MIGRAÇÃO DE DADOS
-- ============================================================================
-- Este script migra os dados do banco unificado (portal_esol) para os 3 novos
-- bancos independentes (portal_360, portal_obras, portal_nps)
--
-- IMPORTANTE: Execute este script APÓS ter criado os 3 novos bancos com os
-- scripts 01, 02 e 03. Certifique-se de ter backups do banco original!
--
-- Ordem de execução:
-- 1. Criar os 3 novos bancos (01_create_portal_360.sql, 02_create_portal_obras.sql, 03_create_portal_nps.sql)
-- 2. Executar este script (04_migrate_data.sql)
-- 3. Validar integridade dos dados
-- 4. Atualizar connection strings da aplicação

-- ─── FASE 1: Migrar Usuários ───
-- Copiar usuários para todos os 3 bancos

INSERT INTO portal_360.users 
SELECT * FROM portal_esol.users;

INSERT INTO portal_obras.users 
SELECT * FROM portal_esol.users;

INSERT INTO portal_nps.users 
SELECT * FROM portal_esol.users;

-- Verificar
SELECT 'Usuários migrados para portal_360' AS status, COUNT(*) as total FROM portal_360.users;
SELECT 'Usuários migrados para portal_obras' AS status, COUNT(*) as total FROM portal_obras.users;
SELECT 'Usuários migrados para portal_nps' AS status, COUNT(*) as total FROM portal_nps.users;

-- ─── FASE 2: Migrar Dados do Portal 360° ───

-- Copiar áreas
INSERT INTO portal_360.areas 
SELECT * FROM portal_esol.areas;

-- Copiar ciclos
INSERT INTO portal_360.cycles 
SELECT * FROM portal_esol.cycles;

-- Copiar critérios 360° (apenas os tipos base360, detailed360, leadership)
INSERT INTO portal_360.criteria_360 (name, code, type, description, active, sortOrder)
SELECT name, code, type, description, active, sortOrder 
FROM portal_esol.criteria 
WHERE type IN ('base360', 'detailed360', 'leadership');

-- Copiar avaliações 360°
INSERT INTO portal_360.evaluations_360 (cycleId, evaluatorId, evaluateeId, relation, items, status, submittedAt, createdAt, updatedAt)
SELECT cycleId, evaluatorId, evaluateeId, relation, items, status, submittedAt, createdAt, updatedAt
FROM portal_esol.evaluations;

-- Copiar agregados 360°
INSERT INTO portal_360.aggregates_360 (cycleId, userId, nota360, notaLideranca, avaliacaoGlobal, bonusPontualidade, bonusDesempenho, totalBonus, detailsByCriteria, radarData, createdAt, updatedAt)
SELECT cycleId, userId, nota360, notaLideranca, avaliacaoGlobal, bonusPontualidade, bonusDesempenho, totalBonus, detailsByCriteria, radarData, createdAt, updatedAt
FROM portal_esol.aggregates;

-- Copiar pontualidade
INSERT INTO portal_360.punctuality (cycleId, userId, maxDelayDayMin, totalDelayMonthMin, eligible, createdAt)
SELECT cycleId, userId, maxDelayDayMin, totalDelayMonthMin, eligible, createdAt
FROM portal_esol.punctuality;

-- Copiar pódio
INSERT INTO portal_360.podium (cycleId, userId, position, avaliacaoGlobal, notaLideranca, nota360, prize, createdAt)
SELECT cycleId, userId, position, avaliacaoGlobal, notaLideranca, nota360, prize, createdAt
FROM portal_esol.podium;

-- Copiar audit flags
INSERT INTO portal_360.audit_flags_360 (cycleId, evaluatorId, evaluateeId, flagType, description, resolved, createdAt)
SELECT cycleId, evaluatorId, evaluateeId, flagType, description, resolved, createdAt
FROM portal_esol.audit_flags;

-- Verificar
SELECT 'Dados do Portal 360° migrados' AS status;
SELECT COUNT(*) as total_cycles FROM portal_360.cycles;
SELECT COUNT(*) as total_criteria FROM portal_360.criteria_360;
SELECT COUNT(*) as total_evaluations FROM portal_360.evaluations_360;
SELECT COUNT(*) as total_aggregates FROM portal_360.aggregates_360;

-- ─── FASE 3: Migrar Dados do Portal Obras ───

-- Copiar projetos
INSERT INTO portal_obras.projects 
SELECT * FROM portal_esol.projects;

-- Copiar membros de projetos
INSERT INTO portal_obras.project_members 
SELECT * FROM portal_esol.project_members;

-- Copiar critérios de obras (apenas tipo 'obra')
INSERT INTO portal_obras.obra_criteria (name, code, category, weight, description, active, sortOrder)
SELECT name, code, category, weight, description, active, sortOrder 
FROM portal_esol.obra_criteria;

-- Copiar avaliações de obras
INSERT INTO portal_obras.obra_evaluations 
SELECT * FROM portal_esol.obra_evaluations;

-- Copiar scores de obras
INSERT INTO portal_obras.obra_scores 
SELECT * FROM portal_esol.obra_scores;

-- Verificar
SELECT 'Dados do Portal Obras migrados' AS status;
SELECT COUNT(*) as total_projects FROM portal_obras.projects;
SELECT COUNT(*) as total_members FROM portal_obras.project_members;
SELECT COUNT(*) as total_criteria FROM portal_obras.obra_criteria;
SELECT COUNT(*) as total_evaluations FROM portal_obras.obra_evaluations;
SELECT COUNT(*) as total_scores FROM portal_obras.obra_scores;

-- ─── FASE 4: Migrar Dados do Portal NPS ───
-- NOTA: Se o banco original não tiver dados de NPS, estas tabelas ficarão vazias
-- Isso é normal na primeira migração

-- Verificar
SELECT 'Dados do Portal NPS migrados' AS status;
SELECT COUNT(*) as total_surveys FROM portal_nps.nps_surveys;
SELECT COUNT(*) as total_responses FROM portal_nps.nps_responses;

-- ─── FASE 5: Validação Pós-Migração ───

-- Verificar integridade de chaves estrangeiras
SELECT 'Validação de Integridade' AS validation;

-- Verificar usuários órfãos em portal_360
SELECT 'Usuários em portal_360 sem área' AS check_name, COUNT(*) as count 
FROM portal_360.users u 
WHERE u.areaId IS NOT NULL AND u.areaId NOT IN (SELECT id FROM portal_360.areas);

-- Verificar ciclos órfãos
SELECT 'Ciclos em portal_360 sem usuários' AS check_name, COUNT(*) as count 
FROM portal_360.cycles c 
WHERE NOT EXISTS (SELECT 1 FROM portal_360.evaluations_360 e WHERE e.cycleId = c.id);

-- Verificar projetos órfãos em portal_obras
SELECT 'Projetos sem membros' AS check_name, COUNT(*) as count 
FROM portal_obras.projects p 
WHERE NOT EXISTS (SELECT 1 FROM portal_obras.project_members pm WHERE pm.projectId = p.id);

-- ─── FASE 6: Resumo da Migração ───

SELECT '═════════════════════════════════════════════════════════════' AS separator;
SELECT 'RESUMO DA MIGRAÇÃO DE DADOS' AS title;
SELECT '═════════════════════════════════════════════════════════════' AS separator;

SELECT 'PORTAL 360°' AS module;
SELECT CONCAT(COUNT(*), ' usuários') as data FROM portal_360.users
UNION ALL
SELECT CONCAT(COUNT(*), ' áreas') FROM portal_360.areas
UNION ALL
SELECT CONCAT(COUNT(*), ' ciclos') FROM portal_360.cycles
UNION ALL
SELECT CONCAT(COUNT(*), ' critérios') FROM portal_360.criteria_360
UNION ALL
SELECT CONCAT(COUNT(*), ' avaliações') FROM portal_360.evaluations_360
UNION ALL
SELECT CONCAT(COUNT(*), ' agregados') FROM portal_360.aggregates_360
UNION ALL
SELECT CONCAT(COUNT(*), ' registros de pódio') FROM portal_360.podium;

SELECT '' AS blank;
SELECT 'PORTAL OBRAS' AS module;
SELECT CONCAT(COUNT(*), ' usuários') as data FROM portal_obras.users
UNION ALL
SELECT CONCAT(COUNT(*), ' projetos') FROM portal_obras.projects
UNION ALL
SELECT CONCAT(COUNT(*), ' membros de projetos') FROM portal_obras.project_members
UNION ALL
SELECT CONCAT(COUNT(*), ' critérios de obras') FROM portal_obras.obra_criteria
UNION ALL
SELECT CONCAT(COUNT(*), ' avaliações de obras') FROM portal_obras.obra_evaluations
UNION ALL
SELECT CONCAT(COUNT(*), ' scores de obras') FROM portal_obras.obra_scores;

SELECT '' AS blank;
SELECT 'PORTAL NPS' AS module;
SELECT CONCAT(COUNT(*), ' usuários') as data FROM portal_nps.users
UNION ALL
SELECT CONCAT(COUNT(*), ' pesquisas NPS') FROM portal_nps.nps_surveys
UNION ALL
SELECT CONCAT(COUNT(*), ' respostas NPS') FROM portal_nps.nps_responses;

SELECT '═════════════════════════════════════════════════════════════' AS separator;
SELECT 'MIGRAÇÃO CONCLUÍDA COM SUCESSO!' AS status;
SELECT '═════════════════════════════════════════════════════════════' AS separator;

-- ─── PRÓXIMOS PASSOS ───
/*
PRÓXIMOS PASSOS APÓS MIGRAÇÃO:

1. VALIDAR DADOS
   - Verifique se os totais acima correspondem aos esperados
   - Execute queries de validação específicas conforme necessário
   - Teste as APIs em ambiente de staging

2. ATUALIZAR CONNECTION STRINGS
   - Atualize as variáveis de ambiente (.env) com os novos bancos:
     DATABASE_360_URL=mysql://user:pass@localhost/portal_360
     DATABASE_OBRAS_URL=mysql://user:pass@localhost/portal_obras
     DATABASE_NPS_URL=mysql://user:pass@localhost/portal_nps

3. TESTAR APLICAÇÃO
   - Teste login e acesso aos 3 módulos
   - Verifique se as avaliações carregam corretamente
   - Teste criação de novas avaliações

4. BACKUP E LIMPEZA
   - Faça backup do banco original (portal_esol) antes de deletá-lo
   - Mantenha o banco original por 30 dias como segurança
   - Após validação completa, considere deletar o banco unificado

5. MONITORAMENTO
   - Monitore performance dos 3 bancos independentes
   - Verifique logs de erro em cada módulo
   - Acompanhe sincronização de usuários entre bancos
*/
