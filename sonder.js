/* SONDER - Main Application Coordinator */

/* --- Utilities --- */
function getUserId() {
    let userId = localStorage.getItem('sonder-user-id');
    if (!userId) {
        // Fallback for legacy key
        userId = localStorage.getItem('sonder_user_id');
        if (userId) {
            localStorage.setItem('sonder-user-id', userId);
        } else {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('sonder-user-id', userId);
        }
    }
    return userId;
}

// Global escape utility fallback
const escapeHtml = window.escapeHtml || function(text) {
    if (text === null || text === undefined) return '';
    const str = text.toString();
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return str.replace(/[&<>"']/g, m => map[m]);
};
function showAlert(title, message) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'sonder-confirm-overlay';

        overlay.innerHTML = `
            <div class="sonder-confirm-card">
                <div class="confirm-card__header">
                    <h4>${escapeHtml(title)}</h4>
                </div>
                <div class="confirm-card__body">
                    <p>${escapeHtml(message)}</p>
                </div>
                <div class="sonder-confirm-actions">
                    <button class="sonder-confirm-btn sonder-confirm-btn--confirm">ok</button>
                </div>
            </div>
        `;

        const close = () => {
            overlay.classList.add('closing');
            setTimeout(() => overlay.remove(), 300);
            resolve();
        };

        const confirmBtn = overlay.querySelector('.sonder-confirm-btn--confirm');
        confirmBtn.onclick = (e) => { e.stopPropagation(); close(); };
        overlay.onclick = (e) => { if (e.target === overlay) close(); };

        document.body.appendChild(overlay);
    });
}

function showPrompt(title, message, placeholder = "") {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'sonder-confirm-overlay';

        overlay.innerHTML = `
            <div class="sonder-confirm-card">
                <div class="confirm-card__header">
                    <h4>${escapeHtml(title)}</h4>
                </div>
                <div class="confirm-card__body">
                    <p>${escapeHtml(message)}</p>
                    <input type="text" class="modal-input" placeholder="${escapeHtml(placeholder)}" id="customPromptInput" style="margin-top: 1rem; width: 100%;">
                </div>
                <div class="sonder-confirm-actions">
                    <button class="sonder-confirm-btn sonder-confirm-btn--cancel">cancel</button>
                    <button class="sonder-confirm-btn sonder-confirm-btn--confirm">submit</button>
                </div>
            </div>
        `;

        const input = overlay.querySelector('#customPromptInput');
        const close = (result) => {
            overlay.classList.add('closing');
            setTimeout(() => overlay.remove(), 300);
            resolve(result);
        };

        overlay.querySelector('.sonder-confirm-btn--cancel').onclick = () => close(null);
        overlay.querySelector('.sonder-confirm-btn--confirm').onclick = () => close(input.value.trim());
        overlay.onclick = (e) => { if (e.target === overlay) close(null); };

        document.body.appendChild(overlay);
        input.focus();
    });
}

// Used for UI glow effects and map icons
// getColorCode and escapeHtml are now provided globally by page-logic.js

function showConfirm(title, message, isDestructive = false) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'sonder-confirm-overlay';

        overlay.innerHTML = `
            <div class="sonder-confirm-card">
                <div class="confirm-card__header">
                    <h4>${escapeHtml(title)}</h4>
                </div>
                <div class="confirm-card__body">
                    <p>${escapeHtml(message)}</p>
                </div>
                <div class="sonder-confirm-actions">
                    <button class="sonder-confirm-btn sonder-confirm-btn--cancel">cancel</button>
                    <button class="sonder-confirm-btn sonder-confirm-btn--confirm ${isDestructive ? 'btn--destructive' : ''}">
                        ${isDestructive ? 'confirm deletion' : 'confirm'}
                    </button>
                </div>
            </div>
        `;

        const close = (result) => {
            overlay.classList.add('closing');
            setTimeout(() => overlay.remove(), 300);
            resolve(result);
        };

        const confirmBtn = overlay.querySelector('.sonder-confirm-btn--confirm');
        const cancelBtn = overlay.querySelector('.sonder-confirm-btn--cancel');

        cancelBtn.onclick = (e) => { e.stopPropagation(); close(false); };
        confirmBtn.onclick = (e) => { e.stopPropagation(); close(true); };
        overlay.onclick = (e) => { if (e.target === overlay) close(false); };

        document.body.appendChild(overlay);
    });
}

/* --- Profanity Shield --- */
const ProfanityGuard = {
    // Basic common profanities. In a real app, this would be a larger list or an API call.
    blacklist: ['fuck', 'shit', 'asshole', 'bitch', 'cunt', 'dick', 'pussy', 'nigger', 'faggot'],

    isToxic: function (text) {
        if (!text) return false;
        const cleanText = text.toLowerCase();
        return this.blacklist.some(word => cleanText.includes(word));
    }
};

/* --- Presence Tracking (Real-time) --- */
let presenceChannel = null;

async function initPresenceTracking() {
    const presenceEl = document.getElementById('activeSoulsCount');
    if (!presenceEl || !window.supabase) return;

    // Use a unique channel for presence
    presenceChannel = window.supabase.channel('sonder-presence', {
        config: {
            presence: {
                key: typeof getUserId === 'function' ? getUserId() : 'anonymous',
            },
        },
    });

    presenceChannel
        .on('presence', { event: 'sync' }, () => {
            const state = presenceChannel.presenceState();
            const uniqueUsers = Object.keys(state).length;
            presenceEl.textContent = uniqueUsers || 0;
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            // New interaction detected
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            // User drifted away
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await presenceChannel.track({
                    online_at: new Date().toISOString(),
                    page: document.documentElement.getAttribute('data-page')
                });
            }
        });
}

async function trackVisit() {
    // Only track once per browser session
    if (sessionStorage.getItem('sonder_visit_tracked')) return;

    // Small delay to ensure Supabase is ready
    let retry = 0;
    while ((!window.supabase || typeof window.supabase.from !== 'function') && retry < 20) {
        await new Promise(r => setTimeout(r, 100));
        retry++;
    }

    if (!window.supabase) return;

    try {
        const { error } = await window.supabase
            .from('site_visits')
            .insert([{ timestamp: new Date().toISOString() }]);

        if (!error) {
            sessionStorage.setItem('sonder_visit_tracked', 'true');
        } else {
            // Likely table doesn't exist yet, ignore to not log spam
            // console.warn('Visit tracking skipped:', error.message);
        }
    } catch (err) {
        // fail silently
    }
}

/* --- Initialization --- */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Init Theme & UI
    if (typeof initTheme === 'function') initTheme();
    if (typeof initSidebarToggle === 'function') initSidebarToggle();

    // 2. Track Visit
    trackVisit();

    // 3. Init Map
    if (typeof initMapCanvas === 'function') {
        const map = initMapCanvas(); // Returns L.map instance
        if (map) {
            checkNavigationPending(map);
            initSupabaseListeners(map);
            initMapInteractions(map);
        }
    }

    // 3. Init Page Specifics
    if (typeof initPlaylist === 'function') initPlaylist();
    if (typeof initArchive === 'function') initArchive();
    if (typeof initMyEntries === 'function') initMyEntries();
    if (typeof initSeasonalFeatures === 'function') initSeasonalFeatures();

    // Notification modal
    if (typeof initUpdatesModal === 'function') initUpdatesModal();

    // GSAP Cleanup: ensure context is cleared if needed
    window.addEventListener('unload', () => {
        if (typeof gsap !== 'undefined') gsap.matchMedia().revert();
    });

    if (typeof initNotifications === 'function') initNotifications();
    if (typeof initWelcomeModal === 'function') initWelcomeModal();
    if (typeof initAdminLogin === 'function') initAdminLogin();
    if (typeof initSupportModal === 'function') initSupportModal();

    // 4. Presence Tracking (Map only)
    if (document.documentElement.getAttribute('data-page') === 'map') {
        const startPresence = async () => {
            // Wait for Supabase readiness
            let retry = 0;
            while ((!window.supabase || typeof window.supabase.from !== 'function') && retry < 30) {
                await new Promise(r => setTimeout(r, 200));
                retry++;
            }
            if (window.supabase) {
                initPresenceTracking();
            }
        };
        startPresence();
    }
});

function initWelcomeModal() {
    const hasVisited = localStorage.getItem('sonder-has-visited');
    const modal = document.getElementById('welcomeModal');

    if (!modal) return;

    if (!hasVisited) {
        // Show after loader finishes (approx 3s)
        setTimeout(() => {
            modal.removeAttribute('hidden');

            // Countdown Logic
            let seconds = 3;
            const btn = document.getElementById('welcomeModalGotIt');
            if (btn) {
                const timer = setInterval(() => {
                    seconds--;
                    if (seconds > 0) {
                        btn.textContent = `${seconds}`;
                    } else {
                        clearInterval(timer);
                        btn.textContent = "got it, let's explore";
                        btn.disabled = false;
                        btn.style.opacity = '1';
                        btn.style.cursor = 'pointer';
                    }
                }, 1000);
            }
        }, 3500);
    }

    const closeAndSave = () => {
        modal.hidden = true;
        localStorage.setItem('sonder-has-visited', 'true');
    };

    const btn = document.getElementById('welcomeModalGotIt');
    // const close = document.getElementById('welcomeModalClose'); // Removed from HTML

    if (btn) btn.onclick = closeAndSave;
    // if (close) close.onclick = closeAndSave;

    // Help Button Trigger (Map Page)
    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) {
        helpBtn.addEventListener('click', () => {
            modal.removeAttribute('hidden');
            modal.hidden = false;

            // Force button to be clickable immediately if manually triggered via help
            const gotItBtn = document.getElementById('welcomeModalGotIt');
            if (gotItBtn) {
                gotItBtn.textContent = "got it, let's explore";
                gotItBtn.disabled = false;
                gotItBtn.style.opacity = '1';
                gotItBtn.style.cursor = 'pointer';
            }
        });
    }
}


/* --- Map & Data Logic --- */

