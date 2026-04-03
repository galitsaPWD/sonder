// SONDER Wrapped - Premium Cinematic Experience
// Features: Story-style progression, GSAP Animations, Leaflet Maps

let currentSlide = 0;
const totalSlides = 11;
let wrappedData = null;
let slideDuration = 5000; // 5 seconds per slide
let slideTimer = null;
let isPaused = false;
let isFirstLoad = true; // Flag to prevent initial animation during loading
let mapInstance = null;

// Test Data
const testData = {
    year: 2026,
    totalEntries: 42,
    totalDistance: 127.5,
    totalViews: 1834,
    mostVisitedLocation: {
        name: "Manila, Philippines",
        count: 12,
        lat: 14.5995,
        lng: 120.9842
    },
    locations: [
        { lat: 14.5995, lng: 120.9842 }, // Manila
        { lat: 35.6762, lng: 139.6503 }, // Tokyo
        { lat: 40.7128, lng: -74.0060 }  // New York
    ],
    dominantColor: {
        name: "black",
        hex: "#1a1a1a",
        meaning: "deep, introspective, timeless"
    },
    topSong: {
        title: "Midnight City",
        artist: "M83",
        thumbnail: "https://i.scdn.co/image/ab67616d0000b273030d99906adc2d939632427b"
    },
    longestEntry: {
        text: "sometimes i sit by the window and watch the rain, wondering if somewhere out there, someone is watching the same storm and feeling the same quiet ache...",
        wordCount: 127
    },
    firstEntry: {
        text: "starting this year with hope",
        date: "Jan 1, 2026"
    },
    lastEntry: {
        text: "still here, still trying, still hoping",
        date: "Jan 25, 2026"
    }
};

// Utilities
function getUserId() {
    let userId = localStorage.getItem('sonder-user-id');
    if (!userId) {
        userId = localStorage.getItem('sonder_user_id');
        if (userId) {
            localStorage.setItem('sonder-user-id', userId);
        } else {
            userId = 'user_' + crypto.randomUUID();
            localStorage.setItem('sonder-user-id', userId);
        }
    }
    return userId;
}

function waitForSupabase() {
    return new Promise((resolve) => {
        let retry = 0;
        const check = () => {
            if (window.supabase && typeof window.supabase.from === 'function') {
                resolve(window.supabase);
            } else if (retry < 50) {
                retry++;
                setTimeout(check, 100);
            } else {
                resolve(null);
            }
        };
        check();
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    // 0. Seasonal Lock: Only accessible starting Dec 25
    const now = new Date();
    const isWrappedSeason = now.getMonth() === 11 && now.getDate() >= 25; // Dec is month 11
    
    // Check if user has bypass param (for testing)
    const urlParams = new URLSearchParams(window.location.search);
    const bypass = urlParams.get('preview') === 'true';

    if (!isWrappedSeason && !bypass) {
        window.location.href = 'index.html'; // Redirect to home if not season
        return;
    }

    // 1. Wait for Supabase
    await waitForSupabase();

    // 2. Initialize Core
    initWrapped();
    setupNavigation();
    setupAnimations();
    setupInteractions();
    initAudio();

    // GSAP Cleanup
    window.addEventListener('unload', () => {
        if (typeof gsap !== 'undefined') gsap.matchMedia().revert();
    });
});

async function initWrapped() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const startOverlay = document.getElementById('startOverlay');

    // 1. Fetch Real Data
    try {
        const data = await fetchWrappedData(2026);
        wrappedData = data;
        console.log("Wrapped Data Loaded:", wrappedData);

        // 1.5 Preload Map (Wait for tiles/generation)
        console.log("[WRAPPED] Preloading Map...");
        await initMap(true); // Pass true to wait for readiness
        
    } catch (e) {
        console.warn("Using Test Data due to error/empty:", e);
        wrappedData = testData; // Fallback
    }

    // 2. Hide Loading -> Show Start
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
    if (startOverlay) startOverlay.classList.remove('hidden');

    populateSlides();
    showSlide(0); // Setup slide 0 backdrop/content but NO animation yet
}

