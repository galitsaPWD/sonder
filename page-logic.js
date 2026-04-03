/* SONDER - Page Logic (Restored from Backup) */

/* --- Helpers --- */
window.escapeHtml = window.escapeHtml || function (text) {
    if (text === null || text === undefined) return '';
    const str = text.toString();
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return str.replace(/[&<>"']/g, m => map[m]);
};

window.getColorCode = window.getColorCode || function (name) {
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
};

/* --- Archive Logic --- */
function initArchive() {
    if (window.archiveInitialized) return;
    window.archiveInitialized = true;

    const grid = document.getElementById('archiveGrid');
    const emptyState = document.getElementById('archiveEmpty'); // Helper if needed
    const toggleBtn = document.getElementById('archiveLayoutToggle');
    if (!grid) return;

    // --- Layout Toggle Logic ---
    const MASONRY_CLASS = 'archive-grid--masonry';
    const GRID_ICON = '⊞';
    const MASONRY_ICON = '⑃';

    // Load saved preference
    const savedLayout = localStorage.getItem('sonder-archive-layout');
    if (savedLayout === 'masonry') {
        grid.classList.add(MASONRY_CLASS);
        if (toggleBtn) {
            toggleBtn.textContent = MASONRY_ICON;
            toggleBtn.title = "Switch to Grid View";
        }
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const isMasonry = grid.classList.toggle(MASONRY_CLASS);
            localStorage.setItem('sonder-archive-layout', isMasonry ? 'masonry' : 'grid');
            
            // Visual Feedback
            toggleBtn.textContent = isMasonry ? MASONRY_ICON : GRID_ICON;
            toggleBtn.title = isMasonry ? "Switch to Grid View" : "Switch to Masonry View";
            
            // Optional: Trigger a reflow/re-render if needed, but CSS transition usually handles it
        });
    }

    const sortBtn = document.getElementById('archiveSortBtn');

    const render = (docs) => {
        grid.innerHTML = '';
        if (docs.length === 0) {
            grid.innerHTML = '';
            // Restore empty state from backup style
            if (emptyState) emptyState.hidden = false;
            // grid.innerHTML = '<p class="section__text">No entries found.</p>'; // Or use empty state
            return;
        }

        // Hide empty state if we have docs
        if (emptyState) emptyState.hidden = true;

        const seenIds = new Set();
        docs.forEach((data, index) => {
            try {
                if (!data || seenIds.has(data.id)) return;
                seenIds.add(data.id);

                const lat = typeof data.lat === 'number' ? data.lat : parseFloat(data.lat || 0);
                const lng = typeof data.lng === 'number' ? data.lng : parseFloat(data.lng || 0);
                const text = data.text || '';

                const el = document.createElement('div');
                el.className = 'archive-entry-card';
                el.style.animationDelay = `${Math.min(index, 20) * 0.03}s`;

                el.innerHTML = `
                    <div class="archive-entry-card__location">${lat.toFixed(4)}N, ${lng.toFixed(4)}E</div>
                    <div class="archive-entry-card__text">${escapeHtml(text)}</div>
                    
                    <div class="archive-entry-card__meta">
                        <div class="archive-entry-card__timestamp">${data.timestamp ? new Date(data.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</div>
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                            ${data.image ? '<span style="font-size: 0.7rem; padding: 0.2rem 0.5rem; background: var(--color-bg-alt); border-radius: 6px; color: var(--color-muted); font-weight: 500; letter-spacing: 0.05em;" title="Has image">IMG</span>' : ''}
                            ${data.song ? `
                                <a href="${data.song}" target="_blank" class="song-pill" onclick="event.stopPropagation();">
                                    ${data.thumbnail ? `<img src="${data.thumbnail}" loading="lazy">` : '<span>🎵</span>'}
                                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;">
                                        ${escapeHtml(data.song_title || 'Linked Song')}
                                    </span>
                                </a>
                            ` : ''}
                        </div>
                    </div>
                `;

                el.style.cursor = 'pointer';
                el.addEventListener('click', () => {
                    localStorage.setItem('sonder-nav-lat', lat);
                    localStorage.setItem('sonder-nav-lng', lng);
                    window.location.href = 'map.html';
                });

                grid.appendChild(el);
            } catch (err) {
                console.error("Error rendering archive card:", err);
            }
        });
    };

    let allDocs = [];

    const loadData = async () => {
        // Wait for Supabase client instance to be fully ready
        let retryCount = 0;
        while ((!window.supabase || typeof window.supabase.from !== 'function') && retryCount < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retryCount++;
        }

        if (window.supabase && typeof window.supabase.from === 'function') {
            const { data: bannedData } = await window.supabase.from('banned_users').select('user_id');
            const bannedIds = new Set(bannedData?.map(b => b.user_id) || []);

            window.supabase.from('entries').select('id, lat, lng, text, timestamp, color, user_id, image, song, song_title, thumbnail').order('timestamp', { ascending: false }).limit(60).then(({ data: docs, error }) => {
                if (error) throw error;

                // Filter banned users
                const filteredDocs = (docs || []).filter(doc => !bannedIds.has(doc.user_id));

                console.log(`Archive: Loaded ${filteredDocs.length} public entries.`);
                if (filteredDocs.length === 0) {
                    render([]);
                    return;
                }
                allDocs = filteredDocs;
                render(allDocs);
            }).catch(err => {
                console.error("Archive Error:", err);
                grid.innerHTML = '<p>Error loading archive.</p>';
            });
        }
    };

    loadData();

    if (sortBtn) {
        sortBtn.addEventListener('click', () => {
            const currentSort = sortBtn.getAttribute('data-sort') || 'newest';
            const nextSort = currentSort === 'newest' ? 'oldest' : 'newest';
            
            sortBtn.setAttribute('data-sort', nextSort);
            sortBtn.title = nextSort === 'newest' ? "Sort: Newest First" : "Sort: Oldest First";
            
            let sorted = [...allDocs];
            if (nextSort === 'newest') {
                sorted.sort((a, b) => {
                    const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                    const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                    return tB - tA;
                });
            } else if (nextSort === 'oldest') {
                sorted.sort((a, b) => {
                    const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                    const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                    return tA - tB;
                });
            }
            render(sorted);
        });
    }
}

