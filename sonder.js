// SONDER front-end logic (local-only, no backend)

const STORAGE_KEY = "sonderEntries:v1";
const FAVORITES_KEY = "sonderFavorites:v1";
let cachedApproxLocation = null;

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error("failed to parse entries", e);
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

async function fetchApproxLocation() {
  if (cachedApproxLocation) return cachedApproxLocation;
  try {
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok) throw new Error("bad response");
    const data = await res.json();
    const lat = Number(data.latitude);
    const lng = Number(data.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      cachedApproxLocation = {
        lat,
        lng,
        approx: true,
        label: [data.city, data.country_name].filter(Boolean).join(", "),
      };
      return cachedApproxLocation;
    }
  } catch (err) {
    console.warn("approx location lookup failed", err);
  }
  return null;
}

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveFavorites(ids) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}

function toggleFavorite(id) {
  const favs = new Set(loadFavorites());
  if (favs.has(id)) {
    favs.delete(id);
  } else {
    favs.add(id);
  }
  saveFavorites([...favs]);
}

function isFavorite(id) {
  return loadFavorites().includes(id);
}

function createEntry({ text, song, imageData, lat, lng, locationName }) {
  const entries = loadEntries();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const createdAt = new Date().toISOString();
  const entry = { id, text, song: song || "", imageData: imageData || "", lat, lng, locationName, createdAt };
  entries.push(entry);
  saveEntries(entries);
  return entry;
}

function getEntryById(id) {
  return loadEntries().find((e) => e.id === id);
}

function formatTimestamp(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function textPreview(text, max = 90) {
  if (!text) return "";
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max).trim() + "…";
}

function firstLines(text, lines = 2) {
  if (!text) return "";
  return text.split(/\r?\n/).slice(0, lines).join("\n");
}

// Theme toggle
(function initTheme() {
  const stored = localStorage.getItem("sonderTheme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initial = stored || (prefersDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", initial);

  const toggle = document.getElementById("themeToggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      const next = current === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("sonderTheme", next);
    });
  }
})();

// Page router
(function initPage() {
  const page = document.documentElement.getAttribute("data-page") || document.body.getAttribute("data-page");
  switch (page) {
    case "map":
      initMapPage();
      break;
    case "submit":
      initSubmitPage();
      break;
    case "entry":
      initEntryPage();
      break;
    case "archive":
      initArchivePage();
      break;
    case "playlist":
      initPlaylistPage();
      break;
    default:
      break;
  }
})();