async function initSupabaseListeners(map) {
    // We store these on window so they can be accessed from initMapInteractions for immediate updates
    const markers = window.sonderMarkers = window.sonderMarkers || {};
    const markerCoords = window.sonderMarkerCoords = window.sonderMarkerCoords || {};

    // 1. Wait for Supabase client to be ready (robust against race conditions)
    let retryCount = 0;
    while ((!window.supabase || typeof window.supabase.from !== 'function') && retryCount < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retryCount++;
    }

    if (window.supabase && typeof window.supabase.from === 'function') {
        const supabase = window.supabase;

        // 2. Fetch Initial Data (Filter Banned Users)
        const { data: bannedData } = await supabase.from('banned_users').select('user_id');
        const bannedIds = new Set(bannedData?.map(b => b.user_id) || []);

        // Initialize Cluster Group (Custom Sonder Styles)
        const clusterGroup = window.sonderClusterGroup = L.markerClusterGroup({
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            spiderfyOnMaxZoom: true,
            maxClusterRadius: 40,
            iconCreateFunction: function(cluster) {
                const count = cluster.getChildCount();
                return L.divIcon({
                    html: `<div class="sonder-cluster"><span>${count}</span></div>`,
                    className: 'sonder-cluster-container',
                    iconSize: L.point(32, 32)
                });
            }
        });
        map.addLayer(clusterGroup);

        const { data: initialEntries, error } = await supabase
            .from('entries')
            .select('id, lat, lng, color, text, timestamp, reactions_enabled, comments_enabled, view_count, reaction_count, comment_count, thumbnail, image, song, song_title, artist, user_id');

        if (error) {
            console.error('Error fetching initial entries:', error);
        } else if (initialEntries) {
            initialEntries.forEach(entry => {
                if (!bannedIds.has(entry.user_id)) {
                    addMarker(entry, map, markers, markerCoords);
                }
            });
        }

        // 3. Subscribe to Real-time Changes
        supabase
            .channel('entries-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'entries' }, payload => {
                if (payload.eventType === 'INSERT') {
                    if (!bannedIds.has(payload.new.user_id)) {
                        addMarker(payload.new, map, markers, markerCoords);
                    }
                } else if (payload.eventType === 'DELETE') {
                    const id = payload.old.id;
                    if (markers[id] && window.sonderClusterGroup) {
                        window.sonderClusterGroup.removeLayer(markers[id]);
                        delete markers[id];
                    }
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'banned_users' }, payload => {
                // If a user is banned/unbanned in real-time
                if (payload.eventType === 'INSERT') {
                    const userId = payload.new.user_id;
                    bannedIds.add(userId);
                    // Remove existing markers for this user
                    Object.values(initialEntries || []).forEach(e => {
                        if (e.user_id === userId && markers[e.id]) {
                            if (window.sonderClusterGroup) {
                                window.sonderClusterGroup.removeLayer(markers[e.id]);
                            } else {
                                map.removeLayer(markers[e.id]);
                            }
                            delete markers[e.id];
                        }
                    });
                } else if (payload.eventType === 'DELETE') {
                    bannedIds.delete(payload.old.user_id);
                    // Markers will naturally reappear on next refresh or manual refresh
                }
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'views' }, payload => {
                const entryId = payload.new.entry_id;
                supabase.from('views')
                    .select('*', { count: 'exact', head: true })
                    .eq('entry_id', entryId)
                    .then(({ count }) => {
                        const countEl = document.getElementById(`viewCount-${entryId}`);
                        if (countEl) countEl.textContent = count || 0;
                    });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, payload => {
                const entryId = (payload.new && payload.new.entry_id) || (payload.old && payload.old.entry_id);
                if (entryId) {
                    supabase.from('reactions')
                        .select('*', { count: 'exact', head: true })
                        .eq('entry_id', entryId)
                        .then(({ count }) => {
                            const countEl = document.getElementById(`likeCount-${entryId}`);
                            if (countEl) countEl.textContent = count || 0;
                        });
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, payload => {
                const entryId = (payload.new && payload.new.entry_id) || (payload.old && payload.old.entry_id);
                if (entryId) {
                    supabase.from('comments')
                        .select('*', { count: 'exact', head: true })
                        .eq('entry_id', entryId)
                        .then(({ count }) => {
                            const countEls = document.querySelectorAll(`[id^="commentCount-btn-${entryId}"]`);
                            countEls.forEach(el => el.textContent = count || 0);
                        });
                }
            })
            .subscribe();
    }
}

function addMarker(data, map, markers, markerCoords) {
    const id = data.id;
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
        icon: createMarkerIcon(data.color, data.text, data.song_title, data.artist)
    });
    
    // Attach indexable data for Search
    marker.sonderData = data;
    
    marker.on('click', () => showEntryPreview({ ...data }, marker));

    if (window.sonderClusterGroup && map.hasLayer(window.sonderClusterGroup)) {
        window.sonderClusterGroup.addLayer(marker);
    } else {
        marker.addTo(map);
    }

    markers[id] = marker;
}

function initMapInteractions(map) {
    const modal = document.getElementById('mapEntryModal');
    const addBtn = document.getElementById('mapAddEntryBtn');
    const form = document.getElementById('mapEntryForm');
    const locateBtn = document.getElementById('mapLocateBtn');
    const pickLocationBtn = document.getElementById('mapPickLocationBtn');
    const status = document.getElementById('mapLocationStatus');
    const searchInput = document.getElementById('mapSearchInput');
    const clusterToggle = document.getElementById('clusterToggle');

    let userLocation = null;
    let manualLocation = null;
    let isManualMode = false;
    let manualMarker = null;

    if (addBtn) addBtn.disabled = true;

    // --- Search Logic ---
    if (searchInput) {
        searchInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim().toLowerCase();
                if (!query) return;

                status.innerText = `searching for "${query}"...`;
                const results = {
                    memories: [],
                    songs: [],
                    locations: []
                };

                // 1. Local Search (Memories & Songs)
                const markers = window.sonderMarkers || {};
                Object.values(markers).forEach(marker => {
                    if (!marker.sonderData) return;
                    const d = marker.sonderData;
                    
                    const sTitle = (d.song_title || '').toLowerCase();
                    const sArtist = (d.artist || '').toLowerCase();
                    const sText = (d.text || '').toLowerCase();

                    // Specificity: Songs
                    if (sTitle.includes(query) || sArtist.includes(query)) {
                        if (results.songs.length < 3) {
                            results.songs.push({
                                type: 'song',
                                data: d,
                                marker: marker,
                                display: `${d.song_title || 'Untitled'} - ${d.artist || 'Unknown'}`
                            });
                        }
                    }

                    // Specificity: Memories
                    if (sText.includes(query)) {
                        if (results.memories.length < 3) {
                            results.memories.push({
                                type: 'memory',
                                data: d,
                                marker: marker,
                                display: `"${d.text.substring(0, 30)}${d.text.length > 30 ? '...' : ''}"`
                            });
                        }
                    }
                });

                // 2. External Search (Locations)
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=3`);
                    const locData = await response.json();
                    if (locData && locData.length > 0) {
                        results.locations = locData.map(l => ({
                            type: 'location',
                            lat: parseFloat(l.lat),
                            lng: parseFloat(l.lon),
                            display: l.display_name,
                            full_name: l.display_name
                        }));
                    }
                } catch (err) {
                    console.error('Location search failed', err);
                }

                // 3. Render Results
                const totalResults = results.memories.length + results.songs.length + results.locations.length;
                
                if (totalResults === 0) {
                    status.innerText = "no results found.";
                    return;
                }

                // If only 1 result total, go directly? 
                // Enhanced UX: ALWAYS show modal if we have multiple categories, or if explicit match isn't obvious.
                if (totalResults === 1 && results.locations.length === 1) {
                    const loc = results.locations[0];
                    map.flyTo([loc.lat, loc.lng], 13);
                    status.innerText = `found: ${loc.display_name}`;
                    return;
                }

                // Build Modal Content
                let selectionModal = document.getElementById('searchSelectionModal');
                if(!selectionModal) {
                    selectionModal = document.createElement('div');
                    selectionModal.id = 'searchSelectionModal';
                    selectionModal.className = 'modal';
                    // Using .search-results-modal class from map.css instead of inline styles
                    selectionModal.innerHTML = `
                        <div class="modal__content search-results-modal">
                            <div class="search-results-header">
                                <h2 class="search-results-title">search results</h2>
                                <button class="modal__close" onclick="this.closest('.modal').hidden = true;">×</button>
                            </div>
                            <div id="searchResultsList" class="search-results-list"></div>
                        </div>
                    `;
                    document.body.appendChild(selectionModal);
                }
                
                const list = selectionModal.querySelector('#searchResultsList');
                list.innerHTML = '';

                // Helper to render section
                const renderSection = (title, items, onClick) => {
                    if (items.length === 0) return;
                    
                    const section = document.createElement('div');
                    section.className = 'search-section';
                    
                    const header = document.createElement('h3');
                    header.className = 'search-section-header';
                    header.textContent = title;
                    section.appendChild(header);

                    items.forEach(item => {
                        const btn = document.createElement('button');
                        btn.className = 'btn btn--ghost search-result-item';
                        
                        // Icon Selection
                        let iconSvg = '';
                        if (item.type === 'song') {
                            iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>`;
                        } else if (item.type === 'memory') {
                            iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;
                        } else if (item.type === 'location') {
                            iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
                        }

                        btn.innerHTML = `<span class="search-result-icon">${iconSvg}</span> ${item.display}`;
                        
                        btn.onclick = () => {
                            onClick(item);
                            selectionModal.hidden = true;
                        };
                        section.appendChild(btn);
                    });

                    list.appendChild(section);
                };

                renderSection('memories', results.memories, (item) => {
                    map.flyTo(item.marker.getLatLng(), 16);
                    setTimeout(() => item.marker.fire('click'), 800); // Open preview
                    status.innerText = "memory found.";
                });

                renderSection('songs', results.songs, (item) => {
                    map.flyTo(item.marker.getLatLng(), 16);
                    setTimeout(() => item.marker.fire('click'), 800); // Open preview
                    status.innerText = "song found.";
                });

                renderSection('locations', results.locations, (item) => {
                    map.flyTo([item.lat, item.lng], 13);
                    status.innerText = `found: ${item.full_name}`; // Fix variable access
                });

                selectionModal.hidden = false;
                status.innerText = `found ${totalResults} results.`;
            }
        });
    }

    // --- Cluster Toggle Logic ---
    const clusterWrapper = document.getElementById('clusterToggleWrapper');
    if (clusterToggleWrapper) {
        clusterToggleWrapper.addEventListener('click', (e) => {
            // Toggle the checkbox manually if the wrapper is clicked (handled by having input inside, but custom logic helps visual sync)
             if (e.target.tagName !== 'INPUT') {
                 clusterToggle.checked = !clusterToggle.checked;
             }
             
            const isClustered = clusterToggle.checked;
            
            // Visual Toggle State
            if (isClustered) {
                clusterToggleWrapper.classList.add('active');
            } else {
                clusterToggleWrapper.classList.remove('active');
            }

            const markers = window.sonderMarkers || {};
            
            if (isClustered) {
                // Enable Clustering
                if(window.sonderClusterGroup) {
                   // Ensure map is clean of individual markers first (EXCEPT special one)
                   Object.values(markers).forEach(m => {
                       // Robust Fix: Identify by content (The "Definition" Marker)
                       const rawText = (m.sonderData && m.sonderData.text) ? m.sonderData.text : '';
                       const text = rawText.toString().toLowerCase().trim();
                       // Check for key phrases of the definition
                       const isDefinition = text.includes('realization that each') || text.includes('random passerby');
                       
                       if(!isDefinition && map.hasLayer(m)) map.removeLayer(m);
                   });
                   
                   map.removeLayer(window.sonderClusterGroup);
                   window.sonderClusterGroup.clearLayers();
                   
                   Object.values(markers).forEach(m => {
                       const rawText = (m.sonderData && m.sonderData.text) ? m.sonderData.text : '';
                       const text = rawText.toString().toLowerCase().trim();
                       // Check for key phrases of the definition
                       const isDefinition = text.includes('realization that each') || text.includes('random passerby');

                       if (isDefinition) {
                           // Ensure special marker stays on map
                           if (!map.hasLayer(m)) m.addTo(map);
                       } else {
                           window.sonderClusterGroup.addLayer(m);
                       }
                   });
                   map.addLayer(window.sonderClusterGroup);
                }
            } else {
                // Disable Clustering (Show all individual)
                if(window.sonderClusterGroup) {
                    map.removeLayer(window.sonderClusterGroup);
                }
                Object.values(markers).forEach(m => {
                    if(!map.hasLayer(m)) m.addTo(map);
                });
            }
        });
        
        // Initial State Sync
        if(clusterToggle.checked) clusterToggleWrapper.classList.add('active');
    }

    // --- Manual Placement Logic ---
    if(pickLocationBtn) {
        let cancelManualPlacement = null; // Scope for cleanup function

        pickLocationBtn.addEventListener('click', (e) => {
            // Toggle / Cancel Logic
            if (isManualMode && cancelManualPlacement) {
                cancelManualPlacement();
                return;
            }

            isManualMode = true;
            status.innerText = "click anywhere on the map to place.";
            
            // Remove existing manual marker
            if(manualMarker) map.removeLayer(manualMarker);

            // Create Ghost Marker
            const center = map.getCenter();
            manualMarker = L.marker([center.lat, center.lng], {
                interactive: false, // Don't block clicks initially
                icon: L.divIcon({
                    className: '', // Clear class to avoid interference
                    html: `
                        <div style="
                            width: 25px; 
                            height: 25px; 
                            background: white; 
                            border-radius: 50% 50% 50% 0; 
                            transform: rotate(-45deg); 
                            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                            border: 2px solid rgba(0,0,0,0.1);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">
                            <div style="
                                width: 8px;
                                height: 8px;
                                background: var(--color-text, #333);
                                border-radius: 50%;
                                transform: rotate(45deg);
                            "></div>
                        </div>
                    `,
                    iconSize: [25, 25],
                    iconAnchor: [12.5, 12.5] 
                })
            }).addTo(map);

            // Update status & Button Text
            pickLocationBtn.innerText = "cancel";
            pickLocationBtn.classList.add('active');

            // Follow Mouse
            const onMouseMove = (e) => {
                manualMarker.setLatLng(e.latlng);
            };
            map.on('mousemove', onMouseMove);

            // Click to Drop (Forward declaration)
            let onMapClick;

            // Esc Key Handler (Forward declaration)
            let onEscKey;

            // Cancel Function
            cancelManualPlacement = () => {
                isManualMode = false;
                status.innerText = "manual placement canceled.";
                pickLocationBtn.innerText = "manual";
                pickLocationBtn.classList.remove('active');
                
                if(manualMarker) map.removeLayer(manualMarker);
                manualMarker = null;

                map.off('mousemove', onMouseMove);
                if(onMapClick) map.off('click', onMapClick);
                if(onEscKey) document.removeEventListener('keydown', onEscKey);
                
                cancelManualPlacement = null;
            };

            // Esc Key Implementation
            onEscKey = (e) => {
                if(e.key === 'Escape') cancelManualPlacement();
            };
            document.addEventListener('keydown', onEscKey);

            // Click to Drop Implementation
            onMapClick = (e) => {
                // Stop following
                map.off('mousemove', onMouseMove);
                map.off('click', onMapClick); // Remove listener to avoid multi-drops
                
                manualMarker.setLatLng(e.latlng);
                manualLocation = { lat: e.latlng.lat, lng: e.latlng.lng };
                
                // Show Confirmation Popup
                const popupContent = document.createElement('div');
                popupContent.innerHTML = `
                    <div style="text-align: center; padding: 5px;">
                        <p style="margin: 0 0 8px 0; font-family: inherit; font-size: 0.9rem;">is this the place?</p>
                        <div style="display: flex; gap: 8px; justify-content: center;">
                            <button id="confirmLocBtn" style="background: var(--color-text); color: var(--color-bg); border: none; padding: 4px 12px; border-radius: 12px; cursor: pointer; font-family: inherit; font-size: 0.8rem;">yes</button>
                            <button id="retryLocBtn" style="background: transparent; border: 1px solid var(--color-text); color: var(--color-text); padding: 4px 12px; border-radius: 12px; cursor: pointer; font-family: inherit; font-size: 0.8rem;">no</button>
                        </div>
                    </div>
                `;
                
                const popup = L.popup({
                    offset: [0, -35],
                    closeButton: false,
                    className: 'sonder-popup'
                })
                .setLatLng(e.latlng)
                .setContent(popupContent)
                .openOn(map);

                // Handle Confirmation
                setTimeout(() => {
                    const confirmBtn = document.getElementById('confirmLocBtn');
                    const retryBtn = document.getElementById('retryLocBtn');

                    if(confirmBtn) {
                        confirmBtn.onclick = () => {
                            map.closePopup();
                            
                            // 1. Open Entry Modal (While Manual Mode is still TRUE so addBtn logic works)
                            if(addBtn) {
                                addBtn.disabled = false;
                                addBtn.click();
                            }

                            // 2. Populate form explicitly as backup (addBtn listener does this too, but safety first)
                            const latInput = document.getElementById('mapEntryLat');
                            const lngInput = document.getElementById('mapEntryLng');
                            if(latInput && manualLocation) latInput.value = manualLocation.lat;
                            if(lngInput && manualLocation) lngInput.value = manualLocation.lng;

                            // 3. Cleanup manual placement state
                            isManualMode = false;
                            pickLocationBtn.innerText = "manual";
                            pickLocationBtn.classList.remove('active');
                            document.removeEventListener('keydown', onEscKey);
                            cancelManualPlacement = null;
                            if(manualMarker) map.removeLayer(manualMarker);
                        };
                    }

                    if(retryBtn) {
                        retryBtn.onclick = () => {
                            map.closePopup();
                            status.innerText = "try again. click to place.";
                            map.on('mousemove', onMouseMove); // Resume following
                            map.on('click', onMapClick); // Resume clicking
                        };
                    }
                }, 100); 
            };

            map.on('click', onMapClick);
        });
    }

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
            // RESET MANUAL MODE
            isManualMode = false;
            if(manualMarker) map.removeLayer(manualMarker);
            
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

            // CHECK MODE
            if (isManualMode && manualLocation) {
                open(manualLocation.lat, manualLocation.lng);
            } else if (userLocation) {
                 open(userLocation.lat, userLocation.lng);
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
            let songValue = formData.get('song')?.trim() || '';
            let songUrl = songValue;

            // Only prefix 'https://' if it looks like a URL (no spaces, contains a dot, not already a URL)
            if (songValue && !songValue.match(/^https?:\/\//i) && !songValue.includes(' ') && songValue.includes('.')) {
                songUrl = 'https://' + songValue;
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

                    if (data.title) {
                        let title = data.title;
                        let artist = data.author_name;

                        // PRECISION PARSING (V5): Check HTML for "Title by Artist"
                        if (data.html) {
                            const match = data.html.match(/title="Spotify Embed: (.*?) by (.*?)"/);
                            if (match) {
                                title = match[1].trim();
                                artist = match[2].trim();
                            }
                        }

                        // Fallback: Check "Title by Artist" in the title field itself
                        if (!artist && title.includes(' by ')) {
                            const parts = title.split(' by ');
                            title = parts[0].trim();
                            artist = parts[1].trim();
                        }

                        formData.set('songTitle', title);
                        if (artist) formData.set('artist', artist);
                    }
                    if (data.thumbnail_url) formData.set('thumbnail', data.thumbnail_url);
                } catch (err) {
                    const manualInputs = document.getElementById('manualSongInputs');
                    if (manualInputs) manualInputs.style.display = 'block';
                    hideLoading();
                    return; // Stop and let user fill manual inputs
                }
            }

            let finalSongTitle = formData.get('songTitle') || formData.get('manualTitle');
            let finalArtist = formData.get('artist') || formData.get('manualArtist');

            // Proactive Parsing: If title is missing but 'song' looks like "Title - Artist"
            if (!finalSongTitle && songValue && !songValue.match(/^https?:\/\//i)) {
                if (songValue.includes(' - ')) {
                    const parts = songValue.split(' - ');
                    finalSongTitle = parts[0].trim();
                    finalArtist = parts[1].trim();
                } else if (songValue.includes(' | ')) {
                    const parts = songValue.split(' | ');
                    finalSongTitle = parts[0].trim();
                    finalArtist = parts[1].trim();
                } else if (songValue.includes(' by ')) {
                    const parts = songValue.split(' by ');
                    finalSongTitle = parts[0].trim();
                    finalArtist = parts[1].trim();
                }
            }

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

            // Save to Supabase
            const entry = {
                text: formData.get('text'),
                song: songUrl,
                song_title: finalSongTitle,
                artist: finalArtist,
                thumbnail: formData.get('thumbnail'),
                image: imageUrl,
                color: formData.get('color'),
                lat: parseFloat(formData.get('lat')),
                lng: parseFloat(formData.get('lng')),
                reaction_count: 0,
                comment_count: 0,
                view_count: 0,
                comments_enabled: formData.get('commentsEnabled') === 'on',
                reactions_enabled: formData.get('reactionsEnabled') === 'on',
                user_agent: navigator.userAgent,
                user_id: getUserId()
            };

            try {
                // 1. Profanity Check
                if (ProfanityGuard.isToxic(formData.get('text'))) {
                    hideLoading();
                    alert('this memory contains echoes that cannot be shared here.');
                    return;
                }

                // 2. Ban Check
                const { data: banData } = await window.supabase.from('banned_users').select('user_id').eq('user_id', getUserId());
                if (banData && banData.length > 0) {
                    hideLoading();
                    alert('you have been separated from the world. you can no longer leave memories.');
                    return;
                }

                const { data, error } = await supabase
                    .from('entries')
                    .insert([entry])
                    .select();

                if (error) throw error;

                // Immediate Marker Update (Fallback for real-time)
                if (data && data[0] && window.sonderMarkers) {
                    addMarker(data[0], map, window.sonderMarkers, window.sonderMarkerCoords || {});
                }

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

                // Trigger Echo Toast after a delay to allow the success message to breathe
                setTimeout(showEchoToast, 2500);

            } catch (error) {
                showAlert("Error", "Error saving entry: " + error.message);
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
            if (!file) return;

            // 1. Validation
            // Assuming validateImage is global or imported. If strict size check fails, we might still want to allow cropping?
            // Usually we validate type here.
            const validation = typeof validateImage === 'function' ? validateImage(file) : { valid: true };

            if (!validation.valid) {
                showAlert("Validation Error", validation.message);
                imageInput.value = '';
                return;
            }

            // 2. Open Cropper
            if (window.SonderCropper) {
                window.SonderCropper.start(file, (croppedBlob) => {
                    // --- SUCCESS: User cropped the image ---

                    // Display Preview
                    const url = URL.createObjectURL(croppedBlob);
                    imagePreviewImg.src = url;
                    imagePreview.style.display = 'block';

                    // Update Global for Upload (blob is treated as file)
                    window.selectedImageFile = croppedBlob;

                    // Lock buttons
                    if (fileUploadBtn) { fileUploadBtn.disabled = true; fileUploadBtn.innerHTML = 'image cropped'; }
                    if (cameraBtn) cameraBtn.disabled = true;

                    // Cleanup input so change triggers again if they re-select same file
                    imageInput.value = '';

                }, () => {
                    // --- CANCELLED ---
                    imageInput.value = ''; // clear selection
                });
            } else {
                console.error("SonderCropper not found");
                // Fallback to original logic if cropper script missing
                const reader = new FileReader();
                reader.onload = (ev) => {
                    imagePreviewImg.src = ev.target.result;
                    imagePreview.style.display = 'block';
                    if (fileUploadBtn) { fileUploadBtn.disabled = true; fileUploadBtn.innerHTML = 'image selected'; }
                    if (cameraBtn) cameraBtn.disabled = true;
                };
                reader.readAsDataURL(file);
                window.selectedImageFile = file;
            }
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
                showAlert("Error", err.message);
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

                // Close camera first
                closeCamera();

                // Open cropper (same flow as file upload)
                if (window.SonderCropper) {
                    window.SonderCropper.start(file, (croppedBlob) => {
                        // SUCCESS: User cropped the image
                        const url = URL.createObjectURL(croppedBlob);
                        imagePreviewImg.src = url;
                        imagePreview.style.display = 'block';

                        window.selectedImageFile = croppedBlob;

                        // Lock buttons
                        if (fileUploadBtn) { fileUploadBtn.disabled = true; fileUploadBtn.innerHTML = 'photo cropped'; }
                        if (cameraBtn) { cameraBtn.disabled = true; cameraBtn.innerHTML = 'photo taken'; }

                    }, () => {
                        // CANCELLED - Reset buttons
                        console.log("Crop cancelled");
                        if (fileUploadBtn) { fileUploadBtn.disabled = false; fileUploadBtn.innerHTML = 'choose image'; }
                        if (cameraBtn) { cameraBtn.disabled = false; cameraBtn.innerHTML = 'take photo'; }
                    });
                } else {
                    // Fallback if cropper not available
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        imagePreviewImg.src = ev.target.result;
                        imagePreview.style.display = 'block';
                        if (fileUploadBtn) { fileUploadBtn.disabled = true; fileUploadBtn.innerHTML = 'image captured'; }
                        if (cameraBtn) { cameraBtn.disabled = true; cameraBtn.innerHTML = 'photo taken'; }
                    };
                    reader.readAsDataURL(file);
                    window.selectedImageFile = file;
                }
            } catch (err) {
                console.error(err);
                showAlert("Capture Failed", 'Capture failed');
            }
        });
    }

    if (closeCamBtn) {
        closeCamBtn.addEventListener('click', () => closeCamera());
    }
}

