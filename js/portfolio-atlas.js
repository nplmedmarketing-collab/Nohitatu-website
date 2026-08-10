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
    desc: root.querySelector("[data-atlas-desc]"),
    cta: root.querySelector("[data-atlas-cta]"),
  };

  if (!track || !frameImg) return;

  const DEFAULT_FILTER = "retail";
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

  function paint(i, animate) {
    const el = shown[i];
    if (!el) return;

    const apply = () => {
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
      if (chromeLabel) chromeLabel.textContent = el.dataset.title || "";
      if (out.id) out.id.textContent = el.dataset.id || "";
      if (out.code) out.code.textContent = el.dataset.long || "";
      if (out.title) out.title.textContent = el.dataset.title || "";
      if (out.client) out.client.textContent = clientLabel(el.dataset.client || "");
      if (out.desc) out.desc.textContent = el.dataset.desc || "";
      if (out.cta) {
        out.cta.href = el.dataset.cta || "Contact-us.html";
        out.cta.setAttribute("aria-label", `Request a demo of ${el.dataset.title || "this project"}`);
      }
      if (posEl) posEl.textContent = pad2(i + 1);
      if (ofEl) ofEl.textContent = pad2(shown.length);
      if (progress) {
        const pct = shown.length <= 1 ? 100 : ((i + 1) / shown.length) * 100;
        progress.style.width = `${pct.toFixed(2)}%`;
      }
      if (prevBtn) prevBtn.disabled = i <= 0;
      if (nextBtn) nextBtn.disabled = i >= shown.length - 1;
    };

    if (!animate || reduceMotion || swapping) {
      apply();
      if (spec) spec.classList.remove("is-swapping");
      if (frame) frame.classList.remove("is-swapping");
      return;
    }

    swapping = true;
    if (frame) frame.classList.add("is-swapping");
    if (spec) spec.classList.add("is-swapping");

    window.setTimeout(() => {
      apply();
      if (frame) frame.classList.remove("is-swapping");
      if (spec) spec.classList.remove("is-swapping");
      swapping = false;
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
    if (tally) tally.textContent = `${shown.length} / ${shown.length}`;
    if (ofEl) ofEl.textContent = pad2(shown.length);
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
