/* Portfolio atlas: stage + vertical-filterable browse rail.
   Prefers live data from GET /api/projects; falls back to static HTML rail. */
(() => {
  const root = document.getElementById("atlas");
  if (!root) return;

  const track = root.querySelector("[data-atlas-track]");
  const filters = [...root.querySelectorAll(".atlas__filters button")];
  const frame = root.querySelector("[data-atlas-frame]");
  const frameImg = root.querySelector("[data-atlas-img]");
  const chromeLabel = root.querySelector("[data-atlas-chrome]");
  const tally = root.querySelector("[data-atlas-tally]");
  const posEl = root.querySelector("[data-atlas-pos]");
  const ofEl = root.querySelector("[data-atlas-of]");
  const progress = root.querySelector("[data-atlas-progress]");
  const prevBtn = root.querySelector("[data-atlas-prev]");
  const nextBtn = root.querySelector("[data-atlas-next]");
  const spec = root.querySelector("[data-atlas-spec]");
  const stage = root.querySelector("[data-atlas-stage], .atlas__stage");
  const emptyEl = root.querySelector("[data-atlas-empty]");
  const railWrap = root.querySelector(".atlas__rail-wrap");
  const out = {
    id: root.querySelector("[data-atlas-id]"),
    code: root.querySelector("[data-atlas-code]"),
    title: root.querySelector("[data-atlas-title]"),
    client: root.querySelector("[data-atlas-client]"),
    tags: root.querySelector("[data-atlas-tags]"),
    desc: root.querySelector("[data-atlas-desc]"),
    cta: root.querySelector("[data-atlas-cta]"),
  };

  const viewer = root.querySelector(".atlas__viewer");
  const DEFAULT_FILTER = "health-care";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pad2 = (n) => String(n).padStart(2, "0");
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  let items = [...root.querySelectorAll(".atlas-item")];
  let shown = [];
  let active = -1;
  let swapping = false;
  let activeFilter = DEFAULT_FILTER;
  let warmed = false;

  function escapeAttr(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function escapeText(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function renderProjects(projects) {
    if (!Array.isArray(projects) || !projects.length) return false;
    const html = projects
      .map((p) => {
        const platform = p.platform || "web";
        const vertical = p.vertical || "retail";
        const frameId = p.frame_id || "";
        const code = p.code || "";
        const long = p.platform_long || "";
        const title = p.title || "";
        const client = p.client || "";
        const cta = p.cta || "Contact-us.html";
        const desc = p.description || "";
        const src = p.image || "";
        const alt = p.alt || title;
        const thumb = p.thumb || src;
        return `<button type="button" class="atlas-item" role="option" tabindex="-1" aria-selected="false"
          data-platform="${escapeAttr(platform)}" data-vertical="${escapeAttr(vertical)}" data-id="${escapeAttr(frameId)}" data-code="${escapeAttr(code)}" data-long="${escapeAttr(long)}"
          data-title="${escapeAttr(title)}" data-client="${escapeAttr(client)}" data-cta="${escapeAttr(cta)}"
          data-desc="${escapeAttr(desc)}" data-src="${escapeAttr(src)}" data-alt="${escapeAttr(alt)}"
          aria-label="${escapeAttr(title)} — ${escapeAttr(long)}">
          <span class="atlas-item__gate">
            <img src="${escapeAttr(thumb)}" alt="" width="320" height="200" loading="lazy" decoding="async">
            <span class="atlas-item__id">${escapeText(frameId)}</span>
          </span>
          <span class="atlas-item__caption">${escapeText(title)}</span>
        </button>`;
      })
      .join("");
    track.innerHTML = html;
    items = [...track.querySelectorAll(".atlas-item")];
    return items.length > 0;
  }

  async function loadFromApi() {
    try {
      const res = await fetch("/api/projects", { credentials: "same-origin" });
      if (!res.ok) return false;
      const data = await res.json();
      return renderProjects(data.projects || []);
    } catch {
      return false;
    }
  }

  function clientLabel(raw) {
    if (!raw) return "In-house product";
    if (/in-house/i.test(raw)) return raw;
    return `Client — ${raw}`;
  }

  function setEmpty(isEmpty) {
    root.classList.toggle("is-empty", isEmpty);
    if (emptyEl) {
      if (isEmpty) emptyEl.removeAttribute("hidden");
      else emptyEl.setAttribute("hidden", "");
    }
    if (stage) stage.hidden = isEmpty;
    if (railWrap) railWrap.hidden = isEmpty;
    if (isEmpty) {
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
      if (progress) progress.style.width = "0%";
      if (posEl) posEl.textContent = "00";
      if (ofEl) ofEl.textContent = "00";
    }
  }

  let swapTimer = null;

  function paint(i, animate) {
    const el = shown[i];
    if (!el) return;

    if (swapTimer) {
      clearTimeout(swapTimer);
      swapTimer = null;
    }

    // Synchronously update counts, text, metadata, and tags to guarantee 100% text accuracy with zero desync
    if (posEl) posEl.textContent = pad2(i + 1);
    if (ofEl) ofEl.textContent = pad2(shown.length);
    if (tally) tally.textContent = `${i + 1} / ${shown.length}`;
    if (progress) {
      const pct = shown.length <= 1 ? 100 : ((i + 1) / shown.length) * 100;
      progress.style.width = `${pct.toFixed(2)}%`;
    }
    if (prevBtn) prevBtn.disabled = i <= 0;
    if (nextBtn) nextBtn.disabled = i >= shown.length - 1;

    const platform = (el.dataset.platform || "web").toLowerCase();
    if (viewer) {
      viewer.classList.remove("device-mode--web", "device-mode--mobile", "device-mode--desktop");
      viewer.classList.add(`device-mode--${platform}`);
    }

    if (chromeLabel) {
      const icon = platform === "mobile" ? "📱 " : platform === "desktop" ? "💻 " : "🌐 ";
      chromeLabel.textContent = icon + (el.dataset.title || "");
    }
    if (out.id) out.id.textContent = el.dataset.id || "";
    if (out.code) out.code.textContent = el.dataset.long || "";
    if (out.title) out.title.textContent = el.dataset.title || "";
    if (out.client) out.client.textContent = clientLabel(el.dataset.client || "");
    if (out.tags) {
      const vertical = (el.dataset.vertical || "").trim();
      const tagMap = {
        "health-care": ["React", "Node.js", "HIPAA API", "Cloud"],
        "retail": ["Next.js", "Stripe", "PostgreSQL", "Mobile"],
        "supply-chain": ["Python", "Django", "PostgreSQL", "Realtime"],
        "sports-management": ["Flutter", "Firebase", "REST API", "Analytics"],
        "facility-management": ["React", "Express", "SQLite", "Dashboard"],
        "human-resource-management": ["Vue.js", "Node.js", "GraphQL", "Enterprise"],
        "project-management": ["TypeScript", "React", "Node.js", "WebSockets"]
      };
      const defaultTags = tagMap[vertical] || ["Full Stack", "Cloud", "REST API", "UI/UX"];
      out.tags.innerHTML = defaultTags.map(t => `<span class="tech-tag">${escapeText(t)}</span>`).join('');
    }
    if (out.desc) out.desc.textContent = el.dataset.desc || "";
    if (out.cta) {
      out.cta.href = el.dataset.cta || "Contact-us.html";
      out.cta.setAttribute("aria-label", `Request a demo of ${el.dataset.title || "this project"}`);
    }

    const updateImage = () => {
      const src = el.dataset.src;
      const alt = el.dataset.alt || el.dataset.title || "";
      if (src && frameImg.getAttribute("src") !== src) {
        frameImg.setAttribute("src", src);
        if (typeof frameImg.decode === "function") {
          frameImg.decode().catch(() => {});
        }
      }
      frameImg.setAttribute("alt", alt);
      frameImg.setAttribute("decoding", "async");
      frameImg.removeAttribute("srcset");
    };

    if (!animate || reduceMotion) {
      updateImage();
      if (spec) spec.classList.remove("is-swapping");
      if (frame) frame.classList.remove("is-swapping");
      swapping = false;
      return;
    }

    swapping = true;
    if (frame) frame.classList.add("is-swapping");
    if (spec) spec.classList.add("is-swapping");

    swapTimer = window.setTimeout(() => {
      updateImage();
      if (frame) frame.classList.remove("is-swapping");
      if (spec) spec.classList.remove("is-swapping");
      swapping = false;
      swapTimer = null;
    }, 180);
  }

  function scrollThumbIntoView(i) {
    const el = shown[i];
    if (!el || !track) return;
    const trackBox = track.getBoundingClientRect();
    const itemBox = el.getBoundingClientRect();
    const pad = 24;
    if (itemBox.left < trackBox.left + pad) {
      track.scrollBy({ left: itemBox.left - trackBox.left - pad, behavior: reduceMotion ? "auto" : "smooth" });
    } else if (itemBox.right > trackBox.right - pad) {
      track.scrollBy({ left: itemBox.right - trackBox.right + pad, behavior: reduceMotion ? "auto" : "smooth" });
    }
  }

  function select(i, opts) {
    if (!shown.length) return;
    i = clamp(i, 0, shown.length - 1);
    const options = opts || {};
    const changed = i !== active;

    if (changed) {
      const prev = shown[active];
      if (prev) {
        prev.classList.remove("is-active");
        prev.setAttribute("aria-selected", "false");
        prev.tabIndex = -1;
      }
      active = i;
      const cur = shown[i];
      cur.classList.add("is-active");
      cur.setAttribute("aria-selected", "true");
      cur.tabIndex = 0;
      paint(i, options.animate !== false);
    } else if (options.forcePaint) {
      paint(i, false);
    }

    if (options.scroll !== false) scrollThumbIntoView(i);
    if (options.focus) shown[i].focus({ preventScroll: true });
  }

  function updateFilterCounts() {
    const total = items.length;
    const kickerEl = document.querySelector("[data-atlas-total-kicker]");
    if (kickerEl) kickerEl.textContent = `${total} products shipped`;

    const totalCountEls = document.querySelectorAll("[data-atlas-total-count]");
    totalCountEls.forEach((el) => {
      el.textContent = String(total);
    });

    filters.forEach((btn) => {
      const filterKey = btn.dataset.filter;
      if (!filterKey) return;
      const count = items.filter((el) => (el.dataset.vertical || "").trim() === filterKey).length;
      let badge = btn.querySelector(".filter-count");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "filter-count";
        btn.appendChild(badge);
      }
      badge.textContent = count;
    });
  }

  function applyFilter(key, opts) {
    const options = opts || {};
    activeFilter = key || DEFAULT_FILTER;
    items.forEach((el) => {
      const vertical = (el.dataset.vertical || "").trim();
      const match = vertical === activeFilter;
      el.classList.toggle("is-out", !match);
      el.classList.remove("is-active");
      el.setAttribute("aria-selected", "false");
      el.tabIndex = -1;
    });
    shown = items.filter((el) => !el.classList.contains("is-out"));
    active = -1;
    if (posEl) posEl.textContent = pad2(1);
    if (ofEl) ofEl.textContent = pad2(shown.length);
    if (tally) tally.textContent = `1 / ${shown.length}`;
    track.scrollTo({ left: 0, behavior: "auto" });

    if (!shown.length) {
      setEmpty(true);
      return;
    }

    setEmpty(false);
    select(0, {
      animate: options.animate !== false,
      forcePaint: true,
      scroll: false,
    });
  }

  function wireUi() {
    filters.forEach((btn) => {
      btn.addEventListener("click", () => {
        filters.forEach((b) => {
          const on = b === btn;
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-selected", String(on));
        });
        applyFilter(btn.dataset.filter || DEFAULT_FILTER, { animate: true });
      });
    });

    track.addEventListener("click", (e) => {
      const item = e.target.closest(".atlas-item");
      if (!item || item.classList.contains("is-out")) return;
      const i = shown.indexOf(item);
      if (i < 0) return;
      select(i, { animate: true, focus: true });
    });

    track.addEventListener("keydown", (e) => {
      if (!shown.length) return;
      const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (step) {
        e.preventDefault();
        select(active + step, { animate: true, focus: true });
      } else if (e.key === "Home") {
        e.preventDefault();
        select(0, { animate: true, focus: true });
      } else if (e.key === "End") {
        e.preventDefault();
        select(shown.length - 1, { animate: true, focus: true });
      }
    });

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        if (!shown.length) return;
        select(active - 1, { animate: true });
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        if (!shown.length) return;
        select(active + 1, { animate: true });
      });
    }

    // 1. Global Keyboard Arrow Navigation (ArrowLeft / ArrowRight)
    document.addEventListener("keydown", (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName : "";
      if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;
      if (e.key === "ArrowLeft") {
        if (active > 0) select(active - 1, { animate: true });
      } else if (e.key === "ArrowRight") {
        if (active < shown.length - 1) select(active + 1, { animate: true });
      }
    });

    // 2. Touch Swipe Navigation for mobile/tablet
    if (stage) {
      let touchStartX = 0;
      let touchStartY = 0;
      stage.addEventListener("touchstart", (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }, { passive: true });

      stage.addEventListener("touchend", (e) => {
        const diffX = e.changedTouches[0].clientX - touchStartX;
        const diffY = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
          if (diffX < 0 && active < shown.length - 1) select(active + 1, { animate: true });
          else if (diffX > 0 && active > 0) select(active - 1, { animate: true });
        }
      }, { passive: true });
    }

    // 3. Live Tech Stack & Keyword Search
    const searchInput = document.getElementById("atlas-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const query = (e.target.value || "").trim().toLowerCase();
        items.forEach((el) => {
          const vertical = (el.dataset.vertical || "").trim();
          const title = (el.dataset.title || "").toLowerCase();
          const desc = (el.dataset.desc || "").toLowerCase();
          const client = (el.dataset.client || "").toLowerCase();
          const matchCategory = !activeFilter || vertical === activeFilter;
          const matchQuery = !query || title.includes(query) || desc.includes(query) || client.includes(query) || vertical.includes(query);
          const match = matchCategory && matchQuery;
          el.classList.toggle("is-out", !match);
        });
        shown = items.filter((el) => !el.classList.contains("is-out"));
        active = -1;
        if (posEl) posEl.textContent = pad2(shown.length ? 1 : 0);
        if (ofEl) ofEl.textContent = pad2(shown.length);
        if (tally) tally.textContent = `${shown.length ? 1 : 0} / ${shown.length}`;
        if (!shown.length) {
          setEmpty(true);
          return;
        }
        setEmpty(false);
        select(0, { animate: false, forcePaint: true });
      });
    }

    // 4. 1-Click Interactive Demo Request Drawer Logic
    const demoDrawer = document.getElementById("demo-drawer");
    const demoBackdrop = document.getElementById("demo-drawer-backdrop");
    const closeDemoBtn = document.getElementById("btn-close-demo-drawer");
    const demoForm = document.getElementById("demo-request-form");
    const demoStatus = document.getElementById("demo-drawer-status");
    const ctaLink = root.querySelector("[data-atlas-cta]");

    function openDemoDrawer(e) {
      if (e) e.preventDefault();
      const currentProject = shown[active];
      const title = currentProject ? currentProject.dataset.title : "this project";
      const id = currentProject ? currentProject.dataset.id : "";
      const platform = currentProject ? currentProject.dataset.long : "";

      const pName = document.getElementById("demo-project-name");
      const pBadge = document.getElementById("demo-project-badge");
      if (pName) pName.textContent = title;
      if (pBadge) pBadge.textContent = `${id} · ${platform}`;

      if (demoDrawer) demoDrawer.hidden = false;
      if (demoBackdrop) demoBackdrop.hidden = false;
      document.body.classList.add("demo-drawer-open");
      const nameInput = document.getElementById("demo-user-name");
      if (nameInput) nameInput.focus();
    }

    function closeDemoDrawer() {
      if (demoDrawer) demoDrawer.hidden = true;
      if (demoBackdrop) demoBackdrop.hidden = true;
      document.body.classList.remove("demo-drawer-open");
      if (demoStatus) demoStatus.hidden = true;
    }

    if (ctaLink) {
      ctaLink.addEventListener("click", openDemoDrawer);
    }
    if (closeDemoBtn) closeDemoBtn.addEventListener("click", closeDemoDrawer);
    if (demoBackdrop) demoBackdrop.addEventListener("click", closeDemoDrawer);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && demoDrawer && !demoDrawer.hidden) {
        closeDemoDrawer();
      }
    });

    if (demoForm) {
      demoForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const projectName = document.getElementById("demo-project-name") ? document.getElementById("demo-project-name").textContent : "this project";
        const projectBadge = document.getElementById("demo-project-badge") ? document.getElementById("demo-project-badge").textContent : "";
        const name = (document.getElementById("demo-user-name").value || "").trim();
        const email = (document.getElementById("demo-user-email").value || "").trim();
        const phone = (document.getElementById("demo-user-phone").value || "").trim();
        const notes = (document.getElementById("demo-user-notes").value || "").trim();

        try {
          await fetch("/api/demo-request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ project_title: projectName, project_badge: projectBadge, name, email, phone, notes })
          });
        } catch (err) {
          console.warn("API submission fallback:", err);
        }

        if (demoStatus) {
          demoStatus.hidden = false;
          demoStatus.className = "demo-drawer__status success";
          demoStatus.innerHTML = `<strong>Request Received!</strong><p>Our engineering team will prepare a live demo of <em>${escapeText(projectName)}</em> and email you within 2 hours.</p>`;
        }
        demoForm.reset();
        window.setTimeout(closeDemoDrawer, 4500);
      });
    }

    function warm() {
      if (warmed) return;
      warmed = true;
      let k = 0;
      const next = () => {
        if (k >= items.length) return;
        const img = items[k].querySelector("img");
        k += 1;
        if (img && img.loading === "lazy") img.loading = "eager";
        window.setTimeout(next, 35);
      };
      next();
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            warm();
            root.classList.add("is-ready");
          });
        },
        { rootMargin: "20% 0px" }
      ).observe(root);
    } else {
      warm();
      root.classList.add("is-ready");
    }

    const wall = document.querySelector(".pf-hero__wall, .hero-wall");
    if (wall && "IntersectionObserver" in window) {
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            wall.classList.toggle("is-paused", !entry.isIntersecting);
          });
        },
        { threshold: 0.05 }
      ).observe(wall);
    }

    updateFilterCounts();
    const initial = filters.find((b) => b.dataset.filter === DEFAULT_FILTER) || filters[0];
    filters.forEach((b) => {
      const on = b === initial;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    applyFilter(initial ? initial.dataset.filter : DEFAULT_FILTER, { animate: false });

    window.__atlas = {
      state: () => ({
        filter: activeFilter,
        shown: shown.length,
        total: items.length,
        active,
        id: shown[active] ? shown[active].dataset.id : null,
        title: shown[active] ? shown[active].dataset.title : null,
        source: root.dataset.atlasSource || "static",
      }),
    };
  }

  async function boot() {
    const fromApi = await loadFromApi();
    root.dataset.atlasSource = fromApi ? "api" : "static";
    items = [...root.querySelectorAll(".atlas-item")];
    if (!items.length) {
      setEmpty(true);
      root.classList.add("is-ready");
      return;
    }
    wireUi();
  }

  boot();
})();

/* Reveal-on-scroll for ethos copy */
(() => {
  const nodes = [...document.querySelectorAll(".reveal")];
  if (!nodes.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    nodes.forEach((n) => n.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  nodes.forEach((n, i) => {
    n.style.transitionDelay = `${(i % 6) * 45}ms`;
    observer.observe(n);
  });
})();
