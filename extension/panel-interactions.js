// Panel Interactions — resize handle, show-button drag, and show/hide toggle

// Aborts document-level listeners from a previous panel so they don't pile up
// across SPA navigations
let panelInteractionsController = null;

function cleanupPanelInteractions() {
    if (panelInteractionsController) {
        panelInteractionsController.abort();
        panelInteractionsController = null;
    }
}

function initializePanelInteractions(panel, showButton) {
    cleanupPanelInteractions();
    panelInteractionsController = new AbortController();
    const { signal } = panelInteractionsController;

    // --- Resize handle ---
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
        const newWidth = clampNumber(startWidth + dx, PANEL.MIN_WIDTH, PANEL.MAX_WIDTH);
        panel.style.width = newWidth + 'px';
        localStorage.setItem(STORAGE_KEYS.PANEL_WIDTH, newWidth);
        applyPanelWidth(newWidth);
    }, { signal });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            window.dispatchEvent(new Event('resize'));
        }
    }, { signal });

    // --- Show button drag ---
    let dragStartX = 0, dragStartY = 0, dragMoved = false;
    let offsetX = 0, offsetY = 0, isDragging = false;

    // Restore saved position
    const showBtnPos = localStorage.getItem(STORAGE_KEYS.SHOW_BTN_POS);
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
        left = Math.max(0, Math.min(left, window.innerWidth - showButton.offsetWidth));
        top = Math.max(0, Math.min(top, window.innerHeight - showButton.offsetHeight));
        showButton.style.position = 'fixed';
        showButton.style.left = left + 'px';
        showButton.style.top = top + 'px';
        showButton.style.right = 'unset';
        showButton.style.bottom = 'unset';
        if (Math.abs(e.clientX - dragStartX) > 3 || Math.abs(e.clientY - dragStartY) > 3) {
            dragMoved = true;
        }
    }, { signal });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            showButton.style.transition = '';
            document.body.style.userSelect = '';
            localStorage.setItem(STORAGE_KEYS.SHOW_BTN_POS, JSON.stringify({
                left: showButton.style.left,
                top: showButton.style.top
            }));
        }
    }, { signal });

    // --- Show button click (toggle panel back) ---
    showButton.addEventListener('click', (e) => {
        if (dragMoved) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        showButton.style.display = 'none';
        panel.style.display = '';

        // Reset show button position to default
        showButton.style.position = '';
        showButton.style.left = '';
        showButton.style.top = '';
        showButton.style.right = '';
        showButton.style.bottom = '';
        localStorage.removeItem(STORAGE_KEYS.SHOW_BTN_POS);

        applyPanelWidth(getPanelWidth());
    });
}
