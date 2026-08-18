const path = require("path");
const fs = require("fs");
const http = require("http");
const { execSync } = require("child_process");
const express = require("express");
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");

const { createStore, ensureAdminCredentials } = require("./db");
const { createAuth } = require("./auth");
const { createAdminRouter } = require("./routes/admin");
const { createPublicRouter } = require("./routes/public");

const WORKSPACE = path.resolve(__dirname, "..");
const ENV_PATHS = [path.join(__dirname, ".env"), path.join(WORKSPACE, ".env")];

for (const envPath of ENV_PATHS) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const PORT = Number(process.env.PORT || 5173);
const HOST = process.env.HOST || "0.0.0.0";
const SESSION_SECRET = process.env.SESSION_SECRET || "";
const NODE_ENV = process.env.NODE_ENV || "development";
const isProd = NODE_ENV === "production";

function parseCorsOrigins() {
  const fromEnv = String(process.env.ADMIN_CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (fromEnv.length) return fromEnv;
  // Allow GitHub Pages project site to call this API when NODE_ENV=production
  if (isProd) {
    return ["https://nplmedmarketing-collab.github.io"];
  }
  return [];
}

const CORS_ORIGINS = parseCorsOrigins();
const useCrossSiteCookies = CORS_ORIGINS.length > 0;

function blockSensitive(req, res, next) {
  const p = req.path.toLowerCase();
  if (
    p.startsWith("/data/") ||
    p === "/data" ||
    p.startsWith("/server/") ||
    p === "/server" ||
    p.includes("/.env") ||
    p.endsWith(".env") ||
    p.endsWith("admin-auth.json") ||
    p.endsWith("projects.db") ||
    p.endsWith("projects.db-wal") ||
    p.endsWith("projects.db-shm")
  ) {
    return res.status(404).end();
  }
  return next();
}

/** Best-effort: who already holds PORT (Windows + Unix). */
function describePortListener(port) {
  try {
    if (process.platform === "win32") {
      const out = execSync(`netstat -ano | findstr :${port}`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        windowsHide: true,
      });
      const line = out
        .split(/\r?\n/)
        .map((l) => l.trim())
        .find((l) => /LISTENING/i.test(l));
      if (!line) return null;
      const pid = line.split(/\s+/).pop();
      let cmd = "";
      try {
        cmd = execSync(
          `powershell -NoProfile -Command "(Get-CimInstance Win32_Process -Filter \\"ProcessId=${pid}\\").CommandLine"`,
          { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], windowsHide: true }
        ).trim();
      } catch {
        /* ignore */
      }
      return { pid, command: cmd || "(unknown)" };
    }
    const out = execSync(`lsof -iTCP:${port} -sTCP:LISTEN -n -P 2>/dev/null || true`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const line = out.split(/\r?\n/).find((l) => /\d/.test(l) && !/^COMMAND/i.test(l));
    if (!line) return null;
    const parts = line.trim().split(/\s+/);
    return { pid: parts[1] || "?", command: line.trim() };
  } catch {
    return null;
  }
}

function printPortConflictHelp(port, err) {
  console.error("");
  console.error(`[error] Port ${port} is already in use (${err.code || "EADDRINUSE"}).`);
  const owner = describePortListener(port);
  if (owner) {
    console.error(`  Listening PID: ${owner.pid}`);
    console.error(`  Command: ${owner.command}`);
  }
  console.error("");
  console.error("  If the browser shows the public HOMEPAGE at /adminlogin,");
  console.error("  another process owns this port (often Vite: npm run dev, default 5173).");
  console.error("  That process is NOT this Express admin server.");
  console.error("");
  console.error("  Fix:");
  console.error(`    1) Stop the other process (Task Manager, or: taskkill /PID <pid> /F)`);
  console.error("    2) From this folder:  cd server && npm start");
  console.error(`    3) Open ONLY:  http://localhost:${port}/adminlogin`);
  console.error("");
  console.error("  Or set PORT=5174 (or any free port) in server/.env and use that URL.");
  console.error("");
}

/**
 * Admin SPA shell — must run BEFORE site-root static and any SPA homepage fallback.
 * Paths: /adminlogin (login bookmark) and /admin (dashboard shell).
 */
function sendAdminShell(req, res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("X-Nohitatu-Admin", "1");
  res.setHeader("X-Nohitatu-Admin-Path", req.path);
  res.sendFile(path.join(WORKSPACE, "admin", "index.html"));
}

function isAdminShellPath(urlPath) {
  const p = String(urlPath || "").split("?")[0].replace(/\/+$/, "") || "/";
  return p === "/adminlogin" || p === "/admin";
}

