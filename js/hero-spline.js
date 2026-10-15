/**
 * Genkub greeting robot via Spline runtime (not iframe).
 * Native Look At is too subtle and fights custom poses. We disable it and
 * aim Head inside the WebGLRenderer.render path (Spline skips Application.render).
 */
(function () {
  const SCENE_URL = "assets/spline/genkub-greeting-robot.bin";
  const RUNTIME_URL =
    "https://unpkg.com/@splinetool/runtime@1.12.98/build/runtime.js";

  const YAW_RANGE = 0.95;
  const PITCH_RANGE = 0.5;
  const LERP = 0.18;

  function disableNativeLookAt(app) {
    const em = app._eventManager;
    const la = em && em.handlers && em.handlers.LookAt;
    if (!la) return;

    function freeze() {
      if (!la.events) return;
      for (let i = 0; i < la.events.length; i++) {
        const ev = la.events[i];
        ev.paused = true;
        if (ev.data) ev.data.disabled = true;
      }
    }

    freeze();
    la.onAnimationFrameDamping = function () {
      freeze();
    };
    la.updateSingleEvent = function () {};
    la.onMouseMove = function () {};
  }

  function bindHeadTracking(app) {
    const head = app.findObjectByName("Head");
    const renderer = app._renderer;
    if (!head || !head.rotation || !renderer || typeof renderer.render !== "function") {
      return;
    }

    const baseX = head.rotation.x;
    const baseY = head.rotation.y;
    let aimX = baseX;
    let aimY = baseY;
    let curX = baseX;
    let curY = baseY;
    let freezeEvery = 0;

    function onPointerMove(e) {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      const nx = e.clientX / w;
      const ny = e.clientY / h;
      aimY = baseY + (0.5 - nx) * YAW_RANGE * 2;
      aimX = baseX + (ny - 0.5) * PITCH_RANGE * 2;
    }

    function applyAim() {
      curY += (aimY - curY) * LERP;
      curX += (aimX - curX) * LERP;
      head.rotation.y = curY;
      head.rotation.x = curX;
      if (head.quaternion && typeof head.quaternion.setFromEuler === "function") {
        head.quaternion.setFromEuler(head.rotation);
      }
      head.matrixWorldNeedsUpdate = true;
    }

    const originalRender = renderer.render.bind(renderer);
    renderer.render = function () {
      if ((freezeEvery++ & 15) === 0) disableNativeLookAt(app);
      applyAim();
      return originalRender.apply(this, arguments);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    window.__nohiSplineHeadTrack = {
      getAim: function () {
        return { aimX: aimX, aimY: aimY, curX: curX, curY: curY, baseX: baseX, baseY: baseY };
      },
      stop: function () {
        window.removeEventListener("pointermove", onPointerMove);
        renderer.render = originalRender;
      },
    };
  }

  async function initHeroSpline() {
    const host = document.querySelector(".hero-spline-bg");
    if (!host) return;

    const canvas = document.createElement("canvas");
    canvas.className = "hero-spline-frame";
    canvas.setAttribute("aria-hidden", "true");
    host.replaceChildren(canvas);

    const { Application } = await import(RUNTIME_URL);
    const app = new Application(canvas);

    const res = await fetch(SCENE_URL, { cache: "force-cache" });
    if (!res.ok) {
      throw new Error("Failed to load Spline scene (" + res.status + ")");
    }
    const buffer = await res.arrayBuffer();

    const started = app.start(new Uint8Array(buffer));
    if (started && typeof started.then === "function") {
      await started;
    }

    if (typeof app.setGlobalEvents === "function") {
      app.setGlobalEvents(true);
    }

    await new Promise(function (r) {
      setTimeout(r, 500);
    });

    disableNativeLookAt(app);
    bindHeadTracking(app);
    window.__nohiSpline = app;
  }

  function boot() {
    initHeroSpline().catch(function (err) {
      console.warn("[hero-spline]", err);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
