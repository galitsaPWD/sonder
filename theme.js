/* SONDER - Theme & UI Logic */

/**
 * Initializes the light/dark theme toggle.
 * Reads preference from localStorage.
 */
function initTheme() {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;

    const savedTheme = localStorage.getItem(SONDER_CONFIG.THEME_STORAGE_KEY) || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem(SONDER_CONFIG.THEME_STORAGE_KEY, next);

        // Trigger generic event for other modules to listen to
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: next } }));
    });
}

/**
 * Initializes the sidebar toggle (desktop button & mobile drag).
 */
function initSidebarToggle() {
    const toggleBtn = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('mapSidebar');
    const dragHandle = document.getElementById('sidebarDragHandle');

    if (!sidebar) return;

    // Check saved state
    const savedState = localStorage.getItem(SONDER_CONFIG.SIDEBAR_STORAGE_KEY);
    if (savedState === 'true') {
        sidebar.classList.add('hidden');
        if (toggleBtn) toggleBtn.classList.add('active');
    }

    // Desktop toggle button
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('hidden');
            toggleBtn.classList.toggle('active');

            // Save state
            const isHidden = sidebar.classList.contains('hidden');
            localStorage.setItem(SONDER_CONFIG.SIDEBAR_STORAGE_KEY, isHidden);
        });
    }

    // Mobile drag/swipe functionality
    if (dragHandle) {
        let startY = 0;
        let isDragging = false;
        const threshold = 30; // pixels to swipe before toggling

        dragHandle.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            isDragging = true;
        }, { passive: true });

        dragHandle.addEventListener('touchend', (e) => {
            if (!isDragging) return;

            const endY = e.changedTouches[0].clientY;
            const diff = endY - startY;
            isDragging = false;

            const isHidden = sidebar.classList.contains('hidden');

            // Toggle if swiped enough
            if (Math.abs(diff) > threshold) {
                if (diff > 0 && !isHidden) {
                    // Swiped down while visible - hide sidebar
                    sidebar.classList.add('hidden');
                    localStorage.setItem(SONDER_CONFIG.SIDEBAR_STORAGE_KEY, 'true');
                } else if (diff < 0 && isHidden) {
                    // Swiped up while hidden - show sidebar
                    sidebar.classList.remove('hidden');
                    localStorage.setItem(SONDER_CONFIG.SIDEBAR_STORAGE_KEY, 'false');
                }
            }
        });

        // Also allow clicking the drag handle to toggle
        dragHandle.addEventListener('click', () => {
            sidebar.classList.toggle('hidden');
            const isHidden = sidebar.classList.contains('hidden');
            localStorage.setItem(SONDER_CONFIG.SIDEBAR_STORAGE_KEY, isHidden);
            if (toggleBtn) {
                toggleBtn.classList.toggle('active', isHidden);
            }
        });
    }

    // Handle window resize - sync button state when switching between mobile/desktop
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const isHidden = sidebar.classList.contains('hidden');
            if (toggleBtn) {
                toggleBtn.classList.toggle('active', isHidden);
            }
        }, 50);
    });
}