/* --- Entry Preview (Popup) --- */
/* --- Entry Preview (Popup) --- */

// Helper: Generate visible image for sharing

/* --- Support Modal Logic --- */
function initSupportModal() {
    // 1. Inject Modal HTML if not present
    if (!document.getElementById('supportModal')) {
        const modalHTML = `
        <div class="modal-overlay modal-overlay--support" id="supportModal" hidden>
            <div class="support-modal-container" id="supportModalContainer">
                <div class="support-main-card">
                    <div class="modal__content">
                        <button class="modal__close" id="supportModalClose">&times;</button>
                        <h2 class="modal__title">keep sonder alive</h2>
                        <p class="modal__description">
                            sonder is a soul-searching experiment. your support helps me keep this world spinning, to buy a real domain in the future, and continue creating.
                        </p>

                        <ul class="support-goals">
                            <li>custom domain</li>
                            <li>hosting & db</li>
                            <li>new features</li>
                        </ul>
                        
                        <div class="support-grid">
                            <!-- Ko-fi -->
                            <a href="https://ko-fi.com/I3I71PZ3NX" target="_blank" class="support-card support-card--kofi" title="support on ko-fi">
                                <img src="https://storage.ko-fi.com/cdn/cup-border.png" alt="ko-fi" class="support-card__logo">
                            </a>

                            <!-- GCash -->
                            <button class="support-card support-card--gcash" id="btnGcash" data-qr="gcash.jpg" title="support via gcash">
                                <img src="gcash-logo.svg" alt="gcash" class="support-card__logo">
                            </button>

                            <!-- PayPal -->
                            <button class="support-card support-card--paypal" id="btnPaypal" data-qr="paypal.jpg" title="support via paypal">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="paypal" class="support-card__logo">
                            </button>
                        </div>
                    </div>
                </div>

                <!-- QR Side Panel -->
                <div class="support-qr-panel" id="supportQrPanel">
                    <div class="qr-panel__content">
                        <button class="qr-panel__close" id="supportQrClose">&times;</button>
                        <h3 class="qr-panel__title">scan to support</h3>
                        <div class="qr-panel__image-container">
                            <img src="" alt="support qr" id="largeQrImage">
                        </div>
                        <p class="qr-panel__hint">thank you for keeping the world spinning.</p>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // 2. JS Logic
    const modal = document.getElementById('supportModal');
    const closeBtn = document.getElementById('supportModalClose');
    const qrPanel = document.getElementById('supportQrPanel');
    const qrClose = document.getElementById('supportQrClose');
    const largeQrImage = document.getElementById('largeQrImage');

    const isMobile = () => window.innerWidth <= 900;

    const openQrPanel = (qrSrc) => {
        if (!qrPanel || !largeQrImage) return;

        largeQrImage.src = qrSrc;
        qrPanel.classList.add('active');
        qrPanel.classList.remove('closing');

        // Let CSS handle the slide-out for maximum stability
    };

    const hideQrPanel = () => {
        if (!qrPanel || !qrPanel.classList.contains('active')) return;

        qrPanel.classList.remove('active');
        qrPanel.classList.add('closing');
    };

    // Toggle Logic for buttons
    document.querySelectorAll('.support-card[data-qr]').forEach(btn => {
        btn.addEventListener('click', () => {
            const qrSrc = btn.getAttribute('data-qr');
            openQrPanel(qrSrc);
        });
    });

    if (qrClose) qrClose.onclick = hideQrPanel;

    // Reset Modal
    const resetModal = () => {
        modal.hidden = true;
        hideQrPanel();
    };

    if (closeBtn) closeBtn.onclick = resetModal;

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) resetModal();
    });

    // 3. Hijack Existing Support Links
    const supportLinks = document.querySelectorAll('a[href*="ko-fi.com"]');
    supportLinks.forEach(link => {
        // Skip links inside the modal so they actually redirect
        if (link.closest('#supportModal')) return;

        link.addEventListener('click', (e) => {
            e.preventDefault();
            modal.hidden = false;
            modal.removeAttribute('hidden');
        });
    });
    // 4. Map Floating Button Support
    const mapSupportBtn = document.getElementById('mapSupportBtn');
    if (mapSupportBtn) {
        mapSupportBtn.addEventListener('click', () => {
            modal.hidden = false;
            modal.removeAttribute('hidden');
        });
    }
}



// Helper: Generate visible image for sharing (V3: Immersive Glass)
async function generateEntryImage(data) {
    // --- 1. Setup Canvas & Dimensions ---
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;

    const cardWidth = 860; // Slightly wider for immersive feel
    const cardX = (width - cardWidth) / 2;
    const padding = 70;
    const textWidth = cardWidth - (padding * 2);

    // --- 2. Load Assets (Async) ---
    let headerImg = null;
    let headerType = 'quote'; // 'image' | 'thumbnail' | 'quote'
    let musicThumbImg = null;

    // Helper for safe image loading with timeout (3s)
    const loadImgSafe = (img, src) => {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                console.warn("Image load timeout:", src);
                resolve(); // Resolve anyway to proceed with partial data/defaults
            }, 1500); // Reduced to 1.5s to preserve user-gesture
            img.onload = () => { clearTimeout(timer); resolve(); };
            img.onerror = (e) => { clearTimeout(timer); reject(e); };
            img.src = src;
        });
    };

    // A. Main Header Image
    if (data.image) {
        try {
            headerImg = new Image();
            headerImg.crossOrigin = "anonymous";
            await loadImgSafe(headerImg, data.image);
            headerType = 'image';
        } catch (e) { headerType = 'quote'; }
    } else if (data.thumbnail) {
        try {
            headerImg = new Image();
            headerImg.crossOrigin = "anonymous";
            await loadImgSafe(headerImg, data.thumbnail);
            headerType = 'thumbnail';
        } catch (e) { headerType = 'quote'; }
    }

    // B. Music Box Thumbnail
    const hasSongInfo = data.song_title || data.manualTitle;
    const needMusicThumb = hasSongInfo && data.thumbnail && headerType !== 'thumbnail';
    if (needMusicThumb) {
        try {
            musicThumbImg = new Image();
            musicThumbImg.crossOrigin = "anonymous";
            await loadImgSafe(musicThumbImg, data.thumbnail);
            if (!musicThumbImg.width) musicThumbImg = null;
        } catch (e) { console.warn(e); }
    }



    // --- 3. Calculate Layout ---
    let headerHeight = (headerType === 'quote') ? 220 : 650; // Taller header for drama

    // Text Wrapping
    ctx.font = '400 48px "Inter", sans-serif';
    const words = data.text ? data.text.split(' ') : [];
    let line = '';
    const wrappedLines = [];
    if (words.length > 0) {
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > (textWidth - 40) && n > 0) {
                wrappedLines.push(line);
                line = words[n] + ' ';
            } else { line = testLine; }
        }
        wrappedLines.push(line);
    }
    const lineHeight = 75;
    const textBlockHeight = wrappedLines.length * lineHeight;

    // Music Player Height
    const musicHeight = hasSongInfo ? 180 : 0; // Taller for "Player" look

    const contentHeight = headerHeight + 60 + textBlockHeight + musicHeight + 80;
    const totalCardHeight = Math.max(900, contentHeight);

    // --- 4. Draw Immersive Background ---
    // Rule: Use the Header Image as background if available. Else gradient.
    const bgImg = headerImg || musicThumbImg;

    if (bgImg) {
        ctx.save();
        ctx.filter = 'blur(60px) brightness(0.9) saturate(1.2)';
        // Draw Cover
        const scale = Math.max(width / bgImg.width, height / bgImg.height);
        const x = (width / 2) - (bgImg.width / 2) * scale;
        const y = (height / 2) - (bgImg.height / 2) * scale;
        ctx.drawImage(bgImg, x, y, bgImg.width * scale, bgImg.height * scale);

        // Add a noise/texture overlay for "Vibe" (Optional, maybe too complex for canvas)
        // Add a slight dark tint
        ctx.fillStyle = data.color === 'black' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.2)';
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    } else {
        // Fallback Beautiful Gradient
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        if (data.color === 'black') {
            gradient.addColorStop(0, '#2b2b2b');
            gradient.addColorStop(1, '#000000');
        } else {
            gradient.addColorStop(0, '#e0eafc');
            gradient.addColorStop(1, '#cfdef3');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    // --- 5. Draw Glass Card ---
    let cardY = 320; // Float higher
    const radius = 50;

    // Glass Style
    ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
    ctx.shadowBlur = 80;
    ctx.shadowOffsetY = 40;

    // Card Base Color
    if (data.color === 'black') {
        ctx.fillStyle = 'rgba(30, 30, 30, 0.85)'; // Dark Glass
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; // Light Glass (more opaque for readability)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    }

    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardWidth, totalCardHeight, radius);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.stroke(); // Subtle border
    ctx.shadowColor = "transparent";

    // --- 6. Draw Content ---
    let currentY = cardY;

    // A. Header
    if (headerType === 'quote') {
        ctx.font = '700 140px "Inter", sans-serif';
        ctx.fillStyle = data.color === 'black' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
        ctx.textAlign = 'center';
        ctx.fillText('❝', cardX + cardWidth / 2, cardY + 160);
        currentY += 220;
    } else {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardWidth, 650, [radius, radius, 0, 0]);
        ctx.clip();

        // Draw sharp image
        const scale = Math.max(cardWidth / headerImg.width, 650 / headerImg.height);
        const x = (cardWidth / 2) - (headerImg.width / 2) * scale;
        const y = (650 / 2) - (headerImg.height / 2) * scale;
        ctx.drawImage(headerImg, cardX + x, cardY + y, headerImg.width * scale, headerImg.height * scale);

        // Inner Shadow for depth
        const grad = ctx.createLinearGradient(0, cardY, 0, cardY + 200);
        grad.addColorStop(0, 'rgba(0,0,0,0.3)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(cardX, cardY, cardWidth, 200);

        ctx.restore();
        currentY += 650;
    }

    // B. Text 
    // "dont center it but keep the padiding" -> Left align, 70px pad
    currentY += 70;
    ctx.font = '400 48px "Inter", sans-serif';
    ctx.fillStyle = data.color === 'black' ? '#ffffff' : '#1a1a1a';

    if (headerType === 'quote') {
        ctx.textAlign = 'center';
        const centerX = width / 2;
        wrappedLines.forEach(l => {
            ctx.fillText(l, centerX, currentY + 30);
            currentY += lineHeight;
        });
    } else {
        ctx.textAlign = 'left';
        const textStartX = cardX + padding + 10;
        wrappedLines.forEach(l => {
            ctx.fillText(l, textStartX, currentY + 30);
            currentY += lineHeight;
        });
    }
    currentY += 60; // Bottom pad

    // C. Music Player Pill
    if (hasSongInfo) {
        const pillX = cardX + 40;
        const pillW = cardWidth - 80;
        const pillH = 140; // Taller

        // Pill Background
        ctx.fillStyle = data.color === 'black' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
        ctx.beginPath();
        ctx.roundRect(pillX, currentY, pillW, pillH, 70); // Fully rounded
        ctx.fill();

        // Mini Thumb in Pill
        let textLeft = pillX + 40;

        // ALLOW THUMBNAIL even if User Image exists (Text+Img+Music support)
        if (data.thumbnail) {
            // Determine which loaded image to use
            // If Header is Thumbnail, use headerImg. Else use the separate musicThumbImg.
            const thumb = (headerType === 'thumbnail') ? headerImg : musicThumbImg;

            if (thumb && thumb.width > 0) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(pillX + 70, currentY + 70, 50, 0, Math.PI * 2); // Circular Art
                ctx.clip();
                ctx.drawImage(thumb, pillX + 20, currentY + 20, 100, 100);
                ctx.restore();
                textLeft += 120; // Shift text for image
            } else {
                // Fallback Layout if thumb failed to load
                ctx.font = '400 50px "Inter"';
                ctx.fillStyle = '#888';
                ctx.fillText("♪", pillX + 60, currentY + 85);
                textLeft += 60;
            }
        } else {
            // Text Only Icon (No Thumbnail at all)
            ctx.font = '400 50px "Inter"';
            ctx.fillStyle = '#888';
            ctx.fillText("♪", pillX + 60, currentY + 85);
            textLeft += 60;
        }

        // Song Info
        ctx.textAlign = 'left';
        ctx.font = '600 40px "Inter", sans-serif';
        ctx.fillStyle = data.color === 'black' ? '#fff' : '#333';
        const songTitle = data.song_title || data.manualTitle || "Unknown Song";
        // ALIGNMENT FIX: Match baseline with Icon (85)
        ctx.fillText(songTitle, textLeft, currentY + 85);

        // Artist (Positioned below)
        ctx.font = '400 32px "Inter", sans-serif';
        ctx.fillStyle = '#888';
        const artist = data.artist || data.manualArtist || "";
        ctx.fillText(artist, textLeft, currentY + 125);
    }

    // --- 7. Footer ---
    ctx.font = '700 40px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; // Always light on blurred bg? No.
    // If bg is light (gradient), use dark. But immersive bg is usually dark/rich.
    // Let's use a safe color or shadow.
    ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 10;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';

    // Spaced out S O N D E R
    ctx.fillText("S  O  N  D  E  R", width / 2, height - 150);
    ctx.shadowColor = "transparent";

    ctx.shadowColor = "transparent";
    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

window.showEntryPreview = function (data, marker) {
    const overlay = document.createElement('div');
    overlay.className = 'entry-card-overlay';

    // Wrapper for side-by-side layout
    const wrapper = document.createElement('div');
    wrapper.className = 'entry-card-wrapper';
    overlay.appendChild(wrapper);

    let commentChannel = null;

    // --- Content Logic (Spotify, Images) ---
    let mediaContent = '';

    if (data.song) {
        const spotifyMatch = data.song.match(/spotify\.com\/.*(track|episode)\/([a-zA-Z0-9]+)/);
        if (spotifyMatch) {
            const type = spotifyMatch[1];
            const id = spotifyMatch[2];
            mediaContent = `<div style="margin-top: 1.5rem; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <iframe src="https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0" width="100%" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
            </div>`;
        } else {
            mediaContent = `<div class="entry-card__links" style="margin-top: 1rem;"><a href="${escapeHtml(data.song)}" target="_blank" rel="noopener noreferrer">♪ Listen to song</a></div>`;
        }
    }

    // Action Buttons HTML
    const shareBtnsHtml = `
        <div style="display: flex; gap: 8px;">
            <button class="entry-card__share btn-copy-link" title="copy link" style="background: rgba(0,0,0,0.3); color: white; border:none; border-radius: 50%; width: 32px; height: 32px; display:flex; align-items:center; justify-content:center; cursor:pointer;">➦</button>
            <button class="entry-card__share btn-social-share" title="share to story" style="background: rgba(0,0,0,0.3); color: white; border:none; border-radius: 50%; width: 32px; height: 32px; display:flex; align-items:center; justify-content:center; cursor:pointer;">✧</button>
            <button class="entry-card__close" style="background: rgba(0,0,0,0.3); color: white;">×</button>
        </div>
    `;

    // Header Construction
    let headerHtml = '';
    // Styling for buttons depending on if there's a header image or not
    // We want full width now for the split layout
    const btnStyle = data.thumbnail || data.image ?
        'position: absolute; top: 1rem; left: 1rem; right: 1rem; z-index: 10;' :
        'position: absolute; top: 1rem; left: 1rem; right: 1rem; z-index: 10;';

    const btnColor = data.thumbnail || data.image ? 'white' : 'var(--color-text)';
    const btnBg = data.thumbnail || data.image ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)';

    // We inject specific styles for the buttons based on context
    // Layout: [Copy] [Story] <--- space ---> [Close]
    // Action Buttons HTML
    const shareIconAttr = '{"variationThumbColour":"#FFFFFF","variationName":"Two Tone","variationNumber":2,"numberOfGroups":2,"backgroundIsGroup":false,"strokeWidth":1.5,"defaultColours":{"group-1":"#FFFFFF","group-2":"#FFFFFF","background":"transparent"}}';

    const actionBtns = `
        <div class="entry-actions" style="${btnStyle} display: flex; justify-content: space-between; align-items: flex-start; pointer-events: none;">
            <div style="display: flex; gap: 12px; pointer-events: auto;">
                <button class="entry-card__action-btn btn-copy-link" title="Copy Link">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                </button>
                <button class="entry-card__action-btn btn-social-share" title="Share and Export">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                </button>
                <button class="entry-card__action-btn btn-report-entry" id="reportBtn-${escapeHtml(data.id)}" title="Report" style="opacity: 0.6;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                </button>
            </div>
            <button class="entry-card__action-btn entry-card__close" style="pointer-events: auto;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
    `;

    if (data.thumbnail) {
        headerHtml = `<div class="entry-card__art-header" style="background-image: url('${escapeHtml(data.thumbnail)}');">
             ${actionBtns}
        </div>`;
    }

    let userImageHtml = '';
    if (data.image) {
        userImageHtml = `<div class="entry-card__user-image">
            <img src="${escapeHtml(data.image)}" alt="user photo" oncontextmenu="return false;" draggable="false" />
        </div>`;
    }

    const contentStyle = data.thumbnail ? '' : 'padding-top: 3rem;';

    const entryCardHtml = `
      <div class="entry-card">
        ${data.thumbnail ? headerHtml : actionBtns}
        <div class="entry-card__content" style="${contentStyle}">
            <div class="entry-card__location">${(data.lat).toFixed(4)}, ${(data.lng).toFixed(4)}</div>
            <div class="entry-card__timestamp">${data.timestamp ? new Date(data.timestamp).toLocaleDateString() : 'Just now'}</div>
            <div class="entry-card__text" style="border-left: 3px solid ${getColorCode(data.color)}; padding-left: 12px;">${escapeHtml(data.text)}</div>
            ${userImageHtml}
            ${mediaContent}
            
            <div class="entry-card__footer">
                <div class="entry-card__footer-group">
                    <div class="footer-item" title="Views">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        <span class="footer-count" id="viewCount-${escapeHtml(data.id)}">0</span>
                    </div>
                </div>

                <div class="entry-card__footer-actions">
                    ${data.reactions_enabled !== false ? `
                    <button class="entry-action-btn heart-btn" id="heartBtn-${escapeHtml(data.id)}" title="Like">
                        <div class="footer-item">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="heart-icon"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                            <span class="footer-count" id="likeCount-${escapeHtml(data.id)}">0</span>
                        </div>
                    </button>
                    ` : ''}
                    ${data.comments_enabled !== false ? `
                    <button class="entry-action-btn comment-btn" id="commentBtn-${escapeHtml(data.id)}" title="Comment">
                        <div class="footer-item">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 1 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                            <span class="footer-count" id="commentCount-btn-${escapeHtml(data.id)}">0</span>
                        </div>
                    </button>
                    ` : ''}
                </div>
            </div>
        </div>
      </div>

      ${data.comments_enabled !== false ? `
      <div class="entry-comments-card" id="sideComments-${data.id}">
          <div class="comments-card__header">
              <h3>Comments</h3>
              <button class="comments-card__close" id="closeComments-${data.id}">✕</button>
          </div>
          <div class="comments-card__list" id="commentList-${data.id}">
              <div class="comments-loading">Loading conversations...</div>
          </div>
          <div class="comments-card__input-area">
              <input type="text" placeholder="Add a comment..." id="commentInput-${data.id}">
              <button class="comment-submit-btn" id="commentSubmit-${data.id}">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
          </div>
      </div>
      ` : ''}
    `;

    wrapper.innerHTML = entryCardHtml;

    document.body.appendChild(overlay);

    // View & Reaction Logic
    const currentUserId = getUserId();
    const vCountEl = document.getElementById(`viewCount-${data.id}`);
    const lCountEl = document.getElementById(`likeCount-${data.id}`);
    const cCountEl = document.getElementById(`commentCount-btn-${data.id}`);
    const heartBtn = document.getElementById(`heartBtn-${data.id}`); // Define heartBtn here for persistence logic

    if (window.supabase) {
        // 1. Initial Load from data
        if (vCountEl) vCountEl.textContent = data.view_count || 0;
        if (lCountEl) lCountEl.textContent = data.reactions || 0; // Assuming data.reactions is initial like count

        // 2. Real View Count
        window.supabase.from('views')
            .select('*', { count: 'exact', head: true })
            .eq('entry_id', data.id)
            .then(({ count, error }) => {
                if (!error && vCountEl) vCountEl.textContent = count || data.view_count || 0;
            });

        // 3. Real Like Count
        window.supabase.from('reactions')
            .select('*', { count: 'exact', head: true })
            .eq('entry_id', data.id)
            .then(({ count, error }) => {
                if (!error && lCountEl) lCountEl.textContent = count || 0;
            });

        // 4. Real Comment Count
        window.supabase.from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('entry_id', data.id)
            .then(({ count, error }) => {
                if (!error && cCountEl) cCountEl.textContent = count || 0;
            });

        // 5. Check if Liked by current user
        window.supabase.from('reactions')
            .select('user_id')
            .eq('entry_id', data.id)
            .eq('user_id', currentUserId)
            .then(({ data: reactData, error: reactError }) => {
                if (reactError) console.error('Error checking like status:', reactError);
                if (reactData && reactData.length > 0 && heartBtn) {
                    heartBtn.classList.add('active');
                }
            });

        // Unique View Tracking (Persistent Per User ID)
        const viewedKey = `sonder-viewed-${currentUserId}-${data.id}`;
        if (!localStorage.getItem(viewedKey)) {
            window.supabase.from('views')
                .insert({
                    entry_id: data.id,
                    user_id: currentUserId
                })
                .then(({ error }) => {
                    // If no error, it was a new unique view in the DB
                    // If 409 Conflict, it means they viewed it on another device with same ID
                    if (!error) {
                        localStorage.setItem(viewedKey, 'true');
                        // Cache the count in the entries table for statistics
                        window.supabase.rpc('increment_view_count', { row_id: data.id }).then(({ error: rpcError }) => {
                            if (rpcError) {
                                // Fallback for missing RPC
                                window.supabase.from('entries')
                                    .update({ view_count: (data.view_count || 0) + 1 })
                                    .eq('id', data.id);
                            }
                        });
                    } else if (error.code === '23505') { // Unique constraint violation (Postgres code)
                        localStorage.setItem(viewedKey, 'true');
                    }
                });
        }
    } else {
        // Fallback for no Supabase
        // The new footer structure handles initial counts from data, so no specific fallback needed here
        // for the individual count elements if Supabase is not available.
        // The elements will just show their initial '0' or data-provided values.
    }

    // --- Logic ---

    // Helper: Generate Robust URL
    const getShareUrl = () => {
        const mapUrl = new URL('map.html', window.location.href);
        mapUrl.searchParams.set('id', data.id);
        return mapUrl.href;
    };

    // Close Handlers
    const closePopup = () => {
        if (commentChannel) window.supabase.removeChannel(commentChannel);
        // Clean up any other potential channels
        const channels = window.supabase.getChannels();
        channels.forEach(ch => {
            if (ch.name === 'reactions-realtime' || ch.name === 'views-realtime') {
                window.supabase.removeChannel(ch);
            }
        });
        overlay.remove();
    };

    overlay.querySelectorAll('.entry-card__close').forEach(btn => {
        btn.addEventListener('click', closePopup);
    });
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closePopup();
    });

    // Copy Link Handler
    const copyBtn = overlay.querySelector('.btn-copy-link');
    if (copyBtn) {
        copyBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const url = getShareUrl();
            try {
                await navigator.clipboard.writeText(url);
                copyBtn.classList.add('success');
                setTimeout(() => copyBtn.classList.remove('success'), 2000);
            } catch (err) {
                console.error('Failed to copy', err);
            }
        });
    }

    // View Counter (non-interactive, just shows count)
    const viewPill = overlay.querySelector('.view-pill');
    if (viewPill) {
        // Simple expand/collapse on hover to show view count
        const expandCount = () => {
            viewPill.classList.add('expanded');
        };

        const collapseCount = () => {
            viewPill.classList.remove('expanded');
        };

        // Hover events only
        viewPill.addEventListener('mouseenter', expandCount);
        viewPill.addEventListener('mouseleave', collapseCount);
    }



    if (heartBtn) {
        heartBtn.addEventListener('click', async () => {
            if (!window.supabase) return;

            const isLiked = heartBtn.classList.contains('active');

            if (isLiked) {
                // Unlike
                heartBtn.classList.remove('active');
                if (lCountEl) lCountEl.textContent = Math.max(0, parseInt(lCountEl.textContent) - 1);

                await window.supabase.from('reactions')
                    .delete()
                    .eq('entry_id', data.id)
                    .eq('user_id', currentUserId);

                // Atomic Decrement
                window.supabase.rpc('decrement_reaction_count', { row_id: data.id });
            } else {
                // Like (Strict Per-User Unique)
                heartBtn.classList.add('active');

                const payload = {
                    entry_id: data.id,
                    user_id: currentUserId
                };

                // Use insert instead of upsert to benefit from unique constraint error
                window.supabase.from('reactions')
                    .insert(payload)
                    .then(({ error }) => {
                        if (!error) {
                            // Only update UI count and DB counter if this was a truly NEW unique like
                            if (lCountEl) {
                                const current = parseInt(lCountEl.textContent) || 0;
                                lCountEl.textContent = current + 1;
                            }
                            window.supabase.rpc('increment_reaction_count', { row_id: data.id });
                            // Trigger Echo Toast after successful interaction
                            setTimeout(showEchoToast, 1200);
                        } else if (error.code === '23505') {
                            // Already liked, but class was somehow missing (e.g. multi-device)
                            // Keep 'active' but don't increment anything
                            console.log('Admin: User has already reacted to this node.');
                        } else {
                            // Actual error (connection etc)
                            heartBtn.classList.remove('active');
                            console.error('Reaction failed:', error);
                        }
                    });
            }
        });
    }

    // Comment logic
    const commentBtn = overlay.querySelector('.comment-btn');
    const entryCard = overlay.querySelector('.entry-card');
    const sideComments = overlay.querySelector(`#sideComments-${data.id}`);
    const closeComments = overlay.querySelector(`#closeComments-${data.id}`);
    const commentList = overlay.querySelector(`#commentList-${data.id}`);
    const commentInput = overlay.querySelector(`#commentInput-${data.id}`);
    const commentSubmit = overlay.querySelector(`#commentSubmit-${data.id}`);

    const isMobile = () => window.innerWidth <= 900;

    const openComments = () => {
        if (!sideComments || sideComments.classList.contains('active')) return;

        // Setup initial state for animation
        sideComments.style.display = 'flex';
        sideComments.classList.add('active');
        sideComments.classList.remove('closing');
        loadComments(data.id, commentList);

        if (window.gsap) {
            if (isMobile()) {
                // Mobile: Slide over from right
                gsap.fromTo(sideComments,
                    { left: "100%", opacity: 1 },
                    { left: "0%", opacity: 1, duration: 0.6, ease: "power2.inOut" }
                );
            } else {
                // Desktop: Slide from behind
                gsap.fromTo(sideComments,
                    { opacity: 0, marginLeft: -300 },
                    { opacity: 1, marginLeft: 0, duration: 0.7, ease: "back.out(1.2)" }
                );
            }
        }
    };

    const hideComments = () => {
        if (!sideComments || !sideComments.classList.contains('active')) return;

        sideComments.classList.remove('active');
        sideComments.classList.add('closing');

        if (window.gsap) {
            if (isMobile()) {
                gsap.to(sideComments, {
                    left: "100%",
                    duration: 0.5,
                    ease: "power2.inOut",
                    onComplete: () => {
                        sideComments.style.display = 'none';
                        entryCard.classList.remove('card-hidden-mobile');
                    }
                });
            } else {
                gsap.to(sideComments, {
                    opacity: 0,
                    marginLeft: -300,
                    duration: 0.5,
                    ease: "power2.in",
                    onComplete: () => {
                        sideComments.style.display = 'none';
                    }
                });
            }
        } else {
            // Fallback for no GSAP
            sideComments.style.display = 'none';
            entryCard.classList.remove('card-hidden-mobile');
        }

        // Trigger Echo Toast after closing meaningful content
        setTimeout(showEchoToast, 1000);
    };

    if (commentBtn) {
        commentBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!sideComments.classList.contains('active')) {
                openComments();
            } else {
                hideComments();
            }
        });
    }

    if (closeComments) {
        closeComments.addEventListener('click', (e) => {
            e.stopPropagation();
            hideComments();
        });
    }

    if (commentSubmit) {
        commentSubmit.addEventListener('click', async () => {
            const text = commentInput.value.trim();
            if (!text || !window.supabase) return;

            // 1. Profanity Check
            if (ProfanityGuard.isToxic(text)) {
                showAlert("Community Standards", 'keep the conversation kind.');
                return;
            }

            // 2. Ban Check
            const { data: banData } = await window.supabase.from('banned_users').select('user_id').eq('user_id', currentUserId);
            if (banData && banData.length > 0) {
                showAlert("Moderation", 'your voice has been silenced.');
                return;
            }

            commentInput.value = '';
            commentInput.disabled = true;

            const { error } = await window.supabase
                .from('comments')
                .insert({
                    entry_id: data.id,
                    user_id: currentUserId,
                    comment_text: text
                });

            if (!error) {
                // Atomic Increment
                window.supabase.rpc('increment_comment_count', { row_id: data.id });
                // 1. Refresh list immediately for the current user
                loadComments(data.id, commentList);
                // 2. Manual immediate badge update
                if (cCountEl) {
                    const currentCount = parseInt(cCountEl.textContent) || 0;
                    cCountEl.textContent = currentCount + 1;
                }
            }
            commentInput.disabled = false;
        });

        commentInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') commentSubmit.click();
        });
    }

    // Real-time comments & reactions listener
    let reactionChannel = null;
    if (window.supabase) {
        // Comments listener
        commentChannel = window.supabase
            .channel(`comments-${data.id}`)
            .on('postgres_changes', {
                event: '*', // Listen for ALL events (INSERT, DELETE, etc.)
                schema: 'public',
                table: 'comments',
                filter: `entry_id=eq.${data.id}`
            }, (payload) => {
                // Refresh list if visible
                if (sideComments && sideComments.style.display !== 'none') {
                    loadComments(data.id, commentList);
                }
                // Always update the footer count badge
                window.supabase.from('comments')
                    .select('*', { count: 'exact', head: true })
                    .eq('entry_id', data.id)
                    .then(({ count }) => {
                        if (cCountEl) cCountEl.textContent = count || 0;
                    });
            })
            .subscribe();

        // Reactions listener
        reactionChannel = window.supabase
            .channel(`reactions-${data.id}`)
            .on('postgres_changes', {
                event: '*', // Sync inserts and deletes
                schema: 'public',
                table: 'reactions',
                filter: `entry_id=eq.${data.id}`
            }, () => {
                // Refresh total count
                window.supabase.from('reactions')
                    .select('*', { count: 'exact', head: true })
                    .eq('entry_id', data.id)
                    .then(({ count }) => {
                        if (lCountEl) lCountEl.textContent = count || 0;
                    });
            })
            .subscribe();
    }

    // Social Share Handler (Optimized with Promise Caching)
    const shareBtn = overlay.querySelector('.btn-social-share');
    let shareFilePromise = null;

    async function ensureShareFile() {
        if (shareFilePromise) return shareFilePromise;

        shareFilePromise = (async () => {
            try {
                const blob = await generateEntryImage(data);
                return new File([blob], 'sonder-memory.png', { type: 'image/png' });
            } catch (err) {
                console.error('Generation failed:', err);
                shareFilePromise = null; // Allow retry if it failed
                return null;
            }
        })();

        return shareFilePromise;
    }

    // Report Handler
    const reportBtn = overlay.querySelector('.btn-report-entry');
    if (reportBtn) {
        reportBtn.addEventListener('click', (e) => {
            e.stopPropagation();

            // Use custom modal instead of prompt
            const modal = document.getElementById('reportModal');
            const submitBtn = document.getElementById('reportSubmitBtn');
            const closeBtn = document.getElementById('reportModalClose');
            const input = document.getElementById('reportReasonInput');

            if (modal && submitBtn && input) {
                // Clear previous input
                input.value = '';
                modal.hidden = false;

                // Handle close
                const closemodal = () => {
                    modal.hidden = true;
                    // Remove listeners to avoid accumulation
                    submitBtn.onclick = null;
                    if (closeBtn) closeBtn.onclick = null;
                };

                if (closeBtn) closeBtn.onclick = closemodal;
                modal.onclick = (ev) => { if (ev.target === modal) closemodal(); };

                // Handle submit
                submitBtn.onclick = () => {
                    const reason = input.value.trim();
                    if (!reason) {
                        showAlert("Validation", 'Please provide a reason.');
                        return;
                    }

                    if (window.supabase) {
                        window.supabase.from('reports').insert({
                            entry_id: data.id,
                            reason: reason,
                            timestamp: new Date().toISOString()
                        }).then(({ error }) => {
                            if (error) {
                                showAlert("Error", 'Could not send report. Please try again.');
                                console.error('Report error:', error);
                            } else {
                                showAlert("Report Received", 'Thank you. We will review this memory shortly.');
                                closemodal();
                            }
                        });
                    } else {
                        showAlert("Offline", 'Report function unavailable offline.');
                    }
                };
            }
            else {
                // Fallback to custom prompt if modal missing
                showPrompt("Report Memory", "Is something wrong with this memory? Please briefly explain:", "describe the issue...").then(reason => {
                    if (reason) {
                        if (window.supabase) {
                            window.supabase.from('reports').insert({
                                entry_id: data.id,
                                reason: reason,
                                timestamp: new Date().toISOString()
                            }).then(({ error }) => {
                                if (error) {
                                    showAlert("Error", 'Could not send report. Please try again.');
                                } else {
                                    showAlert("Report Received", 'Thank you. We will review this memory shortly.');
                                }
                            });
                        } else {
                            showAlert("Offline", 'Report function unavailable offline.');
                        }
                    }
                });
            }
        });
    }
    if (shareBtn) {
        // Pre-generate on hover to avoid gesture timeout
        shareBtn.addEventListener('mouseenter', () => {
            ensureShareFile();
        });

        shareBtn.addEventListener('click', async (e) => {
            e.stopPropagation();

            // If already sharing, ignore
            if (shareBtn.classList.contains('pulse-loading')) return;

            shareBtn.classList.add('pulse-loading');
            const url = getShareUrl();

            try {
                // 1. Get the pre-generated file or generate now (if hover was too short)
                const file = await ensureShareFile();
                if (!file) throw new Error('Could not generate share image');

                // 2. Auto-Copy Link
                try {
                    await navigator.clipboard.writeText(url);
                } catch (clipboardErr) {
                    console.warn('Auto-copy failed', clipboardErr);
                }

                // 3. Share
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: 'A memory from Sonder',
                        text: 'I found this memory on Sonder. Explore the map to see more.',
                        url: url
                    });

                    shareBtn.classList.add('success');
                    const toast = document.createElement('div');
                    toast.className = 'status-message';
                    toast.textContent = 'link copied to clipboard (use sticker!)';
                    document.body.appendChild(toast);
                    setTimeout(() => toast.remove(), 4000);
                    setTimeout(() => shareBtn.classList.remove('success'), 2000);
                } else {
                    // Fallback: Download
                    const a = document.createElement('a');
                    const blobUrl = URL.createObjectURL(file);
                    a.href = blobUrl;
                    a.download = 'sonder-memory.png';
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

                    shareBtn.classList.add('success');
                    const toast = document.createElement('div');
                    toast.className = 'status-message';
                    toast.textContent = 'image saved. link copied.';
                    document.body.appendChild(toast);
                    setTimeout(() => toast.remove(), 4000);
                    setTimeout(() => shareBtn.classList.remove('success'), 2000);
                }
            } catch (err) {
                console.error('Share failed:', err);
                shareBtn.classList.add('error');
                setTimeout(() => shareBtn.classList.remove('error'), 2000);
            } finally {
                shareBtn.classList.remove('pulse-loading');
            }
        });
    }
};

