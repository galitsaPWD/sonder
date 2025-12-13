/* SONDER - Map Logic */

// Global reference for other modules if needed
window.sonderMap = null;
window.sonderMarkers = {};

/**
 * Initializes the Leaflet map and tile layers.
 * @returns {L.Map} The initialized map instance.
 */
function initMapCanvas() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return null;

    const map = L.map('map', {
        zoomControl: false,
        minZoom: 2.5,
        maxBounds: [[-90, -180], [90, 180]]
    }).setView(
        SONDER_CONFIG.MAP_DEFAULT_CENTER || [20, 0],
        SONDER_CONFIG.MAP_DEFAULT_ZOOM || 3
    );
    window.sonderMap = map;
    window.map = map; // Legacy support

    // Title Layers
    const lightTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    });

    const darkTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    });

    const darkLabelsLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19,
        pane: 'shadowPane' // Render labels on top
    });

    // Theme Switcher Logic
    const updateMapTheme = (theme) => {
        if (!theme) theme = document.documentElement.getAttribute('data-theme');

        if (theme === 'dark') {
            map.removeLayer(lightTileLayer);
            darkTileLayer.addTo(map);
            darkLabelsLayer.addTo(map);
        } else {
            map.removeLayer(darkTileLayer);
            map.removeLayer(darkLabelsLayer);
            lightTileLayer.addTo(map);
        }
    };

    // Initial Theme Set
    updateMapTheme();

    // Listen for global theme changes (dispatched by theme.js)
    window.addEventListener('themeChanged', (e) => {
        updateMapTheme(e.detail.theme);
    });

    return map;
}

/**
 * Creates a custom Leaflet divIcon for markers.
 */
function createMarkerIcon(color = 'black', text = '...', songTitle = '', artist = '') {
    // Helper helper
    const escapeHtml = (text) => {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    const delay = Math.random() * -4; // random start time
    let contentHtml = '';
    let bubbleClass = 'note-bubble';

    const previewText = text.length > 20 ? text.substring(0, 20) + '...' : text;

    // Show song info if we have either title or artist
    if (songTitle || artist) {
        let songInfo = '';
        if (songTitle && artist) {
            songInfo = `${escapeHtml(songTitle)} - ${escapeHtml(artist)}`;
        } else if (songTitle) {
            songInfo = escapeHtml(songTitle);
        } else {
            songInfo = escapeHtml(artist);
        }

        contentHtml = `
            <div class="bubble-song">${songInfo}</div>
            <div class="bubble-text">${escapeHtml(previewText)}</div>
        `;
        bubbleClass += ' has-song';
    } else {
        contentHtml = `<div class="bubble-text">${escapeHtml(previewText)}</div>`;
    }

    // Determine bubble background color
    // This duplicates logic in sonder.js/getColorCode slightly, 
    // but useful to keep icon creation self-contained.
    const getColorCode = (name) => {
        const colors = {
            'pink': '#ff9a9e',
            'yellow': '#f6e58d',
            'blue': '#74b9ff',
            'green': '#55efc4',
            'purple': '#a29bfe',
            'orange': '#fab1a0',
            'black': '#1a1a1a'
        };
        return colors[name] || '#1a1a1a';
    };

    const bgColor = getColorCode(color);

    return L.divIcon({
        className: 'custom-marker',
        html: `<div class="marker-entrance" style="position: relative;">
            <div class="marker-dot" style="animation-delay: ${delay}s;"></div>
            <div class="${bubbleClass} note-bubble--${color}" style="background: ${bgColor}; color: ${color === 'black' ? '#fff' : '#1a1a1a'};">${contentHtml}</div>
        </div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
    });
}

/**
 * Handles navigation to coordinates passed via localStorage (from Archive/List view).
 */
function checkNavigationPending(map) {
    const navLat = localStorage.getItem('sonder-nav-lat');
    const navLng = localStorage.getItem('sonder-nav-lng');
    if (navLat && navLng) {
        setTimeout(() => {
            map.flyTo([parseFloat(navLat), parseFloat(navLng)], 17, {
                duration: 4,
                easeLinearity: 1
            });
        }, 500);
        localStorage.removeItem('sonder-nav-lat');
        localStorage.removeItem('sonder-nav-lng');
    }
}
