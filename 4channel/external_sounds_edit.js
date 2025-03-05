// ==UserScript==
// @name 4ch External Sounds with Sound URL Display for All Images
// @namespace b4k
// @description Extended functionality of 4chan External Sounds. Grabs the links of soundposts and puts it as a warning pane.
// @author Bakugo, edited by Isaac Herbst
// @version 1.7.0
// @match *://boards.4chan.org/*
// @match *://boards.4channel.org/*
// @run-at document-start
// @downloadURL https://update.sleazyfork.org/scripts/31045/4chan%20External%20Sounds.user.js
// @updateURL https://update.sleazyfork.org/scripts/31045/4chan%20External%20Sounds.meta.js
// ==/UserScript==

/*
    Works but is a bit clunky to use. When clicking on a
    soundpost, the warning link shows up and the only way
    to remove it is switching to another tab, then back
    to the main tab. This is the case even if you click the
    "OK" button or any others in that box. Not fixing it,
    its not much of an inconveience.
*/

(function() {
    var doInit;
    var doParseFile;
    var doParseFiles;
    var doPlayFile;
    var doMakeKey;

    var allow;
    var players;
    var isChanX;

    allow = [
        "4cdn.org",
        "catbox.moe",
        "dmca.gripe",
        "lewd.se",
        "pomf.cat",
        "zz.ht"
    ];

    document.addEventListener(
        "DOMContentLoaded",
        function (event) {
            setTimeout(
                function () {
                    if (
                        document.body.classList.contains("ws") ||
                        document.body.classList.contains("nws")
                    ) {
                        isChanX = false;
                        doInit();
                    }
                },
                (1)
            );
        }
    );

    document.addEventListener(
        "4chanXInitFinished",
        function (event) {
            if (
                document.documentElement.classList.contains("fourchan-x") &&
                document.documentElement.classList.contains("sw-yotsuba")
            ) {
                isChanX = true;
                doInit();
            }
        }
    );

    doInit = function () {
        var observer;

        if (players) {
            return;
        }

        players = {};

        doParseFiles(document.body);

        observer =
            new MutationObserver(
                function (mutations) {
                    mutations.forEach(
                        function (mutation) {
                            if (mutation.type === "childList") {
                                mutation.addedNodes.forEach(
                                    function (node) {
                                        if (node.nodeType === Node.ELEMENT_NODE) {
                                            doParseFiles(node);
                                            doPlayFile(node);
                                        }
                                    }
                                );
                            }
                        }
                    );
                }
            );

        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );
    };

    doParseFile = function (file) {
        var fileLink;
        var fileName;
        var key;
        var match;
        var player;
        var link;

        if (!file.classList.contains("file")) {
            return;
        }

        if (isChanX) {
            fileLink = file.querySelector(".fileText .file-info > a");
        } else {
            fileLink = file.querySelector(".fileText > a");
        }

        if (!fileLink) {
            return;
        }

        if (!fileLink.href) {
            return;
        }

        fileName = null;

        if (isChanX) {
            [
                file.querySelector(".fileText .file-info .fnfull"),
                file.querySelector(".fileText .file-info > a")
            ].some(
                function (node) {
                    if (node) {
                        if (node.textContent) {
                            fileName = node.textContent;
                            return true;
                        }
                    }

                    return false;
                }
            );
        } else {
            [
                file.querySelector(".fileText"),
                file.querySelector(".fileText > a")
            ].some(
                function (node) {
                    if (node) {
                        if (node.title) {
                            fileName = node.title;
                            return true;
                        }

                        if (
                            node.tagName === "A" &&
                            node.textContent
                        ) {
                            fileName = node.textContent;
                            return true;
                        }
                    }

                    return false;
                }
            );
        }

        if (!fileName) {
            return;
        }

        fileName = fileName.replace(/\-/, "/");

        key = doMakeKey(fileLink.href);

        if (!key) {
            return;
        }

        if (players[key]) {
            return;
        }

        match = fileName.match(/[\[\(\{](?:audio|sound)[ \=\:\|\$](.*?)[\]\)\}]/i);

        if (!match) {
            return;
        }

        link = match[1];

        if (link.includes("%")) {
            try {
                link = decodeURIComponent(link);
            } catch (error) {
                return;
            }
        }

        if (link.match(/^(https?\:)?\/\//) === null) {
            link = (location.protocol + "//" + link);
        }

        try {
            link = new URL(link);
        } catch (error) {
            return;
        }

        if (
            allow.some(
                function (item) {
                    return (
                        link.hostname.toLowerCase() === item ||
                        link.hostname.toLowerCase().endsWith("." + item)
                    );
                }
            ) == false
        ) {
            return;
        }

        player = new Audio();

        player.preload = "none";
        player.volume = 0.80;
        player.loop = true;

        player.src = link.href;

        players[key] = player;
    };

    doParseFiles = function (target) {
        target.querySelectorAll(".post")
            .forEach(
                function (post) {
                    if (post.parentElement.parentElement.id === "qp") {
                        return;
                    }

                    if (post.parentElement.classList.contains("noFile")) {
                        return;
                    }

                    post.querySelectorAll(".file")
                        .forEach(
                            function (file) {
                                doParseFile(file);
                            }
                        );
                }
            );
    };

    doPlayFile = function (target) {
        var key;
        var player;
        var interval;

        // Check if target is an image, including thumbnail and full image
        if (!target.src) {
            return;
        }

        // Ensure we're working with an image or thumbnail associated with soundpost
        if (target.tagName !== "IMG" && target.tagName !== "VIDEO") {
            return;
        }

        key = doMakeKey(target.src);

        if (!key) {
            return;
        }

        player = players[key];

        if (!player) {
            return;
        }

        // Add click listener to show the URL of the sound file when the image is clicked
        target.addEventListener('click', function() {
            alert("Sound file URL: " + player.src);
        });

        // Play soundpost when clicked
        if (!player.paused) {
            if (player.dataset.play == 1) {
                return;
            } else {
                player.dataset.again = 1;
            }
        } else {
            player.pause();
        }

        if (player.dataset.play != 1){
            player.dataset.play = 1;
            player.dataset.again = 0;
            player.dataset.moveTime = 0;
            player.dataset.moveLast = 0;
        }

        switch (target.tagName) {
            case "IMG":
                player.loop = true;
                if (player.dataset.again != 1) {
                    player.currentTime = 0;
                    player.play();
                }
                break;
            case "VIDEO":
                player.loop = false;
                player.currentTime = target.currentTime;
                player.play();
                break;
            default:
                return;
        }

        // Handle autoplay issues for video/audio players
        if (player.paused) {
            document.dispatchEvent(
                new CustomEvent(
                    "CreateNotification",
                    {
                        bubbles: true,
                        detail: {
                            type: "warning",
                            content: "Your browser blocked autoplay, click anywhere on the page to activate it and try again.",
                            lifetime: 5
                        }
                    }
                )
            );
        }

        interval =
            setInterval(
                function () {
                    if (document.body.contains(target)) {
                        if (target.tagName === "VIDEO") {
                            if (target.currentTime != (+player.dataset.moveLast)) {
                                player.dataset.moveTime = Date.now();
                                player.dataset.moveLast = target.currentTime;
                            }

                            if (player.duration != NaN) {
                                if (
                                    target.paused == true ||
                                    target.duration == NaN ||
                                    target.currentTime > player.duration ||
                                    ((Date.now() - (+player.dataset.moveTime)) > 300)
                                ) {
                                    if (!player.paused) {
                                        player.pause();
                                    }
                                } else {
                                    if (
                                        player.paused ||
                                        Math.abs(target.currentTime - player.currentTime) > 0.100
                                    ) {
                                        player.currentTime = target.currentTime;
                                    }

                                    if (player.paused) {
                                        player.play();
                                    }
                                }
                            }
                        }
                    } else {
                        clearInterval(interval);

                        if (player.dataset.again == 1) {
                            player.dataset.again = 0;
                        } else {
                            player.pause();
                            player.dataset.play = 0;
                        }
                    }
                },
                (1000/30)
            );
    };

    doMakeKey = function (link) {
        var match;

        match = link.match(/\.(?:4cdn|4chan)\.org\/(.+?)\/(\d+?)\.(.+?)$/);

        if (match) {
            return (match[1] + "." + match[2]);
        }

        return null;
    };
})();