// Fetch Real Data from Supabase & iTunes
async function fetchWrappedData(year = 2026) {
    const userId = getUserId();
    const supabase = window.supabase;

    console.log(`%c[WRAPPED] Fetching data for User ID: ${userId}`, "color: #ffd700; font-weight: bold;");

    if (!supabase) {
        console.error("[WRAPPED] Supabase client not found.");
        throw new Error('Supabase not ready');
    }

    // 1. Get Entries
    // DEBUG: Check Session for RLS
    const { data: { session } } = await supabase.auth.getSession();
    console.log(`[WRAPPED] Supabase Session Active: ${!!session}`);
    if (!session) console.warn("⚠️ No active session! RLS policies might block data access even if you provide an ID.");

    const { data: entries, error } = await supabase
        .from('entries')
        .select('id, text, timestamp, color, lat, lng, view_count, reaction_count, thumbnail, image, song, song_title, artist')
        .eq('user_id', userId)
        .gte('timestamp', `${year}-01-01`)
        .lt('timestamp', `${year + 1}-01-01`)
        .order('timestamp', { ascending: true });

    if (error) {
        console.error("Supabase Query Error:", error);
        throw error;
    }

    // 1.1 Fetch Reactions (Likes) for these entries
    const entryIds = entries.map(e => e.id);
    const { data: reactions, error: reactError } = await supabase
        .from('reactions')
        .select('entry_id')
        .in('entry_id', entryIds);

    if (reactError) console.warn("[WRAPPED] Reaction fetch failed:", reactError);
    const likeCounts = {};
    if (reactions) {
        reactions.forEach(r => likeCounts[r.entry_id] = (likeCounts[r.entry_id] || 0) + 1);
    }

    console.log(`[WRAPPED] Raw DB Response: Found ${entries?.length || 0} rows`);
    if (!entries || entries.length === 0) throw new Error('No entries');

    // 2. Calculate Stats
    let totalDistance = 0;
    const locations = [];
    const songCounts = {};
    const colorCounts = {};
    let longestEntry = { text: '', content: '', description: '' }; // Initialize with empty strings for safety
    let totalViews = 0;
    let mediaCount = 0;
    let songCount = 0;
    let totalLikes = 0;

    const locationClusters = {}; // Track frequency of locations

    entries.forEach((entry, i) => {
        // Likes
        totalLikes += (likeCounts[entry.id] || 0);

        // Distance
        if (i > 0) {
            totalDistance += calculateDistance(
                entries[i - 1].lat, entries[i - 1].lng,
                entry.lat, entry.lng
            );
        }
        locations.push({ lat: entry.lat, lng: entry.lng });

        // Clustering for most visited (round to 3 decimals ~110m precision)
        const clusterKey = `${entry.lat.toFixed(3)},${entry.lng.toFixed(3)}`;
        locationClusters[clusterKey] = (locationClusters[clusterKey] || 0) + 1;

        // Songs: Robust parsing for old entries (where only 'song' might contain "Title - Artist")
        let songName = entry.song_title || entry.title;
        let artistName = entry.artist || '';

        // If we only have 'song' field, try to parse it
        if (!songName && entry.song) {
            if (entry.song.includes(' - ')) {
                const parts = entry.song.split(' - ');
                songName = parts[0].trim();
                artistName = parts[1].trim();
            } else if (entry.song.includes(' | ')) {
                const parts = entry.song.split(' | ');
                songName = parts[0].trim();
                artistName = parts[1].trim();
            } else if (entry.song.includes(' by ')) {
                const parts = entry.song.split(' by ');
                songName = parts[0].trim();
                artistName = parts[1].trim();
            } else if (!entry.song.startsWith('http')) {
                // It's a raw string but no delimiter found
                songName = entry.song;
            }
        }

        if (songName) {
            const key = `${songName}|${artistName}`;
            songCounts[key] = (songCounts[key] || 0) + 1;
        } else if (entry.song && entry.song.includes('spotify.com')) {
            // Count by URL if no name/artist metadata available yet
            songCounts[entry.song] = (songCounts[entry.song] || 0) + 1;
        }

        // Colors
        if (entry.color) colorCounts[entry.color] = (colorCounts[entry.color] || 0) + 1;

        // Longest Text (check 'text' or 'content' or 'description')
        const text = entry.text || entry.content || entry.description || '';
        const longestText = longestEntry.text || longestEntry.content || longestEntry.description || '';
        if (text.length > longestText.length) longestEntry = entry;

        // Views & Media
        totalViews += (entry.view_count || 0);
        if (entry.image_url || entry.media_url) mediaCount++;
        if (songName || (entry.song && entry.song.includes('spotify.com'))) songCount++;
    });

    // 3. Find Top Item
    const topSongKey = Object.keys(songCounts).reduce((a, b) => songCounts[a] > songCounts[b] ? a : b, null);
    let topSongData = null;

    if (topSongKey && topSongKey.includes('spotify.com')) {
        // Resolve Spotify URL directly via OEmbed
        try {
            console.log(`[WRAPPED] Resolving Top Song via Spotify OEmbed: ${topSongKey}`);
            const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(topSongKey)}`;
            const response = await fetch(oembedUrl);
            const data = await response.json();

            if (data.title) {
                let title = data.title;
                let artist = data.author_name;

                // V6 AGGRESSIVE PARSING: Check HTML for various patterns
                if (data.html) {
                    const patterns = [
                        /title="Spotify Embed: (.*?) by (.*?)"/,
                        /title="(.*?) by (.*?)"/,
                        /title="(.*?) - (.*?)"/
                    ];
                    for (let p of patterns) {
                        const m = data.html.match(p);
                        if (m && m[1] && m[2]) {
                            title = m[1].trim();
                            artist = m[2].trim();
                            break;
                        }
                    }
                }

                // Fallback: Check "Title by Artist" in the title field itself
                if (!artist && title.includes(' by ')) {
                    const parts = title.split(' by ');
                    title = parts[0].trim();
                    artist = parts[1].trim();
                }

                // iTunes Verification for accuracy (only if artist is still generic)
                if ((!artist || artist === "a silent composer") && title) {
                    try {
                        const itunesResp = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(title)}&media=music&limit=1`);
                        const itunesData = await itunesResp.json();
                        if (itunesData.results && itunesData.results[0]) {
                            artist = itunesData.results[0].artistName;
                        }
                    } catch (e) { }
                }

                topSongData = {
                    title: title,
                    artist: artist || "a silent composer",
                    thumbnail: data.thumbnail_url?.replace('100x100', '600x600'), // Try high res if possible
                    previewUrl: null // Spotify oembed doesn't give preview audio
                };
            }
        } catch (e) {
            console.warn("Spotify Resolve Failed", e);
        }
    }

    if (topSongKey && !topSongData) {
        const parts = topSongKey.split('|');
        const title = parts[0].trim();
        const artist = parts[1] ? parts[1].trim() : '';

        // Dynamic fetch from iTunes for metadata
        const metadata = await fetchSongMetadata(title, artist);
        if (metadata) {
            topSongData = {
                title: metadata.trackName,
                artist: metadata.artistName,
                thumbnail: metadata.artworkUrl100.replace('100x100', '600x600'), // High res
                previewUrl: metadata.previewUrl // MP4/M4A audio
            };
        } else {
            topSongData = {
                title: title || "an unnamed mystery",
                artist: artist || "a silent composer",
                thumbnail: null,
                previewUrl: null
            };
        }
    }

    // 4. Calculate Most Visited Location
    const clusterKeys = Object.keys(locationClusters);
    const topCluster = clusterKeys.length > 0
        ? clusterKeys.reduce((a, b) => locationClusters[a] > locationClusters[b] ? a : b)
        : null;

    let mostVisitedName = "Earth";
    let mostVisitedCount = entries.length;

    if (topCluster) {
        const [lat, lng] = topCluster.split(',').map(Number);
        mostVisitedName = await getReverseGeocode(lat, lng);
        mostVisitedCount = locationClusters[topCluster];
    }

    // 5. Calculate Dominant Color
    const dominantColor = Object.keys(colorCounts).reduce((a, b) => colorCounts[a] > colorCounts[b] ? a : b, 'black');

    const finalData = {
        year,
        totalEntries: entries.length,
        totalDistance: Math.round(totalDistance),
        locations, // For map
        totalViews: totalViews || 67, // Easter egg if 0
        mostVisitedLocation: { name: mostVisitedName.toLowerCase(), count: mostVisitedCount },
        dominantColor: {
            name: dominantColor,
            hex: getColorHex(dominantColor),
            meaning: getColorMeaning(dominantColor)
        },
        topSong: topSongData,
        longestEntry: {
            text: (longestEntry.text || longestEntry.content || '').substring(0, 150) + '...',
            wordContent: (longestEntry.text || longestEntry.content || ''), // Full for calc
            wordCount: (longestEntry.text || longestEntry.content || '').split(' ').length
        },
        firstEntry: {
            text: (entries[0].text || entries[0].content || '').substring(0, 50) + '...',
            date: new Date(entries[0].timestamp).toLocaleDateString()
        },
        lastEntry: {
            text: (entries[entries.length - 1].text || entries[entries.length - 1].content || '').substring(0, 50) + '...',
            date: new Date(entries[entries.length - 1].timestamp).toLocaleDateString()
        },
        mediaCount,
        songCount: songCount,
        likeCount: totalLikes
    };


    // Calculate Sonder Spirit
    finalData.spirit = calculateSpirit(finalData);

    // --- DEBUG REPORT ---
    console.group("✨ SONDER WRAPPED REPORT ✨");
    console.log(`User ID: ${userId}`);
    console.log(`Total Entries Found: ${entries.length}`);
    console.log(`Total Distance: ${totalDistance} km`);
    console.log(`Most Visited: ${mostVisitedName} (${mostVisitedCount} times)`);
    console.log(`Top Song (Raw): ${topSongKey || 'None'}`);
    console.log(`Top Song (Resolved):`, topSongData);
    console.log(`Dominant Color: ${dominantColor}`);
    console.groupEnd();

    return finalData;
}

// --- Sonder Spirit System (V2) ---
function calculateSpirit(data) {
    const scores = {
        "The Voyager": data.totalDistance / 2000,
        "The Daily Poet": data.totalEntries / 100,
        "The Deep Mirror": (data.longestEntry.wordCount || 0) / 500,
        "The Curator": (data.mediaCount || 0) / 20,
        "The Melodic Soul": (data.songCount || 0) / 20,
        "The Luminary": (data.totalViews || 0) / 5000,
        "The Beloved": (data.likeCount || 0) / 20 // Rewarding likes
    };

    let winningSpirit = "The Silent Presence";
    let maxScore = 0.95;

    for (const [spirit, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            winningSpirit = spirit;
        }
    }
    return winningSpirit;
}

const SPIRIT_DATA = {
    "The Voyager": { nature: "the wanderer", traits: "restless • observant • boundary-less", description: "your journey was one of constant motion.", theme: "voyager", color: "#00d4ff" },
    "The Daily Poet": { nature: "the observer", traits: "consistent • gentle • detail-oriented", description: "a life lived in the beauty of the everyday.", theme: "poet", color: "#d4a5ff" },
    "The Deep Mirror": { nature: "the philosopher", traits: "introspective • dense • silent", description: "you found depth in the quietest thoughts.", theme: "mirror", color: "#4a90e2" },
    "The Curator": { nature: "the guardian", traits: "selective • visual • preservative", description: "you captured the world through a lens of memory.", theme: "curator", color: "#ff6b9d" },
    "The Melodic Soul": { nature: "the harmony", traits: "rhythmic • emotional • echoing", description: "your year was a soundtrack of echoes.", theme: "melodic", color: "#ff9500" },
    "The Luminary": { nature: "the beacon", traits: "radiant • inspiring • magnetic", description: "your presence resonated far beyond your own eyes.", theme: "luminary", color: "#ffd700" },
    "The Beloved": { nature: "the heart", traits: "connected • warm • resonant", description: "your echoes were deeply felt by many.", theme: "beloved", color: "#ff4757" },
    "The Silent Presence": { nature: "the seed", traits: "latent • infinite • still", description: "a quiet journey, deeply felt.", theme: "silent", color: "#95a5a6" }
};


