/**
 * Portfolio + careers store: prefers better-sqlite3, falls back to JSON file lock.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const SEED_PATH = path.join(DATA_DIR, "seed", "projects.json");
const CAREERS_SEED_PATH = path.join(DATA_DIR, "seed", "careers.json");
const JSON_PATH = path.join(DATA_DIR, "projects.json");
const CAREERS_JSON_PATH = path.join(DATA_DIR, "careers.json");
const SQLITE_PATH = path.join(DATA_DIR, "projects.db");
const AUTH_PATH = path.join(DATA_DIR, "admin-auth.json");

const VERTICALS = [
  "retail",
  "supply-chain",
  "sports-management",
  "health-care",
  "facility-management",
  "human-resource-management",
  "project-management",
];

const EMPLOYMENT_TYPES = ["full-time", "part-time", "contract", "remote", "internship"];
const CAREER_STATUSES = ["open", "closed"];

function decodeHtml(s) {
  return String(s || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function platformMeta(platform) {
  const parts = String(platform || "web")
    .toLowerCase()
    .split(/[\s,+/|]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const map = { web: "WEB", mobile: "MOB", desktop: "DSK" };
  const longMap = { web: "Web", mobile: "Mobile", desktop: "Desktop" };
  const codes = [];
  const longs = [];
  for (const p of parts) {
    if (map[p] && !codes.includes(map[p])) {
      codes.push(map[p]);
      longs.push(longMap[p]);
    }
  }
  if (!codes.length) {
    return { code: "WEB", platform_long: "Web", platform: "web" };
  }
  return {
    code: codes.join("·"),
    platform_long: longs.join(" · "),
    platform: parts.filter((p) => map[p]).join(" ") || "web",
  };
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function loadSeed() {
  if (!fs.existsSync(SEED_PATH)) return [];
  const raw = JSON.parse(fs.readFileSync(SEED_PATH, "utf8"));
  return (Array.isArray(raw) ? raw : []).map((p, i) => normalizeProject(p, i + 1));
}

function loadCareersSeed() {
  if (!fs.existsSync(CAREERS_SEED_PATH)) return [];
  const raw = JSON.parse(fs.readFileSync(CAREERS_SEED_PATH, "utf8"));
  return (Array.isArray(raw) ? raw : []).map((c, i) => normalizeCareer(c, i + 1));
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeEmploymentType(value, title) {
  const v = String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, "-");
  if (EMPLOYMENT_TYPES.includes(v)) return v;
  if (v === "fulltime" || v === "full") return "full-time";
  if (v === "parttime" || v === "part") return "part-time";
  if (v === "intern") return "internship";
  if (/intern/i.test(title || "")) return "internship";
  return "full-time";
}

function normalizeCareerStatus(value) {
  const v = String(value || "open")
    .toLowerCase()
    .trim();
  return CAREER_STATUSES.includes(v) ? v : "open";
}

function normalizeCareer(c, fallbackOrder) {
  const title = String(c.title || c.post || c.role || "").trim();
  const jobCode = String(c.job_code != null ? c.job_code : c.jobid != null ? c.jobid : c.jobId || "")
    .trim();
  const sortOrder = Number.isFinite(Number(c.sort_order != null ? c.sort_order : c.order))
    ? Number(c.sort_order != null ? c.sort_order : c.order)
    : fallbackOrder || 0;
  const ts = nowIso();
  const employment = normalizeEmploymentType(c.employment_type || c.type, title);
  const validation =
    String(c.validation_type || c.validationType || (employment === "internship" ? "I" : "J"))
      .toUpperCase()
      .slice(0, 1) || "J";

  return {
    id: c.id != null ? Number(c.id) : undefined,
    job_code: jobCode,
    title,
    department: String(c.department || "").trim(),
    location: String(c.location || "").trim(),
    experience: String(c.experience || "").trim(),
    employment_type: employment,
    shift_timings: String(c.shift_timings || c.shiftTimings || "").trim(),
    description: String(c.description || "").trim(),
    responsibilities: String(c.responsibilities || "").trim(),
    requirements: String(c.requirements || c.musthave || c.mustHave || "").trim(),
    status: normalizeCareerStatus(c.status),
    sort_order: sortOrder,
    apply_url:
      String(c.apply_url || c.applyUrl || (jobCode ? `PostResume.html?id=${jobCode}` : "")).trim() ||
      (jobCode ? `PostResume.html?id=${jobCode}` : ""),
    validation_type: validation === "I" ? "I" : "J",
    expire_date: String(c.expire_date || c.expireDate || "").trim(),
    created_at: String(c.created_at || c.createdAt || ts),
    updated_at: String(c.updated_at || c.updatedAt || ts),
  };
}

function toPublicCareerDetail(job) {
  if (!job) return null;
  return {
    jobid: Number(job.job_code) || job.job_code,
    post: job.title,
    experience: job.experience,
    location: job.location,
    responsibilities: job.responsibilities,
    musthave: job.requirements,
    applyUrl: job.apply_url || `PostResume.html?id=${job.job_code}`,
    expireDate: job.expire_date || null,
    validationType: job.validation_type || "J",
    employment_type: job.employment_type,
    department: job.department,
    shift_timings: job.shift_timings,
    description: job.description,
    status: job.status,
    sort_order: job.sort_order,
    id: job.id,
    job_code: job.job_code,
  };
}

function normalizeProject(p, fallbackOrder) {
  const meta = platformMeta(p.platform || p.platform_long || "web");
  const order = Number.isFinite(Number(p.order)) ? Number(p.order) : fallbackOrder || 0;
  return {
    id: p.id != null ? Number(p.id) : undefined,
    order,
    frame_id: String(p.frame_id || p.frameId || "").trim(),
    title: decodeHtml(p.title || "").trim(),
    description: decodeHtml(p.description || p.desc || "").trim(),
    client: decodeHtml(p.client || "").trim(),
    vertical: String(p.vertical || "retail").trim(),
    platform: meta.platform,
    code: String(p.code || meta.code).trim() || meta.code,
    platform_long: String(p.platform_long || p.long || meta.platform_long).trim() || meta.platform_long,
    image: String(p.image || p.src || "").trim(),
    thumb: String(p.thumb || p.thumbnail || p.image || p.src || "").trim(),
    alt: decodeHtml(p.alt || p.title || "").trim(),
    cta: String(p.cta || "Contact-us.html").trim() || "Contact-us.html",
  };
}

function nextFrameId(existing) {
  let max = 0;
  for (const p of existing) {
    const m = String(p.frame_id || "").match(/^F(\d+)$/i);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `F${String(max + 1).padStart(2, "0")}`;
}

/* ---------- JSON store (fallback) ---------- */
class JsonStore {
  constructor() {
    this.mode = "json";
    ensureDir(DATA_DIR);
    if (!fs.existsSync(JSON_PATH)) {
      const seed = loadSeed();
      this._write(seed.map((p, i) => ({ ...p, id: i + 1 })));
    }
    if (!fs.existsSync(CAREERS_JSON_PATH)) {
      const seed = loadCareersSeed();
      this._writeCareers(seed.map((c, i) => ({ ...c, id: i + 1 })));
    }
  }

