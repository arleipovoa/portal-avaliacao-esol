# Reboot do Portal Avaliação Grupo E-Sol

Data: 2026-04-30 / 05-01

## O que o app é

Portal interno do Grupo E-Sol com **3 módulos independentes** de avaliação:

| Módulo | Função | Banco MySQL |
|---|---|---|
| **360°** | Avaliação peer entre colaboradores por critérios/ciclos mensais (mesma área, outras áreas, autoavaliação, liderança, bottom-up). Calcula nota global + bônus + pódio. | `u155320717_esol_360` |
| **Obras** | Avaliação de equipes em projetos de obra (construção). Vincula projetos do Power BI, scoring por critérios. | `u155320717_esol_obras` |
| **NPS** | Pesquisa de satisfação com clientes (Net Promoter Score). | `u155320717_esol_nps` |

Stack: React + Vite + tRPC + Drizzle ORM + Express + Tailwind, deploy via PM2 atrás do Traefik na VPS `93.127.210.137`.

## Estado atual antes do reboot

- 6+ commits acumulados de IAs anteriores tentando consertar bugs (rotas erradas, Router faltando, distPath, AUTH_BYPASS).
- Backend cheio de scaffold do Manus (OAuth, JWT, SDK, image gen, voice, map, dataApi) que nunca foi usado.
- Frontend com pages órfãs, components mortos, roteamento inconsistente.
- Login complexo + bypass condicional como gambiarra.
- Schemas duplicados (`schema.ts` mistura tudo + `schema-{360,obras,nps}.ts` separados).

## O que vai ser feito (execução agora)

### Backend — radical cleanup

**Remover:**
- `server/_core/sdk.ts` — OAuth Manus, JWT signing
- `server/_core/oauth.ts` + rota `/api/oauth/callback`
- `server/_core/imageGeneration.ts`, `llm.ts`, `voiceTranscription.ts`, `map.ts`, `dataApi.ts`, `notification.ts`
- `server/_core/cookies.ts` (sem cookies de sessão)
- `server/_core/accessControl.ts` (sem controle de acesso por role enquanto não tem login)
- `server/_core/systemRouter.ts` (notifyOwner não é necessário)
- `server/routers/auth.router.ts` (login/logout/changePassword)
- `server/db.ts` legado (mantém só o multi-pool em `_core/db.ts`)
- `drizzle/schema.ts` redundante (mantém `schema-{360,obras,nps}.ts`)

**Simplificar:**
- `server/_core/context.ts` → sempre injeta admin (id 1) sem condição. Sem AUTH_BYPASS, sem cookie, sem JWT.
- `server/_core/trpc.ts` → `protectedProcedure` e `adminProcedure` viram aliases de `publicProcedure` por enquanto.
- `server/_core/env.ts` → enxugar pra só o que é usado (DATABASE_*_URL, PORT, NODE_ENV).
- `server/routers/index.ts` → remover `authRouter` e `systemRouter`.

**Manter intacto:**
- Routers de domínio: `areas`, `criteria`, `cycles`, `dashboard`, `evaluations`, `users`, `projects`, `admin`.
- Schemas Drizzle separados por módulo.
- Services: `bonus.service.ts`, `evaluation.service.ts`.

### Frontend — reboot do roteamento

**Remover:**
- `client/src/pages/Login.tsx`, `Profile.tsx`, `ComponentShowcase.tsx`, `Evaluation360.tsx` (vazio)
- `client/src/components/AIChatBox.tsx`, `ManusDialog.tsx`, `Map.tsx`, `ErrorBoundary.tsx`
- `client/src/components/layout/Header.tsx` (órfão)
- `client/src/_core/hooks/useAuth.ts`
- `client/src/lib/moduleRouting.ts` (lógica de redirecionar por módulo deixa de fazer sentido)

**Reescrever:**
- `client/src/App.tsx` → roteador limpo:
  ```
  /                  → Landing (escolhe módulo)
  /360               → redirect /360/dashboard
  /360/dashboard     → 360 home/dashboard
  /360/avaliacoes    → lista avaliações pendentes
  /360/avaliar/:id   → form de avaliação
  /obras             → redirect /obras/dashboard
  /obras/dashboard   → lista projetos
  /obras/avaliacao   → form de avaliação de obra
  /nps               → redirect /nps/dashboard
  /nps/dashboard     → placeholder
  /admin             → redirect /admin/users
  /admin/users       → CRUD usuários
  /admin/users/:id   → edit user
  /admin/areas       → CRUD áreas
  /admin/cycles      → CRUD ciclos
  /admin/calculate   → cálculo de bônus
  ```
