/* SONDER - Main Application Coordinator */

/* --- Utilities --- */
function getUserId() {
    let userId = localStorage.getItem('sonder-user-id');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('sonder-user-id', userId);
    }
    return userId;
}

// Used for UI glow effects and map icons
function getColorCode(name) {
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
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/* --- Initialization --- */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Init Theme & UI
    if (typeof initTheme === 'function') initTheme();
    if (typeof initSidebarToggle === 'function') initSidebarToggle();

    // 2. Init Map
    if (typeof initMapCanvas === 'function') {
        const map = initMapCanvas(); // Returns L.map instance
        if (map) {
            checkNavigationPending(map);
            initFirestoreListeners(map);
            initMapInteractions(map);
        }
    }

    // 3. Init Page Specifics
    if (typeof initPlaylist === 'function') initPlaylist();
    if (typeof initArchive === 'function') initArchive();
    if (typeof initMyEntries === 'function') initMyEntries();

    // Notification modal
    if (typeof initUpdatesModal === 'function') initUpdatesModal();
    if (typeof initNotifications === 'function') initNotifications();
});


/* --- Map & Data Logic --- */

function initFirestoreListeners(map) {
    const markers = window.sonderMarkers || {};
    const markerCoords = {};

    if (typeof db !== 'undefined') {
        db.collection('entries').onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                const data = change.doc.data();
                const id = change.doc.id;

                if (change.type === 'added') {
                    if (markers[id]) return;

                    let lat = data.lat;
                    let lng = data.lng;

                    // Offset logic for duplicates
                    const coordKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
                    markerCoords[coordKey] = (markerCoords[coordKey] || 0) + 1;

                    if (markerCoords[coordKey] > 1) {
                        const offsetIndex = markerCoords[coordKey] - 1;
                        const angle = (offsetIndex * 60) * (Math.PI / 180);
                        const offsetDistance = 0.00008;
                        lat += Math.cos(angle) * offsetDistance;
                        lng += Math.sin(angle) * offsetDistance;
                    }

                    // Uses global createMarkerIcon from map-logic.js
                    const marker = L.marker([lat, lng], {
                        icon: createMarkerIcon(data.color, data.text, data.songTitle, data.artist)
                    })
                        .addTo(map)
                        .on('click', () => showEntryPreview({ id: id, ...data }, marker));

                    markers[id] = marker;
                }
                else if (change.type === 'removed') {
                    if (markers[id]) {
                        map.removeLayer(markers[id]);
                        delete markers[id];
                    }
                }
            });
        }, error => {
            console.error("Error fetching markers:", error);
        });
    }
}

