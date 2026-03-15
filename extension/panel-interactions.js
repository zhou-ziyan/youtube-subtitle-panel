// Panel Interactions — resize handle, show-button drag, and show/hide toggle

function initializePanelInteractions(panel, showButton) {
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
        let newWidth = Math.max(200, Math.min(startWidth + dx, 600));
        panel.style.width = newWidth + 'px';
        localStorage.setItem(STORAGE_KEYS.PANEL_WIDTH, newWidth);
        applyPanelWidth(newWidth);
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            window.dispatchEvent(new Event('resize'));
        }
    });

    // --- Show button drag ---
    let dragStartX = 0, dragStartY = 0, dragMoved = false;
    let offsetX = 0, offsetY = 0, isDragging = false;

    // Restore saved position
    let showBtnPos = localStorage.getItem(STORAGE_KEYS.SHOW_BTN_POS);
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
    });

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
    });

    // --- Show button click (toggle panel back) ---
    showButton.addEventListener('click', (e) => {
        if (dragMoved) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        showButton.style.display = 'none';
        panel.style.display = '';
        setTimeout(() => { panel.classList.remove('panel-hidden'); }, 50);

        // Reset show button position to default
        showButton.style.position = '';
        showButton.style.left = '';
        showButton.style.top = '';
        showButton.style.right = '';
        showButton.style.bottom = '';
        localStorage.removeItem(STORAGE_KEYS.SHOW_BTN_POS);

        const savedPanelWidth = localStorage.getItem(STORAGE_KEYS.PANEL_WIDTH);
        const width = savedPanelWidth ? parseInt(savedPanelWidth) : 400;
        applyPanelWidth(width);
    });
}
