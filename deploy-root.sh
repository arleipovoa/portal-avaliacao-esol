#!/bin/bash
set -e

echo "============================================"
echo "  Deploy - Mover app para raiz do dominio"
echo "  De /obras/ para /"
echo "============================================"

cd /var/www/obras

# -----------------------------------------------
# 1. PULL do GitHub (branch refactor/full-refactoring)
# -----------------------------------------------
echo ""
echo ">>> [1/5] Atualizando codigo do GitHub..."
git fetch origin
git checkout refactor/full-refactoring
git pull origin refactor/full-refactoring
echo "    Codigo atualizado"

# -----------------------------------------------
# 2. NGINX - Alterar de /obras/ para /
# -----------------------------------------------
echo ""
echo ">>> [2/5] Configurando Nginx para raiz..."

# Backup
cp /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.bak.$(date +%s) 2>/dev/null || true

# Remover location /obras/ e atualizar proxy para raiz
# Substituir location /obras/ por location /
NGINX_CONF="/etc/nginx/sites-enabled/default"

# Verificar se tem location /obras/
if grep -q "location /obras/" "$NGINX_CONF" 2>/dev/null; then
  echo "    Removendo location /obras/ e configurando raiz..."
  sed -i 's|location /obras/|location /|g' "$NGINX_CONF"
  echo "    location / configurado para proxy_pass porta 3001"
fi

# Testar e recarregar Nginx
nginx -t && systemctl reload nginx
echo "    Nginx recarregado"

# -----------------------------------------------
# 3. Atualizar server/_core/vite.ts para raiz
# -----------------------------------------------
echo ""
echo ">>> [3/5] Atualizando server/_core/vite.ts..."

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

  // SPA fallback for all routes
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
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

  // Serve static assets at root
  app.use(express.static(distPath));

  // SPA fallback: any route serves index.html
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
ENDOFFILE
echo "    server/_core/vite.ts atualizado"

# -----------------------------------------------
# 4. Atualizar server/_core/index.ts - tRPC path
# -----------------------------------------------
echo ""
echo ">>> [4/5] Atualizando server/_core/index.ts..."

# Mudar /obras/api/trpc para /api/trpc
sed -i 's|"/obras/api/trpc"|"/api/trpc"|g' server/_core/index.ts
# Remover redirect de / para /obras/
sed -i '/res.redirect.*obras/d' server/_core/index.ts
# Atualizar log message
sed -i 's|Server running on http://localhost:${port}/obras/|Server running on http://localhost:${port}/|' server/_core/index.ts
echo "    server/_core/index.ts atualizado"

# -----------------------------------------------
# 5. Build e restart
# -----------------------------------------------
echo ""
echo ">>> [5/5] Build e restart..."

pnpm install
pnpm build

pm2 restart esol-obras --update-env
sleep 3

echo ""
echo "============================================"
echo "  Deploy concluido!"
echo "============================================"
echo ""
echo "Verificando..."
pm2 status
echo ""
pm2 logs esol-obras --lines 5 --nostream
echo ""
echo "Teste: curl -sI http://localhost:3001/login/obras | head -5"
curl -sI http://localhost:3001/login/obras | head -5
echo ""
echo "URLs novas:"
echo "  https://app.grupoesol.com/"
echo "  https://app.grupoesol.com/login/obras"
echo "  https://app.grupoesol.com/login/360"
echo "  https://app.grupoesol.com/login/nps"
