/**
 * Nohitatu — Lumen 2026 Homepage Replica Interactive Controller
 * Powers:
 * 1. .lumen-tabs (01 / 02 / 03 Disrupter Tabbed Carousel)
 * 2. .industry-selector-container (Custom Industry Dropdown & Case Study Switcher)
 */

(function () {
    'use strict';

    /**
     * 1. Lumen Disrupter Tabs (.lumen-tabs)
     * Switches between 01 / 02 / 03 panels and syncs active tab number buttons across panels.
     */
    function initLumenDisrupterTabs() {
        var tabSections = document.querySelectorAll('[data-tabs-carousel]');
        if (!tabSections.length) return;

        tabSections.forEach(function (section) {
            var panels = section.querySelectorAll('.lumen-tabs__panel[data-index]');
            var tabBtns = section.querySelectorAll('.lumen-tabs__tab[data-tab]');

            if (!panels.length || !tabBtns.length) return;

            function activateSlide(targetIdx) {
                panels.forEach(function (panel) {
                    var isMatch = panel.getAttribute('data-index') === String(targetIdx);
                    panel.classList.toggle('is-active', isMatch);
                    panel.setAttribute('aria-hidden', isMatch ? 'false' : 'true');
                });

                tabBtns.forEach(function (btn) {
                    var isMatch = btn.getAttribute('data-tab') === String(targetIdx);
                    btn.classList.toggle('is-active', isMatch);
                    btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
                });
            }

            tabBtns.forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var targetIdx = btn.getAttribute('data-tab');
                    if (targetIdx !== null) {
                        activateSlide(targetIdx);
                    }
                });
            });
        });
    }

    /**
     * 2. Lumen Industry Selector Dropdown (.industry-selector-container)
     * Toggles the custom dropdown list and switches the active industry case study + left photo.
     */
    function initLumenIndustrySelector() {
        var dropdown = document.getElementById('lmn-industry-dropdown');
        if (!dropdown) return;

        var header = dropdown.querySelector('.dropdown-header');
        var arrow = dropdown.querySelector('.dropdown-header .arrow');
        var list = dropdown.querySelector('.dropdown-list');
        var options = dropdown.querySelectorAll('.dropdown-option[data-item]');
        var selectedLabel = document.getElementById('lmn-industry-selected');
        var heroImg = document.getElementById('lmn-industry-img');
        var items = document.querySelectorAll('.industry-selector-item[data-item]');

        if (!header || !list) return;

        function closeDropdown() {
            header.classList.remove('open');
            if (arrow) arrow.classList.remove('open');
            list.classList.remove('open');
        }

        function toggleDropdown(e) {
            e.stopPropagation();
            var isOpen = header.classList.contains('open');
            if (isOpen) {
                closeDropdown();
            } else {
                header.classList.add('open');
                if (arrow) arrow.classList.add('open');
                list.classList.add('open');
            }
        }

        header.addEventListener('click', toggleDropdown);

        options.forEach(function (opt) {
            opt.addEventListener('click', function (e) {
                e.stopPropagation();
                var targetKey = opt.getAttribute('data-item');

                // Update dropdown selected option state
                options.forEach(function (o) {
                    o.classList.toggle('selected', o === opt);
                });

                if (selectedLabel) {
                    selectedLabel.textContent = opt.textContent.trim();
                }

                // Switch active case study item and left-hand photo
                items.forEach(function (item) {
                    var isMatch = item.getAttribute('data-item') === targetKey;
                    item.classList.toggle('is-active', isMatch);
                    if (isMatch && heroImg) {
                        var newImg = item.getAttribute('data-img');
                        if (newImg) {
                            heroImg.src = newImg;
                        }
                    }
                });

                closeDropdown();
            });
        });

        document.addEventListener('click', function (e) {
            if (!dropdown.contains(e.target)) {
                closeDropdown();
            }
        });
    }

    /**
     * 3. Hero Video Full Moon Synchronization
     * Reveals the glowing full moon in the top right during the last 4 seconds
     * of video playback (cosmic slate), and smoothly hides it prior to looping.
     */
    function initHeroMoonSync() {
        var video = document.getElementById('lmn-hero-video');
        var moon = document.getElementById('lmn-hero-moon');
        if (!video || !moon) return;

        var forceMoon = false;

        function updateMoonState() {
            if (forceMoon) {
                moon.classList.add('is-visible');
                return;
            }
            var duration = video.duration;
            if (!duration || isNaN(duration) || !isFinite(duration)) {
                duration = 38.67;
            }
            var current = video.currentTime || 0;
            // The company logo clip transitions in at 34.25s and plays through 38.67s (duration)
            // Active window: from 34.25s until 0.20s before loop reset
            var isLogoClipPlaying = (current >= 34.25) && (current < (duration - 0.20));
            if (isLogoClipPlaying) {
                moon.classList.add('is-visible');
            } else {
                moon.classList.remove('is-visible');
            }
        }

        video.addEventListener('timeupdate', updateMoonState);
        video.addEventListener('seeking', updateMoonState);
        video.addEventListener('seeked', updateMoonState);
        video.addEventListener('play', updateMoonState);
        video.addEventListener('playing', updateMoonState);
        video.addEventListener('loadedmetadata', updateMoonState);
        video.addEventListener('canplay', updateMoonState);
        video.addEventListener('ended', function () {
            if (!forceMoon) {
                moon.classList.remove('is-visible');
            }
        });

        // High-frequency poll (100ms) so the moon never misses a cue if timeupdate is throttled
        setInterval(updateMoonState, 100);

        // Query param support for testing / previewing (e.g. ?t=37 or ?moon=1)
        if (typeof window !== 'undefined' && window.location) {
            var params = new URLSearchParams(window.location.search);
            if (params.get('moon') === '1') {
                forceMoon = true;
                moon.classList.add('is-visible');
            }
            var seekParam = parseFloat(params.get('t'));
            if (!isNaN(seekParam)) {
                var hasSeeked = false;
                var applySeek = function () {
                    if (hasSeeked && Math.abs(video.currentTime - seekParam) < 1.5) return;
                    try {
                        video.currentTime = seekParam;
                        if (Math.abs(video.currentTime - seekParam) < 1.5) {
                            hasSeeked = true;
                        }
                    } catch (e) {}
                    updateMoonState();
                };
                if (video.readyState >= 1) {
                    applySeek();
                }
                video.addEventListener('loadedmetadata', applySeek);
                video.addEventListener('canplay', applySeek);
            }
        }
    }

    function initAll() {
        initLumenDisrupterTabs();
        initLumenIndustrySelector();
        initHeroMoonSync();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }
})();
