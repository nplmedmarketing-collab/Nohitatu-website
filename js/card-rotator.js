/* ==========================================================================
   Horizontal Left-to-Right Sliding Card Rotator Engine + 3D Tilt Physics
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const stage = document.getElementById('card-rotator-stage');
  if (!stage) return;

  const cards = Array.from(stage.querySelectorAll('.rotator-card'));
  const dots = Array.from(stage.querySelectorAll('.rotator-dot'));
  const prevBtn = document.getElementById('rotator-prev');
  const nextBtn = document.getElementById('rotator-next');

  if (!cards.length) return;

  let currentIndex = 0;
  let autoTimer = null;
  const intervalMs = 4200; // 4.2 seconds per slide loop

  function setActiveCard(targetIndex, direction = 'next') {
    const prevIndex = currentIndex;
    currentIndex = (targetIndex + cards.length) % cards.length;

    cards.forEach((card, idx) => {
      card.style.transform = ''; // reset inline 3D tilt
      card.classList.remove('active', 'slide-left-out', 'slide-right-out', 'slide-left-in', 'slide-right-in');

      if (idx === currentIndex) {
        card.classList.add('active');
      } else if (idx === prevIndex) {
        if (direction === 'next') {
          card.classList.add('slide-left-out');
        } else {
          card.classList.add('slide-right-out');
        }
      }
    });

    dots.forEach((dot, idx) => {
      if (idx === currentIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  function nextCard() {
    setActiveCard(currentIndex + 1, 'next');
  }

  function prevCard() {
    setActiveCard(currentIndex - 1, 'prev');
  }

  function startAutoLoop() {
    stopAutoLoop();
    autoTimer = setInterval(nextCard, intervalMs);
  }

  function stopAutoLoop() {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
  }

  // 3D Parallax Tilt Effect on Active Card
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      if (!card.classList.contains('active')) return;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;

      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale(1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      if (card.classList.contains('active')) {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
      }
    });
  });

  // Event Listeners
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      nextCard();
      startAutoLoop();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prevCard();
      startAutoLoop();
    });
  }

  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      const dir = idx >= currentIndex ? 'next' : 'prev';
      setActiveCard(idx, dir);
      startAutoLoop();
    });
  });

  // Pause loop on mouse hover
  stage.addEventListener('mouseenter', stopAutoLoop);
  stage.addEventListener('mouseleave', startAutoLoop);

  // Initialize
  setActiveCard(0);
  startAutoLoop();
});
