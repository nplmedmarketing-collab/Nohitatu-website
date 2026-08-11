const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const { VERTICALS, platformMeta, EMPLOYMENT_TYPES, CAREER_STATUSES } = require("../db");

const ALLOWED_IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".bmp"]);
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/pjpeg",
  "image/x-png",
  "application/octet-stream",
]);

function safeBasename(original) {
  const ext = path.extname(original || "").toLowerCase();
  const base = path
    .basename(original || "image", ext)
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "image";
  const stamp = crypto.randomBytes(4).toString("hex");
  const useExt = ALLOWED_IMAGE_EXT.has(ext) ? ext : ".png";
  return `${Date.now()}-${stamp}-${base}${useExt}`;
}

function createUpload(workspaceRoot) {
  const uploadDir = path.join(workspaceRoot, "uploads", "portfolio");
  fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => cb(null, safeBasename(file.originalname)),
  });

  return multer({
    storage,
    limits: { fileSize: 16 * 1024 * 1024, files: 4 },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase();
      const mime = (file.mimetype || "").toLowerCase();
      if (ALLOWED_IMAGE_EXT.has(ext) || ALLOWED_MIME.has(mime) || mime.startsWith("image/")) {
        return cb(null, true);
      }
      return cb(new Error("Only image uploads (.png, .jpg, .webp, .gif, .svg) are allowed"));
    },
  });
}

function publicPathForUpload(filename) {
  return `uploads/portfolio/${filename}`.replace(/\\/g, "/");
}

function bodyToProject(body, files) {
  const meta = platformMeta(body.platform || "web");
  const imageFromFile =
    files &&
    ((files.imageFile && files.imageFile[0]) ||
      (files.image_file && files.image_file[0]) ||
      (files.image && files.image[0]));
  const thumbFromFile =
    files &&
    ((files.thumbFile && files.thumbFile[0]) ||
      (files.thumb_file && files.thumb_file[0]) ||
      (files.thumb && files.thumb[0]));
  const image = imageFromFile
    ? publicPathForUpload(imageFromFile.filename)
    : String(body.image || "").trim();
  const thumb = thumbFromFile
    ? publicPathForUpload(thumbFromFile.filename)
    : String(body.thumb || "").trim() || image;

  return {
    title: String(body.title || "").trim(),
    description: String(body.description || "").trim(),
    client: String(body.client || "").trim(),
    vertical: String(body.vertical || "retail").trim(),
    platform: meta.platform,
    code: body.code ? String(body.code).trim() : meta.code,
    platform_long: body.platform_long ? String(body.platform_long).trim() : meta.platform_long,
    image,
    thumb,
    alt: String(body.alt || body.title || "").trim(),
    cta: String(body.cta || "Contact-us.html").trim() || "Contact-us.html",
    frame_id: body.frame_id ? String(body.frame_id).trim() : undefined,
    order: body.order !== undefined && body.order !== "" ? Number(body.order) : undefined,
  };
}

function validateProject(input, { partial = false } = {}) {
  if (!partial || input.title !== undefined) {
    if (!input.title || input.title.length > 200) return "Title is required (max 200 chars)";
  }
  if (!partial || input.vertical !== undefined) {
    if (!VERTICALS.includes(input.vertical)) {
      return `Vertical must be one of: ${VERTICALS.join(", ")}`;
    }
  }
  if (input.description && input.description.length > 4000) return "Description is too long";
  if (input.client && input.client.length > 200) return "Client is too long";
  if (input.image && input.image.length > 500) return "Image path is too long";
  if (input.order !== undefined && input.order !== null && Number.isNaN(Number(input.order))) {
    return "Order must be a number";
  }
  return null;
}

