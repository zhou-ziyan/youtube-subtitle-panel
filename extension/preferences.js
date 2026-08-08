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

const PANEL = {
    MIN_WIDTH: 200,
    MAX_WIDTH: 600,
    DEFAULT_WIDTH: 400,
};

function clampNumber(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function getFontSize() {
    const saved = parseInt(localStorage.getItem(STORAGE_KEYS.FONT_SIZE), 10);
    if (isNaN(saved)) return FONT.DEFAULT;
    return clampNumber(saved, FONT.MIN, FONT.MAX);
}

function saveFontSize(size) {
    localStorage.setItem(STORAGE_KEYS.FONT_SIZE, size.toString());
}

function getPanelWidth() {
    const saved = parseInt(localStorage.getItem(STORAGE_KEYS.PANEL_WIDTH), 10);
    if (isNaN(saved)) return PANEL.DEFAULT_WIDTH;
    return clampNumber(saved, PANEL.MIN_WIDTH, PANEL.MAX_WIDTH);
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
