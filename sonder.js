/* SONDER - Main Application Logic */

/* SONDER - Main Application Logic */

/* --- User ID Management --- */
function getUserId() {
    let userId = localStorage.getItem('sonder-user-id');
    if (!userId) {
        // Generate a unique ID
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('sonder-user-id', userId);
    }
    return userId;
}

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

/* --- Sidebar Toggle --- */
function initSidebarToggle() {
    const toggleBtn = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('mapSidebar');
    const dragHandle = document.getElementById('sidebarDragHandle');

    if (!sidebar) return;

    // Check saved state
    const savedState = localStorage.getItem('sonder-sidebar-hidden');
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
            localStorage.setItem('sonder-sidebar-hidden', isHidden);
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
                    localStorage.setItem('sonder-sidebar-hidden', 'true');
                } else if (diff < 0 && isHidden) {
                    // Swiped up while hidden - show sidebar
                    sidebar.classList.remove('hidden');
                    localStorage.setItem('sonder-sidebar-hidden', 'false');
                }
            }
        });

        // Also allow clicking the drag handle to toggle
        dragHandle.addEventListener('click', () => {
            sidebar.classList.toggle('hidden');
            const isHidden = sidebar.classList.contains('hidden');
            localStorage.setItem('sonder-sidebar-hidden', isHidden);
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
        }, 50); // Reduced delay for faster response
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

    // Light theme tile layer
    const lightTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    });

    // Dark theme tile layer (using dark_nolabels + labels_only for white labels)
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

    // Function to switch tile layers based on theme
    const updateMapTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            map.removeLayer(lightTileLayer);
            darkTileLayer.addTo(map);
            darkLabelsLayer.addTo(map);
        } else {
            map.removeLayer(darkTileLayer);
            map.removeLayer(darkLabelsLayer);
            lightTileLayer.addTo(map);
        }
    };

    // Initialize with correct theme
    updateMapTheme();

    // Listen for theme changes
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            setTimeout(updateMapTheme, 50); // Small delay to let theme attribute update
        });
    }

    // Check if navigating from archive with specific coordinates
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

    // Custom Icon
    const createIcon = (color = 'black', text = '...', songTitle = '', artist = '') => {
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

        return L.divIcon({
            className: 'custom-marker',
            html: `<div style="position: relative;">
                <div class="marker-dot" style="animation-delay: ${delay}s;"></div>
                <div class="${bubbleClass} note-bubble--${color}" style="background: ${getColorCode(color)}; color: ${color === 'black' ? '#fff' : '#1a1a1a'};">${contentHtml}</div>
            </div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });
    };

    // Firestore Live Listener
    const markers = {};
    const markerCoords = {}; // Track how many markers at each coordinate

    if (typeof db !== 'undefined') {
        db.collection('entries').onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                const data = change.doc.data();
                const id = change.doc.id;

                if (change.type === 'added') {
                    let lat = data.lat;
                    let lng = data.lng;

                    // Create coordinate key and add small offset if duplicate location
                    const coordKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
                    markerCoords[coordKey] = (markerCoords[coordKey] || 0) + 1;

                    if (markerCoords[coordKey] > 1) {
                        // Offset in a circle pattern
                        const offsetIndex = markerCoords[coordKey] - 1;
                        const angle = (offsetIndex * 60) * (Math.PI / 180); // 60 degrees apart
                        const offsetDistance = 0.00008; // Very small offset (~8 meters)
                        lat += Math.cos(angle) * offsetDistance;
                        lng += Math.sin(angle) * offsetDistance;
                    }

                    const marker = L.marker([lat, lng], { icon: createIcon(data.color, data.text, data.songTitle, data.artist) })
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
            status.removeAttribute('data-error');
            if (!navigator.geolocation) {
                status.innerText = "geolocation not supported.";
                status.setAttribute('data-error', 'true');
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    userLocation = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    };
                    status.innerText = "location found.";
                    status.removeAttribute('data-error');
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

        // Image upload handling
        const imageInput = document.getElementById('mapEntryImage');
        const imagePreview = document.getElementById('imagePreview');
        const imagePreviewImg = document.getElementById('imagePreviewImg');
        const removeImageBtn = document.getElementById('removeImage');
        const fileUploadBtn = document.getElementById('fileUploadBtn');
        let selectedImageFile = null;

        // Trigger file input when button is clicked
        if (fileUploadBtn && imageInput) {
            fileUploadBtn.addEventListener('click', () => {
                imageInput.click();
            });
        }

        if (imageInput) {
            imageInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                // Validate file type
                const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
                if (!validTypes.includes(file.type)) {
                    alert('please use jpg, png, or webp format');
                    imageInput.value = '';
                    return;
                }

                // Validate file size (5MB)
                if (file.size > 5 * 1024 * 1024) {
                    alert('image must be under 5mb');
                    imageInput.value = '';
                    return;
                }

                // Show preview
                const reader = new FileReader();
                reader.onload = (e) => {
                    imagePreviewImg.src = e.target.result;
                    imagePreview.style.display = 'block';
                    // Disable upload button when image is selected
                    if (fileUploadBtn) {
                        fileUploadBtn.disabled = true;
                        fileUploadBtn.textContent = 'image selected';
                    }
                };
                reader.readAsDataURL(file);

                selectedImageFile = file;
            });

            if (removeImageBtn) {
                removeImageBtn.addEventListener('click', () => {
                    imageInput.value = '';
                    imagePreview.style.display = 'none';
                    imagePreviewImg.src = '';
                    selectedImageFile = null;
                    // Re-enable upload button when image is removed
                    if (fileUploadBtn) {
                        fileUploadBtn.disabled = false;
                        fileUploadBtn.innerHTML = '<span style="margin-right: 0.5rem;">choose image</span>';
                    }
                });
            }
        }

        // Helper function to compress image
        async function compressImage(file) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;

                        // Resize if too large (max 1200px width)
                        const maxWidth = 1200;
                        if (width > maxWidth) {
                            height = (height * maxWidth) / width;
                            width = maxWidth;
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        // Convert to blob with 80% quality
                        canvas.toBlob((blob) => {
                            resolve(blob);
                        }, file.type, 0.8);
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        // Helper function to upload image to Imgur (free)
        async function uploadToImgur(imageFile) {
            const compressedImage = await compressImage(imageFile);
            const formData = new FormData();
            formData.append('image', compressedImage);

            const response = await fetch('https://api.imgur.com/3/image', {
                method: 'POST',
                headers: {
                    'Authorization': 'Client-ID 546c25a59c58ad7' // Public Imgur client ID
                },
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                return data.data.link;
            } else {
                throw new Error('Image upload failed');
            }
        }

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
            const manualTitle = formData.get('manualTitle');
            const currentArtist = formData.get('artist');
            const manualArtist = formData.get('manualArtist');

            if (songUrl && songUrl.includes('spotify.com') && (!currentTitle && !manualTitle)) {
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

            // Get song info from hidden fields OR manual inputs
            const finalSongTitle = formData.get('songTitle') || formData.get('manualTitle');
            const finalArtist = formData.get('artist') || formData.get('manualArtist');

            // Upload image to Imgur if selected
            let imageUrl = null;
            if (selectedImageFile) {
                try {
                    imageUrl = await uploadToImgur(selectedImageFile);
                } catch (error) {
                    console.error('Image upload failed:', error);
                    alert('image upload failed. entry will be saved without image.');
                }
            }

            const entry = {
                text: formData.get('text'),
                song: songUrl,
                songTitle: finalSongTitle,
                artist: finalArtist,
                thumbnail: formData.get('thumbnail'),
                image: imageUrl, // Add uploaded image URL
                color: formData.get('color'),
                lat: parseFloat(formData.get('lat')),
                lng: parseFloat(formData.get('lng')),
                timestamp: timestamp,
                userAgent: navigator.userAgent,
                userId: getUserId() // Add unique user ID
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
                const docRef = await window.db.collection('entries').add(cleanEntry(entry));

                // Save entry ID to localStorage for "My Entries"
                const myEntries = JSON.parse(localStorage.getItem('sonder-my-entries') || '[]');
                myEntries.push(docRef.id);
                localStorage.setItem('sonder-my-entries', JSON.stringify(myEntries));

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
        // Robust regex for spotify track/episode (handles international URLs like /intl-es/)
        const spotifyMatch = data.song.match(/spotify\.com\/.*(track|episode)\/([a-zA-Z0-9]+)/);
        if (spotifyMatch) {
            isSpotify = true;
            const type = spotifyMatch[1];
            const id = spotifyMatch[2];
            mediaContent = `<div style="margin-top: 1.5rem; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <iframe src="https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0" width="100%" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
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

    // User uploaded image (with protection)
    let userImageHtml = '';
    if (data.image) {
        userImageHtml = `<div class="entry-card__user-image">
            <img src="${escapeHtml(data.image)}" alt="user photo" oncontextmenu="return false;" draggable="false" />
        </div>`;
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
            ${userImageHtml}
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
            // Staggered Animation Delay - capped to prevent long delays
            el.style.animationDelay = `${Math.min(index, 20) * 0.03}s`;

            el.innerHTML = `
                <div class="entry-card__location">${(data.lat).toFixed(4)}N, ${(data.lng).toFixed(4)}E</div>
                <div class="entry-card__text">${escapeHtml(data.text)}</div>
                
                <div class="entry-card__meta">
                    <div class="entry-card__timestamp">${data.timestamp ? new Date(data.timestamp.toDate()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</div>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        ${data.image ? '<span style="font-size: 0.7rem; padding: 0.2rem 0.5rem; background: var(--color-bg-alt); border-radius: 6px; color: var(--color-muted); font-weight: 500; letter-spacing: 0.05em;" title="Has image">IMG</span>' : ''}
                        ${data.song ? `
                            <a href="${data.song}" target="_blank" class="song-pill" onclick="event.stopPropagation();">
                                ${data.thumbnail ? `<img src="${data.thumbnail}" loading="lazy">` : '<span>🎵</span>'}
                                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;">
                                    ${escapeHtml(data.songTitle || 'Linked Song')}
                                </span>
                            </a>
                        ` : ''}
                    </div>
                </div>
            `;

            // Make card clickable to navigate to map location
            el.style.cursor = 'pointer';
            el.addEventListener('click', () => {
                // Store coordinates in localStorage for map to read
                localStorage.setItem('sonder-nav-lat', data.lat);
                localStorage.setItem('sonder-nav-lng', data.lng);
                window.location.href = 'map.html';
            });

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
                el.style.animationDelay = `${Math.min(index, 20) * 0.03}s`;

                el.innerHTML = `
                    <div class="track-icon">
                        ${data.thumbnail ? `<img src="${data.thumbnail}" style="width:100%; height:100%; object-fit:cover;">` : '<span>▶</span>'}
                    </div>
                    <div class="track-info">
                        <div class="track-meta">
                            ${data.songTitle ? `<span>${escapeHtml(data.songTitle)}</span>` : 'Unknown Track'}
                            ${data.artist ? `<span>• ${escapeHtml(data.artist)}</span>` : ''}
                        </div>
                    </div>
                    <div class="track-action">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    </div>
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

/* --- My Entries Logic --- */
function initMyEntries() {
    const grid = document.getElementById('myEntriesGrid');
    const emptyState = document.getElementById('emptyState');
    const totalEntriesEl = document.getElementById('totalEntries');
    const totalCountriesEl = document.getElementById('totalCountries');
    const totalSongsEl = document.getElementById('totalSongs');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const syncCodeDisplay = document.getElementById('syncCodeDisplay');
    const copySyncCodeBtn = document.getElementById('copySyncCodeBtn');
    const syncCodeInput = document.getElementById('syncCodeInput');
    const applySyncCodeBtn = document.getElementById('applySyncCodeBtn');

    if (!grid) return;

    const currentUserId = getUserId();
    const currentUserAgent = navigator.userAgent;

    // Display sync code
    if (syncCodeDisplay) {
        syncCodeDisplay.textContent = currentUserId;
    }

    // Copy sync code
    if (copySyncCodeBtn) {
        copySyncCodeBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(currentUserId).then(() => {
                copySyncCodeBtn.textContent = 'copied!';
                setTimeout(() => {
                    copySyncCodeBtn.textContent = 'copy code';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy:', err);
                alert('Failed to copy code. Please copy manually: ' + currentUserId);
            });
        });
    }

    // Apply sync code
    if (applySyncCodeBtn && syncCodeInput) {
        applySyncCodeBtn.addEventListener('click', () => {
            const newSyncCode = syncCodeInput.value.trim();
            if (!newSyncCode) {
                alert('Please enter a sync code');
                return;
            }
            if (newSyncCode === currentUserId) {
                alert('This is already your current sync code');
                return;
            }
            if (confirm('This will replace your current sync code. Your entries will be synced with the other device. Continue?')) {
                localStorage.setItem('sonder-user-id', newSyncCode);
                window.location.reload();
            }
        });
    }

    // Sync modal handlers
    const syncModal = document.getElementById('syncModal');
    const syncSettingsBtn = document.getElementById('syncSettingsBtn');
    const syncModalClose = document.getElementById('syncModalClose');

    // Open sync modal
    if (syncSettingsBtn && syncModal) {
        syncSettingsBtn.addEventListener('click', () => {
            syncModal.hidden = false;
        });
    }

    // Close sync modal
    if (syncModalClose && syncModal) {
        syncModalClose.addEventListener('click', () => {
            syncModal.hidden = true;
        });

        // Close on overlay click
        syncModal.addEventListener('click', (e) => {
            if (e.target === syncModal) {
                syncModal.hidden = true;
            }
        });
    }

    // Fetch entries from Firestore by userId ONLY (Strict Privacy)
    if (window.db) {
        window.db.collection('entries')
            .where('userId', '==', currentUserId)
            .get()
            .then(snapshot => {
                const entries = [];
                const entryIds = new Set();
                const myEntryIds = JSON.parse(localStorage.getItem('sonder-my-entries') || '[]');

                snapshot.forEach(doc => {
                    const entry = { id: doc.id, ...doc.data() };
                    entries.push(entry);
                    entryIds.add(doc.id);

                    // Sync local storage if needed (e.g. if synced from another device)
                    if (!myEntryIds.includes(doc.id)) {
                        myEntryIds.push(doc.id);
                    }
                });

                // Update local storage with any newly discovered synced entries
                localStorage.setItem('sonder-my-entries', JSON.stringify(myEntryIds));

                // Process and render functions below...

                // (Legacy userAgent fallback removed for security)


                if (entries.length === 0) {
                    grid.style.display = 'none';
                    emptyState.hidden = false;
                    return;
                }

                // Sort by timestamp (newest first)
                entries.sort((a, b) => {
                    const timeA = a.timestamp ? a.timestamp.toMillis() : 0;
                    const timeB = b.timestamp ? b.timestamp.toMillis() : 0;
                    return timeB - timeA;
                });

                // Calculate stats
                const totalSongs = entries.filter(e => e.song).length;
                const locations = new Set(entries.map(e => `${e.lat.toFixed(2)},${e.lng.toFixed(2)}`));

                totalEntriesEl.textContent = entries.length;
                totalCountriesEl.textContent = locations.size;
                totalSongsEl.textContent = totalSongs;

                // Render entries
                grid.innerHTML = '';
                entries.forEach((entry, index) => {
                    const card = document.createElement('div');
                    card.className = 'my-entry-card';
                    card.style.animationDelay = `${Math.min(index, 20) * 0.05}s`;

                    const colorCode = getColorCode(entry.color);
                    const dateStr = entry.timestamp ? new Date(entry.timestamp.toDate()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Just now';

                    // Image indicator badge styling
                    const imgBadge = entry.image ?
                        `<span class="my-entry-card__img-badge" title="Has image">IMG</span>` : '';

                    card.innerHTML = `
                        <div class="my-entry-card__color-indicator" style="background: ${colorCode};"></div>
                        <div class="my-entry-card__header">
                            <div class="my-entry-card__location">
                                ${entry.lat.toFixed(4)}°, ${entry.lng.toFixed(4)}°
                                ${imgBadge}
                            </div>
                            <div class="my-entry-card__date">${dateStr}</div>
                        </div>
                        <div class="my-entry-card__text">${escapeHtml(entry.text)}</div>
                        ${entry.song ? `
                            <a href="${escapeHtml(entry.song)}" target="_blank" class="my-entry-card__song" onclick="event.stopPropagation();">
                                <span class="my-entry-card__song-icon">♪</span>
                                <span>${escapeHtml(entry.songTitle || 'Linked Song')}</span>
                            </a>
                        ` : ''}
                        <div class="my-entry-card__actions">
                            <button class="my-entry-card__action-btn my-entry-card__action-btn--view">view on map</button>
                            <button class="my-entry-card__action-btn my-entry-card__action-btn--delete" data-entry-id="${entry.id}">delete</button>
                        </div>
                    `;

                    // View on Map handler (Smart Navigation)
                    const viewBtn = card.querySelector('.my-entry-card__action-btn--view');
                    if (viewBtn) {
                        viewBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            // Save coordinates for map to fly to
                            localStorage.setItem('sonder-nav-lat', entry.lat);
                            localStorage.setItem('sonder-nav-lng', entry.lng);
                            window.location.href = 'map.html';
                        });
                    }

                    // Delete button handler
                    const deleteBtn = card.querySelector('.my-entry-card__action-btn--delete');
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this entry? This cannot be undone.')) {
                            deleteEntry(entry.id);
                        }
                    });

                    grid.appendChild(card);
                });
            })
            .catch(err => {
                console.error('Error loading my entries:', err);
                grid.innerHTML = '<p class="section__text">Error loading your entries.</p>';
            });
    }

    // Clear all entries
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all your entries? This cannot be undone.')) {
                localStorage.removeItem('sonder-my-entries');
                window.location.reload();
            }
        });
    }
}

function deleteEntry(entryId) {
    // Delete from Firestore server
    if (window.db) {
        window.db.collection('entries').doc(entryId).delete()
            .then(() => {
                // Remove from localStorage
                const myEntries = JSON.parse(localStorage.getItem('sonder-my-entries') || '[]');
                const updatedEntries = myEntries.filter(id => id !== entryId);
                localStorage.setItem('sonder-my-entries', JSON.stringify(updatedEntries));

                // Reload page
                window.location.reload();
            })
            .catch(error => {
                console.error('Error deleting entry:', error);
                alert('Failed to delete entry. Please try again.');
            });
    }
}

/* --- Initialization --- */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Theme globally
    if (typeof initTheme === 'function') {
        initTheme();
    }

    // Initialize Sidebar Toggle
    if (typeof initSidebarToggle === 'function') {
        initSidebarToggle();
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

    // My Entries Page
    if (page === 'my-entries' || document.getElementById('myEntriesGrid')) {
        if (typeof initMyEntries === 'function') initMyEntries();
    }

    // Welcome Modal for First-Time Users
    const welcomeModal = document.getElementById('welcomeModal');
    const welcomeModalClose = document.getElementById('welcomeModalClose');
    const welcomeModalGotIt = document.getElementById('welcomeModalGotIt');

    if (welcomeModal) {
        // Check if user has seen the welcome modal before
        const hasSeenWelcome = localStorage.getItem('sonder-welcome-seen');

        if (!hasSeenWelcome) {
            // Show welcome modal for first-time users
            setTimeout(() => {
                welcomeModal.hidden = false;
            }, 500); // Small delay for better UX
        }

        // Close button handler
        if (welcomeModalClose) {
            welcomeModalClose.addEventListener('click', () => {
                welcomeModal.hidden = true;
                localStorage.setItem('sonder-welcome-seen', 'true');
            });
        }

        // "Got it" button handler
        if (welcomeModalGotIt) {
            welcomeModalGotIt.addEventListener('click', () => {
                welcomeModal.hidden = true;
                localStorage.setItem('sonder-welcome-seen', 'true');
            });
        }

        // Close on overlay click
        welcomeModal.addEventListener('click', (e) => {
            if (e.target === welcomeModal) {
                welcomeModal.hidden = true;
                localStorage.setItem('sonder-welcome-seen', 'true');
            }
        });
    }
});