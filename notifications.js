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

        if (!modal || !btn || !window.db) return;

        // Get or create getUserId function
        const getUserId = window.getUserId || function () {
            let userId = localStorage.getItem('sonder-user-id');
            if (!userId) {
                userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('sonder-user-id', userId);
            }
            return userId;
        };

        const currentUserId = getUserId();
        let notifications = [];
        let seenNotifications = JSON.parse(localStorage.getItem('sonder-seen-notifications') || '[]');

        // Check for nearby entries
        async function checkForNearbyEntries() {
            try {
                // Get user's entries
                const myEntriesSnapshot = await window.db.collection('entries')
                    .where('userId', '==', currentUserId)
                    .get();

                if (myEntriesSnapshot.empty) {
                    updateUI([]);
                    return;
                }

                const myEntries = [];
                myEntriesSnapshot.forEach(doc => {
                    myEntries.push({ id: doc.id, ...doc.data() });
                });

                // Get recent entries from others (last 7 days)
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - CHECK_RECENT_DAYS);

                const recentEntriesSnapshot = await window.db.collection('entries')
                    .where('timestamp', '>', cutoffDate)
                    .orderBy('timestamp', 'desc')
                    .limit(500)
                    .get();

                const foundNotifications = [];

                // Check each recent entry against user's entries
                recentEntriesSnapshot.forEach(doc => {
                    const entry = { id: doc.id, ...doc.data() };

                    // Skip own entries
                    if (entry.userId === currentUserId) return;

                    // Check distance to each of user's entries
                    myEntries.forEach(myEntry => {
                        const distance = getDistance(
                            entry.lat, entry.lng,
                            myEntry.lat, myEntry.lng
                        );

                        if (distance <= PROXIMITY_RADIUS) {
                            const notifId = `${myEntry.id}_${entry.id}`;

                            // Create notification object
                            foundNotifications.push({
                                id: notifId,
                                yourEntryId: myEntry.id,
                                yourEntryLat: myEntry.lat,
                                yourEntryLng: myEntry.lng,
                                newEntryId: entry.id,
                                distance: Math.round(distance),
                                timestamp: entry.timestamp ? entry.timestamp.toDate() : new Date(),
                                read: seenNotifications.includes(notifId)
                            });
                        }
                    });
                });

                // Sort by timestamp (newest first)
                foundNotifications.sort((a, b) => b.timestamp - a.timestamp);

                // Remove duplicates (keep newest)
                const uniqueNotifications = [];
                const seen = new Set();
                foundNotifications.forEach(notif => {
                    if (!seen.has(notif.id)) {
                        seen.add(notif.id);
                        uniqueNotifications.push(notif);
                    }
                });

                notifications = uniqueNotifications;
                updateUI(notifications);

            } catch (error) {
                console.error('Error checking for nearby entries:', error);
            }
        }

        // Update UI with notifications
        function updateUI(notifs) {
            const unreadCount = notifs.filter(n => !n.read).length;

            // Update badge
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                badge.style.display = 'inline-flex';
            } else {
                badge.style.display = 'none';
            }

            // Update list
            if (notifs.length === 0) {
                notificationsList.innerHTML = '';
                emptyState.style.display = 'flex';
                // emptyState.hidden = false;
            } else {
                emptyState.style.display = 'none';
                // emptyState.hidden = true;
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
                const distanceText = formatDistance(notif.distance);

                card.innerHTML = `
                    <div class="notification-card__icon">📍</div>
                    <div class="notification-card__content">
                        <div class="notification-card__text">
                            Someone posted a memory <span class="notification-card__distance">${distanceText}</span> one of your spots
                        </div>
                        <div class="notification-card__time">${timeAgo}</div>
                    </div>
                    <button class="notification-card__action" data-notif-id="${notif.id}" data-lat="${notif.yourEntryLat}" data-lng="${notif.yourEntryLng}">
                        View
                    </button>
                `;

                // View button handler
                const viewBtn = card.querySelector('.notification-card__action');
                viewBtn.addEventListener('click', () => {
                    markAsRead(notif.id);
                    navigateToLocation(notif.yourEntryLat, notif.yourEntryLng);
                });

                notificationsList.appendChild(card);
            });
        }

        // Mark notification as read
        function markAsRead(notifId) {
            if (!seenNotifications.includes(notifId)) {
                seenNotifications.push(notifId);
                localStorage.setItem('sonder-seen-notifications', JSON.stringify(seenNotifications));

                // Update notification object
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

        // Navigate to location
        function navigateToLocation(lat, lng) {
            localStorage.setItem('sonder-nav-lat', lat);
            localStorage.setItem('sonder-nav-lng', lng);

            // If already on map page, fly to location
            if (window.map) {
                window.map.flyTo([lat, lng], 15, {
                    animate: true,
                    duration: 2
                });
                closeModal();
            } else {
                // Navigate to map page
                window.location.href = 'map.html';
            }
        }

        // Open modal
        btn.addEventListener('click', () => {
            modal.hidden = false;
            document.body.style.overflow = 'hidden';
        });

        // Close modal
        const closeModal = () => {
            modal.hidden = true;
            document.body.style.overflow = '';

            // Mark all as read when closing
            const hasUnread = notifications.some(n => !n.read);
            if (hasUnread) {
                markAllAsRead();
            }
        };

        if (closeBtn) closeBtn.addEventListener('click', closeModal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Initialize - check for nearby entries
        checkForNearbyEntries();
    }

    // Initialize on page load - wait for Firebase to be ready
    function tryInit() {
        if (window.db) {
            initNotifications();
        } else {
            // Retry after a short delay if db isn't ready yet
            setTimeout(tryInit, 100);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInit);
    } else {
        tryInit();
    }

})();
