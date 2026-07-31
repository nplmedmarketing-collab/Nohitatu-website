/* Cascading curtain storytelling + pinned services scrubbing. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktopQuery = window.matchMedia('(min-width: 992px)');
  // Scroll distance per services chapter (fraction of viewport).
  var SERVICES_STAGE_TRAVEL = 0.85;
  // Extra pinned linger on 4/4 before Featured Services takes over.
  var SERVICES_FINAL_HOLD = 0.75;

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function setActive(nodes, index) {
    nodes.forEach(function (node, i) {
      node.classList.toggle('is-active', i === index);
    });
  }

  function clearPinStyles(panel) {
    if (!panel) return;
    panel.style.position = '';
    panel.style.top = '';
    panel.style.bottom = '';
    panel.style.left = '';
    panel.style.right = '';
    panel.style.width = '';
    panel.style.height = '';
    panel.style.minHeight = '';
    panel.style.transform = '';
    panel.style.zIndex = '';
    panel.style.visibility = '';
    panel.style.background = '';
    panel.classList.remove('is-pinned', 'is-before', 'is-after', 'is-curtained');
  }

  /**
   * Hero → build → scale → automate cascading curtains.
   * Each slide fills the viewport, holds, then lifts to reveal the next.
   */
  function initStoryBand() {
    var band = document.querySelector('.nh-story-band');
    if (!band) return;

    var slides = [].slice.call(band.querySelectorAll('.nh-story-slide'));
    var progressFill = band.querySelector('.nh-story-progress span');
    var progressEl = band.querySelector('.nh-story-progress');
    var stageCount = slides.length || parseInt(band.getAttribute('data-stages'), 10) || 3;
    var curtainCount = Math.max(stageCount - 1, 1);
    // Brief hold so each slide fills the window, then a full-window curtain lift.
    var HOLD = 0.4;
    var LIFT = 1;
    var FINAL_HOLD = 0.5;
    var ticking = false;
    var wasEngaged = false;

    /**
     * Broadcasts where the curtains are so optional layers (the WebGL depth
     * scene) can scrub with them. `progress` spans the reveal through the last
     * curtain; `engaged` is true only while the band owns the viewport, so the
     * listener stays idle over the hero and past the release.
     */
    function emitProgress(value, engaged) {
      if (typeof window.CustomEvent !== 'function') return;
      if (!engaged && !wasEngaged) return;
      wasEngaged = engaged;
      window.dispatchEvent(new CustomEvent('nh:story-progress', {
        detail: { progress: clamp(value, 0, 1), engaged: engaged, stages: stageCount }
      }));
    }

    function viewportH() {
      return window.innerHeight || document.documentElement.clientHeight || 800;
    }

    function fillViewport(slide, vh) {
      slide.style.left = '0';
      slide.style.right = '0';
      slide.style.width = '100%';
      slide.style.height = vh + 'px';
      slide.style.minHeight = vh + 'px';
    }

    function syncHeight() {
      if (!desktopQuery.matches) {
        band.style.height = '';
        slides.forEach(clearPinStyles);
        document.body.classList.remove('nh-story-curtain');
        if (progressFill) progressFill.style.width = '';
        if (progressEl) {
          progressEl.style.position = '';
          progressEl.style.opacity = '';
        }
        return;
      }
      var vh = viewportH();
      // Use px from the same viewport metric as slides — avoids vh/innerHeight gaps.
      var units = curtainCount * (HOLD + LIFT) + FINAL_HOLD + 1;
      band.style.height = Math.round(units * vh) + 'px';
    }

    function update() {
      if (!desktopQuery.matches) {
        emitProgress(0, false);
        return;
      }

      var vh = viewportH();
      var holdPx = HOLD * vh;
      var liftPx = LIFT * vh;
      var unit = holdPx + liftPx;
      var scrollY = window.pageYOffset || document.documentElement.scrollTop;
      var bandTop = band.getBoundingClientRect().top + scrollY;
      var bandHeight = band.offsetHeight;
      var curtainsDoneAt = bandTop + curtainCount * unit;
      var releaseAt = bandTop + Math.max(bandHeight - vh, curtainCount * unit);

      if (scrollY >= releaseAt) {
        document.body.classList.remove('nh-story-curtain');
        slides.forEach(function (slide, i) {
          var isLast = i === slides.length - 1;
          slide.style.position = 'absolute';
          slide.style.transform = 'none';
          slide.style.visibility = isLast ? 'visible' : 'hidden';
          slide.style.top = (bandHeight - vh) + 'px';
          slide.style.bottom = 'auto';
          fillViewport(slide, vh);
          slide.style.zIndex = String(10 + i);
          slide.classList.remove('is-pinned', 'is-curtained');
          slide.classList.add('is-after');
        });
        if (progressEl) {
          progressEl.style.position = 'absolute';
          progressEl.style.bottom = '28px';
          progressEl.style.opacity = '0';
          progressEl.style.zIndex = '40';
        }
        if (progressFill) progressFill.style.width = '100%';
        emitProgress(1, false);
        return;
      }

      document.body.classList.add('nh-story-curtain');

      slides.forEach(function (slide, i) {
        var z = 30 - i;
        var dy = 0;

        if (i < curtainCount) {
          // Hold full window, then lift over the next full window of scroll.
          var curtainStart = bandTop + i * unit + holdPx;
          if (scrollY > curtainStart) {
            dy = Math.min(scrollY - curtainStart, liftPx);
          }
        }

        var fullyOff = dy >= liftPx - 0.5;
        slide.style.position = 'fixed';
        slide.style.top = '0';
        slide.style.bottom = 'auto';
        fillViewport(slide, vh);
        slide.style.zIndex = String(z);
        slide.style.transform = dy ? 'translate3d(0,' + (-dy) + 'px,0)' : 'none';
        slide.style.visibility = fullyOff ? 'hidden' : 'visible';
        slide.classList.add('is-pinned');
        slide.classList.toggle('is-curtained', dy > 0 && !fullyOff);
        slide.classList.remove('is-after', 'is-before');
      });

      if (progressEl) {
        progressEl.style.position = 'fixed';
        progressEl.style.left = '50%';
        progressEl.style.bottom = '28px';
        progressEl.style.transform = 'translateX(-50%)';
        progressEl.style.zIndex = '40';
        progressEl.style.opacity = scrollY >= curtainsDoneAt ? '0' : '1';
      }

      var totalTravel = Math.max(curtainsDoneAt, 1);
      var overall = clamp(scrollY / totalTravel, 0, 1);
      if (progressFill) progressFill.style.width = (overall * 100) + '%';

      // Depth-layer scrub: 0 as the hero clears, 1 as the last curtain lands.
      var revealAt = bandTop - vh;
      var storyP = clamp((scrollY - revealAt) / Math.max(curtainsDoneAt - revealAt, 1), 0, 1);
      // Held back until the hero has mostly cleared, so the video never shares
      // the viewport with a live WebGL canvas.
      emitProgress(storyP, scrollY > revealAt + vh * 0.6);
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        update();
      });
    }

    syncHeight();
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () {
      syncHeight();
      update();
    });
    if (typeof desktopQuery.addEventListener === 'function') {
      desktopQuery.addEventListener('change', function () {
        syncHeight();
        update();
      });
    } else {
      desktopQuery.addListener(function () {
        syncHeight();
        update();
      });
    }
  }

  function initServicesBand() {
    var band = document.querySelector('.nh-services-band');
    if (!band) return;

    var stageCount = parseInt(band.getAttribute('data-stages'), 10) || 4;
    var panel = band.querySelector('.nh-services-sticky');
    var panels = [].slice.call(band.querySelectorAll('.nh-services-panel'));
    var navItems = [].slice.call(band.querySelectorAll('.nh-services-nav-item'));
    var indexLabel = band.querySelector('[data-service-index]');
    var lastIndex = -1;
    var ticking = false;
    // Cached geometry so the band height never changes mid-scroll.
    var pinDistance = 0;
    var panelH = 0;
    var panelOffset = 0;

    function viewportH() {
      return window.innerHeight || document.documentElement.clientHeight || 800;
    }

    function measure() {
      var vh = viewportH();
      var shell = panel.querySelector('.nh-services-shell');

      // Read the natural shell height with the 100vh panel height suspended.
      var prevHeight = panel.style.height;
      panel.style.height = 'auto';
      var natural = shell ? shell.getBoundingClientRect().height : panel.scrollHeight;
      panel.style.height = prevHeight;

      panelH = Math.min(Math.ceil(natural + 96), vh);
      panelOffset = Math.max(Math.round((vh - panelH) / 2), 0);
      pinDistance = Math.round((stageCount * SERVICES_STAGE_TRAVEL + SERVICES_FINAL_HOLD) * vh);
    }

    function place(position, top) {
      panel.style.position = position;
      panel.style.top = top + 'px';
      panel.style.bottom = 'auto';
      panel.style.left = '0';
      panel.style.right = '0';
      panel.style.width = '100%';
      panel.style.height = panelH + 'px';
      panel.style.minHeight = '0';
      panel.style.background = '#fff';
    }

    function syncHeight() {
      if (!desktopQuery.matches) {
        band.style.height = '';
        clearPinStyles(panel);
        panels.forEach(function (node) { node.classList.add('is-active'); });
        return;
      }
      measure();
      // Static: pin travel + the panel's resting block. Featured follows immediately.
      band.style.height = (pinDistance + panelOffset + panelH) + 'px';
    }

    function applyIndex(index) {
      if (index === lastIndex) return;
      setActive(panels, index);
      setActive(navItems, index);
      if (indexLabel) indexLabel.textContent = String(index + 1);
      lastIndex = index;
    }

    function update() {
      if (!desktopQuery.matches) return;

      var vh = viewportH();
      var scrolled = Math.max(-band.getBoundingClientRect().top, 0);
      var stagePortion = stageCount * SERVICES_STAGE_TRAVEL * vh;

      // Map scroll across the chapter travels only; the tail keeps 4/4 active.
      var index = scrolled < stagePortion
        ? Math.min(stageCount - 1, Math.floor((scrolled / Math.max(stagePortion, 1)) * stageCount))
        : stageCount - 1;
      applyIndex(index);

      if (scrolled <= 0) {
        place('absolute', panelOffset);
        panel.classList.add('is-before');
        panel.classList.remove('is-pinned', 'is-after');
        return;
      }

      if (scrolled < pinDistance) {
        // Pinned at the same viewport offset it held while entering — no jump.
        place('fixed', panelOffset);
        panel.classList.add('is-pinned');
        panel.classList.remove('is-before', 'is-after');
        return;
      }

      place('absolute', pinDistance + panelOffset);
      panel.classList.add('is-after');
      panel.classList.remove('is-pinned', 'is-before');
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        update();
      });
    }

    navItems.forEach(function (item, index) {
      item.addEventListener('click', function () {
        if (!desktopQuery.matches) return;
        var stagePortion = stageCount * SERVICES_STAGE_TRAVEL * viewportH();
        var top = band.getBoundingClientRect().top + window.pageYOffset +
          stagePortion * ((index + 0.08) / stageCount);
        window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });

    syncHeight();
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () {
      syncHeight();
      update();
    });
    if (typeof desktopQuery.addEventListener === 'function') {
      desktopQuery.addEventListener('change', function () {
        syncHeight();
        update();
      });
    } else {
      desktopQuery.addListener(function () {
        syncHeight();
        update();
      });
    }
  }

  /**
   * Plays the consultation timeline in once it scrolls into view: nodes pop,
   * connectors draw downward, copy lifts. All the timing lives in CSS.
   */
  function initConsultTimeline() {
    var list = document.querySelector('.nh-consult-steps');
    if (!list) return;
    // Without IntersectionObserver the steps simply stay visible.
    if (!('IntersectionObserver' in window)) return;

    list.classList.add('is-armed');

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        list.classList.add('is-revealed');
        observer.disconnect();
      });
    }, { threshold: 0.2 });

    observer.observe(list);
  }

  /**
   * Staggers the case study cards in as the grid scrolls into view.
   */
  function initCaseCards() {
    var grid = document.querySelector('.nh-cases-grid');
    if (!grid) return;
    // Without IntersectionObserver the cards simply stay visible.
    if (!('IntersectionObserver' in window)) return;

    grid.classList.add('is-armed');

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        grid.classList.add('is-revealed');
        observer.disconnect();
        // Retire the armed state once the stagger has played, so the hover
        // lift is not held back by the entrance delays.
        window.setTimeout(function () {
          grid.classList.remove('is-armed');
        }, 1400);
      });
    }, { threshold: 0.15 });

    observer.observe(grid);
  }

  function init() {
    if (!document.body.classList.contains('landing-page')) return;
    // Isolated so a failure in one band cannot disable the others.
    [initStoryBand, initServicesBand, initConsultTimeline, initCaseCards].forEach(function (fn) {
      try {
        fn();
      } catch (err) {
        if (window.console && console.warn) console.warn('home-story: ' + fn.name + ' failed', err);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
