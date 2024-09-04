document.addEventListener("DOMContentLoaded", function () {
    // Set the language
    currentLanguage = document
        .getElementsByTagName("html")[0]
        .getAttribute("lang");

    // Fetch interface.html and nav.html, and activity.js concurrently
    Promise.all([
        fetch("assets/interface.html").then((response) => response.text()),
        fetch("assets/nav.html").then((response) => response.text()),
        fetch("assets/activity.js").then((response) => response.text()),
        fetch("assets/config.html").then((response) => response.text()),
    ])
        .then(([interfaceHTML, navHTML, activityJS, configHTML]) => {
            // Inject fetched HTML into respective containers
            document.getElementById("interface-container").innerHTML =
                interfaceHTML;
            document.getElementById("nav-container").innerHTML = navHTML;
            const parser = new DOMParser()
            const configDoc = parser.parseFromString(configHTML, 'text/html');
            const newTitle = configDoc.querySelector('title').textContent;
            const newAvailableLanguages = configDoc.querySelector('meta[name="available-languages"]').getAttribute('content');

            // Add the new title.
            const title = document.createElement("title");
            title.textContent = newTitle;
            document.head.appendChild(title);
            // Add the new available languages.
            const availableLanguages = document.createElement("meta");
            availableLanguages.name = "available-languages";
            availableLanguages.content = newAvailableLanguages;
            document.head.appendChild(availableLanguages);

            // Inject the JavaScript code from activity.js dynamically into the document
            const script = document.createElement("script");
            script.type = "text/javascript";
            script.text = activityJS;
            document.body.appendChild(script);

            // Iterate over the available languages added in the html meta tag to populate the language dropdown
            const dropdown = document.getElementById("language-dropdown");
            // Check if there is a more dynamic way to populate the available languages
            const metaTag = document.querySelector(
                'meta[name="available-languages"]'
            );
            const languages = metaTag.getAttribute("content").split(",");

            languages.forEach((language) => {
                const option = document.createElement("option");
                option.value = language;
                option.textContent = language;
                dropdown.appendChild(option);
            });

            // Hide specific elements initially for accessibility
            const elementsToHide = [
                "close-sidebar",
                "language-dropdown",
                "play-pause-button",
                "toggle-eli5-mode-button",
            ];
            elementsToHide.forEach((id) => {
                const element = document.getElementById(id);
                element.setAttribute("aria-hidden", "true");
                element.setAttribute("tabindex", "-1");
            });

            // Add event listeners to various UI elements
            prepareActivity();
            // right side bar
            document
                .getElementById("open-sidebar")
                .addEventListener("click", toggleSidebar);
            document
                .getElementById("close-sidebar")
                .addEventListener("click", toggleSidebar);
            document
                .getElementById("toggle-eli5-mode-button")
                .addEventListener("click", toggleEli5Mode);
            document
                .getElementById("language-dropdown")
                .addEventListener("change", switchLanguage);
            document
                .getElementById("play-pause-button")
                .addEventListener("click", togglePlayPause);

            // set the language dropdown to the current language
            document.getElementById("language-dropdown").value =
                currentLanguage;

            // bottom bar
            document
                .getElementById("back-button")
                .addEventListener("click", previousPage);
            document
                .getElementById("forward-button")
                .addEventListener("click", nextPage);
            document
                .getElementById("submit-button")
                .addEventListener("click", validateInputs);

            // left nav bar
            document
                .getElementById("nav-popup")
                .addEventListener("click", toggleNav);
            document
                .getElementById("nav-close")
                .addEventListener("click", toggleNav);
            const navToggle = document.querySelector(".nav__toggle");
            const navLinks = document.querySelectorAll(".nav__list-link");
            const navPopup = document.getElementById("navPopup");

            // interactive elements
            /*document.querySelectorAll('[data-activity-item]').forEach(element => {
            element.addEventListener('click', selectAnswer());
        })*/

            if (navToggle) {
                navToggle.addEventListener("click", toggleNav);
            }

            if (navLinks) {
                navLinks.forEach((link) => {
                    link.addEventListener("click", () => {
                        // Add your logic for nav link click here
                    });
                });
            }

            //Set the initial page number
            const pageSectionMetaTag = document.querySelector(
                'meta[name="page-section-id"]'
            );
            document.getElementById("page-section-id").innerText =
                pageSectionMetaTag.getAttribute("content");

            // Fetch translations and set up click handlers for elements with data-id
            fetchTranslations();
            document.querySelectorAll("[data-id]").forEach((element) => {
                element.addEventListener("click", handleElementClick);
            });

            // Add keyboard event listeners for navigation
            document.addEventListener("keydown", handleKeyboardShortcuts);

            // Unhide navigation and sidebar after a short delay to allow animations
            setTimeout(() => {
                navPopup.classList.remove("hidden");
                document.getElementById("sidebar").classList.remove("hidden");
            }, 100); // Adjust the timeout duration as needed
        })
        .catch((error) => {
            console.error("Error loading HTML:", error);
        });
});

