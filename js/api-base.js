/* Shared public/admin API host. GitHub Pages is static-only — /api does not exist there. */
(() => {
  const DEFAULT_PAGES_API = "https://nohitatu-website-admin.onrender.com";

  function resolveApiBase() {
    const metaPublic = document.querySelector('meta[name="nh-public-api"]');
    const metaAdmin = document.querySelector('meta[name="nh-admin-api"]');
    const fromMeta = (
      (metaPublic && metaPublic.getAttribute("content")) ||
      (metaAdmin && metaAdmin.getAttribute("content")) ||
      ""
    ).trim();
    const fromWindow =
      (typeof window.NH_PUBLIC_API === "string" && window.NH_PUBLIC_API.trim()) ||
      (typeof window.NH_ADMIN_API === "string" && window.NH_ADMIN_API.trim()) ||
      "";
    let base = (fromWindow || fromMeta || "").replace(/\/$/, "");
    if (base === "." || /^same-?origin$/i.test(base)) base = "";
    const host = window.location.hostname || "";
    const isLocal = /^(localhost|127\.0\.0\.1)$/i.test(host);
    // Static hosts (GitHub Pages, FTP/IIS, custom domain) have no Express /api —
    // send public forms to the Render admin API.
    if (!base && (/\.github\.io$/i.test(host) || (!isLocal && host))) {
      base = DEFAULT_PAGES_API;
    }
    // Local static servers (Live Server, python -m http.server, etc.) have no /api —
    // point public forms at the Express admin host used in this workspace.
    if (!base && isLocal) {
      const port = String(window.location.port || "");
      if (port && port !== "5173" && port !== "5174") {
        base = "http://localhost:5174";
      }
    }
    return base;
  }

  const API_BASE = resolveApiBase();

  function apiUrl(path) {
    const p = String(path || "").startsWith("/") ? path : `/${path}`;
    return API_BASE ? `${API_BASE}${p}` : p;
  }

  window.NH_API_BASE = API_BASE;
  window.NH_apiUrl = apiUrl;
})();
