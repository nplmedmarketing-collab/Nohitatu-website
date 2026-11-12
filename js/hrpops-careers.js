/**
 * HRPops CandidatePortal client for Nohitatu careers.
 *
 * Endpoints (official):
 *   GET  {apiBase}/CandidatePortal/jobs[?companyId=]
 *   GET  {apiBase}/CandidatePortal/jobs/{companyId}/{jobPostId}
 *   POST {apiBase}/CandidatePortal/apply/{companyId}  (multipart + Bearer - use portal)
 *
 * Config (any of):
 *   <meta name="nh-hrpops-company-id" content="YOUR_COMPANY_ID">
 *   <meta name="nh-hrpops-api" content="https://api.hrpops.com/api">
 *   <meta name="nh-hrpops-portal" content="https://hrpops.com">
 *   window.NH_HRPOPS = { companyId, apiBase, portalBase, companyName }
 *
 * Set companyId to your HRPops tenant id so other companies' public jobs are excluded.
 * Site CTAs apply via local PostResume.html; portalApplyUrl remains for reference only.
 */
(() => {
  const DEFAULT_API = "https://api.hrpops.com/api";
  const DEFAULT_PORTAL = "https://hrpops.com";
  /* Get in touch / speculative applications land here; hidden from Careers list. */
  const DEFAULT_OPEN_APPLICATION_JOB_ID = "1141";

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
    /* Dedicated HRPops job that stores Get in touch / speculative applications. */
    const openApplicationJobId = String(
      w.openApplicationJobId ??
        meta("nh-hrpops-open-application-job-id") ??
        DEFAULT_OPEN_APPLICATION_JOB_ID
    ).trim();
    return { companyId, apiBase, portalBase, companyName, openApplicationJobId };
  }

  const TALENT_POOL_TITLE_RE =
    /open\s*applications?|general\s*applications?|speculative|talent\s*pool|open\s*profile/;

  function isTalentPoolJob(job) {
    if (!job) return false;
    const cfg = config();
    const id = String(
      job.jobPostId ?? job.job_code ?? job.jobid ?? job.id ?? ""
    ).trim();
    if (
      id &&
      (id === String(cfg.openApplicationJobId) ||
        id === DEFAULT_OPEN_APPLICATION_JOB_ID)
    ) {
      return true;
    }
    const title = String(
      job.title || job.post || job.postName || job.PostName || ""
    )
      .trim()
      .toLowerCase();
    return TALENT_POOL_TITLE_RE.test(title);
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

  /**
   * HRPops field / skill visibility (job Skill Set step).
   * Each skillSetDTO has:
   *   hr      — show rating field for Recruiter (internal)
   *   endUser — show rating field for candidate / End User portal
   * Candidate portal must only surface endUser-visible items.
   * Fail closed when a restrictable field has unknown visibility metadata.
   */
  const VISIBILITY_FLAG_KEYS = [
    "endUser",
    "EndUser",
    "hr",
    "Hr",
    "HR",
    "visibleToCandidate",
    "VisibleToCandidate",
    "showInPortal",
    "ShowInPortal",
    "candidateVisible",
    "CandidateVisible",
    "isInternal",
    "IsInternal",
    "internalOnly",
    "InternalOnly",
    "visibility",
    "Visibility",
    "visibleTo",
    "VisibleTo",
  ];

  function hasOwn(obj, key) {
    return !!obj && Object.prototype.hasOwnProperty.call(obj, key);
  }

  function truthyFlag(value) {
    if (value === true || value === 1 || value === "1") return true;
    if (typeof value === "string") {
      const s = value.trim().toLowerCase();
      return s === "true" || s === "yes" || s === "enduser" || s === "candidate" || s === "portal" || s === "both";
    }
    return false;
  }

  function falsyFlag(value) {
    if (value === false || value === 0 || value === "0") return true;
    if (typeof value === "string") {
      const s = value.trim().toLowerCase();
      return s === "false" || s === "no" || s === "hr" || s === "internal" || s === "recruiter";
    }
    return false;
  }

  function hasVisibilityMetadata(raw) {
    if (!raw || typeof raw !== "object") return false;
    return VISIBILITY_FLAG_KEYS.some((k) => hasOwn(raw, k) && raw[k] != null && raw[k] !== "");
  }

  /**
   * Whether a field/skill is allowed on the public candidate form.
   * Options: { failClosed: true } (default) hides when rule is unknown.
   */
  function isCandidateVisible(raw, options) {
    const opts = options || {};
    const failClosed = opts.failClosed !== false;
    if (raw == null) return !failClosed;
    if (typeof raw !== "object") return true;

    if (hasOwn(raw, "endUser") || hasOwn(raw, "EndUser")) {
      return truthyFlag(raw.endUser ?? raw.EndUser);
    }
    if (hasOwn(raw, "visibleToCandidate") || hasOwn(raw, "VisibleToCandidate")) {
      return truthyFlag(raw.visibleToCandidate ?? raw.VisibleToCandidate);
    }
    if (hasOwn(raw, "candidateVisible") || hasOwn(raw, "CandidateVisible")) {
      return truthyFlag(raw.candidateVisible ?? raw.CandidateVisible);
    }
    if (hasOwn(raw, "showInPortal") || hasOwn(raw, "ShowInPortal")) {
      return truthyFlag(raw.showInPortal ?? raw.ShowInPortal);
    }
    if (hasOwn(raw, "isInternal") || hasOwn(raw, "IsInternal")) {
      return !truthyFlag(raw.isInternal ?? raw.IsInternal);
    }
    if (hasOwn(raw, "internalOnly") || hasOwn(raw, "InternalOnly")) {
      return !truthyFlag(raw.internalOnly ?? raw.InternalOnly);
    }
    if (hasOwn(raw, "visibility") || hasOwn(raw, "Visibility")) {
      const v = raw.visibility ?? raw.Visibility;
      if (truthyFlag(v)) return true;
      if (falsyFlag(v)) return false;
      const s = String(v).trim().toLowerCase();
      if (s === "hr" || s === "internal" || s === "recruiter") return false;
      if (s === "enduser" || s === "candidate" || s === "portal" || s === "public" || s === "both") {
        return true;
      }
      return !failClosed;
    }
    if (hasOwn(raw, "visibleTo") || hasOwn(raw, "VisibleTo")) {
      const v = String(raw.visibleTo ?? raw.VisibleTo).trim().toLowerCase();
      if (!v) return !failClosed;
      if (v.includes("candidate") || v.includes("enduser") || v.includes("portal") || v === "both" || v === "public") {
        return true;
      }
      if (v.includes("hr") || v.includes("internal") || v.includes("recruiter")) return false;
      return !failClosed;
    }
    /* HR-only without endUser flag */
    if ((hasOwn(raw, "hr") || hasOwn(raw, "Hr") || hasOwn(raw, "HR")) && truthyFlag(raw.hr ?? raw.Hr ?? raw.HR)) {
      return false;
    }
    /* Restrictable item with no readable rule — fail closed on candidate portal. */
    if (failClosed) return false;
    return true;
  }

  function normalizeSkillSet(raw) {
    if (!raw || typeof raw !== "object") return null;
    const skillId = raw.skillId ?? raw.SkillId;
    const skill = String(raw.skill ?? raw.Skill ?? raw.skillName ?? "").trim();
    if (skillId == null && !skill) return null;
    const out = {
      skillId,
      skill,
      hr: raw.hr ?? raw.Hr ?? raw.HR,
      endUser: raw.endUser ?? raw.EndUser,
    };
    VISIBILITY_FLAG_KEYS.forEach((k) => {
      if (hasOwn(raw, k) && out[k] === undefined) out[k] = raw[k];
    });
    out.candidateVisible = isCandidateVisible(raw, { failClosed: true });
    return out;
  }

  function filterCandidateVisibleSkills(skillSets, options) {
    const list = Array.isArray(skillSets) ? skillSets : [];
    return list
      .map(normalizeSkillSet)
      .filter(Boolean)
      .filter((sk) => isCandidateVisible(sk, options));
  }

  /**
   * Skill Set section on the public apply form.
   * - No skills on the job → section may still offer freeform entry (not HR-restricted).
   * - Skills present but none endUser-visible / flags missing → hide (fail closed).
   * - At least one endUser skill → show, presets filtered.
   */
  function resolveSkillSetVisibility(rawJob, options) {
    const opts = options || {};
    const failClosed = opts.failClosed !== false;
    const rawList =
      rawJob?.skillSetDTOs ??
      rawJob?.SkillSetDTOs ??
      rawJob?.skillSets ??
      rawJob?.SkillSets ??
      [];
    const all = Array.isArray(rawList) ? rawList.map(normalizeSkillSet).filter(Boolean) : [];
    const visible = filterCandidateVisibleSkills(all, { failClosed });
    const anyConfigured = all.length > 0;
    const anyHaveMeta = all.some((sk) => hasVisibilityMetadata(sk));
    /* CandidatePortal today returns skillSets without hr/endUser — treat as unknown → hide. */
    const showSection = anyConfigured ? visible.length > 0 : true;
    return {
      fieldKey: "skillSet",
      show: showSection,
      reason: !anyConfigured
        ? "no-skills-configured"
        : visible.length
          ? "enduser-visible"
          : anyHaveMeta
            ? "internal-only"
            : "visibility-unknown-fail-closed",
      allSkills: all,
      visibleSkills: visible,
      schemaOk: true,
    };
  }

  /** Generic map of HRPops field keys → candidate visibility for the local form. */
  function resolveApplicationFieldVisibility(rawJob, options) {
    const skill = resolveSkillSetVisibility(rawJob, options);
    const fields = {
      skillSet: skill,
    };
    /* Future: jobApplicantField / custom fields with visibility metadata */
    const applicantFields =
      rawJob?.jobApplicantFields ??
      rawJob?.JobApplicantFields ??
      rawJob?.applicationFields ??
      rawJob?.ApplicationFields;
    if (Array.isArray(applicantFields)) {
      applicantFields.forEach((f) => {
        if (!f || typeof f !== "object") return;
        const key = String(
          f.key ?? f.Key ?? f.fieldKey ?? f.FieldKey ?? f.field ?? f.Field ?? f.id ?? f.Id ?? ""
        ).trim();
        if (!key) return;
        const normalizedKey = key.replace(/\s+/g, "").replace(/^./, (c) => c.toLowerCase());
        const alias =
          /skillset|skill.?set|skills/i.test(key) ? "skillSet" : normalizedKey;
        fields[alias] = {
          fieldKey: alias,
          show: isCandidateVisible(f, options),
          reason: hasVisibilityMetadata(f) ? "field-metadata" : "visibility-unknown-fail-closed",
          raw: f,
          schemaOk: true,
        };
      });
    }
    return { fields, skillSet: fields.skillSet || skill, schemaOk: true };
  }

  function portalJobUrl(companyId, jobPostId) {
    const { portalBase } = config();
    return `${portalBase}/careers/${encodeURIComponent(companyId)}/${encodeURIComponent(jobPostId)}`;
  }

  function portalApplyUrl(companyId, jobPostId) {
    const { portalBase } = config();
    return `${portalBase}/careers/apply/${encodeURIComponent(companyId)}/${encodeURIComponent(jobPostId)}`;
  }

  function jobQuery(companyId, jobPostId) {
    const q = new URLSearchParams();
    q.set("id", String(jobPostId));
    if (companyId != null && String(companyId).trim() !== "" && Number(companyId) !== 0) {
      q.set("companyId", String(companyId));
    }
    return q.toString();
  }

  function localDetailsUrl(companyId, jobPostId) {
    const qs = jobQuery(companyId, jobPostId);
    /* Duplicate params in the hash: `npx serve` cleanUrls 301 drops ?query but keeps #hash. */
    return `Careerdetails.html?${qs}#${qs}`;
  }

  /** On-site application form. Same hash-safe query as job detail. */
  function localApplyUrl(companyId, jobPostId) {
    const qs = jobQuery(companyId, jobPostId);
    return `PostResume.html?${qs}#${qs}`;
  }

  /** Map HRPops job ->shape expected by careers-list / career detail UI. */
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
      skillSets: (() => {
        const visibility = resolveSkillSetVisibility(raw, { failClosed: true });
        return visibility.visibleSkills;
      })(),
      skillSetsAll: (() => {
        const rawList =
          raw.skillSetDTOs ?? raw.SkillSetDTOs ?? raw.skillSets ?? raw.SkillSets ?? [];
        return Array.isArray(rawList)
          ? rawList.map(normalizeSkillSet).filter(Boolean)
          : [];
      })(),
      fieldVisibility: resolveApplicationFieldVisibility(raw, { failClosed: true }),
      vacancies: raw.noOfVacancies ?? raw.NoOfVacancies,
      public_job_post: !!(raw.publicJobPost ?? raw.PublicJobPost ?? true),
      details_url: localDetailsUrl(cid || companyId, jobPostId),
      apply_url: localApplyUrl(cid || companyId, jobPostId),
      applyUrl: localApplyUrl(cid || companyId, jobPostId),
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
   * Options: { includeTalentPool: true } keeps the Open application / Talent pool
   * posting (hidden from the public Careers list by default).
   * Returns { jobs, configured, source } or throws.
   */
  async function fetchJobs(options) {
    const opts = options || {};
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
    if (!opts.includeTalentPool) {
      jobs = jobs.filter((j) => !isTalentPoolJob(j));
    }
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
    /* Detail payload sometimes returns companyId: 0 - keep path companyId. */
    const normalized = normalizeJob({ ...raw, companyId: raw.companyId || cid });
    if (normalized && (!normalized.companyId || Number(normalized.companyId) === 0)) {
      normalized.companyId = cid;
      normalized.apply_url = localApplyUrl(cid, jobPostId);
      normalized.applyUrl = normalized.apply_url;
      normalized.details_url = localDetailsUrl(cid, jobPostId);
      normalized.portal_job_url = portalJobUrl(cid, jobPostId);
    }
    return normalized;
  }

  /**
   * Build FormData for POST /CandidatePortal/apply/{companyId}.
   * Requires candidate Bearer token (CORS + auth) - site CTAs use localApplyUrl / PostResume.
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
      let i = 0;
      f.skillsRating.forEach((row) => {
        if (!row) return;
        const skillId = Number(row.skillId);
        const skill = String(row.skill || "").trim();
        if (!Number.isFinite(skillId) || skillId <= 0 || !skill) return;
        fd.append(`skillsRating[${i}].SkillId`, String(skillId));
        fd.append(`skillsRating[${i}].Skill`, skill);
        fd.append(
          `skillsRating[${i}].ExperienceYear`,
          String(Math.max(0, Number(row.experienceYear) || 0))
        );
        fd.append(
          `skillsRating[${i}].ExperienceMonth`,
          String(Math.max(0, Number(row.experienceMonth) || 0))
        );
        fd.append(
          `skillsRating[${i}].Rating`,
          String(Math.max(1, Number(row.rating) || 2))
        );
        i += 1;
      });
    }
    return fd;
  }

  /**
   * POST application. Needs Authorization: Bearer <candidateToken>.
   * Public site CTAs use localApplyUrl() ->PostResume.html instead.
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
    const payload = await res.json().catch(() =>null);
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
    isTalentPoolJob,
    portalApplyUrl,
    portalJobUrl,
    localDetailsUrl,
    localApplyUrl,
    buildApplyFormData,
    submitApplication,
    isCandidateVisible,
    hasVisibilityMetadata,
    normalizeSkillSet,
    filterCandidateVisibleSkills,
    resolveSkillSetVisibility,
    resolveApplicationFieldVisibility,
  };
})();