  _read() {
    const raw = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
    return Array.isArray(raw) ? raw.map((p) => normalizeProject(p)) : [];
  }

  _write(rows) {
    const tmp = `${JSON_PATH}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(rows, null, 2), "utf8");
    fs.renameSync(tmp, JSON_PATH);
  }

  _readCareers() {
    if (!fs.existsSync(CAREERS_JSON_PATH)) return [];
    const raw = JSON.parse(fs.readFileSync(CAREERS_JSON_PATH, "utf8"));
    return Array.isArray(raw) ? raw.map((c) => normalizeCareer(c)) : [];
  }

  _writeCareers(rows) {
    const tmp = `${CAREERS_JSON_PATH}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(rows, null, 2), "utf8");
    fs.renameSync(tmp, CAREERS_JSON_PATH);
  }

  list() {
    return this._read().sort((a, b) => a.order - b.order || a.id - b.id);
  }

  get(id) {
    const n = Number(id);
    return this.list().find((p) => p.id === n) || null;
  }

  create(input) {
    const rows = this._read();
    const nextId = rows.reduce((m, p) => Math.max(m, p.id || 0), 0) + 1;
    const maxOrder = rows.reduce((m, p) => Math.max(m, p.order || 0), 0);
    const project = normalizeProject(
      {
        ...input,
        id: nextId,
        order: input.order != null ? input.order : maxOrder + 1,
        frame_id: input.frame_id || nextFrameId(rows),
      },
      maxOrder + 1
    );
    rows.push(project);
    this._write(rows);
    return project;
  }

  update(id, input) {
    const rows = this._read();
    const idx = rows.findIndex((p) => p.id === Number(id));
    if (idx < 0) return null;
    const merged = normalizeProject({ ...rows[idx], ...input, id: rows[idx].id }, rows[idx].order);
    rows[idx] = merged;
    this._write(rows);
    return merged;
  }

  remove(id) {
    const rows = this._read();
    const next = rows.filter((p) => p.id !== Number(id));
    if (next.length === rows.length) return false;
    this._write(next);
    return true;
  }

  listCareers({ status } = {}) {
    let rows = this._readCareers().sort(
      (a, b) => a.sort_order - b.sort_order || String(a.job_code).localeCompare(String(b.job_code))
    );
    if (status && status !== "all") {
      rows = rows.filter((c) => c.status === status);
    }
    return rows;
  }

  getCareer(id) {
    const n = Number(id);
    return this.listCareers({ status: "all" }).find((c) => c.id === n) || null;
  }

  getCareerByCode(code) {
    const key = String(code || "").trim();
    if (!key) return null;
    return this.listCareers({ status: "all" }).find((c) => String(c.job_code) === key) || null;
  }

  createCareer(input) {
    const rows = this._readCareers();
    const nextId = rows.reduce((m, c) => Math.max(m, c.id || 0), 0) + 1;
    const maxOrder = rows.reduce((m, c) => Math.max(m, c.sort_order || 0), 0);
    const code = String(input.job_code || "").trim();
    if (code && rows.some((c) => String(c.job_code) === code)) {
      const err = new Error("Job code already exists");
      err.code = "DUPLICATE_JOB_CODE";
      throw err;
    }
    const ts = nowIso();
    const career = normalizeCareer(
      {
        ...input,
        id: nextId,
        sort_order: input.sort_order != null ? input.sort_order : maxOrder + 1,
        created_at: ts,
        updated_at: ts,
      },
      maxOrder + 1
    );
    rows.push(career);
    this._writeCareers(rows);
    return career;
  }

  updateCareer(id, input) {
    const rows = this._readCareers();
    const idx = rows.findIndex((c) => c.id === Number(id));
    if (idx < 0) return null;
    const code = input.job_code != null ? String(input.job_code).trim() : rows[idx].job_code;
    if (code && rows.some((c, i) => i !== idx && String(c.job_code) === code)) {
      const err = new Error("Job code already exists");
      err.code = "DUPLICATE_JOB_CODE";
      throw err;
    }
    const merged = normalizeCareer(
      {
        ...rows[idx],
        ...input,
        id: rows[idx].id,
        created_at: rows[idx].created_at,
        updated_at: nowIso(),
      },
      rows[idx].sort_order
    );
    rows[idx] = merged;
    this._writeCareers(rows);
    return merged;
  }

  removeCareer(id) {
    const rows = this._readCareers();
    const next = rows.filter((c) => c.id !== Number(id));
    if (next.length === rows.length) return false;
    this._writeCareers(next);
    return true;
  }
}

