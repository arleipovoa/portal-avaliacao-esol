-- ============================================================
-- SEED: u155320717_esol_360
-- Portal de Avaliação 360° - Grupo E-sol
-- Execute no phpMyAdmin selecionando o banco esol_360
-- Senha padrão de todos os usuários: esol2026
-- ============================================================

-- ─── 1. Áreas ───
INSERT INTO areas (name, companyName, status) VALUES
  ('Diretoria', 'Grupo E-sol', 'active'),
  ('Comercial', 'E-sol Engenharia', 'active'),
  ('Instalação', 'E-sol Engenharia', 'active'),
  ('Projetos', 'E-sol Engenharia', 'active'),
  ('Administrativo', 'Grupo E-sol', 'active'),
  ('Sucesso do Cliente', 'Grupo E-sol', 'active'),
  ('OPEX Solar', 'OPEX Solar', 'active'),
  ('ELEX SET', 'ELEX Soluções Elétricas e Telecom', 'active'),
  ('ELEX Material Elétrico', 'ELEX Material Elétrico', 'active'),
  ('reXiclar', 'reXiclar', 'active'),
  ('Suprimentos', 'Grupo E-sol', 'active'),
  ('Estúdio Paisagismo', 'Estúdio Paisagismo', 'active')
ON DUPLICATE KEY UPDATE companyName = VALUES(companyName);

-- ─── 2. Critérios ───
INSERT INTO criteria (name, code, type, description, active, sortOrder) VALUES
  ('Comunicação e clareza', 'comunicacao_clareza', 'base360', 'Capacidade de se comunicar de forma clara e objetiva.', 1, 1),
  ('Colaboração e espírito de equipe', 'colaboracao_equipe', 'base360', 'Disposição para trabalhar em equipe e ajudar colegas.', 1, 2),
  ('Respeito e postura profissional', 'respeito_postura', 'base360', 'Respeito aos colegas, clientes e normas da empresa.', 1, 3),
  ('Entrega e qualidade técnica', 'entrega_qualidade_tecnica', 'detailed360', 'Acabamentos, padrões E-sol, ausência de retrabalho.', 1, 4),
  ('Cumprimento de prazos e SLAs', 'cumprimento_prazos_slas', 'detailed360', 'Entrega dentro dos prazos acordados.', 1, 5),
  ('Organização, planejamento e processos', 'organizacao_processos', 'detailed360', 'Uso correto dos processos/sistemas (OS/CRM/ERP/checklists).', 1, 6),
  ('Proatividade e melhoria contínua', 'proatividade_melhoria', 'detailed360', 'Sugere melhorias, resolve problemas sem ser solicitado.', 1, 7),
  ('Segurança, EPIs e zelo', 'seguranca_5s_epis', 'detailed360', 'Atenção a normas de segurança, 5S, EPIs e zelo pelo patrimônio/veículos.', 1, 8),
  ('Documentação e registro', 'documentacao_registro', 'detailed360', 'Checklists, fotos, relatórios, CRM atualizado.', 1, 9),
  ('Foco no cliente e pós-venda', 'foco_cliente_posvenda', 'detailed360', 'Cordialidade, solução efetiva, retorno ao cliente.', 1, 10),
  ('Autonomia e gestão de prioridades', 'autonomia_prioridades', 'detailed360', 'Puxa responsabilidade, precisa de pouca supervisão.', 1, 11),
  ('Confiabilidade e consistência', 'confiabilidade_consistencia', 'detailed360', 'Mantém padrão de entrega ao longo do mês.', 1, 12),
  ('Resultado/Metas da função', 'resultado_metas', 'leadership', 'Entregas, produtividade, indicadores.', 1, 13),
  ('Qualidade e retrabalho', 'qualidade_retrabalho', 'leadership', 'Erro/ajuste, padrão técnico.', 1, 14),
  ('Aderência a processos e prazos', 'aderencia_processos_prazos', 'leadership', 'Disciplina operacional.', 1, 15),
  ('Postura e valores', 'postura_valores', 'leadership', 'Profissionalismo, respeito, ética.', 1, 16),
  ('Desenvolvimento e autonomia', 'desenvolvimento_autonomia', 'leadership', 'Aprendizado, evolução, mentoria/cooperatividade.', 1, 17),
  ('Foco no cliente e impacto de negócio', 'foco_cliente_negocio', 'leadership', 'Impacto das ações no resultado do negócio.', 1, 18),
  ('Organização e zelo', 'seguranca_5s_zelo', 'leadership', 'Quando aplicável à função.', 1, 19)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), sortOrder = VALUES(sortOrder);