- `client/src/main.tsx` → mantém o `<Router>` (fix do bundle de produção)
- `client/src/pages/Landing.tsx` → 4 cards visualmente claros (360, Obras, NPS, Admin)
- `client/src/components/layout/MainLayout.tsx` + `Navigation.tsx` → enxuga, remove lógica de role-based filter

### Cleanup de deps no package.json

Remover (não usados):
- `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` (S3)
- `framer-motion` (animações)
- `streamdown` (markdown render)
- `pg` (driver Postgres — app é MySQL)
- `@types/google.maps`
- `vite-plugin-manus-runtime` + ativação no vite.config

Manter: react, vite, tailwind, drizzle-orm, mysql2, trpc, zod, wouter, recharts, date-fns, lucide-react, bcryptjs.

### `.env` simplificado

Antes:
```
DATABASE_360_URL=...
DATABASE_OBRAS_URL=...
DATABASE_NPS_URL=...
DATABASE_URL=...
JWT_SECRET=...
PORT=3001
NODE_ENV=production
AUTH_BYPASS=1
```

Depois:
```
DATABASE_360_URL=...
DATABASE_OBRAS_URL=...
DATABASE_NPS_URL=...
PORT=3001
NODE_ENV=production
```

(Sem JWT_SECRET, sem AUTH_BYPASS — não precisamos mais.)

## Ordem de execução

1. **Cria branch novo** `reboot/clean-app` a partir do `codex/obras-only`.
2. **Frontend cleanup** — remove pages/components/hooks órfãos, simplifica Landing/App/MainLayout, enxuga roteamento.
3. **Backend cleanup** — remove arquivos do scaffold Manus + auth router + middlewares. Simplifica context.ts.
4. **Schemas** — remove `schema.ts` legado, mantém os 3 separados.
5. **Deps** — enxuga package.json + reinstala.
6. **Build local** — `tsc --noEmit` + `npm run build` em 0 erros.
7. **Push + Deploy** — push no branch novo + pull + build + restart na VPS.
8. **Smoke test** — curl em cada endpoint principal.

## Critério de "pronto"

- App acessível em `https://app.grupoesol.com/` mostra Landing com 4 cards.
- Clicando em cada card, navega para o dashboard do módulo (sem tela em branco).
- Sidebar funcionando, links navegando.
- Tela de admin (`/admin/users`) lista os 33 usuários do banco.
- Sem login em lugar nenhum.
- Sem erros vermelhos no console do browser.
- `tsc --noEmit` em 0 erros.
- `npm run build` sem warnings críticos.

## Como executar (passos finais)

### 1) PowerShell — commit + push do reboot

```powershell
cd C:\Users\arlei\Apps\portal-avaliacao-esol
Remove-Item .git\index.lock -Force -ErrorAction SilentlyContinue

# Stage tudo (são ~38 arquivos, todos do reboot)
git add -A

git commit -m "reboot: remove auth/oauth/manus scaffold; reescreve roteamento e Landing; -5500 linhas de lixo"

git push origin codex/obras-only
```

### 2) VPS — deploy

```bash
ssh root@93.127.210.137
cd /var/www/portal-esol

git pull origin codex/obras-only

# .env: remover JWT_SECRET, AUTH_BYPASS, manter os 3 DATABASE_*_URL + PORT + NODE_ENV
sed -i '/^JWT_SECRET=/d' .env
sed -i '/^AUTH_BYPASS/d' .env
cat .env

# Reinstalar deps (várias foram removidas) e rebuildar
rm -rf node_modules
npm install --legacy-peer-deps
npm run build

# Restart limpo
pm2 flush portal-esol
pm2 restart portal-esol --update-env
sleep 2
pm2 logs portal-esol --lines 20 --nostream
```

### 3) Smoke test final

```bash
# Local na VPS
curl -sS http://127.0.0.1:3001/ | head -5
curl -sS http://127.0.0.1:3001/api/trpc/auth.me?batch=1 | head -c 300
```

## Pra reativar auth depois

Quando for hora de religar autenticação:
1. Recriar `auth.router.ts` com login + cookie JWT.
2. Trocar de volta `protectedProcedure` pra exigir `ctx.user`.
3. Substituir o admin fake do `context.ts` pela leitura real de cookie.
4. Adicionar `<ProtectedRoute>` de volta no `App.tsx`.

Tudo isso é local e reversível, não exige mexer em DB nem em rotas existentes.
