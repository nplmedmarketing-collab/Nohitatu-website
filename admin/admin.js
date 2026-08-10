(() => {
  const VERTICAL_LABELS = {
    retail: "Retail",
    "supply-chain": "Supply chain",
    "sports-management": "Sports management",
    "health-care": "Health care",
    "facility-management": "Facility management",
    "human-resource-management": "Human Resource Management",
    "project-management": "Project Management",
  };

  const TYPE_LABELS = {
    "full-time": "Full-time",
    "part-time": "Part-time",
    contract: "Contract",
    remote: "Remote",
    internship: "Internship",
  };

  const els = {
    loginView: document.getElementById("view-login"),
    appView: document.getElementById("view-app"),
    topActions: document.getElementById("top-actions"),
    userLabel: document.getElementById("user-label"),
    loginForm: document.getElementById("form-login"),
    loginError: document.getElementById("login-error"),
    logoutBtn: document.getElementById("btn-logout"),
    rows: document.getElementById("project-rows"),
    storeMeta: document.getElementById("store-meta"),
    newBtn: document.getElementById("btn-new"),
    editor: document.getElementById("editor"),
    editorForm: document.getElementById("form-editor"),
    editorTitle: document.getElementById("editor-title"),
    editorError: document.getElementById("editor-error"),
    cancelBtn: document.getElementById("btn-cancel"),
    vertical: document.getElementById("field-vertical"),
    panelProjects: document.getElementById("panel-projects"),
    panelCareers: document.getElementById("panel-careers"),
    careerRows: document.getElementById("career-rows"),
    careersMeta: document.getElementById("careers-meta"),
    newCareerBtn: document.getElementById("btn-new-career"),
    careerEditor: document.getElementById("career-editor"),
    careerForm: document.getElementById("form-career-editor"),
    careerEditorTitle: document.getElementById("career-editor-title"),
    careerEditorError: document.getElementById("career-editor-error"),
    careerCancelBtn: document.getElementById("btn-career-cancel"),
  };

  let csrfToken = "";
  let verticals = Object.keys(VERTICAL_LABELS);
  let activeTab = "projects";
  let careersCache = [];

  const LOGIN_PATH = "/adminlogin";
  const APP_PATH = "/admin";

  function currentPath() {
    const p = window.location.pathname || "/";
    return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
  }

  function isLoginRoute() {
    return currentPath() === LOGIN_PATH;
  }

  function goTo(path) {
    if (currentPath() === path) return;
    window.location.replace(path);
  }

  async function api(path, options = {}) {
    const opts = {
      credentials: "same-origin",
      headers: { ...(options.headers || {}) },
      ...options,
    };
    if (opts.body && !(opts.body instanceof FormData)) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(opts.body);
    }
    if (opts.method && opts.method !== "GET" && opts.method !== "HEAD") {
      opts.headers["X-CSRF-Token"] = csrfToken;
    }
    const res = await fetch(path, opts);
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { error: text || "Invalid response" };
    }
    if (!res.ok) {
      const err = new Error((data && data.error) || res.statusText || "Request failed");
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  async function refreshCsrf() {
    const data = await api("/api/admin/csrf");
    csrfToken = data.csrfToken;
  }

  function showError(el, msg) {
    if (!el) return;
    if (!msg) {
      el.hidden = true;
      el.textContent = "";
      return;
    }
    el.hidden = false;
    el.textContent = msg;
  }

  function fillVerticals() {
    els.vertical.innerHTML = verticals
      .map((v) => `<option value="${v}">${VERTICAL_LABELS[v] || v}</option>`)
      .join("");
  }

  function setAuthed(user) {
    const on = Boolean(user);
    els.loginView.hidden = on;
    els.appView.hidden = !on;
    els.topActions.hidden = !on;
    els.userLabel.textContent = on ? user : "";
  }

  function setTab(tab) {
    activeTab = tab === "careers" ? "careers" : "projects";
    document.querySelectorAll(".admin-tab").forEach((btn) => {
      const isActive = btn.getAttribute("data-tab") === activeTab;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-selected", String(isActive));
    });
    if (els.panelProjects) els.panelProjects.hidden = activeTab !== "projects";
    if (els.panelCareers) els.panelCareers.hidden = activeTab !== "careers";
  }

  function openEditor(project) {
    showError(els.editorError, "");
    els.editorForm.reset();
    const isEdit = Boolean(project && project.id);
    els.editorTitle.textContent = isEdit ? "Edit project" : "Add project";
    document.getElementById("field-id").value = isEdit ? project.id : "";
    document.getElementById("field-title").value = isEdit ? project.title : "";
    document.getElementById("field-vertical").value = isEdit ? project.vertical : "retail";
    document.getElementById("field-platform").value = isEdit ? project.platform || "web" : "web";
    document.getElementById("field-client").value = isEdit ? project.client || "" : "";
    document.getElementById("field-order").value = isEdit ? project.order ?? "" : "";
    document.getElementById("field-frame").value = isEdit ? project.frame_id || "" : "";
    document.getElementById("field-desc").value = isEdit ? project.description || "" : "";
    document.getElementById("field-image").value = isEdit ? project.image || "" : "";
    document.getElementById("field-thumb").value = isEdit ? project.thumb || "" : "";
    document.getElementById("field-alt").value = isEdit ? project.alt || "" : "";
    document.getElementById("field-cta").value = isEdit ? project.cta || "Contact-us.html" : "Contact-us.html";
    document.getElementById("field-image-file").value = "";
    document.getElementById("field-thumb-file").value = "";
    if (typeof els.editor.showModal === "function") els.editor.showModal();
    else els.editor.setAttribute("open", "");
  }

  function closeEditor() {
    if (typeof els.editor.close === "function") els.editor.close();
    else els.editor.removeAttribute("open");
  }

  function openCareerEditor(career) {
    showError(els.careerEditorError, "");
    els.careerForm.reset();
    const isEdit = Boolean(career && career.id);
    els.careerEditorTitle.textContent = isEdit ? "Edit position" : "Add position";
    document.getElementById("cf-id").value = isEdit ? career.id : "";
    document.getElementById("cf-title").value = isEdit ? career.title || "" : "";
    document.getElementById("cf-job-code").value = isEdit ? career.job_code || "" : "";
    document.getElementById("cf-sort").value = isEdit ? career.sort_order ?? "" : "";
    document.getElementById("cf-department").value = isEdit ? career.department || "" : "";
    document.getElementById("cf-location").value = isEdit ? career.location || "Chennai" : "Chennai";
    document.getElementById("cf-experience").value = isEdit ? career.experience || "" : "";
    document.getElementById("cf-type").value = isEdit ? career.employment_type || "full-time" : "full-time";
    document.getElementById("cf-status").value = isEdit ? career.status || "open" : "open";
    document.getElementById("cf-shift").value = isEdit ? career.shift_timings || "" : "";
    document.getElementById("cf-validation").value = isEdit ? career.validation_type || "J" : "J";
    document.getElementById("cf-description").value = isEdit ? career.description || "" : "";
    document.getElementById("cf-responsibilities").value = isEdit ? career.responsibilities || "" : "";
    document.getElementById("cf-requirements").value = isEdit ? career.requirements || "" : "";
    document.getElementById("cf-apply").value = isEdit ? career.apply_url || "" : "";
    document.getElementById("cf-expire").value = isEdit ? career.expire_date || "" : "";
    if (typeof els.careerEditor.showModal === "function") els.careerEditor.showModal();
    else els.careerEditor.setAttribute("open", "");
  }

  function closeCareerEditor() {
    if (typeof els.careerEditor.close === "function") els.careerEditor.close();
    else els.careerEditor.removeAttribute("open");
  }

  function renderRows(projects) {
    if (!projects.length) {
      els.rows.innerHTML = `<tr><td colspan="7" class="muted">No projects yet.</td></tr>`;
      return;
    }
    els.rows.innerHTML = projects
      .map((p) => {
        const v = VERTICAL_LABELS[p.vertical] || p.vertical;
        return `<tr data-id="${p.id}">
          <td>${p.order ?? ""}</td>
          <td>${escapeHtml(p.frame_id || "")}</td>
          <td>${escapeHtml(p.title || "")}</td>
          <td><span class="v-pill">${escapeHtml(v)}</span></td>
          <td>${escapeHtml(p.platform_long || p.platform || "")}</td>
          <td>${escapeHtml(p.client || "—")}</td>
          <td>
            <div class="row-actions">
              <button type="button" class="btn small ghost" data-edit="${p.id}">Edit</button>
              <button type="button" class="btn small danger" data-del="${p.id}">Delete</button>
            </div>
          </td>
        </tr>`;
      })
      .join("");
  }

  function renderCareerRows(careers) {
    careersCache = careers || [];
    if (!careersCache.length) {
      els.careerRows.innerHTML = `<tr><td colspan="7" class="muted">No positions yet.</td></tr>`;
      return;
    }
    els.careerRows.innerHTML = careersCache
      .map((c) => {
        const statusClass = c.status === "open" ? "status-open" : "status-closed";
        return `<tr data-career-id="${c.id}">
          <td>${c.sort_order ?? ""}</td>
          <td>${escapeHtml(c.job_code || "")}</td>
          <td>${escapeHtml(c.title || "")}</td>
          <td>${escapeHtml(c.location || "—")}</td>
          <td>${escapeHtml(TYPE_LABELS[c.employment_type] || c.employment_type || "")}</td>
          <td><span class="status-pill ${statusClass}">${escapeHtml(c.status || "")}</span></td>
          <td>
            <div class="row-actions">
              <button type="button" class="btn small ghost" data-career-edit="${c.id}">Edit</button>
              <button type="button" class="btn small danger" data-career-del="${c.id}">Delete</button>
            </div>
          </td>
        </tr>`;
      })
      .join("");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function loadProjects() {
    const data = await api("/api/admin/projects");
    if (data.verticals && data.verticals.length) {
      verticals = data.verticals;
      fillVerticals();
    }
    els.storeMeta.textContent = `${data.projects.length} projects · store: ${data.store || "—"}`;
    renderRows(data.projects);
  }

  async function loadCareers() {
    const data = await api("/api/admin/careers");
    const openCount = (data.careers || []).filter((c) => c.status === "open").length;
    els.careersMeta.textContent = `${data.careers.length} positions (${openCount} open) · store: ${data.store || "—"}`;
    renderCareerRows(data.careers || []);
  }

  async function loadActivePanel() {
    if (activeTab === "careers") await loadCareers();
    else await loadProjects();
  }

  async function bootstrap() {
    await refreshCsrf();
    fillVerticals();
    try {
      const me = await api("/api/admin/me");
      // Logged-in users bookmarking /adminlogin go straight to the dashboard.
      if (isLoginRoute()) {
        goTo(APP_PATH);
        return;
      }
      setAuthed(me.username || "admin");
      setTab("projects");
      await loadProjects();
      await loadCareers();
    } catch {
      // Unauthenticated: login page only; /admin (and other shells) → /adminlogin.
      if (!isLoginRoute()) {
        goTo(LOGIN_PATH);
        return;
      }
      setAuthed(null);
    }
  }

  document.querySelectorAll(".admin-tab").forEach((btn) => {
    btn.addEventListener("click", async () => {
      setTab(btn.getAttribute("data-tab"));
      try {
        await loadActivePanel();
      } catch (err) {
        window.alert(err.message || "Failed to load");
      }
    });
  });

  els.loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showError(els.loginError, "");
    const fd = new FormData(els.loginForm);
    try {
      await refreshCsrf();
      await api("/api/admin/login", {
        method: "POST",
        body: {
          username: String(fd.get("username") || "").trim(),
          password: String(fd.get("password") || ""),
        },
      });
      els.loginForm.reset();
      goTo(APP_PATH);
    } catch (err) {
      showError(els.loginError, err.message || "Login failed");
    }
  });

  els.logoutBtn.addEventListener("click", async () => {
    try {
      await api("/api/admin/logout", { method: "POST", body: {} });
    } catch {
      /* session may already be gone */
    }
    goTo(LOGIN_PATH);
  });

  els.newBtn.addEventListener("click", () => openEditor(null));
  els.cancelBtn.addEventListener("click", () => closeEditor());
  els.newCareerBtn.addEventListener("click", () => openCareerEditor(null));
  els.careerCancelBtn.addEventListener("click", () => closeCareerEditor());

  els.rows.addEventListener("click", async (e) => {
    const editId = e.target.getAttribute("data-edit");
    const delId = e.target.getAttribute("data-del");
    if (editId) {
      const data = await api("/api/admin/projects");
      const project = data.projects.find((p) => String(p.id) === String(editId));
      if (project) openEditor(project);
      return;
    }
    if (delId) {
      const row = e.target.closest("tr");
      const title = row ? row.children[2].textContent : delId;
      if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return;
      try {
        await api(`/api/admin/projects/${delId}`, { method: "DELETE" });
        await loadProjects();
      } catch (err) {
        window.alert(err.message || "Delete failed");
      }
    }
  });

  els.careerRows.addEventListener("click", async (e) => {
    const editId = e.target.getAttribute("data-career-edit");
    const delId = e.target.getAttribute("data-career-del");
    if (editId) {
      let career = careersCache.find((c) => String(c.id) === String(editId));
      if (!career) {
        const data = await api(`/api/admin/careers/${editId}`);
        career = data.career;
      }
      if (career) openCareerEditor(career);
      return;
    }
    if (delId) {
      const row = e.target.closest("tr");
      const title = row ? row.children[2].textContent : delId;
      if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return;
      try {
        await api(`/api/admin/careers/${delId}`, { method: "DELETE" });
        await loadCareers();
      } catch (err) {
        window.alert(err.message || "Delete failed");
      }
    }
  });

  els.editorForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showError(els.editorError, "");
    const id = document.getElementById("field-id").value;
    const fd = new FormData();
    fd.set("title", document.getElementById("field-title").value.trim());
    fd.set("vertical", document.getElementById("field-vertical").value);
    fd.set("platform", document.getElementById("field-platform").value);
    fd.set("client", document.getElementById("field-client").value.trim());
    fd.set("description", document.getElementById("field-desc").value.trim());
    fd.set("image", document.getElementById("field-image").value.trim());
    fd.set("thumb", document.getElementById("field-thumb").value.trim());
    fd.set("alt", document.getElementById("field-alt").value.trim());
    fd.set("cta", document.getElementById("field-cta").value.trim() || "Contact-us.html");
    const order = document.getElementById("field-order").value;
    if (order !== "") fd.set("order", order);
    const frame = document.getElementById("field-frame").value.trim();
    if (frame) fd.set("frame_id", frame);
    const imgFile = document.getElementById("field-image-file").files[0];
    const thumbFile = document.getElementById("field-thumb-file").files[0];
    if (imgFile) fd.set("imageFile", imgFile);
    if (thumbFile) fd.set("thumbFile", thumbFile);

    try {
      if (id) {
        await api(`/api/admin/projects/${id}`, { method: "PUT", body: fd });
      } else {
        await api("/api/admin/projects", { method: "POST", body: fd });
      }
      closeEditor();
      await loadProjects();
    } catch (err) {
      showError(els.editorError, err.message || "Save failed");
    }
  });

  els.careerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showError(els.careerEditorError, "");
    const id = document.getElementById("cf-id").value;
    const body = {
      title: document.getElementById("cf-title").value.trim(),
      job_code: document.getElementById("cf-job-code").value.trim(),
      department: document.getElementById("cf-department").value.trim(),
      location: document.getElementById("cf-location").value.trim(),
      experience: document.getElementById("cf-experience").value.trim(),
      employment_type: document.getElementById("cf-type").value,
      status: document.getElementById("cf-status").value,
      shift_timings: document.getElementById("cf-shift").value.trim(),
      validation_type: document.getElementById("cf-validation").value,
      description: document.getElementById("cf-description").value.trim(),
      responsibilities: document.getElementById("cf-responsibilities").value,
      requirements: document.getElementById("cf-requirements").value,
      apply_url: document.getElementById("cf-apply").value.trim(),
      expire_date: document.getElementById("cf-expire").value.trim(),
    };
    const sort = document.getElementById("cf-sort").value;
    if (sort !== "") body.sort_order = Number(sort);
    if (!body.apply_url && body.job_code) {
      body.apply_url = `PostResume.html?id=${body.job_code}`;
    }

    try {
      if (id) {
        await api(`/api/admin/careers/${id}`, { method: "PATCH", body });
      } else {
        await api("/api/admin/careers", { method: "POST", body });
      }
      closeCareerEditor();
      await loadCareers();
    } catch (err) {
      showError(els.careerEditorError, err.message || "Save failed");
    }
  });

  bootstrap().catch((err) => {
    showError(els.loginError, err.message || "Could not reach admin API. Is the server running?");
  });
})();