/* --- Playlist Logic --- */
function initPlaylist() {
    if (window.playlistInitialized) return;
    window.playlistInitialized = true;

    const list = document.getElementById('playlistList');
    const emptyState = document.getElementById('playlistEmpty');

    if (!list) return;
    const loadPlaylist = async () => {
        // Wait for Supabase client instance to be fully ready
        let retryCount = 0;
        while ((!window.supabase || typeof window.supabase.from !== 'function') && retryCount < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retryCount++;
        }

        if (window.supabase && typeof window.supabase.from === 'function') {
            window.supabase.from('entries').select('id, song, song_title, artist, thumbnail').order('timestamp', { ascending: false }).limit(100).then(({ data: entries, error }) => {
                if (error) throw error;
                // Clear existing content
                list.innerHTML = '';

                let songsFound = 0;
                const seenIds = new Set();

                if (entries && entries.length > 0) {
                    entries.forEach((data, index) => {
                        if (!data.song || seenIds.has(data.id)) return;
                        seenIds.add(data.id);

                        songsFound++;

                        const el = document.createElement('a');
                        el.href = data.song;
                        el.target = "_blank";
                        el.className = 'track-row';
                        // Stagger animation
                        el.style.animationDelay = `${Math.min(index, 20) * 0.05}s`;

                        el.innerHTML = `
                            <div class="track-icon">
                                ${data.thumbnail ? `<img src="${data.thumbnail}" alt="Track thumbnail" style="width:100%; height:100%; object-fit:cover;">` : '<span>▶</span>'}
                            </div>
                            <div class="track-info">
                                <div class="track-meta">
                                    ${data.song_title ? `<span class="track-message">${escapeHtml(data.song_title)}</span>` : 'Unknown Track'}
                                    ${data.artist ? `<span class="track-artist">• ${escapeHtml(data.artist)}</span>` : ''}
                                </div>
                            </div>
                            <div class="track-action">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                            </div>
                        `;
                        list.appendChild(el);
                    });
                }

                if (songsFound === 0) {
                    if (emptyState) emptyState.hidden = false;
                } else {
                    if (emptyState) emptyState.hidden = true;
                }

            }).catch(err => {
                console.error('Error loading playlist:', err);
                list.innerHTML = '<p>Error loading playlist.</p>';
            });
        }
    };

    loadPlaylist();
}

