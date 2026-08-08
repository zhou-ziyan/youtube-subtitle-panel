// Navigation — URL detection, SPA navigation handling, page change orchestration

function getVideoIdFromUrl(url) {
    const urlParams = new URLSearchParams(new URL(url).search);
    return urlParams.get('v');
}

function isYouTubeVideoPage() {
    return window.location.pathname === '/watch' && window.location.href.includes('v=');
}

function handlePageChange() {
    const currentVideoId = getVideoIdFromUrl(window.location.href);

    // Same video and panel already alive (timestamp-only URL change, or a
    // duplicate SPA event) — leave the panel alone instead of rebuilding it
    const existingPanel = document.getElementById('subtitle-panel');
    if (existingPanel && isYouTubeVideoPage() &&
        existingPanel.dataset.currentVideoId === currentVideoId) {
        return;
    }

    console.log('[handlePageChange] Detected video ID:', currentVideoId);
    cleanupPanel();
    if (isYouTubeVideoPage()) {
        createSubtitlePanel();
    }
}

// Single entry point for SPA navigation. YouTube calls replaceState constantly
// (even with an unchanged URL), and pushState + the MutationObserver can both
// fire for one navigation — so only react when the URL actually changed.
let lastUrl = location.href;
function checkForUrlChange() {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    console.log('[checkForUrlChange] URL changed, handling page change');
    handlePageChange();
}

// URL change observer (YouTube SPA navigation)
const urlObserver = new MutationObserver(checkForUrlChange);
urlObserver.observe(document.body, {
    childList: true,
    subtree: true
});

// Handle browser back/forward and page unload
window.addEventListener('popstate', checkForUrlChange);
window.addEventListener('beforeunload', cleanupPanel);

// Patch pushState/replaceState for YouTube SPA navigation
const pushState = history.pushState;
history.pushState = function() {
    pushState.apply(history, arguments);
    checkForUrlChange();
};

const replaceState = history.replaceState;
history.replaceState = function() {
    replaceState.apply(history, arguments);
    checkForUrlChange();
};
