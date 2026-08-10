/**
 * Session auth helpers for single super-admin.
 */
const crypto = require("crypto");

function createAuth({ bcrypt, admin }) {
  function isAuthed(req) {
    return Boolean(req.session && req.session.admin === true);
  }

  function requireAuth(req, res, next) {
    if (!isAuthed(req)) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    return next();
  }

  async function login(username, password) {
    if (!username || !password) return { ok: false, reason: "missing" };
    if (username !== admin.username) return { ok: false, reason: "invalid" };
    const match = await bcrypt.compare(String(password), admin.passwordHash);
    if (!match) return { ok: false, reason: "invalid" };
    return { ok: true };
  }

  function issueCsrf(req) {
    if (!req.session.csrfToken) {
      req.session.csrfToken = crypto.randomBytes(24).toString("hex");
    }
    return req.session.csrfToken;
  }

  function requireCsrf(req, res, next) {
    const token = req.get("x-csrf-token") || (req.body && req.body._csrf);
    if (!req.session || !req.session.csrfToken || !token || token !== req.session.csrfToken) {
      return res.status(403).json({ error: "Invalid CSRF token" });
    }
    return next();
  }

  /** Block cross-site state-changing requests (browser form posts from other origins). */
  function requireSameOrigin(req, res, next) {
    const method = req.method.toUpperCase();
    if (method === "GET" || method === "HEAD" || method === "OPTIONS") return next();

    const host = req.get("host");
    if (!host) return res.status(403).json({ error: "Missing host" });

    const origin = req.get("origin");
    const referer = req.get("referer");

    const okOrigin = (value) => {
      if (!value) return false;
      try {
        const u = new URL(value);
        return u.host === host;
      } catch {
        return false;
      }
    };

    // Prefer Origin; fall back to Referer. Non-browser clients with neither must send CSRF.
    if (origin) {
      if (!okOrigin(origin)) return res.status(403).json({ error: "Cross-origin request blocked" });
      return next();
    }
    if (referer) {
      if (!okOrigin(referer)) return res.status(403).json({ error: "Cross-origin request blocked" });
      return next();
    }
    // same-origin fetch sometimes omits Origin on same host in older browsers — CSRF still required for mutates
    return next();
  }

  return {
    isAuthed,
    requireAuth,
    login,
    issueCsrf,
    requireCsrf,
    requireSameOrigin,
  };
}

module.exports = { createAuth };
