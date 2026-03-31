# Nova Arquitetura: Sistemas Independentes

## Visão Geral

O sistema Central E-sol foi refatorado para utilizar uma arquitetura de **sistemas independentes**, separando os três principais módulos de avaliação em bancos de dados e rotas de API distintos. Esta mudança resolve problemas de acoplamento, conflitos de ciclos de avaliação e cálculos de bônus misturados.

## 1. Bancos de Dados Independentes

O sistema agora se conecta a 3 bancos de dados MySQL separados:

| Módulo | Banco de Dados | Variável de Ambiente | Foco Principal |
|--------|----------------|----------------------|----------------|
| **Portal 360°** | `portal_360` | `DATABASE_360_URL` | Avaliação de desempenho, comportamento, ciclos mensais e pódio trimestral. |
| **Portal Obras** | `portal_obras` | `DATABASE_OBRAS_URL` | Avaliação técnica de instalações, projetos, equipes e bônus por kWp. |
| **Portal NPS** | `portal_nps` | `DATABASE_NPS_URL` | Pesquisas de satisfação contínuas com clientes. |

*Nota: A tabela `users` é mantida sincronizada entre os 3 bancos para garantir o login único (SSO).*

## 2. Estrutura do Backend (Node.js / Drizzle ORM)

### 2.1 Conexão com Banco de Dados (`server/_core/db.ts`)
O arquivo central de banco de dados agora exporta 3 instâncias do Drizzle:
- `db360`
- `dbObras`
- `dbNps`

### 2.2 Schemas Separados (`drizzle/`)
Os schemas do Drizzle foram divididos para refletir a nova estrutura:
- `schema-360.ts`: Tabelas de ciclos, critérios 360, avaliações e agregados.
- `schema-obras.ts`: Tabelas de projetos, membros, critérios de obras e scores.
- `schema-nps.ts`: Tabelas de pesquisas, respostas e agregados NPS.

### 2.3 Rotas de API Independentes (`server/routers/`)
As rotas foram separadas por domínio de negócio:
- `/api/360/*` -> `evaluation-360.router.ts`
- `/api/obras/*` -> `evaluation-obras.router.ts`
- `/api/nps/*` -> `nps.router.ts`

## 3. Regras de Negócio e Controle de Acesso

A separação permitiu implementar regras de acesso mais granulares:

### Portal 360°
- **Acesso:** Todos os colaboradores.
- **Ciclos:** Mensais (com deadlines estritas).
- **Bônus:** Pontualidade + Desempenho (mensal) e Pódio (trimestral).

### Portal Obras
- **Acesso:** Operacionais, Líderes e Administradores.
- **Ciclos:** Por projeto (início e fim da obra).
- **Bônus:** Baseado na categoria da obra (kWp) e nota final (Segurança, Funcionalidade, Estética).

### Portal NPS
- **Acesso (Leitura):** Todos os colaboradores.
- **Acesso (Edição):** Apenas Administradores e setor "Sucesso do Cliente".
- **Ciclos:** Contínuo.

## 4. Próximos Passos (Frontend)

Com o backend refatorado, o frontend (React) precisará ser atualizado para:
1. Consumir as novas rotas de API (`/api/360`, `/api/obras`, `/api/nps`).
2. Separar os componentes de formulário de avaliação (atualmente genéricos).
3. Renomear "Avaliação 360º" para "Avaliação da Equipe" quando dentro do contexto do Portal de Obras.
