/* ==========================================
   CLIENT-SIDE PROXIMITY NOTIFICATIONS
   Zero backend costs - runs entirely in browser
   ========================================== */

(function () {
    'use strict';

    const PROXIMITY_RADIUS = 200; // meters
    const CHECK_RECENT_DAYS = 7; // Only check entries from last 7 days

    // Haversine formula to calculate distance between two coordinates
    function getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    }

    // Format time ago
    function getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);

        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };

        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
            }
        }

        return 'just now';
    }

    // Format distance
    function formatDistance(meters) {
        if (meters < 50) return 'very close to';
        if (meters < 100) return 'near';
        return `${Math.round(meters)}m from`;
    }

    // Main notification system
    function initNotifications() {
        const modal = document.getElementById('notificationsModal');
        const btn = document.getElementById('notificationsBtn');
        const badge = document.getElementById('notificationsBadge');
        const closeBtn = document.getElementById('notificationsModalClose');
        const notificationsList = document.getElementById('notificationsList');
        const emptyState = document.getElementById('notificationsEmpty');

        if (!modal || !btn || !window.supabase) return;

        const currentUserId = typeof getUserId === 'function' ? getUserId() : localStorage.getItem('sonder-user-id');
        let notifications = [];
        let seenNotifications = JSON.parse(localStorage.getItem('sonder-seen-notifications') || '[]');
        let clearedNotifications = JSON.parse(localStorage.getItem('sonder-cleared-notifications') || '[]');

        // Check for nearby entries
        async function fetchAllNotifications() {
            try {
                console.log('[SONDER Notifications] Starting checks...');
                let allFound = [];

                // 1. Get user's entries (needed for all checks)
                const { data: myEntries, error: myError } = await window.supabase
                    .from('entries')
                    .select('id, text, lat, lng, timestamp')
                    .eq('user_id', currentUserId);

                if (myError) throw myError;
                if (!myEntries || myEntries.length === 0) {
                    console.log('[SONDER Notifications] No entries found for current user');
                    updateUI([]);
                    return;
                }

                const myEntryIds = myEntries.map(e => e.id);


                // --- A. PROXIMITY CHECK ---
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - CHECK_RECENT_DAYS);

                const { data: recentEntries, error: recentError } = await window.supabase
                    .from('entries')
                    .select('id, timestamp, lat, lng, user_id')
                    .gt('timestamp', cutoffDate.toISOString())
                    .neq('user_id', currentUserId)
                    .order('timestamp', { ascending: false })
                    .limit(500);

                if (!recentError && recentEntries) {
                    recentEntries.forEach(entry => {
                        for (const myEntry of myEntries) {
                            try {
                                const entryTime = new Date(entry.timestamp).getTime();
                                const myTime = new Date(myEntry.timestamp).getTime();
                                if (entryTime <= myTime) continue; // Only newer entries

                                const distance = getDistance(entry.lat, entry.lng, myEntry.lat, myEntry.lng);
                                if (distance <= PROXIMITY_RADIUS) {
                                    const notifId = `prox_${myEntry.id}_${entry.id}`;
                                    allFound.push({
                                        id: notifId,
                                        type: 'proximity',
                                        yourEntryId: myEntry.id,
                                        yourEntryText: myEntry.text,
                                        yourEntryLat: myEntry.lat,
                                        yourEntryLng: myEntry.lng,
                                        newEntryId: entry.id,
                                        distance: Math.round(distance),
                                        timestamp: new Date(entry.timestamp),
                                        read: seenNotifications.includes(notifId)
                                    });
                                    break; // Found one match for this recent entry
                                }
                            } catch (e) { /* ignore */ }
                        }
                    });
                }


                // --- B. REACTION CHECK ---
                // "reactions" table: entry_id, user_id, (timestamp?)
                // We'll try to fetch recent reactions. If no timestamp column, we might grab all.
                // Assuming 'created_at' or 'timestamp' exists. sonder.js uses upsert, so it might be tricky.
                // We'll filter strictly by entry_ids.
                const { data: recentReactions, error: reactError } = await window.supabase
                    .from('reactions')
                    .select('entry_id, user_id') // Minimum required fields
                    .in('entry_id', myEntryIds)
                    .neq('user_id', currentUserId) // Don't notify own likes
                    .limit(50);

                if (!reactError && recentReactions) {
                    recentReactions.forEach(react => {
                        // If there's no timestamp, we simulate one or use a specific window if possible.
                        // For now we trust the row exists.
                        const notifId = `like_${react.entry_id}_${react.user_id}`;
                        const myEntry = myEntries.find(e => e.id === react.entry_id);

                        // Fix for missing timestamp in some schemas -> defaut to now or entry time
                        const reactTime = react.created_at || react.timestamp || new Date().toISOString();

                        allFound.push({
                            id: notifId,
                            type: 'reaction',
                            yourEntryId: react.entry_id,
                            yourEntryText: myEntry ? myEntry.text : 'your memory',
                            yourEntryLat: myEntry ? myEntry.lat : 0,
                            yourEntryLng: myEntry ? myEntry.lng : 0,
                            timestamp: new Date(reactTime),
                            read: seenNotifications.includes(notifId)
                        });
                    });
                }


                // --- C. COMMENT CHECK ---
                // "comments" table: id, entry_id, user_id, comment_text, timestamp
                const { data: recentComments, error: commError } = await window.supabase
                    .from('comments')
                    .select('id, entry_id, user_id, comment_text, timestamp')
                    .in('entry_id', myEntryIds)
                    .neq('user_id', currentUserId)
                    .order('timestamp', { ascending: false })
                    .limit(50);

                if (!commError && recentComments) {
                    recentComments.forEach(comm => {
                        const notifId = `comm_${comm.id}`;
                        const myEntry = myEntries.find(e => e.id === comm.entry_id);

                        allFound.push({
                            id: notifId,
                            type: 'comment',
                            content: comm.comment_text,
                            yourEntryId: comm.entry_id,
                            yourEntryText: myEntry ? myEntry.text : 'your memory',
                            yourEntryLat: myEntry ? myEntry.lat : 0,
                            yourEntryLng: myEntry ? myEntry.lng : 0,
                            timestamp: new Date(comm.timestamp),
                            read: seenNotifications.includes(notifId)
                        });
                    });
                }

                // Process & Deduplicate
                allFound.sort((a, b) => b.timestamp - a.timestamp);

                // Keep only unique IDs
                const uniqueNotifications = [];
                const seen = new Set();
                allFound.forEach(n => {
                    if (!seen.has(n.id)) {
                        seen.add(n.id);
                        uniqueNotifications.push(n);
                    }
                });

                notifications = uniqueNotifications.filter(n => !clearedNotifications.includes(n.id));
                console.log(`[SONDER Notifications] Total: ${notifications.length}`);
                updateUI(notifications);

            } catch (error) {
                console.error('[SONDER Notifications] Error:', error);
            }
        }

        // Update UI with notifications
        function updateUI(notifs) {
            const unreadCount = notifs.filter(n => !n.read).length;

            if (unreadCount > 0) {
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                badge.style.display = 'inline-flex';
            } else {
                badge.style.display = 'none';
            }

            if (notifs.length === 0) {
                notificationsList.innerHTML = '';
                emptyState.hidden = false;
            } else {
                emptyState.hidden = true;
                renderNotifications(notifs);
            }
        }

        // Render notifications
        function renderNotifications(notifs) {
            notificationsList.innerHTML = '';

            notifs.forEach((notif, index) => {
                const card = document.createElement('div');
                card.className = 'notification-card';
                if (!notif.read) card.classList.add('notification-card--unread');
                card.style.animationDelay = `${index * 0.05}s`;

                const timeAgo = getTimeAgo(notif.timestamp);
                let icon = '📍';
                let message = '';
                // Securely construct snippet
                const escape = window.escapeHtml || ((t) => t); // Fallback to identity only if critical, but we expect global to be there
                if (!window.escapeHtml) console.warn('[SONDER] Global escapeHtml missing! Notifications may be at risk.');

                let rawSnippet = notif.yourEntryText || 'your memory';
                let snippet = notif.yourEntryText ? `"${escape(rawSnippet).substring(0, 20)}${rawSnippet.length > 20 ? '...' : ''}"` : 'your memory';

                if (notif.type === 'proximity') {
                    icon = '📍';
                    message = `Someone posted <span class="notification-card__distance">${formatDistance(notif.distance)}</span> your memory ${snippet}`;
                } else if (notif.type === 'reaction') {
                    icon = '❤️';
                    message = `Someone loved your memory ${snippet}`;
                } else if (notif.type === 'comment') {
                    icon = '💬';
                    message = `Someone commented on ${snippet}: <span style="font-style:italic; opacity:0.8;">"${escape(notif.content)}"</span>`;
                }

                card.innerHTML = `
                    <div class="notification-card__icon">${icon}</div>
                    <div class="notification-card__content">
                        <div class="notification-card__text">${message}</div>
                        <div class="notification-card__time">${timeAgo}</div>
                    </div>
                    <div class="notification-card__actions">
                        <button class="notification-card__action notification-card__action--view" data-notif-id="${notif.id}" title="View">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                        <button class="notification-card__action notification-card__action--dismiss" data-notif-id="${notif.id}" title="Dismiss">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                `;

                const viewBtn = card.querySelector('.notification-card__action--view');
                viewBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    markAsRead(notif.id);
                    navigateToLocation(notif.yourEntryLat, notif.yourEntryLng, notif.yourEntryId);
                });

                const dismissBtn = card.querySelector('.notification-card__action--dismiss');
                dismissBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dismissNotification(notif.id);
                });

                // Also make the whole card clickable for "View"
                card.addEventListener('click', () => {
                    markAsRead(notif.id);
                    navigateToLocation(notif.yourEntryLat, notif.yourEntryLng, notif.yourEntryId);
                });

                notificationsList.appendChild(card);
            });
        }

        // Mark notification as read
        function markAsRead(notifId) {
            if (!seenNotifications.includes(notifId)) {
                seenNotifications.push(notifId);
                localStorage.setItem('sonder-seen-notifications', JSON.stringify(seenNotifications));
                const notif = notifications.find(n => n.id === notifId);
                if (notif) notif.read = true;
                updateUI(notifications);
            }
        }

        // Mark all as read
        function markAllAsRead() {
            const allIds = notifications.map(n => n.id);
            seenNotifications = [...new Set([...seenNotifications, ...allIds])];
            localStorage.setItem('sonder-seen-notifications', JSON.stringify(seenNotifications));
            notifications.forEach(n => n.read = true);
            updateUI(notifications);
        }

        // Dismiss individual notification
        function dismissNotification(notifId) {
            if (!clearedNotifications.includes(notifId)) {
                clearedNotifications.push(notifId);
                localStorage.setItem('sonder-cleared-notifications', JSON.stringify(clearedNotifications));
                notifications = notifications.filter(n => n.id !== notifId);
                updateUI(notifications);
            }
        }

        // Clear all notifications
        function clearAllNotifications() {
            if (notifications.length === 0) return;
            if (!confirm('Clear all notifications?')) return;

            const allIds = notifications.map(n => n.id);
            clearedNotifications = [...new Set([...clearedNotifications, ...allIds])];
            localStorage.setItem('sonder-cleared-notifications', JSON.stringify(clearedNotifications));
            notifications = [];
            updateUI(notifications);
        }

        // Navigate to location
        function navigateToLocation(lat, lng, entryId) {
            localStorage.setItem('sonder-nav-lat', lat);
            localStorage.setItem('sonder-nav-lng', lng);
            if (entryId) localStorage.setItem('sonder-nav-id', entryId);

            if (window.map) {
                window.map.flyTo([lat, lng], 15, { animate: true, duration: 2 });
                // Check if marker exists and open it
                if (window.sonderMarkers && window.sonderMarkers[entryId]) {
                    setTimeout(() => window.sonderMarkers[entryId].fire('click'), 2200);
                }
                closeModal();
            } else {
                window.location.href = `map.html?id=${entryId}`;
            }
        }

        // Open modal
        btn.addEventListener('click', () => {
            modal.hidden = false;
            document.body.style.overflow = 'hidden';
            // Refresh on open
            fetchAllNotifications();
        });

        // Clear All button
        const clearAllBtn = document.getElementById('notificationsClearAll');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                clearAllNotifications();
            });
        }

        // Close modal
        const closeModal = () => {
            modal.hidden = true;
            document.body.style.overflow = '';
            // Mark visible as read on close if desired, or let user click View
            // Current design: Mark all as read on close?
            // "Mark all as read when closing" logic from previous version:
            const hasUnread = notifications.some(n => !n.read);
            if (hasUnread) {
                markAllAsRead();
            }
        };

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Initial check
        fetchAllNotifications();
    }


    // Initialize on page load - wait for Supabase client instance to be ready
    function tryInit() {
        if (window.supabase && typeof window.supabase.from === 'function') {
            initNotifications();
        } else {
            // Retry after a short delay if supabase client isn't fully ready yet
            setTimeout(tryInit, 100);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInit);
    } else {
        tryInit();
    }

})();
