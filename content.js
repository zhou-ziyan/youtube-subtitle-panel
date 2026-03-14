// Global variables for cleanup
let currentVideoObserver = null;
let currentCleanupFunction = null;

// Function to extract video ID from URL
function getVideoIdFromUrl(url) {
    const urlParams = new URLSearchParams(new URL(url).search);
    return urlParams.get('v');
}

// Function to create and inject the subtitle panel
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
    // Create the panel element
    const panel = document.createElement('div');
    panel.id = 'subtitle-panel';
    panel.dataset.currentVideoId = currentVideoId;
    
    // Add content with hide button and font controls in footer
    panel.innerHTML = `
        <div class="resize-handle" id="resize-handle"></div>
        <div class="subtitle-header">
            <span class="refresh-warning" style="margin-right:8px;color:#ff9800;font-size:13px;">Not the new subtitle? Click here:</span>
            <button id="refresh-page-btn" class="refresh-btn" title="Refresh page">⟳</button>
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

    // Insert the panel into the page
    document.body.appendChild(panel);
    console.log('[createSubtitlePanel] Panel inserted into page');
    
    // Set initial width to match CSS default or saved value
    const savedPanelWidth = localStorage.getItem('youtube-subtitle-panel-width');
    const initialWidth = savedPanelWidth ? parseInt(savedPanelWidth) : 400;
    panel.style.width = initialWidth + 'px';
    const ytdApp = document.querySelector('ytd-app');
    if (ytdApp) {
        ytdApp.style.paddingRight = initialWidth + 'px';
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 100);
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
    
    await updateCaptionsAndLanguages(currentVideoId);
    console.log('[createSubtitlePanel] Captions loaded');

    // Add refresh button event listener
    document.getElementById('refresh-page-btn').addEventListener('click', () => {
        localStorage.setItem('subtitles-reloaded', '1');
        window.location.reload();
    });

    // Resizable functionality
    const resizeHandle = document.getElementById('resize-handle');
    let isResizing = false;
    let startX = 0;
    let startWidth = 0;

    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startWidth = panel.offsetWidth;
        document.body.style.cursor = 'ew-resize';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        const dx = startX - e.clientX;
        let newWidth = startWidth + dx;
        newWidth = Math.max(200, Math.min(newWidth, 600)); // Clamp width between 200px and 600px
        panel.style.width = newWidth + 'px';
        localStorage.setItem('youtube-subtitle-panel-width', newWidth);
        const ytdApp = document.querySelector('ytd-app');
        if (ytdApp) {
            ytdApp.style.paddingRight = newWidth + 'px';
        }
        window.dispatchEvent(new Event('resize'));
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            window.dispatchEvent(new Event('resize'));
        }
    });

    // Make show button draggable
    let dragStartX = 0, dragStartY = 0, dragMoved = false;
    let offsetX = 0, offsetY = 0, isDragging = false;
    let showBtnPos = localStorage.getItem('youtube-subtitle-show-btn-pos');
    if (showBtnPos) {
        try {
            const pos = JSON.parse(showBtnPos);
            showButton.style.position = 'fixed';
            showButton.style.right = 'unset';
            showButton.style.bottom = 'unset';
            showButton.style.left = pos.left;
            showButton.style.top = pos.top;
        } catch (e) {}
    }
    showButton.addEventListener('mousedown', (e) => {
        isDragging = true;
        dragMoved = false;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        offsetX = e.clientX - showButton.getBoundingClientRect().left;
        offsetY = e.clientY - showButton.getBoundingClientRect().top;
        showButton.style.transition = 'none';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        let left = e.clientX - offsetX;
        let top = e.clientY - offsetY;
        // Clamp to viewport
        left = Math.max(0, Math.min(left, window.innerWidth - showButton.offsetWidth));
        top = Math.max(0, Math.min(top, window.innerHeight - showButton.offsetHeight));
        showButton.style.position = 'fixed';
        showButton.style.left = left + 'px';
        showButton.style.top = top + 'px';
        showButton.style.right = 'unset';
        showButton.style.bottom = 'unset';
        // If moved more than a few pixels, consider as drag
        if (Math.abs(e.clientX - dragStartX) > 3 || Math.abs(e.clientY - dragStartY) > 3) {
            dragMoved = true;
        }
    });
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            showButton.style.transition = '';
            document.body.style.userSelect = '';
            // Save position
            localStorage.setItem('youtube-subtitle-show-btn-pos', JSON.stringify({
                left: showButton.style.left,
                top: showButton.style.top
            }));
        }
    });
    showButton.addEventListener('click', (e) => {
        if (dragMoved) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        showButton.style.display = 'none';
        panel.style.display = '';
        setTimeout(() => {
            panel.classList.remove('panel-hidden');
        }, 50);
        // Reset show button position to default (bottom right) after showing panel
        showButton.style.position = '';
        showButton.style.left = '';
        showButton.style.top = '';
        showButton.style.right = '';
        showButton.style.bottom = '';
        localStorage.removeItem('youtube-subtitle-show-btn-pos');
        const ytdApp = document.querySelector('ytd-app');
        if (ytdApp) {
            // Restore to last used width or default
            const savedPanelWidth = localStorage.getItem('youtube-subtitle-panel-width');
            const width = savedPanelWidth ? parseInt(savedPanelWidth) : 400;
            ytdApp.style.paddingRight = width + 'px';
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 350);
        }
    });
}

// Function to initialize panel features
function initializePanelFeatures() {
    const panel = document.getElementById('subtitle-panel');
    const showButton = document.getElementById('show-panel');

    // Add hide/show functionality
    document.getElementById('hide-panel').addEventListener('click', () => {
        panel.style.display = 'none';
        showButton.style.display = 'block';
        showButton.textContent = 'Show';
        const ytdApp = document.querySelector('ytd-app');
        if (ytdApp) {
            ytdApp.style.removeProperty('padding-right');
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 50);
        }
    });
    
    // Always apply night mode
    // TODO
    panel.classList.add('night-mode');
    showButton.classList.add('night-mode');

    // Initialize font size controls
    initializeFontSizeControls();

    // Adjust the main YouTube content to match persisted panel width
    const savedPanelWidth = localStorage.getItem('youtube-subtitle-panel-width');
    const initialWidth = savedPanelWidth ? parseInt(savedPanelWidth) : 400;
    const ytdApp = document.querySelector('ytd-app');
    if (ytdApp) {
        ytdApp.style.paddingRight = initialWidth + 'px';
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 100);
    }
}

// Function to handle page changes
function handlePageChange() {
    const currentVideoId = getVideoIdFromUrl(window.location.href);
    console.log('[handlePageChange] Detected video ID:', currentVideoId);
    // Clean up existing panel first
    cleanupPanel();
    if (isYouTubeVideoPage()) {
        createSubtitlePanel();
    }
}

// Create a URL change observer
let lastUrl = location.href;
const urlObserver = new MutationObserver(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        console.log('[urlObserver] URL changed, handling page change');
        
        // Reload the page once on URL change to ensure fresh player data
        if (!localStorage.getItem('subtitles-reloaded')) {
            localStorage.setItem('subtitles-reloaded', '1');
            window.location.reload();
            return;
        } else {
            localStorage.removeItem('subtitles-reloaded');
        }
        handlePageChange();
    }
});

// Start observing URL changes
urlObserver.observe(document.querySelector('body'), {
    childList: true,
    subtree: true
});

// Handle navigation events
window.addEventListener('popstate', handlePageChange);
window.addEventListener('beforeunload', cleanupPanel);

// Handle YouTube's spa navigation
const pushState = history.pushState;
history.pushState = function() {
    pushState.apply(history, arguments);
    handlePageChange();
};

const replaceState = history.replaceState;
history.replaceState = function() {
    replaceState.apply(history, arguments);
    handlePageChange();
};

// Font size management
function initializeFontSizeControls() {
    const MIN_FONT_SIZE = 12;
    const MAX_FONT_SIZE = 24;
    const FONT_SIZE_STEP = 2;
    const DEFAULT_FONT_SIZE = 14;

    // Get saved font size or use default
    function getFontSize() {
        const savedSize = localStorage.getItem('youtube-subtitle-font-size');
        return savedSize ? parseInt(savedSize) : DEFAULT_FONT_SIZE;
    }

    // Save font size preference
    function saveFontSize(size) {
        localStorage.setItem('youtube-subtitle-font-size', size.toString());
    }

    // Apply font size to captions
    function applyFontSize(size) {
        const captionTexts = document.querySelectorAll('.caption-text');
        captionTexts.forEach(text => {
            text.style.fontSize = `${size}px`;
        });
        saveFontSize(size);
    }

    // Initialize font size
    let currentFontSize = getFontSize();

    // Add font size control handlers
    document.getElementById('increase-font').addEventListener('click', () => {
        if (currentFontSize < MAX_FONT_SIZE) {
            currentFontSize += FONT_SIZE_STEP;
            applyFontSize(currentFontSize);
        }
    });

    document.getElementById('decrease-font').addEventListener('click', () => {
        if (currentFontSize > MIN_FONT_SIZE) {
            currentFontSize -= FONT_SIZE_STEP;
            applyFontSize(currentFontSize);
        }
    });

    return currentFontSize;
}

// Store captions data globally
let currentCaptions = [];
let lastActiveCaptionTime = null;

// Function to get preferred language code
function getPreferredLanguage() {
    // 1. Check localStorage first (user's last selection)
    const savedLang = localStorage.getItem('youtube-subtitle-language');
    if (savedLang) return savedLang;

    // 2. Try to get YouTube's interface language
    const ytLang = document.documentElement.getAttribute('lang') || '';
    if (ytLang) return ytLang.split('-')[0]; // Convert 'en-US' to 'en'

    // 3. Use browser's language as fallback
    const browserLang = navigator.language || navigator.userLanguage;
    return browserLang.split('-')[0]; // Convert 'en-US' to 'en'
}

// Function to save language preference
function saveLanguagePreference(languageCode) {
    localStorage.setItem('youtube-subtitle-language', languageCode);
}

// Function to find best matching language track
function findBestLanguageMatch(tracks, preferredLang) {
    // First try: exact match
    let track = tracks.find(t => t.languageCode === preferredLang);
    
    // Second try: case-insensitive match
    if (!track) {
        track = tracks.find(t => t.languageCode.toLowerCase() === preferredLang.toLowerCase());
    }
    
    // Third try: find any variant of the language (e.g., 'en-US' for 'en')
    if (!track) {
        track = tracks.find(t => t.languageCode.toLowerCase().startsWith(preferredLang.toLowerCase()));
    }
    
    // Fallback to English if available
    if (!track && preferredLang !== 'en') {
        track = tracks.find(t => t.languageCode.toLowerCase().startsWith('en'));
    }
    
    // Last resort: just use the first available track
    if (!track && tracks.length > 0) {
        track = tracks[0];
    }
    
    return track;
}

// Function to extract caption tracks
async function getCaptionTracks() {
    try {
        let playerData;
        
        try {
            const ytPlayerData = document.body.innerHTML.match(/ytInitialPlayerResponse\s*=\s*({.+?});/)?.[1];
            if (ytPlayerData) {
                playerData = JSON.parse(ytPlayerData);
                console.log(playerData);
                console.log('Successfully got player data from ytInitialPlayerResponse');
            }
        } catch (e) {
            console.log('Failed to get data from ytInitialPlayerResponse:', e.message);
        }
        
        if (!playerData) {
            throw new Error('Player data not found');
        }

        const captionTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

        if (!captionTracks || captionTracks.length === 0) {
            // Check if video has no captions at all
            if (playerData?.captions === undefined) {
                throw new Error('Video does not have any captions');
            }
            throw new Error('No caption tracks found in player data');
        }

        // Log success and return the tracks
        console.log(`Successfully found ${captionTracks.length} caption tracks`);
        return captionTracks.map(track => ({
            languageCode: track.languageCode,
            languageName: track.name?.simpleText || track.name?.runs?.[0]?.text || track.languageCode,
            baseUrl: track.baseUrl
        }));
    } catch (error) {
        // Use a user-friendly message instead of an error
        const errorMessage = 'No subtitles could be loaded for this video. You can try to refresh the page using the button in the top right corner.';
        console.warn(errorMessage);
        return null;
    }
}

// Function to fetch captions for a specific track
async function fetchCaptions(baseUrl) {
    const response = await fetch(`${baseUrl}&fmt=json3`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    if (!data.events) {
        throw new Error('Caption response missing events field');
    }
    return data.events
        .filter(event => event.segs) // Filter out events without text
        .map(event => ({
            startTime: event.tStartMs,
            duration: event.dDurationMs,
            endTime: event.tStartMs + event.dDurationMs,
            text: event.segs.map(seg => seg?.utf8 ?? '').join('').trim()
        }))
        .filter(caption => caption.text); // Filter out empty captions
}

// Function to format time (ms to MM:SS)
function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Function to find the active caption based on current video time
function findActiveCaption(currentTime) {
    const timeMs = currentTime * 1000;
    return currentCaptions.find(caption => 
        timeMs >= caption.startTime && timeMs < caption.endTime
    );
}

// Function to scroll to active caption
function scrollToCaption(captionElement) {
    if (!captionElement) return;
    
    const container = document.querySelector('.subtitle-content');
    const containerHeight = container.clientHeight;
    const captionTop = captionElement.offsetTop;
    
    // Scroll the caption to be at 1/3 of the container height
    container.scrollTop = captionTop - (containerHeight / 3);
}

// Function to update active caption
function updateActiveCaption() {
    const video = document.querySelector('video');
    if (!video) return;

    // Detect if an ad is playing
    const player = document.querySelector('#movie_player');
    const subtitleContent = document.querySelector('.subtitle-content');
    const adSignId = 'subtitle-ad-sign';
    let adPlaying = false;
    if (player && (typeof player.getAdState === 'function' ? player.getAdState() === 1 : player.classList.contains('ad-showing'))) {
        adPlaying = true;
    }

    // Show or hide ad sign
    if (subtitleContent) {
        let adSign = document.getElementById(adSignId);
        if (adPlaying) {
            if (!adSign) {
                adSign = document.createElement('div');
                adSign.id = adSignId;
                adSign.style.color = '#ff9800';
                adSign.style.textAlign = 'center';
                adSign.style.margin = '10px 0';
                adSign.style.fontSize = '14px';
                adSign.textContent = 'Subtitles loaded. Ad is playing...';
                subtitleContent.prepend(adSign);
            }
        } else {
            if (adSign) {
                adSign.remove();
            }
        }
    }

    if (adPlaying) {
        // If ad is playing, do not scroll or highlight
        return;
    }

    const activeCaption = findActiveCaption(video.currentTime);
    // If no active caption or same caption is still active, do nothing
    if (!activeCaption || activeCaption.startTime === lastActiveCaptionTime) {
        return;
    }

    // Remove previous active class
    const previousActive = document.querySelector('.caption-item.active');
    if (previousActive) {
        previousActive.classList.remove('active');
    }

    // Add active class to current caption
    const currentElement = document.querySelector(`[data-start="${activeCaption.startTime}"]`);
    if (currentElement) {
        currentElement.classList.add('active');
        scrollToCaption(currentElement);
        lastActiveCaptionTime = activeCaption.startTime;
    }
}

// Function to seek video to specific time
function seekToTime(timeMs) {
    // First try to get the video element
    const video = document.querySelector('video');
    if (!video) return;

    // Try to get YouTube player
    const player = document.querySelector('#movie_player');
    if (player && typeof player.seekTo === 'function') {
        // Use YouTube's API if available
        player.seekTo(timeMs / 1000);
    } else {
        // Fallback to video element
        video.currentTime = timeMs / 1000;
    }
}

// Function to handle caption click
function handleCaptionClick(event) {
    const captionItem = event.target.closest('.caption-item');
    if (!captionItem) return;

    const startTime = parseInt(captionItem.dataset.start);
    if (!isNaN(startTime)) {
        seekToTime(startTime);
        
        // Add click feedback animation
        captionItem.style.transform = 'scale(0.95)';
        setTimeout(() => {
            captionItem.style.transform = '';
        }, 200);
    }
}

// Function to display captions in the panel
function displayCaptions(captions) {
    const subtitleContent = document.querySelector('.subtitle-content');
    if (!captions || captions.length === 0) {
        subtitleContent.innerHTML = '<div class="no-captions">No captions available</div>';
        return;
    }

    currentCaptions = captions;
    lastActiveCaptionTime = null;
    
    // Get current font size from localStorage or use default
    const currentFontSize = localStorage.getItem('youtube-subtitle-font-size') || '14';
    
    subtitleContent.innerHTML = `
        <div class="captions-list">
            ${captions.map(caption => `
                <div class="caption-item" data-start="${caption.startTime}" data-end="${caption.endTime}">
                    <span class="caption-time">${formatTime(caption.startTime)}</span>
                    <span class="caption-text" style="font-size: ${currentFontSize}px">${caption.text}</span>
                </div>
            `).join('')}
        </div>
    `;

    // Add click event listener to the captions list
    const captionsList = subtitleContent.querySelector('.captions-list');
    captionsList.addEventListener('click', handleCaptionClick);

    // Start tracking video time
    const video = document.querySelector('video');
    if (video) {
        video.removeEventListener('timeupdate', updateActiveCaption);
        video.addEventListener('timeupdate', updateActiveCaption);
        updateActiveCaption();
    }
}

// Function to update language selector and load captions
async function updateCaptionsAndLanguages() {
    const subtitleContent = document.querySelector('.subtitle-content');
    const languageSelect = document.getElementById('language-select');
    
    if (!subtitleContent || !languageSelect) {
        console.log('[updateCaptionsAndLanguages] Required elements not found, aborting');
        return;
    }
    
    const currentVideoId = getVideoIdFromUrl(window.location.href);

    // Clear previous content and show loading state
    subtitleContent.innerHTML = '<div class="loading-text">Loading subtitles...</div>';
    languageSelect.innerHTML = '<option value="">Loading languages...</option>';
    languageSelect.disabled = true;

    // Remove previous event listeners by replacing the node
    const newSelect = languageSelect.cloneNode(true);
    languageSelect.parentNode.replaceChild(newSelect, languageSelect);

    try {
        // Always fetch fresh caption tracks for the current video
        const tracks = await getCaptionTracks();
        
        if (!tracks || tracks.length === 0) {
            const message = 'No subtitles could be loaded for this video. You can try to refresh the page using the button in the top right corner.';
            subtitleContent.innerHTML = `<div class="no-captions">${message}</div>`;
            newSelect.innerHTML = `<option value="">${message}</option>`;
            newSelect.disabled = true;
            return;
        }

        // Sort tracks alphabetically by language name
        tracks.sort((a, b) => {
            const nameA = a.languageName || a.languageCode;
            const nameB = b.languageName || b.languageCode;
            return nameA.localeCompare(nameB);
        });

        // Update language selector with fresh tracks
        newSelect.innerHTML = tracks.map(track => 
            `<option value="${track.baseUrl}" data-lang="${track.languageCode}">
                ${track.languageName || track.languageCode}
            </option>`
        ).join('');
        newSelect.disabled = false;

        // Find and select the preferred language
        const preferredLang = getPreferredLanguage();
        const bestMatch = findBestLanguageMatch(tracks, preferredLang);
        let selectedBaseUrl = bestMatch ? bestMatch.baseUrl : tracks[0].baseUrl;
        newSelect.value = selectedBaseUrl;

        // Fetch captions for the selected language (always from current video)
        const captions = await fetchCaptions(selectedBaseUrl);
        displayCaptions(captions);

        // Add new event listener for language changes
        newSelect.addEventListener('change', async (e) => {
            if (e.target.value) {
                const selectedOption = e.target.selectedOptions[0];
                const langCode = selectedOption.getAttribute('data-lang');
                saveLanguagePreference(langCode);

                subtitleContent.innerHTML = '<div class="loading-text">Loading subtitles...</div>';
                // Always fetch fresh tracks for the current video on language change
                const freshTracks = await getCaptionTracks();
                const freshTrack = freshTracks.find(track => track.baseUrl === e.target.value);
                if (freshTrack) {
                    try {
                        const captions = await fetchCaptions(freshTrack.baseUrl);
                        displayCaptions(captions);
                    } catch (err) {
                        subtitleContent.innerHTML = `<div class="no-captions">Error loading subtitles: ${err.message}</div>`;
                    }
                } else {
                    subtitleContent.innerHTML = `<div class="no-captions">Error: Selected language track not found for this video</div>`;
                }
            }
        });

    } catch (error) {
        console.error('Error loading captions:', error);
        const errorMessage = error.message || 'Unknown error occurred while loading subtitles';
        subtitleContent.innerHTML = `<div class="no-captions">Error: ${errorMessage}</div>`;
        newSelect.innerHTML = `<option value="">Error loading languages</option>`;
        newSelect.disabled = true;
    }
}

// Function to check if we're on a YouTube video page
function isYouTubeVideoPage() {
    return window.location.pathname === '/watch' && window.location.href.includes('v=');
}

// Function to clean up the panel and restore page layout
function cleanupPanel() {
    const panel = document.getElementById('subtitle-panel');
    const showButton = document.getElementById('show-panel');
    
    // Remove elements if they exist
    if (panel) {
        panel.remove();
    }
    if (showButton) {
        showButton.remove();
    }
    
    // Restore original page layout
    const ytdApp = document.querySelector('ytd-app');
    if (ytdApp) {
        ytdApp.style.removeProperty('padding-right');
    }
    
    // Reset video player width
    const videoPlayer = document.querySelector('#movie_player');
    if (videoPlayer) {
        videoPlayer.style.removeProperty('width');
    }
    
    // Trigger resize to ensure proper layout
    window.dispatchEvent(new Event('resize'));
}

// Initialize on page load
if (document.readyState === 'complete') {
    handlePageChange();
} else {
    window.addEventListener('load', handlePageChange);
} 