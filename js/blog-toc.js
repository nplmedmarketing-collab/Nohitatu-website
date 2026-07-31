/* Builds the "On this page" index for a blog article from its own headings. */
(function () {
    'use strict';

    function slugify(text) {
        return text
            .toLowerCase()
            .replace(/[’'"]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    function labelFor(heading) {
        var clone = heading.cloneNode(true);
        var eyebrow = clone.querySelector('.post-num');
        if (eyebrow && eyebrow.parentNode) eyebrow.parentNode.removeChild(eyebrow);
        return clone.textContent.replace(/\s+/g, ' ').trim();
    }

    function init() {
        var body = document.querySelector('.post-body');
        var container = body && body.querySelector('.container');
        var article = container && container.querySelector('.post-col');
        if (!article) return;

        var headings = [].slice.call(article.querySelectorAll('h2'));
        if (headings.length < 3) return;

        var nav = document.createElement('nav');
        nav.setAttribute('aria-label', 'Table of contents');
        var links = [];
        var targets = [];

        headings.forEach(function (heading) {
            var label = labelFor(heading);
            if (!label) return;

            if (!heading.id) {
                var base = slugify(label) || 'section';
                var id = base;
                var suffix = 2;
                while (document.getElementById(id)) {
                    id = base + '-' + suffix++;
                }
                heading.id = id;
            }

            var link = document.createElement('a');
            link.href = '#' + heading.id;
            link.textContent = label;
            nav.appendChild(link);
            links.push(link);
            targets.push(heading);
        });

        if (!links.length) return;

        var aside = document.createElement('details');
        aside.className = 'post-toc';

        var title = document.createElement('summary');
        title.textContent = 'On this page';
        aside.appendChild(title);
        aside.appendChild(nav);

        // The rail bounds the sticky card so it releases where the prose ends,
        // instead of hanging over the full-bleed quote and the closing CTA.
        var rail = document.createElement('div');
        rail.className = 'post-toc-rail';
        rail.appendChild(aside);
        container.insertBefore(rail, article);
        body.classList.add('has-toc');

        // Collapsed by default on phones so it does not push the article down.
        var narrow = window.matchMedia('(max-width: 991px)');
        var proseEnd = article.querySelector('.post-quote');

        function syncLayout() {
            var box = article.getBoundingClientRect();

            // The quote breaks out to full width with math that assumes the
            // article is page-centred, which no longer holds beside the index.
            body.style.setProperty('--post-col-offset', Math.round(box.left + window.pageXOffset) + 'px');

            if (narrow.matches) {
                rail.style.height = '';
                return;
            }

            var end = proseEnd ? proseEnd.getBoundingClientRect().top : box.bottom;
            rail.style.height = Math.max(Math.round(end - box.top), aside.offsetHeight) + 'px';
        }

        var syncOpen = function () {
            aside.open = !narrow.matches;
            syncLayout();
        };
        syncOpen();
        window.addEventListener('resize', syncLayout);
        window.addEventListener('load', syncLayout);
        if (typeof narrow.addEventListener === 'function') {
            narrow.addEventListener('change', syncOpen);
        } else if (typeof narrow.addListener === 'function') {
            narrow.addListener(syncOpen);
        }

        nav.addEventListener('click', function (event) {
            if (narrow.matches && event.target.tagName === 'A') aside.open = false;
        });

        if (!('IntersectionObserver' in window)) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                links.forEach(function (link) {
                    link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
                });
            });
        }, { rootMargin: '-16% 0px -70% 0px' });

        targets.forEach(function (heading) {
            observer.observe(heading);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
