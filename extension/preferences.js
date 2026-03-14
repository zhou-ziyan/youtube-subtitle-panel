// Preferences — localStorage helpers and font size controls

const STORAGE_KEYS = {
    PANEL_WIDTH: 'youtube-subtitle-panel-width',
    FONT_SIZE: 'youtube-subtitle-font-size',
    LANGUAGE: 'youtube-subtitle-language',
    SHOW_BTN_POS: 'youtube-subtitle-show-btn-pos',
};

const FONT = {
    MIN: 12,
    MAX: 24,
    STEP: 2,
    DEFAULT: 14,
};

function getFontSize() {
    const saved = localStorage.getItem(STORAGE_KEYS.FONT_SIZE);
    return saved ? parseInt(saved) : FONT.DEFAULT;
}

function saveFontSize(size) {
    localStorage.setItem(STORAGE_KEYS.FONT_SIZE, size.toString());
}

function applyFontSize(size) {
    document.querySelectorAll('.caption-text').forEach(el => {
        el.style.fontSize = `${size}px`;
    });
    saveFontSize(size);
}

function initializeFontSizeControls() {
    let currentFontSize = getFontSize();

    document.getElementById('increase-font').addEventListener('click', () => {
        if (currentFontSize < FONT.MAX) {
            currentFontSize += FONT.STEP;
            applyFontSize(currentFontSize);
        }
    });

    document.getElementById('decrease-font').addEventListener('click', () => {
        if (currentFontSize > FONT.MIN) {
            currentFontSize -= FONT.STEP;
            applyFontSize(currentFontSize);
        }
    });

    return currentFontSize;
}
