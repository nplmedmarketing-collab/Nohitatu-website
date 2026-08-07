/* ==========================================================================
   NohiAI — Nohitatu AI Support widget
   Calls FastAPI /api/chat; keeps branded panel + quick chips.
   Config: window.NOHI_CHAT_API or #chatbot-container[data-api]
   Default API: http://localhost:8010 (avoids common :8000 conflicts)
   Cache: ?v=20260807openfix
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
    if (iconChat) iconChat.classList.toggle('hidden', open);
    if (iconClose) iconClose.classList.toggle('hidden', !open);
    toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && inputField) {
      inputField.focus();
      scrollToBottom();
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

  function handleRobotClick(e) {
    if (e) e.stopPropagation();
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
    safe = safe.replace(/\r\n|\r|\n/g, '<br>');
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
      { label: 'Custom AI & Software', query: 'Tell me about custom AI and software engineering' },
      { label: 'Dedicated Developer Teams', query: 'How do dedicated developer teams work?' },
      { label: 'Free Project Quote', query: 'Start a project' },
      { label: 'Healthcare Tech & RCM', query: 'Tell me about healthcare tech and RCM solutions' },
      { label: 'Join Our Team', query: 'Looking for a job' }
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

  function chipsForReply(text) {
    const t = (text || '').toLowerCase();
    if (/\bcareer|job|hiring|apply|vacanc|resume\b/.test(t)) {
      return [
        { label: 'Open Careers', query: 'Open Careers', nav: careersUrl(), openOnly: true, cta: true },
        { label: 'Contact HR', query: 'How do I contact about careers?' }
      ];
    }
    if (/\bportfolio|case stud|project we|our work\b/.test(t)) {
      return [
        { label: 'Open portfolio', query: 'Open portfolio', nav: portfolioUrl(), openOnly: true, cta: true },
        { label: 'Start a project', query: 'Start a project' }
      ];
    }
    if (/\bcontact|sales@|email|phone|consultation|estimation\b/.test(t)) {
      return [
        { label: 'Open Contact form', query: 'Open contact form', nav: contactUrl(), openOnly: true, cta: true },
        { label: 'Email sales', query: 'Email sales' }
      ];
    }
    return [
      { label: 'Careers', query: 'Looking for a job' },
      { label: 'Portfolio', query: 'See our work' },
      { label: 'Contact', query: 'Start a project' }
    ];
  }

  /** Offline / API-down guidance so the widget still helps visitors */
  function localFallbackReply(query) {
    const q = query.toLowerCase().trim();
    // Explicit phone / "how to call" — labeled numbers
    if (/\b(phone|telephone|phones)\b/.test(q) ||
        /\b(contact|sales|hr)\s+numbers?\b/.test(q) ||
        /\bphone\s*numbers?\b/.test(q) ||
        /\bhow (can|do) i (call|reach|contact)\b/.test(q)) {
      return (
        "Contact Numbers:\n\n" +
        "• Sales & Projects: +91 99413 33444 (sales@nohitatu.com)\n" +
        "• HR & Recruitment: +91 73974 59131 (hrd@nohitatu.com)"
      );
    }
    // HR & Career Queries — Clean professional text without emojis
    if (/\b(job|career|hiring|apply|vacanc|resume|hr|recruit)\b/.test(q)) {
      return (
        "We'd love to have you on our team! You can check out all our current open roles and apply on our Careers.html page.\n\n" +
        "If you have any questions, feel free to call our HR team at +91 73974 59131 or email hrd@nohitatu.com. We'd love to connect!"
      );
    }
    if (/\b(portfolio|work|case stud)\b/.test(q)) {
      return (
        "We're proud of the digital products and custom software solutions we've built! You can explore our featured case studies and live projects on Portfolio.html.\n\n" +
        "Request a tailored walkthrough:\n" +
        "• Email: sales@nohitatu.com\n" +
        "• Phone: +91 99413 33444"
      );
    }
    if (/\b(contact|sales|project|estimate|estimation|demo|talk|call|consult)\b/.test(q)) {
      return (
        "We'd love to help bring your ideas to life! Whether you need custom software development, an AI solution, or a dedicated developer team, we're ready to jump in.\n\n" +
        "Reach our team directly:\n" +
        "• Email: sales@nohitatu.com\n" +
        "• Phone: +91 99413 33444\n" +
        "• Form: Contact-us.html"
      );
    }
    if (/\b(health|rcm|billing|medical)\b/.test(q)) {
      return (
        "Nohitatu brings deep expertise in healthcare RCM, medical billing, and custom health-tech software.\n\n" +
        "Schedule a consultation:\n" +
        "• Email: sales@nohitatu.com\n" +
        "• Phone: +91 99413 33444"
      );
    }
    if (/\b(global|developer|software|saas|mobile|erp|ai)\b/.test(q)) {
      return (
        "We build scalable custom software, web & mobile applications, AI solutions, and dedicated engineering teams to accelerate your business goals.\n\n" +
        "Chat directly with our team:\n" +
        "• Email: sales@nohitatu.com\n" +
        "• Phone: +91 99413 33444\n" +
        "• Contact: Contact-us.html"
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
