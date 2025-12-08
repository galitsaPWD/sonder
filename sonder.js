/* SONDER - Main Application Logic */

/* SONDER - Main Application Logic */

/* --- Global UI --- */
function initTheme() {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;

    const savedTheme = localStorage.getItem('sonder-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('sonder-theme', next);
    });
}

/* --- Map Logic --- */
function initMap() {
    // Leaflet Map Init
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    const map = L.map('map', {
        zoomControl: false,
        minZoom: 2.5,
        maxBounds: [[-90, -180], [90, 180]]
    }).setView([20, 0], 3);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // Custom Icon
    const createIcon = (color = 'black', text = '...', songTitle = '', artist = '') => {
        const delay = Math.random() * -4; // random start time
        let contentHtml = '';
        let bubbleClass = 'note-bubble';

        const previewText = text.length > 20 ? text.substring(0, 20) + '...' : text;

        if (songTitle && artist) {
            const songInfo = `${escapeHtml(songTitle)} - ${escapeHtml(artist)}`;
            // Duplicate text with separator for seamless loop
            const displayStr = `${songInfo}&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;${songInfo}&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;`;

            contentHtml = `
                <div class="bubble-song marquee-container">
                    <div class="marquee-text">${displayStr}</div>
                </div>
                <div class="bubble-text">${escapeHtml(previewText)}</div>
            `;
            bubbleClass += ' has-song';
        } else {
            contentHtml = `<div class="bubble-text">${escapeHtml(previewText)}</div>`;
        }

        return L.divIcon({
            className: 'custom-marker',
            html: `<div style="position: relative;">
                <div class="marker-dot" style="
                    width: 12px;
                    height: 12px;
                    background-color: #74b9ff;
                    border-radius: 50%;
                    border: 2px solid white;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
                    animation-delay: ${delay}s;
                "></div>
                <div class="${bubbleClass}" style="background: ${getColorCode(color)}; color: ${color === 'black' ? '#fff' : '#1a1a1a'};">${contentHtml}</div>
            </div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });
    };

    // Firestore Live Listener
    const markers = {};
    if (typeof db !== 'undefined') {
        db.collection('entries').onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                const data = change.doc.data();
                const id = change.doc.id;

                if (change.type === 'added') {
                    const marker = L.marker([data.lat, data.lng], { icon: createIcon(data.color, data.text, data.songTitle, data.artist) })
                        .addTo(map)
                        .on('click', () => showEntryPreview(data, marker));
                    markers[id] = marker;
                }
            });
        }, error => {
            console.error("Error fetching markers:", error);
        });
    }

    // UI Interactions
    const modal = document.getElementById('mapEntryModal');
    const addBtn = document.getElementById('mapAddEntryBtn');
    const closeModal = document.getElementById('mapEntryModalClose');
    const form = document.getElementById('mapEntryForm');
    const locateBtn = document.getElementById('mapLocateBtn');
    const status = document.getElementById('mapLocationStatus');
    let userLocation = null;

    // Colors
    const colorBtns = document.querySelectorAll('.color-option');
    colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            colorBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('mapEntryColor').value = btn.dataset.color;
        });
    });
    if (colorBtns.length > 0) colorBtns[0].click();


    // Geolocation
    if (locateBtn) {
        locateBtn.addEventListener('click', () => {
            status.innerText = "locating you...";
            if (!navigator.geolocation) {
                status.innerText = "geolocation not supported.";
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    userLocation = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    };
                    status.innerText = "location found.";
                    if (addBtn) addBtn.disabled = false;
                    map.flyTo([userLocation.lat, userLocation.lng], 13);
                },
                (err) => {
                    console.error(err);
                    status.innerText = "could not find you.";
                    status.setAttribute('data-error', 'true');
                }
            );
        });
    }

    // Modal Handling
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            const openModal = (lat, lng) => {
                const form = document.getElementById('mapEntryForm');
                if (form) form.reset();
                const latInput = document.getElementById('mapEntryLat');
                const lngInput = document.getElementById('mapEntryLng');
                if (latInput) latInput.value = lat;
                if (lngInput) lngInput.value = lng;
                modal.hidden = false;
            };

            if (userLocation) {
                openModal(userLocation.lat, userLocation.lng);
            } else {
                // Try locating
                if (status) status.innerText = "locating for entry...";
                if (!navigator.geolocation) {
                    alert("Geolocation not supported. Using default location.");
                    openModal(20, 0);
                    return;
                }
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                        if (status) status.innerText = "location found.";
                        map.flyTo([userLocation.lat, userLocation.lng], 13);
                        openModal(userLocation.lat, userLocation.lng);
                    },
                    (err) => {
                        console.error(err);
                        alert("Could not get location. You can still add an entry (using default location).");
                        openModal(20, 0); // Default or center of map
                    }
                );
            }
        });

        // Submit Handler with Auto-Fetch
        const form = document.getElementById('mapEntryForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Show Loading
            const overlay = document.getElementById('loadingOverlay');
            if (overlay) overlay.style.display = 'flex';

            const formData = new FormData(e.target);
            let songUrl = formData.get('song');
            if (songUrl && !songUrl.match(/^https?:\/\//i)) {
                songUrl = 'https://' + songUrl;
                formData.set('song', songUrl); // Update formData with corrected URL
            }

            // Auto-Fetch Logic
            // Only try to fetch if we don't already have values (user didn't manually enter them)
            const currentTitle = formData.get('songTitle');
            const currentArtist = formData.get('artist');

            if (songUrl && songUrl.includes('spotify.com') && (!currentTitle || !currentArtist)) {
                try {
                    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(songUrl)}`;
                    const response = await fetch(oembedUrl);

                    if (!response.ok) throw new Error('Network response was not ok');

                    const data = await response.json();

                    if (data.title) {
                        formData.set('songTitle', data.title);
                    }
                    if (data.author_name) {
                        formData.set('artist', data.author_name);
                    }
                    if (data.thumbnail_url) {
                        formData.set('thumbnail', data.thumbnail_url);
                    }
                } catch (err) {
                    console.warn('Metadata fetch failed:', err);

                    // Fallback: Show manual inputs and stop submission
                    const manualInputs = document.getElementById('manualSongInputs');
                    if (manualInputs) manualInputs.style.display = 'block';

                    if (overlay) overlay.style.display = 'none';
                    return; // Stop here, let user fill inputs and submit again
                }
            }

            const timestamp = firebase.firestore.FieldValue.serverTimestamp();

            const entry = {
                text: formData.get('text'),
                song: songUrl,
                songTitle: formData.get('songTitle'),
                artist: formData.get('artist'),
                thumbnail: formData.get('thumbnail'),
                color: formData.get('color'),
                lat: parseFloat(formData.get('lat')),
                lng: parseFloat(formData.get('lng')),
                timestamp: timestamp,
                userAgent: navigator.userAgent
            };

            // Helper to remove null/undefined/empty fields
            const cleanEntry = (obj) => {
                const newObj = {};
                Object.keys(obj).forEach(key => {
                    if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
                        newObj[key] = obj[key];
                    }
                });
                return newObj;
            };

            // Save to Firestore
            try {
                if (!window.db) throw new Error("Database connection not initialized");
                await window.db.collection('entries').add(cleanEntry(entry));
                e.target.reset();
                modal.hidden = true;

                // Hide manual inputs again
                const manualInputs = document.getElementById('manualSongInputs');
                if (manualInputs) manualInputs.style.display = 'none';

                // Show success feedback
                const locStatus = document.getElementById('mapLocationStatus');
                if (locStatus) {
                    locStatus.innerText = "entry dropped.";
                    setTimeout(() => { if (locStatus.innerText === 'entry dropped.') locStatus.innerText = 'location found.'; }, 3000);
                }

            } catch (error) {
                console.error("Error adding document: ", error);
                alert("Error adding entry: " + error.message);
            } finally {
                if (overlay) overlay.style.display = 'none';
            }
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.hidden = true;
        });
    }
}

