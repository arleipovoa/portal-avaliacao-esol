# Migrations para Módulo de Obras

Este documento descreve as migrations necessárias para implementar o Módulo de Obras no Portal de Avaliações.

## Estrutura de Migrations

### 1. Migration 0004: Adicionar Tabelas de Obras
**Arquivo:** `drizzle/0004_add_obra_tables.sql`

Cria as seguintes tabelas:
- `projects` - Armazena informações das obras (código, cliente, datas, potência, categoria de bônus)
- `project_members` - Aloca instaladores às obras com seus papéis (Líder, Organizador, Instalador)
- `obra_criteria` - Critérios específicos de avaliação de obras
- `obra_evaluations` - Avaliações das obras preenchidas
- `obra_scores` - Notas consolidadas por obra (0-100%)

**Como executar:**
```bash
# No seu cliente MySQL (DBeaver, DataGrip, MySQL Workbench, etc.)
# Abra o arquivo drizzle/0004_add_obra_tables.sql
# Execute todo o conteúdo no seu banco de dados
```

### 2. Script de Inserção: Critérios de Obras
**Arquivo:** `scripts/insert_obra_criteria.sql`

Insere os 24 critérios de avaliação de obras:
- **5 critérios de Segurança** (Peso 2.0)
- **5 critérios de Funcionalidade** (Peso 2.0)
- **10 critérios de Estética** (Peso 1.0)
- **4 critérios Complementares** (Peso 1.0)

**Como executar:**
```bash
# No seu cliente MySQL
# Abra o arquivo scripts/insert_obra_criteria.sql
# Execute todo o conteúdo no seu banco de dados
```

## Ordem de Execução

1. **Primeiro:** Execute `0004_add_obra_tables.sql` para criar as tabelas
2. **Depois:** Execute `insert_obra_criteria.sql` para inserir os critérios

## Estrutura das Tabelas

### projects
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | ID único |
| code | VARCHAR(50) | Código da obra (ex: P1000) |
| clientName | VARCHAR(255) | Nome do cliente |
| address | TEXT | Endereço da obra |
| city | VARCHAR(100) | Cidade |
| state | VARCHAR(2) | Estado (UF) |
| startDate | TIMESTAMP | Data de início |
| endDate | TIMESTAMP | Data prevista de término |
| completedDate | TIMESTAMP | Data de conclusão real |
| moduleCount | INT | Quantidade de módulos |
| modulePower | INT | Potência por módulo (Wp) |
| powerKwp | DECIMAL(8,2) | Potência total (kWp) |
| category | ENUM | Categoria de bônus (B1-B7) |
| status | ENUM | Status (planning, in_progress, completed, cancelled) |

### project_members
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | ID único |
| projectId | INT | ID da obra |
| userId | INT | ID do usuário (instalador) |
| role | ENUM | Papel (leader, organizer, installer) |
| joinedAt | TIMESTAMP | Data de entrada |
| leftAt | TIMESTAMP | Data de saída (se aplicável) |

### obra_criteria
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | ID único |
| name | VARCHAR(255) | Nome do critério |
| code | VARCHAR(100) | Código único (ex: uso_epi_epc) |
| category | ENUM | Categoria (seguranca, funcionalidade, estetica, complementar) |
| weight | DECIMAL(3,1) | Peso para cálculo (2.0, 1.0, etc) |
| description | TEXT | Descrição detalhada |
| active | BOOLEAN | Ativo/Inativo |
| sortOrder | INT | Ordem de exibição |

### obra_evaluations
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | ID único |
| projectId | INT | ID da obra |
| evaluatorId | INT | ID do avaliador |
| evaluatedMemberIds | JSON | Array de IDs dos membros avaliados |
| items | JSON | Array de {criteriaId, score, justification} |
| status | ENUM | Status (draft, submitted) |
| submittedAt | TIMESTAMP | Data de submissão |

### obra_scores
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | ID único |
| projectId | INT | ID da obra |
| userId | INT | ID do usuário |
| notaSeguranca | DECIMAL(5,2) | Nota de Segurança (0-10) |
| notaFuncionalidade | DECIMAL(5,2) | Nota de Funcionalidade (0-10) |
| notaEstetica | DECIMAL(5,2) | Nota de Estética (0-10) |
| mediaOs | DECIMAL(5,2) | Média de preenchimento de OS (0-10) |
| eficiencia | DECIMAL(5,2) | Nota de Eficiência (0-10) |
| npsCliente | DECIMAL(5,2) | NPS do Cliente (0-10) |
| notaObraPercentual | DECIMAL(6,2) | Nota final da obra (0-100) |
| bonusValorBase | DECIMAL(10,2) | Valor base do bônus |
| bonusValorCorrigido | DECIMAL(10,2) | Valor corrigido (base × score/100) |

## Cálculo da Nota da Obra

A nota final da obra (0-100%) é calculada através da seguinte fórmula:

```
notaObraPercentual = ((notaSeguranca × 2 + notaFuncionalidade × 2 + notaEstetica × 1) / 5) × peso_base
                     + (mediaOs × peso_os)
                     + (eficiencia × peso_eficiencia)
                     + (npsCliente × peso_nps)
```

Onde os pesos são ajustáveis conforme política da empresa.

## Integração com Sistema de Bônus

O valor do bônus mensal é calculado como:

```
bonusValorCorrigido = bonusValorBase × (notaObraPercentual / 100)
```

O `bonusValorBase` é determinado pela categoria da obra (B1-B7) conforme tabela:

| Categoria | Potência (kWp) | Valor Base |
|-----------|-----------------|-----------|
| B1 | ≤ 5 | R$ 200,00 |
| B2 | 5 < B2 ≤ 10 | R$ 300,00 |
| B3 | 10 < B3 ≤ 20 | R$ 500,00 |
| B4 | 20 < B4 ≤ 30 | R$ 750,00 |
| B5 | 30 < B5 ≤ 50 | R$ 1.000,00 |
| B6 | 50 < B6 ≤ 75 | R$ 1.500,00 |
| B7 | 75 < B7 ≤ 112,5 | R$ 2.000,00 |

## Próximos Passos

Após executar as migrations:

1. Atualizar o Drizzle schema (TypeScript) para incluir as novas tabelas
2. Implementar os endpoints de API para CRUD de obras
3. Criar interfaces de avaliação no frontend
4. Implementar a lógica de cálculo de bônus
5. Integrar com o sistema de pódio trimestral