async function fetchSongMetadata(title, artist) {
    // ABORT if artist is missing to avoid "Hilary Duff" generic matches
    if (!artist || artist.trim() === '') {
        console.warn(`[WRAPPED] Skipping Search: No Artist provided for "${title}". Preventing bad match.`);
        return null;
    }

    try {
        const query = encodeURIComponent(`${title} ${artist}`);
        const res = await fetch(`https://itunes.apple.com/search?term=${query}&media=music&limit=1`);
        const data = await res.json();

        if (data.results && data.results.length > 0) {
            const track = data.results[0];
            // Verification: Log the match
            console.log(`[WRAPPED] Song Match Check: Wanted "${title}" by "${artist}" -> Found "${track.trackName}" by "${track.artistName}"`);

            // Optional strict check: if artist name is totally different, ignore?
            // Simple robust check:
            if (artist && !track.artistName.toLowerCase().includes(artist.toLowerCase())) {
                console.warn(`[WRAPPED] Potential Mismatch: Artist "${artist}" vs "${track.artistName}"`);
            }

            return track;
        } else {
            console.warn(`[WRAPPED] Song Not Found on iTunes: ${title} ${artist}`);
            return null;
        }
    } catch (e) {
        console.warn("iTunes Fetch Failed", e);
        return null;
    }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Helper for reverse geocoding
async function getReverseGeocode(lat, lng) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`);
        const data = await res.json();

        if (data && data.address) {
            // Priority: city_district > neighborhood > city > town > state
            const addr = data.address;
            return addr.city_district || addr.neighborhood || addr.suburb || addr.city || addr.town || addr.village || addr.state || "Earth";
        }
        return "Earth";
    } catch (e) {
        console.warn("Geocode Failed:", e);
        return "Earth";
    }
}

const SOUL_ARCHETYPES = {
    'black': {
        title: 'black: the observer',
        description: 'you find depth where others see void. your journey was one of profound introspection, anchored in the beauty of the unseen and the power of silence.'
    },
    'pink': {
        title: 'pink: the empath',
        description: 'you moved through the year with a soft resonance, your heart tuned to the subtle frequencies of kindness and the courage of vulnerability.'
    },
    'yellow': {
        title: 'yellow: the optimist',
        description: 'a seeker of light in every transition. your year was defined by an intentional pull toward warmth and the quiet strength of hope.'
    },
    'blue': {
        title: 'blue: the architect',
        description: 'depth over surface. you found clarity in the stillness, treating the year as a series of calm, deep breaths and thoughtful reflections.'
    },
    'green': {
        title: 'green: the harmonizer',
        description: 'in search of balance. you moved with a steady cadence, grounding the world around you while growing quietly within your own inner forest.'
    },
    'purple': {
        title: 'purple: the visionary',
        description: 'a mind that wanders beyond the familiar. you spent the year weaving dreams into reality, seeing magic where others saw only day and night.'
    },
    'orange': {
        title: 'orange: the kinetic',
        description: 'energy in motion. your year was a vibrant dance of action and intent, a refusal to stay still when there was so much life to be inhaled.'
    }
};

function getColorHex(name) {
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

function getColorMeaning(name) {
    return SOUL_ARCHETYPES[name]?.description || "your soul resonance";
}

function populateSlides() {
    // Populate text content as before...

    // Slide 2: Map
    // (Map is initialized when slide becomes active)
    gsap.set('#distanceStat', { textContent: 0 });

    // Slide 3: Memory
    gsap.set('#memoryStat', { textContent: 0 });

    // Slide 4: Location
    gsap.set('#visitStat', { textContent: 0 });
    document.getElementById('topLocation').textContent = wrappedData.mostVisitedLocation.name;

    // Slide 5: Soul Portrait
    const color = wrappedData.dominantColor.name.toLowerCase();
    const archetype = SOUL_ARCHETYPES[color] || SOUL_ARCHETYPES['black'];
    const colorHex = wrappedData.dominantColor.hex;

    // Set CSS Var for Aura and Glow
    document.documentElement.style.setProperty('--wrapped-color-hex', colorHex);

    // Dynamic Slide Background based on color
    const slide5 = document.querySelector('[data-slide="4"]');
    if (slide5) {
        slide5.style.background = `radial-gradient(circle at center, ${colorHex}33 0%, #000 100%)`;
    }
    const colorSwatch = document.querySelector('.color-swatch');
    if (colorSwatch) {
        colorSwatch.style.background = colorHex;
        colorSwatch.style.boxShadow = `0 0 60px ${colorHex}80`;
    }

    const soulArchetype = document.getElementById('soulArchetype');
    const colorMeaning = document.getElementById('colorMeaning');

    if (soulArchetype) {
        const parts = archetype.title.split(':');
        if (parts.length > 1) {
            soulArchetype.innerHTML = `<span class="soul-title-prefix">${parts[0]}:</span> ${parts[1]}`;
        } else {
            soulArchetype.textContent = archetype.title;
        }
    }
    if (colorMeaning) colorMeaning.textContent = archetype.description;

    // Slide 6: Song - Dynamic Embed with Fallback
    const songArtwork = document.getElementById('songArtwork');
    const songTitle = document.getElementById('songTitle');
    const songArtist = document.getElementById('songArtist');

    if (wrappedData.topSong && wrappedData.topSong.title && wrappedData.topSong.title !== 'Unknown Song') {
        songTitle.textContent = wrappedData.topSong.title.toLowerCase();
        songArtist.textContent = (wrappedData.topSong.artist || "the architect of sound").toLowerCase();

        if (wrappedData.topSong.thumbnail) {
            songArtwork.innerHTML = `<img src="${wrappedData.topSong.thumbnail}" alt="Song Artwork" class="song-img">`;
            songArtwork.style.display = 'flex';
        } else {
            // Premium fallback icon if no thumbnail but we have a song
            songArtwork.innerHTML = `<div class="song-img-fallback">echo</div>`;
            songArtwork.style.display = 'flex';
        }

        songTitle.style.display = 'block';
        songArtist.style.display = 'block';
    } else {
        // "No Music" Cinematic State
        songArtwork.style.display = 'none';
        songTitle.textContent = "the world was your only melody";
        songArtist.textContent = "a year spent in quiet harmony";
        songTitle.style.display = 'block';
        songArtist.style.display = 'block';
    }

    // Slide 7: Entry
    const longestEntryText = (wrappedData.longestEntry.text || "...").trim();
    if (longestEntryText !== "...") {
        document.querySelector('#longestEntry .entry-text').textContent = longestEntryText;
        document.getElementById('wordCount').textContent = `${wrappedData.longestEntry.wordCount} words`;
    } else {
        document.querySelector('#longestEntry .entry-text').textContent = "your deepest thoughts remained unwritten.";
        document.getElementById('wordCount').textContent = "a year of quiet introspection";
    }

    // Slide 8: First/Last
    const firstText = (wrappedData.firstEntry.text || "...").trim();
    const lastText = (wrappedData.lastEntry.text || "...").trim();

    document.getElementById('firstEntry').textContent = firstText !== "..." ? firstText : "the first echo of your journey";
    document.getElementById('firstDate').textContent = wrappedData.firstEntry.date || "2026";
    document.getElementById('lastEntry').textContent = lastText !== "..." ? lastText : "the latest chapter of your story";
    document.getElementById('lastDate').textContent = wrappedData.lastEntry.date || "2026";

    // Slide 9: Views
    gsap.set('#viewStat', { textContent: 0 });

    // Slide 10: Spirit
    if (wrappedData.spirit) {
        document.getElementById('spiritName').textContent = wrappedData.spirit;
        document.getElementById('spiritDescription').textContent = SPIRIT_DATA[wrappedData.spirit].description;

        // Dynamic Accent for the CSS highlight
        if (wrappedData.dominantColor) {
            document.documentElement.style.setProperty('--accent-color', wrappedData.dominantColor.hex);
        }
    }

    // --- Dynamic Music Backdrop Preloading ---
    if (wrappedData.topSong && wrappedData.topSong.thumbnail) {
        const bgImg = new Image();
        bgImg.src = wrappedData.topSong.thumbnail;
        bgImg.onload = () => {
            const musicBg = document.getElementById('wrappedMusicBg');
            if (musicBg) {
                musicBg.style.backgroundImage = `url(${wrappedData.topSong.thumbnail})`;
            }
        };
    }
}

// Audio Logic
const bgAudio = document.getElementById('wrappedAudio');
const songAudio = new Audio(); // Dedicated audio for top song
const muteBtn = document.getElementById('muteBtn');
let isMuted = false;

// Initialize volumes
bgAudio.volume = 0.4;
songAudio.volume = 0.6;

function initAudio() {
    // We now wait for the Start Button click to play audio
    const startBtn = document.getElementById('startBtn');
    const startOverlay = document.getElementById('startOverlay');

    startBtn.addEventListener('click', () => {
        // 1. Play Audio (Guaranteed to work)
        bgAudio.play().then(() => {
            console.log("Audio started successfully");
        }).catch(e => console.warn("Audio failed:", e));

        // 2. Hide Overlay
        startOverlay.classList.add('hidden');

        // 3. Start Experience
        isFirstLoad = false; // Allow animations now
        showSlide(0); // Trigger slide 0 WITH animations
    });
}

