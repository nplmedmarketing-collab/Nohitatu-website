/* ==========================================================================
   Custom tech arrow cursor — single init, rAF tracking, transform-only
   ========================================================================== */
(function () {
  if (window.__nohitatuCustomCursorInit) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  window.__nohitatuCustomCursorInit = true;

  function init() {
    if (document.querySelector('.custom-cursor-pointer')) return;

    document.body.classList.add('custom-cursor-enabled');

    var pointer = document.createElement('div');
    pointer.className = 'custom-cursor-pointer';
    pointer.setAttribute('aria-hidden', 'true');
    pointer.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M3 3L10.5 21L13.5 13.5L21 10.5L3 3Z" fill="#000000" stroke="#56CBB9" stroke-width="1.8" stroke-linejoin="round"/>' +
      '</svg>';

    var aura = document.createElement('div');
    aura.className = 'custom-cursor-aura';
    aura.setAttribute('aria-hidden', 'true');

    document.body.appendChild(pointer);
    document.body.appendChild(aura);

    var mouseX = -100;
    var mouseY = -100;
    var auraX = -100;
    var auraY = -100;
    var isVisible = false;
    var needsDraw = false;

    var textFieldSelector = 'input, textarea, select, [contenteditable="true"]';
    var interactiveSelector =
      'a, button, .btn, .ai-era-btn-primary, .ai-era-btn-secondary, [role="button"], label[for], summary';

    function setVisible(show) {
      if (show === isVisible) return;
      isVisible = show;
      pointer.style.opacity = show ? '1' : '0';
      aura.style.opacity = show ? '1' : '0';
    }

    function onMove(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      needsDraw = true;
      if (!isVisible && !document.body.classList.contains('cursor-native-text')) {
        setVisible(true);
      }
    }

    window.addEventListener('mousemove', onMove, { passive: true });

    document.addEventListener('mouseleave', function () {
      setVisible(false);
    });

    document.addEventListener(
      'mouseover',
      function (e) {
        var t = e.target;
        if (!t || !t.closest) return;

        if (t.closest(textFieldSelector)) {
          document.body.classList.add('cursor-native-text');
          setVisible(false);
          document.body.classList.remove('cursor-hover');
          return;
        }

        if (document.body.classList.contains('cursor-native-text')) {
          document.body.classList.remove('cursor-native-text');
          setVisible(true);
        }

        if (t.closest(interactiveSelector)) {
          document.body.classList.add('cursor-hover');
        }
      },
      { passive: true }
    );

    document.addEventListener(
      'mouseout',
      function (e) {
        var t = e.target;
        if (!t || !t.closest) return;

        if (t.closest(textFieldSelector)) {
          var related = e.relatedTarget;
          if (!related || !related.closest || !related.closest(textFieldSelector)) {
            document.body.classList.remove('cursor-native-text');
            setVisible(true);
          }
        }

        if (t.closest(interactiveSelector)) {
          var next = e.relatedTarget;
          if (!next || !next.closest || !next.closest(interactiveSelector)) {
            document.body.classList.remove('cursor-hover');
          }
        }
      },
      { passive: true }
    );

    // Single rAF loop: tip snaps to mouse; aura eases behind (no CSS transition lag).
    function animLoop() {
      if (needsDraw || isVisible) {
        // Tip follows tightly (GPU transform only — no left/top reflow).
        pointer.style.transform = 'translate3d(' + mouseX + 'px,' + mouseY + 'px,0)';

        // Aura slightly lags for depth without fighting the tip.
        auraX += (mouseX - auraX) * 0.35;
        auraY += (mouseY - auraY) * 0.35;
        aura.style.transform =
          'translate3d(' + auraX + 'px,' + auraY + 'px,0) translate(-50%,-50%)';
        needsDraw = false;
      }
      requestAnimationFrame(animLoop);
    }
    requestAnimationFrame(animLoop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
