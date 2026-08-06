/* ==========================================================================
   NohiAI — Nohitatu AI Support widget
   Calls FastAPI /api/chat; keeps branded panel + quick chips.
   Config: window.NOHI_CHAT_API or #chatbot-container[data-api]
   Default API: http://localhost:8010 (avoids common :8000 conflicts)
   Cache: ?v=20260806nohiai
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('chatbot-toggle');
  const chatWindow = document.getElementById('chatbot-window');
  const iconChat = document.getElementById('toggle-icon-chat');
  const iconClose = document.getElementById('toggle-icon-close');
  const messagesContainer = document.getElementById('chatbot-messages');
  const inputField = document.getElementById('chatbot-input');
  const sendBtn = document.getElementById('chatbot-send');
  const container = document.getElementById('chatbot-container');

  if (!toggleBtn || !chatWindow || !messagesContainer) return;

  const CONTACT_EMAIL = 'sales@nohitatu.com';
  const INFO_EMAIL = 'info@nohitatu.com';
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

  toggleBtn.addEventListener('click', toggleChat);

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
      { label: 'Looking for a job', query: 'Looking for a job' },
      { label: 'See our work', query: 'See our work' },
      { label: 'Start a project', query: 'Start a project' },
      { label: 'Our services', query: 'What services does Nohitatu offer?' }
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
    if (/\b(job|career|hiring|apply|vacanc|resume|hr)\b/.test(q)) {
      return (
        'Open roles and applications are on our Careers page: Careers.html. ' +
        `For HR: call ${HR_PHONE} or write to ${INFO_EMAIL}. ` +
        '(Live AI is temporarily unavailable.)'
      );
    }
    if (/\b(portfolio|work|project|case stud)\b/.test(q)) {
      return (
        'You can browse selected work on Portfolio.html. ' +
        `For a tailored walkthrough, email ${CONTACT_EMAIL} or call Sales at ${SALES_PHONE}. ` +
        '(Live AI is temporarily unavailable.)'
      );
    }
    if (/\b(contact|sales|project|estimate|demo|talk|call)\b/.test(q)) {
      return (
        `Happy to connect you with the team. Email ${CONTACT_EMAIL}, call Sales at ${SALES_PHONE}, ` +
        `HR at ${HR_PHONE}, or use Contact-us.html. (Live AI is temporarily unavailable.)`
      );
    }
    if (/\b(health|rcm|billing|medical)\b/.test(q)) {
      return (
        'Nohitatu supports healthcare RCM, medical billing, and related software/workflows. ' +
        `For a consultation: ${CONTACT_EMAIL} or Sales at ${SALES_PHONE}. ` +
        '(Live AI is temporarily unavailable.)'
      );
    }
    if (/\b(offshore|developer|software|saas|mobile|erp|ai)\b/.test(q)) {
      return (
        'Nohitatu offers custom & offshore software development, web & mobile apps, ERP, and AI solutions, ' +
        `plus dedicated offshore teams. Contact ${CONTACT_EMAIL} or use Contact-us.html. ` +
        '(Live AI is temporarily unavailable.)'
      );
    }
    return (
      'I can help with custom software, healthcare/RCM, offshore teams, careers, and contact options. ' +
      `Please try again shortly, or email ${CONTACT_EMAIL}.`
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
  }

  bindChipEvents(messagesContainer);
});
