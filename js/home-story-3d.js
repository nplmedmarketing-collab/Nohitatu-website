/* Architectural depth layer for the home story band (build → scale → automate).
   Desktop-only, lazily loaded, and driven by the curtain scrub in home-story.js. */
(function () {
  'use strict';

  var THREE_SRC = 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
  var desktopQuery = window.matchMedia('(min-width: 992px)');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Brand accents: navy structure, gold edge work. No violet glow here.
  var GOLD = 0xd8a441;
  var GOLD_WARM = 0xf3d194;
  var SLAB = 0x2f6ea8;
  var GRID = 0x7fa8d6;

  var MAX_DPR = 1.75;
  // The camera aims above the model so the structure sits low in frame,
  // clear of the centred headline copy.
  var FOCUS_Y = 1.55;
  var SLAB_COUNT = 4;
  var MODULE_COUNT = 6;
  var LINK_STEPS = 26;
  var PULSES_PER_LINK = 2;
  // Pose used when motion is reduced: built, scaled, links drawn.
  var STILL_PROGRESS = 0.82;

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function smoothstep(edge0, edge1, n) {
    var t = clamp((n - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function ease(t) {
    return t * t * (3 - 2 * t);
  }

  function supportsWebGL() {
    try {
      var probe = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (probe.getContext('webgl') || probe.getContext('experimental-webgl')));
    } catch (err) {
      return false;
    }
  }

  /* Coarse pointers and thin devices keep the plain curtain treatment. */
  function lowPowerDevice() {
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) return true;
    if (navigator.deviceMemory && navigator.deviceMemory < 4) return true;
    return window.matchMedia('(hover: none)').matches;
  }

  /**
   * Builds the scene once three.js has landed. Everything is flat-shaded and
   * additive so there are no lights to pay for.
   */
  function createScene(THREE, canvas) {
    var renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
    renderer.setClearAlpha(0);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120);
    var focus = new THREE.Vector3(0, FOCUS_Y, 0);

    function lineMaterial(color, opacity) {
      return new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
    }

    function fillMaterial(opacity) {
      return new THREE.MeshBasicMaterial({
        color: SLAB,
        transparent: true,
        opacity: opacity,
        depthWrite: false
      });
    }

    // Ground plan the whole story stands on.
    var deck = new THREE.GridHelper(26, 26, GRID, GRID);
    deck.material.transparent = true;
    deck.material.opacity = 0;
    deck.material.depthWrite = false;
    deck.position.y = -0.02;
    scene.add(deck);

    // Core: blueprint planes that fly in and stack into a product shell.
    var core = new THREE.Group();
    scene.add(core);

    var slabs = [];
    for (var i = 0; i < SLAB_COUNT; i++) {
      var plate = new THREE.BoxGeometry(2.5 - i * 0.16, 0.09, 1.75 - i * 0.11);
      var fill = new THREE.Mesh(plate, fillMaterial(0));
      var edge = new THREE.LineSegments(
        new THREE.EdgesGeometry(plate),
        lineMaterial(i === SLAB_COUNT - 1 ? GOLD_WARM : GOLD, 0)
      );
      var slab = new THREE.Group();
      slab.add(fill);
      slab.add(edge);
      slab.userData = {
        fill: fill,
        edge: edge,
        offsetX: (i % 2 ? 1 : -1) * (1.7 + i * 0.55),
        offsetZ: (i % 2 ? -1 : 1) * (1.15 + i * 0.4),
        tilt: (i % 2 ? 1 : -1) * 0.3
      };
      core.add(slab);
      slabs.push(slab);
    }

    var shellSource = new THREE.BoxGeometry(2.86, 1.44, 2.06);
    var shell = new THREE.LineSegments(new THREE.EdgesGeometry(shellSource), lineMaterial(GOLD, 0));
    shellSource.dispose();
    core.add(shell);

    // Modules that duplicate outward once the story reaches "scale".
    var modules = [];
    var links = [];
    var linkPaths = [];
    var moduleFill = new THREE.BoxGeometry(0.86, 0.08, 0.64);
    var nodeGeo = new THREE.OctahedronGeometry(0.11);

    for (var j = 0; j < MODULE_COUNT; j++) {
      var angle = (j / MODULE_COUNT) * Math.PI * 2 + 0.45;
      var radius = 3.3 + (j % 2) * 0.6;
      var base = new THREE.Vector3(
        Math.cos(angle) * radius,
        0.14 + (j % 3) * 0.13,
        Math.sin(angle) * radius * 0.58
      );

      var modFill = new THREE.Mesh(moduleFill, fillMaterial(0));
      var modEdge = new THREE.LineSegments(new THREE.EdgesGeometry(moduleFill), lineMaterial(GOLD, 0));
      var node = new THREE.Mesh(nodeGeo, new THREE.MeshBasicMaterial({
        color: GOLD_WARM,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      }));
      node.position.y = 0.26;

      var group = new THREE.Group();
      group.add(modFill);
      group.add(modEdge);
      group.add(node);
      group.scale.setScalar(0.001);
      scene.add(group);

      modules.push({ group: group, base: base, fill: modFill, edge: modEdge, node: node });

      // Arced link from the shell out to the module node.
      var path = new Float32Array((LINK_STEPS + 1) * 3);
      for (var s = 0; s <= LINK_STEPS; s++) {
        var u = s / LINK_STEPS;
        path[s * 3] = lerp(0, base.x, u);
        path[s * 3 + 1] = lerp(1.15, base.y + 0.26, u) + Math.sin(Math.PI * u) * 0.5;
        path[s * 3 + 2] = lerp(0, base.z, u);
      }
      var linkGeo = new THREE.BufferGeometry();
      linkGeo.setAttribute('position', new THREE.BufferAttribute(path, 3));
      linkGeo.setDrawRange(0, 2);
      var link = new THREE.Line(linkGeo, lineMaterial(GOLD, 0));
      scene.add(link);

      links.push(link);
      linkPaths.push(path);
    }

    // Flow pulses that travel the links during "automate".
    var pulseGeo = new THREE.OctahedronGeometry(0.075);
    var pulseMat = new THREE.MeshBasicMaterial({
      color: GOLD_WARM,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    var pulses = [];
    for (var q = 0; q < MODULE_COUNT * PULSES_PER_LINK; q++) {
      var spark = new THREE.Mesh(pulseGeo, pulseMat);
      spark.visible = false;
      scene.add(spark);
      pulses.push(spark);
    }

    var progress = 0;
    var targetProgress = 0;
    var driftX = 0;
    var driftY = 0;
    var targetDriftX = 0;
    var targetDriftY = 0;

    function apply(p, time) {
      var intro = smoothstep(0, 0.14, p);
      var buildT = smoothstep(0.02, 0.44, p);
      var scaleT = smoothstep(0.4, 0.8, p);
      var flowT = smoothstep(0.72, 0.98, p);

      deck.material.opacity = 0.15 * intro;

      var spacing = lerp(0.3, 0.43, scaleT);
      slabs.forEach(function (slab, index) {
        var data = slab.userData;
        var e = ease(clamp((buildT - index * 0.11) / 0.6, 0, 1));
        slab.position.x = data.offsetX * (1 - e);
        slab.position.z = data.offsetZ * (1 - e);
        slab.position.y = lerp(-0.75 + index * 0.05, 0.1 + index * spacing, e);
        slab.rotation.y = data.tilt * (1 - e);
        slab.rotation.z = data.tilt * 0.2 * (1 - e);
        data.fill.material.opacity = 0.17 * e;
        data.edge.material.opacity = 0.62 * e;
      });

      shell.position.y = 0.1 + spacing * 1.5;
      shell.scale.set(lerp(1, 1.12, scaleT), lerp(1, 1.06, scaleT), lerp(1, 1.12, scaleT));
      shell.material.opacity = 0.34 * smoothstep(0.3, 0.52, p);
      core.rotation.y = lerp(-0.2, 0.16, p);

      modules.forEach(function (mod, index) {
        var e = ease(clamp((scaleT - index * 0.09) / 0.55, 0, 1));
        var reach = lerp(0.45, 1, e);
        mod.group.position.set(mod.base.x * reach, mod.base.y, mod.base.z * reach);
        mod.group.scale.setScalar(0.001 + e);
        mod.fill.material.opacity = 0.15 * e;
        mod.edge.material.opacity = 0.5 * e;

        var beat = 0.5 + 0.5 * Math.sin(time * 2.1 + index * 0.9);
        mod.node.material.opacity = e * (0.3 + 0.5 * beat * (0.3 + 0.7 * flowT));
        mod.node.scale.setScalar(1 + 0.3 * beat * flowT);

        // The link only draws once its module has almost settled.
        var drawn = smoothstep(0.55, 1, e);
        links[index].geometry.setDrawRange(0, Math.max(2, Math.round(drawn * (LINK_STEPS + 1))));
        links[index].material.opacity = 0.5 * drawn;
      });

      var flowing = flowT > 0.01;
      pulseMat.opacity = 0.95 * flowT;
      for (var k = 0; k < MODULE_COUNT; k++) {
        var path = linkPaths[k];
        for (var n = 0; n < PULSES_PER_LINK; n++) {
          var pulse = pulses[k * PULSES_PER_LINK + n];
          pulse.visible = flowing;
          if (!flowing) continue;
          var u = (time * 0.26 + k * 0.17 + n / PULSES_PER_LINK) % 1;
          var at = Math.min(LINK_STEPS, Math.floor(u * LINK_STEPS)) * 3;
          pulse.position.set(path[at], path[at + 1], path[at + 2]);
        }
      }

      var azimuth = lerp(-0.3, 0.26, ease(p));
      var distance = lerp(8, 9.6, scaleT);
      camera.position.set(
        Math.sin(azimuth) * distance + driftX,
        lerp(2.5, 3.2, p) + driftY,
        Math.cos(azimuth) * distance
      );
      camera.lookAt(focus);
    }

    function resize() {
      var width = canvas.clientWidth || window.innerWidth;
      var height = canvas.clientHeight || window.innerHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    }

    var rafId = 0;
    var startedAt = 0;

    function frame() {
      rafId = window.requestAnimationFrame(frame);
      progress += (targetProgress - progress) * 0.12;
      driftX += (targetDriftX - driftX) * 0.06;
      driftY += (targetDriftY - driftY) * 0.06;
      apply(progress, (window.performance.now() - startedAt) / 1000);
      renderer.render(scene, camera);
    }

    return {
      resize: resize,

      setProgress: function (value, immediate) {
        targetProgress = clamp(value, 0, 1);
        if (immediate) progress = targetProgress;
      },

      setDrift: function (x, y) {
        targetDriftX = x;
        targetDriftY = y;
      },

      /* Single composed frame — used for reduced motion and while paused. */
      still: function (value) {
        progress = targetProgress = typeof value === 'number' ? value : targetProgress;
        driftX = driftY = 0;
        apply(progress, 0);
        renderer.render(scene, camera);
      },

      start: function () {
        if (rafId) return;
        startedAt = window.performance.now();
        rafId = window.requestAnimationFrame(frame);
      },

      stop: function () {
        if (!rafId) return;
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      },

      dispose: function () {
        this.stop();
        scene.traverse(function (object) {
          if (object.geometry) object.geometry.dispose();
          if (!object.material) return;
          var list = Array.isArray(object.material) ? object.material : [object.material];
          list.forEach(function (material) { material.dispose(); });
        });
        renderer.dispose();
      }
    };
  }

  function init() {
    if (!document.body.classList.contains('landing-page')) return;

    var band = document.querySelector('.nh-story-band');
    if (!band) return;
    var layer = band.querySelector('[data-story-3d]');
    if (!layer) return;
    if (!('IntersectionObserver' in window) || !window.performance) return;
    if (!desktopQuery.matches || lowPowerDevice() || !supportsWebGL()) return;

    var view = null;
    var canvas = null;
    var loading = false;
    var failed = false;
    var near = false;
    var live = false;
    var progress = 0;

    function teardown() {
      if (!view) return;
      view.dispose();
      view = null;
      if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
      canvas = null;
      layer.classList.remove('is-live');
      live = false;
    }

    function render() {
      if (!view) return;
      if (reduceMotion || !live || document.hidden) {
        view.stop();
        if (live) view.still();
        return;
      }
      view.start();
    }

    function build() {
      if (view || loading || failed || !near || !desktopQuery.matches) return;
      loading = true;
      import(THREE_SRC).then(function (THREE) {
        loading = false;
        if (!desktopQuery.matches) return;
        canvas = document.createElement('canvas');
        canvas.className = 'nh-story-3d-canvas';
        layer.appendChild(canvas);
        view = createScene(THREE, canvas);
        view.resize();
        view.setProgress(reduceMotion ? STILL_PROGRESS : progress, true);
        render();
      }).catch(function (err) {
        loading = false;
        failed = true;
        if (window.console && console.warn) console.warn('home-story-3d: three.js unavailable', err);
      });
    }

    function setLive(on) {
      if (on === live) return;
      live = on;
      layer.classList.toggle('is-live', on);
      render();
    }

    // Only load once the band is within reach — never alongside the hero video.
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        near = entry.isIntersecting;
        if (near) build();
        else if (view) view.stop();
      });
    }, { rootMargin: '300px 0px' });
    observer.observe(band);

    window.addEventListener('nh:story-progress', function (event) {
      var detail = event.detail || {};
      progress = typeof detail.progress === 'number' ? detail.progress : 0;
      setLive(!!detail.engaged);
      if (view && !reduceMotion) view.setProgress(progress);
    });

    if (!reduceMotion) {
      window.addEventListener('mousemove', function (event) {
        if (!view || !live) return;
        var w = window.innerWidth || 1;
        var h = window.innerHeight || 1;
        view.setDrift((event.clientX / w - 0.5) * 0.9, (0.5 - event.clientY / h) * 0.45);
      }, { passive: true });
    }

    window.addEventListener('resize', function () {
      if (!view) return;
      view.resize();
      if (reduceMotion || !live) view.still();
    });

    document.addEventListener('visibilitychange', render);

    function onBreakpoint() {
      if (desktopQuery.matches) build();
      else teardown();
    }

    if (typeof desktopQuery.addEventListener === 'function') {
      desktopQuery.addEventListener('change', onBreakpoint);
    } else {
      desktopQuery.addListener(onBreakpoint);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