// Handle keyboard events for navigation
function handleKeyboardShortcuts(event) {
    const activeElement = document.activeElement;
    const isInTextBox =
        activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA";

    // disable shortcut keys if user is in a textbox
    if (isInTextBox) {
        return; // Exit if the user is inside a text box
    }

    switch (event.key) {
        case "x":
            toggleNav();
            break;
        case "a":
            toggleSidebar();
            break;
        case "ArrowRight":
            nextPage();
            break;
        case "ArrowLeft":
            previousPage();
            break;
    }

    const isAltShift = event.altKey && event.shiftKey;

    // Additional shortcuts for screen reader users (Alt + Shift + key)
    if (isAltShift) {
        switch (event.key) {
            case "x":
                toggleNav();
                break;
            case "a":
                toggleSidebar();
                break;
            case "ArrowRight":
                nextPage();
                break;
            case "ArrowLeft":
                previousPage();
                break;
        }// end switch
    }// end if       
}

let translations = {};
let audioFiles = {};
let currentAudio = null;
let isPlaying = false;
let currentIndex = 0;
let audioElements = [];
let audioQueue = [];
let eli5Active = false;
let eli5Element = null;
let eli5Audio = null;
let eli5Mode = false;
let sideBarActive = false;
let easyReadMode = false;

// Toggle the right nav bar (Smart Utility Sidebar)
function toggleSidebar() {
    const languageDropdown = document.getElementById("language-dropdown");
    const sideLinks = document.querySelectorAll(".sidebar-item");
    const sidebar = document.getElementById("sidebar");
    const openSidebar = document.getElementById("open-sidebar");
    sideBarActive = !sideBarActive;
    sidebar.classList.toggle("translate-x-full");

    //Shift content to left when sidebar is open
    document
        .getElementById("content")
        .classList.toggle("lg:ml-32", sideBarActive);
    document
        .getElementById("content")
        .classList.toggle("lg:mx-auto", !sideBarActive);

    // Manage focus and accessibility attributes based on sidebar state
    const elements = [
        "close-sidebar",
        "language-dropdown",
        "play-pause-button",
        "toggle-eli5-mode-button",
    ];
    elements.forEach((id) => {
        const element = document.getElementById(id);
        if (sideBarActive) {
            element.setAttribute("aria-hidden", "false");
            element.removeAttribute("tabindex");
            openSidebar.setAttribute("aria-expanded", "true");

            // Set focus on the first element of the sidebar after a delay
            setTimeout(() => {
                languageDropdown.focus();
            }, 500);
        } else {
            element.setAttribute("aria-hidden", "true");
            element.setAttribute("tabindex", "-1");
            openSidebar.setAttribute("aria-expanded", "false");
        }
    });
}

function toggleEli5Mode() {
    eli5Mode = !eli5Mode;
    document
        .getElementById("toggle-eli5-icon")
        .classList.toggle("fa-toggle-on", eli5Mode);
    document
        .getElementById("toggle-eli5-icon")
        .classList.toggle("fa-toggle-off", !eli5Mode);
    stopAudio();
    unhighlightAllElements();
}

// Language functionality
function switchLanguage() {
    stopAudio();
    currentLanguage = document.getElementById("language-dropdown").value;
    fetchTranslations();
    document
        .getElementsByTagName("html")[0]
        .setAttribute("lang", currentLanguage);
    fetchTranslations();
}

async function fetchTranslations() {
    try {
        // This loads the static interface translation file
        const interface_response = await fetch(
            `assets/interface_translations.json`
        );
        const interface_data = await interface_response.json();
        const response = await fetch(`translations_${currentLanguage}.json`);
        const data = await response.json();
        if (interface_data[currentLanguage]) {
            translations = {
                ...data.texts,
                ...interface_data[currentLanguage],
            };
            // Iterate over the language dropdown and populate the correct name of each language
            const dropdown = document.getElementById("language-dropdown");
            const options = Array.from(dropdown.options); // Convert HTMLCollection to Array

            options.forEach((option) => {
                // Change the text of each option
                option.textContent =
                    interface_data[option.value]["language-name"];
            });
        } else {
            translations = data.texts; // Fallback if the language is not found in interface_data
        }
        audioFiles = data.audioFiles;
        applyTranslations();
        gatherAudioElements(); // Ensure audio elements are gathered after translations are applied
    } catch (error) {
        console.error("Error loading translations:", error);
    }
}

