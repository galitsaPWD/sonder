// Share Logic (share.js)

document.addEventListener('DOMContentLoaded', () => {
    // 1. Handle Share Button Click (Event Delegation)
    document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-share');
        if (btn) {
            const id = btn.dataset.id;
            if (!id) return;

            const url = `${window.location.origin}${window.location.pathname}?id=${id}`;
            navigator.clipboard.writeText(url).then(() => {
                const originalText = btn.innerHTML;
                btn.innerHTML = '✓';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                }, 2000);
            }).catch(console.error);
        }
    });

    // 2. Handle Deep Link Landing
    const params = new URLSearchParams(window.location.search);
    const entryId = params.get('id');

    if (entryId) {
        // Wait for map and markers to be ready
        const checkInterval = setInterval(() => {
            if (window.sonderMarkers && window.sonderMarkers[entryId]) {
                clearInterval(checkInterval);

                const marker = window.sonderMarkers[entryId];
                const latLng = marker.getLatLng();

                // Fly to location
                if (window.map) {
                    window.map.flyTo(latLng, 15, {
                        animate: true,
                        duration: 2
                    });
                }

                // Open the entry (simulate click)
                // We add a slight delay to allow the flyTo to start/finish
                setTimeout(() => {
                    marker.fire('click');
                }, 1000);
            }
        }, 500);

        // Timeout after 10 seconds to stop checking
        setTimeout(() => clearInterval(checkInterval), 10000);
    }
});
