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
    console.log('[handlePageChange] Detected video ID:', currentVideoId);
    cleanupPanel();
    if (isYouTubeVideoPage()) {
        createSubtitlePanel();
    }
}

// URL change observer (YouTube SPA navigation)
let lastUrl = location.href;
const urlObserver = new MutationObserver(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        console.log('[urlObserver] URL changed, handling page change');
        handlePageChange();
    }
});

urlObserver.observe(document.querySelector('body'), {
    childList: true,
    subtree: true
});

// Handle browser back/forward and page unload
window.addEventListener('popstate', handlePageChange);
window.addEventListener('beforeunload', cleanupPanel);

// Patch pushState/replaceState for YouTube SPA navigation
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