function applyTranslations() {
    unhighlightAllElements();

    for (const [key, value] of Object.entries(translations)) {
        // Skip elements with data-id starting with sectioneli5
        if (key.startsWith("sectioneli5")) continue;

        let translationKey = key;

        // Check if Easy-Read mode is enabled and if an easy-read version exists
        if (easyReadMode) {
            const easyReadKey = `easyread-${key}`;
            if (translations.hasOwnProperty(easyReadKey)) {
                translationKey = easyReadKey; // Use easy-read key if available
            }
        }

        const element = document.querySelector(`[data-id="${key}"]`);
        if (element) {
            if (element.tagName === "IMG") {
                element.setAttribute("alt", translations[translationKey]); // Set the alt text for images
            } else {
                element.textContent = translations[translationKey]; // Set the text content for other elements
            }
        }
    }

    if (isPlaying) {
        stopAudio();
        currentIndex = 0;
        playAudioSequentially();
    }
    // Gather the audio elements again based on the current mode (easy-read or normal)
    gatherAudioElements();
}

// Audio functionality
function gatherAudioElements() {
    audioElements = Array.from(document.querySelectorAll("[data-id]"))
        .map((el) => {
            const id = el.getAttribute("data-id");
            if (id.startsWith("sectioneli5")) return null; // Skip elements with data-id starting with sectioneli5

            let audioSrc = audioFiles[id]; // Default audio source

            // Check if Easy-Read mode is enabled and if an easy-read version exists
            if (easyReadMode) {
                const easyReadAudioId = `easyread-${id}`;
                if (audioFiles.hasOwnProperty(easyReadAudioId)) {
                    audioSrc = audioFiles[easyReadAudioId]; // Use easy-read audio source if available
                }
            }

            return {
                element: el,
                id: id,
                audioSrc: audioSrc,
            };
        })
        .filter((item) => item && item.audioSrc); // Filter out null values
}

function playAudioSequentially() {
    if (currentIndex >= audioElements.length) {
        stopAudio();
        return;
    }

    const { element, audioSrc } = audioElements[currentIndex];
    highlightElement(element);

    currentAudio = new Audio(audioSrc);
    currentAudio.play();

    currentAudio.onended = () => {
        unhighlightElement(element);
        currentIndex++;
        playAudioSequentially();
    };

    currentAudio.onerror = () => {
        unhighlightElement(element);
        currentIndex++;
        playAudioSequentially();
    };
}

function togglePlayPause() {
    if (isPlaying) {
        if (currentAudio) currentAudio.pause();
        if (eli5Audio) eli5Audio.pause();
        isPlaying = !isPlaying;
    } else {
        if (eli5Active && eli5Audio) {
            eli5Audio.play();
        } else {
            if (currentAudio) {
                currentAudio.play();
            } else {
                gatherAudioElements();
                currentIndex = 0;
                playAudioSequentially();
            }
        }
        isPlaying = !isPlaying;
    }
    setPlayPauseIcon();
}

function setPlayPauseIcon() {
    if (isPlaying) {
        document.getElementById("play-pause-icon").classList.remove("fa-play");
        document.getElementById("play-pause-icon").classList.add("fa-pause");
    } else {
        document.getElementById("play-pause-icon").classList.remove("fa-pause");
        document.getElementById("play-pause-icon").classList.add("fa-play");
    }
}

function stopAudio() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    if (eli5Audio) {
        eli5Audio.pause();
        eli5Audio = null;
    }
    isPlaying = false;
    setPlayPauseIcon();
}

// Highlight text while audio is playing
function highlightElement(element) {
    if (element) {
        element.classList.add(
            "outline-dotted",
            "outline-yellow-500",
            "outline-4",
            "box-shadow-outline",
            "rounded-lg"
        );
    }
}

function unhighlightElement(element) {
    if (element) {
        element.classList.remove(
            "outline-dotted",
            "outline-yellow-500",
            "outline-4",
            "box-shadow-outline",
            "rounded-lg"
        );
    }
}

function unhighlightAllElements() {
    document.querySelectorAll(".outline-dotted").forEach((element) => {
        element.classList.remove(
            "outline-dotted",
            "outline-yellow-500",
            "outline-4",
            "box-shadow-outline",
            "rounded-lg"
        );
    });
}