function bodyToCareer(body) {
  const b = body || {};
  const out = {};
  if (b.job_code !== undefined) out.job_code = String(b.job_code || "").trim();
  if (b.title !== undefined) out.title = String(b.title || "").trim();
  if (b.department !== undefined) out.department = String(b.department || "").trim();
  if (b.location !== undefined) out.location = String(b.location || "").trim();
  if (b.experience !== undefined) out.experience = String(b.experience || "").trim();
  if (b.employment_type !== undefined || b.type !== undefined) {
    out.employment_type = String(b.employment_type || b.type || "full-time").trim();
  }
  if (b.shift_timings !== undefined) out.shift_timings = String(b.shift_timings || "").trim();
  if (b.description !== undefined) out.description = String(b.description || "").trim();
  if (b.responsibilities !== undefined) out.responsibilities = String(b.responsibilities || "").trim();
  if (b.requirements !== undefined) out.requirements = String(b.requirements || "").trim();
  if (b.status !== undefined) out.status = String(b.status || "open").trim();
  if (b.sort_order !== undefined && b.sort_order !== "") {
    out.sort_order = Number(b.sort_order);
  }
  if (b.apply_url !== undefined) out.apply_url = String(b.apply_url || "").trim();
  if (b.validation_type !== undefined) {
    out.validation_type = String(b.validation_type || "J").trim();
  }
  if (b.expire_date !== undefined) out.expire_date = String(b.expire_date || "").trim();
  return out;
}

function validateCareer(input, { partial = false } = {}) {
  if (!partial || input.title !== undefined) {
    if (!input.title || input.title.length > 200) return "Title is required (max 200 chars)";
  }
  if (!partial || input.job_code !== undefined) {
    if (!input.job_code || input.job_code.length > 32) {
      return "Job code is required (max 32 chars)";
    }
  }
  if (input.employment_type !== undefined) {
    const t = String(input.employment_type).toLowerCase().replace(/[_\s]+/g, "-");
    if (!EMPLOYMENT_TYPES.includes(t)) {
      return `Employment type must be one of: ${EMPLOYMENT_TYPES.join(", ")}`;
    }
  }
  if (input.status !== undefined && !CAREER_STATUSES.includes(String(input.status).toLowerCase())) {
    return `Status must be one of: ${CAREER_STATUSES.join(", ")}`;
  }
  if (input.sort_order !== undefined && input.sort_order !== null && Number.isNaN(Number(input.sort_order))) {
    return "Sort order must be a number";
  }
  if (input.responsibilities && input.responsibilities.length > 50000) {
    return "Responsibilities is too long";
  }
  if (input.requirements && input.requirements.length > 50000) {
    return "Requirements is too long";
  }
  if (input.description && input.description.length > 8000) {
    return "Description is too long";
  }
  return null;
}

