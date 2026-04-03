/* SONDER - Loading Screen Logic */

const loadingMessages = [
    "realizing every passerby has a life as vivid and complex as your own.",
    "you are the main character of your story, and an extra in theirs.",
    "every lighted window is a story waiting to be told.",
    "8.3 billion people. 8.3 billion worlds.",
    "entering the invisible web of human experience...",
    "everyone you pass is fighting a battle you know nothing about. be kind.",
    "the world is crowded with others, but you are never truly alone.",
    "finding the extraordinary in the ordinary.",
    "tuning into the hidden frequencies of the city...",
    "someone, somewhere, is listening to your favorite song right now.",
    "every stranger has a secret that would break your heart.",
    "we are all just walking each other home.",
    "mapping the invisible threads that connect us all.",
    "your life is a cameo in everyone else's movie.",
    "collecting fragments of fleeting moments.",
    "the universe is letting you breathe for a second.",
    "listen closely; silence is also a story.",
    "you are a ghost in a memory you haven't made yet.",
    "somewhere, a stranger remembers your kindness.",
    "pausing time, just for a moment."
];

document.addEventListener('DOMContentLoaded', () => {
    const exploreBtn = document.getElementById('exploreBtn');

    if (exploreBtn) {
        exploreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            startLoadingSequence();
        });
    }
});

function startLoadingSequence() {
    // 1. Create Overlay
    const overlay = document.createElement('div');
    overlay.className = 'sonder-loader';

    // 2. Select Message (Smart Random: Avoid Repeats)
    let availableMessages = loadingMessages;
    const lastMessage = localStorage.getItem('sonder-last-loading-msg');

    if (lastMessage) {
        availableMessages = loadingMessages.filter(msg => msg !== lastMessage);
        // Fallback if something weird happens and list is empty
        if (availableMessages.length === 0) availableMessages = loadingMessages;
    }

    const msg = availableMessages[Math.floor(Math.random() * availableMessages.length)];
    localStorage.setItem('sonder-last-loading-msg', msg);

    overlay.innerHTML = `
        <div class="sonder-loader__content">
            <div class="sonder-loader__spinner"></div>
            <p class="sonder-loader__text">${_escapeHtmlLocal(msg)}</p>
        </div>
    `;

    // 3. Inject Styles
    const style = document.createElement('style');
    style.innerHTML = `
        .sonder-loader {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0; /* Inset 0 covers safer than 100vh on mobile */
            background: var(--color-bg);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.5s ease-out forwards;
        }

        .sonder-loader__content {
            text-align: center;
            padding: 2rem;
            max-width: 600px;
            color: var(--color-text);
            opacity: 0;
            animation: fadeUp 0.8s ease-out 0.3s forwards;
        }

        .sonder-loader__spinner {
            width: 48px;
            height: 48px;
            border: 3px solid var(--color-muted);
            border-top-color: var(--color-text);
            border-radius: 50%;
            margin: 0 auto 2.5rem;
            animation: spin 1s linear infinite;
            opacity: 0.8;
        }

        .sonder-loader__text {
            font-family: 'Playfair Display', serif;
            font-size: 1.5rem;
            font-style: italic;
            line-height: 1.4;
            font-weight: 500;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(overlay);

    // 4. Redirect
    setTimeout(() => {
        window.location.href = 'map.html';
    }, 2800); // Wait for them to read it
}

function _escapeHtmlLocal(text) {
    if (!text) return '';
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