// MAP PAGE
function initMapPage() {
  if (typeof L === "undefined") {
    console.error("Leaflet not loaded");
    return;
  }

  const map = L.map("map", {
    zoomControl: false,
    worldCopyJump: true,
  }).setView([20, 0], 2.3);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  L.control.zoom({ position: "bottomright" }).addTo(map);

  const previewEl = document.getElementById("entryPreview");

  const markersLayer = L.layerGroup().addTo(map);
  const entries = loadEntries();
  const mapLocateBtn = document.getElementById("mapLocateBtn");
  const mapLocationStatus = document.getElementById("mapLocationStatus");

  function markerIcon(favorite) {
    const glowColor = favorite ? "#f5d48f" : "#dcc7a1";
    const size = favorite ? 18 : 14;
    const svg = `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"><defs><radialGradient id="g" cx="30%" cy="20%" r="80%"><stop offset="0%" stop-color="${glowColor}"/><stop offset="60%" stop-color="${glowColor}" stop-opacity="0.9"/><stop offset="100%" stop-color="${glowColor}" stop-opacity="0"/></radialGradient></defs><circle cx="12" cy="12" r="7" fill="url(#g)"/><circle cx="12" cy="12" r="3.2" fill="#1f1e1c" fill-opacity="0.8"/></svg>`;
    return L.icon({
      iconUrl: "data:image/svg+xml;base64," + btoa(svg),
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  function renderMarkers() {
    markersLayer.clearLayers();
    const favs = new Set(loadFavorites());
    const allEntries = loadEntries();

    allEntries.forEach((entry) => {
      if (typeof entry.lat !== "number" || typeof entry.lng !== "number") return;
      const favorite = favs.has(entry.id);
      const marker = L.marker([entry.lat, entry.lng], {
        icon: markerIcon(favorite),
        opacity: 0.92,
      }).addTo(markersLayer);

      marker.on("mouseover", (e) => {
        if (!previewEl) return;
        previewEl.textContent = firstLines(entry.text, 2);
        previewEl.hidden = false;
        const { x, y } = e.originalEvent;
        previewEl.style.left = x + 12 + "px";
        previewEl.style.top = y - 4 + "px";
      });

      marker.on("mouseout", () => {
        if (!previewEl) return;
        previewEl.hidden = true;
      });

      marker.on("click", () => {
        window.location.href = `entry.html?id=${encodeURIComponent(entry.id)}`;
      });
    });
  }


  const mapEntryModal = document.getElementById("mapEntryModal");
  const mapEntryModalClose = document.getElementById("mapEntryModalClose");
  const mapEntryForm = document.getElementById("mapEntryForm");
  const mapEntryLat = document.getElementById("mapEntryLat");
  const mapEntryLng = document.getElementById("mapEntryLng");
  const mapAddEntryBtn = document.getElementById("mapAddEntryBtn");
  const mapMyEntriesBtn = document.getElementById("mapMyEntriesBtn");
  const mapEntryError = document.getElementById("mapEntryError");

  let userLatLng = null;
  let userLocationLabel = "";
  let locatingUser = false;
  let userMarker = null;

  function setLocationStatus(message, isError = false) {
    if (!mapLocationStatus) return;
    mapLocationStatus.textContent = message;
    mapLocationStatus.dataset.error = isError ? "true" : "false";
  }

  function ensureUserMarker(latlng) {
    if (!map || !latlng) return;
    if (userMarker) {
      userMarker.setLatLng(latlng);
    } else {
      userMarker = L.circleMarker(latlng, {
        radius: 9,
        color: "#f5d48f",
        fillColor: "#f5d48f",
        fillOpacity: 0.6,
        weight: 2,
      }).addTo(map);
    }
  }

  async function applyApproxLocation(statusMessage) {
    setLocationStatus(statusMessage || "grabbing an approximate location…");
    const approx = await fetchApproxLocation();
    locatingUser = false;
    if (mapLocateBtn) {
      mapLocateBtn.disabled = false;
      mapLocateBtn.textContent = "refresh location";
    }
    if (approx) {
      userLatLng = { lat: approx.lat, lng: approx.lng };
      userLocationLabel = approx.label || "";
      setLocationStatus(
        approx.label ? `using an approximate fix near ${approx.label}.` : "using an approximate location."
      );
      ensureUserMarker(userLatLng);
      map.setView([userLatLng.lat, userLatLng.lng], 6);
      if (mapEntryLat && mapEntryLng) {
        mapEntryLat.value = userLatLng.lat;
        mapEntryLng.value = userLatLng.lng;
      }
      if (mapAddEntryBtn) {
        mapAddEntryBtn.disabled = false;
      }
      return true;
    }
    setLocationStatus("no location available. allow permissions or check connection.", true);
    return false;
  }

  async function requestUserLocation(force = false) {
    if (!navigator.geolocation) {
      await applyApproxLocation("this browser blocks gps. guessing based on network…");
      return;
    }

    if (locatingUser && !force) return;
    locatingUser = true;
    setLocationStatus("trying to find you…");

    if (mapLocateBtn) {
      mapLocateBtn.disabled = true;
      mapLocateBtn.textContent = "locating…";
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        locatingUser = false;
        userLatLng = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        userLocationLabel = "";
        setLocationStatus("locked onto your current spot.");
        if (mapLocateBtn) {
          mapLocateBtn.disabled = false;
          mapLocateBtn.textContent = "refresh location";
        }
        ensureUserMarker(userLatLng);
        map.setView([userLatLng.lat, userLatLng.lng], 8);
        if (mapEntryLat && mapEntryLng) {
          mapEntryLat.value = userLatLng.lat;
          mapEntryLng.value = userLatLng.lng;
        }
        if (mapAddEntryBtn) {
          mapAddEntryBtn.disabled = false;
        }
      },
      async () => {
        await applyApproxLocation("we couldn’t access gps. guessing based on network…");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function showMapEntryError(message) {
    if (!mapEntryError) return;
    if (!message) {
      mapEntryError.hidden = true;
      mapEntryError.textContent = "";
    } else {
      mapEntryError.hidden = false;
      mapEntryError.textContent = message;
    }
  }

  function openMapModal() {
    if (!mapEntryModal) return;
    if (!userLatLng) {
      setLocationStatus("we still need your current location before you can add an entry.", true);
      requestUserLocation(true);
      return;
    }
    if (mapEntryLat && mapEntryLng) {
      mapEntryLat.value = userLatLng.lat;
      mapEntryLng.value = userLatLng.lng;
    }
    showMapEntryError("");
    mapEntryModal.hidden = false;
    mapEntryModal.style.display = "flex";
  }

  if (mapAddEntryBtn) {
    mapAddEntryBtn.addEventListener("click", () => {
      openMapModal();
    });
  }

  if (mapLocateBtn) {
    mapLocateBtn.addEventListener("click", () => requestUserLocation(true));
  }

  if (mapMyEntriesBtn) {
    mapMyEntriesBtn.addEventListener("click", () => {
      window.location.href = "archive.html";
    });
  }

  if (mapEntryModalClose && mapEntryModal) {
    mapEntryModalClose.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      mapEntryModal.hidden = true;
      mapEntryModal.style.display = "none";
    });
    mapEntryModal.addEventListener("click", (e) => {
      if (e.target === mapEntryModal) {
        mapEntryModal.hidden = true;
        mapEntryModal.style.display = "none";
      }
    });
  }

  if (mapEntryForm) {
    mapEntryForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const textEl = document.getElementById("mapEntryText");
      const songEl = document.getElementById("mapEntrySong");
      if (!textEl || !songEl) return;
      const text = textEl.value.trim();
      if (!text) return;
      if (!userLatLng) {
        showMapEntryError("we still need your current location before adding this.");
        requestUserLocation(true);
        return;
      }
      const song = songEl.value.trim();
      const lat = userLatLng.lat;
      const lng = userLatLng.lng;

      const newEntry = createEntry({
        text,
        song,
        imageData: "",
        lat,
        lng,
        locationName: userLocationLabel,
      });
      showMapEntryError("");
      if (mapEntryModal) {
        mapEntryModal.hidden = true;
        mapEntryModal.style.display = "none";
      }
      if (textEl) textEl.value = "";
      if (songEl) songEl.value = "";
      if (mapEntryLat && mapEntryLng) {
        mapEntryLat.value = lat;
        mapEntryLng.value = lng;
      }
      renderMarkers();
      map.setView([lat, lng], 8);
      setTimeout(() => {
        map.invalidateSize();
        map.setView([lat, lng], 8);
      }, 150);
    });
  }

  requestUserLocation();
  renderMarkers();
}

// SUBMIT PAGE
function initSubmitPage() {
  const form = document.getElementById("submitEntryForm");
  const detectBtn = document.getElementById("submitDetectLocation");
  const hint = document.getElementById("submitLocationHint");

  let detectedLatLng = null;
  let detectedLocationLabel = "";
  let locating = false;

  function setSubmitHint(message, isError = false) {
    if (!hint) return;
    hint.textContent = message;
    hint.dataset.error = isError ? "true" : "false";
  }

  async function applySubmitApprox(message) {
    setSubmitHint(message || "grabbing an approximate location…");
    const approx = await fetchApproxLocation();
    locating = false;
    if (detectBtn) {
      detectBtn.disabled = false;
      detectBtn.textContent = "refresh location";
    }
    if (approx) {
      detectedLatLng = { lat: approx.lat, lng: approx.lng };
      detectedLocationLabel = approx.label || "";
      setSubmitHint(
        approx.label ? `using an approximate fix near ${approx.label}.` : "using an approximate location."
      );
      return true;
    }
    setSubmitHint("no location available. allow permissions or check connection.", true);
    return false;
  }

  function requestSubmitLocation(force = false) {
    if (!navigator.geolocation) {
      applySubmitApprox("this browser blocks gps. guessing based on network…");
      return;
    }
    if (locating && !force) return;
    locating = true;
    setSubmitHint("trying to find you…");
    if (detectBtn) {
      detectBtn.disabled = true;
      detectBtn.textContent = "locating…";
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        locating = false;
        detectedLatLng = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        detectedLocationLabel = "";
        setSubmitHint("locked onto your current spot.");
        if (detectBtn) {
          detectBtn.disabled = false;
          detectBtn.textContent = "refresh location";
        }
      },
      () => {
        applySubmitApprox("we couldn’t access gps. guessing based on network…");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  if (detectBtn) {
    detectBtn.addEventListener("click", () => requestSubmitLocation(true));
  }

  requestSubmitLocation();

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const textEl = document.getElementById("submitEntryText");
      const songEl = document.getElementById("submitEntrySong");
      const imageEl = document.getElementById("submitEntryImage");
      if (!textEl || !songEl || !imageEl) return;

      const text = textEl.value.trim();
      if (!text) return;

      const song = songEl.value.trim();
      if (!detectedLatLng) {
        setSubmitHint("we still need your current location before submitting.", true);
        requestSubmitLocation(true);
        return;
      }

      let imageData = "";
      if (imageEl.files && imageEl.files[0]) {
        imageData = await fileToDataUrl(imageEl.files[0]).catch(() => "");
      }

      const lat = detectedLatLng.lat;
      const lng = detectedLatLng.lng;

      const entry = createEntry({
        text,
        song,
        imageData,
        lat,
        lng,
        locationName: detectedLocationLabel,
      });

      textEl.value = "";
      songEl.value = "";
      imageEl.value = "";
      setSubmitHint("saved locally. redirecting to map…");

      setTimeout(() => {
        if (entry.lat != null && entry.lng != null) {
          window.location.href = `map.html#focus=${entry.id}`;
        } else {
          window.location.href = "map.html";
        }
      }, 700);
    });
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ENTRY PAGE
function initEntryPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const card = document.getElementById("singleEntryCard");
  if (!id || !card) return;

  const entry = getEntryById(id);
  if (!entry) {
    card.querySelector(".entry-view__text").textContent = "this entry couldn’t be found in this browser.";
    return;
  }

  const locEl = document.getElementById("singleEntryLocation");
  const tsEl = document.getElementById("singleEntryTimestamp");
  const textEl = document.getElementById("singleEntryText");
  const linksEl = document.getElementById("singleEntryLinks");
  const backBtn = document.getElementById("singleEntryBack");
  const favBtn = document.getElementById("singleEntryFavorite");
  const shareBtn = document.getElementById("singleEntryShare");

  locEl.textContent = entry.locationName || "somewhere on earth";
  tsEl.textContent = formatTimestamp(entry.createdAt);
  textEl.textContent = entry.text;

  linksEl.innerHTML = "";
  if (entry.song) {
    const anchor = document.createElement("a");
    anchor.href = entry.song;
    anchor.target = "_blank";
    anchor.rel = "noopener";
    anchor.textContent = "open song in a new tab";
    linksEl.appendChild(anchor);
  }
  if (entry.imageData) {
    const img = document.createElement("img");
    img.src = entry.imageData;
    img.alt = "user-supplied";
    img.style.maxWidth = "100%";
    img.style.borderRadius = "12px";
    img.style.marginTop = "0.8rem";
    linksEl.appendChild(img);
  }

  function refreshFavLabel() {
    favBtn.textContent = isFavorite(entry.id) ? "♥ favorited" : "♡ favorite";
  }
  refreshFavLabel();

  backBtn.addEventListener("click", () => {
    window.location.href = "map.html";
  });

  favBtn.addEventListener("click", () => {
    toggleFavorite(entry.id);
    refreshFavLabel();
  });

  if (navigator.share && shareBtn) {
    shareBtn.addEventListener("click", () => {
      navigator.share({
        title: "SONDER entry",
        text: textPreview(entry.text, 120),
        url: window.location.href,
      }).catch(() => {});
    });
  } else if (shareBtn) {
    shareBtn.addEventListener("click", () => {
      navigator.clipboard?.writeText(window.location.href).catch(() => {});
      shareBtn.textContent = "link copied";
      setTimeout(() => (shareBtn.textContent = "share"), 1200);
    });
  }
}

// ARCHIVE PAGE
function initArchivePage() {
  const grid = document.getElementById("archiveGrid");
  const sortSelect = document.getElementById("archiveSort");
  if (!grid || !sortSelect) return;

  function render() {
    let entries = loadEntries();
    const favs = new Set(loadFavorites());
    const mode = sortSelect.value;

    entries.forEach((e) => (e._favorite = favs.has(e.id)));

    if (mode === "newest") {
      entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (mode === "location") {
      entries.sort((a, b) => (a.locationName || "").localeCompare(b.locationName || ""));
    } else if (mode === "favorite") {
      entries = entries.filter((e) => e._favorite);
    }

    grid.innerHTML = "";
    if (!entries.length) {
      const empty = document.createElement("p");
      empty.textContent = "no entries yet in this browser.";
      empty.style.color = "var(--color-muted)";
      grid.appendChild(empty);
      return;
    }

    entries.forEach((entry) => {
      const card = document.createElement("article");
      card.className = "archive-card";
      card.addEventListener("click", () => {
        window.location.href = `entry.html?id=${encodeURIComponent(entry.id)}`;
      });

      const loc = document.createElement("div");
      loc.className = "archive-card__location";
      loc.textContent = entry.locationName || "somewhere";

      const preview = document.createElement("div");
      preview.className = "archive-card__preview";
      preview.textContent = firstLines(entry.text, 3);

      const meta = document.createElement("div");
      meta.className = "archive-card__meta";
      const time = document.createElement("span");
      time.textContent = formatTimestamp(entry.createdAt);
      const fav = document.createElement("span");
      fav.textContent = entry._favorite ? "♥" : "";
      meta.append(time, fav);

      card.append(loc, preview, meta);
      grid.appendChild(card);
    });
  }

  sortSelect.addEventListener("change", render);
  render();
}

// PLAYLIST PAGE
function initPlaylistPage() {
  const listEl = document.getElementById("playlistList");
  if (!listEl) return;
  const entries = loadEntries().filter((e) => e.song);

  if (!entries.length) {
    const p = document.createElement("p");
    p.textContent = "no songs yet. add one when you leave an entry.";
    p.style.color = "var(--color-muted)";
    listEl.appendChild(p);
    return;
  }

  entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  entries.forEach((entry) => {
    const item = document.createElement("article");
    item.className = "playlist-item";

    const song = document.createElement("div");
    song.className = "playlist-item__song";
    song.textContent = entry.song;

    const loc = document.createElement("div");
    loc.className = "playlist-item__location";
    loc.textContent = entry.locationName || "somewhere on earth";

    const note = document.createElement("div");
    note.className = "playlist-item__note";
    note.textContent = textPreview(entry.text, 120);

    item.append(song, loc, note);
    item.addEventListener("click", () => {
      window.open(entry.song, "_blank", "noopener");
    });

    listEl.appendChild(item);
  });
}