function initMapInteractions(map) {
    const modal = document.getElementById('mapEntryModal');
    const addBtn = document.getElementById('mapAddEntryBtn');
    const form = document.getElementById('mapEntryForm');
    const locateBtn = document.getElementById('mapLocateBtn');
    const status = document.getElementById('mapLocationStatus');
    let userLocation = null;

    // Color Picker UI
    const colorBtns = document.querySelectorAll('.color-option');

    // Helper to update glow
    const updateInputGlow = (color) => {
        const entryText = document.getElementById('mapEntryText');
        if (!entryText) return;

        const newColor = color === 'black' ? 'var(--color-accent)' : getColorCode(color);
        entryText.style.setProperty('--active-color', newColor);
        entryText.style.borderColor = newColor;

        // Reset box shadow
        entryText.style.boxShadow = 'none';
        void entryText.offsetWidth; // Force reflow

        if (color === 'black') {
            // Adaptive glow: Black in light mode, White in dark mode (matches text color)
            entryText.style.boxShadow = '0 0 15px 1px var(--color-text)';
        } else {
            entryText.style.boxShadow = `0 0 15px 1px color-mix(in srgb, ${newColor}, transparent 60%)`;
        }
    };

    colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            colorBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');

            // Set Hidden Input
            const colorInput = document.getElementById('mapEntryColor');
            if (colorInput) colorInput.value = btn.dataset.color;

            // Trigger Glow
            updateInputGlow(btn.dataset.color);
        });
    });

    // Ensure default selection visual matches logic
    if (colorBtns.length > 0) {
        // Check if any is already selected (from HTML), if not select first
        let selectedBtn = document.querySelector('.color-option.selected');
        if (!selectedBtn) {
            selectedBtn = colorBtns[0];
            selectedBtn.classList.add('selected');
            const colorInput = document.getElementById('mapEntryColor');
            if (colorInput) colorInput.value = selectedBtn.dataset.color;
        }
        // Apply initial glow
        updateInputGlow(selectedBtn.dataset.color);
    }

    // Geolocation
    if (locateBtn) {
        locateBtn.addEventListener('click', () => {
            status.innerText = "locating you...";
            status.removeAttribute('data-error');
            if (!navigator.geolocation) {
                status.innerText = "not supported.";
                status.setAttribute('data-error', 'true');
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    status.innerText = "location found.";
                    status.removeAttribute('data-error');
                    if (addBtn) addBtn.disabled = false;
                    map.flyTo([userLocation.lat, userLocation.lng], 13);
                },
                (err) => {
                    console.error(err);
                    status.innerText = "location not found.";
                    status.setAttribute('data-error', 'true');
                }
            );
        });
    }
    // Open Modal Handlers
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            const open = (lat, lng) => {
                if (form) form.reset();
                // Reset Image Preview
                const preview = document.getElementById('imagePreview');
                if (preview) preview.style.display = 'none';
                window.selectedImageFile = null;

                document.getElementById('mapEntryLat').value = lat;
                document.getElementById('mapEntryLng').value = lng;
                modal.hidden = false;
            };

            if (userLocation) {
                open(userLocation.lat, userLocation.lng);
            } else {
                if (status) status.innerText = "locating...";
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                        if (status) status.innerText = "found.";
                        map.flyTo([userLocation.lat, userLocation.lng], 13);
                        open(userLocation.lat, userLocation.lng);
                    },
                    (err) => {
                        console.error(err);
                        alert("Could not get location. Using map center.");
                        open(20, 0);
                    }
                );
            }
        });
    }

    // Modal Close
    const closeBtn = document.getElementById('mapEntryModalClose');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.hidden = true;
        });
    }

    // Camera & Image Logic Integration
    initCameraIntegration();

    // Form Submission
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Loading UI
            const overlay = document.getElementById('loadingOverlay');
            let overlayTimeout = setTimeout(() => { if (overlay) overlay.style.display = 'flex'; }, 500);

            const hideLoading = () => {
                clearTimeout(overlayTimeout);
                if (overlay) overlay.style.display = 'none';
            };

            const formData = new FormData(e.target);
            let songUrl = formData.get('song');
            if (songUrl && !songUrl.match(/^https?:\/\//i)) {
                songUrl = 'https://' + songUrl;
                formData.set('song', songUrl);
            }

            // --- Metadata Fetching Logic ---
            const currentTitle = formData.get('songTitle');
            const manualTitle = formData.get('manualTitle');

            if (songUrl && songUrl.includes('spotify.com') && (!currentTitle && !manualTitle)) {
                try {
                    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(songUrl)}`;
                    const response = await fetch(oembedUrl);
                    if (!response.ok) throw new Error('Network error');
                    const data = await response.json();

                    if (data.title) formData.set('songTitle', data.title);
                    if (data.author_name) formData.set('artist', data.author_name);
                    if (data.thumbnail_url) formData.set('thumbnail', data.thumbnail_url);
                } catch (err) {
                    console.warn('Metadata fetch failed:', err);
                    const manualInputs = document.getElementById('manualSongInputs');
                    if (manualInputs) manualInputs.style.display = 'block';
                    hideLoading();
                    return; // Stop and let user fill manual inputs
                }
            }

            const finalSongTitle = formData.get('songTitle') || formData.get('manualTitle');
            const finalArtist = formData.get('artist') || formData.get('manualArtist');

            // Image Upload using camera-utils.js
            let imageUrl = null;
            if (window.selectedImageFile) {
                try {
                    imageUrl = await uploadToImgur(window.selectedImageFile);
                } catch (error) {
                    console.error('Image upload failed:', error);
                    alert('Image upload failed. Saving text only.');
                }
            }

            // Save to Firebase
            const timestamp = firebase.firestore.FieldValue.serverTimestamp();
            const entry = {
                text: formData.get('text'),
                song: songUrl,
                songTitle: finalSongTitle,
                artist: finalArtist,
                thumbnail: formData.get('thumbnail'),
                image: imageUrl,
                color: formData.get('color'),
                lat: parseFloat(formData.get('lat')),
                lng: parseFloat(formData.get('lng')),
                timestamp: timestamp,
                userAgent: navigator.userAgent,
                userId: getUserId()
            };

            try {
                await db.collection('entries').add(entry);
                form.reset();
                modal.hidden = true;
                window.selectedImageFile = null;
                const preview = document.getElementById('imagePreview');
                if (preview) preview.style.display = 'none';

                // Success Message
                const statusMsg = document.createElement('div');
                statusMsg.className = 'status-message';
                statusMsg.textContent = 'entry dropped into the world.';
                document.body.appendChild(statusMsg);
                setTimeout(() => statusMsg.remove(), 3000);

            } catch (error) {
                console.error("Error adding document: ", error);
                alert("Error saving entry: " + error.message);
            } finally {
                hideLoading();
            }
        });
    }
}


function initCameraIntegration() {
    const fileUploadBtn = document.getElementById('fileUploadBtn');
    const imageInput = document.getElementById('mapEntryImage');
    const cameraBtn = document.getElementById('cameraBtn');
    const imagePreview = document.getElementById('imagePreview');
    const imagePreviewImg = document.getElementById('imagePreviewImg');
    const removeImageBtn = document.getElementById('removeImage');

    // File Input Trigger
    if (fileUploadBtn && imageInput) {
        fileUploadBtn.addEventListener('click', () => imageInput.click());
    }

    // Image Detection
    if (imageInput) {
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            const validation = validateImage(file); // from camera-utils

            if (!validation.valid) {
                alert(validation.message);
                imageInput.value = '';
                return;
            }

            // Preview
            const reader = new FileReader();
            reader.onload = (ev) => {
                imagePreviewImg.src = ev.target.result;
                imagePreview.style.display = 'block';
                // Lock buttons
                if (fileUploadBtn) { fileUploadBtn.disabled = true; fileUploadBtn.innerHTML = 'image selected'; }
                if (cameraBtn) cameraBtn.disabled = true;
            };
            reader.readAsDataURL(file);
            window.selectedImageFile = file;
        });
    }

    // Remove Image
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', () => {
            if (imageInput) imageInput.value = '';
            if (imagePreview) imagePreview.style.display = 'none';
            if (imagePreviewImg) imagePreviewImg.src = '';
            window.selectedImageFile = null;

            if (fileUploadBtn) { fileUploadBtn.disabled = false; fileUploadBtn.innerHTML = 'choose image'; }
            if (cameraBtn) { cameraBtn.disabled = false; cameraBtn.innerHTML = 'take photo'; }
        });
    }

    // Camera Modal
    const cameraModal = document.getElementById('cameraModal');
    if (cameraBtn) {
        cameraBtn.addEventListener('click', async () => {
            try {
                await openCamera(); // camera-utils.js
                cameraModal.hidden = false;
            } catch (err) {
                alert(err.message);
            }
        });
    }

    // Camera UI inside modal
    const captureBtn = document.getElementById('capturePhotoBtn');
    const switchBtn = document.getElementById('switchCameraBtn');
    const closeCamBtn = document.getElementById('cameraModalClose');
    const video = document.getElementById('cameraVideo');

    if (switchBtn) {
        switchBtn.addEventListener('click', async () => {
            // Toggle global logic (re-call openCamera with swapped mode)
            // We'll store/toggle mode in a simple variable here or rely on camera-utils if it exported state?
            // camera-utils exported 'openCamera' accepts mode.
            // Let's toggle locally.
            window.currentCameraMode = window.currentCameraMode === 'environment' ? 'user' : 'environment';
            try {
                await openCamera(window.currentCameraMode);
            } catch (e) {
                console.error(e);
                // Revert
                window.currentCameraMode = window.currentCameraMode === 'environment' ? 'user' : 'environment';
                await openCamera(window.currentCameraMode);
            }
        });
    }

    if (captureBtn && video) {
        captureBtn.addEventListener('click', async () => {
            try {
                const blob = await capturePhoto(video); // camera-utils.js
                const file = new File([blob], `camera-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });

                // Show preview
                const reader = new FileReader();
                reader.onload = (ev) => {
                    imagePreviewImg.src = ev.target.result;
                    imagePreview.style.display = 'block';
                    if (fileUploadBtn) { fileUploadBtn.disabled = true; fileUploadBtn.innerHTML = 'image captured'; }
                    if (cameraBtn) { cameraBtn.disabled = true; cameraBtn.innerHTML = 'photo taken'; }
                };
                reader.readAsDataURL(file);
                window.selectedImageFile = file;
                closeCamera();
            } catch (err) {
                console.error(err);
                alert('Capture failed');
            }
        });
    }

    if (closeCamBtn) {
        closeCamBtn.addEventListener('click', () => closeCamera());
    }
}

