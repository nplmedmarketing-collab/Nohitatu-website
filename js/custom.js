// Load the shared CTA and fixed-footer reveal before legacy page scripts run.
(function () {
  var currentScript = document.currentScript;
  if (!currentScript || !currentScript.src) return;

  ['footer-reveal.js', 'mobile-nav.js', 'back-to-top.js'].forEach(function (name) {
    var script = document.createElement('script');
    var url = new URL(name, currentScript.src);
    // Soft-bump when custom.js itself is versioned (?v=...) so CTA/footer fixes land.
    if (currentScript.src.indexOf('?') !== -1) {
      url.search = currentScript.src.split('?')[1];
    }
    script.src = url.href;
    script.defer = true;
    document.head.appendChild(script);
  });
})();

// Bulletproof header & logo controller:
// - Over dark hero banner: white logo (.blnk-header)
// - Past hero / light chrome: black logo (.white-header)
// Homepage (lmn-homepage) keeps black logo via CSS regardless of these classes.
// Curtain pages use sticky heroes — detect via the scrolling panel, not hero bottom.
(function () {
  function heroPastHeader() {
    var panel = document.querySelector(".nh-curtain-panel");
    if (panel) {
      // Panel has scrolled up over the sticky hero.
      return panel.getBoundingClientRect().top <= 100;
    }

    var hero = document.querySelector(
      ".nh-curtain-banner, #portfolio-hero, .about-hero, .people-hero, .life-hero, .contact-hero, .sd-hero, .top-banner, .page-hero, .nh-careers-banner"
    );
    if (!hero) {
      return Math.max(window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0, 0) >= 60;
    }
    return hero.getBoundingClientRect().bottom <= 96;
  }

  function syncHeaderChrome() {
    var headers = document.querySelectorAll("header.logo-navbar, body > header");
    if (!headers.length) return;

    // Homepage: leave class toggling alone; CSS forces black logo either way.
    if (document.body && document.body.classList.contains("lmn-homepage")) {
      return;
    }

    var isPastHero = heroPastHeader();
    headers.forEach(function (h) {
      if (h.classList.contains("open-menu")) {
        h.classList.remove("white-header");
      } else if (h.classList.contains("show-menu")) {
        h.classList.remove("white-header");
        h.classList.add("blnk-header");
      } else if (isPastHero) {
        h.classList.remove("blnk-header");
        h.classList.add("white-header");
      } else {
        h.classList.remove("white-header");
        h.classList.add("blnk-header");
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncHeaderChrome);
  } else {
    syncHeaderChrome();
  }
  window.addEventListener("scroll", syncHeaderChrome, { passive: true });
  window.addEventListener("resize", syncHeaderChrome, { passive: true });
  window.syncHeaderChrome = syncHeaderChrome;
})();

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
      var main = document.querySelector("main");
      /* Career flow: keep CTA as a sibling after the form/details panel, not inside it. */
      if (isCareerFlowPage(body) && main) {
        main.appendChild(cta);
      } else {
        var panel = document.querySelector(".nh-curtain-panel");
        if (panel) {
          panel.appendChild(cta);
        } else if (main) {
          main.appendChild(cta);
        } else if (wrapper) {
          footer.parentNode.insertBefore(cta, footer);
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

  function bootFooterReveal() {
    initFooterReveal();
    /* Re-assert after other deferred scripts so a stale cached sibling can't win. */
    window.addEventListener("load", function () {
      ensureOpenApplicationCta(document.querySelector(".footer-reveal-cta"));
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootFooterReveal);
  } else {
    bootFooterReveal();
  }
  window.initFooterReveal = initFooterReveal;
})();


$(document).ready(function() {
  var header = $("header.logo-navbar");
  if (!header.length) header = $("body >header").first();

  // Safely initialize owlCarousel only if the plugin is loaded on the page
  if (typeof $.fn.owlCarousel === "function") {
    var owl1 = $('.testimonial-slider');
    if (owl1.length) {
      owl1.owlCarousel({
        margin: 10,
        autoplay: true,
        nav: false,
        loop: true,
        pagination: true,
        items: 1
      });
    }
    
    var owl2 = $('.bottom-banner');
    if (owl2.length) {
      owl2.owlCarousel({
        margin: 8,
        autoplay: false,
        nav: false,
        loop: true,
        nav: true,
        pagination: false,
        responsiveClass: true,
        responsive: {
          0: { items: 1, nav: true },
          600: { items: 3, nav: false },
          1000: { items: 4, nav: true }
        }
      });
    }
  }

  // Trigger header sync once DOM is ready
  if (window.syncHeaderChrome) window.syncHeaderChrome();

// sidemenu open
    $(".nav-menu").click(function(){
        $(".nav-menu").toggleClass("open");
        header.toggleClass("open-menu");
        $(".full-screen-menu").toggleClass("show");      
        $(this).attr("aria-expanded", $(this).hasClass("open") ? "true" : "false");
        syncHeaderChrome();
    });

    $(".nav-menu-close").click(function(){
        $(".contact-form-popup").toggleClass("show");
        $("body").toggleClass("fixed");
        header.toggleClass("show-menu");
        syncHeaderChrome();
    });

    function updateHeader() {
      syncHeaderChrome();
    }
    
    
//accept privacy
    $(document).ready(function(){
	  $(".btn-aceptar").click(function(){
	    $("body").addClass("cached");
	  });
	});
});

// Duplicate scroll listener removed - handled by syncHeaderChrome


$(document).ready(function(){
 
  $(".blue-btn").click(function(){
    $(".chat-box").toggleClass("show");
  });
  $(".cross-chat").click(function(){
    $(".chat-box").toggleClass("show");
  });
});


$(document).ready(function(){
  var date = new Date();
  var copyEl = document.getElementById('copyRight');
  if (copyEl) {
    copyEl.innerText = "Copyright (c) " + date.getFullYear() + " Nohitatu";
  }
});


// $(function() {
  // $('#slides').slidesjs({
    // width: 864,
    // height: 459,
	 // play: {
      // auto: true,
	  // interval: 3000,
    // },
// 	
    // navigation: false
  // });
// });

// Hide the fixed navigation while scrolling down and reveal it on upward scroll.
document.addEventListener('DOMContentLoaded', function () {
  var navigationHeader = document.querySelector('header.logo-navbar');
  if (!navigationHeader) return;

  var lastScrollY = window.scrollY;
  var ticking = false;

  function updateNavigationVisibility() {
    var currentScrollY = Math.max(window.scrollY, 0);
    var menuOpen = navigationHeader.classList.contains('open-menu') ||
      navigationHeader.classList.contains('show-menu') ||
      document.body.classList.contains('fixed');

    if (menuOpen || currentScrollY < 80 || currentScrollY < lastScrollY) {
      navigationHeader.classList.remove('nav-panel-hidden');
    } else if (currentScrollY >lastScrollY + 5) {
      navigationHeader.classList.add('nav-panel-hidden');
    }

    lastScrollY = currentScrollY;
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(updateNavigationVisibility);
      ticking = true;
    }
  }, { passive: true });
});
