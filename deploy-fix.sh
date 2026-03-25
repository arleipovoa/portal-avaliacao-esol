#!/bin/bash
set -e

echo "============================================"
echo "  Deploy Fix - Portal Avaliações E-sol"
echo "  Corrige: base path /obras/ + Nginx"
echo "============================================"

cd /var/www/obras

# ─────────────────────────────────────────────
# 1. NGINX — Adicionar location /obras/ → porta 3001
# ─────────────────────────────────────────────
echo ""
echo ">>> [1/5] Configurando Nginx..."

# Backup
cp /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.bak.$(date +%s) 2>/dev/null || true

# Verificar se já tem location /obras/
if grep -q "location /obras/" /etc/nginx/sites-enabled/default 2>/dev/null; then
  echo "    location /obras/ já existe no Nginx, pulando..."
else
  # Inserir location /obras/ ANTES do location / existente
  sed -i '/location \/ {/i \
    location /obras/ {\
        proxy_pass http://localhost:3001;\
        proxy_http_version 1.1;\
        proxy_set_header Upgrade $http_upgrade;\
        proxy_set_header Connection '\''upgrade'\'';\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
        proxy_cache_bypass $http_upgrade;\
    }\
' /etc/nginx/sites-enabled/default
  echo "    ✅ location /obras/ adicionado apontando para porta 3001"
fi

# Testar e recarregar Nginx
nginx -t && systemctl reload nginx
echo "    ✅ Nginx recarregado"

# ─────────────────────────────────────────────
# 2. shared/const.ts — Adicionar BASE_PATH
# ─────────────────────────────────────────────
echo ""
echo ">>> [2/5] Atualizando shared/const.ts..."

cat > shared/const.ts << 'ENDOFFILE'
export const COOKIE_NAME = "app_session_id";
// Base path for deployment (e.g. '/obras' when served under example.com/obras/)
export const BASE_PATH = "/obras";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';
ENDOFFILE
echo "    ✅ BASE_PATH adicionado"

# ─────────────────────────────────────────────
# 3. vite.config.ts — Adicionar base: "/obras/"
# ─────────────────────────────────────────────
echo ""
echo ">>> [3/5] Atualizando vite.config.ts, server, client..."

# Adicionar base: "/obras/" se não existir
if grep -q 'base: "/obras/"' vite.config.ts; then
  echo "    vite.config.ts já tem base: /obras/, pulando..."
else
  sed -i 's/export default defineConfig({/export default defineConfig({\n  base: "\/obras\/",/' vite.config.ts
  echo "    ✅ vite.config.ts atualizado com base: /obras/"
fi

# ─────────────────────────────────────────────
# 4. Arquivos do servidor
# ─────────────────────────────────────────────

# server/_core/vite.ts
cat > server/_core/vite.ts << 'ENDOFFILE'
import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  // Redirect root to /obras/ in dev mode
  app.get("/", (_req, res) => {
    res.redirect("/obras/");
  });

  // SPA fallback for all /obras/* routes
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/obras/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // Serve static assets under /obras/ base path
  app.use("/obras", express.static(distPath));

  // SPA fallback: any /obras/* route serves index.html
  app.use("/obras/*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });

  // Redirect root to /obras/
  app.use("/", (_req, res, next) => {
    if (_req.path === "/" || _req.path === "") {
      return res.redirect("/obras/");
    }
    next();
  });
}
ENDOFFILE
echo "    ✅ server/_core/vite.ts atualizado"

# server/_core/index.ts — atualizar tRPC path
if grep -q '"/obras/api/trpc"' server/_core/index.ts; then
  echo "    server/_core/index.ts já tem /obras/api/trpc, pulando..."
else
  sed -i 's|"/api/trpc"|"/obras/api/trpc"|' server/_core/index.ts
  # Adicionar fallback /api/trpc para compatibilidade
  sed -i '/\/obras\/api\/trpc/,/);/{/);/a\
  // Also mount at /api/trpc for backward compat\
  app.use(\
    "/api/trpc",\
    createExpressMiddleware({\
      router: appRouter,\
      createContext,\
    })\
  );
}' server/_core/index.ts
  # Atualizar log message
  sed -i "s|Server running on http://localhost:\${port}/|Server running on http://localhost:\${port}/obras/|" server/_core/index.ts
  echo "    ✅ server/_core/index.ts atualizado"
fi

# ─────────────────────────────────────────────
# 5. Arquivos do cliente
# ─────────────────────────────────────────────

