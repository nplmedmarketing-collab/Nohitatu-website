/* ==========================================================================
   Infosys-Style Whole Line Slide & Fade Animation Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const headlineEl = document.getElementById('infosys-headline');
  if (!headlineEl) return;

  const statements = [
    "DRIVING DIGITAL TRANSFORMATION IN SAAS & RCM",
    "EMPOWERING HEALTHCARE & ENTERPRISE SOFTWARE",
    "BUILDING NEXT-GEN SAAS & MEDICAL BILLING"
  ];

  let currentIndex = 0;
  let intervalId = null;

  function cycleStatement() {
    // Fade & slide out current line
    headlineEl.classList.remove('fade-in');
    headlineEl.classList.add('fade-out');

    setTimeout(() => {
      currentIndex = (currentIndex + 1) % statements.length;
      headlineEl.textContent = statements[currentIndex];
      // Fade & slide in next line
      headlineEl.classList.remove('fade-out');
      headlineEl.classList.add('fade-in');
    }, 600);
  }

  function startAnimation() {
    if (!intervalId) {
      headlineEl.style.display = 'block';
      headlineEl.classList.remove('fade-out');
      headlineEl.classList.add('fade-in');
      intervalId = setInterval(cycleStatement, 3800);
    }
  }

  function stopAnimation() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    headlineEl.classList.remove('fade-in');
    headlineEl.classList.add('fade-out');
  }

  window.heroHeadline = {
    start: startAnimation,
    stop: stopAnimation
  };

  startAnimation();
});