// Mute Toggle
muteBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Don't pause slide
    isMuted = !isMuted;
    bgAudio.muted = isMuted;
    songAudio.muted = isMuted;
    muteBtn.classList.toggle('muted', isMuted);

    // If unmuting, ensure playing
    if (!isMuted && bgAudio.paused && currentSlide !== 5) bgAudio.play();
});

function setupInteractions() {
    // Press and hold to pause
    const container = document.getElementById('wrappedContainer');

    // Ensure audio plays on interaction if it failed somehow
    const ensureAudio = () => {
        if (bgAudio.paused && !isMuted && currentSlide !== 5) bgAudio.play().catch(e => { });
    };

    const pause = () => {
        ensureAudio(); // Try playing again on interaction
        isPaused = true;
        // Progress bar is CSS-based, stop timer and capture width
        clearTimeout(slideTimer);
        const bar = document.querySelector(`.progress-bar[data-slide="${currentSlide}"]`);
        if (bar) {
            const computedWidth = window.getComputedStyle(bar).width;
            bar.style.transition = 'none';
            bar.style.width = computedWidth;
        }
        container.style.transform = "scale(0.98)";
    };

    const resume = () => {
        if (!isPaused) return;
        // Don't auto-resume if manually paused by the button
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn && pauseBtn.classList.contains('paused')) return;

        isPaused = false;
        container.style.transform = "scale(1)";
        // Resume timer
        let duration = (currentSlide === 5) ? 15000 : 5000;
        startSlideTimer(duration);
    };

    // Mouse/Touch events for pausing
    container.addEventListener('mousedown', pause);
    container.addEventListener('mouseup', resume);
    container.addEventListener('touchstart', pause);
    container.addEventListener('touchend', resume);

    // Buttons shouldn't trigger navigation/pause
    document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('touchstart', e => e.stopPropagation());
        btn.addEventListener('mousedown', e => e.stopPropagation());
    });
}

function startSlideTimer(duration = 5000) {
    clearTimeout(slideTimer);
    if (currentSlide >= totalSlides - 1) return;

    // Check if manually paused via button
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn && pauseBtn.classList.contains('paused')) {
        isPaused = true;
        return;
    }

    // Animate progress bar with double RAF to ensure transition works on first load
    const targetSlide = currentSlide;
    const bar = document.querySelector(`.progress-bar[data-slide="${targetSlide}"]`);
    if (bar) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                // Double check if we are still on the same slide
                if (bar && currentSlide === targetSlide) {
                    bar.style.transition = `width ${duration}ms linear`;
                    bar.style.width = '100%';
                }
            });
        });
    }

    slideTimer = setTimeout(() => {
        if (!isPaused) {
            navigateSlide(1);
        }
    }, duration);
}

function resetSlideTimer() {
    clearTimeout(slideTimer);
}

function setupNavigation() {
    document.getElementById('wrappedClose').addEventListener('click', () => window.location.href = 'my-entries.html');

    // Tap Navigation (Left 30% = Back, Right 70% = Next)
    document.getElementById('wrappedContainer').addEventListener('click', (e) => {
        // Ignore if clicking internal interactive elements or pause button area
        if (e.target.closest('.wrapped-btn') || e.target.closest('.wrapped-pause')) return;

        if (e.clientX < window.innerWidth * 0.3) {
            navigateSlide(-1);
        } else {
            navigateSlide(1);
        }
    });

    // Manual Pause Toggle Button
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
        pauseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isCurrentlyPaused = pauseBtn.classList.toggle('paused');

            if (isCurrentlyPaused) {
                isPaused = true;
                clearTimeout(slideTimer);
                const bar = document.querySelector(`.progress-bar[data-slide="${currentSlide}"]`);
                if (bar) {
                    const computedWidth = window.getComputedStyle(bar).width;
                    bar.style.transition = 'none';
                    bar.style.width = computedWidth;
                }
            } else {
                isPaused = false;
                let duration = (currentSlide === 5) ? 15000 : (currentSlide === 9) ? 20000 : 5000;
                startSlideTimer(duration);
            }
        });
    }

    // Spirit Toggle Button
    const spiritToggle = document.getElementById('spiritToggle');
    if (spiritToggle) {
        spiritToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const content = document.querySelector('.spirit-content');
            if (content) {
                const isHidden = !spiritToggle.classList.contains('hidden');
                spiritToggle.classList.toggle('hidden');

                gsap.to(content, {
                    opacity: isHidden ? 0 : 1,
                    y: isHidden ? 30 : 0,
                    duration: 1,
                    ease: "power4.inOut",
                    pointerEvents: isHidden ? 'none' : 'auto'
                });
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') navigateSlide(-1);
        if (e.key === 'ArrowRight') navigateSlide(1);
        if (e.key === 'Escape') window.location.href = 'my-entries.html';
    });

    document.getElementById('shareWrapped').addEventListener('click', shareWrapped);
    document.getElementById('returnHome').addEventListener('click', () => window.location.href = 'index.html');
}

function navigateSlide(direction) {
    const newSlide = currentSlide + direction;
    if (newSlide >= 0 && newSlide < totalSlides) {
        showSlide(newSlide);
    }
}

function showSlide(index) {
    resetSlideTimer();

    // Update Previous Bars (Fill them instantly)
    for (let i = 0; i < index; i++) {
        const bar = document.querySelector(`.progress-bar[data-slide="${i}"]`);
        if (bar) {
            bar.style.transition = 'none';
            bar.offsetWidth; // Force reflow
            bar.style.width = '100%';
        }
    }

    // Reset Current & Future Bars
    for (let i = index; i < totalSlides; i++) {
        const bar = document.querySelector(`.progress-bar[data-slide="${i}"]`);
        if (bar) {
            bar.style.transition = 'none';
            bar.offsetWidth; // Force reflow
            bar.style.width = '0%';
        }
    }

    const prevSlide = currentSlide;
    currentSlide = index;

    // AUDIO SWITCHING LOGIC
    manageAudio(index);

    // DURATION LOGIC
    // Default 5s, but Slide 5 (Song) gets 15s, and Slide 9 (Spirit) gets 20s for interaction
    let currentDuration = slideDuration;
    if (index === 5) currentDuration = 15000;
    if (index === 9) currentDuration = 20000;

    // Slide Visibility (Toggle this BEFORE initSpiritView so dimensions are available)
    document.querySelectorAll('.wrapped-slide').forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
    });

    // Specific Actions
    if (index === 1) initMap();

    // Toggle Music Backdrop (Slide 5 Only)
    const musicBg = document.getElementById('wrappedMusicBg');
    if (musicBg) {
        musicBg.classList.toggle('active', index === 5);
    }

    if (index === 9) {
        console.log("Initializing Spirit View for:", wrappedData.spirit);
        initSpiritView();
    }

    if (!isFirstLoad) {
        animateSlide(index);
        startSlideTimer(currentDuration);
    }
}

let spiritOrbInstance = null;
let spiritInitializing = false;

function initSpiritView() {
    if (spiritInitializing) return;
    spiritInitializing = true;

    // Cleanup old instance if it exists
    if (spiritOrbInstance) {
        spiritOrbInstance.destroy();
        spiritOrbInstance = null;
    }

    const container = document.getElementById('spiritContainer');
    if (!container) {
        spiritInitializing = false;
        return;
    }

    try {
        const spiritKey = wrappedData.spirit;
        const spiritInfo = SPIRIT_DATA[spiritKey] || SPIRIT_DATA["The Silent Presence"];

        // Update Text
        const nameEl = document.getElementById('spiritName');
        const descEl = document.getElementById('spiritDescription');
        const natureEl = document.getElementById('spiritNature');
        const traitsEl = document.getElementById('spiritTraits');

        if (nameEl) nameEl.textContent = spiritKey;
        if (descEl) descEl.textContent = spiritInfo.description;
        if (natureEl) natureEl.textContent = spiritInfo.nature;
        if (traitsEl) traitsEl.textContent = spiritInfo.traits;

        // Start closer for the reveal effect
        spiritOrbInstance = new SpiritOrb(container, spiritKey);

        // Cinematic Reveal Zoom Out
        gsap.fromTo(spiritOrbInstance.camera.position,
            { z: 2 },
            { z: 5, duration: 3, ease: "power2.out" }
        );
    } catch (e) {
        console.error("Spirit View Crash:", e);
    }
    spiritInitializing = false;
}

