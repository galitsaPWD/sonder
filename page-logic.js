/* SONDER - Page Logic (Restored from Backup) */

/* --- Helpers --- */
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

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

/* --- Archive Logic --- */
function initArchive() {
    const grid = document.getElementById('archiveGrid');
    const emptyState = document.getElementById('archiveEmpty'); // Helper if needed
    if (!grid) return;
    const sortSelect = document.getElementById('archiveSort');

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
    const emptyState = document.getElementById('playlistEmpty');

    if (!list) return;

    if (window.db) {
        window.db.collection('entries').orderBy('timestamp', 'desc').limit(100).get().then(snap => {
            // Clear existing content
            list.innerHTML = '';

            let songsFound = 0;

            if (!snap.empty) {
                snap.forEach((doc, index) => {
                    const data = doc.data();
                    if (!data.song) return;

                    songsFound++;

                    const el = document.createElement('a');
                    el.href = data.song;
                    el.target = "_blank";
                    el.className = 'track-row';
                    // Stagger animation
                    el.style.animationDelay = `${Math.min(index, 20) * 0.05}s`;

                    el.innerHTML = `
                        <div class="track-icon">
                            ${data.thumbnail ? `<img src="${data.thumbnail}" style="width:100%; height:100%; object-fit:cover;">` : '<span>▶</span>'}
                        </div>
                        <div class="track-info">
                            <div class="track-meta">
                                ${data.songTitle ? `<span class="track-message">${escapeHtml(data.songTitle)}</span>` : 'Unknown Track'}
                                ${data.artist ? `<span style="opacity:0.7">• ${escapeHtml(data.artist)}</span>` : ''}
                            </div>
                        </div>
                        <div class="track-action">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                    `;
                    list.appendChild(el);
                });
            }

            // Toggle Empty State
            if (emptyState) {
                emptyState.hidden = songsFound > 0;
            }
            if (songsFound === 0 && !emptyState) {
                list.innerHTML = '<div style="padding:4rem;text-align:center;opacity:0.5">no songs yet</div>';
            }

        }).catch(err => {
            console.error('Error loading playlist:', err);
            if (emptyState) emptyState.hidden = false;
        });
    }
}

/* --- My Entries Logic --- */
function initMyEntries() {
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

                    if (!myEntryIds.includes(doc.id)) {
                        myEntryIds.push(doc.id);
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
                    const timeA = a.timestamp ? a.timestamp.toMillis() : 0;
                    const timeB = b.timestamp ? b.timestamp.toMillis() : 0;
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
                entries.forEach((entry, index) => {
                    const card = document.createElement('div');
                    card.className = 'my-entry-card';
                    card.style.animationDelay = `${Math.min(index, 20) * 0.05}s`;

                    const colorCode = getColorCode(entry.color);
                    const dateStr = entry.timestamp ? new Date(entry.timestamp.toDate()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Just now';

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
            })
            .catch(err => {
                console.error('Error loading my entries:', err);
                grid.innerHTML = '<p class="section__text">Error loading your entries.</p>';
            });
    }

    // Clear all
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            showConfirmation('clear all entries?', 'this will permanently delete all your entries from the database. cannot be undone.', () => {
                if (!window.db) return;
                window.db.collection('entries')
                    .where('userId', '==', currentUserId)
                    .get()
                    .then(snapshot => {
                        const batch = window.db.batch();
                        snapshot.forEach(doc => {
                            batch.delete(doc.ref);
                        });
                        return batch.commit();
                    })
                    .then(() => {
                        localStorage.removeItem('sonder-my-entries');
                        window.location.reload();
                    })
                    .catch(err => {
                        console.error('Error clearing entries:', err);
                        alert('Error clearing entries. Please try again.');
                    });
            });
        });
    }
}

function deleteEntry(entryId) {
    if (window.db) {
        window.db.collection('entries').doc(entryId).delete()
            .then(() => {
                const myEntries = JSON.parse(localStorage.getItem('sonder-my-entries') || '[]');
                const updatedEntries = myEntries.filter(id => id !== entryId);
                localStorage.setItem('sonder-my-entries', JSON.stringify(updatedEntries));
                window.location.reload();
            })
            .catch(error => {
                console.error('Error deleting entry:', error);
                alert('Failed to delete entry. Please try again.');
            });
    }
}

/* --- Updates Modal Logic --- */
const appUpdates = [
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
                    <span style="opacity: 0.6; font-size: 0.85rem; display: block; margin-bottom: 0.1rem;">${date}</span>
                    <ul style="margin-left: 0.5rem; border-left: 1px solid rgba(255,255,255,0.2); padding-left: 0.8rem; list-style: none; display: flex; flex-direction: column; gap: 0.3rem;">
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