# client/src/main.tsx
cat > client/src/main.tsx << 'ENDOFFILE'
import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG, BASE_PATH } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;
  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;
  if (!isUnauthorized) return;
  // Only redirect if not already on login page
  if (window.location.pathname !== `${BASE_PATH}/login`) {
    window.location.href = `${BASE_PATH}/login`;
  }
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${BASE_PATH}/api/trpc`,
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
ENDOFFILE
echo "    ✅ client/src/main.tsx atualizado"

# client/src/App.tsx
cat > client/src/App.tsx << 'ENDOFFILE'
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Router as WouterRouter } from "wouter";
import { BASE_PATH } from "@shared/const";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardLayout from "./components/DashboardLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Evaluations from "./pages/Evaluations";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import SubObrasDashboard from "./pages/SubObrasDashboard";
import Sub360Dashboard from "./pages/Sub360Dashboard";
import SubNpsDashboard from "./pages/SubNpsDashboard";

function AuthenticatedRoutes() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/dashboard" component={Home} />
        <Route path="/avaliacoes" component={Evaluations} />
        <Route path="/admin" component={Admin} />
        <Route path="/perfil" component={Profile} />
        <Route path="/modulo-obras/dashboard" component={SubObrasDashboard} />
        <Route path="/modulo-360/dashboard" component={Sub360Dashboard} />
        <Route path="/modulo-nps/dashboard" component={SubNpsDashboard} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route component={AuthenticatedRoutes} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <WouterRouter base={BASE_PATH}>
            <AppRouter />
          </WouterRouter>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
ENDOFFILE
echo "    ✅ client/src/App.tsx atualizado"

# client/src/_core/hooks/useAuth.ts
cat > client/src/_core/hooks/useAuth.ts << 'ENDOFFILE'
import { trpc } from "@/lib/trpc";
import { BASE_PATH } from "@shared/const";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = `${BASE_PATH}/login` } =
    options ?? {};
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
      window.location.href = `${BASE_PATH}/login`;
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(meQuery.data)
    );
    return {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
ENDOFFILE
echo "    ✅ client/src/_core/hooks/useAuth.ts atualizado"

# client/src/pages/Login.tsx — substituir redirects hardcoded
sed -i "s|import { trpc } from \"@/lib/trpc\";|import { trpc } from \"@/lib/trpc\";\nimport { BASE_PATH } from \"@shared/const\";|" client/src/pages/Login.tsx 2>/dev/null || true
sed -i 's|window.location.href = "/perfil"|window.location.href = `${BASE_PATH}/perfil`|' client/src/pages/Login.tsx
sed -i 's|window.location.href = "/dashboard"|window.location.href = `${BASE_PATH}/dashboard`|' client/src/pages/Login.tsx
echo "    ✅ client/src/pages/Login.tsx atualizado"

# client/src/pages/Profile.tsx — substituir redirect
sed -i "s|import { trpc } from \"@/lib/trpc\";|import { trpc } from \"@/lib/trpc\";\nimport { BASE_PATH } from \"@shared/const\";|" client/src/pages/Profile.tsx 2>/dev/null || true
sed -i 's|window.location.href = "/";|window.location.href = `${BASE_PATH}/dashboard`;|' client/src/pages/Profile.tsx
echo "    ✅ client/src/pages/Profile.tsx atualizado"

# client/src/pages/Landing.tsx — corrigir paths dos módulos
sed -i 's|path: "/obras/login"|path: "/login"|g' client/src/pages/Landing.tsx
sed -i 's|path: "/360/login"|path: "/login"|g' client/src/pages/Landing.tsx
sed -i 's|path: "/nps/login"|path: "/login"|g' client/src/pages/Landing.tsx
echo "    ✅ client/src/pages/Landing.tsx atualizado"

# client/src/components/DashboardLayout.tsx — corrigir menu + redirects
sed -i '/import {$/,/} from "lucide-react";/{/} from "lucide-react";/a\
import { BASE_PATH } from "@shared/const";
}' client/src/components/DashboardLayout.tsx 2>/dev/null || true

# Corrigir menu path de "/" para "/dashboard"
sed -i 's|label: "Dashboard", path: "/"|label: "Dashboard", path: "/dashboard"|' client/src/components/DashboardLayout.tsx

# Corrigir window.location refs
sed -i 's|window.location.pathname !== "/login"|window.location.pathname !== `${BASE_PATH}/login`|g' client/src/components/DashboardLayout.tsx
sed -i 's|window.location.href = "/login"|window.location.href = `${BASE_PATH}/login`|g' client/src/components/DashboardLayout.tsx
sed -i 's|window.location.pathname !== "/perfil"|window.location.pathname !== `${BASE_PATH}/perfil`|g' client/src/components/DashboardLayout.tsx
sed -i 's|window.location.href = "/perfil"|window.location.href = `${BASE_PATH}/perfil`|g' client/src/components/DashboardLayout.tsx
echo "    ✅ client/src/components/DashboardLayout.tsx atualizado"

# ─────────────────────────────────────────────
# 6. Configurar OAUTH_SERVER_URL se faltando
# ─────────────────────────────────────────────
echo ""
echo ">>> [4/5] Verificando variáveis de ambiente..."

pm2 env 1 2>/dev/null | grep -q "OAUTH_SERVER_URL" || {
  echo "    Adicionando OAUTH_SERVER_URL..."
  # Criar/atualizar .env
  grep -q "OAUTH_SERVER_URL" .env 2>/dev/null || echo "OAUTH_SERVER_URL=http://localhost:3001" >> .env
  echo "    ✅ OAUTH_SERVER_URL adicionado ao .env"
}

# ─────────────────────────────────────────────
# 7. Build e restart
# ─────────────────────────────────────────────
echo ""
echo ">>> [5/5] Fazendo build e restart..."

pnpm build
echo ""

pm2 restart esol-obras --update-env
sleep 2

echo ""
echo "============================================"
echo "  ✅ Deploy concluído!"
echo "============================================"
echo ""
echo "Verificando..."
pm2 status
echo ""
pm2 logs esol-obras --lines 5 --nostream
echo ""
echo "Teste: curl -sI http://localhost:3001/obras/login | head -5"
curl -sI http://localhost:3001/obras/login | head -5
echo ""
echo "Acesse: https://app.grupoesol.com/obras/login"
