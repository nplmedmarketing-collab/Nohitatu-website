/* ==========================================================================
   Nohitatu Digital Concierge - Interactive Script (Abode Advisor Style)
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

  // Toggle Chatbot Window
  function toggleChat() {
    const isHidden = chatWindow.classList.contains('hidden');
    
    if (isHidden) {
      chatWindow.classList.remove('hidden');
      if (iconChat) iconChat.classList.add('hidden');
      if (iconClose) iconClose.classList.remove('hidden');
      inputField.focus();
      scrollToBottom();
    } else {
      chatWindow.classList.add('hidden');
      if (iconChat) iconChat.classList.remove('hidden');
      if (iconClose) iconClose.classList.add('hidden');
    }
  }

  toggleBtn.addEventListener('click', toggleChat);

  // Scroll Helper
  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Add User Message
  function addUserMessage(text) {
    const userMsg = document.createElement('div');
    userMsg.className = 'chatbot-message user-message';
    userMsg.innerHTML = `<div class="message-content"><p>${escapeHtml(text)}</p></div>`;
    messagesContainer.appendChild(userMsg);
    scrollToBottom();
  }

  // Add Bot Message
  function addBotMessage(text) {
    const botMsg = document.createElement('div');
    botMsg.className = 'chatbot-message bot-message';
    botMsg.innerHTML = `
      <div class="message-content">
        <p>${text}</p>
      </div>
    `;
    messagesContainer.appendChild(botMsg);
    scrollToBottom();
  }

  // Show Typing Indicator
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

  // Escape HTML
  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[m]);
  }

  // Smart Concierge Response Logic
  function generateAIResponse(query) {
    const q = query.toLowerCase();

    if (q.includes('software') || q.includes('saas') || q.includes('dev') || q.includes('product')) {
      return "💻 <strong>Software & SaaS Engineering Desk:</strong><br>We specialize in cloud-native SaaS development, web application engineering, and custom software solutions designed for scaling enterprises.";
    }

    if (q.includes('health') || q.includes('rcm') || q.includes('billing') || q.includes('medical')) {
      return "🩺 <strong>Healthcare RCM Concierge:</strong><br>Our Revenue Cycle Management desk handles end-to-end medical billing, denial resolution, claim processing, and healthcare workflow automation.";
    }

    if (q.includes('offshore') || q.includes('team') || q.includes('hire') || q.includes('staff')) {
      return "🌐 <strong>Offshore Engineering Teams:</strong><br>Build and scale high-performance dedicated software engineering teams with seamless integration into your product roadmap.";
    }

    if (q.includes('contact') || q.includes('call') || q.includes('estimation') || q.includes('email')) {
      return "📞 <strong>Digital Concierge Consultation:</strong><br>Ready to start your engagement?<br>📧 Email: sales@nohitatu.com<br>🌐 <a href='https://nohitatu.com/contact/Contactus.aspx' target='_blank' style='color:#d9532f;text-decoration:underline;'>Request Free Estimation</a>";
    }

    return "Thank you for reaching out to Nohitatu Concierge. How can our team assist your software development or healthcare IT requirements today?";
  }

  // Process Message
  function handleSendMessage(customText = null) {
    const text = customText || inputField.value.trim();
    if (!text) return;

    if (!customText) inputField.value = '';

    addUserMessage(text);
    showTypingIndicator();

    setTimeout(() => {
      removeTypingIndicator();
      const res = generateAIResponse(text);
      addBotMessage(res);
    }, 800);
  }

  // Bind Chip Events
  function bindChipEvents() {
    document.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const query = e.target.getAttribute('data-query') || e.target.innerText;
        handleSendMessage(query);
      });
    });
  }

  // Input Listeners
  sendBtn.addEventListener('click', () => handleSendMessage());
  inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSendMessage();
  });

  bindChipEvents();
});
