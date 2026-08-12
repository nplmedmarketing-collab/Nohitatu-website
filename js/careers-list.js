/* Open positions list: prefers GET /api/careers (Render on GitHub Pages); static HTML is fallback. */
(() => {
  const grid = document.querySelector(".careers-jobs-grid");
  if (!grid) return;

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function metaRows(job) {
    const rows = [];
    const code = job.job_code || job.jobid || "";
    if (code) {
      rows.push(
        `<div><dt>Job Code</dt><dd><span class="careers-job-code">${escapeHtml(code)}</span></dd></div>`
      );
    }
    if (job.experience) {
      rows.push(`<div><dt>Experience</dt><dd>${escapeHtml(job.experience)}</dd></div>`);
    }
    if (job.location) {
      rows.push(`<div><dt>Location</dt><dd>${escapeHtml(job.location)}</dd></div>`);
    }
    if (job.shift_timings) {
      rows.push(`<div><dt>Shift Timings</dt><dd>${escapeHtml(job.shift_timings)}</dd></div>`);
    }
    if (job.department) {
      rows.push(`<div><dt>Department</dt><dd>${escapeHtml(job.department)}</dd></div>`);
    }
    if (job.employment_type && job.employment_type !== "full-time") {
      const label = String(job.employment_type)
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      rows.push(`<div><dt>Type</dt><dd>${escapeHtml(label)}</dd></div>`);
    }
    return rows.join("");
  }

  function cardHtml(job) {
    const code = job.job_code || job.jobid || "";
    const href =
      job.details_url ||
      (code ? `Careerdetails.html?id=${encodeURIComponent(code)}` : "Careerdetails.html");
    const title = job.title || job.post || "Open role";
    return `<article class="careers-job">
      <h3 class="careers-job-title">${escapeHtml(title)}</h3>
      <dl class="careers-job-meta">${metaRows(job)}</dl>
      <a class="careers-job-apply" href="${escapeHtml(href)}">Apply</a>
    </article>`;
  }

  function render(careers) {
    if (!Array.isArray(careers) || !careers.length) {
      grid.innerHTML =
        '<p class="careers-jobs-empty" style="grid-column:1/-1;color:inherit;opacity:.75;margin:0">No open positions right now. Check back soon or write to <a href="mailto:hrd@nohitatu.com">hrd@nohitatu.com</a>.</p>';
      return true;
    }
    grid.innerHTML = careers.map(cardHtml).join("");
    return true;
  }

  async function loadFromApi() {
    try {
      const url =
        typeof window.NH_apiUrl === "function" ? window.NH_apiUrl("/api/careers") : "/api/careers";
      const res = await fetch(url, { credentials: "omit", cache: "no-store" });
      if (!res.ok) return false;
      const data = await res.json();
      return render(data.careers || []);
    } catch {
      return false;
    }
  }

  loadFromApi().catch(() => {
    /* static HTML articles remain */
  });
})();
