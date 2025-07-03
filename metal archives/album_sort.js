// ==UserScript==
// @name         Metal Archives Album Sorter
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Sort albums on Metal Archives band pages by Name, Type, Year, and Reviews.
// @author       Isaac Herbst
// @match        *://www.metal-archives.com/bands/*/*
// @grant        none
// ==/UserScript==

/*
    Sorts various parts of tables on the band viewer page for metal archives.
    The headers (as of 07/03/2025) are: Name, Type, Year, and Reviews.
    Clicking one of these will sort in ascending alphanumeric order (of the type clicked),
    clicking the same one again will reverse the ordering to descending alphanumeric,
    and clicking the same one once more will revert to the default ordering of ascending Year.
    Year does not use this ordering, instead when clicking once will sort by descending year,
    and clicking again will revert. Note that clicking one sort (say, Name) then another (say, Type) 
    will revert the ordering of Name. This functionality works for these tabs: Complete discography, 
    Main, Lives, Demos, and Misc.
*/
(function() {
    'use strict';

    const debug = true;

    if (debug) { console.log("Script loaded!"); }

    /*  Helper function to extract the percentage from the reviews string.
        Example usage:
        Input:   "10 (85%)"
        Output:  "85"
        If the input is "", then return -1 (Displays albums with no reviews last.) */
    function extractPercentage(reviewStr) {
        const match = reviewStr.match(/\((\d+)%\)/);
        return match ? parseInt(match[1], 10) : -1;
    }

    // Sorts the table's rows based on column index and order
    function sortTable(table, columnIndex, order) {
        if (debug) { console.log(`Sorting column ${columnIndex} in ${order} order`); }
        const tableBody = 'tbody', tableRows = 'tr';

        const tbody = table.querySelector(tableBody);
        const rows = Array.from(tbody.querySelectorAll(tableRows));

        rows.sort((a, b) => {
            const aCell = a.cells[columnIndex].textContent.trim();
            const bCell = b.cells[columnIndex].textContent.trim();

            let aValue, bValue;

            if (columnIndex === 3) { // Reviews column
                aValue = extractPercentage(aCell);
                bValue = extractPercentage(bCell);
            }
            else if (columnIndex === 2) { // Year column
                aValue = parseInt(aCell, 10) || 0; // Handle invalid years
                bValue = parseInt(bCell, 10) || 0;
            }
            else { // Name or Type column
                aValue = aCell.toLowerCase();
                bValue = bCell.toLowerCase();
            }

            if (order === 'asc') {
                return aValue > bValue ? 1 : -1;
            }
            else if (order === 'desc') {
                return aValue < bValue ? 1 : -1;
            }
        });

        // Clear the table body and append the sorted rows
        tbody.innerHTML = '';
        rows.forEach(row => tbody.appendChild(row));
    }

    // Function to add clickable headers
    function addClickableHeaders(table) {
        if (debug) { console.log("Adding clickable headers..."); }

        const headerRow = table.querySelector('thead tr');
        // Exit if the header row is not found
        if (!headerRow) {
            if (debug) { console.log("Header row not found!"); }
            return;
        }

        const headers = headerRow.querySelectorAll('th');
        if (debug) { console.log(`Found ${headers.length} headers`); }

        let lastClickedIndex = -1;
        let clickCounts = new Array(headers.length).fill(0);

        headers.forEach((header, index) => {
            const headerText = header.textContent.trim();
            if (debug) { console.log(`Header ${index}: ${headerText}`); }
            if (['Name', 'Type', 'Year', 'Reviews'].includes(headerText)) {
                const originalText = headerText;
                header.style.cursor = 'pointer';
                header.textContent = `${originalText} ↑↓`;

                header.addEventListener('click', () => {
                    if (lastClickedIndex !== index) {
                        clickCounts[lastClickedIndex] = 0;
                        lastClickedIndex = index;
                    }

                    clickCounts[index]++;
                    let order = 'asc';
                    let sortIndex = index;

                    // Year doesn't need the 3-click system, also start with desc instead of asc
                    if (index === 2) {
                        order = (clickCounts[index] % 2 === 1) ? 'desc' : 'asc';
                    } else {    // 3-click system for everything else
                        if (clickCounts[index] % 3 === 1) {
                            order = 'asc';
                        } else if (clickCounts[index] % 3 === 2) {
                            order = 'desc';
                        } else {
                            sortIndex = 2;
                            order = 'asc';
                            if (debug) { console.log(`3rd click on ${headerText}: resetting to Year ASC`); }
                        }
                    }

                    // Update all necessary arrows per click
                    headers.forEach(h => {
                        const text = h.textContent.trim().replace(/[↑↓]+$/, '').trim();
                        h.textContent = text + ' ↑↓';
                    });

                    sortTable(table, sortIndex, order);

                    // Set the correct arrow
                    if (index === 2 || clickCounts[index] % 3 !== 0) {
                        const arrow = order === 'asc' ? ' ↑' : ' ↓';
                        header.textContent = originalText + arrow;
                    } else {
                        headers[2].textContent = 'Year ↑';
                    }
                });
            }
        });
    }

    // Function to observe DOM changes and detect when the table is added
    function observeTable() {
        if (debug) { console.log("Observing DOM for table..."); }

        // New observer to catch any DOM changes (AJAX table loading)
        const observer = new MutationObserver(() => {
            const visiblePanel = Array.from(document.querySelectorAll('div[id^="ui-tabs-"]'))
                .find(div => div.offsetParent !== null);
            const table = visiblePanel?.querySelector('table.display.discog');

            if (table) {
                if (debug) {
                    console.log("Detected AJAX tab switch. Trying to reapply sorting headers...");
                    console.log("Table found! Adding clickable headers...");
                }
                addClickableHeaders(table);
            }
        });

        // Start observing the document body for changes
        const discogWrapper = document.querySelector('#band_tab_discography');
        if (discogWrapper) {
            observer.observe(discogWrapper, { childList: true, subtree: true });
            if (debug) { console.log("MutationObserver attached to #band_tab_discography"); }
        }
    }

    // Wait for the page to fully load before running the script
    window.addEventListener('load', observeTable);

    // The different tables work by dynamically loading them with AJAX, this captures which table it currently is
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof jQuery !== 'undefined') {
            jQuery(document).ajaxComplete((event, xhr, settings) => {
                const url = settings.url || '';
                if (url.includes('/band/discography/id/')) {
                    if (debug) console.log('Detected AJAX tab switch. Trying to reapply sorting headers...');
                    
                    // Retry until the new table appears (variable load times on dynamic tables)
                    let attempts = 0;
                    const maxAttempts = 10;
                    const interval = setInterval(() => {
                        const visiblePanel = Array.from(document.querySelectorAll('div[id^="ui-tabs-"]'))
                            .find(div => div.offsetParent !== null);

                        // Find the new table, apply headers to it
                        const table = visiblePanel?.querySelector('table.display.discog');
                        if (table) {
                            clearInterval(interval);
                            if (debug) { console.log('Table found! Adding headers.'); }
                            addClickableHeaders(table);
                        } else {    // Wait for it to appear
                            attempts++;
                            if (attempts >= maxAttempts) {
                                clearInterval(interval);
                                if (debug) { console.log('Table not found after AJAX load.'); }
                            }
                        }
                    }, 100); // retry every 1/10th a second, 10 times
                }
            });
        } else {
            if (debug) { console.log('jQuery not found. Cannot hook into AJAX loading.'); }
        }
    });
})();