# Handoff — Portal de Avaliação Grupo E-sol

## Visão Geral

Sistema de avaliação de desempenho com 3 módulos:
- **360°** — avaliação entre colaboradores por critérios/ciclos mensais
- **Obras** — avaliação de equipe em projetos de construção
- **NPS** — pesquisa de satisfação de clientes

Acesso futuro em produção: `https://app.grupoesol.com`

---

## Stack

| Camada | Tech |
|--------|------|
| Frontend | React + Vite + Wouter (SPA) |
| Backend | Express + tRPC + TypeScript |
| ORM | Drizzle ORM |
| Banco | MySQL (3 DBs separados: 360, obras, nps) |
| Auth | JWT via cookie + bcrypt |
| Testes | Vitest |
| Design | FLUX/ONYX design system (Tailwind, componentes em `client/src/components/ui/Flux*.tsx`) |

---

## Estrutura

```
portal-avaliacao-esol/
├── client/src/
│   ├── pages/           # Telas (Login, Dashboard, Home, Evaluation360, etc.)
│   ├── components/
│   │   ├── layout/      # Header, Navigation, MainLayout
│   │   └── ui/          # FluxCard, FluxButton, FluxBadge, FluxInput, etc.
│   ├── _core/           # hooks (useAuth, etc.)
│   └── lib/utils.ts
├── server/
│   ├── _core/           # Express app, tRPC setup, DB, env, auth
│   └── routers/         # auth, users, areas, criteria, cycles, evaluations, dashboard, admin, projects
├── shared/              # tipos e constantes compartilhados
├── scripts/             # SQL de migração e seed (já executados no Hostinger)
└── drizzle/             # schemas Drizzle por módulo
```

---

## Setup Local (WSL / Linux)

### 1. Pré-requisitos

```bash
node --version   # v18+ (v22 recomendado)
npm --version
```

### 2. Instalar dependências

```bash
cd portal-avaliacao-esol
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` é obrigatório: `@builder.io/vite-plugin-jsx-loc` não suporta Vite 7 oficialmente.

### 3. Criar `.env` na raiz

```env
DATABASE_360_URL=mysql://u155320717_esol_360:6PsV%5EDa%2BH0%3FPp%5EA0@srv1883.hstgr.io:3306/u155320717_esol_360
DATABASE_OBRAS_URL=mysql://u155320717_esol_obras:6PsV%5EDa%2BH0%3FPp%5EA0@srv1883.hstgr.io:3306/u155320717_esol_obras
DATABASE_NPS_URL=mysql://u155320717_esol_nps:6PsV%5EDa%2BH0%3FPp%5EA0@srv1883.hstgr.io:3306/u155320717_esol_nps
DATABASE_URL=mysql://u155320717_esol_360:6PsV%5EDa%2BH0%3FPp%5EA0@srv1883.hstgr.io:3306/u155320717_esol_360
JWT_SECRET=a740c1071c9092dd9eee27360cc718d78c4171fe004b3ff83fc8350e12414ddf
PORT=3000
NODE_ENV=development
```

> Bancos estão no Hostinger (`srv1883.hstgr.io:3306`). Migrações e seed já foram executados.
> O `.env` está no `.gitignore` — nunca commitar.

### 4. Rodar em dev

```bash
npm run dev
```

Abre em `http://localhost:3000`

### 5. Login admin

| Campo | Valor |
|-------|-------|
| Email | `arlei@grupoesol.com.br` |
| Senha | `esol2026` |

---

## Scripts Disponíveis

```bash
npm run dev       # dev server (Vite HMR + Express)
npm run build     # build de produção → dist/
npm run start     # inicia o build de produção
npm run check     # TypeScript sem erros (tsc --noEmit)
npm run test      # testes unitários (vitest)
```

---

## Banco de Dados

**3 bancos MySQL no Hostinger** (`srv1883.hstgr.io:3306`):