function handleElementClick(event) {
    const element = event.currentTarget;
    const dataId = element.getAttribute("data-id");

    document.querySelectorAll(".outline-dotted").forEach((el) => {
        if (el !== element && !element.contains(el)) {
            unhighlightElement(el);
        }
    });

    if (eli5Mode) {
        if (dataId.startsWith("sectioneli5")) {
            const eli5Text = translations[dataId];
            const eli5AudioSrc = audioFiles[dataId];

            document.getElementById("eli5-content").textContent = eli5Text;
            highlightElement(element);

            if (eli5AudioSrc) {
                stopAudio();
                eli5Active = true;
                eli5Audio = new Audio(eli5AudioSrc);
                eli5Audio.play();

                eli5Audio.onended = () => {
                    unhighlightElement(document.getElementById("eli5-content"));
                    eli5Active = false;
                    isPlaying = false;
                    setPlayPauseIcon();
                };

                eli5Audio.onerror = () => {
                    unhighlightElement(document.getElementById("eli5-content"));
                    eli5Active = false;
                    isPlaying = false;
                    setPlayPauseIcon();
                };

                isPlaying = true;
            }
        }
    } else {
        if (!eli5Mode && !dataId.startsWith("sectioneli5")) {
            // Handle normal audio elements
            const audioSrc = audioFiles[dataId];
            if (audioSrc) {
                stopAudio();
                currentAudio = new Audio(audioSrc);
                highlightElement(element);
                currentAudio.play();

                currentAudio.onended = () => {
                    unhighlightElement(element);
                    currentIndex =
                        audioElements.findIndex((item) => item.id === dataId) +
                        1;
                    playAudioSequentially();
                };

                currentAudio.onerror = () => {
                    unhighlightElement(element);
                    currentIndex =
                        audioElements.findIndex((item) => item.id === dataId) +
                        1;
                    playAudioSequentially();
                };

                isPlaying = true;
            }
        }
    }
    setPlayPauseIcon();
}

// Toggle the left nav bar, Toggle Menu
function toggleNav() {
    const navToggle = document.querySelector(".nav__toggle");
    const navList = document.querySelector(".nav__list");
    const navLinks = document.querySelectorAll(".nav__list-link");
    const navPopup = document.getElementById("navPopup");

    if (!navList || !navToggle || !navLinks || !navPopup) {
        return; // Exit if elements are not found
    }

    if (!navList.hasAttribute("hidden")) {
        navToggle.setAttribute("aria-expanded", "false");
        navList.setAttribute("hidden", "true");
    } else {
        navToggle.setAttribute("aria-expanded", "true");
        navList.removeAttribute("hidden");

        // Set focus on first link
        navLinks[0].focus();
    }
    navPopup.classList.toggle("-translate-x-full");
    navPopup.setAttribute(
        "aria-hidden",
        navPopup.classList.contains("-translate-x-full") ? "true" : "false"
    );
}

// Next and previous pages
function previousPage() {
    const currentHref = window.location.href.split("/").pop();
    const navItems = document.querySelectorAll(".nav__list-link");
    for (let i = 0; i < navItems.length; i++) {
        if (navItems[i].getAttribute("href") === currentHref) {
            if (i > 0) {
                const prevItem = navItems[i - 1];
                window.location.href = prevItem.getAttribute("href");
                document.getElementById("page-number").innerText =
                    prevItem.innerText;
            }
            break;
        }
    }
}

function nextPage() {
    const currentHref = window.location.href.split("/").pop();
    const navItems = document.querySelectorAll(".nav__list-link");
    for (let i = 0; i < navItems.length; i++) {
        if (navItems[i].getAttribute("href") === currentHref) {
            if (i < navItems.length - 1) {
                const nextItem = navItems[i + 1];
                window.location.href = nextItem.getAttribute("href");
                document.getElementById("page-number").innerText =
                    nextItem.innerText;
            }
            break;
        }
    }
}

// Easy-Read Mode Functionality

// Function to toggle Easy-Read mode
function toggleEasyReadMode() {
    easyReadMode = !easyReadMode;
    document
        .getElementById("toggle-easy-read-icon")
        .classList.toggle("fa-toggle-on", easyReadMode);
    document
        .getElementById("toggle-easy-read-icon")
        .classList.toggle("fa-toggle-off", !easyReadMode);
    stopAudio();
    currentLanguage = document.getElementById("language-dropdown").value;
    fetchTranslations();
    gatherAudioElements(); // Call this after fetching translations to update audio elements
}
