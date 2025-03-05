// ==UserScript==
// @name         Metal Archives Album Sorter
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Sort albums on Metal Archives band pages by Name, Type, Year, and Reviews.
// @author       Isaac Herbst
// @match        *://www.metal-archives.com/bands/*/*
// @grant        none
// ==/UserScript==

/*
    This one has weird bug/edge cases where it doesn't work.
    Only works on the complete discography element in the table,
    also doesn't work when switching to this element from another.
    When clicking into albums and backing out to the main page,
    sometimes that breaks the script but a page reload fixes this.
*/
(function() {
    'use strict';

    const debug = false;
    const tableString = 'table.display.discog';

    if (debug) { console.log("Script loaded!"); }

    /*  Helper function to extract the percentage from the reviews string.
        Example usage:
        Input:   "10 (85%)"
        Output:  "85"
        If the input is "", then return -1 (Displays albums with no reviews last. */
    function extractPercentage(reviewStr) {
        const match = reviewStr.match(/\((\d+)%\)/);
        return match ? parseInt(match[1], 10) : -1;
    }

    // Sorts the table's rows based on column index and order
    function sortTable(columnIndex, order) {
        if (debug) { console.log(`Sorting column ${columnIndex} in ${order} order`); }
        const tableBody = 'tbody', tableRows = 'tr';

        const table = document.querySelector(tableString);
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
    function addClickableHeaders() {
        if (debug) { console.log("Adding clickable headers..."); }

        // Exit if the table is not found
        const table = document.querySelector(tableString);
        if (!table) {
            if (debug) { console.log("Table not found!"); }
            return;
        }

        // Exit if the header row is not found
        const headerRow = table.querySelector('thead tr');
        if (!headerRow) {
            if (debug) { console.log("Header row not found!"); }
            return;
        }

        const headers = headerRow.querySelectorAll('th');
        if (debug) { console.log(`Found ${headers.length} headers`); }

        headers.forEach((header, index) => {
            const headerText = header.textContent.trim();
            if (debug) { console.log(`Header ${index}: ${headerText}`); }

            if (headerText === 'Name' ||
                headerText === 'Type' ||
                headerText === 'Year' ||
                headerText === 'Reviews') {
                let sortOrder = 'asc'; // Ascending order be default

                header.style.cursor = 'pointer';
                header.addEventListener('click', () => {
                    if (debug) { console.log(`Clicked ${headerText}!`); }

                    // Toggle between ascending and descending
                    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
                    sortTable(index, sortOrder);
                });
            }
        });
    }

    // Function to observe DOM changes and detect when the table is added
    function observeTable() {
        if (debug) { console.log("Observing DOM for table..."); }

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    const table = document.querySelector(tableString);
                    if (table) {
                        if (debug) { console.log("Table found! Adding clickable headers..."); }
                        observer.disconnect(); // Stop observing once the table is found
                        addClickableHeaders();
                        break;
                    }
                }
            }
        });

        // Start observing the document body for changes
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Wait for the page to fully load before running the script
    window.addEventListener('load', observeTable);
})();