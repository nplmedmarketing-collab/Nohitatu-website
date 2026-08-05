/* ==========================================================================
   Ultra-Responsive Zero-Lag Custom Tech Arrow Pointer (60fps/120fps GPU)
   ========================================================================== */
(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  document.addEventListener('DOMContentLoaded', function () {
    document.body.classList.add('custom-cursor-enabled');

    // Modern Tech Arrow SVG Pointer
    const pointer = document.createElement('div');
    pointer.className = 'custom-cursor-pointer';
    pointer.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3L10.5 21L13.5 13.5L21 10.5L3 3Z" fill="#000000" stroke="#56CBB9" stroke-width="1.8" stroke-linejoin="round"/>
      </svg>
    `;

    // Trailing Accent Aura
    const aura = document.createElement('div');
    aura.className = 'custom-cursor-aura';

    document.body.appendChild(pointer);
    document.body.appendChild(aura);

    let mouseX = -100, mouseY = -100;
    let auraX = -100, auraY = -100;
    let isVisible = false;
    let isMoving = false;

    window.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      
      if (!isVisible) {
        isVisible = true;
        pointer.style.opacity = '1';
        aura.style.opacity = '1';
      }

      // Direct instant update for 0ms pointer lag
      pointer.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      isMoving = true;
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      isVisible = false;
      pointer.style.opacity = '0';
      aura.style.opacity = '0';
    });

    // Snappy 60fps/120fps smooth lerp for aura trailing (0.45 factor = zero lag)
    function animLoop() {
      if (isVisible) {
        auraX += (mouseX - auraX) * 0.45;
        auraY += (mouseY - auraY) * 0.45;
        aura.style.transform = `translate3d(${auraX}px, ${auraY}px, 0) translate(-50%, -50%)`;
      }
      requestAnimationFrame(animLoop);
    }
    requestAnimationFrame(animLoop);

    // Interactive target lock detection
    const interactiveSelector = 'a, button, input, select, textarea, .btn, .ai-era-btn-primary, .ai-era-btn-secondary, [role="button"]';
    
    document.addEventListener('mouseover', function (e) {
      if (e.target && e.target.closest && e.target.closest(interactiveSelector)) {
        document.body.classList.add('cursor-hover');
      }
    }, { passive: true });

    document.addEventListener('mouseout', function (e) {
      if (e.target && e.target.closest && e.target.closest(interactiveSelector)) {
        document.body.classList.remove('cursor-hover');
      }
    }, { passive: true });
  });
})();