| Banco | Usuário |
|-------|---------|
| `u155320717_esol_360` | `u155320717_esol_360` |
| `u155320717_esol_obras` | `u155320717_esol_obras` |
| `u155320717_esol_nps` | `u155320717_esol_nps` |

Schemas Drizzle em `drizzle/`:
- `schema-360.ts` — users, areas, criteria, cycles, evaluations, aggregates, podium, punctuality
- `schema-obras.ts` — projects, project_members, obra_criteria, obra_evaluations
- `schema-nps.ts` — nps_surveys, nps_responses, nps_aggregates

---

## Estado Atual

### Concluído
- Autenticação completa (login, JWT cookie, primeiro acesso, troca de senha)
- CRUD Admin: usuários, áreas, ciclos
- Formulários de avaliação 360° (mesma área, outras áreas, autoavaliação, liderança, bottom-up)
- Cálculos: nota 360°, liderança, global, bônus desempenho, pódio
- Dashboard usuário (radar, ranking, bônus)
- Dashboard admin (custos, consolidados)
- Detecção antipanelinha
- Duplo setor (campo `secondaryAreaId`/`secondaryLeaderId`)
- Regras de convivência (diretoria não avalia outra área; exclui mesma área e hierarquia direta)
- Seed de dados: 34 usuários, 12 áreas, 19 critérios, ciclos Jan/Fev 2026 (publicados) + Mar 2026 (aberto)
- Build de produção funcionando

### Pendente (próximos passos)
- **Finalizar deploy VPS** (`app.grupoesol.com`):
  - VPS: `93.127.210.137` (Ubuntu 24.04)
  - App em `/var/www/portal-esol`, rodando via PM2 na porta 3001
  - Traefik já configurado em `/docker/traefik/dynamic/esol.yml` — só falta apontar para porta 3001 e testar SSL
  - `.env` de produção já criado em `/var/www/portal-esol/.env`

---

## Deploy VPS (estado atual — incompleto)

A VPS usa **Traefik** como proxy reverso (gerenciado pela Hostinger/openclaw).  
O arquivo de configuração do Traefik fica em `/docker/traefik/dynamic/esol.yml`.

### O que já foi feito na VPS
- Nginx instalado (mas não usado — Traefik é o proxy)
- PM2 instalado e rodando a app como `portal-esol`
- Build gerado em `/var/www/portal-esol/dist/`
- `.env` criado com PORT=3001 (3000 está ocupada pelo browserless)

### O que falta
1. Atualizar `/docker/traefik/dynamic/esol.yml` para apontar para porta 3001:

```yaml
http:
  middlewares:
    esol-headers:
      headers:
        customRequestHeaders:
          X-Forwarded-Proto: "https"

  routers:
    esol-app:
      entryPoints:
        - websecure
      rule: "Host(`app.grupoesol.com`)"
      service: esol-app-svc
      tls:
        certResolver: letsencrypt
      middlewares:
        - esol-headers

  services:
    esol-app-svc:
      loadBalancer:
        servers:
          - url: "http://127.0.0.1:3001"
```

2. Verificar se PM2 está carregando NODE_ENV=production:
```bash
pm2 logs portal-esol --lines 20 --nostream
pm2 env 1 | grep NODE_ENV
```

3. Se NODE_ENV não for production, reiniciar:
```bash
cd /var/www/portal-esol && pm2 restart portal-esol --update-env
```

4. Testar: `curl -sI https://app.grupoesol.com`

---

## Convenções de Código

- Componentes UI próprios: prefixo `Flux` (ex: `FluxCard`, `FluxButton`) — evitar conflito com shadcn
- Ícones: web component `<iconify-icon icon="solar:*-bold-duotone">` (tipado em `custom-elements.d.ts`)
- Rotas: Wouter (`/360/dashboard`, `/360/avaliar/:userId`, `/obras/dashboard`, etc.)
- tRPC: todos os endpoints em `server/routers/` e agregados em `server/routers/index.ts`
- Drizzle: sem migrations automáticas — usar `drizzle-kit generate` + `drizzle-kit migrate` ou SQL manual