-- ─── 3. Usuários (senha padrão: esol2026) ───
INSERT INTO users (openId, name, email, passwordHash, appRole, role, areaId, jobCategory, mustChangePassword, status, loginMethod, lastSignedIn) VALUES
  ('local_arlei',         'Árlei Póvoa',          'arlei@grupoesol.com.br',              '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'admin',    'admin', (SELECT id FROM (SELECT id FROM areas WHERE name='Diretoria') a),              'administrativo', 1, 'active', 'email', NOW()),
  ('local_nathalia',      'Nathália Cavalcante',   'nathalia@grupoesol.com.br',           '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'admin',    'admin', (SELECT id FROM (SELECT id FROM areas WHERE name='Administrativo') a),         'administrativo', 1, 'active', 'email', NOW()),
  ('local_anna',          'Anna Lhívia',           'anna@grupoesol.com.br',               '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'leader',   'user',  (SELECT id FROM (SELECT id FROM areas WHERE name='Comercial') a),               'administrativo', 1, 'active', 'email', NOW()),
  ('local_gabriel',       'Gabriel Trindade',      'gabriel@grupoesol.com.br',            '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'leader',   'user',  (SELECT id FROM (SELECT id FROM areas WHERE name='Instalação') a),              'operacional',    1, 'active', 'email', NOW()),
  ('local_jonas',         'Jonas Calegar',         'jonas@grupoesol.com.br',              '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'leader',   'user',  (SELECT id FROM (SELECT id FROM areas WHERE name='OPEX Solar') a),              'operacional',    1, 'active', 'email', NOW()),
  ('local_alam',          'Alam Saraiva',          'alam@grupoesol.com.br',               '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'leader',   'user',  (SELECT id FROM (SELECT id FROM areas WHERE name='Instalação') a),              'operacional',    1, 'active', 'email', NOW()),
  ('local_lucas',         'Lucas Melo',            'lucas@grupoesol.com.br',              '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'leader',   'user',  (SELECT id FROM (SELECT id FROM areas WHERE name='ELEX Material Elétrico') a),  'administrativo', 1, 'active', 'email', NOW()),
  ('local_fabio_s',       'Fábio Sanches',         'fabio.sanches@grupoesol.com.br',      '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'leader',   'user',  (SELECT id FROM (SELECT id FROM areas WHERE name='reXiclar') a),                'administrativo', 1, 'active', 'email', NOW()),
  ('local_rayandra',      'Rayandra Leite',        'rayandra@grupoesol.com.br',           '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'leader',   'user',  (SELECT id FROM (SELECT id FROM areas WHERE name='Sucesso do Cliente') a),      'administrativo', 1, 'active', 'email', NOW()),
  ('local_caroline',      'Caroline Martins',      'caroline@grupoesol.com.br',           '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'leader',   'user',  (SELECT id FROM (SELECT id FROM areas WHERE name='Administrativo') a),         'administrativo', 1, 'active', 'email', NOW()),
  ('local_wesley_f',      'Wesley Fernandes',      'wesley.fernandes@grupoesol.com.br',   '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'leader',   'user',  (SELECT id FROM (SELECT id FROM areas WHERE name='ELEX SET') a),                'administrativo', 1, 'active', 'email', NOW()),
  ('local_kaylane',       'Kaylane',               'kaylane@grupoesol.com.br',            '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'employee', 'user',  (SELECT id FROM (SELECT id FROM areas WHERE name='Comercial') a),               'administrativo', 1, 'active', 'email', NOW()),
  ('local_nath_morais',   'Nathália Morais',       'nathalia.morais@grupoesol.com.br',    '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'employee', 'user',  (SELECT id FROM (SELECT id FROM areas WHERE name='Comercial') a),               'administrativo', 1, 'active', 'email', NOW()),
  ('local_marcos',        'Marcos José',           'marcos@grupoesol.com.br',             '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'employee', 'user',  (SELECT id FROM (SELECT id FROM areas WHERE name='Comercial') a),               'administrativo', 1, 'active', 'email', NOW()),
  ('local_anderson',      'Anderson',              'anderson@grupoesol.com.br',           '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'employee', 'user',  (SELECT id FROM (SELECT id FROM areas WHERE name='Comercial') a),               'administrativo', 1, 'active', 'email', NOW()),
  ('local_roger',         'Roger',                 'roger@grupoesol.com.br',              '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'employee', 'user',  (SELECT id FROM (SELECT id FROM areas WHERE name='Comercial') a),               'administrativo', 1, 'active', 'email', NOW()),
  ('local_gustavo_g',     'Gustavo Gomes',         'gustavo.gomes@grupoesol.com.br',      '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'employee', 'user',  (SELECT id FROM (SELECT id FROM areas WHERE name='Instalação') a),              'operacional',    1, 'active', 'email', NOW()),
  ('local_elder',         'Élder Silva',           'elder@grupoesol.com.br',              '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'employee', 'user',  (SELECT id FROM (SELECT id FROM areas WHERE name='Instalação') a),              'operacional',    1, 'active', 'email', NOW()),
  ('local_wesley_g',      'Wesley Garcia',         'wesley.garcia@grupoesol.com.br',      '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'employee', 'user',  (SELECT id FROM (SELECT id FROM areas WHERE name='Instalação') a),              'operacional',    1, 'active', 'email', NOW()),
  ('local_fabio_m',       'Fábio Marques',         'fabio.marques@grupoesol.com.br',      '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'employee', 'user',  (SELECT id FROM (SELECT id FROM areas WHERE name='Instalação') a),              'operacional',    1, 'active', 'email', NOW()),
  ('local_luan',          'Luan Mendes',           'luan@grupoesol.com.br',               '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'employee', 'user',  (SELECT id FROM (SELECT id FROM areas WHERE name='Projetos') a),                'administrativo', 1, 'active', 'email', NOW()),
  ('local_cassiana',      'Cassiana',              'cassiana@grupoesol.com.br',           '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'employee', 'user',  (SELECT id FROM (SELECT id FROM areas WHERE name='Administrativo') a),         'administrativo', 1, 'active', 'email', NOW()),
  ('local_yara',          'Yara Portes',           'yara@grupoesol.com.br',               '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'employee', 'user',  (SELECT id FROM (SELECT id FROM areas WHERE name='Sucesso do Cliente') a),      'administrativo', 1, 'active', 'email', NOW()),
  ('local_georgia',       'Georgia Baia',          'georgia@grupoesol.com.br',            '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'employee', 'user',  (SELECT id FROM (SELECT id FROM areas WHERE name='Sucesso do Cliente') a),      'administrativo', 1, 'active', 'email', NOW()),
  ('local_livia',         'Lívia',                 'livia@grupoesol.com.br',              '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'employee', 'user',  (SELECT id FROM (SELECT id FROM areas WHERE name='Sucesso do Cliente') a),      'administrativo', 1, 'active', 'email', NOW()),
  ('local_elivelton',     'Elivelton',             'elivelton@grupoesol.com.br',          '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'employee', 'user',  (SELECT id FROM (SELECT id FROM areas WHERE name='OPEX Solar') a),              'operacional',    1, 'active', 'email', NOW()),
  ('local_enderson',      'Enderson',              'enderson@grupoesol.com.br',           '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'employee', 'user',  (SELECT id FROM (SELECT id FROM areas WHERE name='OPEX Solar') a),              'operacional',    1, 'active', 'email', NOW()),
  ('local_gustavo_p',     'Gustavo Painha',        'gustavo.painha@grupoesol.com.br',     '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'employee', 'user',  (SELECT id FROM (SELECT id FROM areas WHERE name='OPEX Solar') a),              'operacional',    1, 'active', 'email', NOW()),
  ('local_hyan',          'Hyan',                  'hyan@grupoesol.com.br',               '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'employee', 'user',  (SELECT id FROM (SELECT id FROM areas WHERE name='ELEX SET') a),                'operacional',    1, 'active', 'email', NOW()),
  ('local_matheus_r',     'Matheus Ramos',         'matheus.ramos@grupoesol.com.br',      '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'employee', 'user',  (SELECT id FROM (SELECT id FROM areas WHERE name='ELEX SET') a),                'operacional',    1, 'active', 'email', NOW()),
  ('local_jaqueline',     'Jaqueline Paiva',       'jaqueline@grupoesol.com.br',          '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'employee', 'user',  (SELECT id FROM (SELECT id FROM areas WHERE name='ELEX Material Elétrico') a),  'administrativo', 1, 'active', 'email', NOW()),
  ('local_matheus_c',     'Matheus Cândido',       'matheus.candido@grupoesol.com.br',    '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'employee', 'user',  (SELECT id FROM (SELECT id FROM areas WHERE name='reXiclar') a),                'operacional',    1, 'active', 'email', NOW()),
  ('local_gustavo_e',     'Gustavo Emanoel',       'gustavo.emanoel@grupoesol.com.br',    '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'employee', 'user',  (SELECT id FROM (SELECT id FROM areas WHERE name='reXiclar') a),                'operacional',    1, 'active', 'email', NOW()),
  ('local_jhemilly',      'Jhemilly Viana',        'jhemilly@grupoesol.com.br',           '$2b$10$4al8Q9UpmlF4aKZPf7XDou2Ws3PGfNDczIuTMRn4UmRfMzXT/ywvK', 'employee', 'user',  (SELECT id FROM (SELECT id FROM areas WHERE name='Estúdio Paisagismo') a),      'operacional',    1, 'active', 'email', NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ─── 4. Relacionamentos líder → liderado ───
-- Árlei lidera: Anna, Gabriel, Jonas, Alam, Lucas, Fábio S, Rayandra, Caroline, Nathália C, Luan, Wesley F
UPDATE users SET leaderId = (SELECT id FROM (SELECT id FROM users WHERE email='arlei@grupoesol.com.br') u)
WHERE email IN ('anna@grupoesol.com.br','gabriel@grupoesol.com.br','jonas@grupoesol.com.br','alam@grupoesol.com.br','lucas@grupoesol.com.br','fabio.sanches@grupoesol.com.br','rayandra@grupoesol.com.br','caroline@grupoesol.com.br','nathalia@grupoesol.com.br','luan@grupoesol.com.br','wesley.fernandes@grupoesol.com.br');

-- Anna lidera: Comercial
UPDATE users SET leaderId = (SELECT id FROM (SELECT id FROM users WHERE email='anna@grupoesol.com.br') u)
WHERE email IN ('kaylane@grupoesol.com.br','nathalia.morais@grupoesol.com.br','marcos@grupoesol.com.br','anderson@grupoesol.com.br','roger@grupoesol.com.br');

-- Gabriel lidera: Instalação
UPDATE users SET leaderId = (SELECT id FROM (SELECT id FROM users WHERE email='gabriel@grupoesol.com.br') u)
WHERE email IN ('gustavo.gomes@grupoesol.com.br','elder@grupoesol.com.br','wesley.garcia@grupoesol.com.br','fabio.marques@grupoesol.com.br');

-- Jonas lidera: OPEX Solar
UPDATE users SET leaderId = (SELECT id FROM (SELECT id FROM users WHERE email='jonas@grupoesol.com.br') u)
WHERE email IN ('elivelton@grupoesol.com.br','enderson@grupoesol.com.br','gustavo.painha@grupoesol.com.br');

-- Wesley F lidera: ELEX SET
UPDATE users SET leaderId = (SELECT id FROM (SELECT id FROM users WHERE email='wesley.fernandes@grupoesol.com.br') u)
WHERE email IN ('hyan@grupoesol.com.br','matheus.ramos@grupoesol.com.br');

-- Lucas lidera: ELEX Material Elétrico
UPDATE users SET leaderId = (SELECT id FROM (SELECT id FROM users WHERE email='lucas@grupoesol.com.br') u)
WHERE email = 'jaqueline@grupoesol.com.br';

-- Fábio S lidera: reXiclar
UPDATE users SET leaderId = (SELECT id FROM (SELECT id FROM users WHERE email='fabio.sanches@grupoesol.com.br') u)
WHERE email IN ('matheus.candido@grupoesol.com.br','gustavo.emanoel@grupoesol.com.br');

-- Rayandra lidera: Sucesso do Cliente
UPDATE users SET leaderId = (SELECT id FROM (SELECT id FROM users WHERE email='rayandra@grupoesol.com.br') u)
WHERE email IN ('yara@grupoesol.com.br','georgia@grupoesol.com.br','livia@grupoesol.com.br');

-- Caroline lidera: Administrativo (Cassiana)
UPDATE users SET leaderId = (SELECT id FROM (SELECT id FROM users WHERE email='caroline@grupoesol.com.br') u)
WHERE email = 'cassiana@grupoesol.com.br';

-- Nathália C lidera: Estúdio Paisagismo (Jhemilly)
UPDATE users SET leaderId = (SELECT id FROM (SELECT id FROM users WHERE email='nathalia@grupoesol.com.br') u)
WHERE email = 'jhemilly@grupoesol.com.br';

-- Duplo setor: Enderson e Gustavo Painha → secundário = Estúdio Paisagismo / líder secundário = Nathália C
UPDATE users SET
  secondaryAreaId = (SELECT id FROM (SELECT id FROM areas WHERE name='Estúdio Paisagismo') a),
  secondaryLeaderId = (SELECT id FROM (SELECT id FROM users WHERE email='nathalia@grupoesol.com.br') u)
WHERE email IN ('enderson@grupoesol.com.br','gustavo.painha@grupoesol.com.br');

-- ─── 5. Líderes das áreas ───
UPDATE areas SET leaderId = (SELECT id FROM (SELECT id FROM users WHERE email='arlei@grupoesol.com.br') u) WHERE name = 'Diretoria';
UPDATE areas SET leaderId = (SELECT id FROM (SELECT id FROM users WHERE email='anna@grupoesol.com.br') u) WHERE name = 'Comercial';
UPDATE areas SET leaderId = (SELECT id FROM (SELECT id FROM users WHERE email='gabriel@grupoesol.com.br') u) WHERE name = 'Instalação';
UPDATE areas SET leaderId = (SELECT id FROM (SELECT id FROM users WHERE email='arlei@grupoesol.com.br') u) WHERE name = 'Projetos';
UPDATE areas SET leaderId = (SELECT id FROM (SELECT id FROM users WHERE email='caroline@grupoesol.com.br') u) WHERE name = 'Administrativo';
UPDATE areas SET leaderId = (SELECT id FROM (SELECT id FROM users WHERE email='rayandra@grupoesol.com.br') u) WHERE name = 'Sucesso do Cliente';
UPDATE areas SET leaderId = (SELECT id FROM (SELECT id FROM users WHERE email='jonas@grupoesol.com.br') u) WHERE name = 'OPEX Solar';
UPDATE areas SET leaderId = (SELECT id FROM (SELECT id FROM users WHERE email='wesley.fernandes@grupoesol.com.br') u) WHERE name = 'ELEX SET';
UPDATE areas SET leaderId = (SELECT id FROM (SELECT id FROM users WHERE email='lucas@grupoesol.com.br') u) WHERE name = 'ELEX Material Elétrico';
UPDATE areas SET leaderId = (SELECT id FROM (SELECT id FROM users WHERE email='fabio.sanches@grupoesol.com.br') u) WHERE name = 'reXiclar';
UPDATE areas SET leaderId = (SELECT id FROM (SELECT id FROM users WHERE email='arlei@grupoesol.com.br') u) WHERE name = 'Suprimentos';
UPDATE areas SET leaderId = (SELECT id FROM (SELECT id FROM users WHERE email='nathalia@grupoesol.com.br') u) WHERE name = 'Estúdio Paisagismo';

-- ─── 6. Ciclos Jan/Fev 2026 (publicados, nota 10) e Mar 2026 (aberto) ───
INSERT INTO cycles (monthYear, status) VALUES
  ('2026-01', 'published'),
  ('2026-02', 'published'),
  ('2026-03', 'open')
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- Aggregates Jan 2026 (nota 10 para todos)
INSERT INTO aggregates (cycleId, userId, nota360, notaLideranca, avaliacaoGlobal, bonusPontualidade, bonusDesempenho, bonusPodio, totalBonus, radarData)
SELECT
  (SELECT id FROM cycles WHERE monthYear='2026-01'),
  u.id,
  10.00, 10.00, 10.00, 125.00, 125.00, 0.00, 250.00,
  '{"Comunicação & Postura":10,"Qualidade & Técnica":10,"Processos & Prazos":10,"Autonomia & Proatividade":10,"Segurança & Zelo":10}'
FROM users u WHERE u.status = 'active'
ON DUPLICATE KEY UPDATE nota360 = VALUES(nota360);

-- Punctuality Jan 2026
INSERT INTO punctuality (cycleId, userId, maxDelayDayMin, totalDelayMonthMin, eligible)
SELECT (SELECT id FROM cycles WHERE monthYear='2026-01'), u.id, 0, 0, 1
FROM users u WHERE u.status = 'active'
ON DUPLICATE KEY UPDATE eligible = VALUES(eligible);

-- Aggregates Fev 2026 (nota 10 para todos)
INSERT INTO aggregates (cycleId, userId, nota360, notaLideranca, avaliacaoGlobal, bonusPontualidade, bonusDesempenho, bonusPodio, totalBonus, radarData)
SELECT
  (SELECT id FROM cycles WHERE monthYear='2026-02'),
  u.id,
  10.00, 10.00, 10.00, 125.00, 125.00, 0.00, 250.00,
  '{"Comunicação & Postura":10,"Qualidade & Técnica":10,"Processos & Prazos":10,"Autonomia & Proatividade":10,"Segurança & Zelo":10}'
FROM users u WHERE u.status = 'active'
ON DUPLICATE KEY UPDATE nota360 = VALUES(nota360);

-- Punctuality Fev 2026
INSERT INTO punctuality (cycleId, userId, maxDelayDayMin, totalDelayMonthMin, eligible)
SELECT (SELECT id FROM cycles WHERE monthYear='2026-02'), u.id, 0, 0, 1
FROM users u WHERE u.status = 'active'
ON DUPLICATE KEY UPDATE eligible = VALUES(eligible);
