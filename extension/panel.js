// Panel — HTML creation, cleanup, and feature initialization

// Dynamic stylesheet for pushing YouTube content aside
let panelLayoutStyle = null;

function applyPanelWidth(width) {
    if (!panelLayoutStyle) {
        panelLayoutStyle = document.createElement('style');
        panelLayoutStyle.id = 'subtitle-panel-layout';
        document.head.appendChild(panelLayoutStyle);
    }
    panelLayoutStyle.textContent = `
        ytd-app { margin-right: ${width}px !important; }
        #masthead-container { right: ${width}px !important; }
    `;
    window.dispatchEvent(new Event('resize'));
}

function removePanelWidth() {
    if (panelLayoutStyle) {
        panelLayoutStyle.remove();
        panelLayoutStyle = null;
    }
    window.dispatchEvent(new Event('resize'));
}

async function createSubtitlePanel() {
    const currentVideoId = getVideoIdFromUrl(window.location.href);
    console.log('[createSubtitlePanel] Creating panel for video:', currentVideoId);

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

    // Set initial width
    const savedPanelWidth = localStorage.getItem(STORAGE_KEYS.PANEL_WIDTH);
    const initialWidth = savedPanelWidth ? parseInt(savedPanelWidth) : 400;
    panel.style.width = initialWidth + 'px';
    applyPanelWidth(initialWidth);

    // Create the show button (initially hidden)
    const showButton = document.createElement('button');
    showButton.id = 'show-panel';
    showButton.textContent = 'Show';
    showButton.style.display = 'none';
    document.body.appendChild(showButton);

    // Initialize panel features
    initializePanelFeatures();

    await updateCaptionsAndLanguages();

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
        removePanelWidth();
    });

    // Always apply night mode
    // TODO: implement light/dark toggle
    panel.classList.add('night-mode');
    showButton.classList.add('night-mode');

    // Initialize font size controls
    initializeFontSizeControls();
}

function cleanupPanel() {
    const video = document.querySelector('video');
    if (video) video.removeEventListener('timeupdate', updateActiveCaption);

    const panel = document.getElementById('subtitle-panel');
    const showButton = document.getElementById('show-panel');

    if (panel) panel.remove();
    if (showButton) showButton.remove();

    removePanelWidth();
}
