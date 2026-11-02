/*
 * Open positions for Careers.html - FactoHR-style cards.
 * Prefers HRPops CandidatePortal (companyId 183) - same id space as PostResume apply.
 * Falls back to GET /api/careers, then static HTML cards.
 */
(() => {
  const container = document.querySelector("[data-careers-list]");
  if (!container) return;

  const PAGE = 6;
  const searchInput = document.getElementById("job-search");
  const resetBtn = document.querySelector("[data-job-search-reset]");
  const searchBtn = document.getElementById("search-submit");
  const moreWrap = document.querySelector("[data-careers-more]");
  const moreBtn = moreWrap ? moreWrap.querySelector("button") : null;

  let allJobs = [];
  let filtered = [];
  let shown = 0;
  let ready = false;

  const staticFallbackHtml = container.innerHTML;

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function typeLabel(job) {
    const raw = job.category_name || job.employment_type || "";
    if (!raw) return "Full-time";
    return String(raw)
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) =>c.toUpperCase());
  }

  function detailsHref(job) {
    const code = job.job_code || job.jobid || job.jobPostId || "";
    if (job.details_url) return job.details_url;
    if (!code) return "Careerdetails";
    const q = new URLSearchParams();
    q.set("id", String(code));
    if (job.companyId) q.set("companyId", String(job.companyId));
    const qs = q.toString();
    return `Careerdetails?${qs}#${qs}`;
  }

  function cardHtml(job) {
    const href = detailsHref(job);
    const title = job.title || job.post || "Open role";
    const code = job.job_code || job.jobid || job.jobPostId || "-";
    const dept = job.department || "General";
    const vacancies =
      job.vacancies != null && String(job.vacancies).trim() !== ""
        ? String(job.vacancies)
        : "-";
    const location = job.location || "-";
    const experience = job.experience || "-";
    return `<article class="nh-job-card">
      <div class="nh-job-card-head">
        <div>
          <h3><a href="${escapeHtml(href)}">${escapeHtml(title)}</a></h3>
          <p class="nh-job-codes">
            <span><strong>JOB CODE</strong> ${escapeHtml(code)}</span>
            <span><strong>DEPARTMENT</strong> ${escapeHtml(dept)}</span>
          </p>
        </div>
        <a class="nh-job-arrow" href="${escapeHtml(href)}" aria-label="View ${escapeHtml(title)}">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 18L12.6 16.55L16.15 13H4V11H16.15L12.6 7.45L14 6L20 12L14 18Z" fill="currentColor"/></svg>
        </a>
      </div>
      <dl class="nh-job-meta">
        <div><dt>NO. OF POSITION</dt><dd>${escapeHtml(vacancies)}</dd></div>
        <div><dt>WORK LOCATION</dt><dd>${escapeHtml(location)}</dd></div>
        <div><dt>EXPERIENCE</dt><dd>${escapeHtml(experience)}</dd></div>
        <div><dt>TYPE</dt><dd>${escapeHtml(typeLabel(job))}</dd></div>
      </dl>
    </article>`;
  }

  function emptyHtml(query) {
    const note = query
      ? "We couldn't find any job openings"
      : 'No open positions right now. Check back soon or write to <a href="mailto:hrd@nohitatu.com">hrd@nohitatu.com</a>.';
    return `<div class="nh-jobs-empty" role="status">
      <h3 class="nh-jobs-empty-head">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960" aria-hidden="true"><path fill="#ef4444" d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Z"/></svg>No Job Openings
      </h3>
      <p>${note}</p>
    </div>`;
  }

  function setMore(visible) {
    if (!moreWrap) return;
    moreWrap.classList.toggle("is-hidden", !visible);
  }

  function showLoading() {
    ready = false;
    setMore(false);
    container.innerHTML =
      '<div class="nh-jobs-status" role="status"><span class="nh-job-loader" aria-hidden="true"></span><span class="visually-hidden">Loading open positions</span></div>';
  }

  function paint(reset) {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    filtered = !query
      ? allJobs.slice()
      : allJobs.filter((job) => {
          const blob = [job.title, job.post, job.job_code, job.location, job.department, job.experience]
            .join(" ")
            .toLowerCase();
          return blob.includes(query);
        });
    if (reset) shown = Math.min(PAGE, filtered.length);
    else shown = Math.min(filtered.length, Math.max(shown, Math.min(PAGE, filtered.length)));

    if (!filtered.length) {
      container.innerHTML = emptyHtml(query);
      setMore(false);
      return;
    }
    container.innerHTML = filtered.slice(0, shown).map(cardHtml).join("");
    setMore(shown < filtered.length);
  }

  function renderFromApi(careers) {
    allJobs = Array.isArray(careers) ? careers : [];
    ready = true;
    paint(true);
  }

  function restoreStaticFallback() {
    if (!staticFallbackHtml || !staticFallbackHtml.trim()) return false;
    if (!staticFallbackHtml.includes("nh-job-card")) return false;
    container.innerHTML = staticFallbackHtml;
    ready = false;
    setMore(false);
    return true;
  }

  if (searchInput) {
    const syncReset = () => {
      if (!resetBtn) return;
      resetBtn.hidden = !searchInput.value;
    };
    searchInput.addEventListener("input", () => {
      syncReset();
      if (ready) paint(true);
    });
    syncReset();
  }

  if (resetBtn && searchInput) {
    resetBtn.addEventListener("click", () => {
      searchInput.value = "";
      resetBtn.hidden = true;
      searchInput.focus();
      if (ready) paint(true);
    });
  }

  if (searchBtn && searchInput) {
    searchBtn.addEventListener("click", () => {
      searchInput.focus();
      if (ready) paint(true);
    });
  }

  if (moreBtn) {
    moreBtn.addEventListener("click", () => {
      if (!ready) return;
      shown = Math.min(filtered.length, shown + PAGE);
      container.innerHTML = filtered.slice(0, shown).map(cardHtml).join("");
      setMore(shown < filtered.length);
    });
  }

  async function loadFromHrpops() {
    const client = window.NH_HRPOPS_CAREERS;
    if (!client || typeof client.fetchJobs !== "function") return false;
    const result = await client.fetchJobs();
    if (!result || !Array.isArray(result.jobs)) return false;
    if (result.configured || result.jobs.length) {
      renderFromApi(result.jobs);
      return true;
    }
    return false;
  }

  async function loadFromLocalApi() {
    try {
      const url =
        typeof window.NH_apiUrl === "function" ? window.NH_apiUrl("/api/careers") : "/api/careers";
      const res = await fetch(url, { credentials: "omit", cache: "no-store" });
      if (!res.ok) return false;
      const data = await res.json();
      if (!Array.isArray(data.careers)) return false;
      renderFromApi(data.careers);
      return true;
    } catch {
      return false;
    }
  }

  async function loadJobs() {
    showLoading();
    try {
      if (await loadFromHrpops()) return;
    } catch (err) {
      console.warn("[careers] HRPops unavailable:", err && err.message ? err.message : err);
    }
    try {
      if (await loadFromLocalApi()) return;
    } catch {
      /* continue */
    }
    if (restoreStaticFallback()) return;
    ready = true;
    allJobs = [];
    paint(true);
  }

  loadJobs().catch(() => {
    if (!restoreStaticFallback()) {
      ready = true;
      allJobs = [];
      paint(true);
    }
  });
})();