function showEntryPreview(data, marker) {
    // Create card overlay dynamically
    const overlay = document.createElement('div');
    overlay.className = 'entry-card-overlay';

    // Check for Spotify link
    let mediaContent = '';
    let isSpotify = false;

    if (data.song) {
        // Simple regex for spotify track/episode
        const spotifyMatch = data.song.match(/spotify\.com\/(track|episode)\/([a-zA-Z0-9]+)/);
        if (spotifyMatch) {
            isSpotify = true;
            const type = spotifyMatch[1];
            const id = spotifyMatch[2];
            mediaContent = `<div style="margin-top: 1.5rem; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <iframe src="https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0" width="100%" height="80" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
            </div>`;
        } else {
            mediaContent = `<div class="entry-card__links" style="margin-top: 1rem;"><a href="${escapeHtml(data.song)}" target="_blank" rel="noopener noreferrer">♪ Listen to song</a></div>`;
        }
    }

    // Header Art (if available)
    let headerHtml = '';
    if (data.thumbnail) {
        headerHtml = `<div class="entry-card__art-header" style="background-image: url('${escapeHtml(data.thumbnail)}');">
             <button class="entry-card__close" style="background: rgba(0,0,0,0.3); color: white;">×</button>
        </div>`;
    } else {
        headerHtml = `<button class="entry-card__close">×</button>`;
    }

    // Style logic for creating a "wrapper" content div if no header
    const contentStyle = data.thumbnail ? '' : 'padding-top: 3rem;';

    overlay.innerHTML = `
      <div class="entry-card">
        ${headerHtml}
        <div class="entry-card__content" style="${contentStyle}">
            ${!data.thumbnail ? '<button class="entry-card__close">×</button>' : ''} 
            <div class="entry-card__location">${(data.lat).toFixed(4)}, ${(data.lng).toFixed(4)}</div>
            <div class="entry-card__timestamp">${data.timestamp ? new Date(data.timestamp.toDate()).toLocaleDateString() : 'Just now'}</div>
            <div class="entry-card__text" style="border-left: 3px solid ${getColorCode(data.color)}; padding-left: 12px;">${escapeHtml(data.text)}</div>
            ${mediaContent}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Attach event listeners to all close buttons (handled multiple if needed)
    overlay.querySelectorAll('.entry-card__close').forEach(btn => {
        btn.addEventListener('click', () => overlay.remove());
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}


/* --- Archive Logic --- */
function initArchive() {
    const grid = document.getElementById('archiveGrid');
    if (!grid) return;
    const sortSelect = document.getElementById('archiveSort');

    const render = (docs) => {
        grid.innerHTML = '';
        if (docs.length === 0) {
            grid.innerHTML = '<p class="section__text">No entries found.</p>';
            return;
        }

        docs.forEach((doc, index) => {
            const data = doc.data();
            const el = document.createElement('div');
            el.className = 'entry-card';
            // Staggered Animation Delay
            el.style.animationDelay = `${index * 0.1}s`;

            el.innerHTML = `
                <div class="entry-card__location">${(data.lat).toFixed(2)}, ${(data.lng).toFixed(2)}</div>
                <div class="entry-card__text">${escapeHtml(data.text)}</div>
                ${data.song ? `<div style="font-size:0.8rem; margin-top:1rem; opacity:0.7;">🎵 ${data.songTitle || 'Linked Song'}</div>` : ''}
                <div class="entry-card__timestamp">${data.timestamp ? new Date(data.timestamp.toDate()).toLocaleDateString() : ''}</div>
            `;
            grid.appendChild(el);
        });
    };

    let allDocs = [];

    if (window.db) {
        window.db.collection('entries').orderBy('timestamp', 'desc').limit(50).get().then(snap => {
            allDocs = snap.docs;
            render(allDocs);
        }).catch(err => {
            console.error(err);
            grid.innerHTML = '<p>Error loading archive.</p>';
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            let sorted = [...allDocs];
            if (val === 'newest') {
                sorted.sort((a, b) => {
                    const tA = a.data().timestamp ? a.data().timestamp.toMillis() : 0;
                    const tB = b.data().timestamp ? b.data().timestamp.toMillis() : 0;
                    return tB - tA;
                });
            }
            render(sorted);
        });
    }
}


/* --- Playlist Logic --- */
function initPlaylist() {
    const list = document.getElementById('playlistList');
    if (!list) return;

    if (window.db) {
        window.db.collection('entries').where('song', '!=', '').limit(50).get().then(snap => {
            if (snap.empty) {
                list.innerHTML = '<p>No songs found yet.</p>';
                return;
            }
            snap.forEach((doc, index) => {
                const data = doc.data();
                if (!data.song) return;

                const el = document.createElement('a');
                el.href = data.song;
                el.target = "_blank";
                el.className = 'track-row';
                el.style.animationDelay = `${index * 0.05}s`;

                el.innerHTML = `
                    <div class="track-icon">
                        ${data.thumbnail ? `<img src="${data.thumbnail}" style="width:100%; height:100%; border-radius:8px; object-fit:cover;">` : '▶'}
                    </div>
                    <div class="track-info">
                        <div class="track-message">"${escapeHtml(data.text)}"</div>
                        <div class="track-meta">
                            ${data.songTitle ? `<span>${escapeHtml(data.songTitle)}</span>` : 'Unknown Track'}
                            ${data.artist ? `<span>• ${escapeHtml(data.artist)}</span>` : ''}
                        </div>
                    </div>
                    <div class="track-action">Listen &rarr;</div>
                `;
                list.appendChild(el);
            });
        }).catch(err => {
            console.error(err);
            list.innerHTML = '<p>Error loading playlist.</p>';
        });
    }
}

/* --- Helpers --- */
function getColorCode(name) {
    const map = {
        'black': '#1a1a1a',
        'pink': '#ff9a9e',
        'yellow': '#feca57',
        'blue': '#74b9ff',
        'green': '#55efc4',
        'purple': '#a29bfe',
        'orange': '#fd79a8'
    };
    return map[name] || '#1a1a1a';
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* --- Initialization --- */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Theme globally
    if (typeof initTheme === 'function') {
        initTheme();
    }

    // Router based on data-page or element existence
    const page = document.documentElement.getAttribute('data-page');

    // Map Page
    if (document.getElementById('map')) {
        if (typeof initMap === 'function') initMap();
    }

    // Archive Page
    if (page === 'archive' || document.getElementById('archiveGrid')) {
        if (typeof initArchive === 'function') initArchive();
    }

    // Playlist Page
    if (page === 'playlist' || document.getElementById('playlistList')) {
        if (typeof initPlaylist === 'function') initPlaylist();
    }
});