async function loadComments(entryId, container) {
    if (!window.supabase) return;

    container.innerHTML = '<div style="opacity: 0.5; font-size: 0.8rem; text-align: center;">loading...</div>';

    const { data: comments, error } = await window.supabase
        .from('comments')
        .select('id, comment_text, timestamp, user_id, entry_id')
        .eq('entry_id', entryId)
        .order('timestamp', { ascending: true });

    if (error) {
        console.error(error);
        container.innerHTML = '<div style="opacity: 0.5; font-size: 0.8rem; text-align: center;">error loading comments</div>';
        return;
    }

    if (!comments || comments.length === 0) {
        container.innerHTML = '<div style="opacity: 0.5; font-size: 0.8rem; text-align: center;">no comments yet. be the first?</div>';
        return;
    }

    const currentUserId = getUserId();
    
    try {
        container.innerHTML = comments.map(c => {
            const isOwn = c.user_id === currentUserId;
            const text = c.comment_text || '';
            
            let timestamp = 'Just now';
            if (c.timestamp) {
                try {
                    const date = new Date(c.timestamp);
                    if (!isNaN(date.getTime())) {
                        timestamp = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    }
                } catch (e) {
                    console.warn("Invalid timestamp:", c.timestamp);
                }
            }
            
            return `
            <div class="comment-item" id="comment-${escapeHtml(c.id)}" style="background: rgba(125,125,125,0.05); border: 1px solid var(--color-card-border); border-radius: 12px; padding: 12px; margin-bottom: 8px; animation: comment-fade-in 0.3s ease-out; position: relative;">
                <div style="font-size: 0.85rem; line-height: 1.4; color: var(--color-card-text); padding-right: 20px;">
                    ${escapeHtml(text)}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
                    <div style="font-size: 0.7rem; color: var(--color-card-muted);">
                        ${escapeHtml(timestamp)}
                    </div>
                    ${isOwn ? `
                    <button class="comment-delete-btn" data-comment-id="${escapeHtml(c.id)}" title="Delete comment" style="background: none; border: none; color: var(--color-card-muted); cursor: pointer; padding: 4px; font-size: 0.8rem; transition: color 0.2s; opacity: 0.6;">
                        ✕
                    </button>
                    ` : ''}
                </div>
            </div>
            `;
        }).join('');
    } catch (renderError) {
        console.error("Comment Render Error:", renderError);
        container.innerHTML = '<div style="opacity: 0.5; font-size: 0.8rem; text-align: center;">error rendering comments</div>';
    }

    // Add Deletion Event Listeners
    container.querySelectorAll('.comment-delete-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => btn.style.color = '#ff4d4d');
        btn.addEventListener('mouseleave', () => btn.style.color = 'var(--color-card-muted)');
        btn.addEventListener('click', async () => {
            const commentId = btn.getAttribute('data-comment-id');
            const commentEl = document.getElementById(`comment-${commentId}`);

            const confirmed = await showConfirm('Delete Comment?', 'This action cannot be undone. Are you sure you want to remove this memory?');

            if (confirmed) {
                // Optimistic UI: Hide immediately
                if (commentEl) {
                    commentEl.style.opacity = '0.3';
                    commentEl.style.pointerEvents = 'none';
                }

                const { error } = await window.supabase
                    .from('comments')
                    .delete()
                    .eq('id', commentId)
                    .eq('user_id', currentUserId);

                if (!error) {
                    // Atomic Decrement
                    window.supabase.rpc('decrement_comment_count', { row_id: entryId });
                }

                if (error) {
                    console.error('Delete failed:', error);
                    // Revert optimism
                    if (commentEl) {
                        commentEl.style.opacity = '1';
                        commentEl.style.pointerEvents = 'auto';
                    }
                    const toast = document.createElement('div');
                    toast.className = 'status-message';
                    toast.style.background = 'rgba(255, 77, 77, 0.2)';
                    toast.textContent = 'failed to delete comment';
                    document.body.appendChild(toast);
                    setTimeout(() => toast.remove(), 3000);
                } else {
                    // Success! Remove from DOM
                    if (commentEl) commentEl.remove();

                    // Manual immediate badge update
                    const cCountEl = document.getElementById(`commentCount-btn-${entryId}`);
                    if (cCountEl) {
                        const currentCount = parseInt(cCountEl.textContent) || 0;
                        cCountEl.textContent = Math.max(0, currentCount - 1);
                    }

                    // Check if list is now empty
                    if (container.children.length === 0) {
                        container.innerHTML = '<div style="opacity: 0.5; font-size: 0.8rem; text-align: center;">no comments yet. be the first?</div>';
                    }
                }
            }
        });
    });

    // Auto-scroll to bottom
    container.scrollTop = container.scrollHeight;
}

