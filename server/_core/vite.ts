import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
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
    // In middleware dev mode we serve the SPA under /obras/, but Vite source modules
    // must stay at /src/* to resolve correctly.
    base: "/",
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  // Redirect root to /obras/ in dev mode
  app.get("/", (_req, res) => {
    res.redirect("/obras/");
  });

  // Redirect only the exact "/obras" path to "/obras/".
  // Using a regex avoids matching "/obras/" itself and causing redirect loops.
  app.get(/^\/obras$/, (_req, res) => {
    res.redirect("/obras/");
  });

  // SPA fallback only for /obras routes in dev mode
  app.use("/obras/*", async (req, res, next) => {
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
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "../..", "dist", "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // Serve static assets under /obras/ base path
  app.use("/obras", express.static(distPath));

  // SPA fallback: /obras/* routes serve index.html — exceto chamadas de API
  // Nota: req.path NÃO descarta o prefixo /obras/ neste contexto, usar originalUrl
  app.use("/obras/*", (req, res, next) => {
    if (req.originalUrl.includes("/api/")) {
      return next();
    }
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
