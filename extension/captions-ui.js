// Captions UI — display, highlight, scroll, seek, and ad detection

// Shared state for caption tracking
let currentCaptions = [];
let lastActiveCaptionTime = null;

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${minutes}:${remaining.toString().padStart(2, '0')}`;
}

function findActiveCaption(currentTime) {
    const timeMs = currentTime * 1000;
    return currentCaptions.find(c => timeMs >= c.startTime && timeMs < c.endTime);
}

function scrollToCaption(captionElement) {
    if (!captionElement) return;
    const container = document.querySelector('.subtitle-content');
    container.scrollTop = captionElement.offsetTop - (container.clientHeight / 3);
}

function seekToTime(timeMs) {
    const video = document.querySelector('video');
    if (!video) return;

    const player = document.querySelector('#movie_player');
    if (player && typeof player.seekTo === 'function') {
        player.seekTo(timeMs / 1000);
    } else {
        video.currentTime = timeMs / 1000;
    }
}

function handleCaptionClick(event) {
    const captionItem = event.target.closest('.caption-item');
    if (!captionItem) return;

    const startTime = parseInt(captionItem.dataset.start);
    if (!isNaN(startTime)) {
        seekToTime(startTime);
        captionItem.style.transform = 'scale(0.95)';
        setTimeout(() => { captionItem.style.transform = ''; }, 200);
    }
}

function isAdPlaying() {
    const player = document.querySelector('#movie_player');
    if (!player) return false;
    return typeof player.getAdState === 'function'
        ? player.getAdState() === 1
        : player.classList.contains('ad-showing');
}

function updateAdSign(subtitleContent, adPlaying) {
    const adSignId = 'subtitle-ad-sign';
    let adSign = document.getElementById(adSignId);

    if (adPlaying && !adSign) {
        adSign = document.createElement('div');
        adSign.id = adSignId;
        adSign.style.cssText = 'color:#ff9800;text-align:center;margin:10px 0;font-size:14px';
        adSign.textContent = 'Subtitles loaded. Ad is playing...';
        subtitleContent.prepend(adSign);
    } else if (!adPlaying && adSign) {
        adSign.remove();
    }
}

function updateActiveCaption() {
    const video = document.querySelector('video');
    if (!video) return;

    const subtitleContent = document.querySelector('.subtitle-content');
    const adPlaying = isAdPlaying();
    if (subtitleContent) updateAdSign(subtitleContent, adPlaying);
    if (adPlaying) return;

    const activeCaption = findActiveCaption(video.currentTime);
    if (!activeCaption || activeCaption.startTime === lastActiveCaptionTime) return;

    const previousActive = document.querySelector('.caption-item.active');
    if (previousActive) previousActive.classList.remove('active');

    const currentElement = document.querySelector(`[data-start="${activeCaption.startTime}"]`);
    if (currentElement) {
        currentElement.classList.add('active');
        scrollToCaption(currentElement);
        lastActiveCaptionTime = activeCaption.startTime;
    }
}

function displayCaptions(captions) {
    const subtitleContent = document.querySelector('.subtitle-content');
    if (!captions || captions.length === 0) {
        subtitleContent.innerHTML = '<div class="no-captions">No captions available</div>';
        return;
    }

    currentCaptions = captions;
    lastActiveCaptionTime = null;

    const fontSize = localStorage.getItem(STORAGE_KEYS.FONT_SIZE) || '14';

    subtitleContent.innerHTML = `
        <div class="captions-list">
            ${captions.map(c => `
                <div class="caption-item" data-start="${c.startTime}" data-end="${c.endTime}">
                    <span class="caption-time">${formatTime(c.startTime)}</span>
                    <span class="caption-text" style="font-size: ${fontSize}px">${c.text}</span>
                </div>
            `).join('')}
        </div>
    `;

    subtitleContent.querySelector('.captions-list').addEventListener('click', handleCaptionClick);

    const video = document.querySelector('video');
    if (video) {
        video.removeEventListener('timeupdate', updateActiveCaption);
        video.addEventListener('timeupdate', updateActiveCaption);
        updateActiveCaption();
    }
}