/* ---------- SQLite store ---------- */
class SqliteStore {
  constructor(Database) {
    this.mode = "sqlite";
    ensureDir(DATA_DIR);
    this.db = new Database(SQLITE_PATH);
    this.db.pragma("journal_mode = WAL");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        frame_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        client TEXT NOT NULL DEFAULT '',
        vertical TEXT NOT NULL DEFAULT 'retail',
        platform TEXT NOT NULL DEFAULT 'web',
        code TEXT NOT NULL DEFAULT 'WEB',
        platform_long TEXT NOT NULL DEFAULT 'Web',
        image TEXT NOT NULL DEFAULT '',
        thumb TEXT NOT NULL DEFAULT '',
        alt TEXT NOT NULL DEFAULT '',
        cta TEXT NOT NULL DEFAULT 'Contact-us.html'
      );
      CREATE INDEX IF NOT EXISTS idx_projects_order ON projects(sort_order);
      CREATE INDEX IF NOT EXISTS idx_projects_vertical ON projects(vertical);

      CREATE TABLE IF NOT EXISTS careers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_code TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        department TEXT NOT NULL DEFAULT '',
        location TEXT NOT NULL DEFAULT '',
        experience TEXT NOT NULL DEFAULT '',
        employment_type TEXT NOT NULL DEFAULT 'full-time',
        shift_timings TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        responsibilities TEXT NOT NULL DEFAULT '',
        requirements TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'open',
        sort_order INTEGER NOT NULL DEFAULT 0,
        apply_url TEXT NOT NULL DEFAULT '',
        validation_type TEXT NOT NULL DEFAULT 'J',
        expire_date TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_careers_order ON careers(sort_order);
      CREATE INDEX IF NOT EXISTS idx_careers_status ON careers(status);
    `);
    const count = this.db.prepare("SELECT COUNT(*) AS c FROM projects").get().c;
    if (count === 0) {
      const seed = loadSeed();
      const insert = this.db.prepare(`
        INSERT INTO projects (
          sort_order, frame_id, title, description, client, vertical,
          platform, code, platform_long, image, thumb, alt, cta
        ) VALUES (
          @order, @frame_id, @title, @description, @client, @vertical,
          @platform, @code, @platform_long, @image, @thumb, @alt, @cta
        )
      `);
      const tx = this.db.transaction((rows) => {
        for (const p of rows) insert.run(p);
      });
      tx(seed);
    }

    const careerCount = this.db.prepare("SELECT COUNT(*) AS c FROM careers").get().c;
    if (careerCount === 0) {
      const seed = loadCareersSeed();
      const insert = this.db.prepare(`
        INSERT INTO careers (
          job_code, title, department, location, experience, employment_type,
          shift_timings, description, responsibilities, requirements, status,
          sort_order, apply_url, validation_type, expire_date, created_at, updated_at
        ) VALUES (
          @job_code, @title, @department, @location, @experience, @employment_type,
          @shift_timings, @description, @responsibilities, @requirements, @status,
          @sort_order, @apply_url, @validation_type, @expire_date, @created_at, @updated_at
        )
      `);
      const tx = this.db.transaction((rows) => {
        for (const c of rows) insert.run(c);
      });
      tx(seed);
    }
  }

  _rowToProject(row) {
    if (!row) return null;
    return {
      id: row.id,
      order: row.sort_order,
      frame_id: row.frame_id,
      title: row.title,
      description: row.description,
      client: row.client,
      vertical: row.vertical,
      platform: row.platform,
      code: row.code,
      platform_long: row.platform_long,
      image: row.image,
      thumb: row.thumb,
      alt: row.alt,
      cta: row.cta,
    };
  }

  _rowToCareer(row) {
    if (!row) return null;
    return {
      id: row.id,
      job_code: row.job_code,
      title: row.title,
      department: row.department,
      location: row.location,
      experience: row.experience,
      employment_type: row.employment_type,
      shift_timings: row.shift_timings,
      description: row.description,
      responsibilities: row.responsibilities,
      requirements: row.requirements,
      status: row.status,
      sort_order: row.sort_order,
      apply_url: row.apply_url,
      validation_type: row.validation_type,
      expire_date: row.expire_date,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  list() {
    return this.db
      .prepare("SELECT * FROM projects ORDER BY sort_order ASC, id ASC")
      .all()
      .map((r) => this._rowToProject(r));
  }

  get(id) {
    const row = this.db.prepare("SELECT * FROM projects WHERE id = ?").get(Number(id));
    return this._rowToProject(row);
  }

  create(input) {
    const existing = this.list();
    const maxOrder = existing.reduce((m, p) => Math.max(m, p.order || 0), 0);
    const project = normalizeProject(
      {
        ...input,
        order: input.order != null ? input.order : maxOrder + 1,
        frame_id: input.frame_id || nextFrameId(existing),
      },
      maxOrder + 1
    );
    const info = this.db
      .prepare(
        `INSERT INTO projects (
          sort_order, frame_id, title, description, client, vertical,
          platform, code, platform_long, image, thumb, alt, cta
        ) VALUES (
          @order, @frame_id, @title, @description, @client, @vertical,
          @platform, @code, @platform_long, @image, @thumb, @alt, @cta
        )`
      )
      .run(project);
    return this.get(info.lastInsertRowid);
  }

  update(id, input) {
    const current = this.get(id);
    if (!current) return null;
    const project = normalizeProject({ ...current, ...input, id: current.id }, current.order);
    this.db
      .prepare(
        `UPDATE projects SET
          sort_order = @order,
          frame_id = @frame_id,
          title = @title,
          description = @description,
          client = @client,
          vertical = @vertical,
          platform = @platform,
          code = @code,
          platform_long = @platform_long,
          image = @image,
          thumb = @thumb,
          alt = @alt,
          cta = @cta
        WHERE id = @id`
      )
      .run(project);
    return this.get(id);
  }

  remove(id) {
    const info = this.db.prepare("DELETE FROM projects WHERE id = ?").run(Number(id));
    return info.changes > 0;
  }

  listCareers({ status } = {}) {
    if (status && status !== "all") {
      return this.db
        .prepare(
          "SELECT * FROM careers WHERE status = ? ORDER BY sort_order ASC, job_code ASC"
        )
        .all(status)
        .map((r) => this._rowToCareer(r));
    }
    return this.db
      .prepare("SELECT * FROM careers ORDER BY sort_order ASC, job_code ASC")
      .all()
      .map((r) => this._rowToCareer(r));
  }

  getCareer(id) {
    const row = this.db.prepare("SELECT * FROM careers WHERE id = ?").get(Number(id));
    return this._rowToCareer(row);
  }

  getCareerByCode(code) {
    const row = this.db
      .prepare("SELECT * FROM careers WHERE job_code = ?")
      .get(String(code || "").trim());
    return this._rowToCareer(row);
  }

  createCareer(input) {
    const existing = this.listCareers({ status: "all" });
    const maxOrder = existing.reduce((m, c) => Math.max(m, c.sort_order || 0), 0);
    const code = String(input.job_code || "").trim();
    if (code && this.getCareerByCode(code)) {
      const err = new Error("Job code already exists");
      err.code = "DUPLICATE_JOB_CODE";
      throw err;
    }
    const ts = nowIso();
    const career = normalizeCareer(
      {
        ...input,
        sort_order: input.sort_order != null ? input.sort_order : maxOrder + 1,
        created_at: ts,
        updated_at: ts,
      },
      maxOrder + 1
    );
    try {
      const info = this.db
        .prepare(
          `INSERT INTO careers (
            job_code, title, department, location, experience, employment_type,
            shift_timings, description, responsibilities, requirements, status,
            sort_order, apply_url, validation_type, expire_date, created_at, updated_at
          ) VALUES (
            @job_code, @title, @department, @location, @experience, @employment_type,
            @shift_timings, @description, @responsibilities, @requirements, @status,
            @sort_order, @apply_url, @validation_type, @expire_date, @created_at, @updated_at
          )`
        )
        .run(career);
      return this.getCareer(info.lastInsertRowid);
    } catch (err) {
      if (String(err.message || "").includes("UNIQUE")) {
        const e = new Error("Job code already exists");
        e.code = "DUPLICATE_JOB_CODE";
        throw e;
      }
      throw err;
    }
  }

  updateCareer(id, input) {
    const current = this.getCareer(id);
    if (!current) return null;
    if (input.job_code != null) {
      const other = this.getCareerByCode(input.job_code);
      if (other && other.id !== current.id) {
        const err = new Error("Job code already exists");
        err.code = "DUPLICATE_JOB_CODE";
        throw err;
      }
    }
    const career = normalizeCareer(
      {
        ...current,
        ...input,
        id: current.id,
        created_at: current.created_at,
        updated_at: nowIso(),
      },
      current.sort_order
    );
    try {
      this.db
        .prepare(
          `UPDATE careers SET
            job_code = @job_code,
            title = @title,
            department = @department,
            location = @location,
            experience = @experience,
            employment_type = @employment_type,
            shift_timings = @shift_timings,
            description = @description,
            responsibilities = @responsibilities,
            requirements = @requirements,
            status = @status,
            sort_order = @sort_order,
            apply_url = @apply_url,
            validation_type = @validation_type,
            expire_date = @expire_date,
            created_at = @created_at,
            updated_at = @updated_at
          WHERE id = @id`
        )
        .run(career);
    } catch (err) {
      if (String(err.message || "").includes("UNIQUE")) {
        const e = new Error("Job code already exists");
        e.code = "DUPLICATE_JOB_CODE";
        throw e;
      }
      throw err;
    }
    return this.getCareer(id);
  }

  removeCareer(id) {
    const info = this.db.prepare("DELETE FROM careers WHERE id = ?").run(Number(id));
    return info.changes > 0;
  }
}

function createStore() {
  ensureDir(DATA_DIR);
  try {
    // optional native module
    // eslint-disable-next-line import/no-extraneous-dependencies
    const Database = require("better-sqlite3");
    return new SqliteStore(Database);
  } catch (err) {
    console.warn("[store] better-sqlite3 unavailable, using JSON file store:", err.message);
    return new JsonStore();
  }
}

/* ---------- Admin credential bootstrap ---------- */
async function ensureAdminCredentials(bcrypt, env) {
  ensureDir(DATA_DIR);
  const username = String(env.ADMIN_USER || "admin").trim() || "admin";
  if (fs.existsSync(AUTH_PATH)) {
    const saved = JSON.parse(fs.readFileSync(AUTH_PATH, "utf8"));
    return {
      username: saved.username || username,
      passwordHash: saved.passwordHash,
      source: "file",
    };
  }
  const plain = env.ADMIN_PASSWORD;
  if (!plain) {
    throw new Error(
      "ADMIN_PASSWORD is required on first run (set in server/.env). Password is hashed and stored in data/admin-auth.json."
    );
  }
  const passwordHash = await bcrypt.hash(String(plain), 12);
  const payload = {
    username,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  const tmp = `${AUTH_PATH}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(payload, null, 2), "utf8");
  fs.renameSync(tmp, AUTH_PATH);
  console.log("[auth] Admin credentials hashed and saved to data/admin-auth.json");
  return { username, passwordHash, source: "bootstrap" };
}

module.exports = {
  ROOT,
  DATA_DIR,
  SEED_PATH,
  CAREERS_SEED_PATH,
  AUTH_PATH,
  VERTICALS,
  EMPLOYMENT_TYPES,
  CAREER_STATUSES,
  createStore,
  ensureAdminCredentials,
  platformMeta,
  normalizeProject,
  normalizeCareer,
  toPublicCareerDetail,
};
