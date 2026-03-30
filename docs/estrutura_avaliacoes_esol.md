# Estrutura Completa de Avaliações e Permissões - Grupo E-sol

Este documento consolida a arquitetura de avaliações, critérios e permissões de acesso para o Portal de Avaliações do Grupo E-sol, integrando as definições do Módulo 360º, Módulo de Obras e Módulo NPS.

## 1. Matriz de Avaliadores e Hierarquia

A estrutura de avaliações baseia-se em três níveis hierárquicos principais, definindo claramente quem avalia quem no sistema global (Avaliação 360º).

### Nível 1: Diretoria (Admin)
**Usuários:** Árlei Póvoa e Nathália Cavalcante
- **Avaliam:** Todos os líderes e todos os outros colaboradores da empresa.
- **São avaliados por:** Ninguém (não recebem avaliações).
- **Permissões:** Acesso total a todos os módulos, edição irrestrita.

### Nível 2: Líderes
**Usuários:** Responsáveis por setores (ex: Anna Lhívia, Gabriel Trindade, Jonas Calegar, etc.)
- **Avaliam:** Seus liderados diretos e todos os outros colaboradores da empresa.
- **São avaliados por:** Seus liderados (avaliação *bottom-up*), Diretoria e colegas de outras áreas.

### Nível 3: Colaboradores (Usuários Normais / Operacionais)
**Usuários:** Membros das equipes de cada setor.
- **Avaliam:** Sua liderança direta, colegas do próprio setor e uma avaliação simplificada de relacionamento com todos os outros colaboradores da empresa.
- **São avaliados por:** Seus líderes, colegas do próprio setor e Diretoria.

## 2. Módulo de Obras (Equipe Operacional)

O Módulo de Obras possui uma dinâmica própria de avaliação, focada na execução de projetos e no desempenho da equipe em campo.

### 2.1. A Segunda Função de Avaliador (Operacional)
Foi criada uma função paralela de avaliação exclusiva para o time operacional durante a execução de obras. Neste contexto, os operacionais avaliam:
1. **Uns aos outros:** Desempenho e comportamento dos colegas na mesma obra.
2. **Projetos:** Qualidade e andamento da obra em si.
3. **Material:** Qualidade, disponibilidade e logística dos materiais utilizados.
4. **Liderança:** Atuação do líder da obra/equipe.

### 2.2. Nomenclatura Específica
Para evitar confusão com a avaliação global da empresa:
- **Avaliação da Equipe:** É o nome dado à avaliação comportamental e de desempenho realizada *entre os instaladores* no contexto de uma obra específica.
- **Avaliação 360º:** Permanece como o nome da avaliação de desempenho e comportamento de *toda a empresa*, realizada nos ciclos regulares.

### 2.3. Critérios de Avaliação de Obras
A nota da obra (0 a 100%) define o valor do bônus mensal a ser distribuído. Ela é composta por:

**A. Segurança (Peso 2,0)**
- Uso de EPI/EPC
- APR Inversor
- APR Módulos
- Acidente/Avaria
- Esquecimento

**B. Funcionalidade (Peso 2,0)**
- Identificação
- Configuração Inversor
- Placa de Advertência
- Prejuízo Financeiro
- Lacre

**C. Estética (Peso 1,0)**
- Montagem Módulos
- Montagem Inversor
- Cabeamento
- Eletroduto / Corrugado
- Telhado / Estrutura
- Ponto de Conexão
- Aterramento
- Quadros
- Imagens Drone
- Limpeza Instalação

**D. Avaliações Complementares**
- Preenchimento de OS (Módulos e Inversores)
- Eficiência
- NPS do Cliente

### 2.4. Distribuição de Bônus Mensal
O valor destinado à obra (baseado na potência em kWp) é corrigido pela Nota da Obra. O valor corrigido é distribuído com pesos diferentes:
- **Líder da Obra:** Recebe 20% a mais sobre sua parte.
- **Organizador:** Recebe 10% a mais sobre sua parte.
- **Instaladores:** Recebem a parte padrão.
*Nota: O valor final a receber por cada indivíduo é proporcional à sua nota na "Avaliação da Equipe" daquela obra.*

## 3. Controle de Acesso por Módulo

Todos os usuários têm acesso ao portal, mas as permissões variam conforme o módulo e o perfil do usuário.

### Módulo 360º (Avaliação Global)
- **Acesso:** Todos os colaboradores (Administrativos e Operacionais).
- **Função:** Realizar as avaliações conforme a Matriz de Avaliadores (Níveis 1, 2 e 3).

### Módulo de Obras
- **Acesso:** 
  - Todos os usuários operacionais (Instaladores, Líderes de Instalação).
  - Usuários administrativos específicos que necessitam realizar avaliações ou auditorias nas obras.
- **Função:** Preenchimento de RDO, OS, Avaliação da Obra e Avaliação da Equipe.

### Módulo NPS (Pesquisa de Satisfação)
- **Leitores:** Todos os usuários do sistema podem visualizar os resultados e feedbacks dos clientes.
- **Editores:** Apenas a Diretoria (Admin) e os usuários alocados na área de "Sucesso do Cliente" podem criar, editar ou gerenciar as pesquisas de NPS.

## 4. Próximos Passos para Implementação Técnica

1. **Atualização do Banco de Dados:**
   - Inserir o tipo `obra` na tabela de critérios.
   - Cadastrar os 20+ subcritérios de Segurança, Funcionalidade e Estética.
   - Criar tabelas para gerenciar Projetos/Obras e a alocação de equipes (com papéis de Líder e Organizador).

2. **Lógica de Backend:**
   - Implementar a segregação de acesso baseada em `appRole`, `areaId` e necessidades específicas (ex: Sucesso do Cliente no NPS).
   - Desenvolver o motor de cálculo da Nota da Obra e a distribuição proporcional do bônus mensal.

3. **Ajustes de Frontend:**
   - Renomear dinamicamente "Avaliação 360º" para "Avaliação da Equipe" quando o usuário estiver navegando no Módulo de Obras.
   - Criar as interfaces de avaliação específicas para operacionais (avaliação de material, projetos, etc.).