/* --- My Entries Logic --- */
function initMyEntries() {
    if (window.myEntriesInitialized) return;
    window.myEntriesInitialized = true;

    const grid = document.getElementById('myEntriesGrid');
    const emptyState = document.getElementById('emptyState') || document.getElementById('myEntriesEmpty');
    const totalEntriesEl = document.getElementById('totalEntries');
    const totalCountriesEl = document.getElementById('totalCountries');
    const totalSongsEl = document.getElementById('totalSongs');
    const clearAllBtn = document.getElementById('clearAllBtn');

    // Sync Code Elements
    const syncCodeDisplay = document.getElementById('syncCodeDisplay');
    const copySyncCodeBtn = document.getElementById('copySyncCodeBtn');
    const syncCodeInput = document.getElementById('syncCodeInput');
    const applySyncCodeBtn = document.getElementById('applySyncCodeBtn');
    const syncSettingsBtn = document.getElementById('syncSettingsBtn');
    const syncModal = document.getElementById('syncModal');
    const syncModalClose = document.getElementById('syncModalClose');

    if (!grid) return;

    const currentUserId = getUserId();

    // Helper: Custom Confirmation Modal
    const showConfirmation = (title, message, onConfirm) => {
        // Try to find custom modal, else use native verify
        const modal = document.getElementById('confirmationModal');
        if (!modal) {
            if (confirm(title + "\n" + message)) onConfirm();
            return;
        }

        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;

        const okBtn = document.getElementById('confirmOkBtn');
        const cancelBtn = document.getElementById('confirmCancelBtn');

        // Clean listeners to prevent stacking
        const newOk = okBtn.cloneNode(true);
        const newCancel = cancelBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOk, okBtn);
        cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

        newOk.addEventListener('click', () => {
            onConfirm();
            modal.hidden = true;
        });

        newCancel.addEventListener('click', () => {
            modal.hidden = true;
        });

        modal.onclick = (e) => {
            if (e.target === modal) modal.hidden = true;
        };

        modal.hidden = false;
    };

    // --- Sync Logic ---
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
                showAlert('Copy Failed', 'Failed to copy code. Please copy manually: ' + currentUserId);
            });
        });
    }

    // Apply sync code
    if (applySyncCodeBtn && syncCodeInput) {
        applySyncCodeBtn.addEventListener('click', () => {
            const newSyncCode = syncCodeInput.value.trim();
            if (!newSyncCode) {
                showAlert('Validation', 'Please enter a sync code');
                return;
            }
            if (newSyncCode === currentUserId) {
                showAlert('Redundant Sync', 'This is already your current sync code');
                return;
            }
            showConfirm('Sync Code Switch', 'This will replace your current sync code. Your entries will be synced with the other device. Continue?').then(confirmed => {
                if (confirmed) {
                    localStorage.setItem('sonder-user-id', newSyncCode);
                    window.location.reload();
                }
            });
        });
    }

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
        syncModal.addEventListener('click', (e) => {
            if (e.target === syncModal) {
                syncModal.hidden = true;
            }
        });
    }


    // --- Fetch Logic ---
    const loadMyEntries = async () => {
        // Wait for Supabase client instance to be fully ready
        let retryCount = 0;
        while ((!window.supabase || typeof window.supabase.from !== 'function') && retryCount < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retryCount++;
        }

        if (window.supabase && typeof window.supabase.from === 'function') {
            window.supabase.from('entries')
                .select('id, lat, lng, text, color, timestamp, reactions_enabled, comments_enabled, view_count, reaction_count, comment_count, thumbnail, image, song, song_title, artist')
                .eq('user_id', currentUserId)
                .then(({ data: entries, error }) => {
                    if (error) throw error;
                    const entryIds = new Set();
                    const myEntryIds = JSON.parse(localStorage.getItem('sonder-my-entries') || '[]');

                    entries.forEach(entry => {
                        entryIds.add(entry.id);

                        if (!myEntryIds.includes(entry.id)) {
                            myEntryIds.push(entry.id);
                        }
                    });

                    localStorage.setItem('sonder-my-entries', JSON.stringify(myEntryIds));

                    if (entries.length === 0) {
                        if (grid) grid.style.display = 'none';
                        if (emptyState) emptyState.hidden = false;
                        return;
                    }

                    if (emptyState) emptyState.hidden = true;
                    if (grid) grid.style.display = 'grid';

                    // Sort by timestamp (newest first)
                    entries.sort((a, b) => {
                        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                        return timeB - timeA;
                    });

                    // Calculate stats
                    const totalSongs = entries.filter(e => e.song).length;
                    const locations = new Set(entries.map(e => `${e.lat.toFixed(2)},${e.lng.toFixed(2)}`));

                    if (totalEntriesEl) totalEntriesEl.textContent = entries.length;
                    if (totalCountriesEl) totalCountriesEl.textContent = locations.size;
                    if (totalSongsEl) totalSongsEl.textContent = totalSongs;

                    // Render entries
                    grid.innerHTML = '';
                    const seenIds = new Set();
                    entries.forEach((entry, index) => {
                        if (seenIds.has(entry.id)) return;
                        seenIds.add(entry.id);

                        const card = document.createElement('div');
                        card.className = 'my-entry-card';
                        card.style.animationDelay = `${Math.min(index, 20) * 0.05}s`;

                        const colorCode = getColorCode(entry.color);
                        const dateStr = entry.timestamp ? new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Just now';

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
                        <div class="my-entry-card__footer">
                            <div class="my-entry-card__views" title="Total Views">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                <span class="view-count" id="myViewCount-${entry.id}">0</span>
                            </div>
                            ${entry.song ? `
                                <a href="${entry.song}" target="_blank" class="song-pill" onclick="event.stopPropagation();">
                                    ${entry.thumbnail ? `<img src="${entry.thumbnail}" alt="Track thumbnail" loading="lazy">` : '<span>🎵</span>'}
                                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;">
                                        ${escapeHtml(entry.song_title || 'Linked Song')}
                                    </span>
                                </a>
                            ` : ''}
                        </div>
                        <div class="my-entry-card__actions">
                            <button class="my-entry-card__action-btn my-entry-card__action-btn--view">view on map</button>
                            <button class="my-entry-card__action-btn my-entry-card__action-btn--delete" data-entry-id="${entry.id}">delete</button>
                        </div>
                    `;

                        // Fetch initial view count
                        if (window.supabase) {
                            window.supabase.from('views')
                                .select('*', { count: 'exact', head: true })
                                .eq('entry_id', entry.id)
                                .then(({ count }) => {
                                    const vcount = document.getElementById(`myViewCount-${entry.id}`);
                                    if (vcount) vcount.textContent = count || 0;
                                });
                        }

                        // View Handler
                        const viewBtn = card.querySelector('.my-entry-card__action-btn--view');
                        if (viewBtn) {
                            viewBtn.addEventListener('click', (e) => {
                                e.stopPropagation();
                                localStorage.setItem('sonder-nav-lat', entry.lat);
                                localStorage.setItem('sonder-nav-lng', entry.lng);
                                window.location.href = 'map.html';
                            });
                        }

                        // Delete Handler
                        const deleteBtn = card.querySelector('.my-entry-card__action-btn--delete');
                        deleteBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            showConfirmation('delete entry?', 'are you sure you want to delete this entry? this cannot be undone.', () => {
                                deleteEntry(entry.id);
                            });
                        });

                        grid.appendChild(card);
                    });

                    // Set up real-time listener for views on MY entries
                    if (window.supabase) {
                        window.supabase.channel('my-views-realtime')
                            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'views' }, payload => {
                                const entryId = payload.new.entry_id;
                                const vcount = document.getElementById(`myViewCount-${entryId}`);
                                if (vcount) {
                                    // Robust count update
                                    window.supabase.from('views')
                                        .select('*', { count: 'exact', head: true })
                                        .eq('entry_id', entryId)
                                        .then(({ count }) => {
                                            if (vcount) vcount.textContent = count || 0;
                                        });
                                }
                            })
                            .subscribe();
                    }
                })
                .catch(err => {
                    console.error('Error loading my entries:', err);
                    grid.innerHTML = '<p class="section__text">Error loading your entries.</p>';
                });
        }
    };

    loadMyEntries();

    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            showConfirmation('clear all entries?', 'this will permanently delete all your entries from the database. cannot be undone.', () => {
                if (!window.supabase) return;
                window.supabase.from('entries')
                    .delete()
                    .eq('user_id', currentUserId)
                    .then(({ error }) => {
                        if (error) throw error;
                        localStorage.removeItem('sonder-my-entries');
                        window.location.reload();
                    })
                    .catch(err => {
                        console.error('Error clearing entries:', err);
                        showAlert('Error', 'Error clearing entries. Please try again.');
                    });
            });
        });
    }

    function deleteEntry(entryId) {
        if (window.supabase) {
            window.supabase.from('entries').delete().eq('id', entryId)
                .then(({ error }) => {
                    if (error) throw error;
                    const myEntries = JSON.parse(localStorage.getItem('sonder-my-entries') || '[]');
                    const updatedEntries = myEntries.filter(id => id !== entryId);
                    localStorage.setItem('sonder-my-entries', JSON.stringify(updatedEntries));
                    window.location.reload();
                })
                .catch(error => {
                    console.error('Error deleting entry:', error);
                    showAlert('Error', 'Failed to delete entry. Please try again.');
                });
        }
    }
}

/* --- Updates Modal Logic --- */
var appUpdates = [
    { date: '02.01.2026', title: 'SONDER Wrapped', text: 'relive your memories from the past year with a personalized cinematic recap (unlocks Dec 25).' },
    { date: '02.01.2026', title: 'premium map clustering', text: 'memories now group into beautiful glassmorphic clusters for better performance and readability.' },
    { date: '02.01.2026', title: 'mobile ui polish', text: 'streamlined archive view and improved touch targets for a smoother vertical flow on mobile.' },
    { date: '02.01.2026', title: 'production hardening', text: 'optimized complex animations for gpu stability and enhanced security protocols.' },
    { date: '01.24.2026', title: 'feedback', text: ' share your thoughts through the contextual feedback system that appears after interactions—your voice shapes sonder.' },
    { date: '01.24.2026', title: 'support', text: 'new support modal with ko-fi, gcash, and paypal options to help sonder future developments' },
    { date: '01.23.2026', title: 'report a memory', text: 'help keep sonder safe by reporting inappropriate content directly from the preview card.' },
    { date: '01.23.2026', title: 'live view', text: 'see how many souls are currently exploring the void in real-time.' },
    { date: '01.21.2026', title: 'interactions', text: 'added real-time views, reactions, and comments.' },
    { date: '01.21.2026', title: 'security', text: 'stronger security measures to protect your data.' },
    { date: '01.21.2026', title: 'help button', text: 'restored the help button for better guidance.' },
    { date: '12.15.2025', title: 'pro cropping', text: 'native image cropping tool with grids and aspect ratio control for perfect uploads.' },
    { date: '12.15.2025', title: 'immersive loading', text: 'a new uplifting entrance experience with random sonder thoughts.' },
    { date: '12.14.2025', title: 'social sharing', text: 'share your memories directly to instagram, facebook, and more, or download them as beautiful cards.' },
    { date: '12.12.2025', title: 'ui polish', text: 'refined color selector glow with theme-adaptive effects and improved empty state designs.' },
    { date: '12.12.2025', title: 'mobile optimization', text: 'fixed empty state display on mobile devices for better responsive experience.' },
    { date: '12.12.2025', title: 'bug fixes', text: 'squashed pesky syntax errors and smoothed out the experience.' },
    { date: '12.11.2025', title: 'optimized uploads', text: 'faster image processing and smarter compression for quicker posts.' },
    { date: '12.11.2025', title: 'smart loading', text: 'visual feedback during posts so you know its working.' },
    { date: '12.11.2025', title: 'proximity notifications', text: 'get notified when someone posts near your memories (200m radius).' },
    { date: '12.10.2025', title: 'shareable entries', text: 'share specific moments with a direct link that flies to the location.' },
    { date: '12.10.2025', title: 'support the project', text: 'added a way (ko-fi) to support server costs and future development.' },
    { date: '12.09.2025', title: 'camera capture', text: 'take photos directly from the map with live preview and smooth mirroring.' },
    { date: '12.09.2025', title: 'cross-device sync', text: 'access your entries from any device using your unique sync code.' },
    { date: '12.08.2025', title: 'image uploads', text: 'attach photos to your map entries and view them in the archive.' },
    { date: '12.08.2025', title: 'archive navigation', text: 'click any entry card to jump directly to its location on the map.' },
    { date: '12.05.2025', title: 'improved modals', text: 'better scrolling and layout across all devices.' },
    { date: '12.04.2025', title: 'polished design', text: 'smoother animations and enhanced mobile experience.' },
    { date: '12.01.2025', title: 'map clustering', text: 'points now group together when zoomed out.' },
    { date: '11.28.2025', title: 'dark mode', text: 'seamless theme switching for late night browsing.' },
    { date: '11.20.2025', title: 'custom markers', text: 'unique visual language for different moment types.' },
    { date: '11.15.2025', title: 'Spotify integration', text: 'link songs to your memories.' },
    { date: '11.10.2025', title: 'beta launch', text: 'sonder is now live.' }
];

function initUpdatesModal() {
    const modal = document.getElementById('updatesModal');
    const btn = document.getElementById('updatesBtn');
    const badge = btn ? btn.querySelector('.updates-btn__badge') : null;
    const closeBtn = document.getElementById('closeUpdatesBtn');
    const actionBtn = document.getElementById('closeUpdatesActionBtn');
    const updatesList = document.getElementById('updatesList');

    if (updatesList) {
        const groupedUpdates = {};
        appUpdates.forEach(update => {
            if (!groupedUpdates[update.date]) {
                groupedUpdates[update.date] = [];
            }
            groupedUpdates[update.date].push(update);
        });

        updatesList.innerHTML = Object.keys(groupedUpdates).map(date => {
            const updates = groupedUpdates[date];
            const updatesHtml = updates.map(u => `
            <li style="margin-bottom: 0.25rem;">
                <strong>${u.title}:</strong> ${u.text}
            </li>
        `).join('');

            return `
            <li style="display: flex; flex-direction: column; gap: 0.25rem;">
                <span style="color: var(--color-muted); font-size: 0.85rem; display: block; margin-bottom: 0.1rem;">${date}</span>
                <ul style="margin-left: 0.5rem; border-left: 1px solid var(--color-muted); padding-left: 0.8rem; list-style: none; display: flex; flex-direction: column; gap: 0.3rem; opacity: 0.8;">
                    ${updatesHtml}
                </ul>
            </li>
        `;
        }).join('');
    }

    const totalUpdates = appUpdates.length;
    let lastSeenCount = parseInt(localStorage.getItem('sonder-last-seen-count')) || 0;
    let unreadCount = totalUpdates - lastSeenCount;
    if (unreadCount < 0) unreadCount = 0;

    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'inline-flex';
            badge.style.alignItems = 'center';
            badge.style.justifyContent = 'center';
        } else {
            badge.style.display = 'none';
        }
    }

    if (!modal || !btn) return;

    const open = () => {
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
        localStorage.setItem('sonder-last-seen-count', totalUpdates.toString());
        if (badge) badge.style.display = 'none';
    };

    const close = () => {
        modal.hidden = true;
        document.body.style.overflow = '';
    };

    btn.addEventListener('click', (e) => {
        e.preventDefault();
        open();
    });

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (actionBtn) actionBtn.addEventListener('click', close);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
    });
}

function initSeasonalFeatures() {
    const wrappedSection = document.getElementById('wrappedSection');
    if (!wrappedSection) return;

    const now = new Date();
    // month is 0-indexed, so 11 is December
    const isWrappedSeason = now.getMonth() === 11 && now.getDate() >= 25;
    
    // Check for preview override
    const urlParams = new URLSearchParams(window.location.search);
    const isPreview = urlParams.get('preview') === 'true';

    if (isWrappedSeason || isPreview) {
        wrappedSection.style.display = 'block';
    } else {
        wrappedSection.style.display = 'none';
    }
}


