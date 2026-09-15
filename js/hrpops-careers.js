/**
 * HRPops CandidatePortal client for Nohitatu careers.
 *
 * Endpoints (official):
 *   GET  {apiBase}/CandidatePortal/jobs[?companyId=]
 *   GET  {apiBase}/CandidatePortal/jobs/{companyId}/{jobPostId}
 *   POST {apiBase}/CandidatePortal/apply/{companyId}  (multipart + Bearer — use portal)
 *
 * Config (any of):
 *   <meta name="nh-hrpops-company-id" content="YOUR_COMPANY_ID">
 *   <meta name="nh-hrpops-api" content="https://api.hrpops.com/api">
 *   <meta name="nh-hrpops-portal" content="https://hrpops.com">
 *   window.NH_HRPOPS = { companyId, apiBase, portalBase, companyName }
 *
 * Set companyId to your HRPops tenant id so other companies' public jobs are excluded.
 * Apply uses the HRPops candidate portal (API apply requires a logged-in candidate token).
 */
(() => {
  const DEFAULT_API = "https://api.hrpops.com/api";
  const DEFAULT_PORTAL = "https://hrpops.com";

  function meta(name) {
    const el = document.querySelector(`meta[name="${name}"]`);
    return (el && el.getAttribute("content")) || "";
  }

  function config() {
    const w = (typeof window.NH_HRPOPS === "object" && window.NH_HRPOPS) || {};
    const companyId = String(
      w.companyId ?? meta("nh-hrpops-company-id") ?? ""
    ).trim();
    const apiBase = String(w.apiBase || meta("nh-hrpops-api") || DEFAULT_API)
      .trim()
      .replace(/\/$/, "");
    const portalBase = String(
      w.portalBase || meta("nh-hrpops-portal") || DEFAULT_PORTAL
    )
      .trim()
      .replace(/\/$/, "");
    const companyName = String(
      w.companyName || meta("nh-hrpops-company-name") || "Nohitatu"
    ).trim();
    return { companyId, apiBase, portalBase, companyName };
  }

  function apiOk(payload) {
    return payload && (payload.status === true || payload.Status === true);
  }

  function apiData(payload) {
    if (!payload || typeof payload !== "object") return null;
    return payload.data ?? payload.Data ?? null;
  }

  function experienceLabel(raw) {
    const s = String(raw ?? "").trim();
    if (!s) return "";
    if (/^\d+(\.\d+)?$/.test(s)) return `${s}+ Years`;
    return s;
  }

  function portalJobUrl(companyId, jobPostId) {
    const { portalBase } = config();
    return `${portalBase}/careers/${encodeURIComponent(companyId)}/${encodeURIComponent(jobPostId)}`;
  }

  function portalApplyUrl(companyId, jobPostId) {
    const { portalBase } = config();
    return `${portalBase}/careers/apply/${encodeURIComponent(companyId)}/${encodeURIComponent(jobPostId)}`;
  }

  function localDetailsUrl(companyId, jobPostId) {
    const q = new URLSearchParams();
    q.set("id", String(jobPostId));
    if (companyId != null && String(companyId).trim() !== "" && Number(companyId) !== 0) {
      q.set("companyId", String(companyId));
    }
    const qs = q.toString();
    /* Duplicate params in the hash: `npx serve` cleanUrls 301 drops ?query but keeps #hash. */
    return `Careerdetails.html?${qs}#${qs}`;
  }

  /** Map HRPops job → shape expected by careers-list / career detail UI. */
  function normalizeJob(raw) {
    if (!raw || typeof raw !== "object") return null;
    const companyId = raw.companyId ?? raw.CompanyId;
    const jobPostId = raw.jobPostId ?? raw.JobPostId;
    if (jobPostId == null) return null;
    const postName = raw.postName ?? raw.PostName ?? "Open role";
    const location = raw.locationLabel ?? raw.LocationLabel ?? "";
    const experience = experienceLabel(raw.experienceLabel ?? raw.ExperienceLabel);
    const department = raw.departmentName ?? raw.DepartmentName ?? "";
    const category = raw.categoryName ?? raw.CategoryName ?? "";
    const mustHave = raw.mustHave ?? raw.MustHave ?? "";
    const responsibilities = raw.responsibilities ?? raw.Responsibilities ?? "";
    const description = raw.description ?? raw.Description ?? "";
    const cid = companyId != null && Number(companyId) !== 0 ? companyId : null;

    return {
      id: jobPostId,
      job_code: String(jobPostId),
      jobPostId,
      companyId: cid,
      company_name: raw.companyName ?? raw.CompanyName ?? "",
      title: postName,
      post: postName,
      department,
      location,
      experience,
      employment_type: category
        ? String(category).toLowerCase().replace(/\s+/g, "-")
        : "full-time",
      category_name: category,
      shift_timings: "",
      description,
      responsibilities,
      requirements: mustHave,
      musthave: mustHave,
      mustHave,
      status: "open",
      expire_date: raw.expiryDate ?? raw.ExpiryDate ?? "",
      expireDate: raw.expiryDate ?? raw.ExpiryDate ?? "",
      skill_names: raw.skillNames ?? raw.SkillNames ?? "",
      skillSets: raw.skillSets ?? raw.SkillSets ?? [],
      vacancies: raw.noOfVacancies ?? raw.NoOfVacancies,
      public_job_post: !!(raw.publicJobPost ?? raw.PublicJobPost ?? true),
      details_url: localDetailsUrl(cid || companyId, jobPostId),
      apply_url: portalApplyUrl(cid || companyId, jobPostId),
      applyUrl: portalApplyUrl(cid || companyId, jobPostId),
      portal_job_url: portalJobUrl(cid || companyId, jobPostId),
      source: "hrpops",
    };
  }

  function matchesCompany(job, cfg) {
    if (!cfg.companyId) {
      const name = String(job.company_name || "").toLowerCase();
      const want = String(cfg.companyName || "nohitatu").toLowerCase();
      return name.includes(want);
    }
    return String(job.companyId) === String(cfg.companyId);
  }

  async function fetchJson(url) {
    const res = await fetch(url, {
      credentials: "omit",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      const err = new Error(`HRPops HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }

  /**
   * Fetch open public jobs. When companyId is configured, uses ?companyId=.
   * Without companyId, filters client-side by companyName (default "Nohitatu").
   * Returns { jobs, configured, source } or throws.
   */
  async function fetchJobs() {
    const cfg = config();
    const qs = cfg.companyId
      ? `?companyId=${encodeURIComponent(cfg.companyId)}`
      : "";
    const url = `${cfg.apiBase}/CandidatePortal/jobs${qs}`;
    const payload = await fetchJson(url);
    if (!apiOk(payload) && !Array.isArray(apiData(payload))) {
      throw new Error(payload?.message || "HRPops jobs request failed");
    }
    const list = apiData(payload);
    const rawJobs = Array.isArray(list) ? list : [];
    let jobs = rawJobs.map(normalizeJob).filter(Boolean);
    if (!cfg.companyId) {
      const filtered = jobs.filter((j) => matchesCompany(j, cfg));
      /* If name filter matches nothing and companyId is unset, do not leak other tenants. */
      jobs = filtered;
    } else {
      jobs = jobs.filter((j) => matchesCompany(j, cfg) || !j.companyId);
    }
    jobs = jobs.filter((j) => j.public_job_post !== false);
    return {
      jobs,
      configured: Boolean(cfg.companyId),
      source: "hrpops",
      companyId: cfg.companyId || null,
    };
  }

  async function fetchJobDetail(companyId, jobPostId) {
    const cfg = config();
    const cid = companyId || cfg.companyId;
    if (!cid || !jobPostId) {
      throw new Error("companyId and jobPostId are required");
    }
    const url = `${cfg.apiBase}/CandidatePortal/jobs/${encodeURIComponent(cid)}/${encodeURIComponent(jobPostId)}`;
    const payload = await fetchJson(url);
    if (!apiOk(payload)) {
      throw new Error(payload?.message || "HRPops job detail failed");
    }
    const raw = apiData(payload);
    if (!raw || typeof raw !== "object") {
      throw new Error("Job not found");
    }
    /* Detail payload sometimes returns companyId: 0 — keep path companyId. */
    const normalized = normalizeJob({ ...raw, companyId: raw.companyId || cid });
    if (normalized && (!normalized.companyId || Number(normalized.companyId) === 0)) {
      normalized.companyId = cid;
      normalized.apply_url = portalApplyUrl(cid, jobPostId);
      normalized.applyUrl = normalized.apply_url;
      normalized.details_url = localDetailsUrl(cid, jobPostId);
      normalized.portal_job_url = portalJobUrl(cid, jobPostId);
    }
    return normalized;
  }

  /**
   * Build FormData for POST /CandidatePortal/apply/{companyId}.
   * Requires candidate Bearer token (CORS + auth) — prefer portalApplyUrl for site CTAs.
   * Documented field names from HRPops SPA apply form (multipart).
   */
  function buildApplyFormData(fields) {
    const fd = new FormData();
    const f = fields || {};
    if (f.jobPostId != null) fd.append("jobPostId", String(f.jobPostId));
    Object.keys(f).forEach((key) => {
      if (key === "jobPostId" || key === "skillsRating" || key === "resume" || key === "photo") {
        return;
      }
      const val = f[key];
      if (val == null || val === "") return;
      if (val instanceof Blob) fd.append(key, val, val.name || key);
      else fd.append(key, String(val));
    });
    if (f.resume) fd.append("resume", f.resume, f.resume.name || "resume.pdf");
    if (f.photo) fd.append("photo", f.photo, f.photo.name || "photo.jpg");
    if (Array.isArray(f.skillsRating)) {
      f.skillsRating.forEach((row, i) => {
        fd.append(`skillsRating[${i}].SkillId`, String(row.skillId ?? 0));
        fd.append(`skillsRating[${i}].Skill`, row.skill || "");
        fd.append(`skillsRating[${i}].ExperienceYear`, String(row.experienceYear ?? 0));
        fd.append(`skillsRating[${i}].ExperienceMonth`, String(row.experienceMonth ?? 0));
        fd.append(`skillsRating[${i}].Rating`, String(row.rating ?? 0));
      });
    }
    return fd;
  }

  /**
   * POST application. Needs Authorization: Bearer <candidateToken>.
   * Prefer linking candidates to portalApplyUrl() from the public site.
   */
  async function submitApplication(companyId, formData, candidateToken) {
    const cfg = config();
    const cid = companyId || cfg.companyId;
    if (!cid) throw new Error("companyId is required");
    const headers = {};
    if (candidateToken) headers.Authorization = `Bearer ${candidateToken}`;
    const res = await fetch(
      `${cfg.apiBase}/CandidatePortal/apply/${encodeURIComponent(cid)}`,
      {
        method: "POST",
        body: formData,
        credentials: "omit",
        headers,
      }
    );
    const payload = await res.json().catch(() => null);
    if (!res.ok || !apiOk(payload)) {
      const err = new Error(
        (payload && (payload.message || payload.Message)) ||
          `Apply failed (HTTP ${res.status})`
      );
      err.payload = payload;
      err.status = res.status;
      throw err;
    }
    return payload;
  }

  window.NH_HRPOPS_CAREERS = {
    config,
    fetchJobs,
    fetchJobDetail,
    normalizeJob,
    portalApplyUrl,
    portalJobUrl,
    localDetailsUrl,
    buildApplyFormData,
    submitApplication,
  };
})();
