/**
 * Disabled: Hero uses live Spline iframe embed directly in HTML.
 */
(function () {
  return;
})();

  // --- Always-on canvas boxes (Spline glass boxes-hover scene renders black on many GPUs) ---
  const canvas = document.createElement('canvas');
  canvas.className = 'hero-spline-frame hero-boxes-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);

  const ctx = canvas.getContext('2d', { alpha: false });
  let w = 0;
  let h = 0;
  let dpr = 1;
  let mx = 0.5;
  let my = 0.5;
  let t0 = performance.now();
  let raf = 0;

  const boxes = [];
  const COLS = 9;
  const ROWS = 5;

  function rebuild() {
    boxes.length = 0;
    const gapX = w / (COLS + 1);
    const gapY = h / (ROWS + 1);
    const size = Math.min(gapX, gapY) * 0.42;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        // Leave a soft hole for the headline center
        const nx = (c + 1) / (COLS + 1);
        const ny = (r + 1) / (ROWS + 1);
        const distC = Math.hypot(nx - 0.5, ny - 0.48);
        if (distC < 0.16) continue;
        boxes.push({
          x: (c + 1) * gapX,
          y: (r + 1) * gapY,
          z: (Math.sin(c * 1.7 + r) * 0.5 + 0.5) * 40,
          s: size * (0.75 + ((c * 13 + r * 7) % 5) * 0.06),
          phase: c * 0.9 + r * 1.3,
          hue: 220 + ((c + r) % 4) * 12,
        });
      }
    }
  }

  function sizeCanvas() {
    const rect = host.getBoundingClientRect();
    w = Math.max(1, Math.round(rect.width || window.innerWidth));
    h = Math.max(1, Math.round(rect.height || window.innerHeight));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    rebuild();
  }

  function project(x, y, z) {
    // Fake perspective from center + mouse parallax
    const cx = w * 0.5 + (mx - 0.5) * 80;
    const cy = h * 0.5 + (my - 0.5) * 50;
    const f = 700 / (700 + z);
    return {
      x: cx + (x - cx) * f,
      y: cy + (y - cy) * f - z * 0.15,
      s: f,
    };
  }

  function drawBox(b, time) {
    const bob = REDUCE ? 0 : Math.sin(time * 0.0012 + b.phase) * 10;
    // Hover lift near cursor
    const dx = b.x / w - mx;
    const dy = b.y / h - my;
    const d = Math.hypot(dx, dy);
    const hover = Math.max(0, 1 - d * 3.2);
    const lift = hover * 28 + bob;
    const z = b.z - lift * 1.4;
    const p = project(b.x, b.y - lift * 0.35, z);
    const s = b.s * p.s * (1 + hover * 0.28);

    // Isometric-ish cube faces
    const depth = s * 0.38;
    const cosA = Math.cos(0.55 + (mx - 0.5) * 0.35);
    const sinA = Math.sin(0.55 + (mx - 0.5) * 0.35);
    const ox = depth * cosA;
    const oy = depth * sinA * 0.55;

    const face = 'hsla(' + b.hue + ', 72%, ' + (42 + hover * 18) + '%, ' + (0.55 + hover * 0.35) + ')';
    const side = 'hsla(' + b.hue + ', 68%, ' + (28 + hover * 12) + '%, ' + (0.5 + hover * 0.3) + ')';
    const top = 'hsla(' + (b.hue + 20) + ', 80%, ' + (58 + hover * 16) + '%, ' + (0.6 + hover * 0.3) + ')';
    const edge = 'hsla(' + b.hue + ', 90%, 75%, ' + (0.25 + hover * 0.45) + ')';

    ctx.save();
    ctx.translate(p.x, p.y);

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,' + (0.25 + hover * 0.2) + ')';
    ctx.beginPath();
    ctx.ellipse(4, s * 0.55, s * 0.55, s * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    // right face
    ctx.beginPath();
    ctx.moveTo(s * 0.5, -s * 0.25);
    ctx.lineTo(s * 0.5 + ox, -s * 0.25 - oy);
    ctx.lineTo(s * 0.5 + ox, s * 0.45 - oy);
    ctx.lineTo(s * 0.5, s * 0.45);
    ctx.closePath();
    ctx.fillStyle = side;
    ctx.fill();

    // left face
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, -s * 0.25);
    ctx.lineTo(-s * 0.5 + ox * 0.2, -s * 0.25 - oy * 0.4);
    ctx.lineTo(-s * 0.5 + ox * 0.2, s * 0.45 - oy * 0.4);
    ctx.lineTo(-s * 0.5, s * 0.45);
    ctx.closePath();
    ctx.fillStyle = face;
    ctx.fill();

    // top face
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, -s * 0.25);
    ctx.lineTo(-s * 0.5 + ox * 0.2, -s * 0.25 - oy * 0.4);
    ctx.lineTo(s * 0.5 + ox, -s * 0.25 - oy);
    ctx.lineTo(s * 0.5, -s * 0.25);
    ctx.closePath();
    ctx.fillStyle = top;
    ctx.fill();

    // front face
    ctx.beginPath();
    ctx.rect(-s * 0.5, -s * 0.25, s, s * 0.7);
    ctx.fillStyle = face;
    ctx.fill();
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1 + hover * 1.2;
    ctx.stroke();

    // specular
    if (hover > 0.05) {
      const g = ctx.createLinearGradient(-s * 0.4, -s * 0.2, s * 0.3, s * 0.3);
      g.addColorStop(0, 'rgba(255,255,255,' + (0.12 + hover * 0.2) + ')');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-s * 0.5, -s * 0.25, s, s * 0.7);
    }

    ctx.restore();
  }

  function frame(now) {
    const time = now - t0;
    // deep base so no white flash
    const grd = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
    grd.addColorStop(0, '#141826');
    grd.addColorStop(0.55, '#0b0d14');
    grd.addColorStop(1, '#06070c');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    // soft brand glow
    const glow = ctx.createRadialGradient(w * (0.35 + mx * 0.3), h * (0.4 + my * 0.2), 0, w * 0.5, h * 0.5, w * 0.55);
    glow.addColorStop(0, 'rgba(114,108,244,0.16)');
    glow.addColorStop(0.5, 'rgba(86,203,185,0.06)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // paint far boxes first (by z desc)
    const sorted = boxes.slice().sort((a, b) => b.z - a.z);
    for (let i = 0; i < sorted.length; i++) drawBox(sorted[i], time);

    // vignette
    const vig = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.2, w * 0.5, h * 0.5, w * 0.72);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

    if (!REDUCE) raf = requestAnimationFrame(frame);
  }

  function onPointer(e) {
    const rect = host.getBoundingClientRect();
    mx = (e.clientX - rect.left) / Math.max(1, rect.width);
    my = (e.clientY - rect.top) / Math.max(1, rect.height);
  }

  sizeCanvas();
  frame(performance.now());
  if (!REDUCE) {
    // keep animating
  } else {
    // one more static frame is enough
  }

  window.addEventListener(
    'pointermove',
    (e) => {
      onPointer(e);
      if (REDUCE) frame(performance.now());
    },
    { passive: true }
  );

  window.addEventListener(
    'resize',
    () => {
      sizeCanvas();
      if (REDUCE) frame(performance.now());
    },
    { passive: true }
  );

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      sizeCanvas();
      if (REDUCE) frame(performance.now());
    }).observe(host);
  }
})();
