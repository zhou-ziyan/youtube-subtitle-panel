// Panel — HTML creation, cleanup, and feature initialization

// Global variables for cleanup
let currentVideoObserver = null;
let currentCleanupFunction = null;

async function createSubtitlePanel() {
    // Clean up any existing observers and event listeners
    if (currentVideoObserver) {
        console.log('[createSubtitlePanel] Cleaning up previous video observer');
        currentVideoObserver.disconnect();
    }
    if (currentCleanupFunction) {
        console.log('[createSubtitlePanel] Running previous cleanup function');
        currentCleanupFunction();
    }

    const currentVideoId = getVideoIdFromUrl(window.location.href);
    console.log('[createSubtitlePanel] Creating panel elements for video:', currentVideoId);

    const panel = document.createElement('div');
    panel.id = 'subtitle-panel';
    panel.dataset.currentVideoId = currentVideoId;

    panel.innerHTML = `
        <div class="resize-handle" id="resize-handle"></div>
        <div class="subtitle-header">
            <select id="language-select">
                <option value="">Loading languages...</option>
            </select>
        </div>
        <div class="subtitle-content">
            <div class="loading-text">Loading subtitles...</div>
        </div>
        <div class="subtitle-footer">
            <div class="footer-controls">
                <div class="font-size-controls">
                    <button class="font-size-btn" id="decrease-font">A-</button>
                    <button class="font-size-btn" id="increase-font">A+</button>
                </div>
                <button class="toggle-button" id="hide-panel">Hide</button>
            </div>
        </div>
    `;

    document.body.appendChild(panel);
    console.log('[createSubtitlePanel] Panel inserted into page');

    // Set initial width from saved value or default
    const savedPanelWidth = localStorage.getItem(STORAGE_KEYS.PANEL_WIDTH);
    const initialWidth = savedPanelWidth ? parseInt(savedPanelWidth) : 400;
    panel.style.width = initialWidth + 'px';
    const ytdApp = document.querySelector('ytd-app');
    if (ytdApp) {
        ytdApp.style.paddingRight = initialWidth + 'px';
        setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 100);
    }

    // Create the show button (initially hidden)
    const showButton = document.createElement('button');
    showButton.id = 'show-panel';
    showButton.textContent = 'Show';
    showButton.style.display = 'none';
    document.body.appendChild(showButton);

    // Initialize panel features
    initializePanelFeatures();
    console.log('[createSubtitlePanel] Panel features initialized');

    await updateCaptionsAndLanguages();
    console.log('[createSubtitlePanel] Captions loaded');

    // Set up resize and drag interactions
    initializePanelInteractions(panel, showButton);
}

function initializePanelFeatures() {
    const panel = document.getElementById('subtitle-panel');
    const showButton = document.getElementById('show-panel');

    // Hide/show functionality
    document.getElementById('hide-panel').addEventListener('click', () => {
        panel.style.display = 'none';
        showButton.style.display = 'block';
        showButton.textContent = 'Show';
        const ytdApp = document.querySelector('ytd-app');
        if (ytdApp) {
            ytdApp.style.removeProperty('padding-right');
            setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 50);
        }
    });

    // Always apply night mode
    // TODO: implement light/dark toggle
    panel.classList.add('night-mode');
    showButton.classList.add('night-mode');

    // Initialize font size controls
    initializeFontSizeControls();

    // Adjust YouTube content to match persisted panel width
    const savedPanelWidth = localStorage.getItem(STORAGE_KEYS.PANEL_WIDTH);
    const initialWidth = savedPanelWidth ? parseInt(savedPanelWidth) : 400;
    const ytdApp = document.querySelector('ytd-app');
    if (ytdApp) {
        ytdApp.style.paddingRight = initialWidth + 'px';
        setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 100);
    }
}

function cleanupPanel() {
    const panel = document.getElementById('subtitle-panel');
    const showButton = document.getElementById('show-panel');

    if (panel) panel.remove();
    if (showButton) showButton.remove();

    // Restore original page layout
    const ytdApp = document.querySelector('ytd-app');
    if (ytdApp) ytdApp.style.removeProperty('padding-right');

    const videoPlayer = document.querySelector('#movie_player');
    if (videoPlayer) videoPlayer.style.removeProperty('width');

    window.dispatchEvent(new Event('resize'));
}