class SpiritOrb {
    constructor(container, type) {
        if (typeof THREE === 'undefined') return;
        this.container = container;
        this.type = type || "The Silent Presence";
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(this.renderer.domElement);

        this.camera.position.z = 5;
        this.camera.position.y = 0; // Perfectly centered

        // Lighting - Critical for PBR/Standard materials
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 2.0);
        pointLight.position.set(5, 5, 5);
        this.scene.add(pointLight);

        // Interaction Tracking
        this.mouse = new THREE.Vector2();
        this.targetRotation = new THREE.Vector2();
        this.currentRotation = new THREE.Vector2();

        // Theming - Use archetype's signature color
        const spiritInfo = SPIRIT_DATA[this.type] || SPIRIT_DATA["The Silent Presence"];
        this.accentColor = spiritInfo.color || "#ffd700";

        this.initVisuals();
        this.animate();
        this.setupEvents();
    }

    destroy() {
        this.stopAnimate = true;
        window.removeEventListener('resize', this.onResizeRef);
        window.removeEventListener('mousemove', this.onMouseMoveRef);

        // GPU Cleanup
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer.forceContextLoss();
        }

        this.scene.traverse((object) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(m => m.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });

        if (this.container) this.container.innerHTML = '';
    }

    setupEvents() {
        this.onResizeRef = () => this.onResize();
        this.onMouseMoveRef = (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            this.targetRotation.x = this.mouse.y * 0.3;
            this.targetRotation.y = this.mouse.x * 0.3;
        };

        window.addEventListener('resize', this.onResizeRef);
        window.addEventListener('mousemove', this.onMouseMoveRef);

        // Pause/Resume on interaction
        this.container.addEventListener('mouseenter', () => isPaused = true);
        this.container.addEventListener('mouseleave', () => isPaused = false);
    }

    onResize() {
        if (!this.container) return;
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    initVisuals() {
        const type = this.type;

        // 1. Background Constellation (Stardust)
        this.createStardust();

        // 2. Main Spirit Mesh
        switch (type) {
            case "The Voyager": this.createVoyager(); break;
            case "The Melodic Soul": this.createMelodic(); break;
            case "The Deep Mirror": this.createMirror(); break;
            case "The Curator": this.createCurator(); break;
            case "The Daily Poet": this.createPoet(); break;
            case "The Luminary": this.createLuminary(); break;
            case "The Beloved": this.createBeloved(); break;
            default: this.createSilent();
        }
    }

    createStardust() {
        const geometry = new THREE.BufferGeometry();
        const verts = [];
        const count = 1500;

        for (let i = 0; i < count; i++) {
            verts.push(
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 15
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
        const material = new THREE.PointsMaterial({
            color: this.accentColor,
            size: 0.04,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });

        this.stardust = new THREE.Points(geometry, material);
        this.scene.add(this.stardust);
    }

    createVoyager() {
        this.group = new THREE.Group();

        // Orbital Rings
        for (let i = 0; i < 3; i++) {
            const geo = new THREE.TorusGeometry(1.5 + (i * 0.4), 0.015, 16, 100);
            const mat = new THREE.MeshBasicMaterial({
                color: this.accentColor,
                transparent: true,
                opacity: 0.6 - (i * 0.15)
            });
            const ring = new THREE.Mesh(geo, mat);
            ring.rotation.x = Math.random() * Math.PI;
            ring.rotation.y = Math.random() * Math.PI;
            this.group.add(ring);
        }

        // Speed Particles
        const streakGeo = new THREE.BufferGeometry();
        const streakVerts = [];
        for (let i = 0; i < 200; i++) {
            streakVerts.push((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
        }
        streakGeo.setAttribute('position', new THREE.Float32BufferAttribute(streakVerts, 3));
        this.streaks = new THREE.Points(streakGeo, new THREE.PointsMaterial({ color: "#fff", size: 0.08, transparent: true, opacity: 0.8 }));
        this.group.add(this.streaks);

        this.scene.add(this.group);
    }

    createMelodic() {
        const geometry = new THREE.SphereGeometry(2, 64, 64);
        const material = new THREE.MeshBasicMaterial({
            color: this.accentColor,
            wireframe: true,
            transparent: true,
            opacity: 0.7
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);

        // Swirling Spiral Particles
        const spiralGeo = new THREE.BufferGeometry();
        const spiralVerts = [];
        for (let i = 0; i < 500; i++) {
            const angle = 0.1 * i;
            const x = (1 + 0.1 * angle) * Math.cos(angle);
            const y = (1 + 0.1 * angle) * Math.sin(angle);
            const z = (Math.random() - 0.5) * 2;
            spiralVerts.push(x, y, z);
        }
        spiralGeo.setAttribute('position', new THREE.Float32BufferAttribute(spiralVerts, 3));
        this.spiral = new THREE.Points(spiralGeo, new THREE.PointsMaterial({ color: this.accentColor, size: 0.05 }));
        this.scene.add(this.spiral);
    }

    createMirror() {
        const geometry = new THREE.IcosahedronGeometry(2, 0);
        const material = new THREE.MeshStandardMaterial({
            color: this.accentColor,
            metalness: 0.9,
            roughness: 0.1,
            transparent: true,
            opacity: 0.8,
            wireframe: false
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);

        // Inner Core
        const coreGeo = new THREE.SphereGeometry(0.4, 32, 32);
        const coreMat = new THREE.MeshBasicMaterial({ color: "#fff" });
        this.core = new THREE.Mesh(coreGeo, coreMat);
        this.scene.add(this.core);

        // Outline
        const wireGeo = new THREE.IcosahedronGeometry(2.1, 0);
        const wireMat = new THREE.MeshBasicMaterial({ color: "#fff", wireframe: true, transparent: true, opacity: 0.2 });
        this.scene.add(new THREE.Mesh(wireGeo, wireMat));
    }

    createCurator() {
        const geometry = new THREE.TorusKnotGeometry(1.2, 0.4, 100, 16);
        const material = new THREE.MeshBasicMaterial({
            color: this.accentColor,
            wireframe: true,
            transparent: true,
            opacity: 0.6
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);

        // Grid Particles
        const gridGeo = new THREE.BufferGeometry();
        const gridVerts = [];
        for (let i = -2; i <= 2; i++) {
            for (let j = -2; j <= 2; j++) {
                gridVerts.push(i * 1.5, j * 1.5, (Math.random() - 0.5) * 0.5);
            }
        }
        gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gridVerts, 3));
        this.grid = new THREE.Points(gridGeo, new THREE.PointsMaterial({ color: "#fff", size: 0.1 }));
        this.scene.add(this.grid);
    }

    createPoet() {
        const geometry = new THREE.DodecahedronGeometry(1.8, 0);
        const material = new THREE.MeshBasicMaterial({
            color: this.accentColor,
            wireframe: true,
            transparent: true,
            opacity: 0.4
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);

        // Expanding/Contracting Cloud
        const cloudGeo = new THREE.SphereGeometry(2.5, 32, 32);
        const cloudMat = new THREE.PointsMaterial({ color: this.accentColor, size: 0.03, transparent: true, opacity: 0.2 });
        this.cloud = new THREE.Points(cloudGeo, cloudMat);
        this.scene.add(this.cloud);
    }

    createBeloved() {
        this.group = new THREE.Group();

        // Organic Heart-like Shape (Dodecahedron with deformation)
        const geometry = new THREE.IcosahedronGeometry(1.8, 1);
        const material = new THREE.MeshBasicMaterial({
            color: this.accentColor,
            wireframe: true,
            transparent: true,
            opacity: 0.6
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.group.add(this.mesh);

        // Pulsing Aura Particles
        const auraGeo = new THREE.BufferGeometry();
        const auraVerts = [];
        for (let i = 0; i < 800; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const r = 2.5 + (Math.random() * 0.5);
            auraVerts.push(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
        }
        auraGeo.setAttribute('position', new THREE.Float32BufferAttribute(auraVerts, 3));
        this.aura = new THREE.Points(auraGeo, new THREE.PointsMaterial({ color: "#fff", size: 0.04, transparent: true, opacity: 0.3 }));
        this.group.add(this.aura);

        this.scene.add(this.group);
    }

    createLuminary() {
        this.group = new THREE.Group();

        // Central Star
        const starGeo = new THREE.IcosahedronGeometry(1, 2);
        const starMat = new THREE.MeshBasicMaterial({ color: "#fff" });
        this.star = new THREE.Mesh(starGeo, starMat);
        this.group.add(this.star);

        // Core Glow
        const glowGeo = new THREE.SphereGeometry(1.5, 32, 32);
        const glowMat = new THREE.MeshBasicMaterial({ color: this.accentColor, transparent: true, opacity: 0.3 });
        this.group.add(new THREE.Mesh(glowGeo, glowMat));

        // Expanding Rings
        for (let i = 0; i < 5; i++) {
            const ringGeo = new THREE.TorusGeometry(1.2 + (i * 0.5), 0.01, 16, 100);
            const ringMat = new THREE.MeshBasicMaterial({ color: this.accentColor, transparent: true, opacity: 0.5 - (i * 0.1) });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            this.group.add(ring);
        }

        this.scene.add(this.group);
    }

    createSilent() {
        const geometry = new THREE.IcosahedronGeometry(2, 0); // Geometric but simple
        const material = new THREE.MeshBasicMaterial({
            color: this.accentColor,
            wireframe: true,
            transparent: true,
            opacity: 0.15
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);

        // Pulsing Core
        const coreGeo = new THREE.SphereGeometry(0.3, 32, 32);
        const coreMat = new THREE.MeshBasicMaterial({ color: "#fff", transparent: true, opacity: 0.8 });
        this.core = new THREE.Mesh(coreGeo, coreMat);
        this.scene.add(this.core);

        // Ethereal Dust
        const dustGeo = new THREE.BufferGeometry();
        const dustVerts = [];
        for (let i = 0; i < 300; i++) {
            dustVerts.push((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5);
        }
        dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(dustVerts, 3));
        this.dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: "#fff", size: 0.02, transparent: true, opacity: 0.5 }));
        this.scene.add(this.dust);
    }

    animate() {
        if (this.stopAnimate) return;
        requestAnimationFrame(() => this.animate());

        // Smooth Mouse Parallax
        this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.05;
        this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.05;

        // Apply Parallax to whole scene
        this.scene.rotation.x = this.currentRotation.x;
        this.scene.rotation.y = this.currentRotation.y;

        // Global Spin
        if (this.stardust) this.stardust.rotation.y += 0.0005;

        // Archetype Specific Motion
        const time = Date.now() * 0.001;

        if (this.group) {
            this.group.rotation.x += 0.005;
            this.group.rotation.y += 0.01;
            if (this.streaks) this.streaks.rotation.z += 0.02;
        }

        if (this.mesh) {
            this.mesh.rotation.y += 0.005;
            if (this.type === "The Melodic Soul") {
                this.mesh.scale.setScalar(1 + Math.sin(time * 2) * 0.1);
            }
            if (this.type === "The Daily Poet") {
                this.mesh.rotation.x += 0.01;
            }
        }

        if (this.star) {
            this.star.scale.setScalar(1 + Math.sin(time * 4) * 0.05);
            this.group.rotation.y += 0.01;
        }

        if (this.core) {
            this.core.scale.setScalar(0.8 + Math.sin(time * 2) * 0.2);
        }

        if (this.aura) {
            this.aura.rotation.y += 0.01;
            this.aura.scale.setScalar(1 + Math.sin(time * 1.5) * 0.15);
        }

        if (this.dust) this.dust.rotation.y += 0.001;

        if (this.spiral) this.spiral.rotation.z -= 0.01;
        if (this.cloud) this.cloud.scale.setScalar(1.2 + Math.sin(time) * 0.2);
        if (this.grid) {
            const positions = this.grid.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 2] = Math.sin(time + i) * 0.2;
            }
            this.grid.geometry.attributes.position.needsUpdate = true;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

function manageAudio(index) {
    if (index === 5) {
        // ENTERING Song Slide: Only switch if we have actual music data
        if (!isMuted && wrappedData.topSong && wrappedData.topSong.previewUrl) {
            fadeOut(bgAudio, () => {
                bgAudio.pause();
                songAudio.src = wrappedData.topSong.previewUrl;
                songAudio.play().catch(e => console.log("Song play failed", e));
                fadeIn(songAudio);
            });
        }
        // Otherwise, bgAudio keeps playing seamlessly
    } else {
        // LEAVING Song Slide
        if (!songAudio.paused) {
            fadeOut(songAudio, () => {
                songAudio.pause();
                if (!isMuted && !isFirstLoad) {
                    bgAudio.play().catch(e => console.warn("Audio Resume Failed:", e));
                    fadeIn(bgAudio);
                }
            });
        } else {
            if (bgAudio.paused && !isMuted && !isFirstLoad) {
                bgAudio.play().catch(e => console.warn("Audio Resume Failed:", e));
                fadeIn(bgAudio);
            }
        }
    }
}

function fadeOut(audioEl, callback) {
    if (audioEl.paused) {
        if (callback) callback();
        return;
    }
    const originalVol = audioEl === songAudio ? 0.6 : 0.4;
    gsap.to(audioEl, {
        volume: 0,
        duration: 1,
        onComplete: () => {
            if (callback) callback();
            audioEl.volume = originalVol;
        }
    });
}

function fadeIn(audioEl) {
    const targetVol = audioEl === songAudio ? 0.6 : 0.4;
    audioEl.volume = 0;
    gsap.to(audioEl, {
        volume: targetVol,
        duration: 1
    });
}

// --- Map Logic ---
// --- Map Logic ---
async function initMap(preload = false) {
    if (mapInstance && !preload) return; // Propagate if already initialized
    if (mapInstance && preload) return Promise.resolve(); // Already done

    const mapEl = document.getElementById('wrappedMapBg');
    if (!mapEl) return;

    return new Promise((resolve) => {
        mapInstance = L.map('wrappedMapBg', {
            zoomControl: false,
            attributionControl: false,
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false
        }).setView([14.5995, 120.9842], 3);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(mapInstance);

        if (wrappedData.locations.length > 1) {
            const latlngs = wrappedData.locations.map(l => [l.lat, l.lng]);

            // Ethereal "Stardust Path" - Multiple layers for glow
            // Base Glow
            L.polyline(latlngs, {
                color: '#ffd700',
                weight: 8,
                opacity: 0.3,
                lineCap: 'round'
            }).addTo(mapInstance);

            // Main Path
            const polyline = L.polyline(latlngs, {
                color: '#ffffff',
                weight: 4,
                opacity: 0.9,
                dashArray: '10, 15',
                lineCap: 'round'
            }).addTo(mapInstance);

            // Add Glowing Markers for each stop
            latlngs.forEach(latlng => {
                L.circleMarker(latlng, {
                    radius: 6,
                    fillColor: '#ffffff',
                    fillOpacity: 0.9,
                    color: '#ffd700',
                    weight: 2,
                    opacity: 0.6
                }).addTo(mapInstance);
            });

            mapInstance.fitBounds(polyline.getBounds(), { padding: [80, 80] });
        }

        // Wait for connection/readiness
        mapInstance.whenReady(() => {
            console.log("[WRAPPED] Map Initialized & Ready");
            // Add a small buffer for tile fetching
            if (preload) {
                setTimeout(resolve, 800); 
            } else {
                resolve();
            }
        });
    });
}

// --- Animations ---
function setupAnimations() {
    // Staggered Intro & Pulse for Slide 0 happens in animateSlide(0)

    if (document.querySelector('#colorBlob')) {
        gsap.to('#colorBlob', {
            rotation: 360,
            transformOrigin: "50% 50%",
            duration: 20,
            repeat: -1,
            ease: "none"
        });

        gsap.to('#colorBlob', {
            scale: 1.1,
            duration: 2,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut"
        });
    }

    initParticles();
}

function initParticles() {
    if (document.querySelector('.wrapped-particles')) return;

    const canvas = document.createElement('canvas');
    canvas.classList.add('wrapped-particles');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1';
    canvas.style.opacity = '0.6';

    const noise = document.querySelector('.noise-overlay');
    if (noise) {
        noise.parentNode.insertBefore(canvas, noise);
    } else {
        document.body.prepend(canvas);
    }

    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        createParticles();
    }

    function createParticles() {
        particles = [];
        const count = Math.floor(width * height / 15000);

        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 0.5,
                alpha: Math.random() * 0.5 + 0.2,
                t: Math.random() * Math.PI * 2
            });
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        for (let p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.t += 0.01;
            if (p.x < -10) p.x = width + 10;
            if (p.x > width + 10) p.x = -10;
            if (p.y < -10) p.y = height + 10;
            if (p.y > height + 10) p.y = -10;
            ctx.beginPath();
            const pulse = (Math.sin(p.t) + 1) * 0.5;
            const currentAlpha = p.alpha * (0.5 + pulse * 0.5);
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
            ctx.fill();
        }
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    resize();
    animate();
}

let memoryVoidInitialized = false;
function initMemoryVoid() {
    if (memoryVoidInitialized) return;
    const canvas = document.getElementById('memoryVoidCanvas');
    if (!canvas) return;
    memoryVoidInitialized = true;

    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    function resize() {
        width = canvas.parentElement.offsetWidth;
        height = canvas.parentElement.offsetHeight;
        canvas.width = width;
        canvas.height = height;
        createParticles();
    }

    function createParticles() {
        particles = [];
        // Exact count matches user memories. Minimum 1 to show *something* even if 0 (or handle 0 separately).
        // If 0, maybe we show 0? The user said "I have 3, so should be 3".
        const count = Math.max(wrappedData.totalEntries, 0); 
        
        // Dynamic size: Fewer memories = Larger, more significant orbs
        const baseSize = count < 10 ? 6 : 3;

        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                size: Math.random() * 4 + baseSize, // Larger base size
                alpha: Math.random() * 0.6 + 0.2, // Higher base alpha
                t: Math.random() * Math.PI * 2
            });
        }
    }

    function animate() {
        const slide2 = document.querySelector('.wrapped-slide[data-slide="2"]');
        if (!slide2 || !slide2.classList.contains('active')) {
            requestAnimationFrame(animate);
            return;
        }

        // Force resize check if dimensions are suspicious
        if (width <= 0 || height <= 0 || canvas.width === 0) {
            console.log("Memory Void: Resizing canvas (0 dimensions found)...");
            resize();
        }

        ctx.clearRect(0, 0, width, height);
        
        // Ensure ctx settings are consistent
        ctx.shadowBlur = 0; 
        
        for (let p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.t += 0.02;

            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            const pulse = (Math.sin(p.t) + 1) * 0.5;
            ctx.beginPath();
            
             // Size breathing (Keep larger size for visibility)
            ctx.arc(p.x, p.y, p.size * (1 + pulse * 0.2), 0, Math.PI * 2);
            
            // Render: Soft White/Cyan with high opacity for visibility
            ctx.fillStyle = `rgba(220, 245, 255, ${p.alpha * 0.4 + 0.6})`; 
            ctx.fill();

            // Add a tiny glow - increased for visibility
            if (pulse > 0.5) {
                ctx.shadowBlur = 15 * pulse;
                ctx.shadowColor = 'rgba(140, 210, 255, 0.8)';
            } else {
                ctx.shadowBlur = 0;
            }
        }

        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    resize();
    animate();
}

function animateSlide(index) {
    console.log(`%c[ANIMATE] Triggering Slide ${index}`, "color: #00ff00; font-weight: bold;");
    const slide = document.querySelector(`.wrapped-slide[data-slide="${index}"]`);
    if (!slide) return;

    if (index === 0) {
        // Slide 1 (Intro) Specific Cinematic Reveal
        const title = slide.querySelector('.wrapped-title');
        const year = slide.querySelector('.wrapped-year');
        const subtitle = slide.querySelector('.wrapped-subtitle');

        const targets = [title, year, subtitle].filter(el => el !== null);
        console.log(`[ANIMATE] Slide 0 Targets found: ${targets.length}`);
        if (targets.length === 0) return;

        // Reset positions - FORCE VISIBILITY logic
        gsap.killTweensOf(targets);
        gsap.set(targets, { opacity: 0, y: 40, filter: 'blur(10px)', visibility: 'visible' });

        // Revealed instantly with a shorter stagger
        gsap.to(targets, {
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            duration: 1.5,
            stagger: 0.3,
            ease: "power2.out"
        });

        // Pulse Animation for Year (start after reveal)
        if (year) {
            gsap.to(year, {
                scale: 1.05,
                opacity: 0.9,
                duration: 3,
                yoyo: true,
                repeat: -1,
                ease: "sine.inOut",
                delay: 1.5
            });
        }
        return;
    }

    const elements = slide.querySelectorAll('.wrapped-title, .wrapped-stat, .wrapped-unit, .wrapped-description, .wrapped-location, .wrapped-color-display, .wrapped-song-card, .wrapped-entry-preview, .comparison-card, .wrapped-actions, .spirit-visual, .spirit-name, .soul-label, .analysis-line, .analysis-meta');

    if (elements.length > 0) {
        const isSpirit = index === 9;
        const isMap = index === 1;

        if (isMap) {
            // Cinematic Map Reveal (Zoom Out)
            const mapBg = document.getElementById('wrappedMapBg');
            console.log(`[ANIMATE] Slide 1 (Map) Background found: ${!!mapBg}`);
            if (mapBg) {
                gsap.killTweensOf(mapBg); // Clean start
                gsap.fromTo(mapBg, 
                    { scale: 1.4, opacity: 0, visibility: 'visible' },
                    { 
                        scale: 1, 
                        opacity: 0.5, 
                        duration: 2.5, 
                        ease: "power2.out",
                        onComplete: () => {
                            // Start slow cinematic drift
                            gsap.to(mapBg, {
                                scale: 1.1,
                                x: "2%",
                                y: "1%",
                                duration: 15,
                                ease: "sine.inOut",
                                yoyo: true,
                                repeat: -1
                            });
                        }
                    }
                );
            }
        }

        gsap.fromTo(elements,
            { y: 50, opacity: 0, filter: 'blur(10px)' },
            {
                y: 0,
                opacity: 1,
                filter: 'blur(0px)',
                duration: isSpirit ? 2.5 : 1,
                stagger: isSpirit ? 0.3 : 0.1,
                ease: isMap ? 'expo.out' : 'power3.out',
                onComplete: () => {
                    if (isSpirit) {
                        // Subtle floating animation for the info card
                        gsap.to('.spirit-info', {
                            y: -10,
                            duration: 3,
                            yoyo: true,
                            repeat: -1,
                            ease: "sine.inOut"
                        });
                    }
                }
            }
        );
    }

    if (index === 1 && document.querySelector('#distanceStat')) {
        // Slide 2: Map Reveal (Distance)
        animateCounter('#distanceStat', wrappedData.totalDistance);
    }

    if (index === 2 && document.querySelector('#memoryStat')) {
        // Slide 3: Memory Count Refined Reveal
        const memoryStat = document.querySelector('#memoryStat');
        const memoryTitle = slide.querySelector('.wrapped-title');
        const memoryUnit = slide.querySelector('.wrapped-unit');
        const memoryDesc = slide.querySelector('.wrapped-description');

        gsap.set([memoryStat, memoryTitle, memoryUnit, memoryDesc], { opacity: 0, scale: 0.8, filter: 'blur(15px)' });

        const tl = gsap.timeline();
        tl.to([memoryTitle, memoryStat, memoryUnit, memoryDesc], {
            opacity: 1,
            scale: 1,
            filter: 'blur(0px)',
            duration: 1.5,
            stagger: 0.2,
            ease: "back.out(1.7)"
        });

        animateCounter('#memoryStat', wrappedData.totalEntries);
        initMemoryVoid(); // Ensure canvas starts when slide is active
    }

    if (index === 3 && document.querySelector('#visitStat')) {
        // Slide 3: Most Visited Location
        const visitStat = document.querySelector('#visitStat');
        const visitTitle = slide.querySelector('.wrapped-title');
        const visitUnit = slide.querySelector('.wrapped-unit');
        const visitLoc = document.querySelector('#topLocation');
        const visitDesc = slide.querySelector('.wrapped-description');

        // Initial State (Clean)
        const elements = [visitTitle, visitStat, visitUnit, visitLoc, visitDesc];

        // KILL previous animations to prevent stacking/conflicts
        gsap.killTweensOf(elements);

        gsap.fromTo(elements, 
            { 
                y: 50, 
                opacity: 0, 
                filter: 'blur(10px)', 
                scale: 0.9,
                textShadow: "none" // Reset potentially lingering shadow from breathing
            },
            { 
                y: 0, 
                opacity: 1, 
                filter: 'blur(0px)', 
                scale: 1,
                duration: 1, 
                stagger: 0.15, 
                ease: 'expo.out',
                onComplete: () => {
                    // Start breathing animation safely after entrance
                    gsap.to(visitLoc, {
                        scale: 1.05,
                        textShadow: "0 0 30px rgba(255, 255, 255, 0.6)",
                        duration: 3,
                        repeat: -1,
                        yoyo: true,
                        ease: "sine.inOut"
                    });
                }
            }
        );

        animateCounter('#visitStat', wrappedData.mostVisitedLocation.count);
    }

    if (index === 4 && document.querySelector('.soul-portrait-content')) {
        // Slide 4: Soul Portrait Cinematic Reveal
        const archetype = document.querySelector('#soulArchetype');
        const colorDisplay = document.querySelector('#colorDisplay');
        const colorBlob = document.querySelector('#colorBlob');
        const soulOrb = document.querySelector('.soul-orb');
        const soulLabel = document.querySelector('.soul-label');
        const soulDesc = document.querySelector('#colorMeaning');
        const analysisLine = document.querySelector('.analysis-line');

        // Initial State
        gsap.set([archetype, soulLabel, soulDesc, analysisLine], { opacity: 0, y: 30, filter: 'blur(10px)' });
        gsap.set(colorDisplay, { opacity: 0, scale: 0.5 });
        gsap.set(soulOrb, { scale: 0.5, boxShadow: '0 0 0px rgba(0,0,0,0)' });
        // Force blob color update in case
        if(colorBlob) colorBlob.style.color = wrappedData.soulColor || '#ffffff';

        const tl = gsap.timeline();

        // 1. Label & Archetype
        tl.to(soulLabel, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: "power2.out" })
          .to(archetype, { 
              opacity: 1, 
              y: 0, 
              filter: 'blur(0px)', 
              duration: 1.2, 
              ease: "expo.out" 
          }, "-=0.8")

        // 2. The Soul Orb/Color Reveal (The "Cool" Part)
          .to(colorDisplay, { opacity: 1, scale: 1, duration: 1.5, ease: "back.out(1.5)" }, "-=0.8")
          .to(soulOrb, { 
              scale: 1, 
              boxShadow: `0 0 50px ${wrappedData.soulColorHex || 'rgba(255,255,255,0.4)'}`,
              duration: 2, 
              ease: "power2.out" 
          }, "-=1.2")

        // 3. Analysis/Description
          .to(analysisLine, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: "power2.out" }, "-=1.0")
          .to(soulDesc, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: "power2.out" }, "-=0.6");
    }

    if (index === 5 && document.querySelector('#topSong')) {
        // Slide 5: Top Song Cinematic Reveal
        const songTitle = slide.querySelector('.wrapped-title');
        const songCard = slide.querySelector('.wrapped-song-card');
        const songArt = slide.querySelector('.song-artwork');
        const songName = slide.querySelector('.song-title');
        const songArtist = slide.querySelector('.song-artist');
        const songDesc = slide.querySelector('.wrapped-description');

        // Initial State
        gsap.set([songTitle, songCard, songDesc], { opacity: 0, y: 30, filter: 'blur(10px)' });
        gsap.set(songArt, { scale: 0.5, rotation: -45, opacity: 0 });
        gsap.set([songName, songArtist], { opacity: 0, x: -20 });

        const tl = gsap.timeline();

        // 1. Header fades in
        tl.to(songTitle, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: "power2.out" })
          
          // 2. Vinyl "Drops" and Spins in
          .to(songCard, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8 }, "-=0.5")
          .to(songArt, { 
              opacity: 1, 
              scale: 1, 
              rotation: 0, 
              duration: 1.5, 
              ease: "elastic.out(1, 0.7)" 
          }, "-=0.8")

          // 3. Text slides in
          .to(songName, { opacity: 1, x: 0, duration: 0.8, ease: "power2.out" }, "-=1.0")
          .to(songArtist, { opacity: 1, x: 0, duration: 0.8, ease: "power2.out" }, "-=0.6")
          .to(songDesc, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: "power2.out" }, "-=0.6");
    }

    if (index === 6 && document.querySelector('#longestEntry')) {
        // Slide 6: Longest Entry Cinematic Reveal
        const longTitle = slide.querySelector('.wrapped-title');
        const entryPreview = slide.querySelector('#longestEntry');
        const entryText = slide.querySelector('.entry-text');
        const wordCount = slide.querySelector('#wordCount');
        const longDesc = slide.querySelector('.wrapped-description');

        // Initial State
        gsap.set([longTitle, entryPreview, entryText, wordCount, longDesc], { opacity: 0, y: 30, filter: 'blur(10px)' });
        gsap.set(entryPreview, { scale: 0.95 });

        const tl = gsap.timeline();

        // 1. Title fade
        tl.to(longTitle, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: "power2.out" })
          
          // 2. The Quote "Materializes"
          .to(entryPreview, { 
              opacity: 1, 
              y: 0, 
              scale: 1, 
              filter: 'blur(0px)', 
              duration: 1.2, 
              ease: "expo.out" 
          }, "-=0.6")
          
          // 3. Text content flows in
          .to(entryText, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: "power2.out" }, "-=0.8")

          // 4. Details appear
          .to(wordCount, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: "power2.out" }, "-=0.6")
          .to(longDesc, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: "power2.out" }, "-=0.8");
    }

    if (index === 7 && document.querySelector('.wrapped-comparison')) {
        // Slide 7: First & Last (Timeline Build)
        const compTitle = slide.querySelector('.wrapped-title');
        const firstCard = slide.querySelectorAll('.comparison-card')[0];
        const lastCard = slide.querySelectorAll('.comparison-card')[1];
        const arrow = slide.querySelector('.comparison-arrow');
        const compDesc = slide.querySelector('.wrapped-description');

        // Initial State
        gsap.set([compTitle, compDesc], { opacity: 0, y: 30, filter: 'blur(10px)' });
        gsap.set(firstCard, { opacity: 0, x: -50, filter: 'blur(5px)' });
        gsap.set(lastCard, { opacity: 0, x: 50, filter: 'blur(5px)' });
        gsap.set(arrow, { opacity: 0, scale: 0 });

        const tl = gsap.timeline();

        // 1. Title
        tl.to(compTitle, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: "power2.out" })
          
          // 2. The Beginning (Left Card)
          .to(firstCard, { 
              opacity: 1, 
              x: 0, 
              filter: 'blur(0px)', 
              duration: 1.2, 
              ease: "expo.out" 
          }, "-=0.5")

          // 3. The Journey (Arrow Pop)
          .to(arrow, { 
              opacity: 1, 
              scale: 1, 
              duration: 0.8, 
              ease: "elastic.out(1, 0.5)" 
          }, "-=0.6")

          // 4. The Now (Right Card)
          .to(lastCard, { 
              opacity: 1, 
              x: 0, 
              filter: 'blur(0px)', 
              duration: 1.2, 
              ease: "expo.out" 
          }, "-=0.4")

          // 5. Conclusion
          .to(compDesc, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: "power2.out" }, "-=0.8");
    }

    if (index === 8 && document.querySelector('#viewStat')) {
        // Slide 8: View Count Cinematic Reveal
        const viewTitle = slide.querySelector('.wrapped-title');
        const viewStat = slide.querySelector('#viewStat');
        const viewUnit = slide.querySelector('.wrapped-unit');
        const viewDesc = slide.querySelector('.wrapped-description');

        // Robust Data Fallback (0 if missing)
        const safeViewCount = wrappedData.totalViews || 0;

        // Initial State
        gsap.set([viewTitle, viewUnit, viewDesc], { opacity: 0, y: 30, filter: 'blur(10px)' });
        gsap.set(viewStat, { opacity: 0, scale: 0.5, filter: 'blur(10px)' });

        const tl = gsap.timeline();

        // 1. Title Fade
        tl.to(viewTitle, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: "power2.out" })
          
          // 2. The Big Number "Pops"
          .to(viewStat, { 
              opacity: 1, 
              scale: 1, 
              filter: 'blur(0px)', 
              duration: 1.2, 
              ease: "back.out(1.7)" 
          }, "-=0.5")

          // 3. Context follows
          .to(viewUnit, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: "power2.out" }, "-=0.8")
          .to(viewDesc, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: "power2.out" }, "-=0.6");
        
        // Trigger Counter with Safe Data
        animateCounter('#viewStat', safeViewCount);
    }
}

function animateCounter(selector, target) {
    const el = document.querySelector(selector);
    if (!el) return;

    const isFloat = target % 1 !== 0;
    const isDistance = selector === '#distanceStat';

    gsap.to(el, {
        textContent: target,
        duration: isDistance ? 3 : 2,
        ease: isDistance ? 'expo.out' : 'power2.out',
        snap: { textContent: isFloat ? 0.1 : 1 },
        onUpdate: function () {
            if (this.targets()[0]) {
                el.textContent = isFloat ? parseFloat(this.targets()[0].textContent).toFixed(1) : Math.ceil(this.targets()[0].textContent);
            }
        }
    });
}

function shareWrapped() {
    if (navigator.share) {
        navigator.share({
            title: 'My SONDER 2026',
            text: 'My year in memories.',
            url: window.location.href
        }).catch(console.error);
    } else {
        alert("Link copied!");
    }
}
