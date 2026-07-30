/* ==========================================================================
   Nohitatu - Ultra-Premium Next-Gen UI Application Script (v2.0)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 2. Mouse Tracking Ambient Spotlight Effect
  document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    document.body.style.setProperty('--mouse-x', `${x}%`);
    document.body.style.setProperty('--mouse-y', `${y}%`);
  });

  // 3. Card Hover Spotlight Effect
  const cards = document.querySelectorAll('.luxe-card, .stat-box, .skill-pill-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--card-x', `${x}px`);
      card.style.setProperty('--card-y', `${y}px`);
    });
  });

  // 4. Theme Switcher
  const themeBtn = document.getElementById('theme-toggle-btn');
  const sunIcon = document.getElementById('icon-sun');
  const moonIcon = document.getElementById('icon-moon');
  const htmlEl = document.documentElement;

  const currentSavedTheme = localStorage.getItem('nohitatu_theme') || 'dark';
  setAppTheme(currentSavedTheme);

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = htmlEl.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      setAppTheme(next);
    });
  }

  function setAppTheme(theme) {
    htmlEl.setAttribute('data-theme', theme);
    localStorage.setItem('nohitatu_theme', theme);
    if (theme === 'light') {
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
    } else {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
    }
  }

  // 5. Solutions Tab Filtering
  const filterPills = document.querySelectorAll('.filter-pill');
  const luxeCards = document.querySelectorAll('.luxe-card');

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const filterVal = pill.getAttribute('data-filter');

      luxeCards.forEach(card => {
        const category = card.getAttribute('data-cat');
        if (filterVal === 'all' || category === filterVal) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 40);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 300);
        }
      });
    });
  });

  // 6. Interactive Budget Calculator
  const serviceSelect = document.getElementById('service');
  const scopeSelect = document.getElementById('scope');
  const priceDisplay = document.getElementById('price-display');
  const estimatorForm = document.getElementById('estimator-form');

  const budgetMatrix = {
    software: { small: '$10,000 - $16,000', medium: '$18,000 - $32,000', enterprise: '$45,000+' },
    saas: { small: '$12,000 - $22,000', medium: '$25,000 - $42,000', enterprise: '$55,000+' },
    rcm: { small: '$4,000 / mo', medium: '$8,500 / mo', enterprise: '$18,000+ / mo' },
    team: { small: '$4,500 / dev / mo', medium: '$9,000 / team / mo', enterprise: 'Enterprise Managed Rate' }
  };

  function updatePrice() {
    const service = serviceSelect.value;
    const scope = scopeSelect.value;
    if (budgetMatrix[service] && budgetMatrix[service][scope]) {
      priceDisplay.textContent = budgetMatrix[service][scope];
    }
  }

  if (serviceSelect && scopeSelect) {
    serviceSelect.addEventListener('change', updatePrice);
    scopeSelect.addEventListener('change', updatePrice);
    updatePrice();
  }

  if (estimatorForm) {
    estimatorForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const userName = document.getElementById('name').value;
      alert(`Thank you, ${userName}! Your formal estimation request has been dispatched. A Nohitatu technical director will connect with you shortly.`);
      estimatorForm.reset();
      updatePrice();
    });
  }
});
