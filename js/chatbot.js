/* ==========================================================================
   NohiAI — Nohitatu AI Support widget
   Calls FastAPI /api/chat; keeps branded panel + quick chips.
   Config: window.NOHI_CHAT_API or #chatbot-container[data-api]
   Default API: http://localhost:8010 (avoids common :8000 conflicts)
   Cache: ?v=20260820icons
   ========================================================================== */

function initNohiChatbot() {
  const toggleBtn = document.getElementById('chatbot-toggle');
  const chatWindow = document.getElementById('chatbot-window');
  const iconChat = document.getElementById('toggle-icon-chat');
  const iconClose = document.getElementById('toggle-icon-close');
  const messagesContainer = document.getElementById('chatbot-messages');
  const inputField = document.getElementById('chatbot-input');
  const sendBtn = document.getElementById('chatbot-send');
  const container = document.getElementById('chatbot-container');

  if (!toggleBtn || !chatWindow || !messagesContainer) return;
  if (toggleBtn.dataset.nohiBound === '1') return;
  toggleBtn.dataset.nohiBound = '1';

  const CONTACT_EMAIL = 'sales@nohitatu.com';
  const HR_EMAIL = 'hrd@nohitatu.com';
  const SALES_PHONE = '+91 99413 33444';
  const HR_PHONE = '+91 73974 59131';
  const MAX_HISTORY = 20;
  const HISTORY_CONTENT_MAX = 1500;

  /** Dual-tone mini-illustrations (brand violet + navy) — filled, not outline clones. */
  const TOPIC_ICONS = {
    products:
      '<svg class="chip-icon-svg" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="2" width="12.5" height="9.5" rx="2" fill="#1a2332"/><rect x="6.5" y="6.2" width="14.5" height="11.8" rx="2.2" fill="#726cf4"/><rect x="9" y="9" width="9.5" height="1.7" rx="0.7" fill="#fff"/><rect x="9" y="12.2" width="6.2" height="1.7" rx="0.7" fill="#fff" opacity=".55"/><circle cx="18.4" cy="19.1" r="4.1" fill="#1a2332"/><path d="M16.6 19.15l1.3 1.3 2.5-2.65" fill="none" stroke="#fff" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    healthcare:
      '<svg class="chip-icon-svg" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.1c2.35 1.55 4.55 2.15 6.7 2.15v6.9c0 4.55-3 7.7-6.7 9.45C8.3 18.85 5.3 15.7 5.3 11.15v-6.9C7.45 4.25 9.65 3.65 12 2.1z" fill="#726cf4"/><path d="M12 6.4v8.1M8.05 10.45h7.9" fill="none" stroke="#fff" stroke-width="2.15" stroke-linecap="round"/><circle cx="18.6" cy="18" r="3.85" fill="#1a2332"/><path d="M17 18.05l1.15 1.15 2.15-2.25" fill="none" stroke="#fff" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    hire:
      '<svg class="chip-icon-svg" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.2" y="3.4" width="17.6" height="12" rx="2.2" fill="#1a2332"/><rect x="4.8" y="4.9" width="14.4" height="8.4" rx="1.3" fill="#726cf4"/><path d="M9.1 7.6L7.2 9.1l1.9 1.5M14.9 7.6l1.9 1.5-1.9 1.5" fill="none" stroke="#fff" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/><rect x="11.2" y="8.35" width="1.6" height="2.9" rx="0.5" fill="#1a2332" opacity=".35"/><path d="M2.4 16.6h19.2c.5 0 .9.4.9.9v1.1c0 .7-.6 1.3-1.3 1.3H2.8c-.7 0-1.3-.6-1.3-1.3v-1.1c0-.5.4-.9.9-.9z" fill="#1a2332"/><rect x="8.2" y="17.35" width="7.6" height="1.35" rx="0.65" fill="#726cf4"/></svg>',
    sales:
      '<svg class="chip-icon-svg" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M5.2 4.2h10.8c1.7 0 3.1 1.4 3.1 3.1v5.2c0 1.7-1.4 3.1-3.1 3.1h-3.4l-3.6 3.1v-3.1H5.2c-1.7 0-3.1-1.4-3.1-3.1V7.3c0-1.7 1.4-3.1 3.1-3.1z" fill="#726cf4"/><circle cx="8.1" cy="9.85" r="1.15" fill="#fff"/><circle cx="11.6" cy="9.85" r="1.15" fill="#fff"/><circle cx="15.1" cy="9.85" r="1.15" fill="#fff"/><path d="M16.4 15.6c.55-.35 1.25-.2 1.65.3l1.05 1.35c.4.5.35 1.25-.15 1.7-1.15 1.05-3.05 1.45-5.05.35-2.35-1.3-4.25-3.2-5.55-5.55-1.1-2-.7-3.9.35-5.05.45-.5 1.2-.55 1.7-.15l1.35 1.05c.5.4.65 1.1.3 1.65l-.7 1.1c-.2.3-.15.7.1.95l2.05 2.05c.25.25.65.3.95.1l1.1-.7z" fill="#1a2332"/></svg>',
    careers:
      '<svg class="chip-icon-svg" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.2 18.8V13.4c0-.7.55-1.25 1.25-1.25h2.9c.7 0 1.25.55 1.25 1.25v5.4" fill="#1a2332"/><path d="M9.6 18.8V10.1c0-.7.55-1.25 1.25-1.25h2.9c.7 0 1.25.55 1.25 1.25v8.7" fill="#726cf4"/><path d="M15 18.8V6.6c0-.7.55-1.25 1.25-1.25h2.9c.7 0 1.25.55 1.25 1.25v12.2" fill="#1a2332"/><circle cx="17.4" cy="4.35" r="2.55" fill="#726cf4"/><path d="M17.4 3.15l.45 1.1 1.2.1-1 .75.3 1.15-1-.65-1 .65.3-1.15-1-.75 1.2-.1z" fill="#fff"/><rect x="2.4" y="19.35" width="19.2" height="1.9" rx="0.7" fill="#1a2332"/></svg>'
  };

  /** Knowledge-base replies keyed by menu topic (1:1 chip → answer). */
  const TOPIC_KB = {
    products:
      "Nohitatu has designed and shipped over 29 custom software products and enterprise client systems:\n\n" +
      "• **Healthcare RCM & CMS 1500 Claim Billing**\n" +
      "• **Sales CRM & Real-time Analytics**\n" +
      "• **Dojoman Event & Tournament Management**\n" +
      "• **HR Suite & Automated Payroll**\n" +
      "• **FinTechesh Financial Automation**\n\n" +
      "Explore full case studies and live demos at Portfolio.html!",
    healthcare:
      "Healthcare software & Revenue Cycle Management (RCM) is one of Nohitatu's flagship specializations:\n\n" +
      "• **Automated CMS-1500 & 837P electronic claim processing**\n" +
      "• **Patient eligibility verification & charge entry**\n" +
      "• **Denial management and HIPAA-compliant workflow dashboards**\n\n" +
      "Contact our sales specialists at " + CONTACT_EMAIL + " or " + SALES_PHONE + " to discuss your healthcare IT needs.",
    hire:
      "You can hire pre-vetted senior certified professionals — software developers, mobile app engineers, and UI/UX designers — from Nohitatu.\n\n" +
      "• **Flexible Engagement**: Dedicated Team, Time & Material, or Fixed Price models\n" +
      "• **Rapid Onboarding**: Dedicated teams of certified professionals onboard within 3 to 7 business days\n" +
      "• **Direct Integration**: Integrated directly into your tools, timezone, and product roadmap\n\n" +
      "Chat directly with our sales team at " + CONTACT_EMAIL + " or " + SALES_PHONE + " to get started!",
    sales:
      "Ready to scale your software product or get a custom cost estimation?\n\n" +
      "• **Sales Email**: " + CONTACT_EMAIL + "\n" +
      "• **Sales Phone**: " + SALES_PHONE + "\n" +
      "• **Online Request Form**: Contact-us.html\n" +
      "• **Explore Shipped Products**: Portfolio.html\n\n" +
      "Our team of certified professionals typically responds within 24 business hours for project consultations.",
    careers:
      "Looking to join Nohitatu? We are always hiring talented software engineers, QA leads, and UI designers!\n\n" +
      "• **View Open Roles**: Careers.html\n" +
      "• **Submit Resume**: PostResume.html\n" +
      "• **HR Contact Email**: " + HR_EMAIL + "\n" +
      "• **HR Phone**: " + HR_PHONE + "\n\n" +
      "For job inquiries, please contact our HR team directly."
  };

  const TOPIC_QUERIES = {
    products: 'Tell me about shipped products and portfolio',
    healthcare: 'Tell me about healthcare tech and RCM solutions',
    hire: 'How do I hire dedicated teams of certified professionals from Nohitatu?',
    sales: 'I want to contact sales for a free project quote',
    careers: 'Looking for a job at Nohitatu'
  };

  const TOPIC_LABELS = {
    products: 'Shipped Products',
    healthcare: 'Healthcare RCM',
    hire: 'Hire Developers',
    sales: 'Contact Sales',
    careers: 'Careers & Jobs'
  };

  /** @type {{ role: 'user'|'assistant', content: string }[]} */
  let conversationHistory = [];
  let isSending = false;

  function pageBase() {
    const path = (location.pathname || '').replace(/\\/g, '/');
    if (/\/blogs\//i.test(path)) return '../';
    return '';
  }

  function careersUrl() {
    return pageBase() + 'Careers.html';
  }

  function portfolioUrl() {
    return pageBase() + 'Portfolio.html';
  }

  function contactUrl() {
    return pageBase() + 'Contact-us.html';
  }

  function resolveApiBase() {
    const fromWindow = typeof window.NOHI_CHAT_API === 'string' ? window.NOHI_CHAT_API.trim() : '';
    const fromData = container && container.getAttribute('data-api')
      ? container.getAttribute('data-api').trim()
      : '';
    const base = (fromWindow || fromData || 'http://localhost:8010').replace(/\/$/, '');
    return base;
  }

  function setOpen(open) {
    chatWindow.classList.toggle('hidden', !open);
    if (open) {
      chatWindow.removeAttribute('inert');
      chatWindow.setAttribute('aria-hidden', 'false');
    } else {
      chatWindow.setAttribute('inert', '');
      chatWindow.setAttribute('aria-hidden', 'true');
    }
    if (iconChat) iconChat.classList.toggle('hidden', open);
    if (iconClose) iconClose.classList.toggle('hidden', !open);
    toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && inputField) {
      requestAnimationFrame(() => {
        inputField.focus({ preventScroll: true });
        scrollToBottom();
      });
    }
  }

  setOpen(false);

  function toggleChat() {
    setOpen(chatWindow.classList.contains('hidden'));
  }

  window.openNohiChat = function () {
    setOpen(true);
  };

  toggleBtn.addEventListener('click', toggleChat);

  const robotHotspot = document.getElementById('robot-interactive-overlay');
  const robotBubble = document.getElementById('robot-speech-bubble');

  function triggerEnergyWave(clientX, clientY) {
    const wave = document.createElement('div');
    wave.className = 'nohi-energy-wave';
    const x = clientX || window.innerWidth / 2;
    const y = clientY || window.innerHeight / 2;
    wave.style.left = `${x}px`;
    wave.style.top = `${y}px`;
    document.body.appendChild(wave);
    setTimeout(() => {
      wave.remove();
    }, 700);
  }

  function handleRobotClick(e) {
    if (e) {
      e.stopPropagation();
      triggerEnergyWave(e.clientX, e.clientY);
    } else {
      triggerEnergyWave();
    }
    setOpen(true);
  }

  if (robotHotspot) {
    robotHotspot.addEventListener('click', handleRobotClick);
    robotHotspot.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleRobotClick(e);
      }
    });
  }

  if (robotBubble) {
    robotBubble.addEventListener('click', handleRobotClick);

    const badgeTextEl = robotBubble.querySelector('.badge-text');
    if (badgeTextEl) {
      const speechPrompts = [
        "Hi I am NohiAI, How can i help ?",
        "Need a free project quote or estimation?",
        "Looking for dedicated teams of certified professionals?",
        "Ask about Healthcare Tech & RCM solutions!",
        "Explore open career roles & join our team!"
      ];
      let promptIndex = 0;

      setInterval(() => {
        badgeTextEl.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
        badgeTextEl.style.opacity = '0';
        badgeTextEl.style.transform = 'translateY(-3px)';

        setTimeout(() => {
          promptIndex = (promptIndex + 1) % speechPrompts.length;
          badgeTextEl.textContent = speechPrompts[promptIndex];
          badgeTextEl.style.opacity = '1';
          badgeTextEl.style.transform = 'translateY(0)';
        }, 350);
      }, 5500);
    }
  }

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    })[m]);
  }

  function formatBotHtml(raw) {
    let safe = escapeHtml(raw || '');
    safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/\r\n|\r|\n/g, '<br>');
    safe = safe.replace(/•\s*/g, '• ');
    safe = safe.replace(
      /\b([a-zA-Z0-9._%+-]+@nohitatu\.com)\b/g,
      '<a class="cb-cta" href="mailto:$1">$1</a>'
    );
    safe = safe.replace(
      /\+91\s*99413\s*33444|\+919941333344/g,
      '<a class="cb-cta" href="tel:+919941333344">+91 99413 33444</a>'
    );
    safe = safe.replace(
      /\+91\s*73974\s*59131|\+917397459131/g,
      '<a class="cb-cta" href="tel:+917397459131">+91 73974 59131</a>'
    );
    const pages = [
      ['Careers.html', careersUrl()],
      ['Portfolio.html', portfolioUrl()],
      ['Contact-us.html', contactUrl()],
      ['PostResume.html', pageBase() + 'PostResume.html']
    ];
    pages.forEach(([name, href]) => {
      const re = new RegExp(name.replace('.', '\\.'), 'gi');
      safe = safe.replace(re, `<a class="cb-cta" href="${href}">${name}</a>`);
    });
    return safe;
  }

  function chipLabelHtml(topic, label) {
    const icon = TOPIC_ICONS[topic] || '';
    const text = escapeHtml(label || TOPIC_LABELS[topic] || '');
    return `${icon}<span class="chip-label">${text}</span>`;
  }

  function mainPathChips() {
    return [
      { topic: 'products', label: TOPIC_LABELS.products, query: TOPIC_QUERIES.products },
      { topic: 'healthcare', label: TOPIC_LABELS.healthcare, query: TOPIC_QUERIES.healthcare },
      { topic: 'hire', label: TOPIC_LABELS.hire, query: TOPIC_QUERIES.hire },
      { topic: 'sales', label: TOPIC_LABELS.sales, query: TOPIC_QUERIES.sales },
      { topic: 'careers', label: TOPIC_LABELS.careers, query: TOPIC_QUERIES.careers }
    ];
  }

  function addUserMessage(text) {
    const userMsg = document.createElement('div');
    userMsg.className = 'chatbot-message user-message';
    const content = document.createElement('div');
    content.className = 'message-content';
    const p = document.createElement('p');
    p.textContent = text;
    content.appendChild(p);
    userMsg.appendChild(content);
    messagesContainer.appendChild(userMsg);
    scrollToBottom();
  }

  function addBotMessage(text, chips, chipLabel) {
    const botMsg = document.createElement('div');
    botMsg.className = 'chatbot-message bot-message';
    const content = document.createElement('div');
    content.className = 'message-content';
    const p = document.createElement('p');
    p.innerHTML = formatBotHtml(text);
    content.appendChild(p);
    botMsg.appendChild(content);
    messagesContainer.appendChild(botMsg);

    if (chips && chips.length) {
      const wrap = document.createElement('div');
      wrap.className = 'quick-chips' + (chips.length <= 2 ? ' quick-chips--row' : '');
      wrap.setAttribute('role', 'group');
      wrap.setAttribute('aria-label', chipLabel || 'Suggested next steps');

      const hint = document.createElement('span');
      hint.className = 'quick-chips-label';
      hint.textContent = chipLabel || 'Suggested';
      wrap.appendChild(hint);

      chips.forEach(chip => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chip-btn' + (chip.cta ? ' chip-btn--cta' : '');
        if (chip.topic && TOPIC_ICONS[chip.topic]) {
          btn.innerHTML = chipLabelHtml(chip.topic, chip.label);
        } else {
          btn.textContent = chip.label;
        }
        btn.setAttribute('data-query', chip.query || chip.label);
        if (chip.topic) btn.setAttribute('data-topic', chip.topic);
        if (chip.nav) btn.setAttribute('data-nav', chip.nav);
        if (chip.openOnly) btn.setAttribute('data-open-only', '1');
        wrap.appendChild(btn);
      });
      messagesContainer.appendChild(wrap);
      bindChipEvents(wrap);
    }

    scrollToBottom();
  }

  function showTypingIndicator() {
    if (document.getElementById('active-typing-indicator')) return;
    const indicator = document.createElement('div');
    indicator.id = 'active-typing-indicator';
    indicator.className = 'chatbot-message bot-message';
    indicator.setAttribute('aria-live', 'polite');
    indicator.innerHTML = `
      <div class="message-content">
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    messagesContainer.appendChild(indicator);
    scrollToBottom();
  }

  function removeTypingIndicator() {
    const indicator = document.getElementById('active-typing-indicator');
    if (indicator) indicator.remove();
  }

  function setInputBusy(busy) {
    isSending = busy;
    if (inputField) inputField.disabled = busy;
    if (sendBtn) {
      sendBtn.disabled = busy;
      sendBtn.setAttribute('aria-busy', busy ? 'true' : 'false');
    }
  }

  function pushHistory(role, content) {
    const trimmed = String(content || '').trim().slice(0, HISTORY_CONTENT_MAX);
    if (!trimmed) return;
    conversationHistory.push({ role, content: trimmed });
    if (conversationHistory.length > MAX_HISTORY) {
      conversationHistory = conversationHistory.slice(-MAX_HISTORY);
    }
  }

  function renderMainMenuHtml() {
    const chips = mainPathChips().map(chip =>
      `<button type="button" class="chip-btn" data-topic="${chip.topic}" data-query="${escapeHtml(chip.query)}">${chipLabelHtml(chip.topic, chip.label)}</button>`
    ).join('\n          ');
    return `
      <div class="chatbot-message bot-message">
          <div class="message-content">
              <p>Hi there, I'm Nohi AI. Need help designing, scaling, building your next software project or to join our team? Let's chat!</p>
          </div>
      </div>
      <div class="quick-chips" role="group" aria-label="Popular Questions">
          <span class="quick-chips-label">Popular Questions</span>
          ${chips}
      </div>
    `;
  }

  function resetToMainMenu() {
    conversationHistory = [];
    messagesContainer.innerHTML = renderMainMenuHtml();
    bindChipEvents(messagesContainer);
    scrollToBottom();
  }

  function chipsForReply(text, topic) {
    const t = (text || '').toLowerCase();
    let options = [];

    if (topic === 'careers' || /\bcareer|job|hiring|apply|vacanc|resume\b/.test(t)) {
      options = [
        { label: 'Open Careers', query: 'Open Careers', nav: careersUrl(), openOnly: true, cta: true },
        { topic: 'careers', label: 'Contact HR', query: 'How do I contact HR about careers?' }
      ];
    } else if (topic === 'products' || /\bportfolio|case stud|shipped product|our work\b/.test(t)) {
      options = [
        { label: 'Open portfolio', query: 'Open portfolio', nav: portfolioUrl(), openOnly: true, cta: true },
        { topic: 'sales', label: 'Start a project', query: TOPIC_QUERIES.sales }
      ];
    } else if (topic === 'sales' || topic === 'hire' || topic === 'healthcare' ||
      /\bcontact|sales@|email|phone|consultation|estimation|hire|dedicated|rcm|healthcare\b/.test(t)) {
      options = [
        { label: 'Open Contact form', query: 'Open contact form', nav: contactUrl(), openOnly: true, cta: true },
        { topic: 'sales', label: 'Email sales', query: 'Email sales at Nohitatu' }
      ];
    } else {
      options = [
        { topic: 'careers', label: 'Careers', query: TOPIC_QUERIES.careers },
        { topic: 'products', label: 'Portfolio', query: TOPIC_QUERIES.products },
        { topic: 'sales', label: 'Contact', query: TOPIC_QUERIES.sales }
      ];
    }
    options.push({ label: '↩ Back to Main Menu', query: 'SHOW_MAIN_MENU' });
    return options;
  }

  /** Infer topic from free-text when data-topic is absent. */
  function detectTopic(query) {
    const q = (query || '').toLowerCase().trim();

    if (/\b(job|jobs|career|careers|hiring|apply|vacanc|resume|recruit)\b/.test(q) ||
        /\bhrd@|\bhr\b/.test(q)) {
      return 'careers';
    }
    if (/\b(health|healthcare|rcm|medical billing|cms[-\s]?1500|837p|hipaa|claims)\b/.test(q)) {
      return 'healthcare';
    }
    if (/\b(hire|hiring developers|dedicated (developer|team|engineer)|staff(ing)? augmentation|outsource)\b/.test(q) ||
        /\b(developer|developers|engineers)\b/.test(q)) {
      return 'hire';
    }
    if (/\b(shipped|portfolio|case stud|products?\b.*\b(catalog|list|demo)|our products)\b/.test(q) ||
        /\b(dojoman|fintechesh|cms\s*1500)\b/.test(q)) {
      return 'products';
    }
    if (/\b(quote|sales|estimate|estimation|demo|consult|contact sales|free quote|pricing|cost)\b/.test(q) ||
        /\bsales@|start a project\b/.test(q)) {
      return 'sales';
    }
    return null;
  }

  function localFallbackReply(query) {
    const topic = detectTopic(query);
    if (topic && TOPIC_KB[topic]) return TOPIC_KB[topic];

    return (
      "I'm here to help with whatever you need! Whether you're building custom software, exploring healthcare solutions, or looking to join our team, we'd love to assist.\n\n" +
      "Direct Contacts:\n" +
      "• Sales: " + CONTACT_EMAIL + " | " + SALES_PHONE + "\n" +
      "• HR: " + HR_EMAIL + " | " + HR_PHONE
    );
  }

  async function fetchBotReply(userText) {
    const apiBase = resolveApiBase();
    const history = conversationHistory.slice(-MAX_HISTORY).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content).slice(0, HISTORY_CONTENT_MAX)
    }));

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 45000) : null;

    try {
      const res = await fetch(`${apiBase}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          message: userText.slice(0, 2000),
          conversation_history: history
        }),
        signal: controller ? controller.signal : undefined
      });

      if (!res.ok) {
        let detail = '';
        try {
          const errBody = await res.json();
          detail = errBody && errBody.detail ? String(errBody.detail) : '';
        } catch (_) { /* ignore */ }
        if (res.status === 503 || res.status === 502) {
          return localFallbackReply(userText);
        }
        if (res.status === 429) {
          return detail || 'You are sending messages too quickly. Please wait a moment and try again.';
        }
        return detail || localFallbackReply(userText);
      }

      const data = await res.json();
      const reply = data && data.reply != null ? String(data.reply).trim() : '';
      return reply || localFallbackReply(userText);
    } catch (_) {
      return localFallbackReply(userText);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async function handleSendMessage(customText, topicId) {
    const text = (customText || (inputField && inputField.value) || '').trim();
    if (!text || isSending) return;

    if (text === 'SHOW_MAIN_MENU') {
      if (inputField) inputField.value = '';
      messagesContainer.querySelectorAll('.quick-chips').forEach(el => el.remove());
      addBotMessage('Here are the main topics you can explore:', mainPathChips(), 'Popular Questions');
      return;
    }

    if (text === 'RESET_MAIN_MENU') {
      if (inputField) inputField.value = '';
      resetToMainMenu();
      return;
    }

    if (!customText && inputField) inputField.value = '';

    messagesContainer.querySelectorAll('.quick-chips').forEach(el => el.remove());

    const displayLabel = (topicId && TOPIC_LABELS[topicId]) || text;
    addUserMessage(displayLabel);
    setInputBusy(true);
    showTypingIndicator();

    try {
      let reply;
      let resolvedTopic = topicId && TOPIC_KB[topicId] ? topicId : detectTopic(text);

      // Known menu / intent topics always use the local KB (1:1 distinct answers).
      // Free-text that does not match a topic still goes to the API / fallback.
      if (resolvedTopic && TOPIC_KB[resolvedTopic]) {
        reply = TOPIC_KB[resolvedTopic];
      } else {
        reply = await fetchBotReply(text);
      }

      removeTypingIndicator();
      pushHistory('user', text);
      pushHistory('assistant', reply);
      addBotMessage(reply, chipsForReply(reply, resolvedTopic || topicId), 'Next step');
    } catch (_) {
      removeTypingIndicator();
      const reply = (topicId && TOPIC_KB[topicId]) || localFallbackReply(text);
      pushHistory('user', text);
      pushHistory('assistant', reply);
      addBotMessage(reply, mainPathChips(), 'Try one of these');
    } finally {
      setInputBusy(false);
      if (inputField) inputField.focus();
    }
  }

  function handleOpenOnly(label, navUrl) {
    addUserMessage(label);
    showTypingIndicator();
    setTimeout(() => {
      removeTypingIndicator();
      addBotMessage('Opening that page for you…');
      setTimeout(() => {
        window.location.href = navUrl;
      }, 350);
    }, 280);
  }

  function bindChipEvents(root) {
    const scope = root || document;
    scope.querySelectorAll('.chip-btn').forEach(btn => {
      if (btn.dataset.bound === '1') return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', e => {
        const el = e.currentTarget;
        const topic = el.getAttribute('data-topic') || '';
        const query = el.getAttribute('data-query') ||
          (topic && TOPIC_QUERIES[topic]) ||
          (el.querySelector('.chip-label') && el.querySelector('.chip-label').textContent) ||
          el.textContent;
        const nav = el.getAttribute('data-nav');
        const openOnly = el.getAttribute('data-open-only') === '1';

        if (openOnly && nav) {
          handleOpenOnly((el.querySelector('.chip-label') || el).textContent.trim(), nav);
          return;
        }

        handleSendMessage(String(query).trim(), topic || null);
      });
    });
  }

  if (sendBtn) sendBtn.addEventListener('click', () => handleSendMessage());
  if (inputField) {
    inputField.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    });

    const samplePrompts = [
      "Ask about custom AI & software engineering...",
      "How do dedicated teams of certified professionals work?",
      "Need a free project quote or consultation?",
      "Looking to join our engineering team?",
      "Ask about healthcare tech & RCM solutions..."
    ];
    let promptIndex = 0;
    setInterval(() => {
      if (!inputField.value.trim()) {
        promptIndex = (promptIndex + 1) % samplePrompts.length;
        inputField.placeholder = samplePrompts[promptIndex];
      }
    }, 3500);
  }

  // Upgrade any static HTML chips that still use emoji / missing data-topic
  messagesContainer.querySelectorAll('.chip-btn').forEach(btn => {
    let topic = btn.getAttribute('data-topic');
    if (!topic) {
      const q = (btn.getAttribute('data-query') || btn.textContent || '').toLowerCase();
      if (/shipped|portfolio|product/.test(q)) topic = 'products';
      else if (/health|rcm/.test(q)) topic = 'healthcare';
      else if (/hire|developer|team/.test(q)) topic = 'hire';
      else if (/sales|quote|project|contact/.test(q) && !/job|career/.test(q)) topic = 'sales';
      else if (/job|career/.test(q)) topic = 'careers';
      if (topic) btn.setAttribute('data-topic', topic);
    }
    if (topic && TOPIC_ICONS[topic]) {
      if (TOPIC_QUERIES[topic]) btn.setAttribute('data-query', TOPIC_QUERIES[topic]);
      btn.innerHTML = chipLabelHtml(topic, TOPIC_LABELS[topic]);
    }
  });

  bindChipEvents(messagesContainer);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNohiChatbot);
} else {
  initNohiChatbot();
}
