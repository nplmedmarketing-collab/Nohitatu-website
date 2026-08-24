/* Portfolio atlas: filterable list of shipped products and client projects.
   Prefers live data from GET /api/projects; falls back to the static list. */
(() => {
  const root = document.getElementById("atlas");
  if (!root) return;

  const grid = root.querySelector("[data-atlas-grid]");
  const filters = [...root.querySelectorAll(".atlas__filters button")];
  const tally = root.querySelector("[data-atlas-tally]");
  const emptyEl = root.querySelector("[data-atlas-empty]");
  const emptyTitle = root.querySelector("[data-atlas-empty-title]");
  const emptyCopy = root.querySelector("[data-atlas-empty-copy]");
  const emptyReset = root.querySelector("[data-atlas-empty-reset]");
  const segmentBtns = [...root.querySelectorAll(".atlas-tab-btn")];
  const searchInput = document.getElementById("atlas-search");
  const searchClear = root.querySelector("[data-atlas-search-clear]");
  const kickerEl = root.querySelector("[data-atlas-total-kicker]");
  const labelEl = root.querySelector("[data-atlas-segment-label]");
  const copyEl = root.querySelector("[data-atlas-segment-copy]");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EASE = "cubic-bezier(.16, 1, .3, 1)";

  const TAGS = {
    "health-care": ["React", "Node.js", "HIPAA API"],
    "retail": ["Next.js", "Stripe", "PostgreSQL"],
    "supply-chain": ["Python", "Django", "Realtime"],
    "sports-management": ["Flutter", "Firebase", "Analytics"],
    "facility-management": ["React", "Express", "Dashboard"],
    "human-resource-management": ["Vue.js", "Node.js", "Enterprise"],
    "project-management": ["TypeScript", "React", "WebSockets"],
  };

  let cards = [...root.querySelectorAll(".pf-card")];
  let shown = [];
  let activeSegment = "product";
  // Empty string is the unfiltered state: there is no "all" pill to select.
  let activeFilter = "";
  let searchQuery = "";
  let tallyShownFrom = 0;
  let revealObserver = null;
  let hasBooted = false;

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

  function clientLabel(raw) {
    if (!raw) return "In-house product";
    if (/in-house/i.test(raw)) return raw;
    return `Client — ${raw}`;
  }

  function tagsFor(vertical) {
    return TAGS[(vertical || "").trim()] || ["Full Stack", "Cloud", "UI/UX"];
  }

  // Chip labels can be abbreviated to keep the row on one line, so `data-label`
  // carries the name in full for accessible names and card metadata.
  function filterLabel(btn) {
    return (btn.dataset.label || btn.querySelector(".filter-name")?.textContent || "").trim();
  }

  // API-rendered cards need the same standing vertical label the static ones carry;
  // the filter chips are the single source of truth for how each slug reads.
  function verticalLabel(vertical) {
    const slug = (vertical || "").trim();
    const chip = filters.find((b) => b.dataset.filter === slug);
    if (chip) return filterLabel(chip);
    return slug ? slug.replace(/-/g, " ") : "Software";
  }

  /* ---------------------------------------------------------------- data */

  function cardMarkup(p) {
    const category = (p.category || "product").toLowerCase();
    const vertical = p.vertical || "retail";
    const id = p.frame_id || "";
    const code = p.code || "";
    const long = p.platform_long || "";
    const title = p.title || "";
    const image = p.image || "";
    const tags = tagsFor(vertical)
      .map((t) => `<span class="tech-tag">${escapeText(t)}</span>`)
      .join("");

    return `<article class="pf-card" data-category="${escapeAttr(category)}" data-platform="${escapeAttr(p.platform || "web")}"
        data-vertical="${escapeAttr(vertical)}" data-id="${escapeAttr(id)}" data-code="${escapeAttr(code)}" data-long="${escapeAttr(long)}"
        data-title="${escapeAttr(title)}" data-client="${escapeAttr(p.client || "")}" data-cta="${escapeAttr(p.cta || "Contact-us.html")}"
        data-desc="${escapeAttr(p.description || "")}" data-src="${escapeAttr(image)}" data-alt="${escapeAttr(p.alt || title)}">
        <div class="pf-card__media">
          <img src="${escapeAttr(p.thumb || image)}" alt="" width="600" height="375" loading="lazy" decoding="async">
          <span class="pf-card__code">${escapeText(id)} · ${escapeText(code)}</span>
        </div>
        <div class="pf-card__body">
          <p class="pf-card__vertical">${escapeText(verticalLabel(vertical))}</p>
          <h3 class="pf-card__title">${escapeText(title)}</h3>
          <p class="pf-card__client">${escapeText(clientLabel(p.client || ""))}</p>
          <p class="pf-card__desc">${escapeText(p.description || "")}</p>
          <div class="pf-card__foot">
            <div class="pf-card__tags">${tags}</div>
            <span class="pf-card__cta" aria-hidden="true">Quick view<span class="pf-card__arrow">&#8594;</span></span>
          </div>
        </div>
        <button type="button" class="pf-card__hit" aria-label="Quick view ${escapeAttr(title)} — ${escapeAttr(long)}"></button>
      </article>`;
  }

  function renderProjects(projects) {
    if (!grid || !Array.isArray(projects) || !projects.length) return false;
    grid.innerHTML = projects.map(cardMarkup).join("");
    cards = [...grid.querySelectorAll(".pf-card")];
    return cards.length > 0;
  }

  async function loadFromApi() {
    try {
      const url =
        typeof window.NH_apiUrl === "function" ? window.NH_apiUrl("/api/projects") : "/api/projects";
      const res = await fetch(url, { credentials: "omit", cache: "no-store" });
      if (!res.ok) return false;
      const data = await res.json();
      return renderProjects(data.projects || []);
    } catch {
      return false;
    }
  }

  /* ----------------------------------------------------------- animation */

  function armReveal() {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      cards.forEach((card) => card.classList.add("is-in"));
      return;
    }
    grid.classList.add("pf-grid--anim");
    revealObserver = new IntersectionObserver(
      (entries, obs) => {
        let i = 0;
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.style.setProperty("--pf-delay", `${Math.min(i, 8) * 55}ms`);
          entry.target.classList.add("is-in");
          i += 1;
          obs.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    cards.forEach((card) => revealObserver.observe(card));
  }

  // A card that never crossed the viewport is still parked at opacity 0. Once the
  // user starts filtering, promote every match immediately — otherwise switching
  // segments leaves the rows below the fold blank until they are scrolled to.
  function forceReveal(list) {
    list.forEach((card) => {
      if (card.classList.contains("is-in")) return;
      card.style.setProperty("--pf-delay", "0ms");
      card.classList.add("is-in");
      if (revealObserver) revealObserver.unobserve(card);
    });
  }

  // Cards already revealed replay their entrance so a filter change reads as a
  // reshuffle instead of a jump cut. WAAPI keeps it off the layout path.
  function replayEntrance(list) {
    if (reduceMotion || typeof Element.prototype.animate !== "function") return;
    list.forEach((card, i) => {
      if (!card.classList.contains("is-in")) return;
      card.animate(
        [
          { opacity: 0, transform: "translateY(12px) scale(.985)" },
          { opacity: 1, transform: "none" },
        ],
        { duration: 460, delay: Math.min(i, 9) * 42, easing: EASE, fill: "backwards" }
      );
    });
  }

  function animateTally(from, to, total) {
    if (!tally) return;
    const paint = (n) => {
      const suffix = n === total ? "" : ` <span class="atlas__tally-total">of ${total}</span>`;
      tally.innerHTML = `<b>${n}</b>${suffix}`;
    };
    if (reduceMotion || from === to) {
      paint(to);
      return;
    }
    const start = performance.now();
    const span = 420;
    const step = (now) => {
      const t = Math.min(1, (now - start) / span);
      const eased = 1 - Math.pow(1 - t, 3);
      paint(Math.round(from + (to - from) * eased));
      if (t < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }

  /* -------------------------------------------------------------- filter */

  function setEmpty(isEmpty) {
    root.classList.toggle("is-empty", isEmpty);
    if (!emptyEl) return;
    if (isEmpty) emptyEl.removeAttribute("hidden");
    else emptyEl.setAttribute("hidden", "");
    if (!isEmpty) return;

    const noun = activeSegment === "product" ? "products" : "projects";
    if (searchQuery) {
      if (emptyTitle) emptyTitle.textContent = `No ${noun} match “${searchQuery}”`;
      if (emptyCopy) {
        emptyCopy.innerHTML =
          'Try a different keyword or a broader vertical, or <a href="Contact-us.html">tell us what you\'re building</a>.';
      }
    } else {
      if (emptyTitle) emptyTitle.textContent = "Nothing shipped here yet";
      if (emptyCopy) {
        emptyCopy.innerHTML =
          'Work for this vertical is on the roadmap. Browse another vertical, or <a href="Contact-us.html">tell us what you\'re building</a>.';
      }
    }
    if (emptyReset) emptyReset.hidden = !searchQuery && !activeFilter;
  }

  function resetFilters() {
    searchQuery = "";
    if (searchInput) searchInput.value = "";
    if (searchClear) searchClear.hidden = true;
    activeFilter = defaultFilter();
    applyFilter();
  }

  function updateFilterCounts() {
    const inSegment = cards.filter(
      (el) => (el.dataset.category || "product").toLowerCase() === activeSegment
    );

    // Hero copy quotes the catalogue size; keep it honest if the API set differs.
    document.querySelectorAll("[data-atlas-total-count]").forEach((el) => {
      el.textContent = cards.length;
    });

    root.querySelectorAll("[data-segment-count]").forEach((el) => {
      const seg = el.dataset.segmentCount;
      el.textContent = cards.filter(
        (card) => (card.dataset.category || "product").toLowerCase() === seg
      ).length;
    });

    if (kickerEl) {
      kickerEl.textContent = `${inSegment.length} ${
        activeSegment === "product" ? "products" : "projects"
      } available`;
    }

    const noun = activeSegment === "product" ? "products" : "projects";

    filters.forEach((btn) => {
      const key = btn.dataset.filter;
      if (!key) return;
      const count = inSegment.filter((el) => (el.dataset.vertical || "").trim() === key).length;
      let badge = btn.querySelector(".filter-count");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "filter-count";
        badge.setAttribute("aria-hidden", "true");
        btn.appendChild(badge);
      }
      badge.textContent = count;
      btn.classList.toggle("is-barren", count === 0);
      // The visible label may be abbreviated and the count is decorative, so the
      // accessible name is spelled out here instead.
      btn.setAttribute("aria-label", `${filterLabel(btn)} — ${count} ${noun}`);
    });

    return inSegment.length;
  }

  // The placeholder promises "search by tech", so the tag chips have to be part of
  // the index. Built once per card and cached — the markup never changes after boot.
  function searchIndex(el) {
    if (!el.dataset.searchIndex) {
      const tags = el.querySelector(".pf-card__tags");
      el.dataset.searchIndex = [
        el.dataset.title,
        el.dataset.desc,
        el.dataset.client,
        el.dataset.vertical,
        el.dataset.code,
        el.dataset.long,
        tags ? tags.textContent : "",
      ]
        .join(" ")
        .replace(/\s+/g, " ")
        .toLowerCase();
    }
    return el.dataset.searchIndex;
  }

  // The atlas opens on a vertical rather than the whole catalogue, so load and every
  // segment switch land on the leftmost chip that actually has items in that segment.
  // Zero-count verticals are skipped so nobody arrives at an empty grid; if the
  // segment has nothing to show at all, no chip is pressed and everything is listed.
  function defaultFilter() {
    const hit = filters.find((btn) => {
      const key = (btn.dataset.filter || "").trim();
      if (!key) return false;
      return cards.some(
        (el) =>
          (el.dataset.category || "product").toLowerCase() === activeSegment &&
          (el.dataset.vertical || "").trim() === key &&
          (!searchQuery || searchIndex(el).includes(searchQuery))
      );
    });
    return hit ? hit.dataset.filter.trim() : "";
  }

  /* --------------------------------------------------------- list layout */

  // List mode no longer uses bento tile sizes. Clear any leftover size classes
  // so API re-renders and older cached stamps stay visually uniform.
  const BENTO_SIZES = ["hero", "tall", "wide", "third", "band", "solo"];

  function stampBento(list) {
    list.forEach((el) => {
      BENTO_SIZES.forEach((name) => el.classList.remove(`pf-card--${name}`));
    });
  }

  // Featured item for the active segment stays first in the list.
  function promoteFeatured() {
    if (!grid) return;
    const pick = cards.find(
      (el) => el.dataset.featured === activeSegment && !el.classList.contains("is-out")
    );
    if (pick && grid.firstElementChild !== pick) grid.insertBefore(pick, grid.firstElementChild);
  }

  function applyFilter() {
    if (labelEl) labelEl.textContent = activeSegment === "product" ? "products" : "projects";
    if (copyEl) {
      copyEl.textContent = activeSegment === "product" ? "software products" : "client projects";
    }

    segmentBtns.forEach((btn) => {
      const isActive = btn.dataset.segment === activeSegment;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-selected", String(isActive));
      btn.tabIndex = isActive ? 0 : -1;
    });

    // Toggle chips, so pressed state rather than tab selection — and none pressed is
    // a legitimate state. Roving tabindex parks on the pressed chip, else the first.
    const roving = filters.find((btn) => btn.dataset.filter === activeFilter) || filters[0];
    filters.forEach((btn) => {
      const isActive = Boolean(activeFilter) && btn.dataset.filter === activeFilter;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", String(isActive));
      btn.tabIndex = btn === roving ? 0 : -1;
    });

    cards.forEach((el) => {
      const cat = (el.dataset.category || "product").toLowerCase();
      const vertical = (el.dataset.vertical || "").trim();
      const haystack = searchIndex(el);

      const match =
        cat === activeSegment &&
        (!activeFilter || vertical === activeFilter) &&
        (!searchQuery || haystack.includes(searchQuery));

      el.classList.toggle("is-out", !match);
    });

    promoteFeatured();
    shown = grid
      ? [...grid.querySelectorAll(".pf-card:not(.is-out)")]
      : cards.filter((el) => !el.classList.contains("is-out"));
    if (hasBooted) forceReveal(shown);
    const segmentTotal = updateFilterCounts();

    stampBento(shown);
    setEmpty(!shown.length);
    animateTally(tallyShownFrom, shown.length, segmentTotal);
    tallyShownFrom = shown.length;
    replayEntrance(shown);
  }

  /* --------------------------------------------------------------- modal */

  const modal = document.getElementById("project-modal");
  const modalDialog = modal ? modal.querySelector(".atlas-modal-dialog") : null;
  const modalClose = document.getElementById("modal-close");
  const modalImg = document.getElementById("modal-img");
  const modalTitle = document.getElementById("modal-title");
  const modalClient = document.getElementById("modal-client");
  const modalBadge = document.getElementById("modal-badge");
  const modalCode = document.getElementById("modal-code");
  const modalDesc = document.getElementById("modal-desc");
  const modalTags = document.getElementById("modal-tags");
  const modalCta = document.getElementById("modal-cta");

  let activeCard = null;
  let lastFocus = null;

  function openModal(card) {
    if (!card || !modal) return;
    activeCard = card;
    lastFocus = document.activeElement;

    const category = (card.dataset.category || "product").toLowerCase();
    const title = card.dataset.title || "";

    if (modalImg) {
      modalImg.src = card.dataset.src || card.querySelector("img")?.src || "";
      modalImg.alt = card.dataset.alt || title;
    }
    if (modalTitle) modalTitle.textContent = title;
    if (modalClient) modalClient.textContent = clientLabel(card.dataset.client || "");
    if (modalBadge) {
      modalBadge.textContent = category === "product" ? "Product" : "Project";
      modalBadge.className = `pf-card__badge pf-card__badge--${category}`;
    }
    if (modalCode) {
      modalCode.textContent = `${card.dataset.id || ""} · ${card.dataset.long || card.dataset.code || ""}`;
    }
    if (modalDesc) modalDesc.textContent = card.dataset.desc || "";
    if (modalTags) {
      modalTags.innerHTML = tagsFor(card.dataset.vertical)
        .map((t) => `<span class="tech-tag">${escapeText(t)}</span>`)
        .join("");
    }
    if (modalCta) modalCta.href = card.dataset.cta || "Contact-us.html";

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("pf-scroll-lock");
    // focus() is a no-op while the dialog is still visibility:hidden, so flush
    // the style change first. One reflow on a user-initiated open is cheap.
    void modal.offsetWidth;
    if (modalClose) {
      modalClose.focus({ preventScroll: true });
      // Browsers differ on whether the activating click's own focus fixup runs
      // before or after this handler, so re-assert once the dust settles.
      window.setTimeout(() => {
        if (modal.classList.contains("is-open") && !modal.contains(document.activeElement)) {
          modalClose.focus({ preventScroll: true });
        }
      }, 120);
    }
  }

  function closeModal() {
    if (!modal || !modal.classList.contains("is-open")) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("pf-scroll-lock");
    if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus({ preventScroll: true });
    }
    lastFocus = null;
  }

  function trapFocus(e) {
    if (e.key !== "Tab" || !modalDialog) return;
    const focusables = [
      ...modalDialog.querySelectorAll('button, a[href], input, [tabindex]:not([tabindex="-1"])'),
    ].filter((el) => !el.hasAttribute("disabled"));
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /* ---------------------------------------------------- demo request drawer */

  const demoDrawer = document.getElementById("demo-drawer");
  const demoBackdrop = document.getElementById("demo-drawer-backdrop");
  const demoClose = document.getElementById("btn-close-demo-drawer");
  const demoForm = document.getElementById("demo-request-form");
  const demoStatus = document.getElementById("demo-drawer-status");

  function openDrawer(e) {
    if (e) e.preventDefault();
    if (!demoDrawer) return;
    const card = activeCard;
    const name = document.getElementById("demo-project-name");
    const badge = document.getElementById("demo-project-badge");
    if (name) name.textContent = card ? card.dataset.title : "this project";
    if (badge) {
      badge.textContent = card ? `${card.dataset.id || ""} · ${card.dataset.long || ""}` : "";
    }
    demoDrawer.hidden = false;
    if (demoBackdrop) demoBackdrop.hidden = false;
    document.body.classList.add("pf-scroll-lock");
    const firstField = document.getElementById("demo-user-name");
    if (firstField) firstField.focus({ preventScroll: true });
  }

  function closeDrawer() {
    if (!demoDrawer || demoDrawer.hidden) return;
    demoDrawer.hidden = true;
    if (demoBackdrop) demoBackdrop.hidden = true;
    if (demoStatus) demoStatus.hidden = true;
    if (!modal || !modal.classList.contains("is-open")) {
      document.body.classList.remove("pf-scroll-lock");
    }
    if (modalCta) modalCta.focus({ preventScroll: true });
  }

  /* ---------------------------------------------------------------- wiring */

  // The chip row never wraps, so narrow viewports swipe it. CSS can't tell whether
  // it actually overflows, and a permanent fade would dim the last chip when the
  // whole row fits — so the hint is flagged from measurement instead.
  function armFilterScrollHint() {
    const row = root.querySelector(".atlas__filters");
    if (!row) return;
    const sync = () => row.classList.toggle("is-scrollable", row.scrollWidth - row.clientWidth > 2);
    sync();
    window.addEventListener("resize", sync, { passive: true });
    if ("ResizeObserver" in window) new ResizeObserver(sync).observe(row);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(sync).catch(() => {});
  }

  // `activate` is true for the segment tablist, where a tab is selected the moment it
  // is reached. The vertical chips are toggles, so arrowing onto one must not press
  // it — that would silently switch, or worse un-press, the filter in passing.
  function land(list, el, activate) {
    if (!activate) list.forEach((b) => (b.tabIndex = b === el ? 0 : -1));
    el.focus();
    if (activate) el.click();
  }

  function wireRovingTabs(list, activate = true) {
    list.forEach((btn) => {
      btn.addEventListener("keydown", (e) => {
        const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (step) {
          e.preventDefault();
          const i = list.indexOf(btn);
          if (i < 0) return;
          land(list, list[(i + step + list.length) % list.length], activate);
        } else if (e.key === "Home") {
          e.preventDefault();
          land(list, list[0], activate);
        } else if (e.key === "End") {
          e.preventDefault();
          land(list, list[list.length - 1], activate);
        }
      });
    });
  }

  function wireUi() {
    segmentBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!btn.dataset.segment || btn.dataset.segment === activeSegment) return;
        activeSegment = btn.dataset.segment;
        activeFilter = defaultFilter();
        applyFilter();
      });
    });
    wireRovingTabs(segmentBtns);

    // Pressing the pressed chip clears it: that is the way back to everything now
    // that there is no "all" chip to return to.
    filters.forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.filter || "";
        activeFilter = activeFilter === key ? "" : key;
        applyFilter();
      });
    });
    wireRovingTabs(filters, false);

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        searchQuery = (e.target.value || "").trim().toLowerCase();
        if (searchClear) searchClear.hidden = !searchQuery;
        applyFilter();
      });
    }

    if (emptyReset) {
      emptyReset.addEventListener("click", () => {
        resetFilters();
        if (searchInput) searchInput.focus();
      });
    }

    if (searchClear) {
      searchClear.addEventListener("click", () => {
        if (!searchInput) return;
        searchInput.value = "";
        searchQuery = "";
        searchClear.hidden = true;
        // Clearing the box should never strand them on the no-chip view; keep their
        // vertical if they picked one, otherwise fall back to the segment default.
        if (!activeFilter) activeFilter = defaultFilter();
        searchInput.focus();
        applyFilter();
      });
    }

    if (grid) {
      grid.addEventListener("click", (e) => {
        const hit = e.target.closest(".pf-card__hit");
        if (!hit) return;
        openModal(hit.closest(".pf-card"));
      });
    }

    if (modalClose) modalClose.addEventListener("click", closeModal);
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
      });
      modal.addEventListener("keydown", trapFocus);
    }
    if (modalCta) modalCta.addEventListener("click", openDrawer);
    if (demoClose) demoClose.addEventListener("click", closeDrawer);
    if (demoBackdrop) demoBackdrop.addEventListener("click", closeDrawer);

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (demoDrawer && !demoDrawer.hidden) closeDrawer();
      else closeModal();
    });

    if (demoForm) {
      demoForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const nameEl = document.getElementById("demo-project-name");
        const badgeEl = document.getElementById("demo-project-badge");
        const projectName = nameEl ? nameEl.textContent : "this project";
        const projectBadge = badgeEl ? badgeEl.textContent : "";
        const payload = {
          project_title: projectName,
          project_badge: projectBadge,
          name: (document.getElementById("demo-user-name").value || "").trim(),
          email: (document.getElementById("demo-user-email").value || "").trim(),
          phone: (document.getElementById("demo-user-phone").value || "").trim(),
          notes: (document.getElementById("demo-user-notes").value || "").trim(),
        };

        try {
          const demoUrl =
            typeof window.NH_apiUrl === "function"
              ? window.NH_apiUrl("/api/demo-request")
              : "/api/demo-request";
          await fetch(demoUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } catch (err) {
          console.warn("API submission fallback:", err);
        }

        if (demoStatus) {
          demoStatus.hidden = false;
          demoStatus.className = "demo-drawer__status success";
          demoStatus.innerHTML = `<strong>Request received.</strong><p>Our engineering team will prepare a live demo of <em>${escapeText(
            projectName
          )}</em> and email you within 2 hours.</p>`;
        }
        demoForm.reset();
        window.setTimeout(closeDrawer, 4500);
      });
    }

    window.__atlas = {
      state: () => ({
        segment: activeSegment,
        filter: activeFilter || null,
        query: searchQuery,
        shown: shown.length,
        total: cards.length,
        sizes: shown.map((el) => ({
          id: el.dataset.id,
          size: "row",
        })),
        source: root.dataset.atlasSource || "static",
      }),
    };
  }

  async function boot() {
    const fromApi = await loadFromApi();
    root.dataset.atlasSource = fromApi ? "api" : "static";
    cards = [...root.querySelectorAll(".pf-card")];
    if (!cards.length) {
      setEmpty(true);
      root.classList.add("is-ready");
      return;
    }
    armReveal();
    armFilterScrollHint();
    wireUi();
    activeFilter = defaultFilter();
    applyFilter();
    hasBooted = true;
    root.classList.add("is-ready");
  }

  boot();
})();