function createAdminRouter({ store, auth, workspaceRoot }) {
  const router = express.Router();
  const upload = createUpload(workspaceRoot);

  router.use(auth.requireSameOrigin);

  router.get("/me", (req, res) => {
    if (!auth.isAuthed(req)) {
      return res.status(401).json({ authenticated: false });
    }
    return res.json({ authenticated: true, username: req.session.username });
  });

  router.get("/csrf", (req, res) => {
    // allow unauthenticated login page to obtain a token after session exists
    const token = auth.issueCsrf(req);
    res.json({ csrfToken: token });
  });

  router.post("/login", auth.requireCsrf, async (req, res) => {
    const username = String((req.body && req.body.username) || "").trim();
    const password = String((req.body && req.body.password) || "");
    const result = await auth.login(username, password);
    if (!result.ok) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ error: "Session error" });
      req.session.admin = true;
      req.session.username = username;
      auth.issueCsrf(req);
      return res.json({ ok: true, username });
    });
  });

  router.post("/logout", auth.requireAuth, auth.requireCsrf, (req, res) => {
    req.session.destroy(() => {
      res.clearCookie("nh_admin_sid");
      res.json({ ok: true });
    });
  });

  router.get("/projects", auth.requireAuth, (req, res) => {
    res.json({ projects: store.list(), verticals: VERTICALS, store: store.mode });
  });

  const dualFields = upload.fields([
    { name: "imageFile", maxCount: 1 },
    { name: "thumbFile", maxCount: 1 },
    { name: "image_file", maxCount: 1 },
    { name: "thumb_file", maxCount: 1 },
    { name: "image", maxCount: 1 },
    { name: "thumb", maxCount: 1 },
  ]);

  router.post(
    "/projects",
    auth.requireAuth,
    auth.requireCsrf,
    (req, res, next) => {
      dualFields(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message || "Upload failed" });
        return next();
      });
    },
    (req, res) => {
      const input = bodyToProject(req.body || {}, req.files || {});
      const errMsg = validateProject(input);
      if (errMsg) return res.status(400).json({ error: errMsg });
      if (!input.image) return res.status(400).json({ error: "Image path or upload is required" });
      const project = store.create(input);
      return res.status(201).json({ project });
    }
  );

  router.put(
    "/projects/:id",
    auth.requireAuth,
    auth.requireCsrf,
    (req, res, next) => {
      dualFields(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message || "Upload failed" });
        return next();
      });
    },
    (req, res) => {
      const current = store.get(req.params.id);
      if (!current) return res.status(404).json({ error: "Not found" });
      const input = bodyToProject(req.body || {}, req.files || {});
      // preserve existing images if not replaced/overridden
      if (!input.image) input.image = current.image;
      if (!input.thumb) input.thumb = current.thumb;
      if (!input.frame_id) input.frame_id = current.frame_id;
      if (input.order === undefined || Number.isNaN(input.order)) input.order = current.order;
      const errMsg = validateProject(input);
      if (errMsg) return res.status(400).json({ error: errMsg });
      const project = store.update(req.params.id, input);
      return res.json({ project });
    }
  );

  router.delete("/projects/:id", auth.requireAuth, auth.requireCsrf, (req, res) => {
    const ok = store.remove(req.params.id);
    if (!ok) return res.status(404).json({ error: "Not found" });
    return res.json({ ok: true });
  });

  router.get("/meta", auth.requireAuth, (_req, res) => {
    res.json({
      verticals: VERTICALS,
      employment_types: EMPLOYMENT_TYPES,
      career_statuses: CAREER_STATUSES,
      store: store.mode,
    });
  });

  /* ---------- Careers CRUD ---------- */
  router.get("/careers", auth.requireAuth, (req, res) => {
    const status = String(req.query.status || "all").toLowerCase();
    const careers = store.listCareers({ status: status === "open" || status === "closed" ? status : "all" });
    res.json({
      careers,
      employment_types: EMPLOYMENT_TYPES,
      career_statuses: CAREER_STATUSES,
      store: store.mode,
    });
  });

  router.get("/careers/:id", auth.requireAuth, (req, res) => {
    const career = store.getCareer(req.params.id);
    if (!career) return res.status(404).json({ error: "Not found" });
    return res.json({ career });
  });

  router.post("/careers", auth.requireAuth, auth.requireCsrf, (req, res) => {
    const input = bodyToCareer(req.body || {});
    const errMsg = validateCareer(input, { partial: false });
    if (errMsg) return res.status(400).json({ error: errMsg });
    try {
      const career = store.createCareer(input);
      return res.status(201).json({ career });
    } catch (err) {
      if (err && err.code === "DUPLICATE_JOB_CODE") {
        return res.status(409).json({ error: err.message });
      }
      throw err;
    }
  });

  function patchCareer(req, res) {
    const current = store.getCareer(req.params.id);
    if (!current) return res.status(404).json({ error: "Not found" });
    const input = bodyToCareer(req.body || {});
    const errMsg = validateCareer(input, { partial: true });
    if (errMsg) return res.status(400).json({ error: errMsg });
    try {
      const career = store.updateCareer(req.params.id, input);
      return res.json({ career });
    } catch (err) {
      if (err && err.code === "DUPLICATE_JOB_CODE") {
        return res.status(409).json({ error: err.message });
      }
      throw err;
    }
  }

  router.patch("/careers/:id", auth.requireAuth, auth.requireCsrf, patchCareer);
  router.put("/careers/:id", auth.requireAuth, auth.requireCsrf, patchCareer);

  router.delete("/careers/:id", auth.requireAuth, auth.requireCsrf, (req, res) => {
    const ok = store.removeCareer(req.params.id);
    if (!ok) return res.status(404).json({ error: "Not found" });
    return res.json({ ok: true });
  });

  router.get("/demo-requests", auth.requireAuth, (_req, res) => {
    const requests = typeof store.listDemoRequests === "function" ? store.listDemoRequests() : [];
    return res.json({ requests, count: requests.length });
  });

  return router;
}

module.exports = { createAdminRouter };
