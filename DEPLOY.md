# Deploy: ativar bypass de login + fix de rotas

Esse guia aplica as mudanças deste branch (`codex/obras-only`) na VPS de
produção (`93.127.210.137`, app rodando em PM2 como `portal-esol` na porta
3001, atrás do Traefik) e habilita o **modo dev sem login** que voce pediu.

## O que mudou e por que

1. **Fix de rotas** (`client/src/lib/moduleRouting.ts`, `client/src/_core/hooks/useAuth.ts`)
   - Antes, `Login.tsx` redirecionava para `/modulo-obras/dashboard` apos sucesso, mas
     `App.tsx` so tinha registrado `/obras/dashboard`. Resultado: tela em branco.
     Esse era o motivo real do "nao consigo navegar" - nao era o Traefik.
   - Agora `LOGIN_PATHS` aponta para `/login` e `DASHBOARD_PATHS` aponta para
     `/obras/dashboard`, `/360/dashboard`, `/nps/dashboard`.

2. **Bypass de autenticacao em modo dev** (`server/_core/env.ts`,
   `server/_core/context.ts`, `client/src/pages/Login.tsx`)
   - Nova flag de ambiente `AUTH_BYPASS=1`. Quando ligada, o backend injeta
     automaticamente o usuario admin (default: `arlei@grupoesol.com.br`) em
     todo request tRPC, sem precisar de cookie de sessao.
   - Permite navegar pelo app inteiro sem passar pela tela de login durante
     o desenvolvimento. A tela de login redireciona pro dashboard em vez
     de aparecer.
   - **Religar antes do go-live**: basta remover `AUTH_BYPASS` do `.env` e
     reiniciar o PM2.

## Pre-requisito: branch precisa estar publicado

O branch `codex/obras-only` so existe localmente na sua maquina Windows.
Antes da VPS conseguir `git pull`, voce precisa fazer push, OU aplicar o
patch `esol-auth-bypass.patch` direto na VPS (Opcao B abaixo).

### Opcao A - push do Windows e pull na VPS (recomendado)

No terminal Windows, na raiz do projeto:

```bash
cd C:\Users\arlei\Apps\portal-avaliacao-esol

git add server/_core/env.ts ^
        server/_core/context.ts ^
        client/src/_core/hooks/useAuth.ts ^
        client/src/lib/moduleRouting.ts ^
        client/src/pages/Login.tsx

git commit -m "fix(routing+auth): paths corretos + AUTH_BYPASS dev mode"
git push -u origin codex/obras-only
```

### Opcao B - aplicar patch direto na VPS (sem push)

Use isso se nao quiser pushar agora. O patch esta em
`portal-avaliacao-esol/esol-auth-bypass.patch` (no seu workspace local).

1. Copie o patch pra VPS (de qualquer terminal seu):
   ```bash
   scp esol-auth-bypass.patch root@93.127.210.137:/tmp/
   ```

2. Na VPS:
   ```bash
   cd /var/www/portal-esol
   git apply --check /tmp/esol-auth-bypass.patch  # valida antes
   git apply /tmp/esol-auth-bypass.patch
   ```

## Passos na VPS

```bash
# 1) SSH
ssh root@93.127.210.137

# 2) Ir ate o app
cd /var/www/portal-esol

# 2a) Se voce escolheu Opcao A (push), puxe o branch:
git fetch origin
git checkout codex/obras-only
git pull origin codex/obras-only

# 2b) Se voce escolheu Opcao B (patch), pule o passo 2a -
#     o patch ja foi aplicado via git apply.

# 3) Adicionar a flag no .env (so a flag, nao mexa no resto)
grep -q '^AUTH_BYPASS=' .env || echo 'AUTH_BYPASS=1' >> .env
# (opcional) sobrescrever o email do admin fake
# echo 'AUTH_BYPASS_EMAIL=arlei@grupoesol.com.br' >> .env

# 4) Instalar deps + build
npm install --legacy-peer-deps
npm run build

# 5) Reiniciar PM2 carregando o .env atualizado
pm2 restart portal-esol --update-env
pm2 logs portal-esol --lines 30 --nostream
```

Espera ver no log algo como:

```
[Auth] AUTH_BYPASS ativo - todos os requests assumem arlei@grupoesol.com.br como admin. NAO use em producao.
```

(O warn sai uma unica vez, na primeira request que cair no bypass.)

## Sanity check de fora da VPS

```bash
curl -sS https://app.grupoesol.com/api/trpc/auth.me?batch=1 | head -c 400
# Deve voltar o usuario Arlei mesmo SEM cookie:
# [{"result":{"data":{"json":{"id":1,"openId":"local_arlei","name":"Arlei Povoa", ...}}}}]
```

Depois abre `https://app.grupoesol.com/` no browser:
- Deve ir direto pra Landing.
- Clicar em "Avaliacao 360" / "Obras" / "NPS" / "Admin" agora navega de
  verdade (antes ficava em branco).
- Se voce digitar `/login` direto, ele te redireciona pro dashboard do
  modulo ativo (porque `auth.me` ja devolve um usuario via bypass).

## Reverter o bypass (quando for religar a auth real)

Na VPS:

```bash
cd /var/www/portal-esol
sed -i '/^AUTH_BYPASS=/d' .env
sed -i '/^AUTH_BYPASS_EMAIL=/d' .env
pm2 restart portal-esol --update-env
```

Pronto: volta o fluxo normal de login com cookie. Os fixes de rotas
permanecem (eles nao dependem do bypass).

## Arquivos tocados

```
server/_core/env.ts                  +14 linhas  (flag AUTH_BYPASS)
server/_core/context.ts              +37 linhas  (injeta admin fake)
client/src/lib/moduleRouting.ts      +/-15 linhas (paths corretos)
client/src/_core/hooks/useAuth.ts     +/-1 linha  (fallback /login)
client/src/pages/Login.tsx           +22 linhas  (redirect se ja logado)
```

Type-check (`npx tsc --noEmit`) passa com 0 erros.