async function main() {
  if (!SESSION_SECRET || SESSION_SECRET.length < 16) {
    console.warn(
      "[warn] SESSION_SECRET missing or short — set a long random value in .env for production"
    );
  }

  const adminCreds = await ensureAdminCredentials(bcrypt, process.env);
  const store = createStore();
  const auth = createAuth({ bcrypt, admin: adminCreds, allowedOrigins: CORS_ORIGINS });

  const app = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // Liveness for Render / load balancers (no auth).
  app.get(["/health", "/api/health"], (_req, res) => {
    res.status(200).json({ ok: true, service: "nohitatu-website-admin" });
  });

  // Credentialed CORS for static admin hosts (e.g. GitHub Pages → Render API).
  app.use((req, res, next) => {
    const origin = req.get("origin");
    if (origin && CORS_ORIGINS.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-CSRF-Token, Accept");
      res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    return next();
  });

  app.use(
    session({
      name: "nh_admin_sid",
      secret: SESSION_SECRET || "dev-only-change-me-please-32chars",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        // Cross-site Pages→API needs SameSite=None; Secure is required with None.
        sameSite: useCrossSiteCookies ? "none" : "lax",
        secure: isProd || useCrossSiteCookies,
        // CHIPS: browsers that block unpartitioned third-party cookies still
        // send this session when the admin UI is on GitHub Pages.
        partitioned: useCrossSiteCookies,
        maxAge: 1000 * 60 * 60 * 12,
      },
    })
  );

  app.use((req, _res, next) => {
    if (req.session) auth.issueCsrf(req);
    next();
  });

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many login attempts. Try again later." },
  });

  app.use("/api", createPublicRouter({ store }));
  app.use("/api/admin/login", loginLimiter);
  app.use("/api/admin", createAdminRouter({ store, auth, workspaceRoot: WORKSPACE }));

  app.use(
    "/uploads",
    express.static(path.join(WORKSPACE, "uploads"), {
      maxAge: isProd ? "7d" : 0,
    })
  );

  const adminDir = path.join(WORKSPACE, "admin");

  // Relative asset URLs (admin.css) resolve to /admin.css without a trailing slash on /admin or /adminlogin.
  app.get(["/admin.css", "/admin.js"], (req, res) => {
    const name = req.path.slice(1);
    res.sendFile(path.join(adminDir, name));
  });

  // 1) Exact SPA shells FIRST (never let site-root static or index.html win).
  app.get(["/adminlogin", "/adminlogin/", "/admin", "/admin/"], sendAdminShell);

  // 2) Admin static assets only under /admin/* (css/js) — no index auto-serve.
  app.use(
    "/admin",
    express.static(adminDir, {
      index: false,
      maxAge: 0,
      fallthrough: true,
      redirect: false,
    })
  );

  // 3) Re-assert shells so /admin never falls through to public index.html.
  app.get(["/adminlogin", "/adminlogin/", "/admin", "/admin/"], sendAdminShell);

  app.use(blockSensitive);

  // Guard: never map unknown /admin* paths to public homepage.
  app.use((req, res, next) => {
    if (isAdminShellPath(req.path)) {
      return sendAdminShell(req, res);
    }
    return next();
  });

  // Public marketing site (index.html for / only via static index option).
  app.use(
    express.static(WORKSPACE, {
      index: ["index.html", "Index.html"],
      extensions: ["html"],
      maxAge: 0,
      dotfiles: "deny",
      // Do not invent SPA fallback to index.html for unknown paths like /adminlogin
      // (Express static already only serves real files; no /* → index.html here).
    })
  );

  // Final 404 — never fallback to homepage for missing routes.
  app.use((req, res) => {
    if (isAdminShellPath(req.path)) {
      return sendAdminShell(req, res);
    }
    res.status(404).type("text").send("Not found");
  });

  app.use((err, _req, res, _next) => {
    console.error(err);
    if (res.headersSent) return;
    res.status(500).json({ error: err.message || "Server error" });
  });

  const server = http.createServer(app);

  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE") {
      printPortConflictHelp(PORT, err);
      process.exit(1);
    }
    console.error(err);
    process.exit(1);
  });

  server.listen(PORT, HOST, () => {
    const addr = server.address();
    const bound =
      typeof addr === "object" && addr
        ? `${addr.address === "::" ? "localhost" : addr.address}:${addr.port}`
        : `localhost:${PORT}`;

    console.log("");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("  Nohitatu Express admin + static site");
    console.log(`  Listening:  http://${bound}`);
    console.log(`  PID:        ${process.pid}`);
    console.log(`  Command:    node ${path.relative(WORKSPACE, __filename) || "server/index.js"}`);
    console.log("───────────────────────────────────────────────────────────");
    console.log(`  Admin login:  http://localhost:${PORT}/adminlogin`);
    console.log(`  Admin UI:     http://localhost:${PORT}/admin`);
    console.log(`  Home:         http://localhost:${PORT}/`);
    console.log(`  Portfolio:    http://localhost:${PORT}/Portfolio.html`);
    console.log(`  Careers:      http://localhost:${PORT}/Careers.html`);
    console.log("───────────────────────────────────────────────────────────");
    console.log("  If /adminlogin shows the public homepage instead of the");
    console.log("  login form, another process (often Vite on 5173) owns the");
    console.log("  port — stop it and restart:  cd server && npm start");
    console.log("───────────────────────────────────────────────────────────");
    console.log(`  APIs:       /api/projects  /api/careers`);
    console.log(`  Store:      ${store.mode}`);
    console.log(`  Admin user: ${adminCreds.username} (${adminCreds.source})`);
    if (CORS_ORIGINS.length) {
      console.log(`  CORS:       ${CORS_ORIGINS.join(", ")}`);
    }
    console.log("═══════════════════════════════════════════════════════════");
    console.log("");
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
