/* Scroll-linked story + sticky services stages for the homepage. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktopSticky = window.matchMedia('(min-width: 992px)');

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function setActive(items, index, className) {
    items.forEach(function (item, i) {
      item.classList.toggle(className || 'is-active', i === index);
    });
  }

  function initStoryBand() {
    var band = document.querySelector('.nh-story-band');
    if (!band) return;

    var stages = [].slice.call(band.querySelectorAll('.nh-story-stage'));
    if (!stages.length) return;

    function update() {
      if (!desktopSticky.matches) {
        setActive(stages, 0);
        stages.forEach(function (stage) {
          stage.classList.add('is-active');
        });
        return;
      }

      var rect = band.getBoundingClientRect();
      var total = Math.max(band.offsetHeight - window.innerHeight, 1);
      var progress = clamp((-rect.top) / total, 0, 0.999);
      var index = Math.floor(progress * stages.length);
      setActive(stages, index);
    }

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    if (typeof desktopSticky.addEventListener === 'function') {
      desktopSticky.addEventListener('change', update);
    } else {
      desktopSticky.addListener(update);
    }
  }

  function initServicesBand() {
    var band = document.querySelector('.nh-services-band');
    if (!band) return;

    var panels = [].slice.call(band.querySelectorAll('.nh-services-panel'));
    var navItems = [].slice.call(band.querySelectorAll('.nh-services-nav-item'));
    var indexLabel = band.querySelector('[data-service-index]');
    if (!panels.length) return;

    function applyIndex(index) {
      setActive(panels, index);
      setActive(navItems, index);
      if (indexLabel) indexLabel.textContent = String(index + 1);
    }

    function updateFromScroll() {
      if (!desktopSticky.matches) {
        panels.forEach(function (panel) {
          panel.classList.add('is-active');
        });
        return;
      }

      var rect = band.getBoundingClientRect();
      var total = Math.max(band.offsetHeight - window.innerHeight, 1);
      var progress = clamp((-rect.top) / total, 0, 0.999);
      applyIndex(Math.floor(progress * panels.length));
    }

    navItems.forEach(function (item, index) {
      item.addEventListener('click', function () {
        if (!desktopSticky.matches) return;
        var targetTop = band.offsetTop + (band.offsetHeight - window.innerHeight) * (index / panels.length) + 8;
        window.scrollTo({
          top: targetTop,
          behavior: reduceMotion ? 'auto' : 'smooth'
        });
      });
    });

    updateFromScroll();
    window.addEventListener('scroll', updateFromScroll, { passive: true });
    window.addEventListener('resize', updateFromScroll);
    if (typeof desktopSticky.addEventListener === 'function') {
      desktopSticky.addEventListener('change', updateFromScroll);
    } else {
      desktopSticky.addListener(updateFromScroll);
    }
  }

  function init() {
    if (!document.body.classList.contains('landing-page')) return;
    initStoryBand();
    initServicesBand();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
