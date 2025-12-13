/* SONDER - Configuration */

const SONDER_CONFIG = {
    IMGUR_CLIENT_ID: '546c25a59c58ad7',
    MAX_IMAGE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
    MAX_IMAGE_WIDTH: 1024,
    MAP_DEFAULT_ZOOM: 3,
    MAP_DEFAULT_CENTER: [20, 0],
    THEME_STORAGE_KEY: 'sonder-theme',
    SIDEBAR_STORAGE_KEY: 'sonder-sidebar-hidden'
};

// Prevent modification
Object.freeze(SONDER_CONFIG);
