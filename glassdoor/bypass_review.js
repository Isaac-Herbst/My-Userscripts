// ==UserScript==
// @name         Glassdoor Salary Wall Remover
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Removes the salary/review wall on Glassdoor.
// @author       Isaac Herbst (github.com/Isaac-Herbst)
// @match        *://*.glassdoor.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

/*
    When logged in and you havent posted a salary or review in 12 months,
    the site pops up a div that darkens the page, removes clickable
    attributes, and removes page scrolling. Luckily its only 1 div
    as of May 2025, and this script simply deteles the div on page load.
*/
(function () {
    'use strict';

    const removeOverlay = () => {
        const overlay = document.getElementById('ContentHardsellOverlay');
        if (overlay) {
            overlay.remove();
            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';

            document.querySelectorAll('*').forEach(el => {
                el.style.pointerEvents = 'auto';
                el.style.filter = 'none';
                el.style.backdropFilter = 'none';
            });
        }
    };

    const observer = new MutationObserver(() => {
        removeOverlay();
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    window.addEventListener('DOMContentLoaded', removeOverlay);
})();
