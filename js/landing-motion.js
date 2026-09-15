/**
 * Landing motion v2 — preloader, Lenis smooth scroll, kinetic typography,
 * cinematic entrances, reveals, magnetic CTAs, cursor.
 * Scoped to body.landing-page. Safe alongside home-story curtain scrubbing.
 */
(function () {
  'use strict';

  if (!document.body.classList.contains('landing-page')) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var desktopQuery = window.matchMedia('(min-width: 992px)');
  var SCRAMBLE = 'NOHITATUÆØ∆◈◆◇▣✦✧⬡◆▲■□●○';

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function whenFontsReady() {
    if (document.fonts && document.fonts.ready) {
      return document.fonts.ready.catch(function () {});
    }
    return Promise.resolve();
  }

  /* ---------- Preloader ---------- */
  function initPreloader() {
    return new Promise(function (resolve) {
      var el = document.getElementById('nh-preloader');
      if (!el) {
        document.body.classList.remove('nh-is-loading');
        resolve();
        return;
      }

      if (reduceMotion) {
        el.classList.add('is-done');
        document.body.classList.remove('nh-is-loading');
        el.setAttribute('aria-hidden', 'true');
        window.setTimeout(function () {
          if (el.parentNode) el.parentNode.removeChild(el);
          resolve();
        }, 40);
        return;
      }

      var minMs = 1200;
      var started = performance.now();
      el.classList.add('is-active');

      function finish() {
        var wait = Math.max(0, minMs - (performance.now() - started));
        window.setTimeout(function () {
          el.classList.add('is-exit');
          document.body.classList.remove('nh-is-loading');
          document.body.classList.add('nh-preloader-done');
          window.setTimeout(function () {
            el.classList.add('is-done');
            if (el.parentNode) el.parentNode.removeChild(el);
            resolve();
          }, 900);
        }, wait);
      }

      Promise.all([
        whenFontsReady(),
        new Promise(function (r) {
          if (document.readyState === 'complete') r();
          else window.addEventListener('load', r, { once: true });
        })
      ]).then(finish).catch(finish);
    });
  }

  /* ---------- Lenis smooth scroll ---------- */
  function initLenis() {
    if (reduceMotion || typeof window.Lenis !== 'function') return null;

    var lenis = new window.Lenis({
      duration: 1.2,
      easing: function (t) {
        return Math.min(1, 1.001 - Math.pow(2, -10 * t));
      },
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.4,
      wheelMultiplier: 0.95
    });

    window.__nhLenis = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Keep native scroll listeners (home-story) in sync — Lenis still updates scrollTop.
    lenis.on('scroll', function () {
      // no-op bridge; native scroll event still fires with Lenis 1.x
    });

    return lenis;
  }

  /* ---------- Scroll progress ---------- */
  function initScrollProgress() {
    var el = document.createElement('div');
    el.className = 'nh-scroll-progress';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<span class="nh-scroll-progress__bar"></span>';
    document.body.appendChild(el);
    var bar = el.firstElementChild;
    var ticking = false;

    function update() {
      var doc = document.documentElement;
      var max = Math.max(doc.scrollHeight - window.innerHeight, 1);
      var p = clamp(window.pageYOffset / max, 0, 1);
      bar.style.width = (p * 100).toFixed(2) + '%';
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* ---------- Custom cursor ---------- */
  function initCursor() {
    if (reduceMotion || !finePointer || !desktopQuery.matches) return;

    var cursor = document.createElement('div');
    cursor.className = 'nh-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cursor);
    document.body.classList.add('nh-cursor-active');

    var x = window.innerWidth / 2;
    var y = window.innerHeight / 2;
    var tx = x;
    var ty = y;
    var raf = 0;

    function loop() {
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      cursor.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      cursor.style.setProperty('--nh-cx', x + 'px');
      cursor.style.setProperty('--nh-cy', y + 'px');
      raf = requestAnimationFrame(loop);
    }

    window.addEventListener('mousemove', function (e) {
      tx = e.clientX;
      ty = e.clientY;
      cursor.classList.add('is-on');
    }, { passive: true });

    window.addEventListener('mousedown', function () {
      cursor.classList.add('is-press');
    });
    window.addEventListener('mouseup', function () {
      cursor.classList.remove('is-press');
    });

    document.addEventListener('mouseover', function (e) {
      var hit = e.target.closest('a, button, .nh-featured-tile, .nh-case-card, .accordion-card-item, .nh-services-nav-item');
      cursor.classList.toggle('is-hover', !!hit);
    });

    document.addEventListener('mouseleave', function () {
      cursor.classList.remove('is-on');
    });

    raf = requestAnimationFrame(loop);

    if (typeof desktopQuery.addEventListener === 'function') {
      desktopQuery.addEventListener('change', function (ev) {
        if (!ev.matches) {
          cancelAnimationFrame(raf);
          cursor.remove();
          document.body.classList.remove('nh-cursor-active');
        }
      });
    }
  }

  /* ---------- Kinetic helpers ---------- */
  function splitToChars(el, className) {
    if (!el || el.dataset.kchars === '1') return [];
    var text = el.textContent || '';
    el.textContent = '';
    el.setAttribute('aria-label', text.trim());
    var chars = [];
    text.split('').forEach(function (ch, i) {
      var span = document.createElement('span');
      span.className = className || 'nh-kchar';
      span.style.setProperty('--i', String(i));
      span.dataset.char = ch === ' ' ? '\u00a0' : ch;
      span.textContent = ch === ' ' ? '\u00a0' : ch;
      span.setAttribute('aria-hidden', 'true');
      el.appendChild(span);
      chars.push(span);
    });
    el.dataset.kchars = '1';
    return chars;
  }

  function scrambleIn(chars, done) {
    if (reduceMotion || !chars.length) {
      chars.forEach(function (c) { c.classList.add('is-set'); });
      if (done) done();
      return;
    }

    var total = chars.length;
    var settled = 0;

    chars.forEach(function (span, i) {
      var finalChar = span.dataset.char || span.textContent;
      var cycles = 4 + (i % 3);
      var step = 0;
      var delay = 40 + i * 28;

      window.setTimeout(function tick() {
        if (step < cycles) {
          span.textContent = SCRAMBLE.charAt(Math.floor(Math.random() * SCRAMBLE.length));
          span.classList.add('is-scrambling');
          step += 1;
          window.setTimeout(tick, 32 + (step * 4));
          return;
        }
        span.textContent = finalChar;
        span.classList.remove('is-scrambling');
        span.classList.add('is-set');
        settled += 1;
        if (settled >= total && done) done();
      }, delay);
    });
  }

  /* ---------- Hero entrance + parallax + scroll cue ---------- */
  function initHero(startEntrance) {
    var banner = document.querySelector('.top-banner--spline');
    if (!banner) return;

    // CSS owns hero title motion (rise + flowing gradient).
    // Do NOT split hero chars — that fought the gradient and looked like "only a font change".

    if (!banner.querySelector('.nh-scroll-cue')) {
      var cue = document.createElement('div');
      cue.className = 'nh-scroll-cue';
      cue.setAttribute('aria-hidden', 'true');
      cue.innerHTML = '<span class="nh-scroll-cue__line"><span></span></span><span>Scroll</span>';
      banner.appendChild(cue);
    }

    banner.classList.add('is-motion-ready');

    function playEntrance() {
      banner.classList.add('is-hero-in');
    }

    if (startEntrance) {
      playEntrance();
    } else {
      window.addEventListener('nh:preloader-done', playEntrance, { once: true });
      // Fallback if preloader event was missed
      window.setTimeout(function () {
        if (!banner.classList.contains('is-hero-in')) playEntrance();
      }, 2200);
    }

    var wrapper = banner.querySelector('.ai-era-wrapper');
    var scrolled = false;

    function onScroll() {
      var y = window.pageYOffset || 0;
      if (!scrolled && y > 40) {
        scrolled = true;
        banner.classList.add('is-scrolled');
      } else if (scrolled && y <= 40) {
        scrolled = false;
        banner.classList.remove('is-scrolled');
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (reduceMotion || !finePointer || !wrapper) return;

    var px = 0;
    var py = 0;
    var tpx = 0;
    var tpy = 0;
    var running = false;

    function tick() {
      px += (tpx - px) * 0.08;
      py += (tpy - py) * 0.08;
      wrapper.style.transform = 'translate3d(' + px.toFixed(2) + 'px,' + py.toFixed(2) + 'px,0)';
      if (Math.abs(tpx - px) > 0.05 || Math.abs(tpy - py) > 0.05) {
        requestAnimationFrame(tick);
      } else {
        running = false;
      }
    }

    banner.addEventListener('mousemove', function (e) {
      if (scrolled) return;
      var rect = banner.getBoundingClientRect();
      var nx = (e.clientX - rect.left) / rect.width - 0.5;
      var ny = (e.clientY - rect.top) / rect.height - 0.5;
      tpx = nx * -18;
      tpy = ny * -12;
      if (!running) {
        running = true;
        requestAnimationFrame(tick);
      }
    }, { passive: true });

    banner.addEventListener('mouseleave', function () {
      tpx = 0;
      tpy = 0;
      if (!running) {
        running = true;
        requestAnimationFrame(tick);
      }
    });
  }

  /* ---------- Magnetic buttons ---------- */
  function initMagnetic() {
    if (reduceMotion || !finePointer) return;

    var nodes = [].slice.call(document.querySelectorAll(
      '.ai-era-btn-primary, .ai-era-btn-secondary, .nh-solid-btn, .insights-view-all-pill'
    ));

    nodes.forEach(function (btn) {
      btn.classList.add('nh-magnetic');
      if (!btn.querySelector('.nh-magnetic-fill')) {
        var fill = document.createElement('span');
        fill.className = 'nh-magnetic-fill';
        fill.setAttribute('aria-hidden', 'true');
        btn.appendChild(fill);
      }

      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var dx = e.clientX - (rect.left + rect.width / 2);
        var dy = e.clientY - (rect.top + rect.height / 2);
        btn.style.transform = 'translate3d(' + (dx * 0.22) + 'px,' + (dy * 0.28) + 'px,0)';
        btn.style.setProperty('--nh-mx', ((e.clientX - rect.left) / rect.width) * 100 + '%');
        btn.style.setProperty('--nh-my', ((e.clientY - rect.top) / rect.height) * 100 + '%');
      });

      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  }

  /* ---------- Featured tile spotlight ---------- */
  function initTileSpotlight() {
    if (reduceMotion || !finePointer) return;

    [].slice.call(document.querySelectorAll('.nh-featured-tile')).forEach(function (tile) {
      tile.addEventListener('mousemove', function (e) {
        var rect = tile.getBoundingClientRect();
        tile.style.setProperty('--nh-mx', ((e.clientX - rect.left) / rect.width) * 100 + '%');
        tile.style.setProperty('--nh-my', ((e.clientY - rect.top) / rect.height) * 100 + '%');
      });
    });
  }

  /* ---------- Kinetic section headings ---------- */
  function initKineticHeadings() {
    var selectors = [
      '#nh-featured-title',
      '#nh-insights-title',
      '#nh-consult-title',
      '#nh-cases-title',
      '.nh-proof-copy h2',
      '.nh-case-banner-inner h2',
      '.nh-services-panel h2'
    ];

    selectors.forEach(function (sel) {
      [].slice.call(document.querySelectorAll(sel)).forEach(function (heading) {
        // Preserve nested HTML (e.g. insights span) by only splitting plain text nodes.
        if (heading.children.length && !heading.dataset.forceKinetic) {
          // Wrap whole heading text content if only simple spans
          if (heading.id === 'nh-insights-title') {
            heading.classList.add('nh-kinetic-heading');
            return;
          }
        }
        splitToChars(heading, 'nh-kchar nh-kchar--section');
        heading.classList.add('nh-kinetic-heading');
      });
    });
  }

  /* ---------- Scroll reveals ---------- */
  function initReveals() {
    var targets = [];

    function arm(el, extraClass, delay) {
      if (!el) return;
      el.classList.add('nh-reveal');
      if (extraClass) el.classList.add(extraClass);
      if (delay) el.style.setProperty('--nh-reveal-delay', delay);
      targets.push(el);
    }

    var featuredHead = document.querySelector('.nh-featured-head');
    arm(featuredHead, null, '0ms');
    [].slice.call(document.querySelectorAll('.nh-featured-tile')).forEach(function (tile, i) {
      arm(tile, 'nh-reveal--scale', (i * 90) + 'ms');
    });

    arm(document.querySelector('.nh-case-banner-inner'), null, '0ms');

    var logoStrip = document.querySelector('.nh-logo-strip .nh-shell');
    arm(logoStrip, null, '0ms');

    var proofCopy = document.querySelector('.nh-proof-copy');
    arm(proofCopy, 'nh-reveal--left', '0ms');

    var proofMetrics = document.querySelector('.nh-proof-metrics');
    if (proofMetrics) {
      [].slice.call(proofMetrics.querySelectorAll('.nh-proof-metric')).forEach(function (m, i) {
        m.style.setProperty('--nh-metric-i', String(i));
      });
      targets.push(proofMetrics);
    }

    var insightsHeader = document.querySelector('.insights-accordion-sec .section-header');
    arm(insightsHeader, null, '0ms');
    var insightsGrid = document.querySelector('.accordion-stage-grid');
    arm(insightsGrid, 'nh-reveal--scale', '80ms');

    arm(document.querySelector('.nh-consult-copy'), 'nh-reveal--left', '0ms');
    arm(document.querySelector('.nh-cases-head'), null, '0ms');

    function activate(el) {
      el.classList.add('is-in');
      var heading = el.matches('.nh-kinetic-heading')
        ? el
        : el.querySelector('.nh-kinetic-heading');
      if (heading) {
        var chars = [].slice.call(heading.querySelectorAll('.nh-kchar--section'));
        if (chars.length) scrambleIn(chars);
        else heading.classList.add('is-kinetic-in');
      }
      // Nested headings inside armed parents
      [].slice.call(el.querySelectorAll('.nh-kinetic-heading')).forEach(function (h) {
        var chars = [].slice.call(h.querySelectorAll('.nh-kchar--section'));
        if (chars.length) scrambleIn(chars);
        h.classList.add('is-kinetic-in');
      });
    }

    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach(activate);
      if (proofMetrics) proofMetrics.classList.add('is-in');
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        activate(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

    targets.forEach(function (el) { observer.observe(el); });

    // Also observe kinetic headings that aren't wrapped in nh-reveal
    [].slice.call(document.querySelectorAll('.nh-kinetic-heading')).forEach(function (h) {
      if (h.closest('.nh-reveal') || h.closest('.nh-services-panel')) return;
      observer.observe(h);
      targets.push(h);
    });
  }

  /* ---------- Story word letter split ---------- */
  function initStoryLetters() {
    var words = [].slice.call(document.querySelectorAll('.nh-story-word'));
    words.forEach(function (word) {
      if (word.dataset.letters === '1') return;
      var text = word.textContent || '';
      word.textContent = '';
      word.setAttribute('aria-label', text);
      text.split('').forEach(function (ch, i) {
        var span = document.createElement('span');
        span.className = 'nh-char';
        span.style.setProperty('--nh-char-i', String(i));
        span.textContent = ch === ' ' ? '\u00a0' : ch;
        span.setAttribute('aria-hidden', 'true');
        word.appendChild(span);
      });
      word.dataset.letters = '1';
    });

    if (reduceMotion) {
      words.forEach(function (word) {
        [].slice.call(word.querySelectorAll('.nh-char')).forEach(function (c) {
          c.style.opacity = '1';
          c.style.transform = 'none';
        });
      });
    }
  }

  /* ---------- Services panel kinetic on chapter change ---------- */
  function initServicesKinetic() {
    if (reduceMotion) return;
    var band = document.querySelector('.nh-services-band');
    if (!band) return;

    var panels = [].slice.call(band.querySelectorAll('.nh-services-panel'));
    panels.forEach(function (panel) {
      var h2 = panel.querySelector('h2');
      if (!h2) return;
      splitToChars(h2, 'nh-kchar nh-kchar--section');
      h2.classList.add('nh-kinetic-heading');
    });

    var last = -1;
    var mo = new MutationObserver(function () {
      panels.forEach(function (panel, i) {
        if (!panel.classList.contains('is-active') || i === last) return;
        last = i;
        var chars = [].slice.call(panel.querySelectorAll('.nh-kchar--section'));
        chars.forEach(function (c) {
          c.classList.remove('is-set', 'is-scrambling');
        });
        scrambleIn(chars);
        var kh = panel.querySelector('.nh-kinetic-heading');
        if (kh) kh.classList.add('is-kinetic-in');
      });
    });

    panels.forEach(function (panel) {
      mo.observe(panel, { attributes: true, attributeFilter: ['class'] });
    });

    // Initial active
    var active = band.querySelector('.nh-services-panel.is-active');
    if (active) {
      last = panels.indexOf(active);
      scrambleIn([].slice.call(active.querySelectorAll('.nh-kchar--section')));
    }
  }

  /* ---------- 3D tilt (cases + featured) ---------- */
  function initTilt() {
    if (reduceMotion || !finePointer) return;

    var nodes = [].slice.call(document.querySelectorAll('.nh-case-card, .nh-featured-tile'));
    nodes.forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width;
        var y = (e.clientY - rect.top) / rect.height;
        var rx = (0.5 - y) * 10;
        var ry = (x - 0.5) * 12;
        el.classList.add('is-tilting');
        el.style.setProperty(
          'transform',
          'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateY(-6px)',
          'important'
        );
      });
      el.addEventListener('mouseleave', function () {
        el.classList.remove('is-tilting');
        el.style.removeProperty('transform');
      });
    });
  }

  /* ---------- Soft page transitions ---------- */
  function initPageTransitions() {
    var overlay = document.getElementById('nh-page-transition');
    if (!overlay || reduceMotion) return;

    var targets = [
      'Portfolio.html',
      'Contact-us.html',
      './Portfolio.html',
      './Contact-us.html'
    ];

    function shouldTransition(href) {
      if (!href) return false;
      var clean = href.split('#')[0].split('?')[0];
      return targets.some(function (t) {
        return clean === t || clean.endsWith('/' + t.replace('./', ''));
      });
    }

    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href]');
      if (!link) return;
      if (link.target === '_blank' || link.hasAttribute('download')) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var href = link.getAttribute('href');
      if (!shouldTransition(href)) return;

      e.preventDefault();
      overlay.classList.add('is-active');
      overlay.setAttribute('aria-hidden', 'false');
      window.setTimeout(function () {
        window.location.href = href;
      }, 520);
    });

    // Fade in when arriving (bfcache / back)
    window.addEventListener('pageshow', function () {
      overlay.classList.remove('is-active');
    });
  }

  ready(function () {
    try { initScrollProgress(); } catch (e) {}
    try { initMagnetic(); } catch (e) {}
    try { initTileSpotlight(); } catch (e) {}
    try { initStoryLetters(); } catch (e) {}
    try { initKineticHeadings(); } catch (e) {}
    try { initCursor(); } catch (e) {}
    try { initTilt(); } catch (e) {}
    try { initPageTransitions(); } catch (e) {}

    // Hero arms structure immediately; entrance waits for preloader
    try { initHero(false); } catch (e) {}

    initPreloader().then(function () {
      window.dispatchEvent(new CustomEvent('nh:preloader-done'));
      try { initLenis(); } catch (e) {}
      try { initReveals(); } catch (e) {}
      try { initServicesKinetic(); } catch (e) {}
    });
  });
})();