/* --- Admin & Secret Logic --- */
function initAdminLogin() {
    const logo = document.querySelector('.site-header__logo');
    const modal = document.getElementById('adminLoginModal');
    const loginBtn = document.getElementById('adminLoginBtn');
    const closeBtn = document.getElementById('adminLoginClose');
    const emailInput = document.getElementById('adminEmail');
    const passInput = document.getElementById('adminPassword');

    if (!logo || !modal) return;

    let clickCount = 0;
    let clickTimer = null;

    logo.addEventListener('click', () => {
        // Trigger only on landing page as requested
        if (document.documentElement.getAttribute('data-page') !== 'landing') return;

        clickCount++;
        clearTimeout(clickTimer);

        if (clickCount >= 5) {
            modal.hidden = false;
            logo.style.transform = 'scale(1.1)';
            setTimeout(() => logo.style.transform = '', 200);
            clickCount = 0;
        }

        clickTimer = setTimeout(() => {
            clickCount = 0;
        }, 1000);
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.hidden = true;
        });
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = emailInput.value.trim();
            const password = passInput.value;

            if (!email || !password) {
                showAlert("Missing Credentials", 'Please enter credentials.');
                return;
            }

            loginBtn.textContent = 'Verifying...';
            loginBtn.disabled = true;

            const { data, error } = await window.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                showAlert("Access Denied", 'Access Denied: ' + error.message);
                loginBtn.textContent = 'Enter the Void';
                loginBtn.disabled = false;
            } else {
                window.location.href = 'admin.html';
            }
        });
    }
}

