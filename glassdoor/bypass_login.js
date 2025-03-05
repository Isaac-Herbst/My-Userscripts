// ==UserScript==
// @name         Glassdoor Login and Review Bypass
// @description  Simplistic script that removes the blur, button, and scroll wheel lock when browsing on glassdoor.com.
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically removes Glassdoor content restrictions on all subdomains and restores interactivity.
// @author       Isaac Herbst (github.com/Isaac-Herbst)
// @match        *://*.glassdoor.com/*
// @grant        none
// @compatible   chrome
// ==/UserScript==

/*
    This one worked great when I wrote it in December 2024,
    but Glassdoor updates their site frequently and some
    recent updates behave a little weird with this script.
    It sometimes works, but I've found it to be browser
    dependent.
*/
(function() {
    'use strict';

    // Function to remove restrictions
    function removeRestrictions() {
        try {
            // Delete any body-level script restrictions
            document.querySelectorAll('script').forEach(script => {
                if (script.innerText.includes('body')) {
                    script.remove();
                }
            });

            // Allow interactions with all divs
            document.querySelectorAll('div').forEach(el => el.style.pointerEvents = 'auto');

            // Restore scrolling
            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';

            // Remove blur and backdrop filter effects
            document.querySelectorAll('*').forEach(el => {
                el.style.filter = 'none';
                el.style.backdropFilter = 'none';
            });

            // Re-enable clickable elements by removing potential block overlays
            document.querySelectorAll('div, span, a').forEach(el => {
                el.style.pointerEvents = 'auto';
                el.style.zIndex = 'auto';
            });

            console.log('Glassdoor restrictions removed and interactivity restored.');
        } catch (e) {
            console.error('Error removing Glassdoor restrictions:', e);
        }
    }

    // Run the function when the page loads
    window.addEventListener('load', removeRestrictions);
})();