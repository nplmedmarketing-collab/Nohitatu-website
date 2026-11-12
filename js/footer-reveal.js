(function () {
  "use strict";

  function contactHref() {
    var path = (location.pathname || "").replace(/\\/g, "/");
    return /\/blogs\//i.test(path) ? "../Contact-us" : "Contact-us";
  }

  function isCareerFlowPage(body) {
    if (!body) return false;
    return (
      body.classList.contains("careers-page") ||
      body.classList.contains("career-detail-page") ||
      body.classList.contains("post-resume-page")
    );
  }

  function openApplicationHref() {
    var path = (location.pathname || "").replace(/\\/g, "/");
    return /\/blogs\//i.test(path) ? "../PostResume.html" : "PostResume.html";
  }

  function createOpenApplicationCta() {
    var section = document.createElement("section");
    section.className = "estimate footer-reveal-cta";
    section.setAttribute("aria-label", "Open application");
    section.innerHTML =
      '<div class="footer-reveal-shell">' +
        '<div class="estimate-panel">' +
          '<div class="estimate-copy">' +
            "<span>Still looking?</span>" +
            "<h2>Didn't find the role you are looking for? You can get in touch and we will get back to you if we find your profile suitable.</h2>" +
          "</div>" +
          '<a class="estimate-button" href="' +
      openApplicationHref() +
      '">' +
            'Apply now <span aria-hidden="true">\u2192</span>' +
          "</a>" +
        "</div>" +
      "</div>";
    return section;
  }

  function createCta() {
    if (isCareerFlowPage(document.body)) {
      return createOpenApplicationCta();
    }
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

  /** Keep careers CTA copy/button on the open-application path. */
  function ensureOpenApplicationCta(cta) {
    if (!cta || !isCareerFlowPage(document.body)) return;
    cta.setAttribute("aria-label", "Open application");
    var title = cta.querySelector(".estimate-copy h2");
    var eyebrow = cta.querySelector(".estimate-copy > span");
    var btn = cta.querySelector(".estimate-button");
    if (eyebrow) eyebrow.textContent = "Still looking?";
    if (title) {
      title.textContent =
        "Didn't find the role you are looking for? You can get in touch and we will get back to you if we find your profile suitable.";
    }
    if (btn) {
      btn.setAttribute("href", openApplicationHref());
      btn.innerHTML =
        'Apply now <span aria-hidden="true">\u2192</span>';
    }
  }

  function initFooterReveal() {
    var body = document.body;
    var footer = document.querySelector(".site-footer");
    if (!body || !footer) return;

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
    ensureOpenApplicationCta(cta);

    if (wrapper) {
      content = wrapper;
      if (footer.parentNode !== body) {
        wrapper.parentNode.insertBefore(footer, wrapper.nextSibling);
      }
    } else {
      content = (cta && cta.closest("main")) || document.querySelector("main") || document.querySelector("#wrapper");
    }

    if (!content) return;

    content.classList.add("footer-reveal-content");
    body.classList.add("footer-reveal-page");

    var syncFooterHeight = function () {
      var desktop = window.innerWidth > 820;
      var footerHeight = desktop ? Math.ceil(footer.getBoundingClientRect().height) : 0;
      if (footerHeight > 0) {
        body.style.setProperty("--footer-reveal-height", footerHeight + "px");
        body.classList.add("footer-reveal-ready");
      } else {
        body.classList.remove("footer-reveal-ready");
      }
    };

    syncFooterHeight();
    window.addEventListener("load", syncFooterHeight);
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
  window.initFooterReveal = initFooterReveal;
})();