/* --- Echo Toast (Contextual Feedback) --- */
let echoToastActive = false;

function showEchoToast(force = false) {
    if (force) {
        sessionStorage.removeItem('sonder-echo-shown');
        echoToastActive = false;
    }

    // Only show once per session to respect the user
    if (!force && (sessionStorage.getItem('sonder-echo-shown') || echoToastActive)) return;

    // Create the toast element if it doesn't exist
    let toast = document.getElementById('echoToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'echoToast';
        toast.className = 'echo-toast';
        document.body.appendChild(toast);
    }

    const renderStep1 = () => {
        toast.innerHTML = `
            <div class="echo-toast__content" id="echoStep1">
                <div class="echo-toast__text">
                    before you go — was this space okay for you?
                    <div class="echo-toast__subtext">you don’t have to answer. we’ll still be here.</div>
                </div>
                <div class="echo-toast__actions">
                    <button class="echo-toast__btn echo-toast__btn--primary" data-resp="yes">yes</button>
                    <button class="echo-toast__btn" data-resp="no">no</button>
                    <button class="echo-toast__btn echo-toast__btn--link" data-resp="skip">skip</button>
                </div>
            </div>
        `;

        toast.querySelectorAll('.echo-toast__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const resp = btn.dataset.resp;
                if (resp === 'skip') {
                    hideEchoToast();
                } else {
                    // Record purely the sentiment
                    window.supabase.from('site_feedback').insert([{
                        user_id: getUserId(),
                        category: 'reflection',
                        message: `Helpful: ${resp}`,
                        timestamp: new Date().toISOString()
                    }]);
                    renderStep2(resp);
                }
            });
        });
    };

    const renderStep3 = () => {
        toast.innerHTML = `
            <div class="echo-toast__content" id="echoStep3" style="text-align: center; padding: 1.5rem 0; opacity: 0;">
                <div class="echo-toast__text" style="margin-bottom: 0.5rem; font-size: 1.1rem;">
                    thank you for your vision.
                </div>
                <div class="echo-toast__subtext" style="opacity: 1; font-size: 0.8rem;">
                    the overseer has received your echo.
                </div>
            </div>
        `;

        if (window.gsap) {
            gsap.fromTo('#echoStep3', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" });
        } else {
            const s3 = document.getElementById('echoStep3');
            if (s3) { s3.style.opacity = '1'; }
        }

        // Auto-hide after a generous moment of gratitude
        setTimeout(hideEchoToast, 6000);
    };

    const renderStep2 = (sentiment) => {
        const step1 = document.getElementById('echoStep1');
        const questionText = sentiment === 'yes'
            ? 'what would you like to see in the future of sonder?'
            : 'what was wrong / how can we make it better for you?';

        const attachStep2Listeners = () => {
            const skipBtn = document.getElementById('echoSkipVision');
            if (skipBtn) skipBtn.onclick = hideEchoToast;

            const transmitBtn = document.getElementById('echoTransmitBtn');
            const input = document.getElementById('echoVisionInput');

            if (transmitBtn && input) {
                transmitBtn.onclick = async () => {
                    const val = input.value.trim();
                    if (val) {
                        transmitBtn.textContent = '...';
                        transmitBtn.disabled = true;

                        const { error } = await window.supabase.from('site_feedback').insert([{
                            user_id: getUserId(),
                            category: 'vision',
                            message: `[${sentiment}] ${val}`,
                            timestamp: new Date().toISOString()
                        }]);

                        if (!error) {
                            // Smooth Transition to Step 3
                            const s2 = document.getElementById('echoStep2');
                            if (window.gsap && s2) {
                                gsap.to(s2, { opacity: 0, x: -20, duration: 0.4, onComplete: renderStep3 });
                            } else {
                                renderStep3();
                            }
                        } else {
                            console.error('Vision transmission failed Details:', {
                                message: error.message, code: error.code
                            });
                            hideEchoToast();
                        }
                    } else {
                        hideEchoToast();
                    }
                };
            }
        };

        const step2Html = `
            <div class="echo-toast__content" id="echoStep2">
                <div class="echo-toast__text">
                    ${questionText}
                </div>
                <textarea id="echoVisionInput" class="echo-toast__textarea" placeholder="share your vision..."></textarea>
                <div class="echo-toast__actions">
                    <button class="echo-toast__btn echo-toast__btn--primary" id="echoTransmitBtn">transmit</button>
                    <button class="echo-toast__btn echo-toast__btn--link" id="echoSkipVision">no, just leaving</button>
                </div>
            </div>
        `;

        // Transition Slide Step 1 -> Step 2
        if (window.gsap && step1) {
            gsap.to(step1, {
                opacity: 0, x: -20, duration: 0.3, onComplete: () => {
                    toast.innerHTML = step2Html;
                    const s2 = document.getElementById('echoStep2');
                    s2.style.opacity = '0';
                    s2.style.transform = 'translateX(20px)';
                    gsap.to(s2, { opacity: 1, x: 0, duration: 0.5 });
                    attachStep2Listeners();
                }
            });
        } else {
            toast.innerHTML = step2Html;
            attachStep2Listeners();
        }
    };

    renderStep1();
    echoToastActive = true;
    toast.classList.add('active');

    console.log('Displaying Echo Toast');

    // GSAP: Slow, subtle upward drift + fade
    if (window.gsap) {
        console.log('GSAP detected, animating...');
        gsap.fromTo(toast,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 1.5, ease: "power2.out" }
        );
    } else {
        console.log('GSAP missing, using fallback styles');
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }

    sessionStorage.setItem('sonder-echo-shown', 'true');
}

function hideEchoToast() {
    console.log('Hiding Echo Toast...');
    const toast = document.getElementById('echoToast');
    if (!toast) return;

    if (window.gsap) {
        gsap.to(toast, {
            opacity: 0,
            y: 10,
            duration: 1,
            ease: "power2.in",
            onComplete: () => {
                toast.classList.remove('active');
                toast.style.visibility = 'hidden';
                toast.style.pointerEvents = 'none';
                echoToastActive = false;
                console.log('Echo Toast Hidden (GSAP)');
            }
        });
    } else {
        toast.classList.remove('active');
        toast.style.visibility = 'hidden';
        toast.style.pointerEvents = 'none';
        toast.style.opacity = '0';
        echoToastActive = false;
        console.log('Echo Toast Hidden (Fallback)');
    }
}
// Support Soft-Exit (Mouseleave)
document.addEventListener('mouseleave', (e) => {
    // Only trigger if exiting the window from the top (user going for tabs/close)
    if (e.clientY < 0) {
        showEchoToast();
    }
});
