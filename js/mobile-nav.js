/* Branded slide-in navigation for phone widths, built from the desktop menu. */
(function () {
  'use strict';

  var MOBILE_QUERY = '(max-width: 767px)';
  var CONTACT_URL = 'https://nohitatu.com/contact/Contactus.aspx';

  function cleanText(node) {
    return (node.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function isUsableLink(link) {
    var href = link.getAttribute('href');
    return Boolean(href) && href.trim() !== '#' && href.trim() !== '';
  }

  function buildGroup(item) {
    var topLink = item.querySelector(':scope > a');
    if (!topLink) return null;

    var label = cleanText(topLink);
    if (!label) return null;

    var children = [].slice
      .call(item.querySelectorAll('.sub-menu a'))
      .filter(isUsableLink)
      .map(function (link) {
        return { label: cleanText(link), href: link.getAttribute('href'), target: link.getAttribute('target') };
      })
      .filter(function (child) {
        return child.label;
      });

    var group = document.createElement('div');
    group.className = 'mobile-nav__group';

    if (!children.length) {
      var directLink = document.createElement('a');
      directLink.className = 'mobile-nav__link';
      directLink.href = topLink.getAttribute('href') || '#';
      directLink.textContent = label;
      if (topLink.getAttribute('target')) directLink.target = topLink.getAttribute('target');
      if (topLink.closest('li').classList.contains('active')) {
        directLink.setAttribute('aria-current', 'page');
      }
      group.appendChild(directLink);
      return group;
    }

    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'mobile-nav__link mobile-nav__link--parent';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span>' + label + '</span><i class="mobile-nav__chevron" aria-hidden="true"></i>';

    var sublist = document.createElement('div');
    sublist.className = 'mobile-nav__sublist';

    children.forEach(function (child) {
      var childLink = document.createElement('a');
      childLink.href = child.href;
      childLink.textContent = child.label;
      if (child.target) childLink.target = child.target;
      sublist.appendChild(childLink);
    });

    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      group.parentNode.querySelectorAll('.mobile-nav__group.is-open').forEach(function (openGroup) {
        if (openGroup === group) return;
        openGroup.classList.remove('is-open');
        openGroup.querySelector('.mobile-nav__link--parent').setAttribute('aria-expanded', 'false');
      });

      toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
      group.classList.toggle('is-open', !open);
    });

    group.appendChild(toggle);
    group.appendChild(sublist);
    return group;
  }

  function buildPanel(header, desktopMenu) {
    var overlay = document.createElement('div');
    overlay.className = 'mobile-nav';
    overlay.hidden = true;

    var backdrop = document.createElement('div');
    backdrop.className = 'mobile-nav__backdrop';

    var panel = document.createElement('aside');
    panel.className = 'mobile-nav__panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Site navigation');

    var head = document.createElement('div');
    head.className = 'mobile-nav__head';

    var logoSource = header.querySelector('.header-logo img');
    if (logoSource) {
      var logo = document.createElement('img');
      logo.className = 'mobile-nav__logo';
      logo.src = logoSource.getAttribute('src');
      logo.alt = logoSource.getAttribute('alt') || 'Nohitatu';
      head.appendChild(logo);
    }

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'mobile-nav__close';
    close.setAttribute('aria-label', 'Close navigation menu');
    close.innerHTML = '<span aria-hidden="true"></span><span aria-hidden="true"></span>';
    head.appendChild(close);

    var list = document.createElement('nav');
    list.className = 'mobile-nav__list';
    list.setAttribute('aria-label', 'Primary');

    [].slice.call(desktopMenu.children).forEach(function (item) {
      var group = buildGroup(item);
      if (group) list.appendChild(group);
    });

    var cta = document.createElement('a');
    cta.className = 'mobile-nav__cta';
    cta.href = CONTACT_URL;
    cta.textContent = 'Get Free Estimation';

    panel.appendChild(head);
    panel.appendChild(list);
    panel.appendChild(cta);
    overlay.appendChild(backdrop);
    overlay.appendChild(panel);

    return { overlay: overlay, backdrop: backdrop, close: close, list: list };
  }

  function init() {
    var header = document.querySelector('header.logo-navbar');
    var desktopMenu = document.querySelector('#navigation');
    var container = header && header.querySelector('.header-container');
    if (!header || !desktopMenu || !container || document.querySelector('.mobile-nav')) return;

    var parts = buildPanel(header, desktopMenu);
    if (!parts.list.children.length) return;

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'mobile-nav-trigger';
    trigger.setAttribute('aria-label', 'Open navigation menu');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML = '<span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>';

    container.appendChild(trigger);
    document.body.appendChild(parts.overlay);

    var mobile = window.matchMedia(MOBILE_QUERY);

    function setOpen(open) {
      if (open && !mobile.matches) return;

      parts.overlay.hidden = !open;
      // Force a frame so the panel animates in rather than appearing instantly.
      if (open) parts.overlay.getBoundingClientRect();
      parts.overlay.classList.toggle('is-open', open);
      trigger.classList.toggle('is-active', open);
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      trigger.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      document.body.classList.toggle('fixed', open);
      header.classList.remove('nav-panel-hidden');
    }

    trigger.addEventListener('click', function () {
      setOpen(!parts.overlay.classList.contains('is-open'));
    });

    parts.close.addEventListener('click', function () {
      setOpen(false);
    });

    parts.backdrop.addEventListener('click', function () {
      setOpen(false);
    });

    parts.list.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') setOpen(false);
    });

    // Leaving phone widths must always clear the panel and its scroll lock.
    var handleBreakpoint = function () {
      if (!mobile.matches) setOpen(false);
    };

    if (typeof mobile.addEventListener === 'function') {
      mobile.addEventListener('change', handleBreakpoint);
    } else {
      mobile.addListener(handleBreakpoint);
    }
    window.addEventListener('resize', handleBreakpoint);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
