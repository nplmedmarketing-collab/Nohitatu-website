/* ==========================================================================
   Nohitatu Digital Concierge — guided conversation (flow3)
   Cache: ?v=20260803contact
   Panel starts closed (FAB only); opened only via toggle.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('chatbot-toggle');
  const chatWindow = document.getElementById('chatbot-window');
  const iconChat = document.getElementById('toggle-icon-chat');
  const iconClose = document.getElementById('toggle-icon-close');
  const messagesContainer = document.getElementById('chatbot-messages');
  const inputField = document.getElementById('chatbot-input');
  const sendBtn = document.getElementById('chatbot-send');

  if (!toggleBtn || !chatWindow) return;

  const CONTACT_EMAIL = 'sales@nohitatu.com';
  const TYPING_MS = 550;

  /** Relative base for Careers / Portfolio / Contact (blogs live one level down). */
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

  /**
   * Conversation steps:
   * idle → awaiting_portfolio → awaiting_contact → done
   */
  let funnelStep = 'idle';

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

  // Always start closed (FAB only) — never auto-open on load
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
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[m]);
  }

  function addUserMessage(text) {
    const userMsg = document.createElement('div');
    userMsg.className = 'chatbot-message user-message';
    userMsg.innerHTML = `<div class="message-content"><p>${escapeHtml(text)}</p></div>`;
    messagesContainer.appendChild(userMsg);
    scrollToBottom();
  }

  function mainPathChips() {
    return [
      { label: 'Looking for a job', query: 'Looking for a job' },
      { label: 'See our work', query: 'See our work' },
      { label: 'Start a project', query: 'Start a project' }
    ];
  }

  function addBotMessage(html, chips, chipLabel) {
    const botMsg = document.createElement('div');
    botMsg.className = 'chatbot-message bot-message';
    botMsg.innerHTML = `
      <div class="message-content">
        <p>${html}</p>
      </div>
    `;
    messagesContainer.appendChild(botMsg);

    if (chips && chips.length) {
      const wrap = document.createElement('div');
      wrap.className = 'quick-chips' + (chips.length <= 2 ? ' quick-chips--row' : '');
      wrap.setAttribute('role', 'group');
      wrap.setAttribute('aria-label', chipLabel || 'Choose a reply');

      const hint = document.createElement('span');
      hint.className = 'quick-chips-label';
      hint.textContent = chipLabel || 'Choose a reply';
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
    const indicator = document.createElement('div');
    indicator.id = 'active-typing-indicator';
    indicator.className = 'chatbot-message bot-message';
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

  function replyWithTyping(res) {
    showTypingIndicator();
    setTimeout(() => {
      removeTypingIndicator();
      addBotMessage(res.html, res.chips, res.chipLabel);
    }, TYPING_MS);
  }

  function isYes(q) {
    return /^(yes|yeah|yep|yup|sure|ok|okay|please|absolutely|definitely|of course|sounds good|let'?s go|i'?d like|i want)\b/.test(q)
      || q === 'y'
      || /\b(yes please|show me|take me)\b/.test(q);
  }

  function isNo(q) {
    return /^(no|nope|nah|not now|maybe later|skip|pass)\b/.test(q)
      || q === 'n'
      || /\b(no thanks|not interested|not right now)\b/.test(q);
  }

  function isCareersIntent(q) {
    return /\b(looking for a job|job|jobs|career|careers|hiring|apply|application|vacanc|opening|work with (you|us)|join (your |the )?team)\b/.test(q)
      || /apply for a job/.test(q);
  }

  function isPortfolioIntent(q) {
    return /\b(see our work|portfolio|projects?|case stud|work we('ve| have)? (done|completed)|see (your |our )?work)\b/.test(q);
  }

  function isContactIntent(q) {
    return /\b(start a project|contact|call|estimation|estimate|email|demo|get started|talk to (sales|someone)|free estimation|let'?s talk)\b/.test(q);
  }

  function isSomethingElse(q) {
    return /\b(something else|other|not sure|just browsing)\b/.test(q);
  }

  function careersReply() {
    funnelStep = 'awaiting_portfolio';
    const href = careersUrl();
    return {
      html:
        `Great — open roles and the apply form are on our Careers page.<br>` +
        `<a class="cb-cta" href="${href}">Open Careers</a><br><br>` +
        `Want to see projects we’ve completed?`,
      chipLabel: 'Reply',
      chips: [
        { label: 'Yes', query: 'Yes' },
        { label: 'No', query: 'No' }
      ]
    };
  }

  function portfolioOfferReply() {
    funnelStep = 'awaiting_contact';
    const href = portfolioUrl();
    return {
      html:
        `Here’s a look at work we’ve shipped.<br>` +
        `<a class="cb-cta" href="${href}">Open portfolio</a><br><br>` +
        `Ready to start a project with us?`,
      chipLabel: 'Reply',
      chips: [
        { label: 'Open portfolio', query: 'Open portfolio', nav: href, openOnly: true, cta: true },
        { label: 'Yes — let’s talk', query: 'Yes, get started' },
        { label: 'Not right now', query: 'Not right now' }
      ]
    };
  }

  function contactReply() {
    funnelStep = 'done';
    const href = contactUrl();
    return {
      html:
        `Happy to help you get started.<br>` +
        `Email <a class="cb-cta" href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> or use the contact form.`,
      chipLabel: 'Next step',
      chips: [
        { label: 'Open Contact form', query: 'Open contact form', nav: href, openOnly: true, cta: true },
        { label: 'Looking for a job', query: 'Looking for a job' },
        { label: 'See our work', query: 'See our work' }
      ]
    };
  }

  function declinePortfolioReply() {
    funnelStep = 'awaiting_contact';
    return {
      html: `No problem. Ready to start a project with us?`,
      chipLabel: 'Reply',
      chips: [
        { label: 'Yes — let’s talk', query: 'Yes, get started' },
        { label: 'Not right now', query: 'Not right now' }
      ]
    };
  }

  function declineContactReply() {
    funnelStep = 'idle';
    return {
      html: `Understood — I’m here whenever you need me. What would you like to do?`,
      chipLabel: 'Choose one',
      chips: mainPathChips()
    };
  }

  function somethingElseReply() {
    funnelStep = 'idle';
    return {
      html: `No problem — tell me what you need, or pick one of these:`,
      chipLabel: 'Choose one',
      chips: mainPathChips()
    };
  }

  function topicSoftware() {
    funnelStep = 'idle';
    return {
      html:
        `We build cloud-native SaaS, web apps, and custom software for teams that need to scale.<br><br>` +
        `What would you like to do next?`,
      chipLabel: 'Choose one',
      chips: mainPathChips()
    };
  }

  function topicHealthcare() {
    funnelStep = 'idle';
    return {
      html:
        `Our healthcare RCM desk covers billing, denials, claims, and workflow automation.<br><br>` +
        `What would you like to do next?`,
      chipLabel: 'Choose one',
      chips: mainPathChips()
    };
  }

  function topicOffshore() {
    funnelStep = 'idle';
    return {
      html:
        `We help you build dedicated offshore engineering teams that plug into your roadmap.<br><br>` +
        `What would you like to do next?`,
      chipLabel: 'Choose one',
      chips: mainPathChips()
    };
  }

  function fallbackReply() {
    funnelStep = 'idle';
    return {
      html: `Thanks — I can help with careers, our portfolio, or starting a project. What brings you here?`,
      chipLabel: 'Choose one',
      chips: [
        ...mainPathChips(),
        { label: 'Something else', query: 'Something else' }
      ]
    };
  }

  function generateResponse(query) {
    const q = query.toLowerCase().trim();

    // Funnel: after careers — portfolio yes/no
    if (funnelStep === 'awaiting_portfolio') {
      if (isYes(q) || isPortfolioIntent(q)) return portfolioOfferReply();
      if (isNo(q)) return declinePortfolioReply();
      // Fall through if they switch topic
    }

    // Funnel: after portfolio — contact yes/no
    if (funnelStep === 'awaiting_contact') {
      if (isYes(q) || isContactIntent(q)) return contactReply();
      if (isNo(q)) return declineContactReply();
    }

    if (isSomethingElse(q)) return somethingElseReply();

    if (isCareersIntent(q)) return careersReply();

    if (isPortfolioIntent(q)) return portfolioOfferReply();

    if (isContactIntent(q)) return contactReply();

    if (/\b(software|saas|web app|custom software|product)\b/.test(q) || q === 'software services') {
      return topicSoftware();
    }

    if (/\b(health|rcm|billing|medical)\b/.test(q)) {
      return topicHealthcare();
    }

    if (/\b(offshore|dedicated team|staff augment|outsource)\b/.test(q)) {
      return topicOffshore();
    }

    return fallbackReply();
  }

  function handleSendMessage(customText) {
    const text = (customText || (inputField && inputField.value) || '').trim();
    if (!text) return;

    if (!customText && inputField) inputField.value = '';

    addUserMessage(text);
    replyWithTyping(generateResponse(text));
  }

  /** Explicit “Open …” chips: navigate only when the user clicks — no surprise redirect. */
  function handleOpenOnly(label, navUrl) {
    addUserMessage(label);
    showTypingIndicator();
    setTimeout(() => {
      removeTypingIndicator();
      addBotMessage(`Opening that page for you…`);
      setTimeout(() => {
        window.location.href = navUrl;
      }, 400);
    }, Math.min(TYPING_MS, 400));
  }

  function bindChipEvents(root) {
    const scope = root || document;
    scope.querySelectorAll('.chip-btn').forEach(btn => {
      if (btn.dataset.bound === '1') return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', (e) => {
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
    inputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSendMessage();
    });
  }

  bindChipEvents(messagesContainer);
});