/* --- Entry Preview (Popup) --- */
window.showEntryPreview = function (data, marker) {
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
             <button class="entry-card__share btn-share" data-id="${data.id || ''}" style="background: rgba(0,0,0,0.3); color: white;" title="copy link to memory">➦</button>
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
        ${!data.thumbnail ? `<button class="entry-card__share btn-share" data-id="${data.id || ''}" title="copy link to memory">➦</button>` : ''}
        <div class="entry-card__content" style="${contentStyle}">
            ${!data.thumbnail ? '<button class="entry-card__close">×</button>' : ''} 
            <div class="entry-card__location">${(data.lat).toFixed(4)}, ${(data.lng).toFixed(4)}</div>
            <div class="entry-card__timestamp">${data.timestamp ? new Date(data.timestamp.toDate()).toLocaleDateString() : 'Just now'}</div>
            <div class="entry-card__text" style="border-left: 3px solid ${getColorCode(data.color)}; padding-left: 12px;">${escapeHtml(data.text)}</div>
            ${userImageHtml}
            ${mediaContent}
        </div>
    </div>`;

    document.body.appendChild(overlay);

    // Attach event listeners to all close buttons (handled multiple if needed)
    overlay.querySelectorAll('.entry-card__close').forEach(btn => {
        btn.addEventListener('click', () => overlay.remove());
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
};