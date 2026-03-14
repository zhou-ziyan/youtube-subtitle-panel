// Language — list loading, preference management, and matching

function getPreferredLanguage() {
    const saved = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    if (saved) return saved;

    const ytLang = document.documentElement.getAttribute('lang') || '';
    if (ytLang) return ytLang.split('-')[0];

    const browserLang = navigator.language || navigator.userLanguage;
    return browserLang.split('-')[0];
}

function saveLanguagePreference(languageCode) {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, languageCode);
}

function findBestLanguageMatch(tracks, preferredLang) {
    // Exact match
    let track = tracks.find(t => t.languageCode === preferredLang);

    // Case-insensitive
    if (!track) {
        track = tracks.find(t => t.languageCode.toLowerCase() === preferredLang.toLowerCase());
    }

    // Prefix match (e.g. 'en-US' for 'en')
    if (!track) {
        track = tracks.find(t => t.languageCode.toLowerCase().startsWith(preferredLang.toLowerCase()));
    }

    // Fallback to English
    if (!track && preferredLang !== 'en') {
        track = tracks.find(t => t.languageCode.toLowerCase().startsWith('en'));
    }

    // Last resort: first track
    if (!track && tracks.length > 0) {
        track = tracks[0];
    }

    return track;
}

async function updateCaptionsAndLanguages() {
    const subtitleContent = document.querySelector('.subtitle-content');
    const languageSelect = document.getElementById('language-select');

    if (!subtitleContent || !languageSelect) {
        console.log('[updateCaptionsAndLanguages] Required elements not found');
        return;
    }

    const currentVideoId = getVideoIdFromUrl(window.location.href);

    subtitleContent.innerHTML = '<div class="loading-text">Loading subtitles...</div>';
    languageSelect.innerHTML = '<option value="">Loading languages...</option>';
    languageSelect.disabled = true;

    // Replace select to remove old event listeners
    const newSelect = languageSelect.cloneNode(true);
    languageSelect.parentNode.replaceChild(newSelect, languageSelect);

    try {
        const langsResp = await fetch(`${SUBTITLE_SERVER}/langs?v=${currentVideoId}`);
        if (!langsResp.ok) throw new Error(`Subtitle server returned ${langsResp.status}`);
        const { tracks } = await langsResp.json();

        if (!tracks || tracks.length === 0) {
            subtitleContent.innerHTML = '<div class="no-captions">No subtitles available for this video.</div>';
            newSelect.innerHTML = '<option value="">No subtitles available</option>';
            newSelect.disabled = true;
            return;
        }

        tracks.sort((a, b) => {
            const nameA = a.languageName || a.languageCode;
            const nameB = b.languageName || b.languageCode;
            return nameA.localeCompare(nameB);
        });

        newSelect.innerHTML = tracks.map((track, i) =>
            `<option value="${i}" data-lang="${track.languageCode}">
                ${track.languageName || track.languageCode}
            </option>`
        ).join('');
        newSelect.disabled = false;

        // Select preferred language
        const preferredLang = getPreferredLanguage();
        const bestMatch = findBestLanguageMatch(tracks, preferredLang);
        const selectedTrack = bestMatch || tracks[0];
        newSelect.value = String(tracks.indexOf(selectedTrack));

        // Load captions
        const captions = await fetchCaptions(selectedTrack.languageCode, currentVideoId);
        displayCaptions(captions);

        // Language change handler
        newSelect.addEventListener('change', async (e) => {
            const track = tracks[parseInt(e.target.value, 10)];
            if (!track) return;

            const langCode = e.target.selectedOptions[0].getAttribute('data-lang');
            saveLanguagePreference(langCode);

            subtitleContent.innerHTML = '<div class="loading-text">Loading subtitles...</div>';
            try {
                const captions = await fetchCaptions(track.languageCode, currentVideoId);
                displayCaptions(captions);
            } catch (err) {
                subtitleContent.innerHTML = `<div class="no-captions">Error: ${err.message}</div>`;
            }
        });

    } catch (error) {
        console.error('[updateCaptionsAndLanguages] Error:', error);
        const isFetchError = error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError');
        const msg = isFetchError
            ? 'Subtitle server not running. Start it with: node server/subtitle-server.mjs (from project root)'
            : (error.message || 'Unknown error');
        subtitleContent.innerHTML = `<div class="no-captions">Error: ${msg}</div>`;
        newSelect.innerHTML = '<option value="">Error loading languages</option>';
        newSelect.disabled = true;
    }
}
