/* ==========================================================================
   NohiAI — Nohitatu AI Support widget
   Calls FastAPI /api/chat; keeps branded panel + quick chips.
   Config: window.NOHI_CHAT_API or #chatbot-container[data-api]
   Default API: http://localhost:8010 (avoids common :8000 conflicts)
   Cache: ?v=20260807noflicker
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
    // Keep focus out of the closed panel (we no longer use display:none)
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
      // Focus after opacity/visibility paint so open doesn't flash solid white
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

  // Robot interactive bubble & hotspot listeners (Hero 3D Robot)
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

    // Dynamic Rotating Speech Prompts
    const badgeTextEl = robotBubble.querySelector('.badge-text');
    if (badgeTextEl) {
      const speechPrompts = [
        "Hi I am NohiAI, How can i help ?",
        "Need a free project quote or estimation?",
        "Looking for dedicated developer teams?",
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

  /** Escape bot text, preserve line breaks, link only known-safe patterns. */
  function formatBotHtml(raw) {
    let safe = escapeHtml(raw || '');
    // Convert markdown bold **text** to <strong>text</strong>
    safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/\r\n|\r|\n/g, '<br>');
    // Convert bullet breaks cleanly
    safe = safe.replace(/•\s*/g, '• ');
    // Auto-link company emails
    safe = safe.replace(
      /\b([a-zA-Z0-9._%+-]+@nohitatu\.com)\b/g,
      '<a class="cb-cta" href="mailto:$1">$1</a>'
    );
    // Phones published on site (Sales + HR)
    safe = safe.replace(
      /\+91\s*99413\s*33444|\+919941333344/g,
      '<a class="cb-cta" href="tel:+919941333344">+91 99413 33444</a>'
    );
    safe = safe.replace(
      /\+91\s*73974\s*59131|\+917397459131/g,
      '<a class="cb-cta" href="tel:+917397459131">+91 73974 59131</a>'
    );
    // Internal page names the model is instructed to mention
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

  function mainPathChips() {
    return [
      { label: '📦 Shipped Products', query: 'Tell me about shipped products and portfolio' },
      { label: '🩺 Healthcare RCM', query: 'Tell me about healthcare tech and RCM solutions' },
      { label: '🚀 Hire Developers', query: 'How do dedicated developer teams work?' },
      { label: '📞 Contact Sales', query: 'Start a project or free quote' },
      { label: '📄 Careers & Jobs', query: 'Looking for a job' }
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
        btn.textContent = chip.label;
        btn.setAttribute('data-query', chip.query || chip.label);
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

  function resetToMainMenu() {
    conversationHistory = [];
    messagesContainer.innerHTML = `
      <div class="chatbot-message bot-message">
          <div class="message-content">
              <p>Hi there, I'm Nohi AI. Need help designing, scaling, building your next software project or to join our team? Let's chat!</p>
          </div>
      </div>
      <div class="quick-chips" role="group" aria-label="Popular Questions">
          <span class="quick-chips-label">Popular Questions</span>
          <button class="chip-btn" data-query="Tell me about shipped products and portfolio">📦 Shipped Products</button>
          <button class="chip-btn" data-query="Tell me about healthcare tech and RCM solutions">🩺 Healthcare RCM</button>
          <button class="chip-btn" data-query="How do dedicated developer teams work?">🚀 Hire Developers</button>
          <button class="chip-btn" data-query="Start a project or free quote">📞 Contact Sales</button>
          <button class="chip-btn" data-query="Looking for a job">📄 Careers &amp; Jobs</button>
      </div>
    `;
    bindChipEvents(messagesContainer);
    scrollToBottom();
  }

  function chipsForReply(text) {
    const t = (text || '').toLowerCase();
    let options = [];
    if (/\bcareer|job|hiring|apply|vacanc|resume\b/.test(t)) {
      options = [
        { label: 'Open Careers', query: 'Open Careers', nav: careersUrl(), openOnly: true, cta: true },
        { label: 'Contact HR', query: 'How do I contact about careers?' }
      ];
    } else if (/\bportfolio|case stud|project we|our work\b/.test(t)) {
      options = [
        { label: 'Open portfolio', query: 'Open portfolio', nav: portfolioUrl(), openOnly: true, cta: true },
        { label: 'Start a project', query: 'Start a project' }
      ];
    } else if (/\bcontact|sales@|email|phone|consultation|estimation\b/.test(t)) {
      options = [
        { label: 'Open Contact form', query: 'Open contact form', nav: contactUrl(), openOnly: true, cta: true },
        { label: 'Email sales', query: 'Email sales' }
      ];
    } else {
      options = [
        { label: 'Careers', query: 'Looking for a job' },
        { label: 'Portfolio', query: 'See our work' },
        { label: 'Contact', query: 'Start a project' }
      ];
    }
    options.push({ label: '↩ Back to Main Menu', query: 'SHOW_MAIN_MENU' });
    return options;
  }

  /** Client-side RAG fallback engine when Python API server is offline */
  function localFallbackReply(query) {
    const q = query.toLowerCase().trim();

    // 1. Shipped Products & Portfolio
    if (/\b(shipped|product|products|portfolio|work|case stud)\b/.test(q)) {
      return (
        "Nohitatu has designed and shipped over 29 custom software products and enterprise client systems:\n\n" +
        "• **Healthcare RCM & CMS 1500 Claim Billing**\n" +
        "• **Sales CRM & Real-time Analytics**\n" +
        "• **Dojoman Event & Tournament Management**\n" +
        "• **HR Suite & Automated Payroll**\n" +
        "• **FinTechesh Financial Automation**\n\n" +
        "Explore full case studies and live demos at Portfolio.html!"
      );
    }

    // 2. Healthcare Tech & RCM
    if (/\b(health|rcm|billing|medical|cms)\b/.test(q)) {
      return (
        "Healthcare software & Revenue Cycle Management (RCM) is one of Nohitatu's flagship specializations:\n\n" +
        "• **Automated CMS-1500 & 837P electronic claim processing**\n" +
        "• **Patient eligibility verification & charge entry**\n" +
        "• **Denial management and HIPAA-compliant workflow dashboards**\n\n" +
        "Contact our sales specialists at sales@nohitatu.com or +91 99413 33444 to discuss your healthcare IT needs."
      );
    }

    // 3. Hire Developers & Dedicated Teams
    if (/\b(developer|developers|team|teams|hire|engineers|staffing)\b/.test(q)) {
      return (
        "You can hire pre-vetted senior dedicated software developers, mobile app engineers, and UI/UX designers from Nohitatu.\n\n" +
        "• **Flexible Engagement**: Dedicated Team, Time & Material, or Fixed Price models\n" +
        "• **Rapid Onboarding**: Dedicated engineering teams onboard within 3 to 7 business days\n" +
        "• **Direct Integration**: Integrated directly into your tools, timezone, and product roadmap\n\n" +
        "Chat directly with our sales team at sales@nohitatu.com or +91 99413 33444 to get started!"
      );
    }

    // 4. Careers & HR Jobs
    if (/\b(job|jobs|career|careers|hiring|apply|vacanc|resume|hr|recruit)\b/.test(q)) {
      return (
        "Looking to join Nohitatu? We are always hiring talented software engineers, QA leads, and UI designers!\n\n" +
        "• **View Open Roles**: Careers.html\n" +
        "• **Submit Resume**: PostResume.html\n" +
        "• **HR Contact Email**: hrd@nohitatu.com\n" +
        "• **HR Phone**: +91 73974 59131\n\n" +
        "For job inquiries, please contact our HR team directly."
      );
    }

    // 5. Contact Sales & Quotes
    if (/\b(quote|sales|project|estimate|estimation|demo|talk|call|consult|contact|phone)\b/.test(q)) {
      return (
        "Ready to scale your software product or get a custom cost estimation?\n\n" +
        "• **Sales Email**: sales@nohitatu.com\n" +
        "• **Sales Phone**: +91 99413 33444\n" +
        "• **Online Request Form**: Contact-us.html\n" +
        "• **Explore Shipped Products**: Portfolio.html\n\n" +
        "Our team typically responds within 24 business hours for project consultations."
      );
    }

    return (
      "I'm here to help with whatever you need! Whether you're building custom software, exploring healthcare solutions, or looking to join our team, we'd love to assist.\n\n" +
      "Direct Contacts:\n" +
      "• Sales: sales@nohitatu.com | +91 99413 33444\n" +
      "• HR: hrd@nohitatu.com | +91 73974 59131"
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

  async function handleSendMessage(customText) {
    const text = (customText || (inputField && inputField.value) || '').trim();
    if (!text || isSending) return;

    if (text === 'SHOW_MAIN_MENU' || text === 'RESET_MAIN_MENU') {
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

    // Remove trailing chip rows after a free-text or chip submission
    messagesContainer.querySelectorAll('.quick-chips').forEach(el => el.remove());

    addUserMessage(text);
    setInputBusy(true);
    showTypingIndicator();

    try {
      const reply = await fetchBotReply(text);
      removeTypingIndicator();
      pushHistory('user', text);
      pushHistory('assistant', reply);
      addBotMessage(reply, chipsForReply(reply), 'Next step');
    } catch (_) {
      removeTypingIndicator();
      const reply = localFallbackReply(text);
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
        const query = el.getAttribute('data-query') || el.textContent;
        const nav = el.getAttribute('data-nav');
        const openOnly = el.getAttribute('data-open-only') === '1';

        if (openOnly && nav) {
          handleOpenOnly(el.textContent.trim(), nav);
          return;
        }

        handleSendMessage(query);
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

    // Dynamic cycling sample prompts for chat text box
    const samplePrompts = [
      "Ask about custom AI & software engineering...",
      "How do dedicated developer teams work?",
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

  bindChipEvents(messagesContainer);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNohiChatbot);
} else {
  initNohiChatbot();
}
