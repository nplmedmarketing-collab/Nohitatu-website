/*
 * Open positions, grouped by department (drill-down accordion).
 * Prefers GET /api/careers (Render on GitHub Pages); the static accordion in
 * Careers.html is the offline / no-JS fallback. The API "department" field is
 * often blank, so department is inferred from the role title when needed.
 */
(() => {
  const container = document.querySelector("[data-careers-departments]");
  if (!container) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Department catalogue: order + presentation. Only non-empty depts render. */
  const DEPARTMENTS = [
    {
      id: "engineering",
      name: "Engineering & Development",
      blurb: "Build and ship the products our clients rely on.",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>',
    },
    {
      id: "business-analysis",
      name: "Business Analysis",
      blurb: "Turn business needs into clear, buildable requirements.",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>',
    },
    {
      id: "sales",
      name: "Sales & Business Development",
      blurb: "Grow partnerships and open new markets.",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>',
    },
    {
      id: "hr",
      name: "Human Resources",
      blurb: "Find, grow, and support our people.",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
    },
    {
      id: "design",
      name: "Design",
      blurb: "Craft intuitive, beautiful experiences.",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>',
    },
    {
      id: "marketing",
      name: "Marketing",
      blurb: "Tell the Nohitatu story to the world.",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-5v12L3 14v-3z"></path><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path></svg>',
    },
    {
      id: "operations",
      name: "Operations",
      blurb: "Keep delivery running smoothly.",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
    },
    {
      id: "other",
      name: "Other Opportunities",
      blurb: "Roles that span teams.",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>',
    },
  ];
  const DEPT_BY_ID = Object.fromEntries(DEPARTMENTS.map((d) => [d.id, d]));

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* Map a known department label to one of our ids, or "" if unrecognised. */
  function normalizeDept(name) {
    const t = String(name || "").toLowerCase().trim();
    if (!t) return "";
    if (/(engineer|develop|software|\.net|qa|devops)/.test(t)) return "engineering";
    if (/(business analysis|\banalyst\b|\bba\b)/.test(t)) return "business-analysis";
    if (/(sales|business development)/.test(t)) return "sales";
    if (/(human resource|\bhr\b|people|talent|recruit)/.test(t)) return "hr";
    if (/design/.test(t)) return "design";
    if (/market/.test(t)) return "marketing";
    if (/(operation|delivery|admin)/.test(t)) return "operations";
    return DEPT_BY_ID[t] ? t : "";
  }

  /* Resolve a department id for a job: explicit field first, then title. */
  function deptIdFor(job) {
    const explicit = normalizeDept(job.department);
    if (explicit) return explicit;
    const t = String(job.title || job.post || "").toLowerCase();
    if (/(business analyst|business analysis|\banalyst\b)/.test(t)) return "business-analysis";
    if (/(business development|\bsales\b|account (executive|manager)|\bbdm\b)/.test(t)) return "sales";
    if (/(\bhr\b|human resource|recruit|talent)/.test(t)) return "hr";
    if (/(develop|engineer|angular|react|full[ -]?stack|node|java|python|\.net|software|programmer|architect|\bqa\b|tester|devops)/.test(t)) return "engineering";
    if (/(design|\bux\b|\bui\b)/.test(t)) return "design";
    if (/market/.test(t)) return "marketing";
    return "other";
  }

  function metaRows(job) {
    const rows = [];
    const code = job.job_code || job.jobid || "";
    if (code) {
      rows.push(`<div><dt>Job Code</dt><dd><span class="careers-job-code">${escapeHtml(code)}</span></dd></div>`);
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
    if (job.employment_type && job.employment_type !== "full-time") {
      const label = String(job.employment_type)
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      rows.push(`<div><dt>Type</dt><dd>${escapeHtml(label)}</dd></div>`);
    }
    return rows.join("");
  }

  function cardHtml(job, deptId) {
    const code = job.job_code || job.jobid || "";
    const href =
      job.details_url ||
      (code ? `Careerdetails.html?id=${encodeURIComponent(code)}` : "Careerdetails.html");
    const title = job.title || job.post || "Open role";
    return `<article class="careers-job" data-department="${escapeHtml(deptId)}">
      <h4 class="careers-job-title">${escapeHtml(title)}</h4>
      <dl class="careers-job-meta">${metaRows(job)}</dl>
      <a class="careers-job-apply" href="${escapeHtml(href)}">Apply</a>
    </article>`;
  }

  function countLabel(n) {
    return `${n} open ${n === 1 ? "role" : "roles"}`;
  }

  function sectionHtml(dept, jobs) {
    const cards = jobs.map((job) => cardHtml(job, dept.id)).join("");
    return `<section class="careers-dept" data-department="${dept.id}" id="department-${dept.id}">
      <h3 class="careers-dept-heading">
        <button class="careers-dept-toggle" type="button" aria-expanded="false" aria-controls="dept-panel-${dept.id}" id="dept-toggle-${dept.id}">
          <span class="careers-dept-icon" aria-hidden="true">${dept.icon}</span>
          <span class="careers-dept-head-text">
            <span class="careers-dept-name">${escapeHtml(dept.name)}</span>
            <span class="careers-dept-blurb">${escapeHtml(dept.blurb)}</span>
          </span>
          <span class="careers-dept-count">${countLabel(jobs.length)}</span>
          <svg class="careers-dept-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
      </h3>
      <div class="careers-dept-panel" id="dept-panel-${dept.id}" role="region" aria-labelledby="dept-toggle-${dept.id}">
        <div class="careers-dept-panel-inner" inert>
          <div class="careers-dept-grid">${cards}</div>
        </div>
      </div>
    </section>`;
  }

  function setTotals(total, deptCount) {
    const el = document.querySelector("[data-careers-total]");
    if (!el) return;
    if (!total) {
      el.textContent = "";
      return;
    }
    el.textContent = `${countLabel(total)} across ${deptCount} department${deptCount === 1 ? "" : "s"}`;
  }

  function renderFromApi(careers) {
    const groups = new Map();
    careers.forEach((job) => {
      const id = deptIdFor(job);
      if (!groups.has(id)) groups.set(id, []);
      groups.get(id).push(job);
    });

    const ordered = DEPARTMENTS.filter((d) => groups.get(d.id) && groups.get(d.id).length);
    if (!ordered.length) {
      container.innerHTML =
        '<p class="careers-jobs-empty" style="color:inherit;opacity:.75;margin:0">No open positions right now. Check back soon or write to <a href="mailto:hrd@nohitatu.com">hrd@nohitatu.com</a>.</p>';
      setTotals(0, 0);
      return;
    }

    container.innerHTML = ordered.map((d) => sectionHtml(d, groups.get(d.id))).join("");
    setTotals(careers.length, ordered.length);
    openFromHash(false);
  }

  /* ---- Interaction (event delegation; bound once on the stable container) ---- */
  function setOpen(section, open) {
    if (!section) return;
    section.classList.toggle("is-open", open);
    const btn = section.querySelector(".careers-dept-toggle");
    const inner = section.querySelector(".careers-dept-panel-inner");
    if (btn) btn.setAttribute("aria-expanded", String(open));
    if (inner) inner.inert = !open;
  }

  container.addEventListener("click", (event) => {
    const btn = event.target.closest(".careers-dept-toggle");
    if (!btn || !container.contains(btn)) return;
    const section = btn.closest(".careers-dept");
    setOpen(section, !section.classList.contains("is-open"));
  });

  function openFromHash(scroll) {
    const match = /^#department-([a-z0-9-]+)$/i.exec(window.location.hash || "");
    if (!match) return;
    const section = container.querySelector(`#department-${CSS.escape(match[1])}`);
    if (!section) return;
    setOpen(section, true);
    if (scroll) {
      section.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
      const btn = section.querySelector(".careers-dept-toggle");
      if (btn) btn.focus({ preventScroll: true });
    }
  }

  /* Recompute counts + totals from whatever cards are currently in the DOM
     (keeps the static fallback accurate without hardcoding). */
  function refreshCountsFromDom() {
    const sections = container.querySelectorAll(".careers-dept");
    let total = 0;
    let openDepts = 0;
    sections.forEach((section) => {
      const n = section.querySelectorAll(".careers-job").length;
      total += n;
      if (n) openDepts += 1;
      const countEl = section.querySelector(".careers-dept-count");
      if (countEl) countEl.textContent = countLabel(n);
    });
    setTotals(total, openDepts);
  }

  async function loadFromApi() {
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

  /* Wire the static accordion immediately so it works before/without the API. */
  refreshCountsFromDom();
  openFromHash(true);
  window.addEventListener("hashchange", () => openFromHash(true));

  loadFromApi().catch(() => {
    /* static accordion remains */
  });
})();
