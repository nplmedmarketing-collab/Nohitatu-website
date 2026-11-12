/**
 * Site-wide back-to-top control.
 * Loaded via custom.js inject (and directly on pages that skip custom.js).
 */
(function () {
  "use strict";

  var SHOW_AFTER = 320;
  var btn = null;
  var ticking = false;

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function scrollTopY() {
    return Math.max(
      window.scrollY || window.pageYOffset || 0,
      document.documentElement.scrollTop || 0,
      document.body.scrollTop || 0
    );
  }

  function syncVisibility() {
    if (!btn) return;
    var show = scrollTopY() > SHOW_AFTER;
    btn.classList.toggle("is-visible", show);
    btn.setAttribute("aria-hidden", show ? "false" : "true");
    btn.tabIndex = show ? 0 : -1;
    ticking = false;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(syncVisibility);
  }

  function scrollToTop(event) {
    if (event) event.preventDefault();
    var reduce = prefersReducedMotion();
    if (window.__nhLenis && typeof window.__nhLenis.scrollTo === "function") {
      window.__nhLenis.scrollTo(0, { immediate: !!reduce, duration: 1.0 });
      return;
    }
    try {
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    } catch (err) {
      window.scrollTo(0, 0);
    }
  }

  function markChatbotPresence() {
    if (!document.body) return;
    var hasChat =
      !!document.getElementById("chatbot-toggle") ||
      !!document.querySelector(".chatbot-toggle");
    document.body.classList.toggle("nh-has-chatbot", hasChat);
  }

  function initBackToTop() {
    if (document.getElementById("nh-back-to-top")) return;

    btn = document.createElement("button");
    btn.type = "button";
    btn.id = "nh-back-to-top";
    btn.className = "nh-back-to-top";
    btn.setAttribute("aria-label", "Back to top");
    btn.setAttribute("title", "Back to top");
    btn.setAttribute("aria-hidden", "true");
    btn.tabIndex = -1;
    btn.innerHTML =
      '<span class="nh-back-to-top__icon" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" width="20" height="20" focusable="false">' +
          '<path fill="currentColor" d="M12 5.5l6.5 6.5-1.4 1.4L13 9.8V19h-2V9.8L6.9 13.4 5.5 12z"/>' +
        "</svg>" +
      "</span>";

    document.body.appendChild(btn);
    markChatbotPresence();
    btn.addEventListener("click", scrollToTop);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", markChatbotPresence, { passive: true });
    syncVisibility();

    // Chatbot markup may load slightly later on some pages.
    window.setTimeout(markChatbotPresence, 600);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBackToTop);
  } else {
    initBackToTop();
  }
})();
