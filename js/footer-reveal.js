(function () {
  "use strict";

  function contactHref() {
    var path = (location.pathname || "").replace(/\\/g, "/");
    return /\/blogs\//i.test(path) ? "../Contact-us.html" : "Contact-us.html";
  }

  function createCta() {
    var section = document.createElement("section");
    section.className = "estimate footer-reveal-cta";
    section.setAttribute("aria-labelledby", "footer-reveal-title");
    section.innerHTML =
      '<div class="footer-reveal-shell">' +
        '<div class="estimate-panel">' +
          '<div class="estimate-copy">' +
            '<span>Let\u2019s work together</span>' +
            '<h2 id="footer-reveal-title">Schedule an appointment with us to discuss your goals and needs.</h2>' +
          '</div>' +
          '<a class="estimate-button" href="' + contactHref() + '">' +
            'Let\u2019s get in touch <span aria-hidden="true">\u2192</span>' +
          '</a>' +
        '</div>' +
      '</div>';
    return section;
  }

  function initFooterReveal() {
    var body = document.body;
    var footer = document.querySelector(".site-footer");
    if (!body || !footer || body.classList.contains("footer-reveal-page")) return;

    var isContactPage = body.classList.contains("contact-page");
    var wrapper = footer.closest("#wrapper");
    var cta = document.querySelector(".footer-reveal-cta");
    var content;

    if (!cta && !isContactPage) {
      cta = createCta();
      if (wrapper) {
        footer.parentNode.insertBefore(cta, footer);
      } else {
        var main = document.querySelector("main");
        if (main) {
          main.appendChild(cta);
        } else {
          footer.parentNode.insertBefore(cta, footer);
        }
      }
    } else if (cta) {
      cta.classList.add("footer-reveal-cta");
    }

    if (wrapper) {
      content = wrapper;
      if (footer.parentNode !== body) {
        wrapper.parentNode.insertBefore(footer, wrapper.nextSibling);
      }
    } else {
      content = (cta && cta.closest("main")) || document.querySelector("main");
    }

    if (!content) return;

    content.classList.add("footer-reveal-content");
    body.classList.add("footer-reveal-page");

    var syncFooterHeight = function () {
      var desktop = window.innerWidth > 820;
      var footerHeight = desktop ? Math.ceil(footer.getBoundingClientRect().height) : 0;
      body.style.setProperty("--footer-reveal-height", footerHeight + "px");
      body.classList.toggle("footer-reveal-ready", desktop && footerHeight > 0);
    };

    syncFooterHeight();
    window.addEventListener("load", syncFooterHeight, { once: true });
    window.addEventListener("resize", syncFooterHeight);

    if ("ResizeObserver" in window) {
      new ResizeObserver(syncFooterHeight).observe(footer);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFooterReveal);
  } else {
    initFooterReveal();
  }
})();
